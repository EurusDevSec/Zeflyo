<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserSettingsController extends Controller
{
    public function updateLanguage(Request $request)
    {
        $validated = $request->validate([
            'language' => 'required|string|in:vi,en,zh,ja,ko',
        ]);

        $user = $request->user();
        $user->language = $validated['language'];
        $user->save();

        return response()->json([
            'message' => 'Language updated',
            'language' => $user->language,
        ]);
    }
}
