<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    /**
     * Get the authenticated user's profile.
     */
    public function getProfile(Request $request)
    {
        $user = $request->user();
        return response()->json([
            'id' => $user->uid ?? $user->id,
            'name' => $user->name,
            'display_name' => $user->display_name,
            'email' => $user->email,
            'avatar_url' => $user->avatar_url,
            'timezone' => $user->timezone,
            'credits' => $user->credits,
            'subscription_plan' => $user->subscription_plan,
            'subscription_expires_at' => $user->subscription_expires_at,
            'phone' => $user->phone,
            'referral_phone' => $user->referral_phone,
        ]);
    }

    /**
     * Update the authenticated user's profile.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'display_name' => 'nullable|string|max:255',
            'avatar_url' => 'nullable|string|max:2048',
            'timezone' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:20',
            'referral_phone' => 'nullable|string|max:20',
        ]);

        $user->update($data);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->uid ?? $user->id,
                'name' => $user->name,
                'display_name' => $user->display_name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
                'timezone' => $user->timezone,
                'credits' => $user->credits,
                'subscription_plan' => $user->subscription_plan,
                'subscription_expires_at' => $user->subscription_expires_at,
                'phone' => $user->phone,
                'referral_phone' => $user->referral_phone,
            ]
        ]);
    }

    /**
     * Update the authenticated user's password.
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => 'required|string',
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ]);

        if (!Hash::check($request->input('current_password'), $user->password)) {
            return response()->json([
                'message' => 'The provided password does not match your current password.',
                'errors' => [
                    'current_password' => ['Mật khẩu hiện tại không chính xác.']
                ]
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->input('password')),
        ]);

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }
}
