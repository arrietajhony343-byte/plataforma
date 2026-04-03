<?php

namespace App\Http\Controllers\Padre;

use App\Http\Controllers\Controller;
use App\Models\{Actividad, Entrega, Matricula, Periodo, PeriodoEvento, User};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CalendarioController extends Controller
{
    public function index(Request $request): Response
    {
        $padre = $request->user();

        $hijos = $padre->hijos()
            ->select('users.id', 'users.name')
            ->orderBy('users.name')
            ->get();

        if ($hijos->isEmpty()) {
            return Inertia::render('Padre/Calendario', [
                'padre' => [
                    'nombre' => $padre->name,
                ],
                'hijos' => [],
                'hijo' => null,
                'items' => [],
                'pendientes' => [],
                'resumen' => [
                    'total' => 0,
                    'proximas' => 0,
                    'vencidas' => 0,
                ],
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

        if (!$matricula?->curso) {
            return Inertia::render('Padre/Calendario', [
                'padre' => [
                    'nombre' => $padre->name,
                ],
                'hijos' => $hijos->map(fn($h) => ['id' => $h->id, 'nombre' => $h->name])->values(),
                'hijo' => [
                    'id' => $hijo->id,
                    'nombre' => $hijo->name,
                    'grado' => 'Sin grado',
                    'seccion' => '—',
                ],
                'items' => [],
                'pendientes' => [],
                'resumen' => [
                    'total' => 0,
                    'proximas' => 0,
                    'vencidas' => 0,
                ],
            ]);
        }

        $curso = $matricula->curso;
        $anio = (int) ($curso->anio ?? now()->year);

        $cursoMateriaIds = \App\Models\CursoMateria::query()
            ->where('curso_id', $curso->id)
            ->pluck('id');

        $actividades = Actividad::query()
            ->whereIn('curso_materia_id', $cursoMateriaIds)
            ->whereYear('fecha_entrega', $anio)
            ->with(['cursoMateria.materia:id,nombre', 'cursoMateria.profesor:id,name'])
            ->orderBy('fecha_entrega')
            ->get();

        $entregas = Entrega::query()
            ->where('estudiante_id', $hijo->id)
            ->whereIn('actividad_id', $actividades->pluck('id'))
            ->get()
            ->keyBy('actividad_id');

        $actividadItems = $actividades->map(function (Actividad $a) use ($entregas) {
            $entrega = $entregas->get($a->id);
            $estadoEntrega = $entrega?->estado;

            $entregada = in_array((string) $estadoEntrega, ['entregada', 'atrasada', 'calificada'], true);
            $vencida = !$entregada && $a->fecha_entrega && now()->gt($a->fecha_entrega);

            return [
                'id' => 'act-' . $a->id,
                'origen' => 'actividad',
                'titulo' => $a->titulo,
                'materia' => $a->cursoMateria?->materia?->nombre ?? 'Materia',
                'profesor' => $a->cursoMateria?->profesor?->name ?? 'Sin profesor',
                'fecha' => $a->fecha_entrega?->format('Y-m-d'),
                'hora' => $a->fecha_entrega?->format('H:i'),
                'tipo' => $a->tipo,
                'descripcion' => $a->descripcion,
                'entregada' => $entregada,
                'vencida' => $vencida,
            ];
        });

        $periodos = Periodo::query()
            ->where('anio', $anio)
            ->pluck('id');

        $eventos = PeriodoEvento::query()
            ->whereIn('periodo_id', $periodos)
            ->with('periodo:id,nombre')
            ->orderBy('fecha')
            ->get()
            ->map(fn($e) => [
                'id' => 'evt-' . $e->id,
                'origen' => 'evento',
                'titulo' => $e->titulo,
                'materia' => 'Institucional',
                'profesor' => $e->periodo?->nombre ?? 'Periodo',
                'fecha' => $e->fecha?->format('Y-m-d'),
                'hora' => null,
                'tipo' => $e->tipo,
                'descripcion' => $e->descripcion,
                'entregada' => null,
                'vencida' => false,
            ]);

        $items = $actividadItems
            ->concat($eventos)
            ->filter(fn($i) => !empty($i['fecha']))
            ->sortBy(['fecha', 'hora'])
            ->values();

        $pendientes = $actividadItems
            ->filter(fn($i) => $i['entregada'] === false)
            ->sortBy('fecha')
            ->values();

        return Inertia::render('Padre/Calendario', [
            'padre' => [
                'nombre' => $padre->name,
            ],
            'hijos' => $hijos->map(fn($h) => ['id' => $h->id, 'nombre' => $h->name])->values(),
            'hijo' => [
                'id' => $hijo->id,
                'nombre' => $hijo->name,
                'grado' => $curso->grado ? ($curso->grado . '°') : 'Sin grado',
                'seccion' => $curso->grupo ?? '—',
            ],
            'items' => $items,
            'pendientes' => $pendientes,
            'resumen' => [
                'total' => $items->count(),
                'proximas' => $items->where('fecha', '>=', now()->toDateString())->count(),
                'vencidas' => $actividadItems->where('vencida', true)->count(),
            ],
        ]);
    }
}
