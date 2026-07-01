<?php

namespace App\Http\Controllers\Webhook;

use App\Http\Controllers\Controller;
use App\Jobs\ProcessFacebookWebhookJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FacebookWebhookController extends Controller
{
    /**
     * Handle Facebook Webhook verification handshake (GET).
     */
    public function verify(Request $request)
    {
        $mode = $request->query('hub_mode');
        $token = $request->query('hub_verify_token');
        $challenge = $request->query('hub_challenge');

        $configuredToken = config('services.facebook.webhook_verify_token');

        if ($mode === 'subscribe' && $token === $configuredToken) {
            Log::info('Facebook Webhook verified successfully.');

            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        Log::warning('Facebook Webhook verification failed.', [
            'mode' => $mode,
            'token' => $token,
        ]);

        return response('Forbidden', 403);
    }

    /**
     * Handle incoming Facebook Webhook payload (POST).
     */
    public function receive(Request $request)
    {
        $payload = $request->all();

        // Log the raw event for debugging
        Log::debug('Facebook Webhook raw payload received:', $payload);

        // Dispatch job to Redis Queue for async processing
        ProcessFacebookWebhookJob::dispatch($payload);

        // Meta requires an immediate 200 OK response within 3 seconds
        return response('EVENT_RECEIVED', 200);
    }
}
