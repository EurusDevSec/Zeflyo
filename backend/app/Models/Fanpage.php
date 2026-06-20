<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Models\AutoReplyRule;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'fb_page_id', 'name', 'access_token', 'avatar_url', 'is_active'])]
class Fanpage extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'access_token' => 'encrypted',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the user that owns the fanpage.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the auto reply rules for the fanpage.
     */
    public function autoReplyRules(): HasMany
    {
        return $this->hasMany(AutoReplyRule::class);
    }
}
