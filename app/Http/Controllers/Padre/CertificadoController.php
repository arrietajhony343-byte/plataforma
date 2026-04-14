<?php

namespace App\Http\Controllers\Padre;

use App\Http\Controllers\Controller;
use App\Models\{Certificado, ConceptoPago, Notificacion, Pago, TipoCertificado, User};
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
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
                    'id'                 => $c->id,
                    'tipo'               => $c->tipoCertificado?->nombre ?? ($c->tipo ?: 'Certificado'),
                    'precio'             => (int) ($c->tipoCertificado?->precio ?? 0),
                    'descripcion'        => $c->descripcion,
                    'estado'             => $c->estado,
                    'archivo_disponible' => !empty($c->archivo),
                    'fecha_solicitud'    => $c->fecha_solicitud?->format('Y-m-d'),
                    'fecha_entrega'      => $c->fecha_entrega?->format('Y-m-d'),
                    'pago'               => $pago ? [
                        'id'               => $pago->id,
                        'estado'           => $pago->estado,
                        'monto'            => (float) $pago->monto,
                        'fecha_vencimiento'=> $pago->fecha_vencimiento?->format('Y-m-d'),
                        'fecha_pago'       => $pago->fecha_pago?->format('Y-m-d'),
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

        [$certificado, $pagoPendiente] = DB::transaction(function () use ($data, $tipo) {
            $certificado = Certificado::query()->create([
                'estudiante_id' => (int) $data['hijo_id'],
                'tipo_certificado_id' => $tipo->id,
                'tipo' => $tipo->codigo,
                'descripcion' => $data['descripcion'] ?? null,
                'estado' => 'solicitado',
                'fecha_solicitud' => now()->toDateString(),
            ]);

            $pagoPendiente = null;

            if ((int) $tipo->precio > 0) {
                $concepto = $this->conceptoCertificado($tipo);

                $pagoPendiente = Pago::query()->create([
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

            return [$certificado, $pagoPendiente];
        });

        if ($pagoPendiente instanceof Pago) {
            $this->notificarPagoPendiente($certificado, $pagoPendiente, $tipo);
            return redirect()->back()->with('success', 'Solicitud registrada. Se generó el pago pendiente y se notificó al acudiente.');
        }

        return redirect()->back()->with('success', 'Solicitud registrada correctamente.');
    }

    private function conceptoCertificado(TipoCertificado $tipo): ConceptoPago
    {
        return ConceptoPago::query()->updateOrCreate(
            ['tipo_certificado_id' => $tipo->id],
            [
                'nombre' => 'Solicitud certificado: ' . $tipo->nombre,
                'descripcion' => 'Solicitud de ' . $tipo->nombre . ' generada desde el módulo de certificados.',
                'monto' => (int) $tipo->precio,
                'periodicidad' => 'unico',
                'activo' => (bool) $tipo->activo,
            ]
        );
    }

    private function notificarPagoPendiente(Certificado $certificado, Pago $pago, TipoCertificado $tipo): void
    {
        $estudiante = User::query()
            ->with('padres:id,name')
            ->find($certificado->estudiante_id);

        if (!$estudiante || $estudiante->padres->isEmpty()) {
            return;
        }

        $monto = '$' . number_format((float) $pago->monto, 0, ',', '.');
        $vencimiento = $pago->fecha_vencimiento?->format('Y-m-d') ?? now()->toDateString();
        $mensaje = 'Se generó un pago pendiente por ' . $tipo->nombre . ' para ' . $estudiante->name . '. Valor: ' . $monto . '. Vence: ' . $vencimiento . '.';

        foreach ($estudiante->padres as $padre) {
            Notificacion::query()->create([
                'user_id' => $padre->id,
                'tipo' => 'pago',
                'titulo' => 'Pago pendiente de certificado',
                'mensaje' => $mensaje,
                'leida' => false,
            ]);
        }
    }

    public function download(Request $request, Certificado $certificado)
    {
        $padre = $request->user();
        $hijoIds = $padre->hijos()->pluck('users.id');

        if (!$hijoIds->contains((int) $certificado->estudiante_id)) {
            abort(403, 'No autorizado para descargar este certificado.');
        }

        if (!in_array($certificado->estado, ['listo', 'entregado'], true)) {
            return redirect()->back()->with('error', 'El certificado aún no está generado para descarga.');
        }

        if (!$certificado->archivo || !Storage::exists($certificado->archivo)) {
            return redirect()->back()->with('error', 'El archivo del certificado no está disponible.');
        }

        // Marcar como entregado la primera vez que el padre descarga
        if ($certificado->estado === 'listo') {
            $certificado->update([
                'estado'        => 'entregado',
                'fecha_entrega' => now(),
            ]);
        }

        return Storage::download($certificado->archivo);
    }
}
