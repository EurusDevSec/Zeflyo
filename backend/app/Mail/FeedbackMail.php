<?php

namespace App\Mail;

use App\Models\Feedback;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class FeedbackMail extends Mailable
{
    use Queueable, SerializesModels;

    public Feedback $feedback;

    public function __construct(Feedback $feedback)
    {
        $this->feedback = $feedback;
    }

    public function build()
    {
        return $this->subject("[Zeflyo Feedback {$this->feedback->type}]: {$this->feedback->title}")
            ->view('emails.feedback')
            ->with([
                'feedback' => $this->feedback,
            ]);
    }
}
