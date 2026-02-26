<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Nota, Observacion, User, Curso, CursoMateria, Matricula, Periodo};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class ReporteController extends Controller
{
    public function index(): Response
    {
        $anio = now()->year;

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
            ->orderByRaw($nivelOrder)
            ->orderBy('grado')
            ->orderBy('grupo')
            ->get()
            ->map(fn($c) => [
                'id'     => $c->id,
                'nombre' => $c->nombre,
                'nivel'  => $c->nivel,
                'grado'  => $c->grado,
            ]);

        return Inertia::render('Admin/Reportes', [
            'periodos'         => $periodos,
            'periodoActualId'  => $periodoActualId,
            'cursos'           => $cursos,
            'anioVigente'      => $anio,
        ]);
    }

    /**
     * Generar datos de rendimiento académico filtrados
     */
    public function rendimiento(Request $request)
    {
        $periodoId = $request->input('periodo_id');
        $nivelFiltro = $request->input('nivel', 'todos');
        $cursoId = $request->input('curso_id');

        $nivelOrder = "CASE nivel WHEN 'preescolar' THEN 1 WHEN 'transicion' THEN 2 WHEN 'primaria' THEN 3 WHEN 'secundaria' THEN 4 WHEN 'media' THEN 5 WHEN 'bachillerato' THEN 6 ELSE 7 END";
        $query = Curso::activo()
            ->orderByRaw($nivelOrder)
            ->orderBy('grado')
            ->orderBy('grupo');

        if ($nivelFiltro && $nivelFiltro !== 'todos') {
            $query->where('nivel', $nivelFiltro);
        }
        if ($cursoId) {
            $query->where('id', $cursoId);
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
                'nivel'        => $curso->nivel,
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
        $periodoId = $request->input('periodo_id');
        $cursoId = $request->input('curso_id');
        $anio = now()->year;

        // Query base
        $query = Observacion::query();

        // Filtrar por periodo basándose en las fechas del periodo
        if ($periodoId) {
            $periodo = Periodo::find($periodoId);
            if ($periodo) {
                $query->whereBetween('fecha', [$periodo->fecha_inicio, $periodo->fecha_fin]);
            }
        } else {
            $query->whereYear('fecha', $anio);
        }

        // Filtrar por curso si se especifica
        if ($cursoId) {
            $estudianteIds = Matricula::where('curso_id', $cursoId)
                ->when($periodoId, fn($q) => $q->where('periodo_id', $periodoId))
                ->pluck('estudiante_id');
            $query->whereIn('estudiante_id', $estudianteIds);
        }

        $total = (clone $query)->count();
        $positivas = (clone $query)->where('tipo', 'positiva')->count();
        $negativas = (clone $query)->where('tipo', 'negativa')->count();
        $neutras = $total - $positivas - $negativas;

        // Top estudiantes con más observaciones negativas
        $topNegativos = Observacion::select('estudiante_id', DB::raw('COUNT(*) as total'))
            ->where('tipo', 'negativa')
            ->whereYear('fecha', $anio)
            ->when($periodoId, function ($q) use ($periodoId) {
                $periodo = Periodo::find($periodoId);
                if ($periodo) {
                    $q->whereBetween('fecha', [$periodo->fecha_inicio, $periodo->fecha_fin]);
                }
            })
            ->groupBy('estudiante_id')
            ->orderByDesc('total')
            ->limit(5)
            ->with('estudiante:id,name')
            ->get()
            ->map(fn($o) => [
                'nombre' => $o->estudiante?->name ?? 'N/A',
                'total'  => $o->total,
            ]);

        // Distribución por tipo de comentario (categorías)
        $categorias = Observacion::select('categoria', DB::raw('COUNT(*) as total'))
            ->whereYear('fecha', $anio)
            ->when($periodoId, function ($q) use ($periodoId) {
                $periodo = Periodo::find($periodoId);
                if ($periodo) {
                    $q->whereBetween('fecha', [$periodo->fecha_inicio, $periodo->fecha_fin]);
                }
            })
            ->whereNotNull('categoria')
            ->groupBy('categoria')
            ->orderByDesc('total')
            ->get();

        return response()->json([
            'total'       => $total,
            'positivas'   => $positivas,
            'negativas'   => $negativas,
            'neutras'     => $neutras,
            'topNegativos' => $topNegativos,
            'categorias'  => $categorias,
        ]);
    }

    /**
     * Obtener estadísticas de asistencia (placeholder - requiere modelo Asistencia)
     */
    public function asistencia(Request $request)
    {
        // Por ahora retornamos datos de ejemplo ya que no existe el modelo Asistencia
        // En el futuro se implementará con el modelo real

        $periodoId = $request->input('periodo_id');
        $cursoId = $request->input('curso_id');

        // Simular datos de asistencia basados en estudiantes matriculados
        $cursos = Curso::activo()
            ->when($cursoId, fn($q) => $q->where('id', $cursoId))
            ->get();

        $asistenciaPorCurso = [];

        foreach ($cursos as $curso) {
            $totalEstudiantes = Matricula::where('curso_id', $curso->id)
                ->when($periodoId, fn($q) => $q->where('periodo_id', $periodoId))
                ->count();

            // Datos simulados mientras no exista el modelo
            $asistenciaPorCurso[] = [
                'curso'           => $curso->nombre,
                'nivel'           => $curso->nivel,
                'totalEstudiantes' => $totalEstudiantes,
                'promedioAsist'   => 0, // Se calculará cuando exista el modelo
                'inasistencias'   => 0,
                'tardanzas'       => 0,
            ];
        }

        return response()->json([
            'porCurso'           => $asistenciaPorCurso,
            'promedioGeneral'    => 0,
            'totalInasistencias' => 0,
            'totalTardanzas'     => 0,
            'mensaje'            => 'El módulo de asistencia aún no está implementado. Los datos se mostrarán cuando se configure el control de asistencia.',
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
