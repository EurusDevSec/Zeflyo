<?php

namespace App\Http\Controllers {
    class ConnectionMockState
    {
        public static bool $shouldAbort = false;

        public static int $calledCount = 0;
    }

    // Override connection_aborted to simulate abort in testing
    if (! function_exists('App\Http\Controllers\connection_aborted')) {
        function connection_aborted(): int|bool
        {
            ConnectionMockState::$calledCount++;
            if (ConnectionMockState::$shouldAbort) {
                throw new \RuntimeException('Connection aborted mock exception');
            }

            return false;
        }
    }
}

namespace Tests\Feature {
    use App\Http\Controllers\ConnectionMockState;
    use App\Models\User;
    use App\Services\GeminiService;
    use Illuminate\Foundation\Testing\RefreshDatabase;
    use Mockery;
    use Tests\TestCase;

    class GeminiStreamTest extends TestCase
    {
        use RefreshDatabase;

        protected function tearDown(): void
        {
            Mockery::close();
            parent::tearDown();
        }

        /**
         * Test Case 1: test_stream_endpoint_returns_correct_sse_headers
         */
        public function test_stream_endpoint_returns_correct_sse_headers(): void
        {
            $user = User::factory()->create();

            $mock = Mockery::mock(GeminiService::class);
            $mock->shouldReceive('generateReplyStream')
                ->once()
                ->andReturnUsing(function ($messages, $onChunk) {
                    $onChunk('Test chunk');
                });
            $this->app->instance(GeminiService::class, $mock);

            $response = $this->actingAs($user)
                ->postJson('/api/posts/generate-ai-stream', [
                    'topic' => 'Test topic',
                    'goal' => 'Test goal',
                    'framework' => 'aida',
                ]);

            $response->assertStatus(200);
            $response->streamedContent(); // Invoke the streamed closure to run mock assertions

            $this->assertStringStartsWith('text/event-stream', $response->headers->get('Content-Type'));
            $this->assertStringContainsString('no-cache', $response->headers->get('Cache-Control'));
            $this->assertStringContainsString('keep-alive', $response->headers->get('Connection'));
            $this->assertStringContainsString('no', $response->headers->get('X-Accel-Buffering'));
        }

        /**
         * Test Case 2: test_stream_endpoint_validates_required_parameters
         */
        public function test_stream_endpoint_validates_required_parameters(): void
        {
            $user = User::factory()->create();

            $response = $this->actingAs($user)
                ->postJson('/api/posts/generate-ai-stream', [
                    'goal' => 'Test goal', // Missing topic and framework
                ]);

            $response->assertStatus(422)
                ->assertJsonValidationErrors(['topic', 'framework']);
        }

        /**
         * Test Case 3: test_abort_stream_behavior
         */
        public function test_abort_stream_behavior(): void
        {
            $user = User::factory()->create();

            $mock = Mockery::mock(GeminiService::class);
            $mock->shouldReceive('generateReplyStream')
                ->once()
                ->andReturnUsing(function ($messages, $onChunk) {
                    $onChunk('Chunk A');
                    $onChunk('Chunk B');
                });
            $this->app->instance(GeminiService::class, $mock);

            $initialObLevel = ob_get_level();
            ConnectionMockState::$shouldAbort = true;
            ConnectionMockState::$calledCount = 0;

            try {
                $response = $this->actingAs($user)
                    ->postJson('/api/posts/generate-ai-stream', [
                        'topic' => 'Test topic',
                        'goal' => 'Test goal',
                        'framework' => 'aida',
                    ]);

                $response->assertStatus(200);
                $response->streamedContent();
                $this->fail('Expected RuntimeException was not thrown.');
            } catch (\RuntimeException $e) {
                $this->assertEquals('Connection aborted mock exception', $e->getMessage());
                $this->assertGreaterThan(0, ConnectionMockState::$calledCount);
            } finally {
                ConnectionMockState::$shouldAbort = false;
                // Close only open output buffers left by the interrupted execution, leaving PHPUnit's own buffer intact
                while (ob_get_level() > $initialObLevel) {
                    ob_end_clean();
                }
            }
        }

