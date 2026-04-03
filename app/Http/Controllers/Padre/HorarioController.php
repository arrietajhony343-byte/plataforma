<?php

namespace App\Http\Controllers\Padre;

use App\Http\Controllers\Controller;
use App\Models\{HorarioBloque, Matricula, User};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HorarioController extends Controller
{
    public function index(Request $request): Response
    {
        $padre = $request->user();

        $hijos = $padre->hijos()
            ->select('users.id', 'users.name')
            ->orderBy('users.name')
            ->get();

        if ($hijos->isEmpty()) {
            return Inertia::render('Padre/Horario', [
                'padre' => [
                    'nombre' => $padre->name,
                ],
                'hijos' => [],
                'hijo' => null,
                'horarioSemanal' => [],
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
            return Inertia::render('Padre/Horario', [
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
                'horarioSemanal' => [],
            ]);
        }

        $curso = $matricula->curso;

        $cursoMateriaIds = \App\Models\CursoMateria::query()
            ->where('curso_id', $curso->id)
            ->pluck('id');

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

        $toMinutes = static function (?string $hora): int {
            if (!$hora) {
                return PHP_INT_MAX;
            }

            [$h, $m] = array_pad(explode(':', $hora), 2, '0');
            return ((int) $h * 60) + (int) $m;
        };

        $horarioSemanal = HorarioBloque::query()
            ->whereIn('curso_materia_id', $cursoMateriaIds)
            ->with(['cursoMateria.materia:id,nombre', 'cursoMateria.profesor:id,name'])
            ->get()
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
                fn(array $item) => $toMinutes($item['horaInicio']),
            ])
            ->values();

        return Inertia::render('Padre/Horario', [
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
            'horarioSemanal' => $horarioSemanal,
        ]);
    }
}
