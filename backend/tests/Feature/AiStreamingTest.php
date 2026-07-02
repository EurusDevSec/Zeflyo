<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\GeminiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class AiStreamingTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_stream_requires_authentication(): void
    {
        $response = $this->postJson('/api/posts/generate-ai-stream', [
            'topic' => 'Test topic',
            'goal' => 'Test goal',
            'framework' => 'aida',
        ]);

        $response->assertStatus(401);
    }

    public function test_stream_validation_errors(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/posts/generate-ai-stream', [
                // missing fields
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['topic', 'goal', 'framework']);
    }

    public function test_stream_validation_invalid_framework(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/posts/generate-ai-stream', [
                'topic' => 'Test topic',
                'goal' => 'Test goal',
                'framework' => 'invalid_framework_name',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['framework']);
    }

    public function test_stream_returns_sse_headers_and_content(): void
    {
        $user = User::factory()->create();

        $mock = Mockery::mock(GeminiService::class);
        $mock->shouldReceive('generateReplyStream')
            ->once()
            ->andReturnUsing(function ($messages, $onChunk) {
                $onChunk('Hello');
                $onChunk(' world!');
            });

        $this->app->instance(GeminiService::class, $mock);

        $response = $this->actingAs($user)
            ->postJson('/api/posts/generate-ai-stream', [
                'topic' => 'Write a post',
                'goal' => 'Get engagement',
                'framework' => 'aida',
                'tone' => 'Professional',
                'post_length' => 'short',
            ]);

        $response->assertStatus(200);
        $this->assertStringStartsWith('text/event-stream', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('no-cache', $response->headers->get('Cache-Control'));

        $content = $response->streamedContent();

        $this->assertStringContainsString('data: {"chunk":"Hello"}', $content);
        $this->assertStringContainsString('data: {"chunk":" world!"}', $content);
        $this->assertStringContainsString('event: end', $content);
        $this->assertStringContainsString('data: {"status":"completed"}', $content);
    }

    public function test_stream_rate_limiting(): void
    {
        $user = User::factory()->create();

        $mock = Mockery::mock(GeminiService::class);
        $mock->shouldReceive('generateReplyStream')
            ->zeroOrMoreTimes()
            ->andReturnUsing(function ($messages, $onChunk) {
                $onChunk('test');
            });
        $this->app->instance(GeminiService::class, $mock);

        // Send 5 requests (throttle limit is 5 per minute)
        for ($i = 0; $i < 5; $i++) {
            $response = $this->actingAs($user)
                ->postJson('/api/posts/generate-ai-stream', [
                    'topic' => 'Write a post',
                    'goal' => 'Engagement',
                    'framework' => 'pas',
                ]);
            $response->assertStatus(200);
        }

        // The 6th request should fail with 429 Too Many Requests
        $response = $this->actingAs($user)
            ->postJson('/api/posts/generate-ai-stream', [
                'topic' => 'Write a post',
                'goal' => 'Engagement',
                'framework' => 'pas',
            ]);

        $response->assertStatus(429);
    }
}