        /**
         * Test Case 4: test_generated_content_follows_aida_framework
         */
        public function test_generated_content_follows_aida_framework(): void
        {
            $user = User::factory()->create();

            $mock = Mockery::mock(GeminiService::class);
            $mock->shouldReceive('generateReplyStream')
                ->once()
                ->with(Mockery::on(function ($messages) {
                    $prompt = $messages[0]['parts'][0]['text'];

                    return str_contains($prompt, 'AIDA') && str_contains($prompt, 'Value-First');
                }), Mockery::any())
                ->andReturnUsing(function ($messages, $onChunk) {
                    $onChunk("Attention: Mo dau thu hut.\n");
                    $onChunk("Interest: Giai thich van de.\n");
                    $onChunk("Desire: Tang Voucher giam gia den 70% khoa hoc.\n");
                    $onChunk('Action: Click ngay vao link ben duoi de so huu san pham!');
                });
            $this->app->instance(GeminiService::class, $mock);

            $response = $this->actingAs($user)
                ->postJson('/api/posts/generate-ai-stream', [
                    'topic' => 'Hoc Code',
                    'goal' => 'Ban khoa hoc',
                    'framework' => 'aida',
                ]);

            $response->assertStatus(200);
            $content = $response->streamedContent();

            $this->assertStringContainsString('70%', $content);
            $this->assertStringContainsString('Click ngay vao link', $content);
        }

        /**
         * Test Case 5: test_generated_content_follows_pas_framework
         */
        public function test_generated_content_follows_pas_framework(): void
        {
            $user = User::factory()->create();

            $mock = Mockery::mock(GeminiService::class);
            $mock->shouldReceive('generateReplyStream')
                ->once()
                ->with(Mockery::on(function ($messages) {
                    $prompt = $messages[0]['parts'][0]['text'];

                    return str_contains($prompt, 'PAS') && str_contains($prompt, 'Value-First');
                }), Mockery::any())
                ->andReturnUsing(function ($messages, $onChunk) {
                    $onChunk("Problem: Ban dang gap rac roi.\n");
                    $onChunk("Agitate: Code loi gay thuc dem.\n");
                    $onChunk('Solve: Su dung Zeflyo.');
                });
            $this->app->instance(GeminiService::class, $mock);

            $response = $this->actingAs($user)
                ->postJson('/api/posts/generate-ai-stream', [
                    'topic' => 'Sua bug',
                    'goal' => 'Ban cong cu',
                    'framework' => 'pas',
                ]);

            $response->assertStatus(200);
            $content = $response->streamedContent();

            $this->assertStringContainsString('Problem', $content);
            $this->assertStringContainsString('Agitate', $content);
            $this->assertStringContainsString('Solve', $content);
        }

        /**
         * Test Case 6: test_generated_content_follows_bab_framework
         */
        public function test_generated_content_follows_bab_framework(): void
        {
            $user = User::factory()->create();

            $mock = Mockery::mock(GeminiService::class);
            $mock->shouldReceive('generateReplyStream')
                ->once()
                ->with(Mockery::on(function ($messages) {
                    $prompt = $messages[0]['parts'][0]['text'];

                    return str_contains($prompt, 'BAB') && str_contains($prompt, 'Value-First');
                }), Mockery::any())
                ->andReturnUsing(function ($messages, $onChunk) {
                    $onChunk("Before: Truoc day thu cong.\n");
                    $onChunk("After: Gio day tu dong.\n");
                    $onChunk('Bridge: Zeflyo la cau noi.');
                });
            $this->app->instance(GeminiService::class, $mock);

            $response = $this->actingAs($user)
                ->postJson('/api/posts/generate-ai-stream', [
                    'topic' => 'Dang bai',
                    'goal' => 'Tu dong hoa',
                    'framework' => 'bab',
                ]);

            $response->assertStatus(200);
            $content = $response->streamedContent();

            $this->assertStringContainsString('Before', $content);
            $this->assertStringContainsString('After', $content);
            $this->assertStringContainsString('Bridge', $content);
        }
    }
}
