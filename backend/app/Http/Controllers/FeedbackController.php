<?php

namespace App\Http\Controllers;

use App\Mail\FeedbackMail;
use App\Models\Feedback;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:bug,suggestion,feature_request,other',
            'title' => 'required|string|max:255',
            'content' => 'required|string|max:1000',
            'image_urls' => 'nullable|array|max:3',
            'image_urls.*' => 'nullable|url',
            'contact_email' => 'nullable|email|max:255',
        ]);

        $feedback = Feedback::create([
            'user_id' => $request->user()->id,
            'type' => $validated['type'],
            'title' => $validated['title'],
            'content' => $validated['content'],
            'image_urls' => $validated['image_urls'] ?? null,
            'contact_email' => $validated['contact_email'] ?? null,
            'status' => 'new',
        ]);

        try {
            Mail::to('team@zeflyo.com')->send(new FeedbackMail($feedback));
        } catch (\Throwable $exception) {
            Log::error('Feedback email send failed', [
                'feedback_id' => $feedback->id,
                'error' => $exception->getMessage(),
            ]);
        }

        return response()->json([
            'message' => 'Feedback submitted successfully',
            'feedback' => $feedback,
        ], 201);
    }
}
