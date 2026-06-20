<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('scheduled_posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->json('fanpage_ids'); // Array of fanpage IDs (can be primary keys of fanpages table or fb_page_id, let's use the local fanpages primary keys)
            $table->text('content');
            $table->string('image_url')->nullable();
            $table->timestamp('scheduled_at');
            $table->enum('status', ['draft', 'pending', 'published', 'failed'])->default('pending');
            $table->text('error_log')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scheduled_posts');
    }
};
