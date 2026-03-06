<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Pago, ConceptoPago, User, Periodo, Matricula, Curso, Sede};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PagoController extends Controller
{
    public function index(): Response
    {
        $periodoActivo = Periodo::where('activo', true)->first();

        $pagos = Pago::with(['estudiante.matriculas' => fn($q) => $q->where('estado', 'activa')->latest()->limit(1)->with('curso'), 'conceptoPago', 'periodo', 'comprobantes'])
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
                    'concepto'          => $p->conceptoPago->nombre,
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

        $conceptos = ConceptoPago::orderBy('nombre')
            ->withCount('pagos')
            ->get()
            ->map(fn(ConceptoPago $c) => [
                'id'           => $c->id,
                'nombre'       => $c->nombre,
                'descripcion'  => $c->descripcion,
                'monto'        => (float) $c->monto,
                'periodicidad' => $c->periodicidad,
                'activo'       => $c->activo,
                'pagos_count'  => $c->pagos_count,
            ]);

        $estudiantes = User::role('estudiante')->activo()
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

        $sedes = Sede::where('activa', true)->orderBy('nombre')
            ->get()->map(fn($s) => ['id' => $s->id, 'nombre' => $s->nombre]);

        return Inertia::render('Admin/Pagos', [
            'pagos'        => $pagos,
            'conceptos'    => $conceptos,
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
            'fecha_vencimiento' => 'required|date',
            'fecha_pago'        => 'nullable|date',
            'notas'             => 'nullable|string|max:500',
        ]);

        if ($data['estado'] === 'pagado' && empty($data['fecha_pago'])) {
            $data['fecha_pago'] = now()->toDateString();
        }

        Pago::create($data);

        return redirect()->back()->with('success', 'Pago registrado correctamente.');
    }

    public function update(Request $request, Pago $pago)
    {
        $data = $request->validate([
            'estado'       => 'required|in:pendiente,pagado,vencido,anulado',
            'metodo_pago'  => 'nullable|string|max:50',
            'referencia'   => 'nullable|string|max:100',
            'fecha_pago'   => 'nullable|date',
            'notas'        => 'nullable|string|max:500',
        ]);

        if ($data['estado'] === 'pagado' && empty($data['fecha_pago'])) {
            $data['fecha_pago'] = now()->toDateString();
        }

        $pago->update($data);

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
            'fecha_pago'  => now()->toDateString(),
        ]);

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
        $concepto->update(['activo' => !$concepto->activo]);

        return redirect()->back()->with('success', $concepto->activo ? 'Concepto activado.' : 'Concepto desactivado.');
    }
}
