<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['fanpage_id', 'fb_customer_id', 'name', 'avatar_url', 'ai_active'])]
class Customer extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'ai_active' => 'boolean',
        ];
    }

    /**
     * Get the fanpage that owns the customer.
     */
    public function fanpage(): BelongsTo
    {
        return $this->belongsTo(Fanpage::class);
    }

    /**
     * Get the interactions for the customer.
     */
    public function interactions(): HasMany
    {
        return $this->hasMany(Interaction::class);
    }
}
