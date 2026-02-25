<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Pago, ConceptoPago, User, Periodo};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PagoController extends Controller
{
    public function index(): Response
    {
        $pagos = Pago::with(['estudiante', 'conceptoPago', 'periodo'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn(Pago $p) => [
                'id'               => $p->id,
                'estudiante'       => $p->estudiante->name,
                'grado'            => '', // se puede enriquecer con matrícula
                'concepto'         => $p->conceptoPago->nombre,
                'monto'            => (float) $p->monto,
                'fecha_vencimiento'=> $p->fecha_vencimiento?->format('Y-m-d'),
                'fecha_pago'       => $p->fecha_pago?->format('Y-m-d'),
                'estado'           => $p->estado,
                'monto_pagado'     => $p->estado === 'pagado' ? (float) $p->monto : 0,
                'metodo_pago'      => $p->metodo_pago,
                'referencia'       => $p->referencia,
            ]);

        $conceptos = ConceptoPago::all()->map(fn($c) => [
            'id'     => $c->id,
            'nombre' => $c->nombre,
            'monto'  => (float) $c->monto,
        ]);

        $estudiantes = User::role('estudiante')->activo()->select('id', 'name')->get();
        $periodos    = Periodo::orderByDesc('anio')->orderBy('numero')->get(['id', 'nombre', 'anio']);

        return Inertia::render('Admin/Pagos', [
            'pagos'       => $pagos,
            'conceptos'   => $conceptos,
            'estudiantes' => $estudiantes,
            'periodos'    => $periodos,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'estudiante_id'     => 'required|exists:users,id',
            'concepto_pago_id'  => 'required|exists:concepto_pagos,id',
            'periodo_id'        => 'nullable|exists:periodos,id',
            'monto'             => 'required|numeric|min:0',
            'estado'            => 'required|in:pendiente,pagado,vencido',
            'metodo_pago'       => 'nullable|string',
            'referencia'        => 'nullable|string',
            'fecha_vencimiento' => 'nullable|date',
            'fecha_pago'        => 'nullable|date',
        ]);

        Pago::create($data);

        return redirect()->back()->with('success', 'Pago registrado.');
    }

    public function update(Request $request, Pago $pago)
    {
        $data = $request->validate([
            'estado'      => 'required|in:pendiente,pagado,vencido',
            'metodo_pago' => 'nullable|string',
            'referencia'  => 'nullable|string',
            'fecha_pago'  => 'nullable|date',
        ]);

        $pago->update($data);

        return redirect()->back()->with('success', 'Pago actualizado.');
    }
}
