<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
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
        $user->checkAndAwardDailyFreeCredits();

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
            'last_checkin_at' => $user->last_checkin_at ? $user->last_checkin_at->toIso8601String() : null,
            'checkin_history' => $this->getCheckinHistory($user),
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
        $user->checkAndAwardDailyFreeCredits();

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
                'last_checkin_at' => $user->last_checkin_at ? $user->last_checkin_at->toIso8601String() : null,
                'checkin_history' => $this->getCheckinHistory($user),
            ],
        ]);
    }

    /**
     * Perform daily check-in to claim free credits.
     */
    public function checkIn(Request $request)
    {
        $user = $request->user();
        $userTimezone = $user->timezone ?? 'Asia/Ho_Chi_Minh';
        $todayString = Carbon::now($userTimezone)->format('Y-m-d');

        $alreadyCheckedIn = $user->checkins()->where('checkin_date', $todayString)->exists();
        if ($alreadyCheckedIn) {
            return response()->json([
                'message' => 'Bạn đã điểm danh hôm nay rồi. Hãy quay lại vào ngày mai nhé!',
                'errors' => [
                    'checkin' => ['Already checked in today.'],
                ],
            ], 400);
        }

        $user->checkins()->create([
            'checkin_date' => $todayString,
        ]);

        $user->credits = ($user->credits ?? 0) + 50;
        $user->last_checkin_at = Carbon::now();
        $user->save();

        return response()->json([
            'message' => 'Điểm danh thành công! Bạn nhận được +50 điểm miễn phí.',
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
                'last_checkin_at' => $user->last_checkin_at ? $user->last_checkin_at->toIso8601String() : null,
                'checkin_history' => $this->getCheckinHistory($user),
            ],
        ]);
    }

    /**
     * Get user checkin history dates for the current calendar month.
     */
    protected function getCheckinHistory($user): array
    {
        return $user->checkins()
            ->whereMonth('checkin_date', Carbon::now()->month)
            ->whereYear('checkin_date', Carbon::now()->year)
            ->pluck('checkin_date')
            ->map(function ($date) {
                return $date instanceof \DateTimeInterface ? $date->format('Y-m-d') : Carbon::parse($date)->format('Y-m-d');
            })
            ->toArray();
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

        if (! Hash::check($request->input('current_password'), $user->password)) {
            return response()->json([
                'message' => 'The provided password does not match your current password.',
                'errors' => [
                    'current_password' => ['Mật khẩu hiện tại không chính xác.'],
                ],
            ], 422);
        }

        $user->update([
            'password' => Hash::make($request->input('password')),
        ]);

        return response()->json([
            'message' => 'Password updated successfully',
        ]);
    }
}
