<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ScheduledPost;
use Carbon\Carbon;

class PostSchedulerController extends Controller
{
    /**
     * Display a listing of scheduled posts for the authenticated user.
     */
    public function index(Request $request)
    {
        $posts = $request->user()->scheduledPosts()
            ->orderBy('scheduled_at', 'desc')
            ->get();

        return response()->json([
            'posts' => $posts
        ]);
    }

    /**
     * Store a new scheduled post.
     */
    public function store(Request $request)
    {
        $request->validate([
            'fanpage_ids' => 'required|array|min:1',
            'fanpage_ids.*' => 'integer|exists:fanpages,id',
            'content' => 'required|string',
            'image_url' => 'nullable|url',
            'scheduled_at' => 'required|date',
            'status' => 'nullable|string|in:draft,pending,published,failed',
        ]);

        // Ensure user owns all target fanpages
        $userFanpageIds = $request->user()->fanpages()->pluck('id')->toArray();
        foreach ($request->input('fanpage_ids') as $id) {
            if (!in_array($id, $userFanpageIds)) {
                return response()->json([
                    'error' => "Unauthorized to schedule posts for fanpage ID {$id}"
                ], 403);
            }
        }

        // Validate scheduled_at is in the future, if status is pending
        $scheduledAt = Carbon::parse($request->input('scheduled_at'));
        $status = $request->input('status', 'pending');
        
        if ($status === 'pending' && $scheduledAt->isPast()) {
            return response()->json([
                'error' => 'Scheduled time must be in the future.'
            ], 422);
        }

        $post = ScheduledPost::create([
            'user_id' => $request->user()->id,
            'fanpage_ids' => $request->input('fanpage_ids'),
            'content' => $request->input('content'),
            'image_url' => $request->input('image_url'),
            'scheduled_at' => $scheduledAt,
            'status' => $status,
        ]);

        return response()->json([
            'message' => 'Post scheduled successfully',
            'post' => $post
        ], 201);
    }

    /**
     * Cancel/Delete a scheduled post.
     */
    public function destroy(Request $request, $id)
    {
        $post = ScheduledPost::findOrFail($id);

        if ($post->user_id !== $request->user()->id) {
            return response()->json([
                'error' => 'Unauthorized'
            ], 403);
        }

        $post->delete();

        return response()->json([
            'message' => 'Scheduled post deleted successfully'
        ]);
    }
}
