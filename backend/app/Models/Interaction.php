<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['customer_id', 'fanpage_id', 'type', 'fb_item_id', 'fb_post_id', 'content', 'is_from_customer', 'reply_source'])]
class Interaction extends Model
{
    /**
     * Get the customer that owns the interaction.
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get the fanpage associated with the interaction.
     */
    public function fanpage(): BelongsTo
    {
        return $this->belongsTo(Fanpage::class);
    }
}
