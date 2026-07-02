<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Carbon\Carbon;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password', 'display_name', 'avatar_url', 'timezone', 'credits', 'subscription_plan', 'subscription_expires_at', 'phone', 'referral_phone', 'uid', 'last_checkin_at', 'last_free_credits_at'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected static function booted()
    {
        static::creating(function ($user) {
            if (empty($user->uid)) {
                $user->uid = Str::random(28);
            }
        });
    }

    public function getUidAttribute($value)
    {
        if (empty($value)) {
            $value = Str::random(28);
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
            'last_checkin_at' => 'datetime',
        ];
    }

    /**
     * Check if the user is on the Free plan and award them 100 free credits daily.
     */
    public function checkAndAwardDailyFreeCredits()
    {
        if ($this->subscription_plan === 'free') {
            $today = Carbon::now($this->timezone ?? 'Asia/Ho_Chi_Minh')->toDateString();
            if (empty($this->last_free_credits_at) || $this->last_free_credits_at < $today) {
                $this->credits = ($this->credits ?? 0) + 100;
                $this->last_free_credits_at = $today;
                $this->save();
            }
        }
    }

    /**
     * Get the fanpages managed by this user.
     */
    public function fanpages(): HasMany
    {
        return $this->hasMany(Fanpage::class);
    }

    /**
     * Get the scheduled posts created by this user.
     */
    public function scheduledPosts(): HasMany
    {
        return $this->hasMany(ScheduledPost::class);
    }

    public function autoSetups(): HasMany
    {
        return $this->hasMany(AutoSetup::class);
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function checkins(): HasMany
    {
        return $this->hasMany(UserCheckin::class);
    }
}
