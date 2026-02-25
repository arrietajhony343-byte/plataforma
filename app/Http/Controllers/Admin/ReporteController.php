<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Nota, Observacion, Pago, User, Curso, Materia, Matricula, Periodo};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReporteController extends Controller
{
    public function index(): Response
    {
        $anio = now()->year;
        $periodoActivo = Periodo::activo()->first();

        // ── Resumen académico general ──
        $totalEstudiantes = User::role('estudiante')->activo()->count();
        $totalProfesores  = User::role('profesor')->activo()->count();
        $cursosActivos    = Curso::activo()->where('anio', $anio)->count();

        // ── Promedios por curso (definitivas período activo) ──
        $cursos = Curso::activo()->where('anio', $anio)->get();
        $rendimientoCursos = [];

        foreach ($cursos as $curso) {
            $estudianteIds = Matricula::where('curso_id', $curso->id)
                ->when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))
                ->pluck('estudiante_id');

            $cmIds = $curso->cursoMaterias()->pluck('id');

            $promedio = Nota::whereIn('estudiante_id', $estudianteIds)
                ->whereIn('curso_materia_id', $cmIds)
                ->when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))
                ->where('tipo', 'definitiva')
                ->avg('valor');

            $rendimientoCursos[] = [
                'curso'        => $curso->nombre,
                'promedio'     => round($promedio ?? 0, 1),
                'estudiantes'  => $estudianteIds->count(),
            ];
        }

        // ── Promedios por materia ──
        $materias = Materia::activa()->get();
        $rendimientoMaterias = [];

        foreach ($materias as $materia) {
            $cmIds = $materia->cursoMaterias()->pluck('id');

            $promedio = Nota::whereIn('curso_materia_id', $cmIds)
                ->when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))
                ->where('tipo', 'definitiva')
                ->avg('valor');

            $totalNotas = Nota::whereIn('curso_materia_id', $cmIds)
                ->when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))
                ->where('tipo', 'definitiva')
                ->count();

            $aprobados = Nota::whereIn('curso_materia_id', $cmIds)
                ->when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))
                ->where('tipo', 'definitiva')
                ->where('valor', '>=', 3.0)
                ->count();

            $rendimientoMaterias[] = [
                'materia'         => $materia->nombre,
                'promedio'        => round($promedio ?? 0, 1),
                'totalNotas'      => $totalNotas,
                'aprobados'       => $aprobados,
                'reprobados'      => $totalNotas - $aprobados,
                'tasaAprobacion'  => $totalNotas > 0 ? round(($aprobados / $totalNotas) * 100, 1) : 0,
            ];
        }

        // ── Observaciones resumen ──
        $totalObservaciones = Observacion::whereYear('fecha', $anio)->count();
        $observacionesPositivas = Observacion::positiva()->whereYear('fecha', $anio)->count();
        $observacionesNegativas = Observacion::negativa()->whereYear('fecha', $anio)->count();

        // ── Resumen financiero ──
        $totalPagos  = Pago::when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))->count();
        $pagosPagados = Pago::pagado()->when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))->count();
        $pagosPendientes = Pago::pendiente()->when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))->count();
        $pagosVencidos = Pago::vencido()->when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))->count();
        $montoRecaudado = Pago::pagado()->when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))->sum('monto');
        $montoPendiente = Pago::pendiente()->when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))->sum('monto');

        // ── Top 10 estudiantes ──
        $topEstudiantes = [];
        $estudianteIds = User::role('estudiante')->activo()->pluck('id');

        foreach ($estudianteIds as $estId) {
            $prom = Nota::where('estudiante_id', $estId)
                ->when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))
                ->where('tipo', 'definitiva')
                ->avg('valor');

            if ($prom) {
                $est = User::find($estId);
                $matricula = Matricula::where('estudiante_id', $estId)
                    ->when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))
                    ->with('curso')
                    ->first();

                $topEstudiantes[] = [
                    'nombre'   => $est->name,
                    'curso'    => $matricula?->curso?->nombre ?? 'N/A',
                    'promedio' => round($prom, 1),
                ];
            }
        }

        usort($topEstudiantes, fn($a, $b) => $b['promedio'] <=> $a['promedio']);
        $topEstudiantes = array_slice($topEstudiantes, 0, 10);

        return Inertia::render('Admin/Reportes', [
            'resumen' => [
                'totalEstudiantes'    => $totalEstudiantes,
                'totalProfesores'     => $totalProfesores,
                'cursosActivos'       => $cursosActivos,
                'periodoActivo'       => $periodoActivo?->nombre ?? 'Sin periodo',
            ],
            'rendimientoCursos'    => $rendimientoCursos,
            'rendimientoMaterias'  => $rendimientoMaterias,
            'observaciones' => [
                'total'     => $totalObservaciones,
                'positivas' => $observacionesPositivas,
                'negativas' => $observacionesNegativas,
            ],
            'finanzas' => [
                'totalPagos'       => $totalPagos,
                'pagados'          => $pagosPagados,
                'pendientes'       => $pagosPendientes,
                'vencidos'         => $pagosVencidos,
                'montoRecaudado'   => $montoRecaudado,
                'montoPendiente'   => $montoPendiente,
            ],
            'topEstudiantes' => $topEstudiantes,
        ]);
    }
}
