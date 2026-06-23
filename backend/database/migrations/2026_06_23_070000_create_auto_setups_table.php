<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('auto_setups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->enum('source_type', ['topic', 'product'])->default('topic');
            $table->json('fanpage_ids');
            $table->string('language', 10)->default('vi');
            $table->enum('post_length', ['super_short', 'short', 'medium', 'full', 'detailed'])->default('medium');
            $table->string('writing_style')->default('professional');
            $table->text('custom_prompt')->nullable();
            $table->boolean('use_fanpage_info')->default(false);
            $table->boolean('include_contact')->default(false);
            $table->text('contact_info')->nullable();
            $table->enum('schedule_mode', ['weekly', 'fixed'])->default('weekly');
            $table->json('schedule_days')->nullable();
            $table->date('schedule_date')->nullable();
            $table->json('schedule_times');
            $table->boolean('auto_post')->default(true);
            $table->boolean('auto_repeat')->default(false);
            $table->enum('publish_mode', ['instant', 'review'])->default('instant');
            $table->text('auto_comment')->nullable();
            $table->enum('status', ['active', 'paused', 'completed'])->default('paused');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('auto_setups');
    }
};
