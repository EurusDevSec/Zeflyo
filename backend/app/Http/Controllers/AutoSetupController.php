<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AutoSetup;

class AutoSetupController extends Controller
{
    /**
     * List all auto-setups for the authenticated user.
     */
    public function index(Request $request)
    {
        $query = $request->user()->autoSetups()->withCount('topics');

        if ($request->has('status') && in_array($request->input('status'), ['active', 'paused', 'completed'])) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('search') && $request->input('search')) {
            $query->where('name', 'ilike', '%' . $request->input('search') . '%');
        }

        $setups = $query->orderBy('updated_at', 'desc')->get();

        return response()->json(['setups' => $setups]);
    }

    /**
     * Create a new auto-setup.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'source_type' => 'required|in:topic,product',
            'fanpage_ids' => 'required|array|min:1',
            'fanpage_ids.*' => 'integer|exists:fanpages,id',
            'language' => 'nullable|string|max:10',
            'post_length' => 'nullable|in:super_short,short,medium,full,detailed',
            'writing_style' => 'nullable|string|max:100',
            'custom_prompt' => 'nullable|string|max:8000',
            'use_fanpage_info' => 'nullable|boolean',
            'include_contact' => 'nullable|boolean',
            'contact_info' => 'nullable|string|max:2000',
            'schedule_mode' => 'required|in:weekly,fixed',
            'schedule_days' => 'nullable|array',
            'schedule_days.*' => 'integer|between:1,7',
            'schedule_date' => 'nullable|date',
            'schedule_times' => 'required|array|min:1',
            'schedule_times.*' => 'string',
            'auto_post' => 'nullable|boolean',
            'auto_repeat' => 'nullable|boolean',
            'publish_mode' => 'nullable|in:instant,review',
            'auto_comment' => 'nullable|string|max:2000',
        ]);

        // Verify user owns all target fanpages
        $userFanpageIds = $request->user()->fanpages()->pluck('id')->toArray();
        foreach ($request->input('fanpage_ids') as $id) {
            if (!in_array($id, $userFanpageIds)) {
                return response()->json([
                    'error' => "Unauthorized: fanpage ID {$id} does not belong to you."
                ], 403);
            }
        }

        $setup = AutoSetup::create([
            'user_id' => $request->user()->id,
            'name' => $request->input('name'),
            'source_type' => $request->input('source_type'),
            'fanpage_ids' => $request->input('fanpage_ids'),
            'language' => $request->input('language', 'vi'),
            'post_length' => $request->input('post_length', 'medium'),
            'writing_style' => $request->input('writing_style', 'professional'),
            'custom_prompt' => $request->input('custom_prompt'),
            'use_fanpage_info' => $request->boolean('use_fanpage_info', false),
            'include_contact' => $request->boolean('include_contact', false),
            'contact_info' => $request->input('contact_info'),
            'schedule_mode' => $request->input('schedule_mode'),
            'schedule_days' => $request->input('schedule_days'),
            'schedule_date' => $request->input('schedule_date'),
            'schedule_times' => $request->input('schedule_times'),
            'auto_post' => $request->boolean('auto_post', true),
            'auto_repeat' => $request->boolean('auto_repeat', false),
            'publish_mode' => $request->input('publish_mode', 'instant'),
            'auto_comment' => $request->input('auto_comment'),
            'status' => 'paused',
        ]);

        return response()->json([
            'message' => 'Auto-setup created successfully.',
            'setup' => $setup->loadCount('topics'),
        ], 201);
    }

    /**
     * Show a single auto-setup with its topics.
     */
    public function show(Request $request, $id)
    {
        $setup = AutoSetup::with('topics')->withCount('topics')->findOrFail($id);

        if ($setup->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json(['setup' => $setup]);
    }

    /**
     * Update an auto-setup.
     */
    public function update(Request $request, $id)
    {
        $setup = AutoSetup::findOrFail($id);

        if ($setup->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'fanpage_ids' => 'sometimes|array|min:1',
            'fanpage_ids.*' => 'integer|exists:fanpages,id',
            'language' => 'nullable|string|max:10',
            'post_length' => 'nullable|in:super_short,short,medium,full,detailed',
            'writing_style' => 'nullable|string|max:100',
            'custom_prompt' => 'nullable|string|max:8000',
            'use_fanpage_info' => 'nullable|boolean',
            'include_contact' => 'nullable|boolean',
            'contact_info' => 'nullable|string|max:2000',
            'schedule_mode' => 'sometimes|in:weekly,fixed',
            'schedule_days' => 'nullable|array',
            'schedule_date' => 'nullable|date',
            'schedule_times' => 'sometimes|array|min:1',
            'auto_post' => 'nullable|boolean',
            'auto_repeat' => 'nullable|boolean',
            'publish_mode' => 'nullable|in:instant,review',
            'auto_comment' => 'nullable|string|max:2000',
        ]);

        $setup->update($request->only([
            'name', 'fanpage_ids', 'language', 'post_length', 'writing_style',
            'custom_prompt', 'use_fanpage_info', 'include_contact', 'contact_info',
            'schedule_mode', 'schedule_days', 'schedule_date', 'schedule_times',
            'auto_post', 'auto_repeat', 'publish_mode', 'auto_comment',
        ]));

        return response()->json([
            'message' => 'Auto-setup updated successfully.',
            'setup' => $setup->fresh()->loadCount('topics'),
        ]);
    }

    /**
     * Delete an auto-setup (cascades to topics).
     */
    public function destroy(Request $request, $id)
    {
        $setup = AutoSetup::findOrFail($id);

        if ($setup->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $setup->delete();

        return response()->json(['message' => 'Auto-setup deleted successfully.']);
    }

    /**
     * Toggle auto-setup status (active <-> paused).
     */
    public function toggle(Request $request, $id)
    {
        $setup = AutoSetup::findOrFail($id);

        if ($setup->user_id !== $request->user()->id) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $newStatus = $setup->status === 'active' ? 'paused' : 'active';
        $setup->update(['status' => $newStatus]);

        return response()->json([
            'message' => "Auto-setup status changed to {$newStatus}.",
            'setup' => $setup->fresh(),
        ]);
    }
}
