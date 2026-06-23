<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    //Should set $apiKey accept null for test case $apiKey = null
    protected ?string $apiKey;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key');
        $this->model = config('services.gemini.model', 'gemini-1.5-flash');
    }

    public function generateReply(string $customerMessage, string $systemPrompt): ?string
    {
        if (empty($this->apiKey)) {
            Log::warning('GeminiService cannot generate reply because GEMINI_API_KEY is not configured.');
            return null;
        }

        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent";

        try {
            $response = Http::timeout(120)->post("{$endpoint}?key={$this->apiKey}", [
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
            ]);

            if (!$response->successful()) {
                Log::error('GeminiService API call failed.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return null;
            }

            $payload = $response->json();
            $text = $payload['candidates'][0]['content']['parts'][0]['text'] ?? null;

            if (!is_string($text) || trim($text) === '') {
                Log::warning('GeminiService returned empty response.', ['payload' => $payload]);
                return null;
            }

            return trim($text);
        } catch (\Exception $e) {
            Log::error('GeminiService exception during API call.', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return null;
        }
    }

    /**
     * Generate a list of N topics from a user prompt.
     * Returns an array of topic title strings, or null on failure.
     */
    public function generateTopicsList(string $prompt, int $count = 30, string $language = 'vi'): ?array
    {
        if (empty($this->apiKey)) {
            Log::warning('GeminiService: GEMINI_API_KEY is not configured.');
            return null;
        }

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
        if (empty($this->apiKey)) {
            return null;
        }

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
        if (empty($this->apiKey)) {
            return null;
        }

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
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent";

        try {
            $response = Http::timeout(120)->post("{$endpoint}?key={$this->apiKey}", [
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
            ]);

            if (!$response->successful()) {
                Log::error('GeminiService text call failed.', ['status' => $response->status(), 'body' => $response->body()]);
                return null;
            }

            $text = $response->json('candidates.0.content.parts.0.text');
            return is_string($text) && trim($text) !== '' ? trim($text) : null;
        } catch (\Exception $e) {
            Log::error('GeminiService text exception.', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Internal: Call Gemini API expecting a JSON array response.
     */
    private function callGeminiJson(string $prompt): ?array
    {
        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent";

        try {
            $response = Http::timeout(120)->post("{$endpoint}?key={$this->apiKey}", [
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
            ]);

            if (!$response->successful()) {
                Log::error('GeminiService JSON call failed.', ['status' => $response->status(), 'body' => $response->body()]);
                return null;
            }

            $text = $response->json('candidates.0.content.parts.0.text');

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
        } catch (\Exception $e) {
            Log::error('GeminiService JSON exception.', ['error' => $e->getMessage()]);
            return null;
        }
    }
}
