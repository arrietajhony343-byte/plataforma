<?php

namespace App\Http\Controllers\Padre;

use App\Http\Controllers\Controller;
use App\Models\{Asistencia, Matricula, Nota, Observacion, Periodo, User};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SeguimientoController extends Controller
{
    public function index(Request $request): Response
    {
        $padre = $request->user();

        $hijos = $padre->hijos()
            ->select('users.id', 'users.name')
            ->orderBy('users.name')
            ->get();

        if ($hijos->isEmpty()) {
            return Inertia::render('Padre/Seguimiento', [
                'padre' => [
                    'nombre' => $padre->name,
                ],
                'hijos' => [],
                'hijo' => null,
                'periodos' => [],
                'periodoSeleccionadoId' => null,
                'resumen' => [
                    'promedioGeneral' => null,
                    'asistenciaGeneral' => 0,
                    'totalObservaciones' => 0,
                    'materiasEnRiesgo' => 0,
                ],
                'materias' => [],
                'observacionesRecientes' => [],
            ]);
        }

        $hijoId = (int) ($request->query('hijo_id') ?: $hijos->first()->id);
        if (!$hijos->pluck('id')->contains($hijoId)) {
            $hijoId = (int) $hijos->first()->id;
        }

        $hijo = User::findOrFail($hijoId);

        $matricula = Matricula::query()
            ->where('estudiante_id', $hijo->id)
            ->where('estado', 'activa')
            ->with('curso:id,nombre,grado,grupo,anio')
            ->latest('id')
            ->first();

        $anio = (int) ($matricula?->curso?->anio ?? (Periodo::max('anio') ?: now()->year));

        $periodos = Periodo::query()
            ->where('anio', $anio)
            ->orderBy('numero')
            ->get();

        if ($periodos->isEmpty()) {
            $periodos = Periodo::query()->orderByDesc('anio')->orderBy('numero')->get();
        }

        $periodoSeleccionadoId = (int) ($request->query('periodo_id') ?: 0);
        if (!$periodos->pluck('id')->contains($periodoSeleccionadoId)) {
            $periodoSeleccionadoId = (int) ($periodos->firstWhere('estado', 'activo')?->id ?: ($periodos->first()?->id ?: 0));
        }

        $periodoSel = $periodos->firstWhere('id', $periodoSeleccionadoId);

        $cursoId = $matricula?->curso_id;
        $cms = collect();
        if ($cursoId) {
            $cms = \App\Models\CursoMateria::query()
                ->where('curso_id', $cursoId)
                ->with(['materia:id,nombre', 'profesor:id,name'])
                ->get();
        }

        $cmIds = $cms->pluck('id');
        $materiaIdPorCm = $cms->mapWithKeys(fn($cm) => [$cm->id => $cm->materia_id]);

        $notasPeriodo = Nota::query()
            ->where('estudiante_id', $hijo->id)
            ->whereIn('curso_materia_id', $cmIds)
            ->where('periodo_id', $periodoSeleccionadoId)
            ->with('conceptoNota:id,nombre,porcentaje')
            ->get()
            ->groupBy('curso_materia_id');

        $periodoAnterior = $periodos
            ->filter(fn($p) => (int) $p->numero < (int) ($periodoSel?->numero ?? 0))
            ->sortByDesc('numero')
            ->first();

        $promedioPrevio = collect();
        if ($periodoAnterior) {
            $promedioPrevio = Nota::query()
                ->where('estudiante_id', $hijo->id)
                ->whereIn('curso_materia_id', $cmIds)
                ->where('periodo_id', $periodoAnterior->id)
                ->where('tipo', 'definitiva')
                ->get()
                ->keyBy('curso_materia_id');
        }

        $asistencias = Asistencia::query()
            ->where('estudiante_id', $hijo->id)
            ->whereIn('curso_materia_id', $cmIds)
            ->when($periodoSel?->fecha_inicio, fn($q) => $q->whereDate('fecha', '>=', $periodoSel->fecha_inicio))
            ->when($periodoSel?->fecha_fin, fn($q) => $q->whereDate('fecha', '<=', $periodoSel->fecha_fin))
            ->get()
            ->groupBy('curso_materia_id');

        $observaciones = Observacion::query()
            ->where('estudiante_id', $hijo->id)
            ->when($periodoSel?->fecha_inicio, fn($q) => $q->whereDate('fecha', '>=', $periodoSel->fecha_inicio))
            ->when($periodoSel?->fecha_fin, fn($q) => $q->whereDate('fecha', '<=', $periodoSel->fecha_fin))
            ->with(['profesor:id,name', 'materia:id,nombre'])
            ->get();

        $materias = $cms->map(function ($cm) use ($notasPeriodo, $promedioPrevio, $asistencias, $observaciones, $materiaIdPorCm) {
            $notas = $notasPeriodo->get($cm->id, collect());
            $def = $notas->firstWhere('tipo', 'definitiva');
            $promActual = $def ? (float) $def->valor : ($notas->isNotEmpty() ? round((float) $notas->avg('valor'), 1) : 0.0);

            $prev = $promedioPrevio->get($cm->id);
            $promPrev = $prev ? (float) $prev->valor : null;

            $tendencia = 'estable';
            if ($promPrev !== null) {
                if ($promActual > $promPrev + 0.15) {
                    $tendencia = 'subiendo';
                } elseif ($promActual < $promPrev - 0.15) {
                    $tendencia = 'bajando';
                }
            }

            $asis = $asistencias->get($cm->id, collect());
            $totalAsis = $asis->count();
            $okAsis = $asis->whereIn('estado', ['presente', 'tarde', 'excusa'])->count();
            $asistenciaPct = $totalAsis > 0 ? (int) round(($okAsis / $totalAsis) * 100) : 0;

            $materiaId = $materiaIdPorCm->get($cm->id);
            $obsMateria = $observaciones->filter(fn($o) => (int) $o->materia_id === (int) $materiaId);

            return [
                'materia' => $cm->materia?->nombre ?? 'Materia',
                'profesor' => $cm->profesor?->name ?? 'Sin profesor',
                'promedioActual' => round($promActual, 1),
                'tendencia' => $tendencia,
                'notas' => $notas
                    ->sortByDesc('updated_at')
                    ->take(8)
                    ->map(fn($n) => [
                        'nombre' => $n->conceptoNota?->nombre ?? ($n->descripcion ?: $n->tipo),
                        'nota' => (float) $n->valor,
                        'fecha' => $n->updated_at?->format('Y-m-d'),
                        'peso' => $n->conceptoNota?->porcentaje !== null ? (float) $n->conceptoNota->porcentaje : null,
                    ])
                    ->values(),
                'observaciones' => $obsMateria->count(),
                'asistencia' => $asistenciaPct,
            ];
        })->sortByDesc('promedioActual')->values();

        $promedioGeneral = $materias->isNotEmpty() ? round((float) $materias->avg('promedioActual'), 1) : null;

        $asistenciaGlobalTotal = $asistencias->flatten(1)->count();
        $asistenciaGlobalOk = $asistencias->flatten(1)->whereIn('estado', ['presente', 'tarde', 'excusa'])->count();
        $asistenciaGeneral = $asistenciaGlobalTotal > 0 ? (int) round(($asistenciaGlobalOk / $asistenciaGlobalTotal) * 100) : 0;

        $observacionesRecientes = $observaciones
            ->sortByDesc('fecha')
            ->take(10)
            ->map(fn($o) => [
                'id' => 'obs-' . $o->id,
                'tipo' => $o->tipo,
                'materia' => $o->materia?->nombre ?? 'General',
                'profesor' => $o->profesor?->name ?? 'Docente',
                'descripcion' => $o->descripcion,
                'fecha' => $o->fecha?->format('Y-m-d'),
            ])
            ->values();

        return Inertia::render('Padre/Seguimiento', [
            'padre' => [
                'nombre' => $padre->name,
            ],
            'hijos' => $hijos->map(fn($h) => ['id' => $h->id, 'nombre' => $h->name])->values(),
            'hijo' => [
                'id' => $hijo->id,
                'nombre' => $hijo->name,
                'grado' => $matricula?->curso?->grado ? ($matricula->curso->grado . '°') : 'Sin grado',
                'seccion' => $matricula?->curso?->grupo ?? '—',
            ],
            'periodos' => $periodos->map(fn($p) => [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'estado' => $p->estado,
            ])->values(),
            'periodoSeleccionadoId' => $periodoSeleccionadoId,
            'resumen' => [
                'promedioGeneral' => $promedioGeneral,
                'asistenciaGeneral' => $asistenciaGeneral,
                'totalObservaciones' => $observaciones->count(),
                'materiasEnRiesgo' => $materias->filter(fn($m) => $m['promedioActual'] < 3.0)->count(),
            ],
            'materias' => $materias,
            'observacionesRecientes' => $observacionesRecientes,
        ]);
    }
}
