<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\{Actividad, CursoMateria, Periodo};
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
            ->with([
                'curso:id,nombre,anio',
                'materia:id,nombre',
                'horarioBloques:id,curso_materia_id,dia,hora_inicio,hora_fin,salon',
            ])
            ->get();

        $cmIds = $cursoMaterias->pluck('id');
        $cursoIds = $cursoMaterias->pluck('curso_id')->unique()->values();

        $clasesSemanales = $cursoMaterias
            ->flatMap(fn($cm) => $cm->horarioBloques->map(fn($bloque) => [
                'id' => $bloque->id,
                'materia' => $cm->materia?->nombre,
                'curso' => $cm->curso?->nombre,
                'dia' => $bloque->dia,
                'horaInicio' => substr((string) $bloque->hora_inicio, 0, 5),
                'horaFin' => substr((string) $bloque->hora_fin, 0, 5),
                'salon' => $bloque->salon,
            ]))
            ->sortBy(['dia', 'horaInicio'])
            ->values();

        $actividades = Actividad::whereIn('curso_materia_id', $cmIds)
            ->activa()
            ->whereYear('fecha_entrega', $anio)
            ->with(['cursoMateria.curso', 'cursoMateria.materia'])
            ->orderBy('fecha_entrega')
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'titulo' => $a->titulo,
                'descripcion' => $a->descripcion,
                'curso' => $a->cursoMateria?->curso?->nombre,
                'materia' => $a->cursoMateria?->materia?->nombre,
                'fecha' => $a->fecha_entrega?->format('Y-m-d'),
                'hora' => $a->fecha_entrega?->format('H:i'),
                'tipo' => $a->tipo,
            ])
            ->values();

        $periodos = Periodo::where('anio', $anio)
            ->with('eventos')
            ->orderBy('numero')
            ->get();

        $hitosInstitucionales = $periodos
            ->flatMap(function ($periodo) {
                $hitos = [
                    [
                        'id' => 'periodo-' . $periodo->id . '-inicio',
                        'titulo' => 'Inicio de ' . $periodo->nombre,
                        'descripcion' => 'Comienza el calendario académico de ' . $periodo->nombre . '.',
                        'fecha' => $periodo->fecha_inicio?->format('Y-m-d'),
                        'hora' => null,
                        'tipo' => 'periodo_inicio',
                        'periodo' => $periodo->nombre,
                    ],
                    [
                        'id' => 'periodo-' . $periodo->id . '-fin',
                        'titulo' => 'Cierre de ' . $periodo->nombre,
                        'descripcion' => 'Finaliza el calendario académico de ' . $periodo->nombre . '.',
                        'fecha' => $periodo->fecha_fin?->format('Y-m-d'),
                        'hora' => null,
                        'tipo' => 'periodo_fin',
                        'periodo' => $periodo->nombre,
                    ],
                ];

                if ($periodo->ventana_inicio) {
                    $hitos[] = [
                        'id' => 'periodo-' . $periodo->id . '-ventana-inicio',
                        'titulo' => 'Apertura de notas: ' . $periodo->nombre,
                        'descripcion' => 'La administración habilita el registro de notas para este periodo.',
                        'fecha' => $periodo->ventana_inicio->format('Y-m-d'),
                        'hora' => $periodo->ventana_inicio->format('H:i'),
                        'tipo' => 'apertura_notas',
                        'periodo' => $periodo->nombre,
                    ];
                }

                if ($periodo->ventana_fin) {
                    $hitos[] = [
                        'id' => 'periodo-' . $periodo->id . '-ventana-fin',
                        'titulo' => 'Cierre de notas: ' . $periodo->nombre,
                        'descripcion' => 'La ventana administrativa de notas finaliza para este periodo.',
                        'fecha' => $periodo->ventana_fin->format('Y-m-d'),
                        'hora' => $periodo->ventana_fin->format('H:i'),
                        'tipo' => 'cierre_notas',
                        'periodo' => $periodo->nombre,
                    ];
                }

                return $hitos;
            })
            ->merge(
                $periodos->flatMap(function ($periodo) {
                    return $periodo->eventos->map(function ($evento) use ($periodo) {
                        return [
                            'id' => 'periodo-' . $periodo->id . '-evento-' . $evento->id,
                            'titulo' => $evento->titulo,
                            'descripcion' => $evento->descripcion,
                            'fecha' => $evento->fecha?->format('Y-m-d'),
                            'hora' => null,
                            'tipo' => $evento->tipo,
                            'periodo' => $periodo->nombre,
                        ];
                    });
                })
            )
            ->filter(fn($hito) => !empty($hito['fecha']))
            ->sortBy(['fecha', 'hora'])
            ->values();

        $ventanasNotas = $periodos
            ->map(fn($periodo) => [
                'id' => $periodo->id,
                'nombre' => $periodo->nombre,
                'numero' => $periodo->numero,
                'notasAbiertas' => (bool) $periodo->notas_abiertas,
                'ventanaInicio' => $periodo->ventana_inicio?->format('Y-m-d\TH:i'),
                'ventanaFin' => $periodo->ventana_fin?->format('Y-m-d\TH:i'),
            ])
            ->values();

        $hoy = now()->toDateString();
        $resumen = [
            'totalCursos' => $cursoIds->count(),
            'totalClasesSemanales' => $clasesSemanales->count(),
            'actividadesPendientes' => $actividades->filter(fn($a) => $a['fecha'] >= $hoy)->count(),
            'ventanasAbiertas' => $ventanasNotas->where('notasAbiertas', true)->count(),
        ];

        return Inertia::render('Profesor/Calendario', [
            'profesor' => ['nombre' => $user->name],
            'resumen' => $resumen,
            'clasesSemanales' => $clasesSemanales,
            'actividades' => $actividades,
            'hitosInstitucionales' => $hitosInstitucionales,
            'ventanasNotas' => $ventanasNotas,
        ]);
    }
}
