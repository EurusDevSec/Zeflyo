<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('topics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('auto_setup_id')->constrained('auto_setups')->onDelete('cascade');
            $table->string('title');
            $table->enum('status', ['pending', 'generated', 'published', 'failed'])->default('pending');
            $table->text('generated_content')->nullable();
            $table->string('generated_image_url')->nullable();
            $table->string('fb_post_id')->nullable();
            $table->text('error_log')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('topics');
    }
};
