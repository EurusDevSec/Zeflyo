<?php

namespace App\Http\Controllers;

use App\Models\Fanpage;
use Illuminate\Http\Request;

class FanpageController extends Controller
{
    /**
     * Display a listing of the authenticated user's fanpages.
     */
    public function index(Request $request)
    {
        $fanpages = $request->user()->fanpages()->orderBy('name', 'asc')->get();

        return response()->json([
            'fanpages' => $fanpages,
        ]);
    }

    /**
     * Toggle the active status of a fanpage for automation.
     */
    public function toggleActive(Request $request, Fanpage $fanpage)
    {
        // Ensure user owns this fanpage
        if ($fanpage->user_id !== $request->user()->id) {
            return response()->json([
                'error' => 'Unauthorized access to this fanpage',
            ], 403);
        }

        $fanpage->is_active = ! $fanpage->is_active;
        $fanpage->save();

        return response()->json([
            'message' => 'Fanpage status updated successfully',
            'fanpage' => $fanpage,
        ]);
    }
}
