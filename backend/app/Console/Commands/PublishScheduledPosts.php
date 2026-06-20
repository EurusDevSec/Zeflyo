<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\ScheduledPost;
use App\Models\Fanpage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PublishScheduledPosts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'posts:publish';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Publish scheduled posts to Facebook pages.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting scheduled posts publishing...');

        $posts = ScheduledPost::where('status', 'pending')
            ->where('scheduled_at', '<=', Carbon::now())
            ->get();

        if ($posts->isEmpty()) {
            $this->info('No pending scheduled posts to publish.');
            return 0;
        }

        $this->info("Found {$posts->count()} posts to process.");

        foreach ($posts as $post) {
            $this->publishPost($post);
        }

        $this->info('Scheduled posts processing completed.');
        return 0;
    }

    /**
     * Publish a single scheduled post to all its target pages.
     */
    private function publishPost(ScheduledPost $post)
    {
        $this->info("Processing post ID {$post->id}...");
        
        $fanpageIds = $post->fanpage_ids;
        $failedPages = [];
        $successPages = [];
        $errors = [];

        foreach ($fanpageIds as $fanpageId) {
            $fanpage = Fanpage::find($fanpageId);

            if (!$fanpage) {
                $failedPages[] = $fanpageId;
                $errors[] = "Fanpage ID {$fanpageId} not found in local database.";
                continue;
            }

            try {
                $pageToken = $fanpage->access_token; // Automatically decrypted by Eloquent cast
                $fbPageId = $fanpage->fb_page_id;

                if ($pageToken === 'mock_page_token_123') {
                    Log::info("Mock Facebook Publish: Page ID {$fbPageId}, Content=\"{$post->content}\", Image=\"{$post->image_url}\"");
                    $successPages[] = $fbPageId;
                    continue;
                }

                if ($post->image_url) {
                    // Post photo
                    $response = Http::post("https://graph.facebook.com/v20.0/{$fbPageId}/photos", [
                        'url' => $post->image_url,
                        'caption' => $post->content,
                        'access_token' => $pageToken
                    ]);
                } else {
                    // Post feed status
                    $response = Http::post("https://graph.facebook.com/v20.0/{$fbPageId}/feed", [
                        'message' => $post->content,
                        'access_token' => $pageToken
                    ]);
                }

                if ($response->successful()) {
                    $successPages[] = $fbPageId;
                } else {
                    $failedPages[] = $fbPageId;
                    $errors[] = "Fanpage ID {$fanpageId} (FB Page {$fbPageId}) failed: " . $response->body();
                    Log::error("Facebook Publish error for page {$fbPageId}: " . $response->body());
                }
            } catch (\Exception $e) {
                $failedPages[] = $fanpageId;
                $errors[] = "Exception for Fanpage ID {$fanpageId}: " . $e->getMessage();
                Log::error("Facebook Publish exception: " . $e->getMessage());
            }
        }

        if (empty($failedPages)) {
            $post->status = 'published';
            $post->error_log = null;
            $this->info("Post ID {$post->id} published successfully to all target pages.");
        } else {
            $post->status = 'failed';
            $post->error_log = implode("\n", $errors);
            $this->error("Post ID {$post->id} failed to publish to some/all pages. Errors logged.");
        }

        $post->save();
    }
}
