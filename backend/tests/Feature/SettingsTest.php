<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\PendingPayment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_get_user_profile(): void
    {
        $user = User::factory()->create([
            'display_name' => 'John Doe Display',
            'timezone' => 'Asia/Ho_Chi_Minh',
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/user/profile');

        $response->assertStatus(200)
            ->assertJson([
                'id' => $user->uid ?? $user->id,
                'name' => $user->name,
                'display_name' => 'John Doe Display',
                'email' => $user->email,
                'avatar_url' => null,
                'timezone' => 'Asia/Ho_Chi_Minh',
            ]);
    }

    public function test_can_update_user_profile(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->putJson('/api/user/profile', [
                'display_name' => 'Updated Name',
                'timezone' => 'Europe/London',
                'avatar_url' => 'https://example.com/avatar.png'
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'display_name' => 'Updated Name',
            'timezone' => 'Europe/London',
            'avatar_url' => 'https://example.com/avatar.png'
        ]);
    }

    public function test_can_update_user_password(): void
    {
        $user = User::factory()->create([
            'password' => Hash::make('old_password123'),
        ]);

        // Wrong current password
        $response = $this->actingAs($user)
            ->putJson('/api/user/password', [
                'current_password' => 'wrong_password',
                'password' => 'new_password123',
                'password_confirmation' => 'new_password123',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);

        // Correct current password
        $response = $this->actingAs($user)
            ->putJson('/api/user/password', [
                'current_password' => 'old_password123',
                'password' => 'new_password123',
                'password_confirmation' => 'new_password123',
            ]);

        $response->assertStatus(200);
        $this->assertTrue(Hash::check('new_password123', $user->fresh()->password));
    }

    public function test_can_upload_file(): void
    {
        Storage::fake('public');

        $user = User::factory()->create();
        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->actingAs($user)
            ->postJson('/api/upload', [
                'file' => $file
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['url', 'message']);

        $url = $response->json('url');
        $path = str_replace(asset('storage/'), '', $url);
        Storage::disk('public')->assertExists($path);
    }

    public function test_can_get_plans(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/plans');

        $response->assertStatus(200)
            ->assertJsonCount(4);
    }

    public function test_can_get_subscription(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/user/subscription');

        $response->assertStatus(200)
            ->assertJson([
                'plan' => 'free',
                'expires_at' => null
            ]);
    }

    public function test_can_create_pending_payment(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/payments/create', [
                'plan_id' => 'basic',
                'cycle' => 'monthly',
                'amount' => 79000
            ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'payment' => [
                    'id', 'user_id', 'code', 'plan_id', 'cycle', 'amount', 'status'
                ],
                'bank' => [
                    'name', 'code', 'account_number', 'account_name'
                ]
            ]);

        $this->assertDatabaseHas('pending_payments', [
            'user_id' => $user->id,
            'plan_id' => 'basic',
            'amount' => 79000,
            'status' => 'pending'
        ]);
    }

    public function test_can_handle_sepay_webhook_for_plan(): void
    {
        $user = User::factory()->create(['credits' => 50]);
        $payment = \App\Models\PendingPayment::create([
            'user_id' => $user->id,
            'code' => 'ZFTESTCODE1',
            'plan_id' => 'basic',
            'cycle' => 'monthly',
            'amount' => 79000,
            'status' => 'pending'
        ]);

        $response = $this->postJson('/api/webhook/sepay', [
            'code' => 'ZFTESTCODE1',
            'amount' => 79000
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('pending_payments', [
            'code' => 'ZFTESTCODE1',
            'status' => 'completed'
        ]);

        $user->refresh();
        $this->assertEquals('basic', $user->subscription_plan);
        $this->assertEquals(1050, $user->credits); // 1000 + 50
        $this->assertNotNull($user->subscription_expires_at);
    }

    public function test_can_cancel_subscription(): void
    {
        $user = User::factory()->create([
            'subscription_plan' => 'pro',
            'subscription_expires_at' => now()->addMonth()
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/user/subscription/cancel', [
                'reasons' => ['Giá quá cao', 'Khó sử dụng'],
                'feedback' => 'Test feedback'
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Subscription cancelled successfully',
                'subscription' => [
                    'plan' => 'free',
                    'expires_at' => null
                ]
            ]);

        $user->refresh();
        $this->assertEquals('free', $user->subscription_plan);
        $this->assertNull($user->subscription_expires_at);
    }

    public function test_can_get_user_payments(): void
    {
        $user = User::factory()->create();
        PendingPayment::create([
            'user_id' => $user->id,
            'code' => 'ZFTESTPAYMENT1',
            'plan_id' => 'pro',
            'cycle' => 'monthly',
            'amount' => 179000,
            'status' => 'completed'
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/user/payments');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ])
            ->assertJsonFragment([
                'code' => 'ZFTESTPAYMENT1',
                'amount' => 179000,
                'status' => 'completed'
            ]);
    }

    public function test_sepay_webhook_fails_if_payment_expired(): void
    {
        $user = User::factory()->create();
        $payment = PendingPayment::create([
            'user_id' => $user->id,
            'code' => 'ZFEXPIRED1',
            'plan_id' => 'pro',
            'cycle' => 'monthly',
            'amount' => 179000,
            'status' => 'pending'
        ]);
        
        // Manipulate created_at time to be 16 minutes in the past
        $payment->created_at = now()->subMinutes(16);
        $payment->save();

        $response = $this->postJson('/api/webhook/sepay', [
            'code' => 'ZFEXPIRED1',
            'amount' => 179000
        ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Payment has expired and is automatically cancelled'
            ]);

        $payment->refresh();
        $this->assertEquals('failed', $payment->status);
    }

    public function test_user_payments_auto_cancel_expired(): void
    {
        $user = User::factory()->create();
        $payment = PendingPayment::create([
            'user_id' => $user->id,
            'code' => 'ZFEXPIRED2',
            'plan_id' => 'basic',
            'cycle' => 'monthly',
            'amount' => 79000,
            'status' => 'pending'
        ]);
        
        // Manipulate created_at time to be 16 minutes in the past
        $payment->created_at = now()->subMinutes(16);
        $payment->save();

        $response = $this->actingAs($user)
            ->getJson('/api/user/payments');

        $response->assertStatus(200);
        
        $this->assertDatabaseHas('pending_payments', [
            'code' => 'ZFEXPIRED2',
            'status' => 'failed'
        ]);
    }

    public function test_can_cancel_pending_payment(): void
    {
        $user = User::factory()->create();
        $payment = PendingPayment::create([
            'user_id' => $user->id,
            'code' => 'ZFCANCEL1',
            'plan_id' => 'pro',
            'cycle' => 'monthly',
            'amount' => 179000,
            'status' => 'pending'
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/payments/{$payment->id}/cancel");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Payment cancelled successfully'
            ]);

        $this->assertDatabaseHas('pending_payments', [
            'id' => $payment->id,
            'status' => 'cancelled'
        ]);
    }

    public function test_user_can_checkin_and_claim_credits(): void
    {
        $user = User::factory()->create([
            'credits' => 10,
            'last_checkin_at' => null,
            'timezone' => 'Asia/Ho_Chi_Minh',
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/user/checkin');

        $response->assertStatus(200)
            ->assertJsonPath('user.credits', 60);

        $user->refresh();
        $this->assertEquals(60, $user->credits);
        $this->assertNotNull($user->last_checkin_at);

        $timezone = $user->timezone ?? 'Asia/Ho_Chi_Minh';
        $todayString = \Carbon\Carbon::now($timezone)->format('Y-m-d');

        $this->assertDatabaseHas('user_checkins', [
            'user_id' => $user->id,
            'checkin_date' => $todayString,
        ]);
        
        $this->assertContains($todayString, $response->json('user.checkin_history'));
    }

    public function test_user_cannot_checkin_twice_on_same_day(): void
    {
        $user = User::factory()->create([
            'credits' => 10,
            'last_checkin_at' => null,
            'timezone' => 'Asia/Ho_Chi_Minh',
        ]);

        $timezone = $user->timezone ?? 'Asia/Ho_Chi_Minh';
        $todayString = \Carbon\Carbon::now($timezone)->format('Y-m-d');

        $user->checkins()->create([
            'checkin_date' => $todayString,
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/user/checkin');

        $response->assertStatus(400)
            ->assertJsonValidationErrors(['checkin']);

        $user->refresh();
        $this->assertEquals(10, $user->credits);
    }

    public function test_user_can_fetch_notifications(): void
    {
        $user = User::factory()->create();
        \App\Models\SystemNotification::create([
            'category' => 'feature',
            'title_vi' => 'Thông báo kiểm tra',
            'title_en' => 'Test Notification',
            'snippet_vi' => 'Đoạn trích kiểm tra',
            'snippet_en' => 'Test snippet',
            'pinned' => true,
            'blocks_vi' => [['type' => 'paragraph', 'text' => 'Xin chào']],
            'blocks_en' => [['type' => 'paragraph', 'text' => 'Hello']],
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/notifications');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment([
                'title_vi' => 'Thông báo kiểm tra',
                'title_en' => 'Test Notification',
            ]);
    }

    public function test_admin_can_create_notification(): void
    {
        $admin = User::factory()->create(['email' => 'admin@zeflyo.io']);

        $response = $this->actingAs($admin)
            ->postJson('/api/admin/notifications', [
                'category' => 'update',
                'title_vi' => 'Bản cập nhật lớn',
                'title_en' => 'Major update',
                'snippet_vi' => 'Nhiều tính năng mới',
                'snippet_en' => 'Many new features',
                'pinned' => false,
                'blocks_vi' => [['type' => 'paragraph', 'text' => 'Cập nhật']],
                'blocks_en' => [['type' => 'paragraph', 'text' => 'Update']],
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('system_notifications', [
            'title_vi' => 'Bản cập nhật lớn',
            'category' => 'update',
        ]);
    }

    public function test_regular_user_cannot_create_notification(): void
    {
        $user = User::factory()->create(['email' => 'regular@zeflyo.io']);

        $response = $this->actingAs($user)
            ->postJson('/api/admin/notifications', [
                'category' => 'update',
                'title_vi' => 'Bản cập nhật lớn',
                'title_en' => 'Major update',
                'snippet_vi' => 'Nhiều tính năng mới',
                'snippet_en' => 'Many new features',
                'blocks_vi' => [['type' => 'paragraph', 'text' => 'Cập nhật']],
                'blocks_en' => [['type' => 'paragraph', 'text' => 'Update']],
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_delete_notification(): void
    {
        $admin = User::factory()->create(['email' => 'admin@zeflyo.io']);
        $notif = \App\Models\SystemNotification::create([
            'category' => 'info',
            'title_vi' => 'Xoá tôi đi',
            'title_en' => 'Delete me',
            'snippet_vi' => 'Mô tả',
            'snippet_en' => 'Description',
            'blocks_vi' => [],
            'blocks_en' => [],
        ]);

        $response = $this->actingAs($admin)
            ->deleteJson("/api/admin/notifications/{$notif->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('system_notifications', [
            'id' => $notif->id,
        ]);
    }

    public function test_free_tier_user_gets_100_daily_credits_automatically(): void
    {
        $user = User::factory()->create([
            'subscription_plan' => 'free',
            'credits' => 10,
            'last_free_credits_at' => null,
            'timezone' => 'Asia/Ho_Chi_Minh',
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/user/profile');

        $response->assertStatus(200)
            ->assertJsonPath('credits', 110);

        $user->refresh();
        $this->assertEquals(110, $user->credits);
        $this->assertEquals(now('Asia/Ho_Chi_Minh')->toDateString(), $user->last_free_credits_at);
    }

    public function test_free_tier_user_no_duplicate_daily_credits(): void
    {
        $today = now('Asia/Ho_Chi_Minh')->toDateString();
        $user = User::factory()->create([
            'subscription_plan' => 'free',
            'credits' => 10,
            'last_free_credits_at' => $today,
            'timezone' => 'Asia/Ho_Chi_Minh',
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/user/profile');

        $response->assertStatus(200)
            ->assertJsonPath('credits', 10);

        $user->refresh();
        $this->assertEquals(10, $user->credits);
    }

    public function test_subscription_cancel_sets_last_free_credits_at_timestamp(): void
    {
        $user = User::factory()->create([
            'subscription_plan' => 'pro',
            'subscription_expires_at' => now()->addMonth(),
            'credits' => 20,
            'last_free_credits_at' => null,
            'timezone' => 'Asia/Ho_Chi_Minh',
        ]);

        $response = $this->actingAs($user)
            ->postJson('/api/user/subscription/cancel', [
                'reasons' => ['Feedback'],
                'feedback' => 'Test',
            ]);

        $response->assertStatus(200);

        $user->refresh();
        $this->assertEquals('free', $user->subscription_plan);
        $this->assertEquals(100, $user->credits);
        $this->assertEquals(now('Asia/Ho_Chi_Minh')->toDateString(), $user->last_free_credits_at);
    }

    public function test_can_update_user_language(): void
    {
        $user = User::factory()->create(['language' => 'vi']);

        $response = $this->actingAs($user)
            ->putJson('/api/user/language', [
                'language' => 'en'
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'message' => 'Language updated',
                'language' => 'en'
            ]);

        $this->assertEquals('en', $user->fresh()->language);
    }

    public function test_update_user_language_validation_error(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->putJson('/api/user/language', [
                'language' => 'ru'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['language']);
    }

    public function test_can_submit_feedback(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/feedback', [
                'type' => 'bug',
                'title' => 'Test bug',
                'content' => 'Test content details',
                'contact_email' => 'contact@test.com'
            ]);

        $response->assertStatus(201)
            ->assertJson([
                'message' => 'Feedback submitted successfully'
            ]);

        $this->assertDatabaseHas('feedbacks', [
            'user_id' => $user->id,
            'type' => 'bug',
            'title' => 'Test bug',
            'content' => 'Test content details',
            'contact_email' => 'contact@test.com'
        ]);
    }

    public function test_submit_feedback_validation_error(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/feedback', [
                'type' => 'invalid_type',
                'title' => '',
                'content' => ''
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['type', 'title', 'content']);
    }

    public function test_feedback_route_rate_limiting(): void
    {
        $user = User::factory()->create();

        for ($i = 0; $i < 5; $i++) {
            $response = $this->actingAs($user)
                ->postJson('/api/feedback', [
                    'type' => 'other',
                    'title' => 'Feedback #' . $i,
                    'content' => 'Some feedback text'
                ]);
            $response->assertStatus(201);
        }

        $response = $this->actingAs($user)
            ->postJson('/api/feedback', [
                'type' => 'other',
                'title' => 'Too many requests',
                'content' => 'Rate limit exceeded'
            ]);

        $response->assertStatus(429);
    }
}

