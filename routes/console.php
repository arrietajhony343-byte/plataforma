<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Notificar a profesores 5 días antes de apertura/cierre de ventanas de calificación
Schedule::command('periodos:notificar-ventanas')->dailyAt('08:00')->withoutOverlapping();
