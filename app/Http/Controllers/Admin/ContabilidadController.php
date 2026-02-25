<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{ConceptoPago, Pago, Periodo, User};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContabilidadController extends Controller
{
    public function index(): Response
    {
        $anio = now()->year;
        $periodoActivo = Periodo::activo()->first();

        // Todos los pagos del año agrupados por mes
        $pagosPorMes = Pago::whereHas('periodo', fn($q) => $q->where('anio', $anio))
            ->where('estado', 'pagado')
            ->selectRaw("strftime('%m', fecha_pago) as mes, SUM(monto) as total")
            ->groupBy('mes')
            ->orderBy('mes')
            ->get()
            ->map(fn($r) => [
                'mes'   => (int) $r->mes,
                'total' => (float) $r->total,
            ]);

        // Completar los 12 meses
        $ingresosMensuales = [];
        $meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        for ($m = 1; $m <= 12; $m++) {
            $dato = $pagosPorMes->firstWhere('mes', $m);
            $ingresosMensuales[] = [
                'mes'   => $meses[$m - 1],
                'total' => $dato ? $dato['total'] : 0,
            ];
        }

        // Resumen por concepto de pago
        $conceptos = ConceptoPago::activo()->get();
        $ingresosPorConcepto = [];
        foreach ($conceptos as $concepto) {
            $pagado   = Pago::where('concepto_pago_id', $concepto->id)->where('estado', 'pagado')->sum('monto');
            $pendiente = Pago::where('concepto_pago_id', $concepto->id)->where('estado', 'pendiente')->sum('monto');
            $vencido  = Pago::where('concepto_pago_id', $concepto->id)->where('estado', 'vencido')->sum('monto');

            $ingresosPorConcepto[] = [
                'concepto'  => $concepto->nombre,
                'pagado'    => $pagado,
                'pendiente' => $pendiente,
                'vencido'   => $vencido,
                'total'     => $pagado + $pendiente + $vencido,
            ];
        }

        // Resumen global
        $totalRecaudado  = Pago::whereHas('periodo', fn($q) => $q->where('anio', $anio))->where('estado', 'pagado')->sum('monto');
        $totalPendiente  = Pago::whereHas('periodo', fn($q) => $q->where('anio', $anio))->where('estado', 'pendiente')->sum('monto');
        $totalVencido    = Pago::whereHas('periodo', fn($q) => $q->where('anio', $anio))->where('estado', 'vencido')->sum('monto');

        // Morosos: estudiantes con pagos vencidos
        $morosos = User::role('estudiante')
            ->whereHas('pagos', fn($q) => $q->where('estado', 'vencido'))
            ->withCount(['pagos as pagos_vencidos' => fn($q) => $q->where('estado', 'vencido')])
            ->withSum(['pagos as deuda_total' => fn($q) => $q->where('estado', 'vencido')], 'monto')
            ->with(['matriculas' => fn($q) => $q->latest()->limit(1)->with('curso')])
            ->get()
            ->map(fn(User $e) => [
                'id'             => $e->id,
                'nombre'         => $e->name,
                'curso'          => $e->matriculas->first()?->curso?->nombre ?? 'N/A',
                'pagosVencidos'  => $e->pagos_vencidos,
                'deudaTotal'     => (float) $e->deuda_total,
            ]);

        // Últimos pagos recibidos
        $ultimosPagos = Pago::where('estado', 'pagado')
            ->with(['estudiante', 'conceptoPago'])
            ->latest('fecha_pago')
            ->limit(20)
            ->get()
            ->map(fn(Pago $p) => [
                'id'          => $p->id,
                'estudiante'  => $p->estudiante->name,
                'concepto'    => $p->conceptoPago->nombre,
                'monto'       => $p->monto,
                'fecha'       => $p->fecha_pago?->format('Y-m-d'),
                'metodo'      => $p->metodo_pago,
                'referencia'  => $p->referencia,
            ]);

        return Inertia::render('Admin/Contabilidad', [
            'resumen' => [
                'totalRecaudado' => $totalRecaudado,
                'totalPendiente' => $totalPendiente,
                'totalVencido'   => $totalVencido,
                'totalGeneral'   => $totalRecaudado + $totalPendiente + $totalVencido,
            ],
            'ingresosMensuales'   => $ingresosMensuales,
            'ingresosPorConcepto' => $ingresosPorConcepto,
            'morosos'             => $morosos,
            'ultimosPagos'        => $ultimosPagos,
        ]);
    }
}
