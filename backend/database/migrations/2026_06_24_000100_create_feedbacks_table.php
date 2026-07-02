<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedbacks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('type', ['bug', 'suggestion', 'feature_request', 'other']);
            $table->string('title', 255);
            $table->text('content');
            $table->json('image_urls')->nullable();
            $table->string('contact_email', 255)->nullable();
            $table->enum('status', ['new', 'seen', 'resolved'])->default('new');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedbacks');
    }
};
