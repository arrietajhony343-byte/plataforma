<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\ScopesBySede;
use App\Http\Controllers\Controller;
use App\Models\{Pago, Periodo, Sede, User};
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class ContabilidadController extends Controller
{
    use ScopesBySede;

    public function index(): Response
    {
        $anio = now()->year;
        $periodoActivo = Periodo::activo()->first();
        $sedeId = $this->sedeId();

        $sedes = Sede::where('activa', true)
            ->when($sedeId, fn($q) => $q->where('id', $sedeId))
            ->orderBy('nombre')
            ->get()
            ->map(fn($s) => ['id' => $s->id, 'nombre' => $s->nombre])
            ->values();

        // Base contable alineada con Control de Pagos (sin recortar por periodo).
        $pagos = Pago::query()
            ->with([
                'estudiante.sede',
                'estudiante.padres:id,name,documento,telefono',
                'estudiante.matriculas' => fn($q) => $q
                    ->where('estado', 'activa')
                    ->orderByDesc('fecha_matricula')
                    ->orderByDesc('id')
                    ->with(['curso.sede']),
                'conceptoPago.tipoCertificado',
            ])
            ->when($sedeId, fn($q) =>
                $q->whereHas('estudiante.matriculas', fn($mq) =>
                    $mq->where('estado', 'activa')
                        ->whereHas('curso', fn($cq) => $cq->where('sede_id', $sedeId))
                )
            )
            ->get();

        $pagosContables = $pagos
            ->whereIn('estado', ['pagado', 'pendiente', 'vencido'])
            ->values();

        // Ingresos del anio actual agrupados por mes (solo pagos pagados).
        $meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        $totalesPorMes = array_fill(1, 12, 0.0);

        $pagosContables
            ->where('estado', 'pagado')
            ->each(function (Pago $pago) use (&$totalesPorMes, $anio) {
                $fecha = $pago->fecha_pago ?? $pago->created_at;
                if (!$fecha || (int) $fecha->format('Y') !== (int) $anio) {
                    return;
                }

                $mes = (int) $fecha->format('n');
                $totalesPorMes[$mes] = (float) $totalesPorMes[$mes] + (float) $pago->monto;
            });

        $ingresosMensuales = collect(range(1, 12))
            ->map(fn($m) => [
                'mes' => $meses[$m - 1],
                'total' => (float) $totalesPorMes[$m],
            ])
            ->values()
            ->all();

        // Resumen por concepto sobre la misma base de Control de Pagos.
        // Para certificados, se consolida por tipo de certificado para reflejar precios/tipos reales.
        $ingresosPorConcepto = $pagosContables
            ->groupBy(fn(Pago $p) => $this->claveConceptoContable($p))
            ->map(function (Collection $grupo) {
                /** @var Pago|null $primerPago */
                $primerPago = $grupo->first();
                $concepto = $primerPago ? $this->nombreConceptoContable($primerPago) : 'Concepto';

                $pagado = (float) $grupo->where('estado', 'pagado')->sum('monto');
                $pendiente = (float) $grupo->where('estado', 'pendiente')->sum('monto');
                $vencido = (float) $grupo->where('estado', 'vencido')->sum('monto');

                return [
                    'concepto' => $concepto,
                    'pagado' => $pagado,
                    'pendiente' => $pendiente,
                    'vencido' => $vencido,
                    'total' => $pagado + $pendiente + $vencido,
                ];
            })
            ->sortBy('concepto')
            ->values()
            ->all();

        // Resumen global
        $totalRecaudado = (float) $pagosContables->where('estado', 'pagado')->sum('monto');
        $totalPendiente = (float) $pagosContables->where('estado', 'pendiente')->sum('monto');
        $totalVencido = (float) $pagosContables->where('estado', 'vencido')->sum('monto');

        // Deudores: agrupado por estudiante sobre pagos vencidos visibles.
        $deudores = $pagosContables
            ->where('estado', 'vencido')
            ->groupBy('estudiante_id')
            ->map(function (Collection $pagosEstudiante) {
                /** @var Pago|null $primerPago */
                $primerPago = $pagosEstudiante->first();
                $estudiante = $primerPago?->estudiante;
                if (!$estudiante instanceof User) {
                    return null;
                }

                $curso = $estudiante->matriculas
                    ->sortByDesc('fecha_matricula')
                    ->first()?->curso;
                $acudiente = $estudiante->padres->first();

                return [
                    'id'             => $estudiante->id,
                    'nombre'         => $estudiante->name,
                    'documento'      => $estudiante->documento,
                    'email'          => $estudiante->email,
                    'telefono'       => $estudiante->telefono,
                    'acudiente'      => $acudiente?->name,
                    'acudiente_doc'  => $acudiente?->documento,
                    'acudiente_tel'  => $acudiente?->telefono,
                    'curso'          => $curso?->nombre ?? 'N/A',
                    'nivel'          => $curso?->nivel,
                    'sede_id'        => $curso?->sede_id ?? $estudiante->sede_id,
                    'sede'           => $curso?->sede?->nombre ?? $estudiante->sede?->nombre,
                    'pagosVencidos'  => $pagosEstudiante->count(),
                    'deudaTotal'     => (float) $pagosEstudiante->sum('monto'),
                ];
            })
            ->filter()
            ->values();

        // Últimos pagos recibidos (misma base visible de pagos).
        $ultimosPagos = $pagosContables
            ->where('estado', 'pagado')
            ->sortByDesc(fn(Pago $p) => ($p->fecha_pago ?? $p->created_at)?->timestamp ?? 0)
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
                    'concepto'    => $this->nombreConceptoContable($p),
                    'monto'       => (float) $p->monto,
                    'fecha'       => ($p->fecha_pago ?? $p->created_at)?->format('Y-m-d'),
                    'metodo'      => $p->metodo_pago,
                    'referencia'  => $p->referencia,
                    'curso'       => $curso?->nombre,
                    'nivel'       => $curso?->nivel,
                    'sede_id'     => $curso?->sede_id ?? $p->estudiante?->sede_id,
                    'sede'        => $curso?->sede?->nombre ?? $p->estudiante?->sede?->nombre,
                ];
            })
            ->values()
            ->all();

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

    private function claveConceptoContable(Pago $pago): string
    {
        $tipo = $this->extractTipoCertificadoFromNotas($pago->notas)
            ?? $pago->conceptoPago?->tipoCertificado?->nombre;

        if ($tipo) {
            return 'certificado:' . strtolower(trim($tipo));
        }

        return 'concepto:' . (string) ($pago->concepto_pago_id ?? 0);
    }

    private function nombreConceptoContable(Pago $pago): string
    {
        $tipo = $this->extractTipoCertificadoFromNotas($pago->notas)
            ?? $pago->conceptoPago?->tipoCertificado?->nombre;

        if ($tipo) {
            return 'Solicitud certificado: ' . trim($tipo);
        }

        return $pago->conceptoPago?->nombre ?? 'Concepto';
    }

    private function extractTipoCertificadoFromNotas(?string $notas): ?string
    {
        if (!$notas) {
            return null;
        }

        if (!preg_match('/certificado:\d+\|([^|]+)/', $notas, $matches)) {
            return null;
        }

        $tipo = trim((string) ($matches[1] ?? ''));
        return $tipo !== '' ? $tipo : null;
    }
}
