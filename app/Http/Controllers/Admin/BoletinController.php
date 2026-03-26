<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ScopesBySede;
use App\Models\{Asistencia, Boletin, Nota, User, Curso, Periodo, CursoMateria, Mensaje, Notificacion, Matricula, Observacion, Sede, Actividad};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BoletinController extends Controller
{
    use ScopesBySede;

    public function index(): Response
    {
        // Periodos disponibles
        $periodos = Periodo::orderByDesc('anio')->orderBy('numero')->get();
        $periodoActivo = Periodo::where('activo', true)->first();

        // Cursos activos del año actual
        $cursos = Curso::activo()
            ->when($this->sedeId(), fn($q, $s) => $q->where('sede_id', $s))
            ->orderByRaw("CASE WHEN nivel = 'preescolar' THEN 1 WHEN nivel = 'transicion' THEN 2 WHEN nivel = 'primaria' THEN 3 WHEN nivel = 'bachillerato' THEN 4 ELSE 5 END")
            ->orderBy('grado')
            ->orderBy('grupo')
            ->get();

        // Niveles únicos (normalizar preescolar → transicion)
        $niveles = $cursos->pluck('nivel')
            ->map(fn($n) => $n === 'preescolar' ? 'transicion' : $n)
            ->unique()->values();

        // Sedes activas
        $sedes = Sede::where('activa', true)->orderBy('nombre')
            ->when($this->sedeId(), fn($q, $s) => $q->where('id', $s))
            ->get()->map(fn($s) => ['id' => $s->id, 'nombre' => $s->nombre]);

        // Boletines con relaciones completas
        $boletines = Boletin::with(['estudiante.padres', 'periodo', 'curso.directorGrupo'])
            ->when($this->sedeId(), fn($q, $s) => $q->whereHas('curso', fn($cq) => $cq->where('sede_id', $s)))
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Boletin $b) {
                $padres = $b->estudiante->padres()
                    ->select('users.id', 'users.name')
                    ->get()
                    ->map(fn($p) => ['id' => $p->id, 'name' => $p->name])
                    ->values();

                // Todos los períodos del mismo año académico, ordenados por número
                $todosPeriodos = Periodo::where('anio', $b->periodo->anio)
                    ->orderBy('numero')
                    ->get();

                // IDs de CursoMaterias de este curso
                $cmsAll = CursoMateria::where('curso_id', $b->curso_id)
                    ->with('materia')
                    ->get()
                    ->keyBy('id');

                // Notas definitivas del estudiante en este curso para TODOS los períodos del año
                $todasNotas = Nota::where('estudiante_id', $b->estudiante_id)
                    ->whereIn('curso_materia_id', $cmsAll->keys())
                    ->whereIn('periodo_id', $todosPeriodos->pluck('id'))
                    ->where('tipo', 'definitiva')
                    ->get();

                // Indicadores (títulos de actividades) por cursoMateria para el período actual
                $indicadoresPorCM = Actividad::whereIn('curso_materia_id', $cmsAll->keys())
                    ->where('periodo_id', $b->periodo_id)
                    ->orderBy('created_at')
                    ->get()
                    ->groupBy('curso_materia_id')
                    ->map(fn($acts) => $acts->take(6)->pluck('titulo')->values());

                // Agrupar notas por cursoMateria y luego por período
                $notasPorCM = $todasNotas->groupBy('curso_materia_id');

                // Construir filas por materia
                $notas = $cmsAll->map(function ($cm) use ($todosPeriodos, $notasPorCM, $indicadoresPorCM, $b) {
                    $notasMateria   = $notasPorCM->get($cm->id, collect());
                    $notasPorPeriodo = $notasMateria->keyBy('periodo_id');

                    $ihMateria = (int) ($cm->horas_semanales ?? $cm->materia?->horas_semanales ?? 0);

                    // Indicadores de desempeño
                    $indicadores = $indicadoresPorCM->get($cm->id, collect())->toArray();

                    // Notas por número de período: p1, p2, p3, p4
                    $notasPeriodos = [];
                    foreach ($todosPeriodos as $p) {
                        $nVal = $notasPorPeriodo->get($p->id);
                        $notasPeriodos['p' . $p->numero] = $nVal ? round((float) $nVal->valor, 1) : null;
                    }

                    // Nota definitiva del período actual
                    $definitiva = $notasPorPeriodo->get($b->periodo_id);
                    $defVal = $definitiva ? round((float) $definitiva->valor, 1) : null;

                    return [
                        'materia'    => $cm->materia?->nombre ?? 'Sin nombre',
                        'ih'         => $ihMateria,
                        'indicadores'=> $indicadores,
                        'definitiva' => $defVal,
                        ...$notasPeriodos,
                    ];
                })
                ->filter(fn($row) => $row['definitiva'] !== null || collect($row)->only(['p1','p2','p3','p4'])->filter()->isNotEmpty())
                ->values();

                $completitud = $this->buildBoletinCompleteness(
                    $b->estudiante_id,
                    $b->curso_id,
                    $b->periodo,
                    $b->observacion_general,
                );

                return [
                    'id'              => $b->id,
                    'estudiante_id'   => $b->estudiante_id,
                    'estudiante'      => $b->estudiante->name,
                    'periodo_id'      => $b->periodo_id,
                    'periodo'         => $b->periodo->nombre,
                    'periodo_numero'  => $b->periodo->numero ?? 1,
                    'curso_id'        => $b->curso_id,
                    'curso'           => $b->curso->nombre,
                    'nivel'           => $b->curso->nivel,
                    'grado'           => $b->curso->grado ?? $b->curso->nombre,
                    'jornada'         => $b->curso->jornada ?? 'Mañana',
                    'anio'            => $b->periodo->anio,
                    'total_periodos'  => $todosPeriodos->count(),
                    'director_grupo'  => $b->curso->directorGrupo?->name ?? 'Sin asignar',
                    'promedio'        => (float) $b->promedio,
                    'puesto'          => $b->puesto,
                    'observacion'     => $b->observacion_general,
                    'estado'          => $b->estado,
                    'fecha_generacion'=> $b->created_at->format('Y-m-d'),
                    'padres'          => $padres,
                    'notas'           => $notas,
                    'completitud'     => $completitud,
                ];
            });

        // Resumen de notas por curso (sólo cursos con notas definitivas)
        $resumenNotas = $cursos->map(function (Curso $curso) use ($periodoActivo) {
            $cmsIds = CursoMateria::where('curso_id', $curso->id)->pluck('id');

            $definitivas = Nota::whereIn('curso_materia_id', $cmsIds)
                ->when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))
                ->where('tipo', 'definitiva')
                ->with('cursoMateria.materia', 'estudiante')
                ->get();

            if ($definitivas->isEmpty()) {
                return null;
            }

            $promedio   = $definitivas->avg('valor') ?? 0;
            $aprobados  = $definitivas->where('valor', '>=', 3.0)->count();
            $reprobados = $definitivas->where('valor', '<', 3.0)->count();
            $total      = Matricula::where('curso_id', $curso->id)->where('estado', 'activa')->count();

            // Mejor y peor materia
            $porMateria = $definitivas->groupBy('curso_materia_id')->map(fn($g) => $g->avg('valor'));
            $mejorCmId  = $porMateria->sortDesc()->keys()->first();
            $peorCmId   = $porMateria->sort()->keys()->first();

            $mejorMateria = $mejorCmId ? CursoMateria::find($mejorCmId)?->materia?->nombre : '-';
            $peorMateria  = $peorCmId ? CursoMateria::find($peorCmId)?->materia?->nombre : '-';

            // Detalle por materia
            $materias = $definitivas
                ->groupBy('curso_materia_id')
                ->map(function ($notas, $cmId) {
                    $nombre = $notas->first()?->cursoMateria?->materia?->nombre ?? 'Desconocida';
                    $avg    = round($notas->avg('valor'), 2);
                    return [
                        'materia'    => $nombre,
                        'promedio'   => $avg,
                        'aprobados'  => $notas->where('valor', '>=', 3.0)->count(),
                        'reprobados' => $notas->where('valor', '<', 3.0)->count(),
                        'total'      => $notas->count(),
                    ];
                })
                ->sortByDesc('promedio')
                ->values();

            // Detalle por estudiante
            $estudiantes = $definitivas
                ->groupBy('estudiante_id')
                ->map(function ($notas) {
                    $nombre   = $notas->first()?->estudiante?->name ?? 'Desconocido';
                    $avg      = round($notas->avg('valor'), 2);
                    return [
                        'nombre'     => $nombre,
                        'promedio'   => $avg,
                        'aprobadas'  => $notas->where('valor', '>=', 3.0)->count(),
                        'reprobadas' => $notas->where('valor', '<', 3.0)->count(),
                        'total'      => $notas->count(),
                    ];
                })
                ->sortByDesc('promedio')
                ->values();

            return [
                'curso_id'         => $curso->id,
                'nivel'            => $curso->nivel,
                'curso'            => $curso->nombre,
                'totalEstudiantes' => $total,
                'promedio'         => round($promedio, 1),
                'aprobados'        => $aprobados,
                'reprobados'       => $reprobados,
                'mejorMateria'     => $mejorMateria,
                'peorMateria'      => $peorMateria,
                'materias'         => $materias,
                'estudiantes'      => $estudiantes,
            ];
        })->filter()->values();

        return Inertia::render('Admin/Boletines', [
            'boletines'     => $boletines,
            'resumenNotas'  => $resumenNotas,
            'periodos'      => $periodos->map(fn($p) => ['id' => $p->id, 'nombre' => $p->nombre, 'anio' => $p->anio, 'activo' => $p->activo]),
            'cursos'        => $cursos->map(fn($c) => ['id' => $c->id, 'nombre' => $c->nombre, 'nivel' => $c->nivel, 'sede_id' => $c->sede_id]),
            'niveles'       => $niveles,
            'sedes'         => $sedes,
            'periodoActivo' => $periodoActivo ? ['id' => $periodoActivo->id, 'nombre' => $periodoActivo->nombre] : null,
        ]);
    }

    /**
     * Generar boletines masivamente
     */
    public function generate(Request $request)
    {
        $data = $request->validate([
            'periodo_id' => 'required|exists:periodos,id',
            'curso_id'   => 'nullable|exists:cursos,id',
            'nivel'      => 'nullable|string',
            'modo_validacion' => 'nullable|in:advertir,bloquear',
        ]);

        $modoValidacion = $data['modo_validacion'] ?? 'advertir';
        $periodo = Periodo::findOrFail($data['periodo_id']);

        $query = Matricula::where('periodo_id', $data['periodo_id'])->where('estado', 'activa');

        if (!empty($data['curso_id'])) {
            $query->where('curso_id', $data['curso_id']);
        } elseif (!empty($data['nivel'])) {
            $cursoIds = Curso::where('nivel', $data['nivel'])->pluck('id');
            $query->whereIn('curso_id', $cursoIds);
        }

        $matriculas = $query->with('curso')->get();
        $count = 0;
        $omitidos = 0;
        $incompletos = [];

        foreach ($matriculas as $mat) {
            $notasStatus = $this->buildNotasStatus($mat->estudiante_id, $mat->curso_id, $periodo->id);

            $boletin = Boletin::firstOrNew([
                'estudiante_id' => $mat->estudiante_id,
                'periodo_id'    => $data['periodo_id'],
            ]);
            $boletin->curso_id = $mat->curso_id;

            $directorObs = is_string($boletin->observacion_general)
                ? trim($boletin->observacion_general)
                : '';

            $obsSources = $this->collectObservationSources(
                $mat->estudiante_id,
                $mat->curso_id,
                $periodo,
                $directorObs,
            );

            $estaCompleto = $notasStatus['notas_completas'] && $obsSources['tiene_observacion_director'];

            if (!$estaCompleto && $modoValidacion === 'bloquear') {
                $omitidos++;
                continue;
            }

            $promedio = Nota::where('estudiante_id', $mat->estudiante_id)
                ->where('periodo_id', $data['periodo_id'])
                ->where('tipo', 'definitiva')
                ->avg('valor');

            $boletin->promedio = round($promedio ?? 0, 1);
            $boletin->observacion_general = $this->buildBoletinObservationText($directorObs, $obsSources);
            $boletin->estado = $estaCompleto ? 'generado' : 'borrador';
            $boletin->save();

            if (!$estaCompleto) {
                $incompletos[] = [
                    'estudiante_id' => $mat->estudiante_id,
                    'notas' => $notasStatus,
                    'director' => $obsSources['tiene_observacion_director'],
                ];
            }

            $count++;
        }

        if ($count === 0 && $omitidos > 0) {
            return redirect()->back()->with('error', "No se generaron boletines: {$omitidos} registro(s) están incompletos (notas y/o observación de director).\nUsa modo advertir o completa la información faltante.");
        }

        if (!empty($incompletos)) {
            $mensaje = "Se generaron {$count} boletines. {$omitidos} omitidos. "
                . count($incompletos)
                . " quedaron en borrador por información incompleta (notas y/o observación del director de grupo).";

            return redirect()->back()->with('warning', $mensaje);
        }

        return redirect()->back()->with('success', "Se generaron {$count} boletines completos.");
    }

    public function updateObservacion(Request $request, Boletin $boletin)
    {
        $data = $request->validate([
            'observacion_general' => 'required|string|min:8|max:2500',
        ]);

        $boletin->update([
            'observacion_general' => trim($data['observacion_general']),
        ]);

        return redirect()->back()->with('success', 'Observación general actualizada.');
    }

    /**
     * Notificar a los padres que el boletín está listo
     */
    public function notificar(Boletin $boletin)
    {
        $estudiante = $boletin->estudiante;
        $padres     = $estudiante->padres;
        $periodo    = $boletin->periodo->nombre ?? 'el período actual';

        if ($padres->isEmpty()) {
            return redirect()->back()->with('error', 'El estudiante no tiene acudientes registrados.');
        }

        $admin    = auth()->user();
        $asunto   = "Boletín disponible: {$periodo}";
        $contenido = "Estimado acudiente, le informamos que el boletín de notas de {$estudiante->name} correspondiente a {$periodo} ya está disponible para su consulta. Puede acceder a la plataforma para visualizarlo o descargarlo.";

        foreach ($padres as $padre) {
            Mensaje::create([
                'remitente_id'    => $admin->id,
                'destinatario_id' => $padre->id,
                'asunto'          => $asunto,
                'contenido'       => $contenido,
                'leido'           => false,
            ]);

            Notificacion::create([
                'user_id' => $padre->id,
                'tipo'    => 'nota',
                'titulo'  => $asunto,
                'mensaje' => $contenido,
                'leida'   => false,
            ]);
        }

        // Marcar como entregado
        $boletin->update(['estado' => 'entregado']);

        $count = $padres->count();
        return redirect()->back()->with('success', "Notificación enviada a {$count} acudiente(s).");
    }

    /**
     * Notificar masivamente según filtros
     */
    public function notificarMasivo(Request $request)
    {
        $data = $request->validate([
            'periodo_id' => 'required|exists:periodos,id',
            'curso_id'   => 'nullable|exists:cursos,id',
            'nivel'      => 'nullable|string',
        ]);

        $query = Boletin::where('periodo_id', $data['periodo_id'])
            ->where('estado', 'generado');

        if (!empty($data['curso_id'])) {
            $query->where('curso_id', $data['curso_id']);
        } elseif (!empty($data['nivel'])) {
            $cursoIds = Curso::where('nivel', $data['nivel'])->pluck('id');
            $query->whereIn('curso_id', $cursoIds);
        }

        $boletines = $query->with(['estudiante.padres', 'periodo'])->get();
        $admin     = auth()->user();
        $enviados  = 0;

        foreach ($boletines as $boletin) {
            $estudiante = $boletin->estudiante;
            $padres     = $estudiante->padres;
            $periodo    = $boletin->periodo->nombre ?? 'el período';

            if ($padres->isEmpty()) continue;

            $asunto    = "Boletín disponible: {$periodo}";
            $contenido = "Estimado acudiente, el boletín de notas de {$estudiante->name} correspondiente a {$periodo} ya está disponible para su consulta.";

            foreach ($padres as $padre) {
                Mensaje::create([
                    'remitente_id'    => $admin->id,
                    'destinatario_id' => $padre->id,
                    'asunto'          => $asunto,
                    'contenido'       => $contenido,
                    'leido'           => false,
                ]);

                Notificacion::create([
                    'user_id' => $padre->id,
                    'tipo'    => 'nota',
                    'titulo'  => $asunto,
                    'mensaje' => $contenido,
                    'leida'   => false,
                ]);
            }

            $boletin->update(['estado' => 'entregado']);
            $enviados++;
        }

        return redirect()->back()->with('success', "Se notificaron {$enviados} boletines.");
    }

    /**
     * Marcar boletín individual como enviado
     */
    public function marcarEnviado(Boletin $boletin)
    {
        $boletin->update(['estado' => 'entregado']);
        return redirect()->back()->with('success', 'Boletín marcado como entregado.');
    }

    private function buildBoletinCompleteness(int $estudianteId, int $cursoId, Periodo $periodo, ?string $observacionActual): array
    {
        $notas = $this->buildNotasStatus($estudianteId, $cursoId, $periodo->id);
        $obsSources = $this->collectObservationSources($estudianteId, $cursoId, $periodo, $observacionActual);

        $mensajes = [];
        if (!$notas['notas_completas']) {
            $mensajes[] = "Faltan notas definitivas ({$notas['con_nota']}/{$notas['materias_total']}).";
        }
        if (!$obsSources['tiene_observacion_director']) {
            $mensajes[] = 'Falta observación del director de grupo.';
        }

        return [
            'estado' => empty($mensajes) ? 'completo' : 'incompleto',
            'notas_completas' => $notas['notas_completas'],
            'materias_total' => $notas['materias_total'],
            'materias_con_nota' => $notas['con_nota'],
            'tiene_observacion_director' => $obsSources['tiene_observacion_director'],
            'comentarios_docentes_count' => $obsSources['comentarios_docentes_count'],
            'comentarios_asistencia_count' => $obsSources['comentarios_asistencia_count'],
            'mensajes' => $mensajes,
        ];
    }

    private function buildNotasStatus(int $estudianteId, int $cursoId, int $periodoId): array
    {
        $cmIds = CursoMateria::where('curso_id', $cursoId)->pluck('id');
        $materiasTotal = $cmIds->count();

        $conNota = Nota::where('estudiante_id', $estudianteId)
            ->whereIn('curso_materia_id', $cmIds)
            ->where('periodo_id', $periodoId)
            ->where('tipo', 'definitiva')
            ->distinct('curso_materia_id')
            ->count('curso_materia_id');

        return [
            'materias_total' => $materiasTotal,
            'con_nota' => $conNota,
            'notas_completas' => $materiasTotal > 0 && $conNota >= $materiasTotal,
        ];
    }

    private function collectObservationSources(int $estudianteId, int $cursoId, Periodo $periodo, ?string $observacionActual): array
    {
        $inicio = $periodo->fecha_inicio;
        $fin = $periodo->fecha_fin;

        $directorObs = is_string($observacionActual) ? trim($observacionActual) : '';
        $tieneDirectorObs = $directorObs !== '' && stripos($directorObs, 'boletín generado automáticamente') === false;

        $comentariosDocentes = Observacion::where('estudiante_id', $estudianteId)
            ->whereBetween('fecha', [$inicio, $fin])
            ->orderByDesc('fecha')
            ->limit(4)
            ->pluck('descripcion')
            ->map(fn($txt) => trim((string) $txt))
            ->filter()
            ->values();

        $cmIds = CursoMateria::where('curso_id', $cursoId)->pluck('id');
        $comentariosAsistencia = Asistencia::where('estudiante_id', $estudianteId)
            ->whereIn('curso_materia_id', $cmIds)
            ->whereBetween('fecha', [$inicio, $fin])
            ->whereNotNull('observacion')
            ->where('observacion', '!=', '')
            ->orderByDesc('fecha')
            ->limit(4)
            ->pluck('observacion')
            ->map(fn($txt) => trim((string) $txt))
            ->filter()
            ->values();

        return [
            'tiene_observacion_director' => $tieneDirectorObs,
            'director_observacion' => $directorObs,
            'comentarios_docentes' => $comentariosDocentes->all(),
            'comentarios_docentes_count' => $comentariosDocentes->count(),
            'comentarios_asistencia' => $comentariosAsistencia->all(),
            'comentarios_asistencia_count' => $comentariosAsistencia->count(),
        ];
    }

    private function buildBoletinObservationText(string $directorObs, array $obsSources): string
    {
        $secciones = [];

        $directorLimpia = trim($directorObs);
        if ($directorLimpia !== '' && stripos($directorLimpia, 'boletín generado automáticamente') === false) {
            $secciones[] = "Director de grupo:\n" . $directorLimpia;
        } else {
            $secciones[] = 'Director de grupo: Pendiente por completar.';
        }

        if (!empty($obsSources['comentarios_docentes'])) {
            $secciones[] = "Comentarios docentes (reportes globales):\n- "
                . implode("\n- ", $obsSources['comentarios_docentes']);
        }

        if (!empty($obsSources['comentarios_asistencia'])) {
            $secciones[] = "Observaciones de asistencia:\n- "
                . implode("\n- ", $obsSources['comentarios_asistencia']);
        }

        $texto = trim(implode("\n\n", $secciones));
        return $texto !== '' ? $texto : 'Boletín generado automáticamente.';
    }
}
