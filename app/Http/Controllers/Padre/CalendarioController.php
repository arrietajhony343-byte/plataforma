<?php

namespace App\Http\Controllers\Padre;

use App\Http\Controllers\Controller;
use App\Models\{Actividad, CursoMateria, Entrega, HorarioBloque, Matricula, Periodo, PeriodoEvento, User};
use Carbon\Carbon;
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
                'horarioSemanal' => [],
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
                'horarioSemanal' => [],
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

        $horarios = HorarioBloque::query()
            ->whereIn('curso_materia_id', $cursoMateriaIds)
            ->with(['cursoMateria.materia:id,nombre', 'cursoMateria.profesor:id,name'])
            ->get();

        $dayOrder = [
            'lunes' => 1,
            'martes' => 2,
            'miercoles' => 3,
            'miércoles' => 3,
            'jueves' => 4,
            'viernes' => 5,
            'sabado' => 6,
            'sábado' => 6,
            'domingo' => 7,
        ];

        $horarioSemanal = $horarios
            ->map(function (HorarioBloque $hb) {
                return [
                    'id' => $hb->id,
                    'dia' => (string) $hb->dia,
                    'horaInicio' => $hb->hora_inicio ? substr((string) $hb->hora_inicio, 0, 5) : null,
                    'horaFin' => $hb->hora_fin ? substr((string) $hb->hora_fin, 0, 5) : null,
                    'materia' => $hb->cursoMateria?->materia?->nombre ?? 'Materia',
                    'profesor' => $hb->cursoMateria?->profesor?->name ?? 'Sin profesor',
                    'salon' => $hb->salon,
                ];
            })
            ->sortBy([
                fn(array $item) => $dayOrder[mb_strtolower($item['dia'], 'UTF-8')] ?? 99,
                fn(array $item) => $item['horaInicio'] ?? '99:99',
            ])
            ->values();

        $inicioAnio = Carbon::create($anio, 1, 1)->startOfDay();
        $finAnio = Carbon::create($anio, 12, 31)->endOfDay();

        $horarioItems = collect();
        foreach ($horarios as $hb) {
            $dayOfWeek = $this->dayOfWeekFromLabel((string) $hb->dia);
            if ($dayOfWeek === null) {
                continue;
            }

            $cursor = $inicioAnio->copy();
            while ((int) $cursor->dayOfWeek !== $dayOfWeek) {
                $cursor->addDay();
            }

            while ($cursor->lte($finAnio)) {
                $horarioItems->push([
                    'id' => 'hor-' . $hb->id . '-' . $cursor->format('Ymd'),
                    'origen' => 'horario',
                    'titulo' => 'Clase: ' . ($hb->cursoMateria?->materia?->nombre ?? 'Materia'),
                    'materia' => $hb->cursoMateria?->materia?->nombre ?? 'Materia',
                    'profesor' => $hb->cursoMateria?->profesor?->name ?? 'Sin profesor',
                    'fecha' => $cursor->format('Y-m-d'),
                    'hora' => $hb->hora_inicio ? substr((string) $hb->hora_inicio, 0, 5) : null,
                    'tipo' => 'clase',
                    'descripcion' => 'Horario de clase' . ($hb->salon ? ' · Salon: ' . $hb->salon : ''),
                    'entregada' => null,
                    'vencida' => false,
                ]);

                $cursor->addWeek();
            }
        }

        $items = $actividadItems
            ->concat($eventos)
            ->concat($horarioItems)
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
            'horarioSemanal' => $horarioSemanal,
            'resumen' => [
                'total' => $items->count(),
                'proximas' => $items->where('fecha', '>=', now()->toDateString())->count(),
                'vencidas' => $actividadItems->where('vencida', true)->count(),
            ],
        ]);
    }

    private function dayOfWeekFromLabel(string $dia): ?int
    {
        return match (mb_strtolower(trim($dia), 'UTF-8')) {
            'domingo' => Carbon::SUNDAY,
            'lunes' => Carbon::MONDAY,
            'martes' => Carbon::TUESDAY,
            'miercoles', 'miércoles' => Carbon::WEDNESDAY,
            'jueves' => Carbon::THURSDAY,
            'viernes' => Carbon::FRIDAY,
            'sabado', 'sábado' => Carbon::SATURDAY,
            default => null,
        };
    }
}
