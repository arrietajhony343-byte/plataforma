<?php

namespace App\Http\Controllers\Padre;

use App\Http\Controllers\Controller;
use App\Models\Notificacion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificacionController extends Controller
{
    public function index(Request $request): Response
    {
        $padre = $request->user();

        $notificaciones = Notificacion::query()
            ->where('user_id', $padre->id)
            ->orderByRaw("CASE WHEN leida = 0 THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->limit(200)
            ->get()
            ->map(fn(Notificacion $n) => [
                'id' => $n->id,
                'tipo' => $n->tipo,
                'titulo' => $n->titulo,
                'descripcion' => $n->mensaje,
                'detalle' => null,
                'fecha' => optional($n->created_at)->format('Y-m-d'),
                'hora' => optional($n->created_at)->format('h:i A'),
                'leida' => (bool) $n->leida,
            ])
            ->values();

        return Inertia::render('Padre/Notificaciones', [
            'padre' => [
                'nombre' => $padre->name,
            ],
            'notificaciones' => $notificaciones,
        ]);
    }
}
