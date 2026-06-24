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
        Schema::table('users', function (Blueprint $table) {
            $table->integer('credits')->default(0)->after('timezone');
            $table->string('subscription_plan')->default('free')->after('credits');
            $table->timestamp('subscription_expires_at')->nullable()->after('subscription_plan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['credits', 'subscription_plan', 'subscription_expires_at']);
        });
    }
};
