<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\{Mensaje, User};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MensajeController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        // Obtener conversaciones: usuarios con los que tiene mensajes
        $sentIds = Mensaje::where('remitente_id', $user->id)->pluck('destinatario_id');
        $recvIds = Mensaje::where('destinatario_id', $user->id)->pluck('remitente_id');
        $contactIds = $sentIds->merge($recvIds)->unique();

        $contactos = User::whereIn('id', $contactIds)->get()->map(function (User $contact) use ($user) {
            $mensajes = Mensaje::conversacion($user->id, $contact->id)
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(fn($m) => [
                    'id'      => $m->id,
                    'texto'   => $m->contenido,
                    'fecha'   => $m->created_at->format('Y-m-d H:i'),
                    'propio'  => $m->remitente_id === $user->id,
                    'leido'   => $m->leido,
                ]);

            $noLeidos = Mensaje::where('remitente_id', $contact->id)
                ->where('destinatario_id', $user->id)
                ->noLeido()
                ->count();

            $rol = 'usuario';
            if ($contact->hasRole('profesor')) $rol = 'Profesor';
            elseif ($contact->hasRole('padre')) $rol = 'Padre de Familia';
            elseif ($contact->hasRole('estudiante')) $rol = 'Estudiante';
            elseif ($contact->hasRole('admin')) $rol = 'Admin';

            return [
                'id'        => $contact->id,
                'nombre'    => $contact->name,
                'rol'       => $rol,
                'avatar'    => strtoupper(substr($contact->name, 0, 2)),
                'mensajes'  => $mensajes,
                'noLeidos'  => $noLeidos,
            ];
        })->sortByDesc('noLeidos')->values();

        // Lista de usuarios disponibles para nuevo chat
        $disponibles = User::where('id', '!=', $user->id)
            ->activo()
            ->select('id', 'name')
            ->orderBy('name')
            ->limit(50)
            ->get()
            ->map(fn($u) => ['id' => $u->id, 'nombre' => $u->name]);

        return Inertia::render('Profesor/Mensajes', [
            'profesor'    => ['nombre' => $user->name],
            'contactos'   => $contactos,
            'disponibles' => $disponibles,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'destinatario_id' => 'required|exists:users,id',
            'contenido'       => 'required|string|max:2000',
        ]);

        Mensaje::create([
            'remitente_id'    => auth()->id(),
            'destinatario_id' => $data['destinatario_id'],
            'contenido'       => $data['contenido'],
        ]);

        return redirect()->back()->with('success', 'Mensaje enviado.');
    }
}
