<?php

use App\Http\Controllers\Auth\FacebookAuthController;
use App\Http\Controllers\AutoReplyRuleController;
use App\Http\Controllers\AutoSetupController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\FanpageController;
use App\Http\Controllers\FeedbackController;
use App\Http\Controllers\PostSchedulerController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\SystemNotificationController;
use App\Http\Controllers\TopicController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\UserSettingsController;
use App\Http\Controllers\Webhook\FacebookWebhookController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/auth/facebook/callback', [FacebookAuthController::class, 'callback']);
Route::post('/auth/demo', [FacebookAuthController::class, 'demoLogin']);

// Facebook Webhook endpoints (Publicly accessible by Meta)
Route::get('/webhook/facebook', [FacebookWebhookController::class, 'verify']);
Route::post('/webhook/facebook', [FacebookWebhookController::class, 'receive']);
Route::post('/webhook/sepay', [SubscriptionController::class, 'handleSePayWebhook']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // User profile and password APIs
    Route::get('/user/profile', [UserController::class, 'getProfile']);
    Route::put('/user/profile', [UserController::class, 'updateProfile']);
    Route::put('/user/password', [UserController::class, 'updatePassword']);
    Route::post('/user/checkin', [UserController::class, 'checkIn']);

    // File Upload API
    Route::post('/upload', [UploadController::class, 'upload']);

    // Subscription & Plans APIs
    Route::get('/plans', [SubscriptionController::class, 'getPlans']);
    Route::get('/user/subscription', [SubscriptionController::class, 'getSubscription']);
    Route::post('/payments/create', [SubscriptionController::class, 'createPendingPayment']);
    Route::post('/payments/{id}/cancel', [SubscriptionController::class, 'cancelPendingPayment']);
    Route::post('/user/subscription/cancel', [SubscriptionController::class, 'cancelSubscription']);
    Route::get('/user/payments', [SubscriptionController::class, 'getUserPayments']);

    Route::get('/fanpages', [FanpageController::class, 'index']);
    Route::post('/fanpages/{fanpage}/toggle', [FanpageController::class, 'toggleActive']);

    // Live Chat Hub APIs
    Route::get('/conversations', [ChatController::class, 'index']);
    Route::get('/conversations/{customer}/messages', [ChatController::class, 'messages']);
    Route::post('/conversations/{customer}/messages', [ChatController::class, 'send']);
    Route::post('/customers/{customer}/toggle-ai', [ChatController::class, 'toggleAi']);

    // Post Scheduler APIs
    Route::get('/posts/schedule', [PostSchedulerController::class, 'index']);
    Route::post('/posts/schedule', [PostSchedulerController::class, 'store']);
    Route::delete('/posts/schedule/{id}', [PostSchedulerController::class, 'destroy']);
    Route::post('/posts/generate-ai', [PostSchedulerController::class, 'generateAi']);
    Route::post('/posts/generate-ai-stream', [PostSchedulerController::class, 'generateAiStream'])->middleware('throttle:ai_generator');

    // Auto-Reply Rules APIs
    Route::apiResource('/auto-reply-rules', AutoReplyRuleController::class);

    // Auto-Setup (Campaign) APIs
    Route::get('/auto-setups', [AutoSetupController::class, 'index']);
    Route::post('/auto-setups', [AutoSetupController::class, 'store']);
    Route::get('/auto-setups/{id}', [AutoSetupController::class, 'show']);
    Route::put('/auto-setups/{id}', [AutoSetupController::class, 'update']);
    Route::delete('/auto-setups/{id}', [AutoSetupController::class, 'destroy']);
    Route::post('/auto-setups/{id}/toggle', [AutoSetupController::class, 'toggle']);

    // Topic APIs (under auto-setups)
    Route::get('/auto-setups/{id}/topics', [TopicController::class, 'index']);
    Route::post('/auto-setups/{id}/topics', [TopicController::class, 'store']);
    Route::post('/auto-setups/{id}/generate-topics', [TopicController::class, 'generateTopics']);
    Route::delete('/topics/{id}', [TopicController::class, 'destroy']);
    Route::put('/topics/{id}', [TopicController::class, 'update']);
    Route::post('/topics/{id}/approve', [TopicController::class, 'approve']);

    // Product APIs
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/products', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);
    Route::post('/products/reorder', [ProductController::class, 'reorder']);

    // User settings and feedback APIs
    Route::put('/user/language', [UserSettingsController::class, 'updateLanguage']);
    Route::post('/feedback', [FeedbackController::class, 'store'])->middleware('throttle:5,1');

    // General Upload API
    Route::post('/upload', [UploadController::class, 'upload']);

    // System Notifications APIs
    Route::get('/notifications', [SystemNotificationController::class, 'index']);
    Route::post('/admin/notifications', [SystemNotificationController::class, 'store']);
    Route::delete('/admin/notifications/{id}', [SystemNotificationController::class, 'destroy']);
});
