<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id', 'name', 'source_type', 'fanpage_ids', 'language', 'post_length',
    'writing_style', 'custom_prompt', 'use_fanpage_info', 'include_contact',
    'contact_info', 'schedule_mode', 'schedule_days', 'schedule_date',
    'schedule_times', 'auto_post', 'auto_repeat', 'publish_mode',
    'auto_comment', 'status'
])]
class AutoSetup extends Model
{
    protected function casts(): array
    {
        return [
            'fanpage_ids' => 'array',
            'schedule_days' => 'array',
            'schedule_times' => 'array',
            'schedule_date' => 'date',
            'use_fanpage_info' => 'boolean',
            'include_contact' => 'boolean',
            'auto_post' => 'boolean',
            'auto_repeat' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class)->orderBy('sort_order');
    }

    /**
     * Get the next pending topic to process.
     */
    public function nextPendingTopic(): ?Topic
    {
        return $this->topics()->where('status', 'pending')->orderBy('sort_order')->first();
    }

    /**
     * Check if all topics have been processed (published or failed).
     */
    public function allTopicsProcessed(): bool
    {
        return $this->topics()->whereIn('status', ['pending', 'generated'])->count() === 0;
    }
}
