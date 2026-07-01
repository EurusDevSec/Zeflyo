<?php

namespace App\Http\Controllers;

use App\Models\SystemNotification;
use Illuminate\Http\Request;

class SystemNotificationController extends Controller
{
    public function index()
    {
        return response()->json(
            SystemNotification::orderBy('pinned', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
        );
    }

    public function store(Request $request)
    {
        if ($request->user()->email !== 'admin@zeflyo.io') {
            return response()->json(['message' => 'Unauthorized. Only admins can publish notifications.'], 403);
        }

        $validated = $request->validate([
            'category' => 'required|string|in:feature,update,maintenance,event,info',
            'title_vi' => 'required|string|max:255',
            'title_en' => 'required|string|max:255',
            'snippet_vi' => 'required|string',
            'snippet_en' => 'required|string',
            'pinned' => 'nullable|boolean',
            'banner_vi' => 'nullable|array',
            'banner_en' => 'nullable|array',
            'blocks_vi' => 'required|array',
            'blocks_en' => 'required|array',
        ]);

        $notification = SystemNotification::create($validated);

        return response()->json($notification, 201);
    }

    public function destroy(Request $request, $id)
    {
        if ($request->user()->email !== 'admin@zeflyo.io') {
            return response()->json(['message' => 'Unauthorized. Only admins can delete notifications.'], 403);
        }

        $notification = SystemNotification::findOrFail($id);
        $notification->delete();

        return response()->json(['message' => 'Notification deleted successfully.']);
    }
}
