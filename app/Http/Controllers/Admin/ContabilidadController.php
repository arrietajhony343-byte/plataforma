<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{ConceptoPago, Pago, Periodo, Sede, User};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContabilidadController extends Controller
{
    public function index(): Response
    {
        $anio = now()->year;
        $periodoActivo = Periodo::activo()->first();

        $sedes = Sede::where('activa', true)
            ->orderBy('nombre')
            ->get()
            ->map(fn($s) => ['id' => $s->id, 'nombre' => $s->nombre])
            ->values();

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
            $pagado   = Pago::where('concepto_pago_id', $concepto->id)
                ->whereHas('periodo', fn($q) => $q->where('anio', $anio))
                ->where('estado', 'pagado')
                ->sum('monto');
            $pendiente = Pago::where('concepto_pago_id', $concepto->id)
                ->whereHas('periodo', fn($q) => $q->where('anio', $anio))
                ->where('estado', 'pendiente')
                ->sum('monto');
            $vencido  = Pago::where('concepto_pago_id', $concepto->id)
                ->whereHas('periodo', fn($q) => $q->where('anio', $anio))
                ->where('estado', 'vencido')
                ->sum('monto');

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

        // Deudores: estudiantes con pagos vencidos
        $deudores = User::role('estudiante')
            ->whereHas('pagos', fn($q) => $q
                ->where('estado', 'vencido')
                ->whereHas('periodo', fn($p) => $p->where('anio', $anio))
            )
            ->withCount(['pagos as pagos_vencidos' => fn($q) => $q
                ->where('estado', 'vencido')
                ->whereHas('periodo', fn($p) => $p->where('anio', $anio))
            ])
            ->withSum(['pagos as deuda_total' => fn($q) => $q
                ->where('estado', 'vencido')
                ->whereHas('periodo', fn($p) => $p->where('anio', $anio))
            ], 'monto')
            ->with([
                'sede',
                'padres:id,name,documento,telefono',
                'matriculas' => fn($q) => $q
                    ->where('estado', 'activa')
                    ->orderByDesc('fecha_matricula')
                    ->orderByDesc('id')
                    ->with(['curso.sede'])
                    ->limit(1),
            ])
            ->get()
            ->map(function (User $e) {
                $curso = $e->matriculas->first()?->curso;
                $acudiente = $e->padres->first();
                return [
                    'id'             => $e->id,
                    'nombre'         => $e->name,
                    'documento'      => $e->documento,
                    'email'          => $e->email,
                    'telefono'       => $e->telefono,
                    'acudiente'      => $acudiente?->name,
                    'acudiente_doc'  => $acudiente?->documento,
                    'acudiente_tel'  => $acudiente?->telefono,
                    'curso'          => $curso?->nombre ?? 'N/A',
                    'nivel'          => $curso?->nivel,
                    'sede_id'        => $curso?->sede_id ?? $e->sede_id,
                    'sede'           => $curso?->sede?->nombre ?? $e->sede?->nombre,
                    'pagosVencidos'  => $e->pagos_vencidos,
                    'deudaTotal'     => (float) ($e->deuda_total ?? 0),
                ];
            })
            ->values();

        // Últimos pagos recibidos
        $ultimosPagos = Pago::where('estado', 'pagado')
            ->whereHas('periodo', fn($q) => $q->where('anio', $anio))
            ->with(['estudiante.sede', 'estudiante.matriculas.curso.sede', 'conceptoPago'])
            ->latest('fecha_pago')
            ->limit(20)
            ->get()
            ->map(function (Pago $p) {
                $curso = $p->estudiante?->matriculas
                    ?->sortByDesc('fecha_matricula')
                    ->first()?->curso;

                return [
                    'id'          => $p->id,
                    'estudiante_id' => $p->estudiante?->id,
                    'estudiante'  => $p->estudiante?->name ?? 'N/A',
                    'documento'   => $p->estudiante?->documento,
                    'telefono'    => $p->estudiante?->telefono,
                    'email'       => $p->estudiante?->email,
                    'concepto'    => $p->conceptoPago?->nombre ?? 'N/A',
                    'monto'       => (float) $p->monto,
                    'fecha'       => $p->fecha_pago?->format('Y-m-d'),
                    'metodo'      => $p->metodo_pago,
                    'referencia'  => $p->referencia,
                    'curso'       => $curso?->nombre,
                    'nivel'       => $curso?->nivel,
                    'sede_id'     => $curso?->sede_id ?? $p->estudiante?->sede_id,
                    'sede'        => $curso?->sede?->nombre ?? $p->estudiante?->sede?->nombre,
                ];
            })
            ->values();

        return Inertia::render('Admin/Contabilidad', [
            'resumen' => [
                'totalRecaudado' => $totalRecaudado,
                'totalPendiente' => $totalPendiente,
                'totalVencido'   => $totalVencido,
                'totalGeneral'   => $totalRecaudado + $totalPendiente + $totalVencido,
            ],
            'ingresosMensuales'   => $ingresosMensuales,
            'ingresosPorConcepto' => $ingresosPorConcepto,
            'deudores'             => $deudores,
            'ultimosPagos'        => $ultimosPagos,
            'sedes'               => $sedes,
            'periodoActivo'       => $periodoActivo ? ['id' => $periodoActivo->id, 'nombre' => $periodoActivo->nombre] : null,
        ]);
    }
}
