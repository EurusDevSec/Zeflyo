<?php

namespace Tests\Feature;

use App\Jobs\ProcessFacebookWebhookJob;
use App\Models\AutoReplyRule;
use App\Models\Customer;
use App\Models\Fanpage;
use App\Models\Interaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AutoReplyTest extends TestCase
{
    use RefreshDatabase;
    public function test_keyword_rule_triggers_static_reply(): void
    {
        Http::fake();

        $user = User::factory()->create();
        $fanpage = Fanpage::create(['user_id' => $user->id, 'fb_page_id' => '123', 'name' => 'Test Page', 'access_token' => 'mock_page_token_123', 'is_active' => true]);
        $customer = Customer::create(['fanpage_id' => $fanpage->id, 'fb_customer_id' => '321', 'ai_active' => false, 'name' => 'Test User']);

        AutoReplyRule::create([
            'fanpage_id' => $fanpage->id,
            'keyword' => 'giá',
            'reply_content' => 'Sản phẩm này có giá tốt nhé!',
            'is_active' => true,
        ]);

        $payload = [
            'object' => 'page',
            'entry' => [
                [
                    'id' => '123',
                    'messaging' => [
                        [
                            'sender' => ['id' => '321'],
                            'recipient' => ['id' => '123'],
                            'message' => ['mid' => 'm.1', 'text' => 'Cho mình biết giá sản phẩm này'],
                        ],
                    ],
                ],
            ],
        ];

        $job = new ProcessFacebookWebhookJob($payload);
        $job->handle();

        $this->assertDatabaseHas('interactions', [
            'customer_id' => $customer->id,
            'fanpage_id' => $fanpage->id,
            'content' => 'Sản phẩm này có giá tốt nhé!',
            'is_from_customer' => false,
        ]);
    }

    public function test_ai_reply_invoked_when_no_keyword_and_ai_enabled(): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [[
                    'content' => [['text' => 'Đây là câu trả lời AI.']],
                ]],
            ], 200),
            'https://graph.facebook.com/*' => Http::response(['recipient_id' => '321'], 200),
        ]);

        config(['services.gemini.key' => 'test_key']);

        $user = User::factory()->create();
        $fanpage = Fanpage::create(['user_id' => $user->id, 'fb_page_id' => '123', 'name' => 'Test Page', 'access_token' => 'mock_page_token_123', 'is_active' => true]);
        $customer = Customer::create(['fanpage_id' => $fanpage->id, 'fb_customer_id' => '321', 'ai_active' => true, 'name' => 'Test User']);

        $payload = [
            'object' => 'page',
            'entry' => [
                [
                    'id' => '123',
                    'messaging' => [
                        [
                            'sender' => ['id' => '321'],
                            'recipient' => ['id' => '123'],
                            'message' => ['mid' => 'm.2', 'text' => 'Shop có áo khoác không?'],
                        ],
                    ],
                ],
            ],
        ];

        $job = new ProcessFacebookWebhookJob($payload);
        $job->handle();

        $this->assertDatabaseHas('interactions', [
            'customer_id' => $customer->id,
            'fanpage_id' => $fanpage->id,
            'content' => 'Đây là câu trả lời AI.',
            'is_from_customer' => false,
        ]);
    }
}
