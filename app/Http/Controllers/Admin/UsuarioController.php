<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Curso;
use App\Models\Matricula;
use App\Models\Periodo;
use App\Models\Sede;
use App\Models\User;
use App\Models\UserActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UsuarioController extends Controller
{
    private function emptyToNull(mixed $value): mixed
    {
        return $value === '' ? null : $value;
    }

    private function normalizeTipoDocumento(mixed $value): string
    {
        $raw = Str::upper(trim((string) ($value ?? '')));
        $compact = preg_replace('/\s+/', '', str_replace('.', '', $raw)) ?? $raw;

        if (Str::startsWith($compact, 'PPT')) {
            return 'PP';
        }
        if (Str::startsWith($compact, 'PERUCE')) {
            return 'CE';
        }
        if (Str::startsWith($compact, 'TI')) {
            return 'TI';
        }
        if (Str::startsWith($compact, 'RC')) {
            return 'RC';
        }
        if (Str::startsWith($compact, 'CC')) {
            return 'CC';
        }
        if (Str::startsWith($compact, 'CE')) {
            return 'CE';
        }
        if (Str::startsWith($compact, 'PP')) {
            return 'PP';
        }

        return 'CC';
    }

    public function index(): Response
    {
        $users = User::with(['roles', 'sede'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (User $u) {
                $role = $u->roles->first()?->name ?? 'sin_rol';

                // Matrícula activa (solo para estudiantes)
                $matricula   = null;
                $acudienteId = null;
                $acudienteNombre = null;

                if ($role === 'estudiante') {
                    $matricula = Matricula::where('estudiante_id', $u->id)
                        ->with('curso')
                        ->latest()
                        ->first();

                    $pivot = DB::table('padre_estudiante')
                        ->where('estudiante_id', $u->id)
                        ->join('users', 'users.id', '=', 'padre_estudiante.padre_id')
                        ->select('users.id', 'users.name')
                        ->first();

                    $acudienteId     = $pivot?->id;
                    $acudienteNombre = $pivot?->name;
                }

                return [
                    'id'               => $u->id,
                    'name'             => $u->name,
                    'email'            => $u->email,
                    'role'             => $role,
                    'status'           => $this->resolveStatus($u),
                    'created_at'       => $u->created_at?->format('Y-m-d'),
                    'last_login'       => $u->last_login_at?->format('Y-m-d H:i'),
                    'login_attempts'   => $u->login_attempts ?? 0,
                    'phone'            => $u->telefono,
                    'documento'        => $u->documento,
                    'tipo_documento'   => $u->tipo_documento ?? 'CC',
                    'direccion'        => $u->direccion,
                    'fecha_nacimiento' => $u->fecha_nacimiento?->format('Y-m-d'),
                    'genero'           => $u->genero,
                    'must_change_password' => (bool) $u->must_change_password,
                    // Datos académicos (estudiantes)
                    'curso_id'         => $matricula?->curso_id,
                    'nivel_educativo'  => $matricula?->curso?->nivel,
                    'acudiente_id'     => $acudienteId,
                    'acudiente_name'   => $acudienteNombre,
                    'sede_id'          => $u->sede_id,
                    'sede_nombre'      => $u->sede?->nombre ?? null,
                ];
            });

        // Logs de actividad (últimos 200)
        $actionLogs = UserActivityLog::with('user')
            ->orderByDesc('created_at')
            ->limit(200)
            ->get()
            ->map(fn ($log) => [
                'id'           => $log->id,
                'user_id'      => $log->user_id,
                'user_name'    => $log->user?->name ?? 'Usuario eliminado',
                'action'       => $log->action,
                'reason'       => $log->reason,
                'performed_by' => $log->performed_by_name,
                'timestamp'    => $log->created_at->format('Y-m-d H:i'),
                'details'      => $log->details,
            ]);

        // Cursos disponibles para el formulario
        $cursos = Curso::select('id', 'nombre', 'nivel', 'grado', 'grupo')
            ->orderBy('nivel')
            ->orderBy('grado')
            ->get()
            ->map(fn ($c) => [
                'id'     => $c->id,
                'nombre' => $c->nombre,
                'nivel'  => $c->nivel,
                'grado'  => $c->grado,
                'grupo'  => $c->grupo,
            ]);

        // Padres disponibles para asignar como acudientes
        $padres = User::role('padre')
            ->select('id', 'name', 'documento', 'tipo_documento')
            ->orderBy('name')
            ->get()
            ->map(fn ($p) => [
                'id'        => $p->id,
                'name'      => $p->name,
                'documento' => $p->documento,
            ]);

        $sedes = Sede::activa()->orderBy('nombre')->get()
            ->map(fn ($s) => ['id' => $s->id, 'nombre' => $s->nombre, 'ciudad' => $s->ciudad ?? '']);

        return Inertia::render('Admin/Usuarios', [
            'users'      => $users,
            'actionLogs' => $actionLogs,
            'cursos'     => $cursos,
            'padres'     => $padres,
            'sedes'      => $sedes,
        ]);
    }

    public function store(Request $request)
    {
        $request->merge([
            'phone'            => $this->emptyToNull($request->input('phone')),
            'documento'        => $this->emptyToNull($request->input('documento')),
            'tipo_documento'   => $this->normalizeTipoDocumento($request->input('tipo_documento')),
            'direccion'        => $this->emptyToNull($request->input('direccion')),
            'fecha_nacimiento' => $this->emptyToNull($request->input('fecha_nacimiento')),
            'genero'           => $this->emptyToNull($request->input('genero')),
            'curso_id'         => $this->emptyToNull($request->input('curso_id')),
            'acudiente_id'     => $this->emptyToNull($request->input('acudiente_id')),
            'sede_id'          => $this->emptyToNull($request->input('sede_id')),
        ]);

        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'email'            => 'required|email|unique:users,email',
            'phone'            => ['nullable', 'string', 'regex:/^[0-9]{7,10}$/'],
            'role'             => 'required|in:admin,coordinador,profesor,estudiante,padre',
            'password'         => 'required|string|min:8',
            'documento'        => ['nullable', 'string', 'regex:/^[0-9]{5,15}$/', 'unique:users,documento'],
            'tipo_documento'   => 'required|in:CC,TI,CE,RC,PP',
            'direccion'        => 'nullable|string|max:255',
            'fecha_nacimiento' => 'nullable|date|before:today',
            'genero'           => 'nullable|in:M,F,otro',
            // Campos académicos (solo estudiantes)
            'curso_id'         => 'nullable|exists:cursos,id',
            'acudiente_id'     => 'nullable|exists:users,id',
            'sede_id'          => 'nullable|exists:sedes,id',
        ], [
            'documento.regex'   => 'El documento solo debe contener números (5–15 dígitos), sin puntos ni espacios.',
            'documento.unique'  => 'Este número de documento ya está registrado.',
            'phone.regex'       => 'El teléfono solo debe contener números (7–10 dígitos).',
            'fecha_nacimiento.before' => 'La fecha de nacimiento debe ser anterior a hoy.',
        ]);

        $user = User::create([
            'name'                 => $data['name'],
            'email'                => $data['email'],
            'telefono'             => $data['phone'] ?? null,
            'documento'            => $data['documento'] ?? null,
            'tipo_documento'       => $data['tipo_documento'],
            'direccion'            => $data['direccion'] ?? null,
            'fecha_nacimiento'     => $data['fecha_nacimiento'] ?? null,
            'genero'               => $data['genero'] ?? null,
            'password'             => Hash::make($data['password']),
            'activo'               => true,
            'must_change_password' => true,
            'sede_id'              => $data['sede_id'] ?? null,
        ]);

        $user->email_verified_at = now();
        $user->save();

        $user->assignRole($data['role']);

        // Asignaciones académicas para estudiantes
        if ($data['role'] === 'estudiante') {
            if (!empty($data['curso_id'])) {
                $periodo = Periodo::orderBy('id')->first();
                Matricula::create([
                    'estudiante_id'   => $user->id,
                    'curso_id'        => $data['curso_id'],
                    'periodo_id'      => $periodo?->id,
                    'estado'          => 'activa',
                    'fecha_matricula' => now(),
                ]);
            }

            if (!empty($data['acudiente_id'])) {
                DB::table('padre_estudiante')->insert([
                    'padre_id'     => $data['acudiente_id'],
                    'estudiante_id' => $user->id,
                    'parentesco'   => 'acudiente',
                    'created_at'   => now(),
                    'updated_at'   => now(),
                ]);
            }
        }

        $this->logActivity($user->id, 'crear', "Usuario creado con rol {$data['role']}");

        return redirect()->back()->with('success', 'Usuario creado exitosamente.');
    }

    public function update(Request $request, User $user)
    {
        $request->merge([
            'phone'            => $this->emptyToNull($request->input('phone')),
            'documento'        => $this->emptyToNull($request->input('documento')),
            'tipo_documento'   => $this->normalizeTipoDocumento($request->input('tipo_documento')),
            'direccion'        => $this->emptyToNull($request->input('direccion')),
            'fecha_nacimiento' => $this->emptyToNull($request->input('fecha_nacimiento')),
            'genero'           => $this->emptyToNull($request->input('genero')),
            'curso_id'         => $this->emptyToNull($request->input('curso_id')),
            'acudiente_id'     => $this->emptyToNull($request->input('acudiente_id')),
            'sede_id'          => $this->emptyToNull($request->input('sede_id')),
        ]);

        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'email'            => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'phone'            => ['nullable', 'string', 'regex:/^[0-9]{7,10}$/'],
            'role'             => 'required|in:admin,coordinador,profesor,estudiante,padre',
            'status'           => 'nullable|in:activo,bloqueado,pendiente',
            'documento'        => ['nullable', 'string', 'regex:/^[0-9]{5,15}$/', Rule::unique('users')->ignore($user->id)],
            'tipo_documento'   => 'required|in:CC,TI,CE,RC,PP',
            'direccion'        => 'nullable|string|max:255',
            'fecha_nacimiento' => 'nullable|date|before:today',
            'genero'           => 'nullable|in:M,F,otro',
            'password'         => 'nullable|string|min:8',
            // Campos académicos
            'curso_id'         => 'nullable|exists:cursos,id',
            'acudiente_id'     => 'nullable|integer',
            'sede_id'          => 'nullable|exists:sedes,id',
        ], [
            'documento.regex'  => 'El documento solo debe contener números (5–15 dígitos), sin puntos ni espacios.',
            'documento.unique' => 'Este número de documento ya está registrado.',
            'phone.regex'      => 'El teléfono solo debe contener números (7–10 dígitos).',
        ]);

        $updateData = [
            'name'             => $data['name'],
            'email'            => $data['email'],
            'telefono'         => $data['phone'] ?? $user->telefono,
            'documento'        => $data['documento'] ?? $user->documento,
            'tipo_documento'   => $data['tipo_documento'],
            'direccion'        => $data['direccion'] ?? $user->direccion,
            'fecha_nacimiento' => $data['fecha_nacimiento'] ?? $user->fecha_nacimiento,
            'genero'           => $data['genero'] ?? $user->genero,
            'activo'           => ($data['status'] ?? 'activo') !== 'bloqueado',
            'sede_id'          => array_key_exists('sede_id', $data) ? $data['sede_id'] : $user->sede_id,
        ];

        if (!empty($data['password'])) {
            $updateData['password']             = Hash::make($data['password']);
            $updateData['must_change_password'] = true;
        }

        $user->update($updateData);
        $user->syncRoles([$data['role']]);

        // Actualizar asignaciones académicas
        if ($data['role'] === 'estudiante') {
            // Actualizar/crear matrícula
            if (array_key_exists('curso_id', $data)) {
                $matricula = Matricula::where('estudiante_id', $user->id)->latest()->first();

                if ($data['curso_id']) {
                    if ($matricula) {
                        $matricula->update(['curso_id' => $data['curso_id']]);
                    } else {
                        $periodo = Periodo::orderBy('id')->first();
                        Matricula::create([
                            'estudiante_id'   => $user->id,
                            'curso_id'        => $data['curso_id'],
                            'periodo_id'      => $periodo?->id,
                            'estado'          => 'activa',
                            'fecha_matricula' => now(),
                        ]);
                    }
                } elseif ($matricula) {
                    $matricula->delete();
                }
            }

            // Actualizar acudiente
            if (array_key_exists('acudiente_id', $data)) {
                DB::table('padre_estudiante')->where('estudiante_id', $user->id)->delete();
                if ($data['acudiente_id']) {
                    DB::table('padre_estudiante')->insert([
                        'padre_id'      => $data['acudiente_id'],
                        'estudiante_id' => $user->id,
                        'parentesco'    => 'acudiente',
                        'created_at'    => now(),
                        'updated_at'    => now(),
                    ]);
                }
            }
        }

        $this->logActivity($user->id, 'editar', 'Información del usuario actualizada');

        return redirect()->back()->with('success', 'Usuario actualizado.');
    }

    public function toggleStatus(Request $request, User $user)
    {
        $currentStatus = $this->resolveStatus($user);
        $reason = $request->input('reason', null);

        if ($currentStatus === 'pendiente') {
            $user->email_verified_at = now();
            $user->login_attempts    = 0;
            $user->save();
            $this->logActivity($user->id, 'activar', 'Cuenta activada por administrador');
            return redirect()->back()->with('success', 'Usuario activado exitosamente.');
        }

        if ($currentStatus === 'bloqueado') {
            $user->activo            = true;
            $user->login_attempts    = 0;
            $user->email_verified_at = $user->email_verified_at ?? now();
            $user->save();
            $this->logActivity($user->id, 'activar', $reason);
            return redirect()->back()->with('success', 'Usuario activado.');
        }

        // Activo → Bloqueado
        $user->update(['activo' => false]);
        $this->logActivity($user->id, 'bloquear', $reason);
        return redirect()->back()->with('success', 'Usuario bloqueado.');
    }

    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return redirect()->back()->withErrors(['error' => 'No puedes eliminarte a ti mismo.']);
        }

        $userName = $user->name;
        $this->logActivity($user->id, 'eliminar', "Usuario '{$userName}' eliminado del sistema");

        $user->delete();

        return redirect()->back()->with('success', 'Usuario eliminado.');
    }

    public function resetPassword(Request $request, User $user)
    {
        $data = $request->validate([
            'password' => 'required|string|min:8',
        ]);

        $user->update([
            'password'             => Hash::make($data['password']),
            'must_change_password' => true,
            'login_attempts'       => 0,
        ]);

        $this->logActivity($user->id, 'editar', 'Contraseña reseteada por administrador');

        return redirect()->back()->with('success', 'Contraseña reseteada. El usuario deberá cambiarla en su próximo ingreso.');
    }

    /* ─── Helpers ─── */

    private function resolveStatus(User $u): string
    {
        if (!$u->activo) return 'bloqueado';
        if ($u->email_verified_at === null) return 'pendiente';
        return 'activo';
    }

    private function logActivity(int $userId, string $action, ?string $reason = null): void
    {
        UserActivityLog::create([
            'user_id'           => $userId,
            'action'            => $action,
            'performed_by_name' => auth()->user()->name,
            'performed_by_id'   => auth()->id(),
            'reason'            => $reason,
        ]);
    }
}

