<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\{Actividad, Entrega, Matricula, Pregunta};
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ActividadController extends Controller
{
    // ─────────────────────────────────────────────────────────────
    //  Helpers
    // ─────────────────────────────────────────────────────────────

    /**
     * Obtiene los IDs de cursos en los que el estudiante está matriculado activamente.
     */
    private function cursoIdsDelEstudiante(int $estudianteId): \Illuminate\Support\Collection
    {
        return Matricula::where('estudiante_id', $estudianteId)
            ->where('estado', 'activa')
            ->pluck('curso_id');
    }

    /**
     * Estado consolidado de la actividad para el estudiante dado el estado de la entrega.
     *   pendiente   → no ha entregado, actividad abierta
     *   vencida     → no ha entregado, plazo pasado (y no permite tardía sin extensión individual)
     *   entregada   → entregó, esperando calificación
     *   devuelta    → el profesor devolvió para re-enviar
     *   calificada  → ya tiene nota
     */
    private function estadoConsolidado(Actividad $actividad, Entrega $entrega): string
    {
        if ($entrega->estado === 'calificada') {
            return 'calificada';
        }

        // Compatibilidad: en BD se conserva estado "pendiente" al devolver,
        // pero mostramos "devuelta" si hay nota de devolución sin nueva entrega.
        if (
            $entrega->estado === 'devuelta'
            || ($entrega->estado === 'pendiente' && !empty($entrega->nota_devolucion) && $entrega->fecha_entrega === null)
        ) {
            return 'devuelta';
        }

        if (in_array($entrega->estado, ['entregada', 'atrasada'])) {
            return 'entregada';
        }

        // estado 'pendiente' — verificar si venció
        $limite = $entrega->fechaLimiteEfectiva();
        if ($limite && now()->gt($limite)) {
            return 'vencida';
        }
        return 'pendiente';
    }

    /**
     * Formatea una actividad + su entrega para enviar al frontend.
     */
    private function formatActividad(Actividad $actividad, Entrega $entrega, bool $conPreguntas = false, ?array $ordenExamen = null): array
    {
        $estado = $this->estadoConsolidado($actividad, $entrega);
        $limite = $entrega->fechaLimiteEfectiva();
        $puedeEntregar = $estado !== 'calificada'
            && $actividad->activa
            && !$actividad->cerrada_manualmente
            && ($limite === null || now()->lte($limite) || $actividad->permite_entrega_tardia);

        // Para quiz: ¿tiene intentos disponibles?
        $intentosDisponibles = null;
        if ($actividad->max_intentos !== null) {
            $intentosDisponibles = max(0, $actividad->max_intentos - ($entrega->intentos_usados ?? 0));
            if ($intentosDisponibles === 0) {
                $puedeEntregar = false;
            }
        }

        $data = [
            'id'                      => $actividad->id,
            'titulo'                  => $actividad->titulo,
            'descripcion'             => $actividad->descripcion,
            'archivoInstrucciones'    => $actividad->archivo_instrucciones ? Storage::url($actividad->archivo_instrucciones) : null,
            'tipo'                    => $actividad->tipo,
            'materia'                 => $actividad->cursoMateria?->materia?->nombre,
            'materiaColor'            => null, // se mapea en frontend
            'curso'                   => $actividad->cursoMateria?->curso?->nombre,
            'profesor'                => $actividad->cursoMateria?->profesor?->name,
            'fechaAsignacion'         => $actividad->fecha_asignacion?->format('d M Y'),
            'fechaEntrega'            => $actividad->fecha_entrega?->format('d M Y H:i'),
            'fechaEntregaISO'         => $actividad->fecha_entrega?->toIso8601String(),
            'fechaLimiteIndividual'   => $entrega->fecha_limite_individual?->format('d M Y H:i'),
            'fechaLimiteIndividualISO'=> $entrega->fecha_limite_individual?->toIso8601String(),
            'peso'                    => (float) $actividad->porcentaje,
            'estado'                  => $estado,
            'puedeEntregar'           => $puedeEntregar,
            'permiteEntregaTardia'    => $actividad->permite_entrega_tardia,
            'maxIntentos'             => $actividad->max_intentos,
            'intentosUsados'          => $entrega->intentos_usados ?? 0,
            'intentosDisponibles'     => $intentosDisponibles,
            'tienePreguntas'          => $actividad->tiene_preguntas,
            // Entrega
            'entregaId'               => $entrega->id,
            'entregaContenido'        => $entrega->contenido,
            'entregaArchivo'          => $entrega->archivo,
            'entregaFecha'            => $entrega->fecha_entrega?->format('d M Y H:i'),
            'calificacion'            => $entrega->calificacion ? (float) $entrega->calificacion : null,
            'retroalimentacion'       => $entrega->retroalimentacion,
            'notaDevolucion'          => $entrega->nota_devolucion,
        ];

        if ($conPreguntas && $actividad->tiene_preguntas) {
            $preguntas = $actividad->preguntas;

            if ($ordenExamen && !empty($ordenExamen['preguntas']) && is_array($ordenExamen['preguntas'])) {
                $ordenPreguntas = array_flip($ordenExamen['preguntas']);
                $preguntas = $preguntas
                    ->sortBy(fn(Pregunta $pregunta) => $ordenPreguntas[$pregunta->id] ?? PHP_INT_MAX)
                    ->values();
            }

            $data['preguntas'] = $preguntas->map(function (Pregunta $p) use ($ordenExamen) {
                $opciones = $p->opciones;

                if (
                    $ordenExamen
                    && isset($ordenExamen['opciones'][(string) $p->id])
                    && is_array($ordenExamen['opciones'][(string) $p->id])
                ) {
                    $ordenOpciones = array_flip($ordenExamen['opciones'][(string) $p->id]);
                    $opciones = $opciones
                        ->sortBy(fn($opcion) => $ordenOpciones[$opcion->id] ?? PHP_INT_MAX)
                        ->values();
                }

                return [
                'id'        => $p->id,
                'enunciado' => $p->enunciado,
                'imagen'    => $p->imagen ? Storage::url($p->imagen) : null,
                'tipo'      => $p->tipo,
                'puntos'    => (float) $p->puntos,
                'opciones'  => $opciones->map(fn($o) => [
                    'id'    => $o->id,
                    'texto' => $o->texto,
                    'imagen'=> $o->imagen ? Storage::url($o->imagen) : null,
                    // NO enviamos es_correcta para no revelar respuestas
                ])->toArray(),
            ];
            })->toArray();

            // Si ya tiene respuestas guardadas (último intento), enviarlas
            $data['respuestasGuardadas'] = $entrega->respuestas_quiz ?? null;
        }

        return $data;
    }

    private function resolverOrdenExamen(Request $request, Actividad $actividad, Entrega $entrega): array
    {
        $sessionKey = 'estudiante.examen.shuffle.' . $entrega->id;
        $actualPreguntaIds = $actividad->preguntas->pluck('id')->values()->all();
        $persistido = $request->session()->get($sessionKey);

        $esValido = is_array($persistido)
            && isset($persistido['preguntas'], $persistido['opciones'])
            && is_array($persistido['preguntas'])
            && is_array($persistido['opciones'])
            && count($persistido['preguntas']) === count($actualPreguntaIds)
            && empty(array_diff($persistido['preguntas'], $actualPreguntaIds));

        if ($esValido) {
            return $persistido;
        }

        $preguntasOrden = $actualPreguntaIds;
        shuffle($preguntasOrden);

        $opcionesOrden = [];
        foreach ($actividad->preguntas as $pregunta) {
            if ($pregunta->tipo === 'abierta') {
                continue;
            }

            $opcionIds = $pregunta->opciones->pluck('id')->values()->all();
            shuffle($opcionIds);
            $opcionesOrden[(string) $pregunta->id] = $opcionIds;
        }

        $nuevo = [
            'preguntas' => $preguntasOrden,
            'opciones' => $opcionesOrden,
        ];

        $request->session()->put($sessionKey, $nuevo);

        return $nuevo;
    }

    // ─────────────────────────────────────────────────────────────
    //  index — Lista paginada de actividades del estudiante
    // ─────────────────────────────────────────────────────────────
    public function index(): Response
    {
        $user = auth()->user();
        $cursoIds = $this->cursoIdsDelEstudiante($user->id);

        $entregas = Entrega::where('estudiante_id', $user->id)
            ->whereHas('actividad', fn($q) => $q->whereHas('cursoMateria', fn($q2) => $q2->whereIn('curso_id', $cursoIds)))
            ->with(['actividad.cursoMateria.materia', 'actividad.cursoMateria.curso', 'actividad.cursoMateria.profesor'])
            ->get();

        $actividades = $entregas->map(fn($e) => $this->formatActividad($e->actividad, $e));

        // Pendientes (no vencidas) por fecha asc, luego vencidas por fecha desc
        $pendientes = $actividades->filter(fn($a) => $a['estado'] === 'pendiente' || $a['estado'] === 'devuelta')
            ->sortBy('fechaEntregaISO')->values();
        $vencidas = $actividades->filter(fn($a) => $a['estado'] === 'vencida')
            ->sortByDesc('fechaEntregaISO')->values();
        $entregadas = $actividades->filter(fn($a) => $a['estado'] === 'entregada')
            ->sortByDesc('fechaEntregaISO')->values();
        $calificadas = $actividades->filter(fn($a) => $a['estado'] === 'calificada')
            ->sortByDesc('fechaEntregaISO')->values();

        return Inertia::render('Estudiante/Actividades', [
            'estudiante'  => ['nombre' => $user->name],
            'pendientes' => $pendientes,
            'vencidas'   => $vencidas,
            'entregadas' => $entregadas,
            'calificadas'=> $calificadas,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    //  show — Página detalle de una actividad
    // ─────────────────────────────────────────────────────────────
    public function show(Request $request, Actividad $actividad): Response
    {
        $user = auth()->user();

        // Verificar que el estudiante pertenece al curso
        $cursoIds = $this->cursoIdsDelEstudiante($user->id);
        $cursoId = $actividad->cursoMateria?->curso_id;
        if (!$cursoIds->contains($cursoId)) {
            abort(403, 'No tienes acceso a esta actividad.');
        }

        $entrega = Entrega::where('actividad_id', $actividad->id)
            ->where('estudiante_id', $user->id)
            ->first();

        if (!$entrega) {
            // Crear entrega en pendiente si no existe (edge case)
            $entrega = Entrega::create([
                'actividad_id'  => $actividad->id,
                'estudiante_id' => $user->id,
                'estado'        => 'pendiente',
                'intentos_usados' => 0,
            ]);
        }

        $actividad->load(['cursoMateria.materia', 'cursoMateria.curso', 'cursoMateria.profesor', 'preguntas.opciones']);

        $ordenExamen = null;
        if ($actividad->tipo === 'examen' && $actividad->tiene_preguntas) {
            $ordenExamen = $this->resolverOrdenExamen($request, $actividad, $entrega);
        }

        $data = $this->formatActividad($actividad, $entrega, conPreguntas: true, ordenExamen: $ordenExamen);

        return Inertia::render('Estudiante/ActividadDetalle', [
            'estudiante' => ['nombre' => $user->name],
            'actividad'  => $data,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    //  entregar — Subir archivo / texto
    // ─────────────────────────────────────────────────────────────
    public function entregar(Request $request, Actividad $actividad)
    {
        $user = auth()->user();

        $entrega = Entrega::where('actividad_id', $actividad->id)
            ->where('estudiante_id', $user->id)
            ->firstOrFail();

        // Verificar que puede entregar
        $limite = $entrega->fechaLimiteEfectiva();
        $vencio = $limite && now()->gt($limite);

        if ($vencio && !$actividad->permite_entrega_tardia) {
            return back()->withErrors(['general' => 'El plazo de entrega ha vencido y no se permiten entregas tardías.']);
        }

        if (!$actividad->activa || $actividad->cerrada_manualmente) {
            return back()->withErrors(['general' => 'Esta actividad está cerrada.']);
        }

        if ($entrega->estado === 'calificada') {
            return back()->withErrors(['general' => 'Esta actividad ya fue calificada.']);
        }

        $request->validate([
            'contenido' => 'nullable|string|max:10000',
            'archivo'   => 'nullable|file|max:20480|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,jpg,jpeg,png,zip',
        ]);

        $archivoPath = $entrega->archivo;
        if ($request->hasFile('archivo')) {
            if ($archivoPath) {
                Storage::disk('public')->delete($archivoPath);
            }
            $archivoPath = $request->file('archivo')->store("entregas/{$actividad->id}", 'public');
        }

        $entrega->update([
            'contenido'    => $request->input('contenido'),
            'archivo'      => $archivoPath,
            'estado'       => $vencio ? 'atrasada' : 'entregada',
            'fecha_entrega'=> now(),
            'nota_devolucion' => null,
        ]);

        return redirect()->route('estudiante.actividades.show', $actividad)
            ->with('success', '¡Entrega enviada exitosamente!');
    }

    // ─────────────────────────────────────────────────────────────
    //  quiz — Enviar respuestas de quiz/examen
    // ─────────────────────────────────────────────────────────────
    public function quiz(Request $request, Actividad $actividad)
    {
        $user = auth()->user();

        if (!$actividad->tiene_preguntas || !in_array($actividad->tipo, ['quiz', 'examen'])) {
            abort(400, 'Esta actividad no es un quiz.');
        }

        $entrega = Entrega::where('actividad_id', $actividad->id)
            ->where('estudiante_id', $user->id)
            ->firstOrFail();

        // Verificar intentos
        if ($actividad->max_intentos !== null && $entrega->intentos_usados >= $actividad->max_intentos) {
            return back()->withErrors(['general' => 'Has agotado todos tus intentos.']);
        }

        // Verificar plazo
        $limite = $entrega->fechaLimiteEfectiva();
        $vencio = $limite && now()->gt($limite);
        if ($vencio && !$actividad->permite_entrega_tardia) {
            return back()->withErrors(['general' => 'El plazo ha vencido.']);
        }

        if (!$actividad->activa || $actividad->cerrada_manualmente) {
            return back()->withErrors(['general' => 'Esta actividad está cerrada.']);
        }

        if ($entrega->estado === 'calificada') {
            return back()->withErrors(['general' => 'Esta actividad ya fue calificada.']);
        }

        $request->validate([
            'respuestas' => 'required|array',
            'respuestas.*' => 'nullable',
        ]);

        $respuestas = $request->input('respuestas'); // [pregunta_id => opcion_id | null | string]

        // Auto-calificación para selección múltiple / verdadero-falso
        $preguntas = $actividad->preguntas()->with('opciones')->get();
        $puntosObtenidos = 0;
        $puntosTotal = 0;
        $todasCalificables = true;

        foreach ($preguntas as $pregunta) {
            $puntosTotal += (float) $pregunta->puntos;

            if ($pregunta->tipo === 'abierta') {
                $todasCalificables = false; // necesita revisión manual
                continue;
            }

            $respuestaId = $respuestas[$pregunta->id] ?? null;
            if ($respuestaId && $pregunta->opciones->where('id', $respuestaId)->where('es_correcta', true)->isNotEmpty()) {
                $puntosObtenidos += (float) $pregunta->puntos;
            }
        }

        // Calcular nota 0.0-5.0
        $nota = $puntosTotal > 0 ? round(($puntosObtenidos / $puntosTotal) * 5.0, 1) : null;

        $updateData = [
            'respuestas_quiz' => $respuestas,
            'intentos_usados' => ($entrega->intentos_usados ?? 0) + 1,
            'fecha_entrega'   => now(),
            'estado'          => $vencio ? 'atrasada' : 'entregada',
            'nota_devolucion' => null,
        ];

        // Si todas las preguntas son auto-calificables, guardar la nota
        if ($todasCalificables && $nota !== null) {
            $updateData['calificacion'] = $nota;
            $updateData['estado'] = 'calificada';
        }

        $entrega->update($updateData);

        return redirect()->route('estudiante.actividades.show', $actividad)
            ->with('success', $todasCalificables
                ? "Quiz enviado. Tu calificación es {$nota}/5.0"
                : 'Quiz enviado. Tu profesor revisará las respuestas abiertas.');
    }

    // ─────────────────────────────────────────────────────────────
    //  cancelar — Retirar una entrega (solo si está 'entregada')
    // ─────────────────────────────────────────────────────────────
    public function cancelar(Actividad $actividad)
    {
        $user = auth()->user();

        $entrega = Entrega::where('actividad_id', $actividad->id)
            ->where('estudiante_id', $user->id)
            ->firstOrFail();

        if (!in_array($entrega->estado, ['entregada', 'atrasada'])) {
            return back()->withErrors(['general' => 'No puedes cancelar esta entrega.']);
        }

        // Verificar plazo aún abierto
        $limite = $entrega->fechaLimiteEfectiva();
        if ($limite && now()->gt($limite)) {
            return back()->withErrors(['general' => 'El plazo ha vencido, no puedes cancelar la entrega.']);
        }

        // Eliminar archivo si existe
        if ($entrega->archivo) {
            Storage::disk('public')->delete($entrega->archivo);
        }

        $entrega->update([
            'contenido'     => null,
            'archivo'       => null,
            'estado'        => 'pendiente',
            'fecha_entrega' => null,
        ]);

        return redirect()->route('estudiante.actividades.show', $actividad)
            ->with('success', 'Entrega cancelada. Puedes volver a enviarla antes del plazo.');
    }
}
