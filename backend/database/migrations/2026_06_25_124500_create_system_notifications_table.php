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
        Schema::create('system_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('category'); // feature, update, maintenance, event, info
            $table->string('title_vi');
            $table->string('title_en');
            $table->text('snippet_vi');
            $table->text('snippet_en');
            $table->boolean('pinned')->default(false);
            $table->json('banner_vi')->nullable();
            $table->json('banner_en')->nullable();
            $table->json('blocks_vi');
            $table->json('blocks_en');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_notifications');
    }
};
