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
}

