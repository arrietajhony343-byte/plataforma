<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\{Boletin, CursoMateria, Matricula, Nota, Observacion, Periodo};
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SeguimientoController extends Controller
{
    public function observador(): Response
    {
        $user = auth()->user();

        $observaciones = Observacion::query()
            ->where('estudiante_id', $user->id)
            ->with(['materia:id,nombre', 'profesor:id,name'])
            ->orderByDesc('fecha')
            ->orderByDesc('id')
            ->get()
            ->map(fn (Observacion $o) => [
                'id' => $o->id,
                'fecha' => $o->fecha?->format('Y-m-d'),
                'materia' => $o->materia?->nombre ?? 'General',
                'profesor' => $o->profesor?->name ?? 'Coordinacion',
                'tipo' => $o->tipo,
                'categoria' => $o->categoria,
                'descripcion' => $o->descripcion,
            ])
            ->values();

        return Inertia::render('Estudiante/Observador', [
            'estudiante' => [
                'nombre' => $user->name,
            ],
            'disponible' => $observaciones->isNotEmpty(),
            'observaciones' => $observaciones,
        ]);
    }

    public function horario(): Response
    {
        $user = auth()->user();

        $matricula = Matricula::query()
            ->where('estudiante_id', $user->id)
            ->where('estado', 'activa')
            ->with('curso:id,nombre,jornada,anio')
            ->latest('id')
            ->first();

        if (!$matricula?->curso) {
            return Inertia::render('Estudiante/Horario', [
                'estudiante' => ['nombre' => $user->name],
                'disponible' => false,
                'curso' => null,
                'horas' => [],
                'dias' => ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'],
                'bloques' => [],
            ]);
        }

        $cursoMaterias = CursoMateria::query()
            ->where('curso_id', $matricula->curso_id)
            ->with([
                'materia:id,nombre',
                'profesor:id,name',
                'horarioBloques:id,curso_materia_id,dia,hora_inicio,hora_fin,salon',
            ])
            ->get();

        $palette = [
            'bg-blue-50 border-blue-200 text-blue-800',
            'bg-amber-50 border-amber-200 text-amber-800',
            'bg-indigo-50 border-indigo-200 text-indigo-800',
            'bg-green-50 border-green-200 text-green-800',
            'bg-purple-50 border-purple-200 text-purple-800',
            'bg-cyan-50 border-cyan-200 text-cyan-800',
            'bg-orange-50 border-orange-200 text-orange-800',
            'bg-pink-50 border-pink-200 text-pink-800',
        ];

        $colorByMateria = [];
        $colorIdx = 0;

        $bloques = $cursoMaterias
            ->flatMap(function (CursoMateria $cm) use (&$colorByMateria, &$colorIdx, $palette) {
                $materiaNombre = $cm->materia?->nombre ?? 'Materia';
                if (!isset($colorByMateria[$materiaNombre])) {
                    $colorByMateria[$materiaNombre] = $palette[$colorIdx % count($palette)];
                    $colorIdx++;
                }

                return $cm->horarioBloques->map(function ($bloque) use ($cm, $materiaNombre, $colorByMateria) {
                    return [
                        'dia' => $this->diaLabel((string) $bloque->dia),
                        'hora_inicio' => substr((string) $bloque->hora_inicio, 0, 5),
                        'hora_fin' => substr((string) $bloque->hora_fin, 0, 5),
                        'materia' => $materiaNombre,
                        'profesor' => $cm->profesor?->name ?? 'Sin profesor',
                        'salon' => $bloque->salon ?: 'Sin aula',
                        'color' => $colorByMateria[$materiaNombre],
                    ];
                });
            })
            ->sortBy(fn ($b) => $b['hora_inicio'] . '-' . $b['dia'])
            ->values();

        $horas = $bloques
            ->map(fn ($b) => [
                'inicio' => $b['hora_inicio'],
                'fin' => $b['hora_fin'],
            ])
            ->unique(fn ($r) => $r['inicio'] . '-' . $r['fin'])
            ->sortBy('inicio')
            ->values();

        return Inertia::render('Estudiante/Horario', [
            'estudiante' => ['nombre' => $user->name],
            'disponible' => $bloques->isNotEmpty(),
            'curso' => [
                'nombre' => $matricula->curso->nombre,
                'jornada' => $matricula->curso->jornada,
                'anio' => $matricula->curso->anio,
            ],
            'dias' => ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'],
            'horas' => $horas,
            'bloques' => $bloques,
        ]);
    }

    public function boletines(): Response
    {
        $user = auth()->user();

        $periodoActivo = Periodo::query()
            ->where('estado', 'activo')
            ->orderByDesc('anio')
            ->orderBy('numero')
            ->first();

        $boletinActual = null;
        $promedioParcial = null;

        if ($periodoActivo) {
            $boletinActual = Boletin::query()
                ->where('estudiante_id', $user->id)
                ->where('periodo_id', $periodoActivo->id)
                ->whereIn('estado', ['generado', 'entregado'])
                ->first();

            $promedioParcial = Nota::query()
                ->where('estudiante_id', $user->id)
                ->where('periodo_id', $periodoActivo->id)
                ->where('tipo', 'definitiva')
                ->avg('valor');
        }

        $boletines = Boletin::query()
            ->where('estudiante_id', $user->id)
            ->whereIn('estado', ['generado', 'entregado'])
            ->with('periodo:id,anio,nombre,numero')
            ->orderByDesc('periodo_id')
            ->get()
            ->map(function (Boletin $b) {
                $url = null;
                if ($b->archivo) {
                    if (str_starts_with($b->archivo, '/storage/') || str_starts_with($b->archivo, 'http://') || str_starts_with($b->archivo, 'https://')) {
                        $url = $b->archivo;
                    } else {
                        $url = Storage::url($b->archivo);
                    }
                }

                return [
                    'id' => $b->id,
                    'periodo' => $b->periodo?->nombre ?? 'Periodo',
                    'anio' => $b->periodo?->anio,
                    'promedio' => $b->promedio !== null ? (float) $b->promedio : null,
                    'puesto' => $b->puesto,
                    'observacion' => $b->observacion_general,
                    'estado' => $b->estado,
                    'archivo_url' => $url,
                ];
            })
            ->values();

        return Inertia::render('Estudiante/Boletines', [
            'estudiante' => ['nombre' => $user->name],
            'periodoActual' => $periodoActivo ? [
                'id' => $periodoActivo->id,
                'nombre' => $periodoActivo->nombre,
                'estado' => $periodoActivo->estado,
                'fecha_inicio' => $periodoActivo->fecha_inicio?->format('Y-m-d'),
                'fecha_fin' => $periodoActivo->fecha_fin?->format('Y-m-d'),
                'promedio_parcial' => $promedioParcial !== null ? round((float) $promedioParcial, 1) : null,
                'boletin_generado' => (bool) $boletinActual,
            ] : null,
            'boletines' => $boletines,
        ]);
    }

    private function diaLabel(string $dia): string
    {
        return match (strtolower($dia)) {
            'lunes' => 'Lunes',
            'martes' => 'Martes',
            'miercoles' => 'Miercoles',
            'jueves' => 'Jueves',
            'viernes' => 'Viernes',
            default => ucfirst($dia),
        };
    }
}
