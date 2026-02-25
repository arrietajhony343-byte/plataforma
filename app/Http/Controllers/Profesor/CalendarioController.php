<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\{CursoMateria, HorarioBloque, Actividad};
use Inertia\Inertia;
use Inertia\Response;

class CalendarioController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $anio = now()->year;

        $cursoMaterias = CursoMateria::where('profesor_id', $user->id)
            ->whereHas('curso', fn($q) => $q->where('anio', $anio))
            ->with(['curso', 'materia', 'horarioBloques'])
            ->get();

        // Horario semanal del profesor
        $horario = [];
        foreach ($cursoMaterias as $cm) {
            foreach ($cm->horarioBloques as $bloque) {
                $horario[] = [
                    'id'      => $bloque->id,
                    'materia' => $cm->materia->nombre,
                    'curso'   => $cm->curso->nombre,
                    'dia'     => $bloque->dia,
                    'hora'    => $bloque->hora_inicio,
                    'horaFin' => $bloque->hora_fin,
                    'salon'   => $bloque->salon,
                ];
            }
        }

        // Actividades próximas del profesor
        $cmIds = $cursoMaterias->pluck('id');
        $actividades = Actividad::whereIn('curso_materia_id', $cmIds)
            ->where('fecha_entrega', '>=', now())
            ->with(['cursoMateria.curso', 'cursoMateria.materia'])
            ->orderBy('fecha_entrega')
            ->limit(20)
            ->get()
            ->map(fn($a) => [
                'id'      => $a->id,
                'titulo'  => $a->titulo,
                'curso'   => $a->cursoMateria?->curso?->nombre,
                'materia' => $a->cursoMateria?->materia?->nombre,
                'fecha'   => $a->fecha_entrega?->format('Y-m-d'),
                'tipo'    => $a->tipo,
            ]);

        return Inertia::render('Profesor/Calendario', [
            'profesor' => ['nombre' => $user->name],
            'horario'     => $horario,
            'actividades' => $actividades,
        ]);
    }
}
