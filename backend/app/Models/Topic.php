<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id', 'auto_setup_id', 'title', 'status', 'generated_content',
    'generated_image_url', 'fb_post_id', 'error_log', 'sort_order'
])]
class Topic extends Model
{
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function autoSetup(): BelongsTo
    {
        return $this->belongsTo(AutoSetup::class);
    }
}
