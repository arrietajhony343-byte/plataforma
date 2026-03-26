<?php

namespace App\Http\Controllers\Padre;

use App\Http\Controllers\Controller;
use App\Models\{Comprobante, Pago, User};
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PagoController extends Controller
{
    public function index(Request $request): Response
    {
        $padre = $request->user();

        $hijos = $padre->hijos()
            ->select('users.id', 'users.name')
            ->orderBy('users.name')
            ->get();

        if ($hijos->isEmpty()) {
            return Inertia::render('Padre/Pagos', [
                'hijos' => [],
                'hijo' => null,
                'pagos' => [],
                'resumen' => [
                    'total_pagado' => 0,
                    'total_pendiente' => 0,
                    'total_general' => 0,
                ],
            ]);
        }

        $hijoId = (int) ($request->query('hijo_id') ?: $hijos->first()->id);
        if (!$hijos->pluck('id')->contains($hijoId)) {
            $hijoId = (int) $hijos->first()->id;
        }

        $hijo = User::query()->findOrFail($hijoId);

        $pagosModel = Pago::query()
            ->where('estudiante_id', $hijo->id)
            ->with(['conceptoPago:id,nombre', 'periodo:id,nombre'])
            ->orderBy('fecha_vencimiento')
            ->orderByDesc('id')
            ->get();

        $pagos = $pagosModel->map(function (Pago $p) {
            return [
                'id' => $p->id,
                'concepto' => $p->conceptoPago?->nombre ?? 'Concepto',
                'detalle' => $p->notas,
                'periodo' => $p->periodo?->nombre,
                'monto' => (float) $p->monto,
                'estado' => $p->estado,
                'metodo_pago' => $p->metodo_pago,
                'referencia' => $p->referencia,
                'fecha_vencimiento' => $p->fecha_vencimiento?->format('Y-m-d'),
                'fecha_pago' => $p->fecha_pago?->format('Y-m-d'),
                'es_certificado' => str_starts_with((string) $p->notas, 'certificado:'),
            ];
        })->values();

        $resumen = [
            'total_pagado' => (float) $pagosModel->where('estado', 'pagado')->sum('monto'),
            'total_pendiente' => (float) $pagosModel->whereIn('estado', ['pendiente', 'vencido'])->sum('monto'),
            'total_general' => (float) $pagosModel->sum('monto'),
        ];

        return Inertia::render('Padre/Pagos', [
            'hijos' => $hijos->map(fn($h) => ['id' => $h->id, 'nombre' => $h->name])->values(),
            'hijo' => [
                'id' => $hijo->id,
                'nombre' => $hijo->name,
            ],
            'pagos' => $pagos,
            'resumen' => $resumen,
        ]);
    }

    public function pagar(Request $request, Pago $pago): RedirectResponse
    {
        $padre = $request->user();
        $hijoIds = $padre->hijos()->pluck('users.id');

        if (!$hijoIds->contains((int) $pago->estudiante_id)) {
            abort(403, 'No autorizado para pagar este registro.');
        }

        if ($pago->estado === 'pagado') {
            return redirect()->back()->with('success', 'Este pago ya se encuentra confirmado.');
        }

        $data = $request->validate([
            'metodo_pago' => 'required|in:tarjeta,pse,nequi,efectivo,transferencia',
            'referencia' => 'nullable|string|max:100',
        ]);

        $referencia = $data['referencia'] ?: ('PAD-' . now()->format('YmdHis') . '-' . strtoupper(Str::random(4)));

        $pago->update([
            'estado' => 'pagado',
            'metodo_pago' => $data['metodo_pago'],
            'referencia' => $referencia,
            'fecha_pago' => now()->toDateString(),
        ]);

        Comprobante::query()->firstOrCreate(
            ['pago_id' => $pago->id],
            [
                'archivo' => 'virtual/comprobante-' . $pago->id . '.txt',
                'estado' => 'confirmado',
                'nota_admin' => 'Pago confirmado desde el portal de acudiente.',
            ]
        );

        return redirect()->back()->with('success', 'Pago registrado correctamente y comprobante generado.');
    }

    public function comprobantes(Request $request): Response
    {
        $padre = $request->user();

        $hijos = $padre->hijos()
            ->select('users.id', 'users.name')
            ->orderBy('users.name')
            ->get();

        if ($hijos->isEmpty()) {
            return Inertia::render('Padre/Comprobantes', [
                'hijos' => [],
                'hijo' => null,
                'comprobantes' => [],
            ]);
        }

        $hijoId = (int) ($request->query('hijo_id') ?: $hijos->first()->id);
        if (!$hijos->pluck('id')->contains($hijoId)) {
            $hijoId = (int) $hijos->first()->id;
        }

        $hijo = User::query()->findOrFail($hijoId);

        $pagos = Pago::query()
            ->where('estudiante_id', $hijo->id)
            ->where('estado', 'pagado')
            ->with(['conceptoPago:id,nombre', 'comprobantes'])
            ->orderByDesc('fecha_pago')
            ->get();

        $comprobantes = $pagos->map(function (Pago $p) {
            $comprobante = $p->comprobantes->sortByDesc('id')->first();

            return [
                'id' => $p->id,
                'referencia' => $p->referencia,
                'concepto' => $p->conceptoPago?->nombre ?? 'Concepto',
                'detalle' => $p->notas,
                'monto' => (float) $p->monto,
                'fecha_pago' => $p->fecha_pago?->format('Y-m-d'),
                'metodo_pago' => $p->metodo_pago,
                'estado' => $comprobante?->estado ?? 'confirmado',
            ];
        })->values();

        return Inertia::render('Padre/Comprobantes', [
            'hijos' => $hijos->map(fn($h) => ['id' => $h->id, 'nombre' => $h->name])->values(),
            'hijo' => [
                'id' => $hijo->id,
                'nombre' => $hijo->name,
            ],
            'comprobantes' => $comprobantes,
        ]);
    }
}
