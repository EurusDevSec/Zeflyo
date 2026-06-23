<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\AutoSetup;
use App\Jobs\ProcessAutoSetupJob;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class RunAutoSetupsCommand extends Command
{
    protected $signature = 'autosetups:run {--force}';
    protected $description = 'Check and dispatch auto-setup jobs for campaigns due to publish.';

    public function handle(): int
    {
        $this->info('Scanning active auto-setups...');

        $now = Carbon::now();
        $currentTime = $now->format('H:i');
        $currentDayOfWeek = $now->dayOfWeekIso; // 1 = Monday, 7 = Sunday
        $currentDate = $now->toDateString();

        $setups = AutoSetup::where('status', 'active')
            ->where('auto_post', true)
            ->get();

        if ($setups->isEmpty()) {
            $this->info('No active auto-setups found.');
            return 0;
        }

        $dispatched = 0;

        foreach ($setups as $setup) {
            if (!$this->option('force') && !$this->isScheduleMatch($setup, $currentTime, $currentDayOfWeek, $currentDate)) {
                continue;
            }

            $this->info("Dispatching AutoSetup #{$setup->id} '{$setup->name}'...");
            ProcessAutoSetupJob::dispatch($setup->id);
            $dispatched++;
        }

        $this->info("Dispatched {$dispatched} auto-setup jobs.");
        return 0;
    }

    /**
     * Check if the current time matches the setup's schedule.
     */
    private function isScheduleMatch(AutoSetup $setup, string $currentTime, int $currentDayOfWeek, string $currentDate): bool
    {
        // Check if current time matches any of the schedule times
        $scheduleTimes = $setup->schedule_times ?? [];
        $timeMatch = false;

        foreach ($scheduleTimes as $time) {
            // Match with 1-minute tolerance (H:i format)
            if ($time === $currentTime) {
                $timeMatch = true;
                break;
            }
        }

        if (!$timeMatch) {
            return false;
        }

        // Check schedule mode
        if ($setup->schedule_mode === 'weekly') {
            $scheduleDays = $setup->schedule_days ?? [];
            return in_array($currentDayOfWeek, $scheduleDays);
        }

        if ($setup->schedule_mode === 'fixed') {
            $scheduleDate = $setup->schedule_date;
            if ($scheduleDate) {
                return $scheduleDate->toDateString() === $currentDate;
            }
            // If no specific date, run today
            return true;
        }

        return false;
    }
}
