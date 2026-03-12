<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ScopesBySede;
use App\Models\{User, Curso, Periodo, Matricula, Pago, Observacion, Notificacion};
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    use ScopesBySede;

    public function index(): Response
    {
        $periodoActivo = Periodo::activo()->first();
        $sedeId = $this->sedeId();

        // Stats reales (filtradas por sede si es coordinador)
        $totalEstudiantes = User::role('estudiante')->activo()
            ->when($sedeId, fn($q) => $q->where('sede_id', $sedeId))
            ->count();
        $totalProfesores  = User::role('profesor')->activo()
            ->when($sedeId, fn($q) => $q->where('sede_id', $sedeId))
            ->count();
        $cursosActivos    = Curso::activo()->where('anio', now()->year)
            ->when($sedeId, fn($q) => $q->where('sede_id', $sedeId))
            ->count();

        $diasRestantes = $periodoActivo
            ? (int) now()->diffInDays($periodoActivo->fecha_fin, false)
            : 0;

        // Resumen financiero (solo admin ve pagos)
        $pagoPendiente = $this->isCoordinador() ? 0 : Pago::pendiente()->count();
        $pagoVencido   = $this->isCoordinador() ? 0 : Pago::vencido()->count();

        // Actividad reciente real (últimas acciones de distintas tablas)
        $actividadReciente = collect();

        // Últimos 3 estudiantes matriculados
        Matricula::with('estudiante', 'curso')
            ->when($sedeId, fn($q) => $q->whereHas('curso', fn($cq) => $cq->where('sede_id', $sedeId)))
            ->latest()
            ->take(3)
            ->get()
            ->each(function ($m) use (&$actividadReciente) {
                $actividadReciente->push([
                    'name'        => $m->estudiante->name . ' (Estudiante)',
                    'description' => 'Matriculado en ' . $m->curso->nombre,
                    'time'        => $m->created_at->format('d/m H:i'),
                ]);
            });

        // Últimas 3 observaciones
        Observacion::with('profesor', 'estudiante')
            ->latest()
            ->take(3)
            ->get()
            ->each(function ($o) use (&$actividadReciente) {
                $tipo = $o->tipo === 'positiva' ? 'Obs. positiva' : 'Obs. negativa';
                $actividadReciente->push([
                    'name'        => $o->profesor->name . ' (Profesor)',
                    'description' => "$tipo a {$o->estudiante->nombre_corto}",
                    'time'        => $o->created_at->format('d/m H:i'),
                ]);
            });

        // Últimos 3 pagos confirmados
        Pago::with('estudiante', 'conceptoPago')
            ->pagado()
            ->latest('fecha_pago')
            ->take(3)
            ->get()
            ->each(function ($p) use (&$actividadReciente) {
                $actividadReciente->push([
                    'name'        => $p->estudiante->nombre_corto . ' (Pago)',
                    'description' => $p->conceptoPago->nombre . ' - $' . number_format($p->monto, 0, ',', '.'),
                    'time'        => $p->fecha_pago?->format('d/m') ?? '',
                ]);
            });

        // Ordenar por tiempo y tomar 8
        $actividadReciente = $actividadReciente->take(8)->values()->toArray();

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalEstudiantes' => $totalEstudiantes,
                'totalProfesores'  => $totalProfesores,
                'cursosActivos'    => $cursosActivos,
                'diasRestantes'    => max($diasRestantes, 0),
            ],
            'actividadReciente' => $actividadReciente,
            'periodoActivo'     => $periodoActivo ? [
                'nombre' => $periodoActivo->nombre,
                'anio'   => $periodoActivo->anio,
            ] : null,
            'resumenFinanciero' => [
                'pagosPendientes' => $pagoPendiente,
                'pagosVencidos'   => $pagoVencido,
            ],
        ]);
    }
}
