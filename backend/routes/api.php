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

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

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
});

