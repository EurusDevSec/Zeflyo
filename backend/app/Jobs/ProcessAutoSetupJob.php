<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use App\Models\AutoSetup;
use App\Models\Topic;
use App\Models\Fanpage;
use App\Models\Product;
use App\Services\GeminiService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ProcessAutoSetupJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $autoSetupId;

    public function __construct(int $autoSetupId)
    {
        $this->autoSetupId = $autoSetupId;
    }

    public function handle(): void
    {
        $setup = AutoSetup::with('topics')->find($this->autoSetupId);

        if (!$setup || $setup->status !== 'active') {
            Log::info("AutoSetup #{$this->autoSetupId}: skipped (not found or not active).");
            return;
        }

        Log::info("AutoSetup #{$setup->id} '{$setup->name}': processing...");

        if ($setup->source_type === 'topic') {
            $this->processTopicSource($setup);
        } else {
            $this->processProductSource($setup);
        }
    }

    /**
     * Process auto-setup with topic source: pick next pending topic,
     * generate content, and publish or save for review.
     */
    private function processTopicSource(AutoSetup $setup): void
    {
        $topic = $setup->nextPendingTopic();

        if (!$topic) {
            // All topics processed
            if ($setup->auto_repeat) {
                Log::info("AutoSetup #{$setup->id}: all topics done, repeating...");
                $setup->topics()->update(['status' => 'pending', 'generated_content' => null, 'fb_post_id' => null, 'error_log' => null]);
                $topic = $setup->nextPendingTopic();
            } else {
                $setup->update(['status' => 'completed']);
                Log::info("AutoSetup #{$setup->id}: all topics done, marking completed.");
                return;
            }
        }

        if (!$topic) {
            return;
        }

        $gemini = new GeminiService();
        $config = $this->buildConfig($setup);

        $content = $gemini->generatePostFromTopic($topic->title, $config);

        if (!$content) {
            $topic->update([
                'status' => 'failed',
                'error_log' => 'AI content generation failed.',
            ]);
            Log::error("AutoSetup #{$setup->id}, Topic #{$topic->id}: AI generation failed.");
            return;
        }

        $topic->generated_content = $content;

        if ($setup->publish_mode === 'review') {
            // Save for review, don't publish yet
            $topic->status = 'generated';
            $topic->save();
            Log::info("AutoSetup #{$setup->id}, Topic #{$topic->id}: content generated, awaiting review.");
            return;
        }

        // Instant publish mode
        $this->publishToFacebook($topic, $setup);
    }

    /**
     * Process auto-setup with product source: pick next product and generate + publish.
     */
    private function processProductSource(AutoSetup $setup): void
    {
        $user = $setup->user;
        if (!$user) return;

        // Get products that are enabled and haven't been posted recently for this setup
        // We use a simple approach: track via topics table with product name as title
        $existingTopicTitles = $setup->topics()->pluck('title')->toArray();
        $products = $user->products()
            ->where('auto_post_enabled', true)
            ->orderBy('sort_order')
            ->get();

        $nextProduct = null;
        foreach ($products as $product) {
            $marker = "[product:{$product->id}]";
            if (!in_array($marker, $existingTopicTitles)) {
                $nextProduct = $product;
                break;
            }
        }

        if (!$nextProduct) {
            if ($setup->auto_repeat) {
                Log::info("AutoSetup #{$setup->id}: all products done, repeating...");
                $setup->topics()->delete();
                $nextProduct = $products->first();
            } else {
                $setup->update(['status' => 'completed']);
                Log::info("AutoSetup #{$setup->id}: all products done, completed.");
                return;
            }
        }

        if (!$nextProduct) return;

        // Create a topic record to track this product post
        $topic = Topic::create([
            'user_id' => $setup->user_id,
            'auto_setup_id' => $setup->id,
            'title' => "[product:{$nextProduct->id}]",
            'status' => 'pending',
            'sort_order' => $setup->topics()->max('sort_order') + 1,
            'generated_image_url' => ($nextProduct->image_urls && count($nextProduct->image_urls) > 0) ? $nextProduct->image_urls[0] : null,
        ]);

        $gemini = new GeminiService();
        $config = $this->buildConfig($setup);

        $content = $gemini->generatePostFromProduct([
            'name' => $nextProduct->name,
            'description' => $nextProduct->description,
        ], $config);

        if (!$content) {
            $topic->update(['status' => 'failed', 'error_log' => 'AI product content generation failed.']);
            return;
        }

        $topic->generated_content = $content;

        if ($setup->publish_mode === 'review') {
            $topic->status = 'generated';
            $topic->save();
            return;
        }

        // Use product-specific comment if available, otherwise use setup default
        $this->publishToFacebook($topic, $setup, $nextProduct->comment);
    }

    /**
     * Publish generated content to Facebook pages.
     */
    private function publishToFacebook(Topic $topic, AutoSetup $setup, ?string $productComment = null): void
    {
        $fanpageIds = $setup->fanpage_ids ?? [];
        $errors = [];
        $postId = null;

        foreach ($fanpageIds as $fanpageId) {
            $fanpage = Fanpage::find($fanpageId);
            if (!$fanpage) {
                $errors[] = "Fanpage {$fanpageId} not found.";
                continue;
            }

            try {
                $pageToken = $fanpage->access_token;
                $fbPageId = $fanpage->fb_page_id;

                // Mock mode support
                if ($pageToken === 'mock_page_token_123') {
                    Log::info("Mock AutoPost: Page {$fbPageId}, Content=\"" . mb_substr($topic->generated_content, 0, 100) . "...\"");
                    $postId = 'mock_post_' . time();
                    continue;
                }

                $imageUrl = $this->getPublicImageUrl($topic->generated_image_url);
                if ($imageUrl) {
                    $response = Http::post("https://graph.facebook.com/v20.0/{$fbPageId}/photos", [
                        'url' => $imageUrl,
                        'caption' => $topic->generated_content,
                        'access_token' => $pageToken,
                    ]);
                } else {
                    $response = Http::post("https://graph.facebook.com/v20.0/{$fbPageId}/feed", [
                        'message' => $topic->generated_content,
                        'access_token' => $pageToken,
                    ]);
                }

                if ($response->successful()) {
                    $postId = $response->json('id') ?? $response->json('post_id');

                    // Auto first comment
                    $commentContent = $productComment ?? $setup->auto_comment;
                    if ($postId && $commentContent) {
                        Http::post("https://graph.facebook.com/v20.0/{$postId}/comments", [
                            'message' => $commentContent,
                            'access_token' => $pageToken,
                        ]);
                        Log::info("AutoSetup #{$setup->id}: auto-comment posted on {$postId}");
                    }
                } else {
                    $errors[] = "Page {$fbPageId}: " . $response->body();
                    Log::error("AutoSetup publish error: " . $response->body());
                }
            } catch (\Exception $e) {
                $errors[] = "Page {$fanpageId}: " . $e->getMessage();
                Log::error("AutoSetup publish exception: " . $e->getMessage());
            }
        }

        $topic->fb_post_id = $postId;

        if (empty($errors)) {
            $topic->status = 'published';
            $topic->error_log = null;
            Log::info("AutoSetup #{$setup->id}, Topic #{$topic->id}: published successfully.");
        } else {
            $topic->status = $postId ? 'published' : 'failed';
            $topic->error_log = implode("\n", $errors);
        }

        $topic->save();

        // Check if all topics are done
        if ($setup->allTopicsProcessed()) {
            if ($setup->auto_repeat) {
                Log::info("AutoSetup #{$setup->id}: cycle complete, will repeat on next run.");
            } else {
                $setup->update(['status' => 'completed']);
            }
        }
    }

    /**
     * Build config array from AutoSetup model for GeminiService.
     */
    private function buildConfig(AutoSetup $setup): array
    {
        return [
            'language' => $setup->language ?? 'vi',
            'post_length' => $setup->post_length ?? 'medium',
            'writing_style' => $setup->writing_style ?? 'professional',
            'custom_prompt' => $setup->custom_prompt,
            'include_contact' => $setup->include_contact,
            'contact_info' => $setup->contact_info,
        ];
    }

    /**
     * Convert local image URL to public localtunnel URL so Facebook can download it.
     */
    private function getPublicImageUrl(?string $url): ?string
    {
        if (!$url) {
            return null;
        }

        if (!str_contains($url, 'localhost') && !str_contains($url, '127.0.0.1') && !str_contains($url, 'host.docker.internal')) {
            return $url;
        }

        $parsed = parse_url($url);
        $path = $parsed['path'] ?? '';
        $query = isset($parsed['query']) ? '?' . $parsed['query'] : '';

        return 'https://zeflyo-dev.loca.lt' . $path . $query;
    }
}
