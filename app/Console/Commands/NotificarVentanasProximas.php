<?php

namespace App\Console\Commands;

use App\Models\Periodo;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

class NotificarVentanasProximas extends Command
{
    protected $signature   = 'periodos:notificar-ventanas';
    protected $description = 'Envía notificaciones a profesores 5 días antes de la apertura y cierre de ventanas de calificación';

    public function handle(): int
    {
        $ahora      = Carbon::now();
        $en5Dias    = $ahora->copy()->addDays(5);
        $inicioDia  = $en5Dias->copy()->startOfDay();
        $finDia     = $en5Dias->copy()->endOfDay();

        $profesores = User::role('profesor')->get();

        if ($profesores->isEmpty()) {
            $this->info('No hay profesores registrados.');
            return Command::SUCCESS;
        }

        /* ── Periodos cuya apertura cae en exactamente 5 días ── */
        $aperturas = Periodo::whereBetween('ventana_inicio', [$inicioDia, $finDia])
            ->where('notas_abiertas', false)
            ->get();

        foreach ($aperturas as $periodo) {
            $fechaFormateada = Carbon::parse($periodo->ventana_inicio)
                ->setTimezone('America/Bogota')
                ->translatedFormat('l d \d\e F \d\e Y \a \l\a\s g:i a');

            foreach ($profesores as $prof) {
                $prof->notificaciones()->create([
                    'tipo'    => 'academica',
                    'titulo'  => "📝 Apertura próxima: {$periodo->nombre}",
                    'mensaje' => "En 5 días (el {$fechaFormateada}) se abrirá la ventana de calificación para **{$periodo->nombre}**. Prepara tus notas con anticipación.",
                ]);
            }

            $this->info("Notificación de APERTURA enviada para «{$periodo->nombre}» ({$fechaFormateada})");
        }

        /* ── Periodos cuyo cierre cae en exactamente 5 días ── */
        $cierres = Periodo::whereBetween('ventana_fin', [$inicioDia, $finDia])
            ->where('notas_abiertas', true)
            ->get();

        foreach ($cierres as $periodo) {
            $fechaFormateada = Carbon::parse($periodo->ventana_fin)
                ->setTimezone('America/Bogota')
                ->translatedFormat('l d \d\e F \d\e Y \a \l\a\s g:i a');

            foreach ($profesores as $prof) {
                $prof->notificaciones()->create([
                    'tipo'    => 'academica',
                    'titulo'  => "⏰ Cierre próximo: {$periodo->nombre}",
                    'mensaje' => "Quedan solo 5 días para el cierre de la ventana de calificación de **{$periodo->nombre}** (el {$fechaFormateada}). Asegúrate de tener todas las notas registradas antes de esa fecha.",
                ]);
            }

            $this->info("Notificación de CIERRE enviada para «{$periodo->nombre}» ({$fechaFormateada})");
        }

        if ($aperturas->isEmpty() && $cierres->isEmpty()) {
            $this->info('No hay ventanas programadas para dentro de 5 días.');
        }

        return Command::SUCCESS;
    }
}
