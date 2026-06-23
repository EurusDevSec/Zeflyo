<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Fanpage;
use App\Models\ScheduledPost;
use App\Models\AutoReplyRule;
use App\Models\Customer;
use App\Models\Interaction;
use App\Jobs\ProcessFacebookWebhookJob;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Artisan;
use Carbon\Carbon;

class AutomationTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Fanpage $fanpage;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Test User',
            'email' => 'test@zeflyo.io',
            'password' => bcrypt('password')
        ]);

        $this->fanpage = Fanpage::create([
            'user_id' => $this->user->id,
            'fb_page_id' => '1234567890',
            'name' => 'Test Fanpage',
            'access_token' => 'mock_page_token_123',
            'is_active' => true
        ]);
    }

    /**
     * Test scheduled posts can be published via artisan command.
     */
    public function test_scheduled_post_is_published(): void
    {
        Http::fake([
            'graph.facebook.com/*' => Http::response(['id' => 'fb_post_999'], 200)
        ]);

        // Create a pending scheduled post in the past
        $post = ScheduledPost::create([
            'user_id' => $this->user->id,
            'fanpage_ids' => [$this->fanpage->id],
            'content' => 'Hello this is a scheduled post!',
            'image_url' => null,
            'scheduled_at' => Carbon::now()->subMinute(),
            'status' => 'pending'
        ]);

        // Run the command
        Artisan::call('posts:publish');

        // Check if status updated
        $post->refresh();
        $this->assertEquals('published', $post->status);
        $this->assertNull($post->error_log);
    }

    /**
     * Test webhook message triggers auto-reply keyword matching.
     */
    public function test_auto_reply_rule_is_triggered(): void
    {
        Http::fake([
            'graph.facebook.com/*' => Http::response(['success' => true], 200)
        ]);

        // Create an active auto-reply rule
        $rule = AutoReplyRule::create([
            'fanpage_id' => $this->fanpage->id,
            'keyword' => 'price',
            'reply_content' => 'The price of the item is $10.',
            'is_active' => true
        ]);

        // Create customer
        $customer = Customer::create([
            'fanpage_id' => $this->fanpage->id,
            'fb_customer_id' => 'customer_psid_123',
            'name' => 'John Doe'
        ]);

        // Mock Webhook Payload for Messenger message
        $payload = [
            'object' => 'page',
            'entry' => [
                [
                    'id' => '1234567890',
                    'messaging' => [
                        [
                            'sender' => ['id' => 'customer_psid_123'],
                            'recipient' => ['id' => '1234567890'],
                            'message' => [
                                'mid' => 'mid.12345',
                                'text' => 'What is the price of this product?'
                            ]
                        ]
                    ]
                ]
            ]
        ];

        // Process webhook job directly
        $job = new ProcessFacebookWebhookJob($payload);
        $job->handle();

        // Verify outgoing auto-reply interaction is stored in DB
        $replyInteraction = Interaction::where('customer_id', $customer->id)
            ->where('is_from_customer', false)
            ->where('content', 'The price of the item is $10.')
            ->first();

        $this->assertNotNull($replyInteraction);
        $this->assertEquals('message', $replyInteraction->type);
    }

    /**
     * Test AI content generation endpoint.
     */
    public function test_generate_ai_post_content_returns_success(): void
    {
        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                ['text' => 'Đây là bài viết mẫu tạo từ AI.'],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        config(['services.gemini.key' => 'test_key']);

        $response = $this->actingAs($this->user)
            ->postJson('/api/posts/generate-ai', [
                'topic' => 'Váy hoa mùa hè',
                'tone' => 'Thân thiện'
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'content' => 'Đây là bài viết mẫu tạo từ AI.'
            ]);
    }

    /**
     * Test AI content generation endpoint validation.
     */
    public function test_generate_ai_post_content_validation_error(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/posts/generate-ai', [
                // 'topic' is missing
                'tone' => 'Thân thiện'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['topic']);
    }
}
