<?php

namespace App\Services;

use App\Models\{Curso, CursoMateria, Matricula, Mensaje, Notificacion, User};
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MessageCenterService
{
    public function buildPageData(User $user): array
    {
        $contactosPermitidos = $this->allowedContactsFor($user);
        $contactIds = $contactosPermitidos->pluck('id');

        $mensajes = Mensaje::query()
            ->where(function ($q) use ($user, $contactIds) {
                $q->where('remitente_id', $user->id)
                    ->whereIn('destinatario_id', $contactIds);
            })
            ->orWhere(function ($q) use ($user, $contactIds) {
                $q->where('destinatario_id', $user->id)
                    ->whereIn('remitente_id', $contactIds);
            })
            ->orderBy('created_at')
            ->get();

        $mensajesPorContacto = $mensajes->groupBy(function (Mensaje $mensaje) use ($user) {
            return $mensaje->remitente_id === $user->id
                ? $mensaje->destinatario_id
                : $mensaje->remitente_id;
        });

        $contactos = $contactosPermitidos
            ->map(function (User $contacto) use ($user, $mensajesPorContacto) {
                $conversacion = $mensajesPorContacto->get($contacto->id, collect());
                $ultimoMensaje = $conversacion->last();
                $noLeidos = $conversacion
                    ->where('remitente_id', $contacto->id)
                    ->where('destinatario_id', $user->id)
                    ->where('leido', false)
                    ->count();

                return [
                    'id' => $contacto->id,
                    'nombre' => $contacto->name,
                    'rol' => $this->roleLabel($contacto),
                    'avatar' => $this->avatarFor($contacto->name),
                    'subtitle' => $this->contactSubtitle($contacto),
                    'ultimoMensaje' => $ultimoMensaje?->contenido ?: ($ultimoMensaje?->archivo_url ? '📎 Archivo adjunto' : null),
                    'ultimoMensajeFecha' => $ultimoMensaje?->created_at?->diffForHumans(),
                    'ultimoMensajeAt' => $ultimoMensaje?->created_at?->timestamp ?? 0,
                    'noLeidos' => $noLeidos,
                    'online' => false,
                    'mensajes' => $conversacion
                        ->map(fn (Mensaje $mensaje) => $this->transformMessage($mensaje, $user->id))
                        ->values()
                        ->all(),
                ];
            })
            ->sortByDesc(fn (array $contacto) => sprintf(
                '%05d-%012d-%s',
                $contacto['noLeidos'],
                $contacto['ultimoMensajeAt'],
                Str::lower($contacto['nombre'])
            ))
            ->values()
            ->map(function (array $contacto) {
                unset($contacto['ultimoMensajeAt']);
                return $contacto;
            })
            ->all();

        $disponibles = $contactosPermitidos
            ->map(fn (User $contacto) => [
                'id' => $contacto->id,
                'nombre' => $contacto->name,
                'rol' => $this->roleLabel($contacto),
                'avatar' => $this->avatarFor($contacto->name),
                'subtitle' => $this->contactSubtitle($contacto),
            ])
            ->sortBy('nombre')
            ->values()
            ->all();

        return [
            'currentUser' => [
                'id' => $user->id,
                'nombre' => $user->name,
                'rol' => $this->roleLabel($user),
            ],
            'contactos' => $contactos,
            'disponibles' => $disponibles,
        ];
    }

    public function send(User $remitente, int $destinatarioId, string $contenido, ?string $asunto = null, ?array $archivoData = null): array
    {
        $destinatario = $this->validateAllowedRecipient($remitente, $destinatarioId);

        $mensaje = DB::transaction(function () use ($remitente, $destinatario, $contenido, $asunto, $archivoData) {
            $mensaje = Mensaje::create([
                'remitente_id'   => $remitente->id,
                'destinatario_id' => $destinatario->id,
                'asunto'         => $asunto,
                'contenido'      => $contenido,
                'leido'          => false,
                'archivo_url'    => $archivoData['url']    ?? null,
                'archivo_nombre' => $archivoData['nombre'] ?? null,
                'archivo_tipo'   => $archivoData['tipo']   ?? null,
                'archivo_tamano' => $archivoData['tamano'] ?? null,
            ]);

            Notificacion::create([
                'user_id' => $destinatario->id,
                'tipo'    => 'mensaje',
                'titulo'  => $asunto ?: 'Nuevo mensaje',
                'mensaje' => $contenido ? Str::limit($contenido, 180) : ($archivoData ? '📎 Archivo adjunto' : ''),
                'leida'   => false,
            ]);

            return $mensaje;
        });

        return [
            'mensaje' => $this->transformMessage($mensaje, $remitente->id),
            'contacto' => [
                'id' => $destinatario->id,
                'nombre' => $destinatario->name,
                'rol' => $this->roleLabel($destinatario),
                'avatar' => $this->avatarFor($destinatario->name),
                'subtitle' => $this->contactSubtitle($destinatario),
            ],
        ];
    }

    public function markConversationAsRead(User $user, int $contactId): int
    {
        $this->validateAllowedRecipient($user, $contactId);

        return Mensaje::query()
            ->where('remitente_id', $contactId)
            ->where('destinatario_id', $user->id)
            ->where('leido', false)
            ->update([
                'leido' => true,
                'leido_at' => now(),
            ]);
    }

    public function allowedContactsFor(User $user): Collection
    {
        $query = User::query()
            ->with([
                'roles:id,name',
                'cursoMaterias.materia:id,nombre',
                'cursosDirector:id,nombre,director_grupo_id',
                'hijos:id,name',
                'matriculas' => fn ($q) => $q->activa()->with('curso:id,nombre')->latest('id'),
            ])
            ->activo()
            ->where('id', '!=', $user->id);

        if ($user->hasRole('admin')) {
            return $query->orderBy('name')->get();
        }

        if ($user->hasRole('coordinador')) {
            $sedeId = $user->sede_id;

            $cursoIds = \App\Models\Curso::where('activo', true)
                ->when($sedeId, fn ($q) => $q->where('sede_id', $sedeId))
                ->pluck('id');

            $estudianteIds = Matricula::query()
                ->activa()
                ->whereIn('curso_id', $cursoIds)
                ->pluck('estudiante_id');

            $padreIds = DB::table('padre_estudiante')
                ->whereIn('estudiante_id', $estudianteIds)
                ->pluck('padre_id');

            $profesorIds = CursoMateria::query()
                ->whereIn('curso_id', $cursoIds)
                ->whereNotNull('profesor_id')
                ->pluck('profesor_id');

            return $query
                ->where(function ($q) use ($estudianteIds, $padreIds, $profesorIds) {
                    $q->whereIn('id', $estudianteIds)
                        ->orWhereIn('id', $padreIds)
                        ->orWhereIn('id', $profesorIds)
                        ->orWhereHas('roles', fn ($roleQ) => $roleQ->whereIn('name', ['admin', 'coordinador']));
                })
                ->orderBy('name')
                ->get();
        }

        if ($user->hasRole('profesor')) {
            $cursoIds = CursoMateria::query()
                ->where('profesor_id', $user->id)
                ->whereHas('curso', fn ($q) => $q->where('activo', true))
                ->pluck('curso_id');

            $estudianteIds = Matricula::query()
                ->activa()
                ->whereIn('curso_id', $cursoIds)
                ->pluck('estudiante_id');

            $padreIds = DB::table('padre_estudiante')
                ->whereIn('estudiante_id', $estudianteIds)
                ->pluck('padre_id');

            return $query
                ->where(function ($q) use ($estudianteIds, $padreIds) {
                    $q->whereIn('id', $estudianteIds)
                        ->orWhereIn('id', $padreIds)
                        ->orWhereHas('roles', fn ($roleQ) => $roleQ->where('name', 'admin'));
                })
                ->orderBy('name')
                ->get();
        }

        if ($user->hasRole('padre')) {
            $hijoIds = DB::table('padre_estudiante')
                ->where('padre_id', $user->id)
                ->pluck('estudiante_id');

            $cursoIds = Matricula::query()
                ->activa()
                ->whereIn('estudiante_id', $hijoIds)
                ->pluck('curso_id');

            $profesorIds = CursoMateria::query()
                ->whereIn('curso_id', $cursoIds)
                ->whereNotNull('profesor_id')
                ->pluck('profesor_id');

            $directorIds = Curso::query()
                ->whereIn('id', $cursoIds)
                ->whereNotNull('director_grupo_id')
                ->pluck('director_grupo_id');

            $docenteYDirectoresIds = $profesorIds
                ->merge($directorIds)
                ->filter()
                ->unique()
                ->values();

            return $query
                ->where(function ($q) use ($docenteYDirectoresIds) {
                    $q->whereIn('id', $docenteYDirectoresIds)
                        ->orWhereHas('roles', fn ($roleQ) => $roleQ->where('name', 'admin'));
                })
                ->orderBy('name')
                ->get();
        }

        if ($user->hasRole('estudiante')) {
            $cursoIds = Matricula::query()
                ->activa()
                ->where('estudiante_id', $user->id)
                ->pluck('curso_id');

            $profesorIds = CursoMateria::query()
                ->whereIn('curso_id', $cursoIds)
                ->whereNotNull('profesor_id')
                ->pluck('profesor_id');

            $padreIds = DB::table('padre_estudiante')
                ->where('estudiante_id', $user->id)
                ->pluck('padre_id');

            return $query
                ->where(function ($q) use ($profesorIds, $padreIds) {
                    $q->whereIn('id', $profesorIds)
                        ->orWhereIn('id', $padreIds)
                        ->orWhereHas('roles', fn ($roleQ) => $roleQ->where('name', 'admin'));
                })
                ->orderBy('name')
                ->get();
        }

        return collect();
    }

    private function validateAllowedRecipient(User $user, int $recipientId): User
    {
        $destinatario = $this->allowedContactsFor($user)->firstWhere('id', $recipientId);

        if (!$destinatario) {
            throw ValidationException::withMessages([
                'destinatario_id' => 'No puedes enviar mensajes a este usuario.',
            ]);
        }

        return $destinatario;
    }

    public function transformMessage(Mensaje $mensaje, int $userId): array
    {
        return [
            'id'     => $mensaje->id,
            'texto'  => $mensaje->contenido,
            'asunto' => $mensaje->asunto,
            'fecha'  => $mensaje->created_at->format('Y-m-d'),
            'hora'   => $mensaje->created_at->format('g:i A'),
            'propio' => $mensaje->remitente_id === $userId,
            'leido'  => (bool) $mensaje->leido,
            'archivo' => $mensaje->archivo_url ? [
                'url'    => $mensaje->archivo_url,
                'nombre' => $mensaje->archivo_nombre,
                'tipo'   => $mensaje->archivo_tipo,
                'tamano' => $mensaje->archivo_tamano,
            ] : null,
        ];
    }

    private function roleLabel(User $user): string
    {
        if ($user->hasRole('admin')) {
            return 'Administración';
        }
        if ($user->hasRole('coordinador')) {
            return 'Coordinador';
        }
        if ($user->hasRole('profesor')) {
            return 'Docente';
        }
        if ($user->hasRole('padre')) {
            return 'Padre de familia';
        }
        if ($user->hasRole('estudiante')) {
            return 'Estudiante';
        }

        return 'Usuario';
    }

    private function avatarFor(string $name): string
    {
        return collect(explode(' ', $name))
            ->filter()
            ->take(2)
            ->map(fn ($part) => Str::upper(Str::substr($part, 0, 1)))
            ->implode('');
    }

    private function contactSubtitle(User $contact): string
    {
        if ($contact->cursosDirector->isNotEmpty()) {
            $cursos = $contact->cursosDirector
                ->pluck('nombre')
                ->filter()
                ->unique()
                ->values();

            if ($cursos->isNotEmpty()) {
                return 'Director de grupo · ' . $cursos->take(2)->implode(' · ');
            }

            return 'Director de grupo';
        }

        if ($contact->hasRole('profesor')) {
            $materias = $contact->cursoMaterias
                ->pluck('materia.nombre')
                ->filter()
                ->unique()
                ->values();

            if ($materias->isNotEmpty()) {
                return $materias->take(2)->implode(' · ');
            }

            return 'Docente activo';
        }

        if ($contact->hasRole('padre')) {
            $hijos = $contact->hijos
                ->pluck('name')
                ->filter()
                ->map(fn ($name) => trim((string) $name))
                ->sort()
                ->values();

            if ($hijos->isNotEmpty()) {
                $primerNombre = Str::before($hijos->first(), ' ');

                if ($hijos->count() === 1) {
                    return 'Acudiente de ' . $primerNombre;
                }

                $segundoNombre = Str::before($hijos->get(1), ' ');
                $restantes = $hijos->count() - 2;

                if ($hijos->count() === 2) {
                    return 'Acudiente de ' . $primerNombre . ' y ' . $segundoNombre;
                }

                return 'Acudiente de ' . $primerNombre . ', ' . $segundoNombre . ' y ' . $restantes . ' más';
            }

            return 'Padre de familia';
        }

        if ($contact->hasRole('estudiante')) {
            $curso = $contact->matriculas->first()?->curso?->nombre;
            return $curso ?: 'Estudiante activo';
        }

        if ($contact->hasRole('admin') || $contact->hasRole('coordinador')) {
            return 'Canal institucional';
        }

        return 'Contacto disponible';
    }
}
