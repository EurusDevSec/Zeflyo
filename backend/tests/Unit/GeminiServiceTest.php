<?php

namespace Tests\Unit;

use App\Services\GeminiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class GeminiServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_generate_reply_returns_text_when_api_successful(): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                ['text' => 'Xin chào, đây là trả lời tự động.'],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        config(['services.gemini.key' => 'test_key']);

        $service = new GeminiService();
        $reply = $service->generateReply('Tôi cần hỗ trợ mua áo', 'Bạn là trợ lý AI của cửa hàng thời trang.');

        $this->assertSame('Xin chào, đây là trả lời tự động.', $reply);
    }

    public function test_generate_reply_returns_null_when_api_fails(): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response(['error' => 'invalid key'], 401),
        ]);

        config(['services.gemini.key' => 'invalid_key']);

        $service = new GeminiService();
        $reply = $service->generateReply('Xin chào', 'Prompt');

        $this->assertNull($reply);
    }

    public function test_generate_reply_returns_null_when_key_missing(): void
    {
        config(['services.gemini.key' => null]);

        Log::shouldReceive('warning')->once();

        $service = new GeminiService();
        $reply = $service->generateReply('Hello', 'Prompt');

        $this->assertNull($reply);
    }
}
