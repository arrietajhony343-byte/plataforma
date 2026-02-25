<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\{CursoMateria, Observacion, Nota};
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $anio = now()->year;

        // Cursos asignados al profesor
        $cursoMaterias = CursoMateria::where('profesor_id', $user->id)
            ->whereHas('curso', fn($q) => $q->where('anio', $anio))
            ->with(['curso', 'materia'])
            ->get();

        $cursosAsignados = $cursoMaterias->groupBy('curso_id')->map(function ($group) {
            $curso = $group->first()->curso;
            $materias = $group->pluck('materia.nombre')->toArray();
            $colors = ['blue', 'green', 'purple', 'orange', 'red', 'teal'];
            return [
                'id'          => $curso->id,
                'nombre'      => implode(', ', $materias),
                'grado'       => $curso->nombre,
                'estudiantes' => $curso->matriculas()->activa()->count(),
                'color'       => $colors[$curso->id % count($colors)],
            ];
        })->values();

        // Alertas: estudiantes con observaciones negativas recientes
        $alertas = Observacion::where('profesor_id', $user->id)
            ->where('tipo', 'negativa')
            ->with(['estudiante', 'cursoMateria.curso'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($o) => [
                'id'         => $o->id,
                'estudiante' => $o->estudiante->name,
                'curso'      => $o->cursoMateria?->curso?->nombre ?? 'N/A',
                'mensaje'    => $o->descripcion,
                'tipo'       => 'warning',
            ]);

        return Inertia::render('Profesor/Dashboard', [
            'profesor' => [
                'nombre' => $user->name,
            ],
            'cursosAsignados' => $cursosAsignados,
            'alertas' => $alertas,
        ]);
    }
}
