<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class GeminiService
{
    protected array $apiKeys = [];
    protected string $model;

    public function __construct()
    {
        $rawKeys = config('services.gemini.key');
        if (!empty($rawKeys)) {
            // Support comma-separated list of API keys for rotation
            $this->apiKeys = array_filter(array_map('trim', explode(',', $rawKeys)));
        }
        $this->model = config('services.gemini.model', 'gemini-1.5-flash');
    }

    /**
     * Internal: Call Gemini API using a round-robin failover rotation algorithm.
     */
    private function makeApiCallWithRotation(array $payload): ?array
    {
        if (empty($this->apiKeys)) {
            Log::warning('GeminiService: No API keys configured.');
            return null;
        }

        $keyCount = count($this->apiKeys);
        $startIndex = (int) Cache::get('gemini_api_key_index', 0);
        
        // Prevent index out of bounds if config list changed dynamically
        if ($startIndex >= $keyCount) {
            $startIndex = 0;
        }

        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent";

        for ($i = 0; $i < $keyCount; $i++) {
            $currentIndex = ($startIndex + $i) % $keyCount;
            $currentKey = $this->apiKeys[$currentIndex];

            try {
                $response = Http::timeout(120)->post("{$endpoint}?key={$currentKey}", $payload);

                // 429 (Rate Limit) and 503 (High Demand/Overloaded) are temporary, rotate immediately
                if ($response->status() === 429 || $response->status() === 503) {
                    Log::warning("GeminiService: Key at index {$currentIndex} returned temporary code {$response->status()}. Rotating key...", [
                        'body' => $response->body()
                    ]);
                    continue;
                }

                if (!$response->successful()) {
                    Log::error("GeminiService: API Key at index {$currentIndex} call failed with status {$response->status()}.", [
                        'body' => $response->body(),
                    ]);
                    continue;
                }

                $data = $response->json();
                if (empty($data)) {
                    Log::warning("GeminiService: Empty JSON response with key index {$currentIndex}.");
                    continue;
                }

                // Balance load: update index for next call to round-robin
                $nextIndex = ($currentIndex + 1) % $keyCount;
                Cache::put('gemini_api_key_index', $nextIndex);

                return $data;

            } catch (\Exception $e) {
                Log::error("GeminiService: Exception with key at index {$currentIndex}: " . $e->getMessage());
                continue;
            }
        }

        Log::error('GeminiService: All configured API keys failed to return a response.');
        return null;
    }

    /**
     * Generate customer response chat helper.
     */
    public function generateReply(string $customerMessage, string $systemPrompt): ?string
    {
        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => trim($systemPrompt) . "\n\nKhách hàng: " . trim($customerMessage)]
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => 2048,
                'topP' => 0.95,
            ],
        ];

        $result = $this->makeApiCallWithRotation($payload);
        if ($result === null) {
            return null;
        }

        $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? null;
        return is_string($text) && trim($text) !== '' ? trim($text) : null;
    }

    /**
     * Generate a list of N topics from a user prompt.
     * Returns an array of topic title strings, or null on failure.
     */
    public function generateTopicsList(string $prompt, int $count = 30, string $language = 'vi'): ?array
    {
        $langName = $language === 'vi' ? 'tiếng Việt' : 'English';

        $systemPrompt = "Bạn là chuyên gia lên ý tưởng nội dung cho Facebook Fanpage.\n"
            . "Nhiệm vụ: Tạo ra một danh sách CHÍNH XÁC {$count} chủ đề bài viết Facebook dựa trên yêu cầu sau.\n"
            . "Yêu cầu: {$prompt}\n\n"
            . "QUY TẮC BẮT BUỘC:\n"
            . "1. Trả về ĐÚNG {$count} chủ đề.\n"
            . "2. Mỗi chủ đề là 1 câu ngắn gọn (dưới 100 ký tự) mô tả ý tưởng bài viết.\n"
            . "3. Ngôn ngữ: {$langName}.\n"
            . "4. Trả về kết quả ĐÚng định dạng JSON array, ví dụ: [\"Chủ đề 1\", \"Chủ đề 2\", ...]\n"
            . "5. KHÔNG thêm bất kỳ văn bản giải thích nào trước hoặc sau JSON array.\n"
            . "6. KHÔNG đánh số thứ tự trong nội dung chủ đề.";

        return $this->callGeminiJson($systemPrompt);
    }

    /**
     * Generate a Facebook post from a topic title using campaign config.
     */
    public function generatePostFromTopic(string $topic, array $config): ?string
    {
        $lengthMap = [
            'super_short' => 'cực ngắn (2-3 câu, dưới 50 từ)',
            'short' => 'ngắn (1 đoạn, khoảng 50-100 từ)',
            'medium' => 'trung bình (2-3 đoạn, khoảng 100-200 từ)',
            'full' => 'đầy đủ (3-5 đoạn, khoảng 200-400 từ)',
            'detailed' => 'chi tiết (5+ đoạn, trên 400 từ)',
        ];

        $styleMap = [
            'professional' => 'chuyên nghiệp, uy tín',
            'humorous' => 'hài hước, vui nhộn',
            'creative' => 'sáng tạo, phá cách',
            'emotional' => 'cảm xúc, đồng cảm',
            'storytelling' => 'kể chuyện, mạch lạc',
            'advertising' => 'quảng cáo, thuyết phục mua hàng',
            'inspirational' => 'truyền cảm hứng, động lực',
        ];

        $language = $config['language'] ?? 'vi';
        $langName = $language === 'vi' ? 'tiếng Việt' : 'English';
        $length = $lengthMap[$config['post_length'] ?? 'medium'] ?? $lengthMap['medium'];
        $style = $styleMap[$config['writing_style'] ?? 'professional'] ?? $config['writing_style'];

        $systemPrompt = "Bạn là chuyên gia marketing viết bài quảng cáo Facebook chuyên nghiệp.\n"
            . "Nhiệm vụ: Viết MỘT bài đăng Facebook hấp dẫn dựa trên chủ đề: \"{$topic}\"\n\n"
            . "YÊU CẦU BẮT BUỘC:\n"
            . "1. Ngôn ngữ: {$langName}\n"
            . "2. Độ dài: {$length}\n"
            . "3. Phong cách viết: {$style}\n"
            . "4. Sử dụng emoji phù hợp để bài viết sinh động.\n"
            . "5. Kết thúc bằng CTA (lời kêu gọi hành động) và hashtag liên quan.\n"
            . "6. Bố cục rõ ràng, phân chia đoạn mạch lạc.\n";

        if (!empty($config['custom_prompt'])) {
            $systemPrompt .= "7. Yêu cầu bổ sung từ người dùng: {$config['custom_prompt']}\n";
        }

        if (!empty($config['include_contact']) && !empty($config['contact_info'])) {
            $systemPrompt .= "8. Thêm thông tin liên hệ ở cuối bài: {$config['contact_info']}\n";
        }

        $systemPrompt .= "\nHãy CHỈ trả về nội dung bài đăng Facebook. Không thêm giải thích hay chào hỏi.";

        return $this->callGeminiText($topic, $systemPrompt);
    }

    /**
     * Generate a Facebook post from product information.
     */
    public function generatePostFromProduct(array $productInfo, array $config): ?string
    {
        $productName = $productInfo['name'] ?? 'Sản phẩm';
        $productDesc = $productInfo['description'] ?? '';

        $topic = "Viết bài giới thiệu sản phẩm: {$productName}";
        if ($productDesc) {
            $topic .= "\nThông tin sản phẩm: {$productDesc}";
        }

        return $this->generatePostFromTopic($topic, $config);
    }

    /**
     * Internal: Call Gemini API and return text response.
     */
    private function callGeminiText(string $userMessage, string $systemPrompt): ?string
    {
        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [
                        ['text' => trim($systemPrompt) . "\n\n" . trim($userMessage)]
                    ],
                ],
            ],
            'generationConfig' => [
                'temperature' => 0.8,
                'maxOutputTokens' => 4096,
                'topP' => 0.95,
            ],
        ];

        $result = $this->makeApiCallWithRotation($payload);
        if ($result === null) {
            return null;
        }

        $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? null;
        return is_string($text) && trim($text) !== '' ? trim($text) : null;
    }

    /**
     * Internal: Call Gemini API expecting a JSON array response.
     */
    private function callGeminiJson(string $prompt): ?array
    {
        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [['text' => $prompt]],
                ],
            ],
            'generationConfig' => [
                'temperature' => 0.7,
                'maxOutputTokens' => 4096,
                'topP' => 0.95,
                'responseMimeType' => 'application/json',
            ],
        ];

        $result = $this->makeApiCallWithRotation($payload);
        if ($result === null) {
            return null;
        }

        $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? null;
        if (!is_string($text)) {
            return null;
        }

        // Clean potential markdown code fences
        $text = trim($text);
        $text = preg_replace('/^```(?:json)?\s*/i', '', $text);
        $text = preg_replace('/\s*```$/i', '', $text);

        $decoded = json_decode($text, true);
        if (!is_array($decoded)) {
            Log::warning('GeminiService JSON parse failed.', ['raw' => $text]);
            return null;
        }

        return $decoded;
    }
}
