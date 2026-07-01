<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['user_id', 'code', 'plan_id', 'cycle', 'amount', 'status'])]
class PendingPayment extends Model
{
    use HasFactory;

    /**
     * Get the user that owns the pending payment.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
