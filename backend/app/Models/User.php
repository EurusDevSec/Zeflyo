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

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

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
