<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Customer;
use App\Models\Interaction;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    /**
     * Display a listing of active conversations.
     */
    public function index(Request $request)
    {
        $fanpageIds = $request->user()->fanpages()->pluck('id');
        
        if ($request->has('fanpage_id')) {
            $fanpageIds = [$request->input('fanpage_id')];
        }

        // Fetch customers and sort by the latest interaction timestamp using a subquery
        $customers = Customer::whereIn('fanpage_id', $fanpageIds)
            ->select('customers.*')
            ->selectSub(function ($query) {
                $query->select('created_at')
                    ->from('interactions')
                    ->whereColumn('customer_id', 'customers.id')
                    ->latest()
                    ->limit(1);
            }, 'last_interaction_time')
            ->orderByDesc('last_interaction_time')
            ->with('fanpage')
            ->get();

        $response = $customers->map(function ($customer) {
            $lastInteraction = $customer->interactions()->latest()->first();
            return [
                'customer_id' => $customer->id,
                'customer_name' => $customer->name ?? 'Facebook User',
                'customer_avatar' => $customer->avatar_url,
                'ai_active' => $customer->ai_active,
                'fanpage_id' => $customer->fanpage_id,
                'fanpage_name' => $customer->fanpage->name ?? '',
                'last_interaction' => $lastInteraction ? [
                    'type' => $lastInteraction->type,
                    'content' => $lastInteraction->content,
                    'created_at' => $lastInteraction->created_at->toIso8601String(),
                    'is_from_customer' => $lastInteraction->is_from_customer,
                ] : null
            ];
        });

        return response()->json($response);
    }

    /**
     * Display the message history for a specific customer.
     */
    public function messages(Request $request, $customerId)
    {
        $customer = Customer::findOrFail($customerId);

        // Verify the user owns the page this customer belongs to
        if (!$request->user()->fanpages()->where('id', $customer->fanpage_id)->exists()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $messages = $customer->interactions()
            ->orderBy('created_at', 'asc')
            ->paginate(50);

        return response()->json($messages);
    }

    /**
     * Send a response message to the customer from the Admin.
     */
    public function send(Request $request, $customerId)
    {
        $request->validate([
            'content' => 'required|string',
        ]);

        $customer = Customer::findOrFail($customerId);
        $fanpage = $customer->fanpage;

        // Verify the user owns this fanpage
        if (!$request->user()->fanpages()->where('id', $fanpage->id)->exists()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Generate a unique FB message ID for tracking
        $fbMessageId = 'outbound.' . uniqid() . '.' . time();

        // 1. Save the interaction in database
        $interaction = Interaction::create([
            'customer_id' => $customer->id,
            'fanpage_id' => $fanpage->id,
            'type' => 'message',
            'fb_item_id' => $fbMessageId,
            'content' => $request->input('content'),
            'is_from_customer' => false,
        ]);

        // 2. Call Facebook Graph API to send the message
        $success = $this->sendFacebookMessage($customer->fb_customer_id, $interaction->content, $fanpage);

        // 3. Broadcast the event to other connected clients
        broadcast(new \App\Events\MessageSent($interaction, $customer))->toOthers();

        return response()->json([
            'status' => 'success',
            'interaction' => $interaction,
            'fb_sent' => $success
        ]);
    }

    /**
     * Execute HTTP POST call to Meta Graph API Send API.
     */
    protected function sendFacebookMessage(string $recipientPsid, string $text, $fanpage): bool
    {
        try {
            $pageToken = $fanpage->access_token; // Automatically decrypted

            // If it is the local mock token, bypass Facebook request and mock success
            // mock_page_token_123 is used for test purpose only
            if ($pageToken === 'mock_page_token_123') {
                Log::info("Mock Facebook Message Sent: To={$recipientPsid}, Msg=\"{$text}\"");
                return true;
            }

            $response = Http::post("https://graph.facebook.com/v20.0/me/messages", [
                'recipient' => ['id' => $recipientPsid],
                'message' => ['text' => $text],
                'access_token' => $pageToken
            ]);

            if ($response->successful()) {
                Log::info("Facebook Message Sent successfully to PSID: {$recipientPsid}");
                return true;
            }

            Log::error("Facebook Send Message API failed: " . $response->body());
            return false;
        } catch (\Exception $e) {
            Log::error("Exception in Facebook Send Message API: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Toggle the AI auto-reply status of a customer.
     */
    public function toggleAi(Request $request, $customerId)
    {
        $customer = Customer::findOrFail($customerId);

        // Verify the user owns the page this customer belongs to
        if (!$request->user()->fanpages()->where('id', $customer->fanpage_id)->exists()) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        $customer->ai_active = !$customer->ai_active;
        $customer->save();

        return response()->json([
            'status' => 'success',
            'ai_active' => $customer->ai_active
        ]);
    }
}
