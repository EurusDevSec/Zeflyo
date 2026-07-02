<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['fanpage_id', 'keyword', 'reply_content', 'is_active'])]
class AutoReplyRule extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the fanpage this rule belongs to.
     */
    public function fanpage(): BelongsTo
    {
        return $this->belongsTo(Fanpage::class);
    }
}
