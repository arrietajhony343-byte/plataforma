<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\Nota;
use App\Models\Periodo;
use Inertia\Inertia;
use Inertia\Response;

class NotaController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        $notas = Nota::query()
            ->where('estudiante_id', $user->id)
            ->with([
                'cursoMateria.materia:id,nombre',
                'cursoMateria.profesor:id,name',
                'periodo:id,nombre,numero,estado',
                'conceptoNota:id,nombre,porcentaje',
            ])
            ->orderBy('periodo_id')
            ->orderByDesc('updated_at')
            ->get();

        $periodosConNotas = $notas
            ->pluck('periodo')
            ->filter()
            ->unique('id')
            ->sortBy('numero')
            ->values();

        $periodoActivo = $periodosConNotas->firstWhere('estado', 'activo') ?? $periodosConNotas->first();

        $notasPorPeriodo = $periodosConNotas->map(function ($periodo) use ($notas) {
            $notasPeriodo = $notas->where('periodo_id', $periodo->id)->values();

            $materias = $notasPeriodo
                ->groupBy('curso_materia_id')
                ->map(function ($notasMateria) {
                    $primera = $notasMateria->first();
                    $materiaNombre = $primera?->cursoMateria?->materia?->nombre ?? 'Materia';
                    $profesorNombre = $primera?->cursoMateria?->profesor?->name;

                    $notasNormalizadas = $notasMateria
                        ->map(function ($nota) {
                            $peso = $nota->conceptoNota ? (float) $nota->conceptoNota->porcentaje : null;

                            return [
                                'id' => $nota->id,
                                'concepto' => $nota->conceptoNota?->nombre
                                    ?? ($nota->descripcion ?: $nota->tipo),
                                'tipo' => $nota->tipo,
                                'peso' => $peso,
                                'valor' => (float) $nota->valor,
                                'fecha' => $nota->updated_at?->format('Y-m-d H:i'),
                            ];
                        })
                        ->values();

                    return [
                        'id' => $primera?->curso_materia_id,
                        'nombre' => $materiaNombre,
                        'profesor' => $profesorNombre,
                        'promedio' => round((float) $notasMateria->avg('valor'), 1),
                        'notas' => $notasNormalizadas,
                    ];
                })
                ->sortBy('nombre')
                ->values();

            $promedioGeneral = $materias->isNotEmpty()
                ? round((float) $materias->avg('promedio'), 1)
                : null;

            $mejor = $materias->sortByDesc('promedio')->first();
            $baja = $materias->sortBy('promedio')->first();

            return [
                'periodo_id' => $periodo->id,
                'periodo_nombre' => $periodo->nombre,
                'promedio_general' => $promedioGeneral,
                'total_materias' => $materias->count(),
                'total_notas' => $notasPeriodo->count(),
                'mejor_materia' => $mejor ? [
                    'nombre' => $mejor['nombre'],
                    'promedio' => $mejor['promedio'],
                ] : null,
                'materia_alerta' => $baja && $baja['promedio'] < 3.0 ? [
                    'nombre' => $baja['nombre'],
                    'promedio' => $baja['promedio'],
                ] : null,
                'materias' => $materias,
            ];
        })->values();

        return Inertia::render('Estudiante/Notas', [
            'estudiante' => [
                'nombre' => $user->name,
            ],
            'periodos' => $periodosConNotas->map(fn ($p) => [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'numero' => $p->numero,
                'estado' => $p->estado,
            ])->values(),
            'periodoActualId' => $periodoActivo?->id,
            'notasPorPeriodo' => $notasPorPeriodo,
        ]);
    }
}
