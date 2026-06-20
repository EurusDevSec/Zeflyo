<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['fanpage_id', 'keyword', 'reply_content', 'is_active'])]
class AutoReplyRule extends Model
{
    /**
     * Get the fanpage that owns the auto reply rule.
     */
    public function fanpage(): BelongsTo
    {
        return $this->belongsTo(Fanpage::class);
    }
}
