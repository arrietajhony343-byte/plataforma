<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ScopesBySede;
use App\Models\{Asistencia, Nota, Observacion, Sede, User, Curso, CursoMateria, Matricula, Periodo};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class ReporteController extends Controller
{
    use ScopesBySede;

    public function index(): Response
    {
        $anio = now('America/Bogota')->year;
        $sedeId = $this->sedeId();

        // ── Periodos disponibles (del año actual o todos si no hay) ──
        $periodos = Periodo::orderBy('numero')
            ->get()
            ->map(fn($p) => [
                'id'       => $p->id,
                'nombre'   => $p->nombre,
                'numero'   => $p->numero,
                'activo'   => $p->estado === 'activo',
                'estado'   => $p->estado,
            ]);

        $periodoActivo = Periodo::activo()->first();
        $periodoActualId = $periodoActivo?->id;

        // ── Cursos activos con su nivel ──
        $nivelOrder = "CASE nivel WHEN 'preescolar' THEN 1 WHEN 'transicion' THEN 2 WHEN 'primaria' THEN 3 WHEN 'secundaria' THEN 4 WHEN 'media' THEN 5 WHEN 'bachillerato' THEN 6 ELSE 7 END";
        $cursos = Curso::activo()
            ->when($sedeId, fn($q) => $q->where('sede_id', $sedeId))
            ->orderByRaw($nivelOrder)
            ->orderBy('grado')
            ->orderBy('grupo')
            ->get()
            ->map(fn($c) => [
                'id'      => $c->id,
                'nombre'  => $c->nombre,
                'nivel'   => in_array($c->nivel, ['preescolar', 'transicion']) ? 'prejardin' : $c->nivel,
                'grado'   => $c->grado,
                'sede_id' => $c->sede_id,
            ]);

        // Si es coordinador, solo mostrar su sede
        $sedes = $sedeId
            ? Sede::where('id', $sedeId)->get()->map(fn($s) => ['id' => $s->id, 'nombre' => $s->nombre])
            : Sede::where('activa', true)->orderBy('nombre')->get()->map(fn($s) => ['id' => $s->id, 'nombre' => $s->nombre]);

        return Inertia::render('Admin/Reportes', [
            'periodos'         => $periodos,
            'periodoActualId'  => $periodoActualId,
            'cursos'           => $cursos,
            'sedes'            => $sedes,
            'anioVigente'      => $anio,
            'sedeRestringida'  => $sedeId,
        ]);
    }

    /**
     * Generar datos de rendimiento académico filtrados
     */
    public function rendimiento(Request $request)
    {
        $periodoId   = $request->input('periodo_id');
        $nivelFiltro = $request->input('nivel', 'todos');
        $cursoId     = $request->input('curso_id');
        // Si es coordinador, forzar su sede; si no, usar la del request
        $sedeId = $this->sedeId() ?? $request->input('sede_id');

        $nivelOrder = "CASE nivel WHEN 'preescolar' THEN 1 WHEN 'transicion' THEN 2 WHEN 'primaria' THEN 3 WHEN 'secundaria' THEN 4 WHEN 'media' THEN 5 WHEN 'bachillerato' THEN 6 ELSE 7 END";
        $query = Curso::activo()
            ->orderByRaw($nivelOrder)
            ->orderBy('grado')
            ->orderBy('grupo');

        if ($nivelFiltro && $nivelFiltro !== 'todos') {
            // prejardin incluye también preescolar y transicion (valores legacy)
            if ($nivelFiltro === 'prejardin') {
                $query->whereIn('nivel', ['prejardin', 'transicion', 'preescolar']);
            } else {
                $query->where('nivel', $nivelFiltro);
            }
        }
        if ($cursoId) {
            $query->where('id', $cursoId);
        }
        if ($sedeId) {
            $query->where('sede_id', $sedeId);
        }

        $cursos = $query->get();
        $rendimiento = [];
        $totalEstudiantesGlobal = 0;
        $totalAprobadosGlobal = 0;
        $totalReprobadosGlobal = 0;
        $sumaPromedios = 0;

        foreach ($cursos as $curso) {
            // Estudiantes matriculados en este curso (y periodo si aplica)
            $estudianteIds = Matricula::where('curso_id', $curso->id)
                ->when($periodoId, fn($q) => $q->where('periodo_id', $periodoId))
                ->pluck('estudiante_id')
                ->unique();

            if ($estudianteIds->isEmpty()) {
                $rendimiento[] = [
                    'id'           => $curso->id,
                    'nivel'        => $curso->nivel,
                    'curso'        => $curso->nombre,
                    'promedio'     => 0,
                    'aprobados'    => 0,
                    'reprobados'   => 0,
                    'totalEstud'   => 0,
                    'mejorMateria' => '-',
                    'peorMateria'  => '-',
                ];
                continue;
            }

            $cmIds = $curso->cursoMaterias()->pluck('id');

            // Notas definitivas de estudiantes de este curso
            $notasQuery = Nota::whereIn('estudiante_id', $estudianteIds)
                ->whereIn('curso_materia_id', $cmIds)
                ->where('tipo', 'definitiva');

            if ($periodoId) {
                $notasQuery->where('periodo_id', $periodoId);
            }

            $promedio = $notasQuery->avg('valor') ?? 0;

            // Contar aprobados y reprobados (por estudiante, promedio >= 3.0)
            $notasPorEstudiante = Nota::whereIn('estudiante_id', $estudianteIds)
                ->whereIn('curso_materia_id', $cmIds)
                ->where('tipo', 'definitiva')
                ->when($periodoId, fn($q) => $q->where('periodo_id', $periodoId))
                ->selectRaw('estudiante_id, AVG(valor) as prom')
                ->groupBy('estudiante_id')
                ->get();

            $aprobados = $notasPorEstudiante->filter(fn($n) => $n->prom >= 3.0)->count();
            $reprobados = $notasPorEstudiante->filter(fn($n) => $n->prom < 3.0)->count();
            $totalEstudiantes = $estudianteIds->count();

            // Mejor y peor materia del curso
            $materiasStats = CursoMateria::where('curso_id', $curso->id)
                ->with('materia')
                ->get()
                ->map(function ($cm) use ($periodoId, $estudianteIds) {
                    $prom = Nota::where('curso_materia_id', $cm->id)
                        ->whereIn('estudiante_id', $estudianteIds)
                        ->where('tipo', 'definitiva')
                        ->when($periodoId, fn($q) => $q->where('periodo_id', $periodoId))
                        ->avg('valor');

                    return [
                        'nombre'   => $cm->materia->nombre ?? 'N/A',
                        'promedio' => $prom ?? 0,
                    ];
                })
                ->filter(fn($m) => $m['promedio'] > 0);

            $mejor = $materiasStats->sortByDesc('promedio')->first();
            $peor = $materiasStats->sortBy('promedio')->first();

            $rendimiento[] = [
                'id'           => $curso->id,
                'nivel'        => in_array($curso->nivel, ['preescolar', 'transicion']) ? 'prejardin' : $curso->nivel,
                'curso'        => $curso->nombre,
                'promedio'     => round($promedio, 1),
                'aprobados'    => $aprobados,
                'reprobados'   => $reprobados,
                'totalEstud'   => $totalEstudiantes,
                'mejorMateria' => $mejor ? $mejor['nombre'] : '-',
                'peorMateria'  => $peor && $peor['promedio'] < 3.0 ? $peor['nombre'] : '-',
            ];

            $totalEstudiantesGlobal += $totalEstudiantes;
            $totalAprobadosGlobal += $aprobados;
            $totalReprobadosGlobal += $reprobados;
            if ($promedio > 0) {
                $sumaPromedios += $promedio;
            }
        }

        // Stats globales
        $promedioGeneral = count($rendimiento) > 0
            ? $sumaPromedios / max(1, collect($rendimiento)->filter(fn($r) => $r['promedio'] > 0)->count())
            : 0;

        $total = $totalAprobadosGlobal + $totalReprobadosGlobal;
        $tasaAprobacion = $total > 0 ? round(($totalAprobadosGlobal / $total) * 100) : 100;

        return response()->json([
            'rendimiento' => $rendimiento,
            'stats'       => [
                'promedioGeneral'    => round($promedioGeneral, 1),
                'tasaAprobacion'     => $tasaAprobacion,
                'totalEstudiantes'   => $totalEstudiantesGlobal,
                'totalCursos'        => count($rendimiento),
            ],
        ]);
    }

    /**
     * Obtener estadísticas de comentarios/observaciones
     */
    public function comentarios(Request $request)
    {
        $periodoId   = $request->input('periodo_id');
        $cursoId     = $request->input('curso_id');
        $nivelFiltro = $request->input('nivel', 'todos');
        $sedeId = $this->sedeId() ?? $request->input('sede_id');
        $anio = now('America/Bogota')->year;

        // IDs de estudiantes según filtro de curso/nivel/sede
        $estudianteIds = null;
        if ($cursoId) {
            $estudianteIds = Matricula::where('curso_id', $cursoId)
                ->when($periodoId, fn($q) => $q->where('periodo_id', $periodoId))
                ->pluck('estudiante_id');
        } elseif ($nivelFiltro && $nivelFiltro !== 'todos') {
            $niveles = $nivelFiltro === 'transicion' ? ['transicion', 'preescolar'] : [$nivelFiltro];
            $cursosNivel = Curso::activo()
                ->whereIn('nivel', $niveles)
                ->when($sedeId, fn($q) => $q->where('sede_id', $sedeId))
                ->pluck('id');
            $estudianteIds = Matricula::whereIn('curso_id', $cursosNivel)
                ->when($periodoId, fn($q) => $q->where('periodo_id', $periodoId))
                ->pluck('estudiante_id')->unique();
        } elseif ($sedeId) {
            $cursosSede = Curso::activo()->where('sede_id', $sedeId)->pluck('id');
            $estudianteIds = Matricula::whereIn('curso_id', $cursosSede)
                ->when($periodoId, fn($q) => $q->where('periodo_id', $periodoId))
                ->pluck('estudiante_id')->unique();
        }

        // Query base con filtros de periodo
        $baseQuery = fn() => Observacion::query()
            ->when($periodoId, function ($q) use ($periodoId) {
                $periodo = Periodo::find($periodoId);
                if ($periodo && $periodo->fecha_inicio && $periodo->fecha_fin) {
                    $q->whereBetween('fecha', [$periodo->fecha_inicio, $periodo->fecha_fin]);
                }
            }, fn($q) => $q->whereYear('fecha', $anio))
            ->when($estudianteIds, fn($q) => $q->whereIn('estudiante_id', $estudianteIds));

        $total     = $baseQuery()->count();
        $positivas = $baseQuery()->where('tipo', 'positiva')->count();
        $negativas = $baseQuery()->where('tipo', 'negativa')->count();
        $neutras   = $total - $positivas - $negativas;

        // Top estudiantes con más observaciones negativas
        $topNegativos = $baseQuery()
            ->where('tipo', 'negativa')
            ->select('estudiante_id', DB::raw('COUNT(*) as total'))
            ->groupBy('estudiante_id')
            ->orderByDesc('total')
            ->limit(8)
            ->with('estudiante:id,name')
            ->get()
            ->map(fn($o) => [
                'id'     => $o->estudiante_id,
                'nombre' => $o->estudiante?->name ?? 'N/A',
                'total'  => $o->total,
            ]);

        // Distribución por categoría
        $categorias = $baseQuery()
            ->select('categoria', DB::raw('COUNT(*) as total'))
            ->whereNotNull('categoria')
            ->groupBy('categoria')
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'total'        => $total,
            'positivas'    => $positivas,
            'negativas'    => $negativas,
            'neutras'      => $neutras,
            'topNegativos' => $topNegativos,
            'categorias'   => $categorias,
        ]);
    }

    /**
     * Detalle de observaciones de un estudiante específico
     */
    public function estudianteObservaciones(Request $request, int $estudianteId)
    {
        $periodoId   = $request->input('periodo_id');
        $nivelFiltro = $request->input('nivel', 'todos');
        $anio = now('America/Bogota')->year;

        $estudiante = User::findOrFail($estudianteId);

        $obs = Observacion::where('estudiante_id', $estudianteId)
            ->when($periodoId, function ($q) use ($periodoId) {
                $periodo = Periodo::find($periodoId);
                if ($periodo && $periodo->fecha_inicio && $periodo->fecha_fin) {
                    $q->whereBetween('fecha', [$periodo->fecha_inicio, $periodo->fecha_fin]);
                }
            }, fn($q) => $q->whereYear('fecha', $anio))
            ->with(['profesor:id,name', 'materia:id,nombre'])
            ->orderByDesc('fecha')
            ->get()
            ->map(fn($o) => [
                'id'          => $o->id,
                'tipo'        => $o->tipo,
                'categoria'   => $o->categoria,
                'descripcion' => $o->descripcion,
                'fecha'       => $o->fecha?->format('d/m/Y'),
                'profesor'    => $o->profesor?->name ?? 'N/A',
                'materia'     => $o->materia?->nombre ?? '-',
            ]);

        $matricula = Matricula::where('estudiante_id', $estudianteId)
            ->when($periodoId, fn($q) => $q->where('periodo_id', $periodoId))
            ->with('curso:id,nombre,nivel')
            ->latest()
            ->first();

        return response()->json([
            'estudiante' => [
                'id'     => $estudiante->id,
                'nombre' => $estudiante->name,
                'curso'  => $matricula?->curso?->nombre ?? '-',
                'nivel'  => $matricula?->curso?->nivel ?? '-',
            ],
            'observaciones' => $obs,
            'stats' => [
                'total'     => $obs->count(),
                'positivas' => $obs->where('tipo', 'positiva')->count(),
                'negativas' => $obs->where('tipo', 'negativa')->count(),
                'neutras'   => $obs->filter(fn($o) => !in_array($o['tipo'], ['positiva', 'negativa']))->count(),
            ],
        ]);
    }

    public function asistencia(Request $request)
    {
        $periodoId   = $request->input('periodo_id');
        $cursoId     = $request->input('curso_id');
        $nivelFiltro = $request->input('nivel', 'todos');
        $sedeId = $this->sedeId() ?? $request->input('sede_id');

        $nivelOrder = "CASE nivel WHEN 'preescolar' THEN 1 WHEN 'transicion' THEN 2 WHEN 'primaria' THEN 3 WHEN 'secundaria' THEN 4 WHEN 'media' THEN 5 WHEN 'bachillerato' THEN 6 ELSE 7 END";

        $periodo = $periodoId ? Periodo::find($periodoId) : null;

        $cursos = Curso::activo()
            ->when($cursoId, fn($q) => $q->where('id', $cursoId))
            ->when($nivelFiltro && $nivelFiltro !== 'todos', function ($q) use ($nivelFiltro) {
                $niveles = $nivelFiltro === 'transicion' ? ['transicion', 'preescolar'] : [$nivelFiltro];
                $q->whereIn('nivel', $niveles);
            })
            ->when($sedeId, fn($q) => $q->where('sede_id', $sedeId))
            ->orderByRaw($nivelOrder)
            ->orderBy('grado')
            ->get();

        $asistenciaPorCurso = [];
        $totalAusentes      = 0;
        $totalTardanzas     = 0;
        $sumaPorcentajes    = 0;
        $cursosConDatos     = 0;

        foreach ($cursos as $curso) {
            $totalEstudiantes = Matricula::where('curso_id', $curso->id)
                ->when($periodoId, fn($q) => $q->where('periodo_id', $periodoId))
                ->count();

            $cmIds = CursoMateria::where('curso_id', $curso->id)->pluck('id');

            $stats = Asistencia::whereIn('curso_materia_id', $cmIds)
                ->when(
                    $periodo && $periodo->fecha_inicio && $periodo->fecha_fin,
                    fn($q) => $q->whereBetween('fecha', [$periodo->fecha_inicio, $periodo->fecha_fin])
                )
                ->selectRaw("estado, COUNT(*) as total")
                ->groupBy('estado')
                ->get()
                ->keyBy('estado');

            $presentes  = (int) ($stats['presente']->total ?? 0);
            $ausentes   = (int) ($stats['ausente']->total  ?? 0);
            $tardes     = (int) ($stats['tarde']->total    ?? 0);
            $excusas    = (int) ($stats['excusa']->total   ?? 0);
            $tardanzas  = $tardes + $excusas;

            $totalRegistros = $presentes + $ausentes + $tardanzas;
            $porcentaje = $totalRegistros > 0
                ? round(($presentes / $totalRegistros) * 100)
                : null;

            $asistenciaPorCurso[] = [
                'curso'            => $curso->nombre,
                'nivel'            => $curso->nivel,
                'totalEstudiantes' => $totalEstudiantes,
                'promedioAsist'    => $porcentaje,
                'inasistencias'    => $ausentes,
                'tardanzas'        => $tardanzas,
                'totalRegistros'   => $totalRegistros,
            ];

            if ($porcentaje !== null) {
                $sumaPorcentajes += $porcentaje;
                $cursosConDatos++;
            }
            $totalAusentes  += $ausentes;
            $totalTardanzas += $tardanzas;
        }

        $promedioGeneral = $cursosConDatos > 0
            ? round($sumaPorcentajes / $cursosConDatos)
            : null;

        return response()->json([
            'porCurso'           => $asistenciaPorCurso,
            'promedioGeneral'    => $promedioGeneral,
            'totalInasistencias' => $totalAusentes,
            'totalTardanzas'     => $totalTardanzas,
            'mensaje'            => null,
        ]);
    }

    /**
     * Exportar rendimiento a Excel (datos JSON para frontend)
     */
    public function exportarRendimiento(Request $request)
    {
        $periodoId = $request->input('periodo_id');
        $nivelFiltro = $request->input('nivel', 'todos');
        $cursoId = $request->input('curso_id');

        // Reutilizamos la lógica de rendimiento
        $response = $this->rendimiento($request);
        $data = $response->getData(true);

        return response()->json([
            'data'     => $data['rendimiento'],
            'stats'    => $data['stats'],
            'periodo'  => $periodoId ? Periodo::find($periodoId)?->nombre : 'Todos',
            'nivel'    => $nivelFiltro === 'todos' ? 'Todos los niveles' : ucfirst($nivelFiltro),
            'exportAt' => now()->format('Y-m-d H:i:s'),
        ]);
    }
}
