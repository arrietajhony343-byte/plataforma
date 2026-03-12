<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\{Asistencia, CursoMateria, HorarioBloque, Matricula, Periodo};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AsistenciaController extends Controller
{
    /* ================================================================
     *  INDEX — Render Inertia page with filter options
     * ================================================================ */
    public function index(): Response
    {
        $user = auth()->user();
        $anio = now()->year;

        $cursoMaterias = CursoMateria::where('profesor_id', $user->id)
            ->whereHas('curso', fn ($q) => $q->where('anio', $anio)->where('activo', true))
            ->with(['curso', 'materia'])
            ->get();

        // Fallback: if no courses for current year, use most recent year
        if ($cursoMaterias->isEmpty()) {
            $anio = CursoMateria::where('profesor_id', $user->id)
                ->join('cursos', 'cursos.id', '=', 'curso_materia.curso_id')
                ->max('cursos.anio') ?? $anio;

            $cursoMaterias = CursoMateria::where('profesor_id', $user->id)
                ->whereHas('curso', fn ($q) => $q->where('anio', $anio)->where('activo', true))
                ->with(['curso', 'materia'])
                ->get();
        }

        $cursos = $cursoMaterias->pluck('curso')->unique('id')->map(fn ($c) => [
            'id' => $c->id, 'nombre' => $c->nombre,
        ])->values();

        $materias = $cursoMaterias->pluck('materia')->unique('id')->map(fn ($m) => [
            'id' => $m->id, 'nombre' => $m->nombre,
        ])->values();

        $cursoMateriasMap = $cursoMaterias->map(fn ($cm) => [
            'id'       => $cm->id,
            'curso_id' => $cm->curso_id,
            'materia_id' => $cm->materia_id,
        ]);

        // Horario bloques del profesor (para mostrar qué clases tiene cada día)
        $bloques = HorarioBloque::whereIn('curso_materia_id', $cursoMaterias->pluck('id'))
            ->get()
            ->map(fn ($b) => [
                'id'              => $b->id,
                'curso_materia_id' => $b->curso_materia_id,
                'dia'             => $b->dia,
                'hora_inicio'     => $b->hora_inicio,
                'hora_fin'        => $b->hora_fin,
                'salon'           => $b->salon,
            ]);

        // Periodos del mismo año
        $periodos = Periodo::where('anio', $anio)
            ->orderByRaw("CASE estado WHEN 'activo' THEN 0 WHEN 'pendiente' THEN 1 ELSE 2 END")
            ->orderBy('numero')
            ->get()
            ->map(fn ($p) => [
                'id'           => $p->id,
                'nombre'       => $p->nombre,
                'estado'       => $p->estado,
                'fecha_inicio' => $p->fecha_inicio->format('Y-m-d'),
                'fecha_fin'    => $p->fecha_fin->format('Y-m-d'),
            ]);

        return Inertia::render('Profesor/Asistencias', [
            'cursos'         => $cursos,
            'materias'       => $materias,
            'cursoMaterias'  => $cursoMateriasMap,
            'bloques'        => $bloques,
            'periodos'       => $periodos,
        ]);
    }

    /* ================================================================
     *  DATOS — JSON API returning attendance for a date + curso_materia
     * ================================================================ */
    public function datos(Request $request)
    {
        $request->validate([
            'curso_materia_id' => 'required|integer|exists:curso_materia,id',
            'fecha'            => 'required|date',
        ]);

        $user = auth()->user();
        $cmId = $request->curso_materia_id;
        $fecha = $request->fecha;

        // Verify the professor owns this curso_materia
        $cm = CursoMateria::where('id', $cmId)
            ->where('profesor_id', $user->id)
            ->with('curso')
            ->firstOrFail();

        // Students enrolled in this course (active)
        $estudiantes = Matricula::where('curso_id', $cm->curso_id)
            ->where('estado', 'activa')
            ->with('estudiante:id,name,documento')
            ->get()
            ->pluck('estudiante')
            ->filter()
            ->unique('id')
            ->sortBy('name')
            ->values()
            ->map(fn ($e) => [
                'id'        => $e->id,
                'nombre'    => $e->name,
                'documento' => $e->documento ?? '',
            ]);

        // Existing attendance records for this date + curso_materia
        $registros = Asistencia::where('curso_materia_id', $cmId)
            ->whereDate('fecha', $fecha)
            ->get()
            ->keyBy(fn ($a) => $a->estudiante_id . '-' . ($a->horario_bloque_id ?? 0));

        // Horario bloques for this curso_materia on this day
        $diaSemana = $this->getDiaSemana($fecha);
        $bloquesDelDia = HorarioBloque::where('curso_materia_id', $cmId)
            ->where('dia', $diaSemana)
            ->orderBy('hora_inicio')
            ->get()
            ->map(fn ($b) => [
                'id'          => $b->id,
                'hora_inicio' => $b->hora_inicio,
                'hora_fin'    => $b->hora_fin,
                'salon'       => $b->salon,
            ]);

        // Build attendance matrix
        $asistencias = [];
        foreach ($registros as $reg) {
            $asistencias[] = [
                'id'               => $reg->id,
                'estudiante_id'    => $reg->estudiante_id,
                'horario_bloque_id'=> $reg->horario_bloque_id,
                'estado'           => $reg->estado,
                'observacion'      => $reg->observacion,
            ];
        }

        // Stats — attendance summary for this curso_materia across dates
        $totalClases = Asistencia::where('curso_materia_id', $cmId)
            ->selectRaw('fecha, horario_bloque_id')
            ->groupBy('fecha', 'horario_bloque_id')
            ->get()
            ->count();

        return response()->json([
            'estudiantes'   => $estudiantes,
            'asistencias'   => $asistencias,
            'bloquesDelDia' => $bloquesDelDia,
            'totalClases'   => $totalClases,
        ]);
    }

    /* ================================================================
     *  STORE — Bulk save attendance records
     * ================================================================ */
    public function store(Request $request)
    {
        $request->validate([
            'curso_materia_id'       => 'required|integer|exists:curso_materia,id',
            'fecha'                  => 'required|date',
            'registros'              => 'required|array',
            'registros.*.estudiante_id'    => 'required|integer|exists:users,id',
            'registros.*.horario_bloque_id'=> 'nullable|integer',
            'registros.*.estado'           => 'required|in:presente,ausente,tarde,excusa',
            'registros.*.observacion'      => 'nullable|string|max:500',
        ]);

        $user = auth()->user();
        $cmId = $request->curso_materia_id;
        $fecha = $request->fecha;

        // Verify ownership
        CursoMateria::where('id', $cmId)
            ->where('profesor_id', $user->id)
            ->firstOrFail();

        $saved = 0;
        foreach ($request->registros as $reg) {
            $bloqueId = $reg['horario_bloque_id'] ?? null;

            $existing = Asistencia::where('estudiante_id', $reg['estudiante_id'])
                ->where('curso_materia_id', $cmId)
                ->whereDate('fecha', $fecha)
                ->when(
                    is_null($bloqueId),
                    fn ($q) => $q->whereNull('horario_bloque_id'),
                    fn ($q) => $q->where('horario_bloque_id', $bloqueId)
                )
                ->first();

            if ($existing) {
                $existing->update([
                    'estado'         => $reg['estado'],
                    'observacion'    => $reg['observacion'] ?? null,
                    'registrado_por' => $user->id,
                ]);
            } else {
                Asistencia::create([
                    'estudiante_id'     => $reg['estudiante_id'],
                    'curso_materia_id'  => $cmId,
                    'fecha'             => $fecha,
                    'horario_bloque_id' => $bloqueId,
                    'estado'            => $reg['estado'],
                    'observacion'       => $reg['observacion'] ?? null,
                    'registrado_por'    => $user->id,
                ]);
            }
            $saved++;
        }

        return response()->json([
            'success' => true,
            'message' => 'Asistencia registrada correctamente.',
            'saved'   => $saved,
        ]);
    }

    /* ================================================================
     *  RESUMEN — JSON API for attendance summary/stats
     * ================================================================ */
    public function resumen(Request $request)
    {
        $request->validate([
            'curso_materia_id' => 'required|integer|exists:curso_materia,id',
            'periodo_id'       => 'nullable|integer|exists:periodos,id',
        ]);

        $user = auth()->user();
        $cmId = $request->curso_materia_id;

        $cm = CursoMateria::where('id', $cmId)
            ->where('profesor_id', $user->id)
            ->firstOrFail();

        $query = Asistencia::where('curso_materia_id', $cmId);

        // If periodo specified, filter by date range
        if ($request->periodo_id) {
            $periodo = Periodo::findOrFail($request->periodo_id);
            $query->whereBetween('fecha', [$periodo->fecha_inicio, $periodo->fecha_fin]);
        }

        // Per-student summary
        $stats = $query->selectRaw('
                estudiante_id,
                COUNT(*) as total,
                SUM(CASE WHEN estado = \'presente\' THEN 1 ELSE 0 END) as presentes,
                SUM(CASE WHEN estado = \'ausente\' THEN 1 ELSE 0 END) as ausentes,
                SUM(CASE WHEN estado = \'tarde\' THEN 1 ELSE 0 END) as tardes,
                SUM(CASE WHEN estado = \'excusa\' THEN 1 ELSE 0 END) as excusas
            ')
            ->groupBy('estudiante_id')
            ->get()
            ->map(fn ($s) => [
                'estudiante_id' => $s->estudiante_id,
                'total'         => (int) $s->total,
                'presentes'     => (int) $s->presentes,
                'ausentes'      => (int) $s->ausentes,
                'tardes'        => (int) $s->tardes,
                'excusas'       => (int) $s->excusas,
                'porcentaje'    => $s->total > 0
                    ? round((($s->presentes + $s->tardes) / $s->total) * 100, 1)
                    : 100,
            ]);

        // Dates with registered attendance
        $fechasRegistradas = Asistencia::where('curso_materia_id', $cmId)
            ->when($request->periodo_id, function ($q) use ($request) {
                $periodo = Periodo::find($request->periodo_id);
                $q->whereBetween('fecha', [$periodo->fecha_inicio, $periodo->fecha_fin]);
            })
            ->selectRaw('DISTINCT fecha')
            ->orderBy('fecha', 'desc')
            ->pluck('fecha')
            ->map(fn ($f) => $f instanceof \Carbon\Carbon ? $f->format('Y-m-d') : $f);

        // Per-day-per-student records for expandable detail view
        $detallesQuery = Asistencia::where('curso_materia_id', $cmId);
        if ($request->periodo_id) {
            $periodoD = Periodo::find($request->periodo_id);
            if ($periodoD) {
                $detallesQuery->whereBetween('fecha', [$periodoD->fecha_inicio, $periodoD->fecha_fin]);
            }
        }
        $detalles = $detallesQuery
            ->select('estudiante_id', 'fecha', 'estado', 'observacion')
            ->orderBy('fecha')
            ->get()
            ->map(fn ($a) => [
                'estudiante_id' => $a->estudiante_id,
                'fecha'         => $a->fecha instanceof \Carbon\Carbon ? $a->fecha->format('Y-m-d') : (string) $a->fecha,
                'estado'        => $a->estado,
                'observacion'   => $a->observacion,
            ]);

        // Students for name lookup
        $estudiantesResumen = Matricula::where('curso_id', $cm->curso_id)
            ->where('estado', 'activa')
            ->with('estudiante:id,name')
            ->get()
            ->pluck('estudiante')
            ->filter()
            ->unique('id')
            ->sortBy('name')
            ->values()
            ->map(fn ($e) => ['id' => $e->id, 'nombre' => $e->name]);

        return response()->json([
            'stats'             => $stats,
            'fechasRegistradas' => $fechasRegistradas,
            'detalles'          => $detalles,
            'estudiantes'       => $estudiantesResumen,
        ]);
    }

    /* ── Helpers ── */

    private function getDiaSemana(string $fecha): string
    {
        $map = [
            'Monday'    => 'lunes',
            'Tuesday'   => 'martes',
            'Wednesday' => 'miercoles',
            'Thursday'  => 'jueves',
            'Friday'    => 'viernes',
            'Saturday'  => 'sabado',
            'Sunday'    => 'domingo',
        ];
        $day = date('l', strtotime($fecha));
        return $map[$day] ?? 'lunes';
    }
}
