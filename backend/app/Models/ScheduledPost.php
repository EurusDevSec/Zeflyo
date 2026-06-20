<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['user_id', 'fanpage_ids', 'content', 'image_url', 'scheduled_at', 'status', 'error_log'])]
class ScheduledPost extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fanpage_ids' => 'array',
            'scheduled_at' => 'datetime',
        ];
    }

    /**
     * Get the user that created the scheduled post.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
