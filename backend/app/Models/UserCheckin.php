<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserCheckin extends Model
{
    protected $fillable = [
        'user_id',
        'checkin_date',
    ];

    protected $casts = [
        'checkin_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
