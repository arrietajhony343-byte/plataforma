<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\{Actividad, ConceptoNota, CursoMateria, Entrega, Matricula, Nota, Periodo};
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class NotaController extends Controller
{
    /* ───────────────────────────────────────────────
     * Page — render Inertia view with filter options
     * ─────────────────────────────────────────────── */
    public function index(): Response
    {
        $user = auth()->user();
        $anio = now('America/Bogota')->year;

        $cursoMaterias = CursoMateria::where('profesor_id', $user->id)
            ->whereHas('curso', fn ($q) => $q->where('anio', $anio))
            ->with(['curso', 'materia'])
            ->get();

        // Safety fallback: if no courses found for current year, use the most recent year with data
        if ($cursoMaterias->isEmpty()) {
            $anio = CursoMateria::where('profesor_id', $user->id)
                ->join('cursos', 'cursos.id', '=', 'curso_materia.curso_id')
                ->max('cursos.anio') ?? $anio;

            $cursoMaterias = CursoMateria::where('profesor_id', $user->id)
                ->whereHas('curso', fn ($q) => $q->where('anio', $anio))
                ->with(['curso', 'materia'])
                ->get();
        }

        $cursos = $cursoMaterias->pluck('curso')->unique('id')->map(fn ($c) => [
            'id' => $c->id, 'nombre' => $c->nombre,
        ])->values();

        $materias = $cursoMaterias->pluck('materia')->unique('id')->map(fn ($m) => [
            'id' => $m->id, 'nombre' => $m->nombre,
        ])->values();

        // Get periods for the same year as covers, ordered with active first
        $periodos = Periodo::where('anio', $anio)
            ->orderByRaw("CASE estado WHEN 'activo' THEN 0 WHEN 'pendiente' THEN 1 ELSE 2 END")
            ->orderBy('numero')
            ->get()
            ->map(fn ($p) => [
                'id'             => $p->id,
                'nombre'         => $p->nombre,
                'estado'         => $p->estado,
                'notasAbiertas'  => (bool) $p->notas_abiertas,
                'ventanaInicio'  => $p->ventana_inicio?->setTimezone('America/Bogota')->format('Y-m-d\TH:i'),
                'ventanaFin'     => $p->ventana_fin?->setTimezone('America/Bogota')->format('Y-m-d\TH:i'),
            ]);

        $cursoMateriasMap = $cursoMaterias->map(fn ($cm) => [
            'id'         => $cm->id,
            'curso_id'   => $cm->curso_id,
            'materia_id' => $cm->materia_id,
        ]);

        return Inertia::render('Profesor/RegistrarNotas', [
            'profesor'      => ['nombre' => $user->name],
            'cursos'        => $cursos,
            'materias'      => $materias,
            'periodos'      => $periodos,
            'cursoMaterias' => $cursoMateriasMap,
        ]);
    }

    /* ──────────────────────────────────────────────────────────
     * JSON API — students, concepts, grades for a combination
     * ────────────────────────────────────────────────────────── */
    public function datos(Request $request)
    {
        $request->validate([
            'curso_materia_id' => 'required|exists:curso_materia,id',
            'periodo_id'       => 'required|exists:periodos,id',
        ]);

        $cmId      = (int) $request->curso_materia_id;
        $periodoId = (int) $request->periodo_id;

        $cm      = CursoMateria::with('curso')->findOrFail($cmId);
        $periodo = Periodo::findOrFail($periodoId);

        if ($cm->profesor_id !== auth()->id()) {
            abort(403);
        }

        /* ── Concepts (auto-create "Actividades" if none exist) ── */
        $conceptos = ConceptoNota::where('curso_materia_id', $cmId)
            ->where('periodo_id', $periodoId)
            ->orderBy('orden')
            ->get();

        if ($conceptos->isEmpty()) {
            ConceptoNota::create([
                'curso_materia_id' => $cmId,
                'periodo_id'       => $periodoId,
                'nombre'           => 'Actividades',
                'porcentaje'       => 100,
                'tipo'             => 'actividades',
                'orden'            => 0,
            ]);
            $conceptos = ConceptoNota::where('curso_materia_id', $cmId)
                ->where('periodo_id', $periodoId)
                ->orderBy('orden')
                ->get();
        }

        /* ── Students ── */
        $matriculas = Matricula::where('curso_id', $cm->curso_id)
            ->activa()
            ->with('estudiante')
            ->get();

        /* ── Activities for this combo ── */
        $actividades = Actividad::where('curso_materia_id', $cmId)
            ->where('periodo_id', $periodoId)
            ->where('activa', true)
            ->get();

        $actividadIds = $actividades->pluck('id');

        $entregas = Entrega::whereIn('actividad_id', $actividadIds)
            ->where('estado', 'calificada')
            ->get()
            ->groupBy('estudiante_id');

        /* ── Manual grades ── */
        $conceptoManualIds = $conceptos->where('tipo', 'manual')->pluck('id');
        $notasManual = Nota::whereIn('concepto_nota_id', $conceptoManualIds)
            ->get()
            ->groupBy('estudiante_id');

        $notasDefinitivas = Nota::where('curso_materia_id', $cmId)
            ->where('periodo_id', $periodoId)
            ->where('tipo', 'definitiva')
            ->whereIn('estudiante_id', $matriculas->pluck('estudiante_id'))
            ->get()
            ->keyBy('estudiante_id');

        /* ── Build per-student data ── */
        $estudiantesData = $matriculas->map(function ($mat) use ($actividades, $entregas, $notasManual, $conceptos, $notasDefinitivas) {
            $estId       = $mat->estudiante_id;
            $estEntregas = $entregas->get($estId, collect());

            // ---- Activity grade (weighted avg of calificaciones) ----
            $actividadDetalle = [];
            $sumPeso  = 0;
            $sumValor = 0;

            foreach ($actividades as $act) {
                $entrega = $estEntregas->firstWhere('actividad_id', $act->id);
                $calif   = $entrega ? (float) $entrega->calificacion : null;

                $actividadDetalle[] = [
                    'titulo'       => $act->titulo,
                    'tipo'         => $act->tipo,
                    'porcentaje'   => (float) $act->porcentaje,
                    'calificacion' => $calif,
                    'estado'       => $entrega ? $entrega->estado : 'pendiente',
                ];

                if ($calif !== null) {
                    $sumPeso  += $act->porcentaje;
                    $sumValor += $calif * $act->porcentaje;
                }
            }

            $actividadNota = $sumPeso > 0 ? round($sumValor / $sumPeso, 1) : null;

            // ---- Manual concept grades ----
            $estNotas = $notasManual->get($estId, collect());
            $manuales = [];
            foreach ($estNotas as $nota) {
                $manuales[$nota->concepto_nota_id] = (float) $nota->valor;
            }

            // ---- Definitiva (weighted average across all concepts) ----
            $sumDef     = 0;
            $sumDefPeso = 0;
            foreach ($conceptos as $c) {
                $valor = $c->tipo === 'actividades' ? $actividadNota : ($manuales[$c->id] ?? null);
                if ($valor !== null) {
                    $sumDef     += $valor * $c->porcentaje;
                    $sumDefPeso += $c->porcentaje;
                }
            }
            $definitiva = $sumDefPeso > 0 ? round($sumDef / $sumDefPeso, 1) : null;

            return [
                'id'               => $estId,
                'nombre'           => $mat->estudiante->name,
                'actividadNota'    => $actividadNota,
                'actividadDetalle' => $actividadDetalle,
                'manuales'         => (object) $manuales, // force JSON {}
                'definitiva'       => $definitiva,
                'indicadorDesempeno' => trim((string) ($notasDefinitivas->get($estId)?->descripcion ?? '')),
            ];
        })->sortBy('nombre')->values();

        return response()->json([
            'conceptos'     => $conceptos->map(fn ($c) => [
                'id'         => $c->id,
                'nombre'     => $c->nombre,
                'porcentaje' => (float) $c->porcentaje,
                'tipo'       => $c->tipo,
                'orden'      => $c->orden,
            ]),
            'estudiantes'   => $estudiantesData,
            'notasAbiertas' => (bool) $periodo->notas_abiertas && $periodo->estado === 'activo',
            'puedeEditar'   => in_array($periodo->estado, ['activo', 'pendiente'], true),
        ]);
    }

    /* ────────────────────────────────────────────
     * Save / sync concept breakdown configuration
     * ──────────────────────────────────────────── */
    public function guardarConceptos(Request $request)
    {
        $data = $request->validate([
            'curso_materia_id'       => 'required|exists:curso_materia,id',
            'periodo_id'             => 'required|exists:periodos,id',
            'conceptos'              => 'required|array|min:1',
            'conceptos.*.id'         => 'nullable|integer',
            'conceptos.*.nombre'     => 'required|string|max:100',
            'conceptos.*.porcentaje' => 'required|numeric|min:0|max:100',
            'conceptos.*.tipo'       => 'required|in:actividades,manual',
            'conceptos.*.orden'      => 'required|integer|min:0',
        ]);

        $cm = CursoMateria::findOrFail($data['curso_materia_id']);
        if ($cm->profesor_id !== auth()->id()) {
            abort(403);
        }

        // Total must equal 100
        $total = collect($data['conceptos'])->sum('porcentaje');
        if (abs($total - 100) > 0.01) {
            return response()->json(['message' => 'La suma de porcentajes debe ser exactamente 100%.'], 422);
        }

        // Only one "actividades" concept allowed
        if (collect($data['conceptos'])->where('tipo', 'actividades')->count() > 1) {
            return response()->json(['message' => 'Solo puede haber un concepto de tipo "Actividades".'], 422);
        }

        // Sync concepts
        $existingIds = ConceptoNota::where('curso_materia_id', $data['curso_materia_id'])
            ->where('periodo_id', $data['periodo_id'])
            ->pluck('id')
            ->toArray();

        $newIds = [];
        foreach ($data['conceptos'] as $cData) {
            if (!empty($cData['id']) && in_array($cData['id'], $existingIds)) {
                $concepto = ConceptoNota::find($cData['id']);
                $concepto->update([
                    'nombre'     => $cData['nombre'],
                    'porcentaje' => $cData['porcentaje'],
                    'tipo'       => $cData['tipo'],
                    'orden'      => $cData['orden'],
                ]);
                $newIds[] = $concepto->id;
            } else {
                $concepto = ConceptoNota::create([
                    'curso_materia_id' => $data['curso_materia_id'],
                    'periodo_id'       => $data['periodo_id'],
                    'nombre'           => $cData['nombre'],
                    'porcentaje'       => $cData['porcentaje'],
                    'tipo'             => $cData['tipo'],
                    'orden'            => $cData['orden'],
                ]);
                $newIds[] = $concepto->id;
            }
        }

        // Remove concepts that were not in the new list
        $toDelete = array_diff($existingIds, $newIds);
        if (!empty($toDelete)) {
            ConceptoNota::whereIn('id', $toDelete)->delete();
        }

        return response()->json(['success' => true]);
    }

    /* ──────────────────────────
     * Save manual concept grades
     * ────────────────────────── */
    public function store(Request $request)
    {
        $data = $request->validate([
            'curso_materia_id'         => 'required|exists:curso_materia,id',
            'periodo_id'               => 'required|exists:periodos,id',
            'notas'                    => 'nullable|array',
            'notas.*.concepto_nota_id' => 'required_with:notas|exists:concepto_notas,id',
            'notas.*.estudiante_id'    => 'required_with:notas|exists:users,id',
            'notas.*.valor'            => 'required_with:notas|numeric|min:0|max:5',
            'indicadores'              => 'nullable|array',
            'indicadores.*.estudiante_id' => 'required_with:indicadores|exists:users,id',
            'indicadores.*.texto'      => 'nullable|string|max:255',
        ]);

        $cursoMateriaId = (int) $data['curso_materia_id'];
        $periodoId = (int) $data['periodo_id'];

        $cm = CursoMateria::findOrFail($cursoMateriaId);
        if ($cm->profesor_id !== auth()->id()) {
            abort(403);
        }

        $periodo = Periodo::findOrFail($periodoId);
        if (!in_array($periodo->estado, ['activo', 'pendiente'], true)) {
            return response()->json(['message' => 'El período está cerrado y no permite cambios de notas.'], 422);
        }

        $checked = []; // cache ownership & lock checks per concept

        foreach (($data['notas'] ?? []) as $notaData) {
            $cId = $notaData['concepto_nota_id'];

            if (!isset($checked[$cId])) {
                $concepto = ConceptoNota::find($cId);
                if (!$concepto || $concepto->tipo !== 'manual') {
                    continue;
                }

                if ((int) $concepto->curso_materia_id !== $cursoMateriaId || (int) $concepto->periodo_id !== $periodoId) {
                    continue;
                }

                $cmConcepto = CursoMateria::find($concepto->curso_materia_id);
                if (!$cmConcepto || $cmConcepto->profesor_id !== auth()->id()) {
                    continue;
                }

                $checked[$cId] = $concepto;
            }

            $concepto = $checked[$cId];

            Nota::updateOrCreate(
                [
                    'concepto_nota_id' => $cId,
                    'estudiante_id'    => $notaData['estudiante_id'],
                ],
                [
                    'curso_materia_id' => $concepto->curso_materia_id,
                    'periodo_id'       => $concepto->periodo_id,
                    'valor'            => min(5, max(0, $notaData['valor'])),
                    'tipo'             => $concepto->nombre,
                    'descripcion'      => $concepto->nombre,
                ]
            );
        }

        $indicadoresMap = collect($data['indicadores'] ?? [])
            ->mapWithKeys(function ($item) {
                return [(int) $item['estudiante_id'] => trim((string) ($item['texto'] ?? ''))];
            });

        $estudiantesIds = collect($data['notas'] ?? [])
            ->pluck('estudiante_id')
            ->map(fn($id) => (int) $id)
            ->merge($indicadoresMap->keys())
            ->unique()
            ->values();

        if ($estudiantesIds->isNotEmpty()) {
            $this->sincronizarDefinitivas($cursoMateriaId, $periodoId, $estudiantesIds, $indicadoresMap);
        }

        return response()->json(['success' => true]);
    }

    private function sincronizarDefinitivas(int $cursoMateriaId, int $periodoId, Collection $estudiantesIds, Collection $indicadoresMap): void
    {
        $conceptos = ConceptoNota::where('curso_materia_id', $cursoMateriaId)
            ->where('periodo_id', $periodoId)
            ->orderBy('orden')
            ->get();

        if ($conceptos->isEmpty()) {
            return;
        }

        $manualConceptIds = $conceptos->where('tipo', 'manual')->pluck('id');

        $notasManualesPorEstudiante = Nota::whereIn('estudiante_id', $estudiantesIds)
            ->whereIn('concepto_nota_id', $manualConceptIds)
            ->get()
            ->groupBy('estudiante_id')
            ->map(fn($rows) => $rows->keyBy('concepto_nota_id'));

        $actividades = Actividad::where('curso_materia_id', $cursoMateriaId)
            ->where('periodo_id', $periodoId)
            ->where('activa', true)
            ->get(['id', 'porcentaje'])
            ->keyBy('id');

        $entregasPorEstudiante = collect();
        if ($actividades->isNotEmpty()) {
            $entregasPorEstudiante = Entrega::whereIn('actividad_id', $actividades->keys())
                ->whereIn('estudiante_id', $estudiantesIds)
                ->where('estado', 'calificada')
                ->get(['actividad_id', 'estudiante_id', 'calificacion'])
                ->groupBy('estudiante_id')
                ->map(fn($rows) => $rows->keyBy('actividad_id'));
        }

        foreach ($estudiantesIds as $estudianteId) {
            $estudianteId = (int) $estudianteId;

            $actividadNota = $this->calcularNotaActividades(
                $actividades,
                $entregasPorEstudiante->get($estudianteId, collect())
            );

            $manualesEstudiante = $notasManualesPorEstudiante->get($estudianteId, collect());

            $sumDef = 0;
            $sumDefPeso = 0;
            foreach ($conceptos as $concepto) {
                $valor = null;

                if ($concepto->tipo === 'actividades') {
                    $valor = $actividadNota;
                } else {
                    $notaManual = $manualesEstudiante->get($concepto->id);
                    $valor = $notaManual ? (float) $notaManual->valor : null;
                }

                if ($valor !== null) {
                    $sumDef += $valor * (float) $concepto->porcentaje;
                    $sumDefPeso += (float) $concepto->porcentaje;
                }
            }

            $definitiva = $sumDefPeso > 0 ? round($sumDef / $sumDefPeso, 1) : null;

            $debeActualizarIndicador = $indicadoresMap->has($estudianteId);
            $indicadorTexto = $debeActualizarIndicador ? $indicadoresMap->get($estudianteId) : null;
            $descripcionIndicador = ($indicadorTexto !== null && $indicadorTexto !== '') ? $indicadorTexto : null;

            if ($definitiva !== null) {
                $payload = [
                    'concepto_nota_id' => null,
                    'valor' => $definitiva,
                ];

                if ($debeActualizarIndicador) {
                    $payload['descripcion'] = $descripcionIndicador;
                }

                Nota::updateOrCreate(
                    [
                        'estudiante_id' => $estudianteId,
                        'curso_materia_id' => $cursoMateriaId,
                        'periodo_id' => $periodoId,
                        'tipo' => 'definitiva',
                    ],
                    $payload
                );

                continue;
            }

            if ($debeActualizarIndicador) {
                Nota::where('estudiante_id', $estudianteId)
                    ->where('curso_materia_id', $cursoMateriaId)
                    ->where('periodo_id', $periodoId)
                    ->where('tipo', 'definitiva')
                    ->update(['descripcion' => $descripcionIndicador]);
            }
        }
    }

    private function calcularNotaActividades(Collection $actividades, Collection $entregasEstudiante): ?float
    {
        if ($actividades->isEmpty()) {
            return null;
        }

        $sumPeso = 0;
        $sumValor = 0;

        foreach ($actividades as $actividadId => $actividad) {
            $entrega = $entregasEstudiante->get($actividadId);
            if (!$entrega || $entrega->calificacion === null) {
                continue;
            }

            $peso = (float) $actividad->porcentaje;
            $calificacion = (float) $entrega->calificacion;

            $sumPeso += $peso;
            $sumValor += $calificacion * $peso;
        }

        return $sumPeso > 0 ? round($sumValor / $sumPeso, 1) : null;
    }
}
