<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SystemNotification extends Model
{
    use HasFactory;

    protected $fillable = [
        'category',
        'title_vi',
        'title_en',
        'snippet_vi',
        'snippet_en',
        'pinned',
        'banner_vi',
        'banner_en',
        'blocks_vi',
        'blocks_en',
    ];

    protected $casts = [
        'pinned' => 'boolean',
        'banner_vi' => 'array',
        'banner_en' => 'array',
        'blocks_vi' => 'array',
        'blocks_en' => 'array',
    ];
}
