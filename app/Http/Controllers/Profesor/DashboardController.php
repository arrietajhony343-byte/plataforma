<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\{CursoMateria, Observacion, Actividad, Entrega, Nota, Mensaje};
use App\Models\HorarioBloque;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $anio = now('America/Bogota')->year;

        // ── Todos los curso_materia del profesor este año ──
        $cursoMaterias = CursoMateria::where('profesor_id', $user->id)
            ->whereHas('curso', fn($q) => $q->where('anio', $anio))
            ->with(['curso', 'materia'])
            ->get();

        $cmIds = $cursoMaterias->pluck('id')->toArray();

        // ── Conteos masivos (evitar N+1) ──
        $actividadesPorCm = Actividad::whereIn('curso_materia_id', $cmIds)
            ->select('curso_materia_id', DB::raw('COUNT(*) as total'))
            ->groupBy('curso_materia_id')
            ->pluck('total', 'curso_materia_id');

        $actividadIds = Actividad::whereIn('curso_materia_id', $cmIds)->pluck('id')->toArray();

        $entregasPendientes = Entrega::whereIn('actividad_id', $actividadIds)
            ->where('estado', 'pendiente')
            ->count();

        $entregasPorCalificar = Entrega::whereIn('actividad_id', $actividadIds)
            ->where('estado', 'entregada')
            ->count();

        // Promedio de notas por curso_materia
        $promediosPorCm = Nota::whereIn('curso_materia_id', $cmIds)
            ->select('curso_materia_id', DB::raw('ROUND(AVG(valor), 1) as promedio'))
            ->groupBy('curso_materia_id')
            ->pluck('promedio', 'curso_materia_id');

        // Total estudiantes (matriculados activos en cursos del profesor)
        $cursoIds = $cursoMaterias->pluck('curso_id')->unique()->toArray();
        $totalEstudiantes = DB::table('matriculas')
            ->whereIn('curso_id', $cursoIds)
            ->where('estado', 'activa')
            ->distinct('estudiante_id')
            ->count('estudiante_id');

        // Estudiantes por curso
        $estudiantesPorCurso = DB::table('matriculas')
            ->whereIn('curso_id', $cursoIds)
            ->where('estado', 'activa')
            ->select('curso_id', DB::raw('COUNT(*) as total'))
            ->groupBy('curso_id')
            ->pluck('total', 'curso_id');

        // Mensajes no leídos
        $mensajesNoLeidos = Mensaje::where('destinatario_id', $user->id)
            ->where('leido', false)
            ->count();

        // Observaciones del mes
        $observacionesMes = Observacion::where('profesor_id', $user->id)
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        // Director de grupo
        $cursoDirector = DB::table('cursos')
            ->where('director_grupo_id', $user->id)
            ->where('anio', $anio)
            ->first();

        // ── Construir cursos con materias ──
        $nivelesLabel = [
            'preescolar'   => 'Pre-escolar',
            'transicion'   => 'Transición',
            'primaria'     => 'Primaria',
            'bachillerato' => 'Bachillerato',
        ];

        $cursosData = $cursoMaterias->groupBy('curso_id')->map(function ($group) use (
            $actividadesPorCm, $promediosPorCm, $estudiantesPorCurso, $nivelesLabel
        ) {
            $curso = $group->first()->curso;
            $materias = $group->map(fn($cm) => [
                'id'          => $cm->id,
                'materia_id'  => $cm->materia_id,
                'nombre'      => $cm->materia->nombre,
                'horas'       => $cm->horas_semanales,
                'actividades' => $actividadesPorCm->get($cm->id, 0),
                'promedio'    => $promediosPorCm->get($cm->id, null),
            ])->values()->toArray();

            return [
                'id'          => $curso->id,
                'nombre'      => $curso->nombre,
                'nivel'       => $curso->nivel,
                'nivelLabel'  => $nivelesLabel[$curso->nivel] ?? $curso->nivel,
                'grado'       => $curso->grado,
                'estudiantes' => $estudiantesPorCurso->get($curso->id, 0),
                'materias'    => $materias,
            ];
        })->values()->sortBy('nombre')->values();

        // ── Estadísticas globales ──
        $stats = [
            'totalCursos'         => count($cursoIds),
            'totalMaterias'       => $cursoMaterias->count(),
            'totalEstudiantes'    => $totalEstudiantes,
            'totalActividades'    => array_sum($actividadesPorCm->toArray()),
            'entregasPendientes'  => $entregasPendientes,
            'entregasPorCalificar'=> $entregasPorCalificar,
            'mensajesNoLeidos'    => $mensajesNoLeidos,
            'observacionesMes'    => $observacionesMes,
        ];

        // ── Alertas: observaciones negativas recientes ──
        $alertas = Observacion::where('profesor_id', $user->id)
            ->where('tipo', 'negativa')
            ->with(['estudiante', 'materia'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn($o) => [
                'id'         => $o->id,
                'estudiante' => $o->estudiante->name ?? 'N/A',
                'materia'    => $o->materia?->nombre ?? 'N/A',
                'mensaje'    => $o->descripcion,
                'fecha'      => $o->created_at->diffForHumans(),
            ]);

        // ── Actividades próximas a vencer ──
        $actividadesProximas = Actividad::whereIn('curso_materia_id', $cmIds)
            ->where('activa', true)
            ->where('fecha_entrega', '>=', now())
            ->where('fecha_entrega', '<=', now()->addDays(7))
            ->with('cursoMateria.materia', 'cursoMateria.curso')
            ->orderBy('fecha_entrega')
            ->limit(5)
            ->get()
            ->map(fn($a) => [
                'id'        => $a->id,
                'titulo'    => $a->titulo,
                'tipo'      => $a->tipo,
                'materia'   => $a->cursoMateria?->materia?->nombre ?? 'N/A',
                'curso'     => $a->cursoMateria?->curso?->nombre ?? 'N/A',
                'fecha'     => $a->fecha_entrega->format('d M'),
                'diasRestantes' => (int)now()->diffInDays($a->fecha_entrega, false),
            ]);

        // ── Clases de hoy ──
        $diasMap = [
            0 => 'domingo', 1 => 'lunes', 2 => 'martes', 3 => 'miercoles',
            4 => 'jueves', 5 => 'viernes', 6 => 'sabado',
        ];
        $diaHoy = $diasMap[now()->dayOfWeek];

        $clasesHoy = HorarioBloque::whereIn('curso_materia_id', $cmIds)
            ->where('dia', $diaHoy)
            ->with(['cursoMateria.materia', 'cursoMateria.curso'])
            ->orderBy('hora_inicio')
            ->get()
            ->map(fn($b) => [
                'id'          => $b->id,
                'materia'     => $b->cursoMateria?->materia?->nombre ?? 'N/A',
                'curso'       => $b->cursoMateria?->curso?->nombre ?? 'N/A',
                'horaInicio'  => substr($b->hora_inicio, 0, 5),
                'horaFin'     => substr($b->hora_fin, 0, 5),
                'salon'       => $b->salon,
            ]);

        // ── Actividades que vencen hoy ──
        $actividadesHoy = Actividad::whereIn('curso_materia_id', $cmIds)
            ->where('activa', true)
            ->whereDate('fecha_entrega', now('America/Bogota')->toDateString())
            ->with('cursoMateria.materia', 'cursoMateria.curso')
            ->orderBy('fecha_entrega')
            ->get()
            ->map(fn($a) => [
                'id'     => $a->id,
                'titulo' => $a->titulo,
                'tipo'   => $a->tipo,
                'materia'=> $a->cursoMateria?->materia?->nombre ?? 'N/A',
                'curso'  => $a->cursoMateria?->curso?->nombre ?? 'N/A',
            ]);

        return Inertia::render('Profesor/Dashboard', [
            'profesor' => [
                'nombre' => $user->name,
                'directorDe' => $cursoDirector ? $cursoDirector->nombre : null,
            ],
            'cursos'              => $cursosData,
            'stats'               => $stats,
            'alertas'             => $alertas,
            'actividadesProximas' => $actividadesProximas,
            'clasesHoy'           => $clasesHoy,
            'actividadesHoy'      => $actividadesHoy,
        ]);
    }
}
