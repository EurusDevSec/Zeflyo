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
            print('API Empty');
            return null;
        }

        $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/{$this->model}:generateContent";

        try {
            $response = Http::post("{$endpoint}?key={$this->apiKey}", [
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
                    'maxOutputTokens' => 256,
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
            $text = $payload['candidates'][0]['content'][0]['text'] ?? null;

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
}
