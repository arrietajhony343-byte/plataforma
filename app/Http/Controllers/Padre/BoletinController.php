<?php

namespace App\Http\Controllers\Padre;

use App\Http\Controllers\Controller;
use App\Models\{Boletin, ConceptoNota, CursoMateria, Matricula, Nota, Periodo, User};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class BoletinController extends Controller
{
    public function index(Request $request): Response
    {
        $padre = $request->user();

        $hijos = $padre->hijos()
            ->select('users.id', 'users.name', 'users.documento')
            ->orderBy('users.name')
            ->get();

        if ($hijos->isEmpty()) {
            return Inertia::render('Padre/Boletin', [
                'padre' => [
                    'nombre' => $padre->name,
                ],
                'hijos' => [],
                'hijo' => null,
                'periodos' => [],
                'periodoSeleccionadoId' => null,
                'boletinActual' => null,
                'stats' => [
                    'promedio' => null,
                    'materias' => 0,
                    'puesto' => null,
                    'total_estudiantes' => 0,
                ],
                'notas' => [],
                'boletines' => [],
            ]);
        }

        $hijoId = (int) ($request->query('hijo_id') ?: $hijos->first()->id);
        if (!$hijos->pluck('id')->contains($hijoId)) {
            $hijoId = (int) $hijos->first()->id;
        }

        $hijo = User::findOrFail($hijoId);

        $matriculaActiva = Matricula::query()
            ->where('estudiante_id', $hijo->id)
            ->where('estado', 'activa')
            ->with('curso:id,nombre,grado,grupo,anio')
            ->latest('id')
            ->first();

        $anio = $matriculaActiva?->curso?->anio ?? (int) (Periodo::max('anio') ?: now()->year);

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

        $periodoSeleccionado = $periodos->firstWhere('id', $periodoSeleccionadoId);

        $matriculaPeriodo = Matricula::query()
            ->where('estudiante_id', $hijo->id)
            ->where('estado', 'activa')
            ->when($periodoSeleccionadoId > 0, fn($q) => $q->where('periodo_id', $periodoSeleccionadoId))
            ->with('curso:id,nombre,grado,grupo')
            ->latest('id')
            ->first();

        $curso = $matriculaPeriodo?->curso ?? $matriculaActiva?->curso;
        $cursoId = $curso?->id;

        $notas = collect();
        $conceptos = collect();
        $promedioPeriodo = null;
        $materiasEnCurso = 0;
        $puesto = null;
        $totalEstudiantes = 0;

        if ($cursoId) {
            $cms = CursoMateria::query()
                ->where('curso_id', $cursoId)
                ->with(['materia:id,nombre', 'profesor:id,name'])
                ->get()
                ->keyBy('id');

            $periodoIds = $periodos->pluck('id');

            $notasDefinitivas = Nota::query()
                ->where('estudiante_id', $hijo->id)
                ->whereIn('curso_materia_id', $cms->keys())
                ->whereIn('periodo_id', $periodoIds)
                ->where('tipo', 'definitiva')
                ->get();

            $notasPorCM = $notasDefinitivas->groupBy('curso_materia_id');

            $conceptosPeriodo = ConceptoNota::query()
                ->where('periodo_id', $periodoSeleccionadoId)
                ->whereIn('curso_materia_id', $cms->keys())
                ->orderBy('orden')
                ->get();

            $conceptos = $conceptosPeriodo
                ->map(fn($c) => [
                    'key' => $this->conceptKey($c->nombre),
                    'nombre' => $c->nombre,
                ])
                ->unique('key')
                ->values();

            $conceptosPorCM = $conceptosPeriodo->groupBy('curso_materia_id');

            $notasPeriodo = Nota::query()
                ->where('estudiante_id', $hijo->id)
                ->whereIn('curso_materia_id', $cms->keys())
                ->where('periodo_id', $periodoSeleccionadoId)
                ->with('conceptoNota:id,nombre,porcentaje')
                ->get()
                ->groupBy('curso_materia_id');

            $notas = $cms->map(function ($cm, $cmId) use ($conceptos, $conceptosPorCM, $notasPorCM, $notasPeriodo, $periodoSeleccionadoId) {
                $notasMateriaPeriodo = $notasPeriodo->get($cmId, collect());

                $conceptosRow = [];
                foreach ($conceptos as $c) {
                    $match = $notasMateriaPeriodo->first(function ($n) use ($c) {
                        $nombre = $n->conceptoNota?->nombre ?? $n->descripcion ?? $n->tipo;
                        return $this->conceptKey((string) $nombre) === $c['key'];
                    });
                    $conceptosRow[$c['key']] = $match ? round((float) $match->valor, 1) : null;
                }

                $notaFinal = null;
                $definitiva = $notasPorCM->get($cmId, collect())->firstWhere('periodo_id', $periodoSeleccionadoId);
                if ($definitiva) {
                    $notaFinal = round((float) $definitiva->valor, 1);
                } else {
                    $defsLocal = collect($conceptosRow)->filter(fn($v) => $v !== null);
                    if ($defsLocal->isNotEmpty()) {
                        $notaFinal = round((float) $defsLocal->avg(), 1);
                    }
                }

                $estado = 'en_curso';
                if ($notaFinal !== null) {
                    $estado = $notaFinal >= 3.0 ? 'aprobado' : 'reprobado';
                }

                return [
                    'materia' => $cm->materia?->nombre ?? 'Materia',
                    'profesor' => $cm->profesor?->name ?? 'Sin profesor',
                    'conceptos' => $conceptosRow,
                    'notaFinal' => $notaFinal,
                    'estado' => $estado,
                ];
            })->values();

            $finales = $notas->pluck('notaFinal')->filter(fn($n) => $n !== null);
            $promedioPeriodo = $finales->isNotEmpty() ? round((float) $finales->avg(), 1) : null;
            $materiasEnCurso = $notas->count();

            if ($periodoSeleccionadoId > 0 && $cms->isNotEmpty()) {
                $estudiantesCurso = Matricula::query()
                    ->where('curso_id', $cursoId)
                    ->where('estado', 'activa')
                    ->pluck('estudiante_id')
                    ->unique();

                $totalEstudiantes = $estudiantesCurso->count();

                $promediosEstudiante = Nota::query()
                    ->whereIn('estudiante_id', $estudiantesCurso)
                    ->whereIn('curso_materia_id', $cms->keys())
                    ->where('periodo_id', $periodoSeleccionadoId)
                    ->where('tipo', 'definitiva')
                    ->get()
                    ->groupBy('estudiante_id')
                    ->map(fn($group) => round((float) $group->avg('valor'), 3))
                    ->sortDesc()
                    ->values();

                $miPromedio = Nota::query()
                    ->where('estudiante_id', $hijo->id)
                    ->whereIn('curso_materia_id', $cms->keys())
                    ->where('periodo_id', $periodoSeleccionadoId)
                    ->where('tipo', 'definitiva')
                    ->avg('valor');

                if ($miPromedio !== null && $promediosEstudiante->isNotEmpty()) {
                    $mi = round((float) $miPromedio, 3);
                    $idx = $promediosEstudiante->search(fn($p) => $p <= $mi + 0.0001 && $p >= $mi - 0.0001);
                    if ($idx === false) {
                        $idx = $promediosEstudiante->search(fn($p) => $p < $mi);
                        $puesto = $idx === false ? 1 : (int) $idx + 1;
                    } else {
                        $puesto = (int) $idx + 1;
                    }
                }
            }
        }

        $boletines = $periodos->map(function ($periodo) use ($hijo, $periodoSeleccionadoId, $promedioPeriodo) {
            $boletin = Boletin::query()
                ->where('estudiante_id', $hijo->id)
                ->where('periodo_id', $periodo->id)
                ->first();

            $estado = 'pendiente';
            if ($boletin && in_array($boletin->estado, ['generado', 'entregado'], true)) {
                $estado = 'disponible';
            } elseif ($boletin || $periodo->estado === 'activo') {
                $estado = 'generando';
            }

            $archivoUrl = null;
            if ($boletin?->archivo) {
                if (str_starts_with($boletin->archivo, '/storage/') || str_starts_with($boletin->archivo, 'http://') || str_starts_with($boletin->archivo, 'https://')) {
                    $archivoUrl = $boletin->archivo;
                } else {
                    $archivoUrl = Storage::url($boletin->archivo);
                }
            }

            return [
                'periodo_id' => $periodo->id,
                'periodo' => $periodo->nombre,
                'numero' => (int) $periodo->numero,
                'estado' => $estado,
                'fecha_generacion' => $boletin?->created_at?->format('Y-m-d'),
                'promedio' => $boletin?->promedio !== null
                    ? (float) $boletin->promedio
                    : ($periodo->id === $periodoSeleccionadoId ? $promedioPeriodo : null),
                'archivo_url' => $archivoUrl,
            ];
        })->values();

        $boletinActual = $boletines->firstWhere('periodo_id', $periodoSeleccionadoId);

        return Inertia::render('Padre/Boletin', [
            'padre' => [
                'nombre' => $padre->name,
            ],
            'hijos' => $hijos->map(fn($h) => [
                'id' => $h->id,
                'nombre' => $h->name,
            ])->values(),
            'hijo' => [
                'id' => $hijo->id,
                'nombre' => $hijo->name,
                'grado' => $curso?->grado ? ($curso->grado . '°') : 'Sin grado',
                'seccion' => $curso?->grupo ? ('Seccion ' . $curso->grupo) : 'Seccion —',
                'codigo' => $hijo->documento ?: ('EST-' . str_pad((string) $hijo->id, 6, '0', STR_PAD_LEFT)),
            ],
            'periodos' => $periodos->map(fn($p) => [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'numero' => (int) $p->numero,
                'estado' => $p->estado,
            ])->values(),
            'periodoSeleccionadoId' => $periodoSeleccionadoId,
            'boletinActual' => $boletinActual,
            'stats' => [
                'promedio' => $promedioPeriodo,
                'materias' => $materiasEnCurso,
                'puesto' => $puesto,
                'total_estudiantes' => $totalEstudiantes,
            ],
            'conceptos' => $conceptos,
            'notas' => $notas,
            'boletines' => $boletines,
        ]);
    }

    private function conceptKey(string $name): string
    {
        $name = mb_strtolower(trim($name), 'UTF-8');
        $name = preg_replace('/\s+/', '_', $name) ?? $name;
        $name = preg_replace('/[^a-z0-9_]/', '', $name) ?? $name;
        return $name !== '' ? $name : 'concepto';
    }
}
