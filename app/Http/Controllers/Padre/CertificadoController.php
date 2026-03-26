<?php

namespace App\Http\Controllers\Padre;

use App\Http\Controllers\Controller;
use App\Models\{Certificado, ConceptoPago, Pago, TipoCertificado, User};
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CertificadoController extends Controller
{
    public function index(Request $request): Response
    {
        $padre = $request->user();

        $hijos = $padre->hijos()
            ->select('users.id', 'users.name')
            ->orderBy('users.name')
            ->get();

        if ($hijos->isEmpty()) {
            return Inertia::render('Padre/Certificados', [
                'hijos' => [],
                'hijo' => null,
                'tipos' => [],
                'solicitudes' => [],
            ]);
        }

        $hijoId = (int) ($request->query('hijo_id') ?: $hijos->first()->id);
        if (!$hijos->pluck('id')->contains($hijoId)) {
            $hijoId = (int) $hijos->first()->id;
        }

        $hijo = User::query()->findOrFail($hijoId);

        $tipos = TipoCertificado::query()
            ->activo()
            ->orderBy('nombre')
            ->get()
            ->map(fn(TipoCertificado $t) => [
                'id' => $t->id,
                'nombre' => $t->nombre,
                'descripcion' => $t->descripcion,
                'precio' => (int) $t->precio,
                'codigo' => $t->codigo,
            ])
            ->values();

        $solicitudes = Certificado::query()
            ->where('estudiante_id', $hijo->id)
            ->with('tipoCertificado')
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Certificado $c) {
                $pago = Pago::query()
                    ->where('estudiante_id', $c->estudiante_id)
                    ->where('notas', 'like', 'certificado:' . $c->id . '%')
                    ->latest('id')
                    ->first();

                return [
                    'id' => $c->id,
                    'tipo' => $c->tipoCertificado?->nombre ?? ($c->tipo ?: 'Certificado'),
                    'precio' => (int) ($c->tipoCertificado?->precio ?? 0),
                    'descripcion' => $c->descripcion,
                    'estado' => $c->estado,
                    'fecha_solicitud' => $c->fecha_solicitud?->format('Y-m-d'),
                    'fecha_entrega' => $c->fecha_entrega?->format('Y-m-d'),
                    'pago' => $pago ? [
                        'id' => $pago->id,
                        'estado' => $pago->estado,
                        'monto' => (float) $pago->monto,
                        'fecha_vencimiento' => $pago->fecha_vencimiento?->format('Y-m-d'),
                        'fecha_pago' => $pago->fecha_pago?->format('Y-m-d'),
                    ] : null,
                ];
            })
            ->values();

        return Inertia::render('Padre/Certificados', [
            'hijos' => $hijos->map(fn($h) => ['id' => $h->id, 'nombre' => $h->name])->values(),
            'hijo' => [
                'id' => $hijo->id,
                'nombre' => $hijo->name,
            ],
            'tipos' => $tipos,
            'solicitudes' => $solicitudes,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $padre = $request->user();
        $hijoIds = $padre->hijos()->pluck('users.id');

        $data = $request->validate([
            'hijo_id' => 'required|integer',
            'tipo_certificado_id' => 'required|exists:tipo_certificados,id',
            'descripcion' => 'nullable|string|max:500',
        ]);

        if (!$hijoIds->contains((int) $data['hijo_id'])) {
            abort(403, 'No autorizado para solicitar certificados de este estudiante.');
        }

        $tipo = TipoCertificado::query()->activo()->findOrFail($data['tipo_certificado_id']);

        $certificado = Certificado::query()->create([
            'estudiante_id' => (int) $data['hijo_id'],
            'tipo_certificado_id' => $tipo->id,
            'tipo' => $tipo->codigo,
            'descripcion' => $data['descripcion'] ?? null,
            'estado' => 'solicitado',
            'fecha_solicitud' => now()->toDateString(),
        ]);

        if ((int) $tipo->precio > 0) {
            $concepto = ConceptoPago::query()->firstOrCreate(
                ['nombre' => 'Solicitud de Certificados'],
                [
                    'descripcion' => 'Pago de tramites de certificados solicitados por acudientes.',
                    'monto' => (int) $tipo->precio,
                    'periodicidad' => 'unico',
                    'activo' => true,
                ]
            );

            Pago::query()->create([
                'estudiante_id' => (int) $data['hijo_id'],
                'concepto_pago_id' => $concepto->id,
                'periodo_id' => null,
                'monto' => (int) $tipo->precio,
                'estado' => 'pendiente',
                'metodo_pago' => null,
                'referencia' => null,
                'fecha_vencimiento' => now()->addDays(7)->toDateString(),
                'fecha_pago' => null,
                'notas' => 'certificado:' . $certificado->id . '|' . $tipo->nombre,
            ]);
        }

        return redirect()->back()->with('success', 'Solicitud registrada. Si aplica costo, ya tienes el pago pendiente en el modulo de Pagos.');
    }
}
