<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\FacebookAuthController;
use App\Http\Controllers\FanpageController;
use App\Http\Controllers\Webhook\FacebookWebhookController;

Route::post('/auth/facebook/callback', [FacebookAuthController::class, 'callback']);
Route::post('/auth/demo', [FacebookAuthController::class, 'demoLogin']);

// Facebook Webhook endpoints (Publicly accessible by Meta)
Route::get('/webhook/facebook', [FacebookWebhookController::class, 'verify']);
Route::post('/webhook/facebook', [FacebookWebhookController::class, 'receive']);
Route::post('/webhook/sepay', [\App\Http\Controllers\SubscriptionController::class, 'handleSePayWebhook']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // User profile and password APIs
    Route::get('/user/profile', [\App\Http\Controllers\UserController::class, 'getProfile']);
    Route::put('/user/profile', [\App\Http\Controllers\UserController::class, 'updateProfile']);
    Route::put('/user/password', [\App\Http\Controllers\UserController::class, 'updatePassword']);
    Route::post('/user/checkin', [\App\Http\Controllers\UserController::class, 'checkIn']);

    // File Upload API
    Route::post('/upload', [\App\Http\Controllers\UploadController::class, 'upload']);

    // Subscription & Plans APIs
    Route::get('/plans', [\App\Http\Controllers\SubscriptionController::class, 'getPlans']);
    Route::get('/user/subscription', [\App\Http\Controllers\SubscriptionController::class, 'getSubscription']);
    Route::post('/payments/create', [\App\Http\Controllers\SubscriptionController::class, 'createPendingPayment']);
    Route::post('/payments/{id}/cancel', [\App\Http\Controllers\SubscriptionController::class, 'cancelPendingPayment']);
    Route::post('/user/subscription/cancel', [\App\Http\Controllers\SubscriptionController::class, 'cancelSubscription']);
    Route::get('/user/payments', [\App\Http\Controllers\SubscriptionController::class, 'getUserPayments']);

    Route::get('/fanpages', [FanpageController::class, 'index']);
    Route::post('/fanpages/{fanpage}/toggle', [FanpageController::class, 'toggleActive']);

    // Live Chat Hub APIs
    Route::get('/conversations', [\App\Http\Controllers\ChatController::class, 'index']);
    Route::get('/conversations/{customer}/messages', [\App\Http\Controllers\ChatController::class, 'messages']);
    Route::post('/conversations/{customer}/messages', [\App\Http\Controllers\ChatController::class, 'send']);
    Route::post('/customers/{customer}/toggle-ai', [\App\Http\Controllers\ChatController::class, 'toggleAi']);

    // Post Scheduler APIs
    Route::get('/posts/schedule', [\App\Http\Controllers\PostSchedulerController::class, 'index']);
    Route::post('/posts/schedule', [\App\Http\Controllers\PostSchedulerController::class, 'store']);
    Route::delete('/posts/schedule/{id}', [\App\Http\Controllers\PostSchedulerController::class, 'destroy']);
    Route::post('/posts/generate-ai', [\App\Http\Controllers\PostSchedulerController::class, 'generateAi']);

    // Auto-Reply Rules APIs
    Route::apiResource('/auto-reply-rules', \App\Http\Controllers\AutoReplyRuleController::class);

    // Auto-Setup (Campaign) APIs
    Route::get('/auto-setups', [\App\Http\Controllers\AutoSetupController::class, 'index']);
    Route::post('/auto-setups', [\App\Http\Controllers\AutoSetupController::class, 'store']);
    Route::get('/auto-setups/{id}', [\App\Http\Controllers\AutoSetupController::class, 'show']);
    Route::put('/auto-setups/{id}', [\App\Http\Controllers\AutoSetupController::class, 'update']);
    Route::delete('/auto-setups/{id}', [\App\Http\Controllers\AutoSetupController::class, 'destroy']);
    Route::post('/auto-setups/{id}/toggle', [\App\Http\Controllers\AutoSetupController::class, 'toggle']);

    // Topic APIs (under auto-setups)
    Route::get('/auto-setups/{id}/topics', [\App\Http\Controllers\TopicController::class, 'index']);
    Route::post('/auto-setups/{id}/topics', [\App\Http\Controllers\TopicController::class, 'store']);
    Route::post('/auto-setups/{id}/generate-topics', [\App\Http\Controllers\TopicController::class, 'generateTopics']);
    Route::delete('/topics/{id}', [\App\Http\Controllers\TopicController::class, 'destroy']);
    Route::put('/topics/{id}', [\App\Http\Controllers\TopicController::class, 'update']);
    Route::post('/topics/{id}/approve', [\App\Http\Controllers\TopicController::class, 'approve']);

    // Product APIs
    Route::get('/products', [\App\Http\Controllers\ProductController::class, 'index']);
    Route::post('/products', [\App\Http\Controllers\ProductController::class, 'store']);
    Route::put('/products/{id}', [\App\Http\Controllers\ProductController::class, 'update']);
    Route::delete('/products/{id}', [\App\Http\Controllers\ProductController::class, 'destroy']);
    Route::post('/products/reorder', [\App\Http\Controllers\ProductController::class, 'reorder']);

    // User settings and feedback APIs
    Route::put('/user/language', [\App\Http\Controllers\UserSettingsController::class, 'updateLanguage']);
    Route::post('/feedback', [\App\Http\Controllers\FeedbackController::class, 'store']);

    // General Upload API
    Route::post('/upload', [\App\Http\Controllers\UploadController::class, 'upload']);

    // System Notifications APIs
    Route::get('/notifications', [\App\Http\Controllers\SystemNotificationController::class, 'index']);
    Route::post('/admin/notifications', [\App\Http\Controllers\SystemNotificationController::class, 'store']);
    Route::delete('/admin/notifications/{id}', [\App\Http\Controllers\SystemNotificationController::class, 'destroy']);
});

