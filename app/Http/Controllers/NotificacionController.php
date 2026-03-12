<?php

namespace App\Http\Controllers;

use App\Models\Notificacion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificacionController extends Controller
{
    /**
     * Retorna las notificaciones del usuario autenticado (JSON).
     */
    public function index()
    {
        $notificaciones = Notificacion::where('user_id', Auth::id())
            ->orderByRaw("CASE WHEN leida = 0 THEN 0 ELSE 1 END")
            ->orderBy('created_at', 'desc')
            ->take(20)
            ->get()
            ->map(fn($n) => [
                'id'         => $n->id,
                'tipo'       => $n->tipo,
                'titulo'     => $n->titulo,
                'mensaje'    => $n->mensaje,
                'leida'      => (bool) $n->leida,
                'created_at' => $n->created_at?->diffForHumans(),
            ]);

        $noLeidas = Notificacion::where('user_id', Auth::id())
            ->where('leida', false)
            ->count();

        return response()->json([
            'notificaciones' => $notificaciones,
            'noLeidas'       => $noLeidas,
        ]);
    }

    /**
     * Marca una notificación como leída.
     */
    public function marcarLeida(int $id)
    {
        $notif = Notificacion::where('id', $id)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $notif->update([
            'leida'    => true,
            'leida_at' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Marca todas las notificaciones del usuario como leídas.
     */
    public function marcarTodasLeidas()
    {
        Notificacion::where('user_id', Auth::id())
            ->where('leida', false)
            ->update([
                'leida'    => true,
                'leida_at' => now(),
            ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Elimina una notificación leída del usuario autenticado.
     */
    public function destroy(int $id)
    {
        $notif = Notificacion::where('id', $id)
            ->where('user_id', Auth::id())
            ->where('leida', true)
            ->firstOrFail();

        $notif->delete();

        return response()->json(['ok' => true]);
    }

    /**
     * Elimina todas las notificaciones leídas del usuario autenticado.
     */
    public function destroyLeidas()
    {
        Notificacion::where('user_id', Auth::id())
            ->where('leida', true)
            ->delete();

        return response()->json(['ok' => true]);
    }
}
