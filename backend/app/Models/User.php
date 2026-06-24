<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'display_name', 'avatar_url', 'timezone', 'credits', 'subscription_plan', 'subscription_expires_at', 'phone', 'referral_phone', 'uid'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected static function booted()
    {
        static::creating(function ($user) {
            if (empty($user->uid)) {
                $user->uid = \Illuminate\Support\Str::random(28);
            }
        });
    }

    public function getUidAttribute($value)
    {
        if (empty($value)) {
            $value = \Illuminate\Support\Str::random(28);
            $this->attributes['uid'] = $value;
            if ($this->exists) {
                $this->save();
            }
        }
        return $value;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the fanpages managed by this user.
     */
    public function fanpages(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Fanpage::class);
    }

    /**
     * Get the scheduled posts created by this user.
     */
    public function scheduledPosts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ScheduledPost::class);
    }

    public function autoSetups(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(AutoSetup::class);
    }

    public function products(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Product::class);
    }
}
