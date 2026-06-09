<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ScopesBySede;
use App\Models\{Certificado, ConceptoPago, Notificacion, Pago, Periodo, Sede, TipoCertificado, User};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PagoController extends Controller
{
    use ScopesBySede;

    public function index(): Response
    {
        $this->sincronizarConceptosCertificados();

        $periodoActivo = Periodo::where('activo', true)->first();
        $sedeId = $this->sedeId();

        $pagos = Pago::with([
            'estudiante.matriculas' => fn($q) => $q->where('estado', 'activa')->latest()->limit(1)->with('curso'),
            'conceptoPago.tipoCertificado',
            'periodo',
            'comprobantes',
        ])
            ->when($sedeId, fn($q) =>
                $q->whereHas('estudiante.matriculas', fn($mq) =>
                    $mq->where('estado', 'activa')
                       ->whereHas('curso', fn($cq) => $cq->where('sede_id', $sedeId))
                )
            )
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Pago $p) {
                $matricula = $p->estudiante->matriculas->first();
                return [
                    'id'                => $p->id,
                    'estudiante_id'     => $p->estudiante_id,
                    'estudiante'        => $p->estudiante->name,
                    'curso'             => $matricula?->curso?->nombre ?? '—',
                    'curso_id'          => $matricula?->curso_id,
                    'nivel'             => $matricula?->curso?->nivel ?? '',
                    'sede_id'           => $matricula?->curso?->sede_id,
                    'concepto_pago_id'  => $p->concepto_pago_id,
                    'concepto'          => $this->nombreConceptoVisible($p),
                    'periodo_id'        => $p->periodo_id,
                    'periodo'           => $p->periodo?->nombre ?? '—',
                    'monto'             => (float) $p->monto,
                    'estado'            => $p->estado,
                    'metodo_pago'       => $p->metodo_pago,
                    'referencia'        => $p->referencia,
                    'fecha_vencimiento' => $p->fecha_vencimiento?->format('Y-m-d'),
                    'fecha_pago'        => $p->fecha_pago?->format('Y-m-d'),
                    'notas'             => $p->notas,
                    'comprobantes'      => $p->comprobantes->count(),
                ];
            });

        $conceptos = ConceptoPago::query()
            ->with('tipoCertificado:id,nombre,precio,activo')
            ->orderBy('nombre')
            ->withCount('pagos')
            ->get()
            ->map(fn(ConceptoPago $c) => [
                'id'           => $c->id,
                'tipo_certificado_id' => $c->tipo_certificado_id,
                'tipo_certificado_nombre' => $c->tipoCertificado?->nombre,
                'es_certificado' => (bool) $c->tipo_certificado_id,
                'nombre'       => $c->nombre,
                'descripcion'  => $c->descripcion,
                'monto'        => (float) $c->monto,
                'periodicidad' => $c->periodicidad,
                'activo'       => $c->activo,
                'pagos_count'  => $c->pagos_count,
            ]);

        $estudiantes = User::role('estudiante')->activo()
            ->when($sedeId, fn($q) =>
                $q->whereHas('matriculas', fn($mq) =>
                    $mq->where('estado', 'activa')
                       ->whereHas('curso', fn($cq) => $cq->where('sede_id', $sedeId))
                )
            )
            ->with(['matriculas' => fn($q) => $q->where('estado', 'activa')->latest()->limit(1)->with('curso')])
            ->orderBy('name')
            ->get()
            ->map(fn(User $e) => [
                'id'    => $e->id,
                'name'  => $e->name,
                'curso' => $e->matriculas->first()?->curso?->nombre ?? '—',
            ]);

        $periodos = Periodo::orderByDesc('anio')->orderBy('numero')
            ->get()
            ->map(fn($p) => ['id' => $p->id, 'nombre' => $p->nombre, 'anio' => $p->anio, 'activo' => $p->activo]);

        $tiposCertificado = TipoCertificado::query()
            ->orderBy('nombre')
            ->get()
            ->map(fn(TipoCertificado $t) => [
                'id' => $t->id,
                'nombre' => $t->nombre,
                'precio' => (int) $t->precio,
                'activo' => (bool) $t->activo,
            ])
            ->values();

        $sedes = Sede::where('activa', true)->orderBy('nombre')
            ->when($sedeId, fn($q) => $q->where('id', $sedeId))
            ->get()->map(fn($s) => ['id' => $s->id, 'nombre' => $s->nombre]);

        return Inertia::render('Admin/Pagos', [
            'pagos'        => $pagos,
            'conceptos'    => $conceptos,
            'tiposCertificado' => $tiposCertificado,
            'estudiantes'  => $estudiantes,
            'periodos'     => $periodos,
            'sedes'        => $sedes,
            'periodoActivo' => $periodoActivo ? ['id' => $periodoActivo->id, 'nombre' => $periodoActivo->nombre] : null,
        ]);
    }

    /* ══════ CRUD Pagos ══════ */

    public function store(Request $request)
    {
        $data = $request->validate([
            'estudiante_id'     => 'required|exists:users,id',
            'concepto_pago_id'  => 'required|exists:concepto_pagos,id',
            'periodo_id'        => 'nullable|exists:periodos,id',
            'monto'             => 'required|numeric|min:0',
            'estado'            => 'required|in:pendiente,pagado',
            'metodo_pago'       => 'nullable|string|max:50',
            'referencia'        => 'nullable|string|max:100',
            'fecha_vencimiento' => 'nullable|date|required_if:estado,pendiente',
            'fecha_pago'        => 'nullable|date',
            'notas'             => 'nullable|string|max:500',
            'tipo_certificado_id' => 'nullable|exists:tipo_certificados,id',
            'descripcion_solicitud' => 'nullable|string|max:500',
        ]);

        $concepto = ConceptoPago::query()
            ->with('tipoCertificado')
            ->findOrFail((int) $data['concepto_pago_id']);

        $tipoCertificado = $this->resolverTipoCertificado(
            $concepto,
            isset($data['tipo_certificado_id']) ? (int) $data['tipo_certificado_id'] : null
        );

        if ($tipoCertificado && !$tipoCertificado->activo) {
            return redirect()->back()->with('error', 'El tipo de certificado seleccionado está inactivo.');
        }

        [$pago, $esSolicitudCertificado] = DB::transaction(function () use ($data, $tipoCertificado) {
            $notasSistema = null;

            if ($tipoCertificado instanceof TipoCertificado) {
                $certificado = Certificado::query()->create([
                    'estudiante_id' => (int) $data['estudiante_id'],
                    'tipo_certificado_id' => $tipoCertificado->id,
                    'tipo' => $tipoCertificado->codigo,
                    'descripcion' => $data['descripcion_solicitud'] ?? ($data['notas'] ?? null),
                    'estado' => 'solicitado',
                    'fecha_solicitud' => now('America/Bogota')->toDateString(),
                ]);

                $data['periodo_id'] = null;
                $data['monto'] = (int) $tipoCertificado->precio;
                $notasSistema = 'certificado:' . $certificado->id . '|' . $tipoCertificado->nombre;
            }

            if ($data['estado'] === 'pagado' && empty($data['fecha_pago'])) {
                $data['fecha_pago'] = now('America/Bogota')->toDateString();
            }

            if ($data['estado'] === 'pagado' && empty($data['fecha_vencimiento'])) {
                // La tabla requiere fecha_vencimiento; para pagos ya cancelados se iguala a fecha de pago.
                $data['fecha_vencimiento'] = $data['fecha_pago'] ?? now('America/Bogota')->toDateString();
            }

            $notaLibre = trim((string) ($data['notas'] ?? ''));
            $notasFinales = $notasSistema
                ? ($notaLibre ? ($notasSistema . ' || ' . $notaLibre) : $notasSistema)
                : ($notaLibre !== '' ? $notaLibre : null);

            $pago = Pago::query()->create([
                'estudiante_id' => (int) $data['estudiante_id'],
                'concepto_pago_id' => (int) $data['concepto_pago_id'],
                'periodo_id' => $data['periodo_id'] ?? null,
                'monto' => (float) $data['monto'],
                'estado' => $data['estado'],
                'metodo_pago' => $data['metodo_pago'] ?? null,
                'referencia' => $data['referencia'] ?? null,
                'fecha_vencimiento' => $data['fecha_vencimiento'] ?? null,
                'fecha_pago' => $data['fecha_pago'] ?? null,
                'notas' => $notasFinales,
            ]);

            return [$pago, $tipoCertificado instanceof TipoCertificado];
        });

        if (($pago->estado ?? null) === 'pagado') {
            $this->marcarCertificadoEnGestion($pago);
        }

        if (($pago->estado ?? null) === 'pendiente') {
            $this->notificarAcudientesPagoPendiente($pago);
        }

        if ($esSolicitudCertificado) {
            return redirect()->back()->with('success', 'Pago registrado y solicitud de certificado creada correctamente.');
        }

        return redirect()->back()->with('success', 'Pago registrado correctamente.');
    }

    public function update(Request $request, Pago $pago)
    {
        $estadoPrevio = $pago->estado;

        $data = $request->validate([
            'estado'       => 'required|in:pendiente,pagado,vencido,anulado',
            'metodo_pago'  => 'nullable|string|max:50',
            'referencia'   => 'nullable|string|max:100',
            'fecha_pago'   => 'nullable|date',
            'notas'        => 'nullable|string|max:500',
        ]);

        if ($data['estado'] === 'pagado' && empty($data['fecha_pago'])) {
            $data['fecha_pago'] = now('America/Bogota')->toDateString();
        }

        $pago->update($data);

        if (($data['estado'] ?? null) === 'pagado' && $estadoPrevio !== 'pagado') {
            $this->marcarCertificadoEnGestion($pago);
        }

        if (($data['estado'] ?? null) === 'pendiente' && $estadoPrevio !== 'pendiente') {
            $this->notificarAcudientesPagoPendiente($pago);
        }

        return redirect()->back()->with('success', 'Pago actualizado.');
    }

    public function confirmar(Request $request, Pago $pago)
    {
        $data = $request->validate([
            'metodo_pago' => 'required|string|max:50',
            'referencia'  => 'nullable|string|max:100',
        ]);

        $pago->update([
            'estado'      => 'pagado',
            'metodo_pago' => $data['metodo_pago'],
            'referencia'  => $data['referencia'] ?? null,
            'fecha_pago'  => now('America/Bogota')->toDateString(),
        ]);

        $this->marcarCertificadoEnGestion($pago);

        return redirect()->back()->with('success', 'Pago confirmado.');
    }

    public function anular(Pago $pago)
    {
        $pago->update(['estado' => 'anulado']);

        return redirect()->back()->with('success', 'Pago anulado.');
    }

    public function destroy(Pago $pago)
    {
        $pago->delete();

        return redirect()->back()->with('success', 'Pago eliminado.');
    }

    /* ══════ CRUD Conceptos ══════ */

    public function storeConcepto(Request $request)
    {
        $data = $request->validate([
            'nombre'       => 'required|string|max:100',
            'descripcion'  => 'nullable|string|max:255',
            'monto'        => 'required|numeric|min:0',
            'periodicidad' => 'required|in:unico,mensual,anual',
        ]);

        ConceptoPago::create($data);

        return redirect()->back()->with('success', 'Concepto creado.');
    }

    public function updateConcepto(Request $request, ConceptoPago $concepto)
    {
        if ($concepto->tipo_certificado_id) {
            return redirect()->back()->with('error', 'Los conceptos asociados a tipos de certificado se administran desde el módulo de Certificados.');
        }

        $data = $request->validate([
            'nombre'       => 'required|string|max:100',
            'descripcion'  => 'nullable|string|max:255',
            'monto'        => 'required|numeric|min:0',
            'periodicidad' => 'required|in:unico,mensual,anual',
        ]);

        $concepto->update($data);

        return redirect()->back()->with('success', 'Concepto actualizado.');
    }

    public function toggleConcepto(ConceptoPago $concepto)
    {
        if ($concepto->tipo_certificado_id) {
            return redirect()->back()->with('error', 'Los conceptos asociados a tipos de certificado se administran desde el módulo de Certificados.');
        }

        $concepto->update(['activo' => !$concepto->activo]);

        return redirect()->back()->with('success', $concepto->activo ? 'Concepto activado.' : 'Concepto desactivado.');
    }

    public function destroyConcepto(ConceptoPago $concepto)
    {
        if ($concepto->tipo_certificado_id) {
            return redirect()->back()->with('error', 'Los conceptos asociados a tipos de certificado se administran desde el módulo de Certificados.');
        }

        if ($concepto->pagos()->count() > 0) {
            return redirect()->back()->with('error', 'No se puede eliminar un concepto que tiene pagos asociados.');
        }

        $concepto->delete();

        return redirect()->back()->with('success', 'Concepto eliminado.');
    }

    private function sincronizarConceptosCertificados(): void
    {
        $tipos = TipoCertificado::query()->get();

        foreach ($tipos as $tipo) {
            ConceptoPago::query()->updateOrCreate(
                ['tipo_certificado_id' => $tipo->id],
                [
                    'nombre' => $this->nombreConceptoCertificado($tipo->nombre),
                    'descripcion' => 'Solicitud de ' . $tipo->nombre . ' creada desde certificados o control de pagos.',
                    'monto' => (int) $tipo->precio,
                    'periodicidad' => 'unico',
                    'activo' => (bool) $tipo->activo,
                ]
            );
        }

        ConceptoPago::query()
            ->whereNull('tipo_certificado_id')
            ->where('nombre', 'Solicitud de Certificados')
            ->update(['activo' => false]);
    }

    private function resolverTipoCertificado(ConceptoPago $concepto, ?int $tipoCertificadoId): ?TipoCertificado
    {
        if ($concepto->tipo_certificado_id) {
            return TipoCertificado::query()->find($concepto->tipo_certificado_id);
        }

        if ($tipoCertificadoId) {
            return TipoCertificado::query()->find($tipoCertificadoId);
        }

        return null;
    }

    private function nombreConceptoVisible(Pago $pago): string
    {
        $tipoDesdeNotas = $this->extractTipoCertificadoFromNotas($pago->notas);
        if ($tipoDesdeNotas) {
            return $this->nombreConceptoCertificado($tipoDesdeNotas);
        }

        $tipoRelacion = $pago->conceptoPago?->tipoCertificado?->nombre;
        if ($tipoRelacion) {
            return $this->nombreConceptoCertificado($tipoRelacion);
        }

        return $pago->conceptoPago?->nombre ?? 'Concepto';
    }

    private function nombreConceptoCertificado(string $tipoNombre): string
    {
        return 'Solicitud certificado: ' . trim($tipoNombre);
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

    private function notificarAcudientesPagoPendiente(Pago $pago): void
    {
        if ($pago->estado !== 'pendiente') {
            return;
        }

        $pago->loadMissing([
            'estudiante.padres:id,name',
            'conceptoPago.tipoCertificado',
        ]);

        $estudiante = $pago->estudiante;
        if (!$estudiante || $estudiante->padres->isEmpty()) {
            return;
        }

        $concepto = $this->nombreConceptoVisible($pago);
        $monto = '$' . number_format((float) $pago->monto, 0, ',', '.');
        $vencimiento = $pago->fecha_vencimiento?->format('Y-m-d') ?? 'sin fecha';
        $mensaje = 'Se generó un pago pendiente de ' . $concepto . ' para ' . $estudiante->name . '. Valor: ' . $monto . '. Vence: ' . $vencimiento . '.';

        foreach ($estudiante->padres as $padre) {
            Notificacion::query()->create([
                'user_id' => $padre->id,
                'tipo' => 'pago',
                'titulo' => 'Nuevo pago pendiente',
                'mensaje' => $mensaje,
                'leida' => false,
            ]);
        }
    }

    private function marcarCertificadoEnGestion(Pago $pago): void
    {
        $certificadoId = $this->extractCertificadoIdFromNotas($pago->notas);
        if (!$certificadoId) {
            return;
        }

        $certificado = Certificado::query()->find($certificadoId);
        if (!$certificado) {
            return;
        }

        if ($certificado->estado === 'solicitado') {
            $certificado->update(['estado' => 'en_proceso']);
        }
    }

    private function extractCertificadoIdFromNotas(?string $notas): ?int
    {
        if (!$notas) {
            return null;
        }

        if (!preg_match('/certificado:(\d+)/', $notas, $matches)) {
            return null;
        }

        return (int) ($matches[1] ?? 0) ?: null;
    }
}
