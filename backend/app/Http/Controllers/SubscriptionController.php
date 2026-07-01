<?php

namespace App\Http\Controllers;

use App\Models\PendingPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SubscriptionController extends Controller
{
    /**
     * Get the listing of available subscription plans.
     */
    public function getPlans()
    {
        return response()->json([
            ['id' => 'basic',    'name' => 'Basic',     'price' => 79000,   'currency' => 'VND', 'period' => 'month'],
            ['id' => 'pro',      'name' => 'Pro',       'price' => 179000,  'currency' => 'VND', 'period' => 'month', 'recommended' => true],
            ['id' => 'premium',  'name' => 'Premium',   'price' => 249000,  'currency' => 'VND', 'period' => 'month'],
            ['id' => 'vip',      'name' => 'VIP',       'price' => null,    'currency' => null,  'contact' => true],
        ]);
    }

    /**
     * Get the authenticated user's current subscription.
     */
    public function getSubscription(Request $request)
    {
        $user = $request->user();
        $user->checkAndAwardDailyFreeCredits();

        return response()->json([
            'plan' => $user->subscription_plan ?? 'free',
            'expires_at' => $user->subscription_expires_at,
            'credits' => $user->credits ?? 0,
        ]);
    }

    /**
     * Create a new pending payment record.
     */
    public function createPendingPayment(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|string',
            'cycle' => 'nullable|string|in:monthly,3months,yearly',
            'amount' => 'required|integer|min:0',
        ]);

        $user = $request->user();

        // Generate a unique payment description code (e.g., ZF8B3K5D)
        do {
            $code = 'ZF'.strtoupper(Str::random(8));
        } while (PendingPayment::where('code', $code)->exists());

        $payment = PendingPayment::create([
            'user_id' => $user->id,
            'code' => $code,
            'plan_id' => $request->input('plan_id'),
            'cycle' => $request->input('cycle'),
            'amount' => $request->input('amount'),
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'payment' => $payment,
            'bank' => [
                'name' => 'Ngân hàng TMCP Ngoại thương Việt Nam (Vietcombank)',
                'code' => 'VCB',
                'account_number' => '1002202688888',
                'account_name' => 'CONG TY CO PHAN ZEFLYO',
            ],
        ]);
    }

    /**
     * Handle incoming SePay Webhook.
     */
    public function handleSePayWebhook(Request $request)
    {
        $code = $request->input('code') ?? $request->input('content') ?? $request->input('description');
        $amount = $request->input('amount') ?? $request->input('transferAmount');

        if (! $code) {
            return response()->json([
                'success' => false,
                'message' => 'Transaction code is missing',
            ], 400);
        }

        $code = trim($code);

        // Find the payment
        $payment = PendingPayment::where('code', $code)->first();

        if (! $payment) {
            return response()->json([
                'success' => false,
                'message' => 'Pending payment not found',
            ], 404);
        }

        if ($payment->status === 'completed') {
            return response()->json([
                'success' => true,
                'message' => 'Payment has already been processed successfully',
            ], 200);
        }

        if ($payment->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Payment was already cancelled by the user',
            ], 400);
        }

        if ($payment->status === 'failed') {
            return response()->json([
                'success' => false,
                'message' => 'Payment has failed or timed out',
            ], 400);
        }

        // Check if payment has expired (older than 15 minutes)
        if ($payment->created_at->addMinutes(15)->isPast()) {
            $payment->status = 'failed';
            $payment->save();

            return response()->json([
                'success' => false,
                'message' => 'Payment has expired and is automatically cancelled',
            ], 400);
        }

        // Process status upgrade
        $payment->status = 'completed';
        $payment->save();

        $user = User::find($payment->user_id);
        if ($user) {
            $planId = $payment->plan_id;
            $cycle = $payment->cycle;

            if (in_array($planId, ['basic', 'pro', 'premium'])) {
                $user->subscription_plan = $planId;

                // Expiry calculation
                $months = 1;
                if ($cycle === '3months') {
                    $months = 3;
                } elseif ($cycle === 'yearly') {
                    $months = 12;
                }

                $currentExpiry = $user->subscription_expires_at ? Carbon::parse($user->subscription_expires_at) : null;
                if ($currentExpiry && $currentExpiry->isFuture()) {
                    $newExpiry = $currentExpiry->addMonths($months);
                } else {
                    $newExpiry = Carbon::now()->addMonths($months);
                }
                $user->subscription_expires_at = $newExpiry;

                // Add plan credits
                $creditsToAdd = 0;
                if ($planId === 'basic') {
                    $creditsToAdd = 1000;
                } elseif ($planId === 'pro') {
                    $creditsToAdd = 2900;
                } elseif ($planId === 'premium') {
                    $creditsToAdd = 4300;
                }
                $user->credits += $creditsToAdd;

            } else {
                // Add credits package
                $creditsToAdd = 0;
                if ($planId === 'credit_savings') {
                    $creditsToAdd = 300;
                } elseif ($planId === 'credit_standard') {
                    $creditsToAdd = 700;
                } elseif ($planId === 'credit_premium') {
                    $creditsToAdd = 2000;
                } elseif ($planId === 'credit_enterprise') {
                    $creditsToAdd = 5000;
                }
                $user->credits += $creditsToAdd;
            }

            $user->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Payment processed successfully',
        ]);
    }

    /**
     * Cancel the authenticated user's current subscription.
     */
    public function cancelSubscription(Request $request)
    {
        $user = $request->user();

        $reasons = $request->input('reasons', []);
        $feedback = $request->input('feedback', '');

        // Log the cancellation reasons for analysis
        Log::info("User ID {$user->id} (".($user->email ?? 'unknown').') cancelled subscription.', [
            'reasons' => $reasons,
            'feedback' => $feedback,
            'previous_plan' => $user->subscription_plan,
        ]);

        $user->subscription_plan = 'free';
        $user->subscription_expires_at = null;
        $user->credits = 100;
        $user->last_free_credits_at = Carbon::now($user->timezone ?? 'Asia/Ho_Chi_Minh')->toDateString();
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Subscription cancelled successfully',
            'subscription' => [
                'plan' => 'free',
                'expires_at' => null,
                'credits' => $user->credits,
            ],
        ]);
    }

    /**
     * Get the authenticated user's payment/billing history.
     */
    public function getUserPayments(Request $request)
    {
        $user = $request->user();

        // Auto-cancel pending payments older than 15 minutes
        PendingPayment::where('user_id', $user->id)
            ->where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subMinutes(15))
            ->update(['status' => 'failed']);

        $payments = PendingPayment::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'payments' => $payments,
        ]);
    }

    /**
     * Cancel a specific pending payment.
     */
    public function cancelPendingPayment(Request $request, $id)
    {
        $user = $request->user();
        $payment = PendingPayment::where('id', $id)
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->first();

        if (! $payment) {
            return response()->json([
                'success' => false,
                'message' => 'Pending payment not found',
            ], 404);
        }

        $payment->status = 'cancelled';
        $payment->save();

        return response()->json([
            'success' => true,
            'message' => 'Payment cancelled successfully',
        ]);
    }
}
