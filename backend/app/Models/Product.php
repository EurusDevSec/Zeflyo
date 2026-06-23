<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id', 'name', 'description', 'image_urls', 'comment',
    'auto_post_enabled', 'sort_order'
])]
class Product extends Model
{
    protected function casts(): array
    {
        return [
            'image_urls' => 'array',
            'auto_post_enabled' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
