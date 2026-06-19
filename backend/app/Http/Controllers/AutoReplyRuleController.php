<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AutoReplyRule;
use App\Models\Fanpage;

class AutoReplyRuleController extends Controller
{
    /**
     * Display a listing of the rules belonging to the user's fanpages.
     */
    public function index(Request $request)
    {
        $fanpageIds = $request->user()->fanpages()->pluck('id');

        $rules = AutoReplyRule::whereIn('fanpage_id', $fanpageIds)
            ->with('fanpage')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'rules' => $rules
        ]);
    }

    /**
     * Store a newly created rule.
     */
    public function store(Request $request)
    {
        $request->validate([
            'fanpage_id' => 'required|integer|exists:fanpages,id',
            'keyword' => 'required|string|max:255',
            'reply_content' => 'required|string',
            'is_active' => 'nullable|boolean',
        ]);

        // Ensure user owns the target fanpage
        if (!$request->user()->fanpages()->where('id', $request->input('fanpage_id'))->exists()) {
            return response()->json([
                'error' => 'Unauthorized access to this fanpage'
            ], 403);
        }

        $rule = AutoReplyRule::create([
            'fanpage_id' => $request->input('fanpage_id'),
            'keyword' => $request->input('keyword'),
            'reply_content' => $request->input('reply_content'),
            'is_active' => $request->input('is_active', true),
        ]);

        return response()->json([
            'message' => 'Auto-reply rule created successfully',
            'rule' => $rule->load('fanpage')
        ], 201);
    }

    /**
     * Update the specified rule.
     */
    public function update(Request $request, $id)
    {
        $rule = AutoReplyRule::findOrFail($id);

        // Ensure user owns the fanpage of this rule
        if (!$request->user()->fanpages()->where('id', $rule->fanpage_id)->exists()) {
            return response()->json([
                'error' => 'Unauthorized access to this rule'
            ], 403);
        }

        $request->validate([
            'keyword' => 'sometimes|required|string|max:255',
            'reply_content' => 'sometimes|required|string',
            'is_active' => 'sometimes|required|boolean',
            'fanpage_id' => 'sometimes|required|integer|exists:fanpages,id',
        ]);

        // If changing fanpage_id, ensure user owns the new page
        if ($request->has('fanpage_id')) {
            if (!$request->user()->fanpages()->where('id', $request->input('fanpage_id'))->exists()) {
                return response()->json([
                    'error' => 'Unauthorized access to the new fanpage'
                ], 403);
            }
        }

        $rule->update($request->only(['fanpage_id', 'keyword', 'reply_content', 'is_active']));

        return response()->json([
            'message' => 'Auto-reply rule updated successfully',
            'rule' => $rule->load('fanpage')
        ]);
    }

    /**
     * Remove the specified rule.
     */
    public function destroy(Request $request, $id)
    {
        $rule = AutoReplyRule::findOrFail($id);

        // Ensure user owns the fanpage of this rule
        if (!$request->user()->fanpages()->where('id', $rule->fanpage_id)->exists()) {
            return response()->json([
                'error' => 'Unauthorized access to this rule'
            ], 403);
        }

        $rule->delete();

        return response()->json([
            'message' => 'Auto-reply rule deleted successfully'
        ]);
    }
}
