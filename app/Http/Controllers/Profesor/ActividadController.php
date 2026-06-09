<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\{CursoMateria, Actividad, Entrega, Matricula, Notificacion, Periodo, Pregunta, Opcion};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ActividadController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        // loadCursoMaterias already computes pesoUsado
        $cursoMaterias = $this->loadCursoMaterias($user->id);
        $cmIds = $cursoMaterias->pluck('id')->toArray();

        // Estudiantes matriculados por curso (sin duplicados)
        $estudiantesPorCurso = $cursoMaterias
            ->groupBy('cursoId')
            ->map(fn($items) => (int)($items->first()['totalEstudiantes'] ?? 0));

        // Conteos de entregas por actividad
        $entregaStats = DB::table('entregas')
            ->join('actividades', 'actividades.id', '=', 'entregas.actividad_id')
            ->whereIn('actividades.curso_materia_id', $cmIds)
            ->select(
                'entregas.actividad_id',
                DB::raw("SUM(CASE WHEN entregas.estado IN ('entregada','atrasada','calificada') THEN 1 ELSE 0 END) as entregados"),
                DB::raw("SUM(CASE WHEN entregas.estado = 'calificada' THEN 1 ELSE 0 END) as calificados"),
                DB::raw("SUM(CASE WHEN entregas.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes"),
            )
            ->groupBy('entregas.actividad_id')
            ->get()
            ->keyBy('actividad_id');

        $actividades = Actividad::whereIn('curso_materia_id', $cmIds)
            ->with(['cursoMateria.curso', 'cursoMateria.materia'])
            ->latest()
            ->get()
            ->map(function ($a) use ($entregaStats, $estudiantesPorCurso) {
                $cursoId = $a->cursoMateria?->curso_id;
                $totalEst = $estudiantesPorCurso->get($cursoId, 0);
                $stats = $entregaStats->get($a->id);

                return [
                    'id'              => $a->id,
                    'titulo'          => $a->titulo,
                    'descripcion'     => $a->descripcion,
                    'tipo'            => $a->tipo,
                    'curso'           => $a->cursoMateria?->curso?->nombre,
                    'cursoId'         => $cursoId,
                    'materia'         => $a->cursoMateria?->materia?->nombre,
                    'cursoMateriaId'  => $a->curso_materia_id,
                    'fechaAsignacion' => $a->fecha_asignacion?->format('Y-m-d'),
                    'fechaEntrega'    => $a->fecha_entrega?->format('Y-m-d\TH:i'),
                    'porcentaje'      => (float)$a->porcentaje,
                    'activa'          => $a->activa,
                    'totalEstudiantes'=> (int)$totalEst,
                    'entregados'      => (int)($stats->entregados ?? 0),
                    'calificados'     => (int)($stats->calificados ?? 0),
                    'pendientes'      => (int)($stats->pendientes ?? 0),
                ];
            });

        $cursos = $cursoMaterias
            ->groupBy('cursoId')
            ->map(function ($items, $cursoId) use ($actividades) {
                $first = $items->first();
                $actividadesCurso = $actividades->where('cursoId', (int)$cursoId);

                return [
                    'id'              => (int)$cursoId,
                    'nombre'          => $first['curso'],
                    'nivel'           => $first['nivel'],
                    'totalEstudiantes'=> (int)($first['totalEstudiantes'] ?? 0),
                    'totalMaterias'   => $items->count(),
                    'totalActividades'=> $actividadesCurso->count(),
                    'activas'         => $actividadesCurso->where('activa', true)->count(),
                    'porCalificar'    => $actividadesCurso->sum(
                        fn($a) => max(0, (int)$a['entregados'] - (int)$a['calificados'])
                    ),
                    'vencidas'        => $actividadesCurso->filter(function ($a) {
                        if (!$a['activa'] || empty($a['fechaEntrega'])) {
                            return false;
                        }
                        return now()->gt(\Carbon\Carbon::parse($a['fechaEntrega']));
                    })->count(),
                    'materias'        => $items->map(fn($cm) => [
                        'id'        => (int)$cm['id'],
                        'nombre'    => $cm['materia'],
                        'pesoUsado' => (float)$cm['pesoUsado'],
                    ])->values()->all(),
                ];
            })
            ->sortBy('nombre', SORT_NATURAL | SORT_FLAG_CASE)
            ->values()
            ->all();

        return Inertia::render('Profesor/Actividades', [
            'profesor'      => ['nombre' => $user->name],
            'actividades'   => $actividades,
            'cursoMaterias' => $cursoMaterias,
            'cursos'        => $cursos,
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        $data = $request->validate([
            'curso_materia_id'       => 'required|exists:curso_materia,id',
            'titulo'                 => 'required|string|max:255',
            'descripcion'            => 'nullable|string|max:5000',
            'tipo'                   => 'required|in:tarea,examen,quiz,proyecto,taller',
            'fecha_entrega'          => 'required|date',
            'porcentaje'             => 'required|numeric|min:0|max:100',
            'activa'                 => 'boolean',
            'permite_entrega_tardia' => 'nullable|boolean',
            'max_intentos'           => 'nullable|integer|min:1|max:20',
            'cerrada_manualmente'    => 'nullable|boolean',
            'archivo_instrucciones'  => 'nullable|file|max:10240',
            'preguntas'              => 'nullable|array',
            'preguntas.*.enunciado' => 'required_with:preguntas|string',
            'preguntas.*.tipo'      => 'required_with:preguntas|in:seleccion_multiple,verdadero_falso,abierta',
            'preguntas.*.puntos'    => 'required_with:preguntas|numeric|min:0',
            'preguntas.*.imagen'    => 'nullable|file|max:5120',
            'preguntas.*.opciones'  => 'nullable|array',
            'preguntas.*.opciones.*.texto'       => 'required|string',
            'preguntas.*.opciones.*.es_correcta' => 'boolean',
        ]);

        // Verify ownership
        $cm = CursoMateria::findOrFail($data['curso_materia_id']);
        if ($cm->profesor_id !== $user->id) {
            abort(403);
        }

        $this->validarPreguntasEvaluacion($request, (string) $data['tipo']);

        $data['fecha_asignacion'] = now('America/Bogota')->toDateString();
        $data['activa'] = $data['activa'] ?? true;

        // Periodo activo
        $periodoActivo = Periodo::where('anio', now('America/Bogota')->year)
            ->where('estado', 'activo')
            ->first();
        $data['periodo_id'] = $periodoActivo?->id;

        // Handle file upload
        $archivoPath = null;
        if ($request->hasFile('archivo_instrucciones')) {
            $archivoPath = $request->file('archivo_instrucciones')->store('actividades/instrucciones', 'public');
        }

        $tienePreguntas = !empty($data['preguntas']) && in_array($data['tipo'], ['quiz', 'examen']);

        $actividad = Actividad::create([
            'curso_materia_id'       => $data['curso_materia_id'],
            'periodo_id'             => $data['periodo_id'],
            'titulo'                 => $data['titulo'],
            'descripcion'            => $data['descripcion'] ?? null,
            'archivo_instrucciones'  => $archivoPath,
            'tipo'                   => $data['tipo'],
            'fecha_asignacion'       => $data['fecha_asignacion'],
            'fecha_entrega'          => $data['fecha_entrega'],
            'porcentaje'             => $data['porcentaje'],
            'activa'                 => $data['activa'],
            'tiene_preguntas'        => $tienePreguntas,
            'permite_entrega_tardia' => filter_var($request->input('permite_entrega_tardia', false), FILTER_VALIDATE_BOOLEAN),
            'max_intentos'           => $request->input('max_intentos') !== '' && $request->input('max_intentos') !== null ? (int)$request->input('max_intentos') : null,
            'cerrada_manualmente'    => filter_var($request->input('cerrada_manualmente', false), FILTER_VALIDATE_BOOLEAN),
        ]);

        // Create questions if quiz/examen
        if ($tienePreguntas) {
            foreach ($data['preguntas'] as $idx => $preguntaData) {
                $imagenPath = null;
                if ($request->hasFile("preguntas.{$idx}.imagen")) {
                    $imagenPath = $request->file("preguntas.{$idx}.imagen")->store('actividades/preguntas', 'public');
                }

                $pregunta = $actividad->preguntas()->create([
                    'enunciado' => $preguntaData['enunciado'],
                    'imagen'    => $imagenPath,
                    'tipo'      => $preguntaData['tipo'],
                    'puntos'    => $preguntaData['puntos'],
                    'orden'     => $idx,
                ]);

                if (isset($preguntaData['opciones']) && $preguntaData['tipo'] !== 'abierta') {
                    foreach ($preguntaData['opciones'] as $oidx => $opcionData) {
                        $pregunta->opciones()->create([
                            'texto'       => $opcionData['texto'],
                            'es_correcta' => $opcionData['es_correcta'] ?? false,
                            'orden'       => $oidx,
                        ]);
                    }
                }
            }
        }

        // Create entrega rows for all enrolled students
        $estudianteIds = Matricula::where('curso_id', $cm->curso_id)
            ->where('estado', 'activa')
            ->distinct()
            ->pluck('estudiante_id');

        $rows = $estudianteIds->map(fn($eid) => [
            'actividad_id'  => $actividad->id,
            'estudiante_id' => $eid,
            'estado'        => 'pendiente',
            'created_at'    => now(),
            'updated_at'    => now(),
        ])->toArray();

        if (!empty($rows)) {
            Entrega::insert($rows);
        }

        return redirect()->route('profesor.actividades')->with('success', 'Actividad creada exitosamente.');
    }

    private function validarPreguntasEvaluacion(Request $request, string $tipoActividad): void
    {
        if (!in_array($tipoActividad, ['quiz', 'examen'], true)) {
            return;
        }

        $preguntas = $request->input('preguntas', []);
        if (!is_array($preguntas) || count($preguntas) === 0) {
            throw ValidationException::withMessages([
                'preguntas' => 'Debes agregar al menos una pregunta para actividades tipo quiz o examen.',
            ]);
        }

        foreach ($preguntas as $idx => $pregunta) {
            $numero = $idx + 1;
            $tipoPregunta = (string) ($pregunta['tipo'] ?? '');

            if ($tipoPregunta === 'abierta') {
                continue;
            }

            $opciones = $pregunta['opciones'] ?? [];
            if (!is_array($opciones) || count($opciones) < 2) {
                throw ValidationException::withMessages([
                    'preguntas' => "La pregunta {$numero} debe tener al menos dos opciones.",
                ]);
            }

            $correctas = collect($opciones)
                ->filter(fn($opcion) => filter_var($opcion['es_correcta'] ?? false, FILTER_VALIDATE_BOOLEAN))
                ->count();

            if ($correctas < 1) {
                throw ValidationException::withMessages([
                    'preguntas' => "La pregunta {$numero} debe tener una opción correcta.",
                ]);
            }
        }
    }

    /**
     * Shared helper: load cursoMaterias with porcentaje already used.
     */
    private function loadCursoMaterias(int $profesorId, ?int $excludeActividadId = null): \Illuminate\Support\Collection
    {
        $anio = now('America/Bogota')->year;
        $cms = CursoMateria::where('profesor_id', $profesorId)
            ->whereHas('curso', fn($q) => $q->where('anio', $anio))
            ->with(['curso', 'materia'])
            ->get();

        $estudiantesPorCurso = DB::table('matriculas')
            ->whereIn('curso_id', $cms->pluck('curso_id')->unique()->values())
            ->where('estado', 'activa')
            ->select('curso_id', DB::raw('COUNT(DISTINCT estudiante_id) as total'))
            ->groupBy('curso_id')
            ->pluck('total', 'curso_id');

        // Peso ya usado por curso_materia
        $query = DB::table('actividades')
            ->whereIn('curso_materia_id', $cms->pluck('id'))
            ->select('curso_materia_id', DB::raw('SUM(porcentaje) as usado'));
        if ($excludeActividadId) {
            $query->where('id', '!=', $excludeActividadId);
        }
        $pesoUsado = $query->groupBy('curso_materia_id')->pluck('usado', 'curso_materia_id');

        return $cms->map(fn($cm) => [
            'id'          => $cm->id,
            'curso'       => $cm->curso->nombre,
            'cursoId'     => $cm->curso->id,
            'materia'     => $cm->materia->nombre,
            'nivel'       => $cm->curso->nivel,
            'pesoUsado'   => (float)($pesoUsado->get($cm->id, 0)),
            'totalEstudiantes' => (int)($estudiantesPorCurso->get($cm->curso_id, 0)),
        ]);
    }

    /**
     * Show create activity form.
     */
    public function create(Request $request): Response
    {
        $user = auth()->user();
        $cursoMaterias = $this->loadCursoMaterias($user->id);

        $prefillCursoId = $request->filled('curso_id') ? (int)$request->input('curso_id') : null;
        $prefillCursoMateriaId = $request->filled('curso_materia_id') ? (int)$request->input('curso_materia_id') : null;

        if ($prefillCursoMateriaId !== null && !$cursoMaterias->contains(fn($cm) => (int)$cm['id'] === $prefillCursoMateriaId)) {
            $prefillCursoMateriaId = null;
        }

        if ($prefillCursoMateriaId !== null) {
            $cm = $cursoMaterias->first(fn($item) => (int)$item['id'] === $prefillCursoMateriaId);
            $prefillCursoId = $cm ? (int)$cm['cursoId'] : $prefillCursoId;
        }

        if ($prefillCursoId !== null && !$cursoMaterias->contains(fn($cm) => (int)$cm['cursoId'] === $prefillCursoId)) {
            $prefillCursoId = null;
        }

        return Inertia::render('Profesor/CrearActividad', [
            'profesor'      => ['nombre' => $user->name],
            'cursoMaterias' => $cursoMaterias,
            'actividad'     => null,
            'prefill'       => [
                'cursoId'        => $prefillCursoId,
                'cursoMateriaId' => $prefillCursoMateriaId,
            ],
        ]);
    }

    public function edit(Actividad $actividad): Response
    {
        $user = auth()->user();
        if ($actividad->cursoMateria->profesor_id !== $user->id) abort(403);

        $cursoMaterias = $this->loadCursoMaterias($user->id, $actividad->id);

        $actividadData = [
            'id'                   => $actividad->id,
            'cursoMateriaId'       => $actividad->curso_materia_id,
            'titulo'               => $actividad->titulo,
            'descripcion'          => $actividad->descripcion,
            'archivoInstrucciones' => $actividad->archivo_instrucciones,
            'tipo'                 => $actividad->tipo,
            'fechaEntrega'          => $actividad->fecha_entrega?->format('Y-m-d\TH:i'),
            'porcentaje'            => (float)$actividad->porcentaje,
            'activa'                => $actividad->activa,
            'permiteEntregaTardia'  => (bool)$actividad->permite_entrega_tardia,
            'maxIntentos'           => $actividad->max_intentos,
            'cerradaManualmente'    => (bool)$actividad->cerrada_manualmente,
            'tienePreguntas'        => $actividad->tiene_preguntas,
            'preguntas'            => $actividad->preguntas->map(fn($p) => [
                'id'        => $p->id,
                'enunciado' => $p->enunciado,
                'imagen'    => $p->imagen,
                'tipo'      => $p->tipo,
                'puntos'    => (float)$p->puntos,
                'orden'     => $p->orden,
                'opciones'  => $p->opciones->map(fn($o) => [
                    'id'          => $o->id,
                    'texto'       => $o->texto,
                    'imagen'      => $o->imagen,
                    'es_correcta' => $o->es_correcta,
                    'orden'       => $o->orden,
                ])->toArray(),
            ])->toArray(),
        ];

        return Inertia::render('Profesor/CrearActividad', [
            'profesor'      => ['nombre' => $user->name],
            'cursoMaterias' => $cursoMaterias,
            'actividad'     => $actividadData,
        ]);
    }

    public function update(Request $request, Actividad $actividad)
    {
        $user = auth()->user();
        if ($actividad->cursoMateria->profesor_id !== $user->id) {
            abort(403);
        }

        $data = $request->validate([
            'titulo'                 => 'sometimes|required|string|max:255',
            'descripcion'            => 'nullable|string|max:5000',
            'tipo'                   => 'sometimes|required|in:tarea,examen,quiz,proyecto,taller',
            'fecha_entrega'          => 'sometimes|required|date',
            'porcentaje'             => 'sometimes|required|numeric|min:0|max:100',
            'activa'                 => 'nullable',
            'permite_entrega_tardia' => 'nullable|boolean',
            'max_intentos'           => 'nullable|integer|min:1|max:20',
            'cerrada_manualmente'    => 'nullable|boolean',
            'archivo_instrucciones'  => 'nullable|file|max:10240',
            'preguntas'     => 'nullable|array',
            'preguntas.*.enunciado' => 'required_with:preguntas|string',
            'preguntas.*.tipo'      => 'required_with:preguntas|in:seleccion_multiple,verdadero_falso,abierta',
            'preguntas.*.puntos'    => 'required_with:preguntas|numeric|min:0',
            'preguntas.*.opciones'  => 'nullable|array',
            'preguntas.*.opciones.*.texto'       => 'required|string',
            'preguntas.*.opciones.*.es_correcta' => 'nullable',
        ]);

        $tipoActividad = (string) ($data['tipo'] ?? $actividad->tipo);
        $this->validarPreguntasEvaluacion($request, $tipoActividad);

        // Handle file upload
        if ($request->hasFile('archivo_instrucciones')) {
            if ($actividad->archivo_instrucciones) {
                Storage::disk('public')->delete($actividad->archivo_instrucciones);
            }
            $data['archivo_instrucciones'] = $request->file('archivo_instrucciones')->store('actividades/instrucciones', 'public');
        }

        // Cast boolean fields desde string FormData ('1'/'0')
        if (array_key_exists('activa', $data)) {
            $data['activa'] = filter_var($data['activa'], FILTER_VALIDATE_BOOLEAN);
        }
        if ($request->has('permite_entrega_tardia')) {
            $data['permite_entrega_tardia'] = filter_var($request->input('permite_entrega_tardia'), FILTER_VALIDATE_BOOLEAN);
        }
        if ($request->has('cerrada_manualmente')) {
            $data['cerrada_manualmente'] = filter_var($request->input('cerrada_manualmente'), FILTER_VALIDATE_BOOLEAN);
        }
        if ($request->has('max_intentos')) {
            $raw = $request->input('max_intentos');
            $data['max_intentos'] = ($raw !== '' && $raw !== null) ? (int)$raw : null;
        }

        $tienePreguntas = !empty($data['preguntas']) && in_array($tipoActividad, ['quiz', 'examen']);
        $data['tiene_preguntas'] = $tienePreguntas;

        unset($data['preguntas']);
        $actividad->update($data);

        // Replace questions if quiz/examen
        if ($tienePreguntas) {
            $actividad->preguntas()->delete(); // cascade deletes opciones too
            $preguntas = $request->input('preguntas', []);
            foreach ($preguntas as $idx => $preguntaData) {
                $imagenPath = null;
                if ($request->hasFile("preguntas.{$idx}.imagen")) {
                    $imagenPath = $request->file("preguntas.{$idx}.imagen")->store('actividades/preguntas', 'public');
                }

                $pregunta = $actividad->preguntas()->create([
                    'enunciado' => $preguntaData['enunciado'],
                    'imagen'    => $imagenPath,
                    'tipo'      => $preguntaData['tipo'],
                    'puntos'    => $preguntaData['puntos'],
                    'orden'     => $idx,
                ]);

                if (isset($preguntaData['opciones']) && $preguntaData['tipo'] !== 'abierta') {
                    foreach ($preguntaData['opciones'] as $oidx => $opcionData) {
                        $pregunta->opciones()->create([
                            'texto'       => $opcionData['texto'],
                            'es_correcta' => $opcionData['es_correcta'] ?? false,
                            'orden'       => $oidx,
                        ]);
                    }
                }
            }
        } elseif (!in_array($actividad->tipo, ['quiz', 'examen'])) {
            $actividad->preguntas()->delete();
            $actividad->update(['tiene_preguntas' => false]);
        }

        return redirect()->route('profesor.actividades')->with('success', 'Actividad actualizada.');
    }

    public function destroy(Actividad $actividad)
    {
        $user = auth()->user();
        if ($actividad->cursoMateria->profesor_id !== $user->id) {
            abort(403);
        }

        $actividad->delete();
        return redirect()->back()->with('success', 'Actividad eliminada.');
    }

    /**
     * Get entregas for an actividad with all student info.
     */
    public function entregas(Actividad $actividad)
    {
        $user = auth()->user();
        if ($actividad->cursoMateria->profesor_id !== $user->id) {
            abort(403);
        }

        $entregas = Entrega::where('actividad_id', $actividad->id)
            ->with('estudiante')
            ->orderBy('estudiante_id')
            ->get()
            ->map(fn($e) => [
                'id'                    => $e->id,
                'estudianteId'          => $e->estudiante_id,
                'estudiante'            => $e->estudiante->name ?? 'N/A',
                'estado'                => $this->estadoEntregaProfesor($e),
                'contenido'             => $e->contenido,
                'archivo'               => $e->archivo,
                'calificacion'          => $e->calificacion ? (float)$e->calificacion : null,
                'retroalimentacion'     => $e->retroalimentacion,
                'notaDevolucion'        => $e->nota_devolucion,
                'fechaEntrega'          => $e->fecha_entrega?->format('d M Y H:i'),
                'fechaLimiteIndividual' => $e->fecha_limite_individual?->format('Y-m-d\TH:i'),
            ]);

        return response()->json([
            'entregas' => $entregas,
            'actividad' => [
                'id'          => $actividad->id,
                'titulo'      => $actividad->titulo,
                'tipo'        => $actividad->tipo,
                'porcentaje'  => (float)$actividad->porcentaje,
                'fechaEntrega'=> $actividad->fecha_entrega?->format('Y-m-d\TH:i'),
                'descripcion' => $actividad->descripcion,
            ],
        ]);
    }

    private function estadoEntregaProfesor(Entrega $entrega): string
    {
        if (
            $entrega->estado === 'devuelta'
            || ($entrega->estado === 'pendiente' && !empty($entrega->nota_devolucion) && $entrega->fecha_entrega === null)
        ) {
            return 'devuelta';
        }

        return $entrega->estado;
    }

    private function entregaTieneEnvio(Entrega $entrega): bool
    {
        if ($entrega->fecha_entrega !== null) {
            return true;
        }

        return in_array($entrega->estado, ['entregada', 'atrasada', 'calificada'], true)
            || !empty($entrega->contenido)
            || !empty($entrega->archivo)
            || !empty($entrega->respuestas_quiz);
    }

    private function notificarEstudianteEntregaDevuelta(Entrega $entrega, ?string $nota): void
    {
        $tituloActividad = $entrega->actividad?->titulo ?? 'tu actividad';
        $mensaje = "Tu profesor devolvió \"{$tituloActividad}\" para corrección.";
        if (!empty($nota)) {
            $mensaje .= " Comentario: {$nota}";
        }
        $mensaje .= ' Puedes volver a enviarla desde Mis Materias.';

        Notificacion::create([
            'user_id' => $entrega->estudiante_id,
            'tipo'    => 'actividad',
            'titulo'  => 'Actividad devuelta para corrección',
            'mensaje' => $mensaje,
        ]);
    }

    private function notificarEstudianteEntregaReactivada(Entrega $entrega): void
    {
        $tituloActividad = $entrega->actividad?->titulo ?? 'tu actividad';

        Notificacion::create([
            'user_id' => $entrega->estudiante_id,
            'tipo'    => 'actividad',
            'titulo'  => 'Actividad reactivada para reenvío',
            'mensaje' => "Tu profesor reactivó \"{$tituloActividad}\". Ya puedes volver a enviarla.",
        ]);
    }

    /**
     * Bulk grade entregas — returns JSON.
     */
    public function calificar(Request $request, Actividad $actividad)
    {
        $user = auth()->user();
        if ($actividad->cursoMateria->profesor_id !== $user->id) {
            abort(403);
        }

        $data = $request->validate([
            'calificaciones'                    => 'required|array',
            'calificaciones.*.entrega_id'       => 'required|exists:entregas,id',
            'calificaciones.*.calificacion'     => 'nullable|numeric|min:0|max:5',
            'calificaciones.*.retroalimentacion'=> 'nullable|string|max:500',
        ]);

        $saved = 0;
        $skipped = 0;
        foreach ($data['calificaciones'] as $cal) {
            $entrega = Entrega::where('id', $cal['entrega_id'])
                ->where('actividad_id', $actividad->id)
                ->first();

            if (!$entrega || !$this->entregaTieneEnvio($entrega)) {
                $skipped++;
                continue;
            }

            if ($cal['calificacion'] === null || !is_numeric($cal['calificacion'])) {
                $skipped++;
                continue;
            }

            $entrega->update([
                'calificacion'      => $cal['calificacion'],
                'retroalimentacion' => $cal['retroalimentacion'] ?? null,
                'nota_devolucion'   => null,
                'estado'            => 'calificada',
            ]);
            $saved++;
        }

        return response()->json(['success' => true, 'saved' => $saved, 'skipped' => $skipped]);
    }

    /**
     * Extend or return an individual entrega — returns JSON.
     * tipo: devolver | extender_individual | reactivar
     */
    public function extenderEntrega(Request $request, Entrega $entrega)
    {
        $user = auth()->user();
        if ($entrega->actividad->cursoMateria->profesor_id !== $user->id) {
            abort(403);
        }

        $data = $request->validate([
            'tipo'            => 'required|in:devolver,extender_individual,reactivar',
            'nueva_fecha'     => 'required_if:tipo,extender_individual|nullable|date',
            'nota_devolucion' => 'nullable|string|max:500',
        ]);

        switch ($data['tipo']) {
            case 'devolver':
                if (!$this->entregaTieneEnvio($entrega)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No puedes devolver una entrega que aún no fue enviada.',
                    ], 422);
                }

                $notaDevolucion = trim((string) ($data['nota_devolucion'] ?? ''));
                if ($notaDevolucion === '') {
                    $notaDevolucion = null;
                }

                $entrega->update([
                    'estado'            => 'pendiente',
                    'calificacion'      => null,
                    'retroalimentacion' => null,
                    'nota_devolucion'   => $notaDevolucion,
                    'fecha_entrega'     => null,
                ]);

                $this->notificarEstudianteEntregaDevuelta($entrega->fresh('actividad'), $notaDevolucion);
                break;

            case 'extender_individual':
                $entrega->update([
                    'fecha_limite_individual' => $data['nueva_fecha'],
                    // If the student was marked atrasada and now has a future deadline, reset
                    'estado' => $entrega->estado === 'atrasada' ? 'pendiente' : $entrega->estado,
                ]);
                break;

            case 'reactivar':
                $entrega->update([
                    'estado'            => 'pendiente',
                    'calificacion'      => null,
                    'retroalimentacion' => null,
                    'fecha_entrega'     => null,
                    'nota_devolucion'   => null,
                ]);

                $this->notificarEstudianteEntregaReactivada($entrega->fresh('actividad'));
                break;
        }

        return response()->json(['success' => true, 'entrega_id' => $entrega->id, 'estado' => $entrega->fresh()->estado]);
    }

    /**
     * Extend the deadline for ALL students in an actividad.
     */
    public function extenderPlazoGeneral(Request $request, Actividad $actividad)
    {
        $user = auth()->user();
        if ($actividad->cursoMateria->profesor_id !== $user->id) {
            abort(403);
        }

        $request->merge([
            'nueva_fecha' => $request->input('nueva_fecha', $request->input('nueva_fecha_entrega')),
        ]);

        $data = $request->validate([
            'nueva_fecha' => 'required|date',
        ]);

        $actividad->update(['fecha_entrega' => $data['nueva_fecha']]);

        // If the new date is in the future, reset atrasadas to pendiente so students can still submit
        if (now()->lt($data['nueva_fecha'])) {
            Entrega::where('actividad_id', $actividad->id)
                ->where('estado', 'atrasada')
                ->update(['estado' => 'pendiente', 'updated_at' => now()]);
        }

        return response()->json([
            'success'     => true,
            'nueva_fecha' => $actividad->fecha_entrega->format('Y-m-d\TH:i'),
        ]);
    }
}
