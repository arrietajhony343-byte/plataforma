<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\{Actividad, CursoMateria, Periodo, ProfesorEvento};
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class CalendarioController extends Controller
{
    private function getCursoMaterias($user, int $anio)
    {
        return CursoMateria::where('profesor_id', $user->id)
            ->whereHas('curso', fn($q) => $q->where('anio', $anio))
            ->with([
                'curso:id,nombre,anio',
                'materia:id,nombre',
                'horarioBloques:id,curso_materia_id,dia,hora_inicio,hora_fin,salon',
            ])
            ->get();
    }

    private function getClasesSemanales($cursoMaterias)
    {
        return $cursoMaterias
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
    }

    public function index(): Response
    {
        $user = auth()->user();
        $anio = now('America/Bogota')->year;

        $cursoMaterias = $this->getCursoMaterias($user, $anio);

        $cmIds = $cursoMaterias->pluck('id');
        $cursoIds = $cursoMaterias->pluck('curso_id')->unique()->values();
        $clasesSemanales = $this->getClasesSemanales($cursoMaterias);

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

        $hoy = now('America/Bogota')->toDateString();
        $eventosPersonales = collect();
        if (Schema::hasTable('profesor_eventos')) {
            $eventosPersonales = ProfesorEvento::query()
                ->where('user_id', $user->id)
                ->whereYear('fecha', $anio)
                ->orderBy('fecha')
                ->orderBy('hora')
                ->get()
                ->map(fn(ProfesorEvento $evento) => [
                    'id' => $evento->id,
                    'titulo' => $evento->titulo,
                    'descripcion' => $evento->descripcion,
                    'fecha' => $this->formatDateValue($evento->fecha),
                    'hora' => $this->formatTimeValue($evento->hora),
                    'color' => $evento->color,
                ])
                ->values();
        }

        $resumen = [
            'totalCursos' => $cursoIds->count(),
            'totalClasesSemanales' => $clasesSemanales->count(),
            'actividadesPendientes' => $actividades->filter(fn($a) => $a['fecha'] >= $hoy)->count(),
            'ventanasAbiertas' => $ventanasNotas->where('notasAbiertas', true)->count(),
            'eventosPersonales' => $eventosPersonales->filter(fn($e) => $e['fecha'] >= $hoy)->count(),
        ];

        return Inertia::render('Profesor/Calendario', [
            'profesor' => ['nombre' => $user->name],
            'resumen' => $resumen,
            'clasesSemanales' => $clasesSemanales,
            'actividades' => $actividades,
            'hitosInstitucionales' => $hitosInstitucionales,
            'ventanasNotas' => $ventanasNotas,
            'eventosPersonales' => $eventosPersonales,
        ]);
    }

    public function horario(): Response
    {
        $user = auth()->user();
        $anio = now('America/Bogota')->year;

        $cursoMaterias = $this->getCursoMaterias($user, $anio);
        $clasesSemanales = $this->getClasesSemanales($cursoMaterias);

        $resumen = [
            'totalCursos' => $cursoMaterias->pluck('curso_id')->unique()->count(),
            'totalClasesSemanales' => $clasesSemanales->count(),
            'diasConClase' => $clasesSemanales->pluck('dia')->unique()->count(),
        ];

        return Inertia::render('Profesor/Horario', [
            'profesor' => ['nombre' => $user->name],
            'resumen' => $resumen,
            'clasesSemanales' => $clasesSemanales,
        ]);
    }

    public function storePersonalEvento(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'titulo' => ['required', 'string', 'max:120'],
            'descripcion' => ['nullable', 'string', 'max:500'],
            'fecha' => ['required', 'date'],
            'hora' => ['nullable', 'date_format:H:i'],
            'color' => ['nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        ProfesorEvento::query()->create([
            'user_id' => $request->user()->id,
            'titulo' => $data['titulo'],
            'descripcion' => $data['descripcion'] ?? null,
            'fecha' => $data['fecha'],
            'hora' => $data['hora'] ?? null,
            'color' => $data['color'] ?? '#0f766e',
        ]);

        return redirect()->back()->with('success', 'Evento personal registrado.');
    }

    public function destroyPersonalEvento(ProfesorEvento $evento): RedirectResponse
    {
        abort_unless((int) $evento->user_id === (int) auth()->id(), 403);

        $evento->delete();

        return redirect()->back()->with('success', 'Evento personal eliminado.');
    }

    private function formatDateValue(mixed $value): ?string
    {
        if ($value instanceof CarbonInterface) {
            return $value->format('Y-m-d');
        }

        if (is_string($value) && $value !== '') {
            return substr($value, 0, 10);
        }

        return null;
    }

    private function formatTimeValue(mixed $value): ?string
    {
        if ($value instanceof CarbonInterface) {
            return $value->format('H:i');
        }

        if (is_string($value) && $value !== '') {
            return substr($value, 0, 5);
        }

        return null;
    }
}
