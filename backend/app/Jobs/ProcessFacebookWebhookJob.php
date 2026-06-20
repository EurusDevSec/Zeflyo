<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

use App\Events\MessageSent;
use App\Models\AutoReplyRule;
use App\Models\Customer;
use App\Models\Fanpage;
use App\Models\Interaction;
use App\Services\GeminiService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

// Nhận payload webhook từ Facebook, xử lý và lưu trữ tương tác, đồng thời gửi phản hồi tự động nếu cần thiết
class ProcessFacebookWebhookJob implements ShouldQueue
{
    use Queueable;

    protected array $payload;

    /**
     * Create a new job instance.
     */
    public function __construct(array $payload)
    {
        $this->payload = $payload;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info('Processing Facebook Webhook Job...', ['payload_keys' => array_keys($this->payload)]);

        // Verify the object type is 'page'
        if (($this->payload['object'] ?? '') !== 'page') {
            Log::warning('Unsupported webhook object type:', ['object' => $this->payload['object'] ?? null]);
            return;
        }

        $entries = $this->payload['entry'] ?? [];

        foreach ($entries as $entry) {
            $fbPageId = $entry['id'] ?? null;
            if (!$fbPageId) continue;

            // Find the corresponding Fanpage in our database
            $fanpage = Fanpage::where('fb_page_id', $fbPageId)->first();

            if (!$fanpage) {
                Log::warning("Received webhook event for untracked Fanpage: {$fbPageId}");
                continue;
            }

            // Only process events if automation is active for this page
            if (!$fanpage->is_active) {
                Log::info("Automation is disabled for Fanpage: {$fanpage->name} ({$fbPageId}). Skipping.");
                continue;
            }

            // 1. Process Messenger Messages
            if (isset($entry['messaging'])) {
                $this->processMessaging($entry['messaging'], $fanpage);
            }

            // 2. Process Page Feed Changes (Comments)
            if (isset($entry['changes'])) {
                $this->processChanges($entry['changes'], $fanpage);
            }
        }
    }

    /**
     * Process Messenger messaging events.
     */
    protected function processMessaging(array $messagingEvents, Fanpage $fanpage): void
    {
        foreach ($messagingEvents as $event) {
            // We only care about message text events from customers
            $senderId = $event['sender']['id'] ?? null; //giá trị có thể nhận null
            $recipientId = $event['recipient']['id'] ?? null; //giá trị có thể nhận null
            
            // If sender is the page itself, it's an outgoing response (we can log it as page response)
            $isFromCustomer = ($senderId !== $fanpage->fb_page_id);
            
            $message = $event['message'] ?? null;
            if (!$message || !isset($message['text'])) {
                continue;
            }

            $fbMessageId = $message['mid'] ?? null;
            $text = $message['text'];

            // Find or create customer
            $customerPsid = $isFromCustomer ? $senderId : $recipientId;
            if (!$customerPsid) continue;

            $customer = $this->getOrCreateCustomer($customerPsid, $fanpage);

            // Save interaction in DB
            $interaction = Interaction::updateOrCreate(
                ['fb_item_id' => $fbMessageId],
                [
                    'customer_id' => $customer->id,
                    'fanpage_id' => $fanpage->id,
                    'type' => 'message',
                    'content' => $text,
                    'is_from_customer' => $isFromCustomer,
                ]
            );

            // Broadcast the new message event in real-time
            // broadcast(...) trả về PendingBroadcast()->toOthers()
            broadcast(new \App\Events\MessageReceived($interaction, $customer))->toOthers();

            Log::info("Saved Messenger interaction in DB. From Customer: " . ($isFromCustomer ? 'Yes' : 'No'));

            if ($isFromCustomer) {
                $this->handleAutoReply($text, $customer, $fanpage, $senderId);
            }
        }
    }

    /**
     * Handle auto-reply for customer messenger messages.
     */
    protected function handleAutoReply(string $customerMessage, Customer $customer, Fanpage $fanpage, string $senderId): void
    {
        $replyText = null;
        $replySource = null;

        $trimmedMessage = trim($customerMessage);
        if ($trimmedMessage === '') {
            return;
        }

        $rules = AutoReplyRule::where('fanpage_id', $fanpage->id)
            ->where('is_active', true)
            ->get();

        foreach ($rules as $rule) {
            if (stripos($trimmedMessage, $rule->keyword) !== false) {
                // Content the reply message take from auto_reply_rules record 
                $replyText = $rule->reply_content;
                $replySource = 'keyword';
                break;
            }
        }

        //When user message does not match any keyword on auto_reply_rules and AI is active for the customer, call Gemini API to generate reply
        if ($replyText === null && $customer->ai_active) {
            $systemPrompt = 'Bạn là trợ lý AI của cửa hàng thời trang. Hãy trả lời khách hàng một cách lịch sự, ngắn gọn, chuyên nghiệp. Nếu khách hỏi về giá hoặc sản phẩm cụ thể mà bạn không biết, hãy mời khách để lại thông tin và nhân viên sẽ liên hệ lại. Trả lời bằng tiếng Việt. Đặc biệt, không được bịa bất cứ thông tin nào về giá cả, sản phẩm nếu bạn không chắc chắn.';
            $replyText = (new GeminiService())->generateReply($trimmedMessage, $systemPrompt);
            $replySource = $replyText ? 'ai' : null;
        }

        if ($replyText === null) {
            Log::info('No auto-reply generated for message.', ['customer_id' => $customer->id, 'fanpage_id' => $fanpage->id]);
            return;
        }

        $replyInteraction = Interaction::create([
            'customer_id' => $customer->id,
            'fanpage_id' => $fanpage->id,
            'type' => 'message',
            'fb_item_id' => 'outbound.' . uniqid() . '.' . time(),
            'content' => $replyText,
            'is_from_customer' => false,
            'reply_source' => $replySource,
        ]);

        $sent = $this->sendFacebookReply($customer->fb_customer_id, $replyText, $fanpage);
        if (!$sent) {
            Log::warning('Auto-reply failed to send to Facebook.', [
                'customer_id' => $customer->id,
                'fanpage_id' => $fanpage->id,
                'reply_source' => $replySource,
            ]);
        }

        broadcast(new MessageSent($replyInteraction, $customer))->toOthers();
    }

