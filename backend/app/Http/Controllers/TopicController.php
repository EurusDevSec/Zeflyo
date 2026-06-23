<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AutoSetup;
use App\Models\Topic;
use App\Models\Fanpage;
use App\Services\GeminiService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TopicController extends Controller
{
    /**
     * List topics for an auto-setup.
     */
    public function index(Request $request, $autoSetupId)
    {
        $setup = AutoSetup::findOrFail($autoSetupId);

        if ($setup->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $topics = $setup->topics()->orderBy('sort_order')->get();

        return response()->json(['topics' => $topics]);
    }

    /**
     * Add a topic manually.
     */
    public function store(Request $request, $autoSetupId)
    {
        $setup = AutoSetup::findOrFail($autoSetupId);

        if ($setup->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:500',
        ]);

        $maxOrder = $setup->topics()->max('sort_order') ?? 0;

        $topic = Topic::create([
            'user_id' => $request->user()->id,
            'auto_setup_id' => $setup->id,
            'title' => $request->input('title'),
            'status' => 'pending',
            'sort_order' => $maxOrder + 1,
        ]);

        return response()->json([
            'message' => 'Topic added successfully.',
            'topic' => $topic,
        ], 201);
    }

    /**
     * Delete a topic.
     */
    public function destroy(Request $request, $id)
    {
        $topic = Topic::findOrFail($id);

        if ($topic->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $topic->delete();

        return response()->json(['message' => 'Topic deleted successfully.']);
    }

    /**
     * Generate topics using AI from a prompt.
     */
    public function generateTopics(Request $request, $autoSetupId)
    {
        $setup = AutoSetup::findOrFail($autoSetupId);

        if ($setup->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'prompt' => 'required|string|max:8000',
            'count' => 'nullable|integer|min:1|max:50',
        ]);

        $prompt = $request->input('prompt');
        $count = $request->input('count', 30);
        $language = $setup->language ?? 'vi';

        $service = new GeminiService();
        $topics = $service->generateTopicsList($prompt, $count, $language);

        if ($topics === null || !is_array($topics)) {
            return response()->json([
                'error' => 'Không thể sinh chủ đề bằng AI. Vui lòng thử lại sau.'
            ], 500);
        }

        $maxOrder = $setup->topics()->max('sort_order') ?? 0;
        $createdTopics = [];

        foreach ($topics as $index => $title) {
            if (!is_string($title) || trim($title) === '') continue;

            $createdTopics[] = Topic::create([
                'user_id' => $request->user()->id,
                'auto_setup_id' => $setup->id,
                'title' => trim($title),
                'status' => 'pending',
                'sort_order' => $maxOrder + $index + 1,
            ]);
        }

        return response()->json([
            'message' => 'Generated ' . count($createdTopics) . ' topics successfully.',
            'topics' => $createdTopics,
        ]);
    }

    /**
     * Approve a generated topic and publish it to Facebook.
     * Used in "review" publish mode.
     */
    public function approve(Request $request, $id)
    {
        $topic = Topic::with('autoSetup')->findOrFail($id);

        if ($topic->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        if ($topic->status !== 'generated') {
            return response()->json([
                'error' => 'Topic must be in "generated" status to approve.'
            ], 422);
        }

        // Allow editing content and image URL before publishing
        if ($request->has('content')) {
            $topic->generated_content = $request->input('content');
        }
        if ($request->has('image_url')) {
            $topic->generated_image_url = $request->input('image_url');
        }

        if (!$topic->generated_content) {
            return response()->json([
                'error' => 'No generated content to publish.'
            ], 422);
        }

        // Save any edits
        $topic->save();

        $setup = $topic->autoSetup;
        $fanpageIds = $setup->fanpage_ids ?? [];
        $errors = [];
        $successPages = [];

        foreach ($fanpageIds as $fanpageId) {
            $fanpage = Fanpage::find($fanpageId);
            if (!$fanpage) {
                $errors[] = "Fanpage ID {$fanpageId} not found.";
                continue;
            }

            try {
                $pageToken = $fanpage->access_token;
                $fbPageId = $fanpage->fb_page_id;

                if ($pageToken === 'mock_page_token_123') {
                    Log::info("Mock Approve Publish: Page {$fbPageId}, Content=\"{$topic->generated_content}\", Image=\"{$topic->generated_image_url}\"");
                    $successPages[] = $fbPageId;
                    $topic->fb_post_id = 'mock_post_' . time();
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
                    $successPages[] = $fbPageId;
                    $topic->fb_post_id = $response->json('id') ?? $response->json('post_id');

                    // Auto-comment if configured
                    $commentContent = $setup->auto_comment;
                    if ($topic->fb_post_id && $commentContent) {
                        Http::post("https://graph.facebook.com/v20.0/{$topic->fb_post_id}/comments", [
                            'message' => $commentContent,
                            'access_token' => $pageToken,
                        ]);
                    }
                } else {
                    $errors[] = "Page {$fbPageId}: " . $response->body();
                }
            } catch (\Exception $e) {
                $errors[] = "Page {$fanpageId}: " . $e->getMessage();
            }
        }

        if (empty($errors)) {
            $topic->status = 'published';
            $topic->error_log = null;
        } else {
            $topic->status = count($successPages) > 0 ? 'published' : 'failed';
            $topic->error_log = implode("\n", $errors);
        }

        $topic->save();

        return response()->json([
            'message' => $topic->status === 'published' ? 'Topic published successfully.' : 'Publishing had errors.',
            'topic' => $topic->fresh(),
        ]);
    }

    /**
     * Update a topic's generated content and image URL.
     */
    public function update(Request $request, $id)
    {
        $topic = Topic::findOrFail($id);

        if ($topic->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'content' => 'nullable|string',
            'image_url' => 'nullable|string|max:1000',
            'status' => 'nullable|string|in:pending,generated,published,failed',
        ]);

        if ($request->has('content')) {
            $topic->generated_content = $request->input('content');
        }
        if ($request->has('image_url')) {
            $topic->generated_image_url = $request->input('image_url');
        }
        if ($request->has('status')) {
            $topic->status = $request->input('status');
        }

        $topic->save();

        return response()->json([
            'message' => 'Topic updated successfully.',
            'topic' => $topic,
        ]);
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
