<?php

namespace App\Http\Controllers;

use App\Models\Mensaje;
use App\Models\User;
use App\Services\MessageCenterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MensajeController extends Controller
{
    public function __construct(private readonly MessageCenterService $messageCenterService)
    {
    }

    public function index(): Response
    {
        $user = auth()->user();

        abort_unless($user, 401);

        return Inertia::render($this->resolveView($user), $this->messageCenterService->buildPageData($user));
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $data = $request->validate([
            'destinatario_id' => 'required|integer|exists:users,id',
            'contenido'       => 'nullable|string|max:5000',
            'asunto'          => 'nullable|string|max:255',
            'archivo'         => 'nullable|file|max:10240|mimes:jpeg,jpg,png,gif,webp,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip',
        ]);

        $contenido = trim($data['contenido'] ?? '');

        if ($contenido === '' && !$request->hasFile('archivo')) {
            return response()->json(['message' => 'Debes escribir un mensaje o adjuntar un archivo.'], 422);
        }

        $archivoData = null;
        if ($request->hasFile('archivo')) {
            $file        = $request->file('archivo');
            $path        = $file->store('mensajes/' . now()->format('Y/m'), 'public');
            $archivoData = [
                'url'    => Storage::disk('public')->url($path),
                'nombre' => $file->getClientOriginalName(),
                'tipo'   => $file->getMimeType(),
                'tamano' => $file->getSize(),
            ];
        }

        $payload = $this->messageCenterService->send(
            $user,
            (int) $data['destinatario_id'],
            $contenido,
            $data['asunto'] ?? null,
            $archivoData,
        );

        return response()->json($payload);
    }

    public function noLeidos(Request $request): JsonResponse
    {
        $count = Mensaje::where('destinatario_id', $request->user()->id)
            ->where('leido', false)
            ->count();

        return response()->json(['noLeidos' => $count]);
    }

    public function poll(Request $request, User $contacto): JsonResponse
    {
        $user = $request->user();
        abort_unless($user, 401);

        $authorized = Mensaje::query()
            ->where(function ($q) use ($user, $contacto) {
                $q->where('remitente_id', $user->id)->where('destinatario_id', $contacto->id);
            })
            ->orWhere(function ($q) use ($user, $contacto) {
                $q->where('remitente_id', $contacto->id)->where('destinatario_id', $user->id);
            })
            ->exists();

        if (!$authorized) {
            $authorized = $this->messageCenterService->allowedContactsFor($user)->contains('id', $contacto->id);
        }

        abort_unless($authorized, 403);

        $desde    = (int) $request->query('desde', 0);
        $mensajes = Mensaje::conversacion($user->id, $contacto->id)
            ->where('id', '>', $desde)
            ->orderBy('id')
            ->get()
            ->map(fn (Mensaje $m) => $this->messageCenterService->transformMessage($m, $user->id))
            ->values();

        Mensaje::where('remitente_id', $contacto->id)
            ->where('destinatario_id', $user->id)
            ->where('leido', false)
            ->update(['leido' => true, 'leido_at' => now()]);

        $noLeidos = Mensaje::where('destinatario_id', $user->id)
            ->where('leido', false)
            ->selectRaw('remitente_id as contacto_id, COUNT(*) as total')
            ->groupBy('remitente_id')
            ->pluck('total', 'contacto_id');

        return response()->json([
            'mensajes' => $mensajes,
            'noLeidos' => $noLeidos,
        ]);
    }

    public function markRead(Request $request, User $contacto): JsonResponse
    {
        $user = $request->user();

        abort_unless($user, 401);

        $updated = $this->messageCenterService->markConversationAsRead($user, $contacto->id);

        return response()->json(['updated' => $updated]);
    }

    private function resolveView(User $user): string
    {
        if ($user->hasRole('admin') || $user->hasRole('coordinador')) {
            return 'Admin/Mensajes';
        }

        if ($user->hasRole('profesor')) {
            return 'Profesor/Mensajes';
        }

        if ($user->hasRole('padre')) {
            return 'Padre/Mensajes';
        }

        if ($user->hasRole('estudiante')) {
            return 'Estudiante/Mensajes';
        }

        abort(403);
    }
}