    protected function sendFacebookReply(string $recipientPsid, string $text, Fanpage $fanpage): bool
    {
        try {
            $pageToken = $fanpage->access_token;

            if ($pageToken === 'mock_page_token_123') {
                Log::info("Mock Facebook reply sent: To={$recipientPsid}, Msg=\"{$text}\"");
                return true;
            }

            $response = Http::post("https://graph.facebook.com/v20.0/me/messages", [
                'recipient' => ['id' => $recipientPsid],
                'message' => ['text' => $text],
                'access_token' => $pageToken,
            ]);

            if ($response->successful()) {
                Log::info("Facebook auto-reply sent successfully to PSID: {$recipientPsid}");
                return true;
            }

            Log::error('Facebook auto-reply API failed.', ['body' => $response->body()]);
            return false;
        } catch (\Exception $e) {
            Log::error('Exception in Facebook auto-reply API.', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Process page feed changes (Comments).
     */
    protected function processChanges(array $changes, Fanpage $fanpage): void
    {
        foreach ($changes as $change) {
            if (($change['field'] ?? '') !== 'feed') continue;

            $value = $change['value'] ?? null;
            if (!$value || ($value['item'] ?? '') !== 'comment' || ($value['verb'] ?? '') !== 'add') {
                continue;
            }

            $commentId = $value['comment_id'] ?? null;
            $postId = $value['post_id'] ?? null;
            $message = $value['message'] ?? null;
            $from = $value['from'] ?? null;

            if (!$commentId || !$message || !$from) continue;

            $senderId = $from['id'] ?? null;
            $senderName = $from['name'] ?? 'Guest';

            // Ignore if comment is made by the page itself to prevent infinite loops
            $isFromCustomer = ($senderId !== $fanpage->fb_page_id);
            if (!$isFromCustomer) continue;

            // Get or create customer
            $customer = $this->getOrCreateCustomer($senderId, $fanpage, $senderName);

            // Save interaction in DB
            $interaction = Interaction::updateOrCreate(
                ['fb_item_id' => $commentId],
                [
                    'customer_id' => $customer->id,
                    'fanpage_id' => $fanpage->id,
                    'type' => 'comment',
                    'fb_post_id' => $postId,
                    'content' => $message,
                    'is_from_customer' => true,
                ]
            );

            // Broadcast the new comment event in real-time
            broadcast(new \App\Events\MessageReceived($interaction, $customer))->toOthers();

            Log::info("Saved Fanpage Comment interaction in DB: {$senderName} - \"{$message}\"");
        }
    }

    /**
     * Get existing customer or create a new one, fetching Facebook profile info asynchronously.
     */
    protected function getOrCreateCustomer(string $psid, Fanpage $fanpage, string $defaultName = 'Facebook User'): Customer
    {
        $customer = Customer::where('fanpage_id', $fanpage->id)
            ->where('fb_customer_id', $psid)
            ->first();

        if ($customer) {
            return $customer;
        }

        // If not exists, create customer and fetch profile from Meta Graph API
        $name = $defaultName;
        $avatarUrl = null;

        try {
            // Page access token is auto-decrypted via Eloquent cast
            $pageToken = $fanpage->access_token;
            
            $response = Http::get("https://graph.facebook.com/v20.0/{$psid}", [
                'fields' => 'first_name,last_name,profile_pic',
                'access_token' => $pageToken
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $firstName = $data['first_name'] ?? '';
                $lastName = $data['last_name'] ?? '';
                $name = trim("{$firstName} {$lastName}") ?: $defaultName;
                $avatarUrl = $data['profile_pic'] ?? null;
            }
        } catch (\Exception $e) {
            Log::error("Failed to fetch customer profile info from Meta Graph API for PSID: {$psid}", [
                'error' => $e->getMessage()
            ]);
        }

        return Customer::create([
            'fanpage_id' => $fanpage->id,
            'fb_customer_id' => $psid,
            'name' => $name,
            'avatar_url' => $avatarUrl
        ]);
    }
}
