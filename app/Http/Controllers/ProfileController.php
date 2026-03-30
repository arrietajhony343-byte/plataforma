<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();
        $user->loadMissing('padres:id,name,telefono');
        if ($user->hasRole('padre')) {
            $user->loadMissing('hijos:id,name,dificultad_aprendizaje,dificultad_aprendizaje_desc,diagnostico_salud,diagnostico_salud_desc,alergias,alergias_desc,nombre_madre,telefono_madre,ocupacion_madre,nombre_padre,telefono_padre,ocupacion_padre,convive_con,numero_hermanos,lugar_que_ocupa_familia');
        }

        $rolLabel = match ($user->getRoleNames()->first()) {
            'admin'      => 'Administrador',
            'profesor'   => 'Docente',
            'padre'      => 'Padre de Familia',
            'estudiante' => 'Estudiante',
            default      => 'Usuario',
        };

        $acudiente = $user->hasRole('estudiante') ? $user->padres->first() : null;
        $canEditProfile = !$user->hasRole('estudiante');

        $hijosProfile = $user->hasRole('padre')
            ? $user->hijos->map(fn (User $hijo) => [
                'id' => $hijo->id,
                'nombre' => $hijo->name,
                'dificultad_aprendizaje' => (bool) $hijo->dificultad_aprendizaje,
                'dificultad_aprendizaje_desc' => $hijo->dificultad_aprendizaje_desc,
                'diagnostico_salud' => (bool) $hijo->diagnostico_salud,
                'diagnostico_salud_desc' => $hijo->diagnostico_salud_desc,
                'alergias' => (bool) $hijo->alergias,
                'alergias_desc' => $hijo->alergias_desc,
                'nombre_madre' => $hijo->nombre_madre,
                'telefono_madre' => $hijo->telefono_madre,
                'ocupacion_madre' => $hijo->ocupacion_madre,
                'nombre_padre' => $hijo->nombre_padre,
                'telefono_padre' => $hijo->telefono_padre,
                'ocupacion_padre' => $hijo->ocupacion_padre,
                'convive_con' => $hijo->convive_con,
                'numero_hermanos' => $hijo->numero_hermanos,
                'lugar_que_ocupa_familia' => $hijo->lugar_que_ocupa_familia,
            ])->values()
            : [];

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status'          => session('status'),
            'canEditProfile'  => $canEditProfile,
            'userData'        => [
                'id'          => $user->id,
                'nombre'      => $user->name,
                'email'       => $user->email,
                'rol'         => $user->getRoleNames()->first() ?? '',
                'rolLabel'    => $rolLabel,
                'iniciales'   => collect(explode(' ', $user->name))->filter()->take(2)->map(fn ($p) => strtoupper(substr($p, 0, 1)))->implode(''),
                'miembroDesde'=> $user->created_at->translatedFormat('F Y'),
                'verificado'  => $user->email_verified_at !== null,
                'foto'        => $this->resolveFotoUrl($user->foto),
                'tipo_documento' => $user->tipo_documento,
                'documento'   => $user->documento,
                'telefono'    => $user->telefono,
                'direccion'   => $user->direccion,
                'fecha_nacimiento' => $user->fecha_nacimiento?->format('Y-m-d'),
                'lugar_nacimiento' => $user->lugar_nacimiento,
                'genero'      => $user->genero,
                'grupo_sanguineo' => $user->grupo_sanguineo,
                'eps'         => $user->eps,
                'acudiente_nombre' => $acudiente?->name,
                'acudiente_telefono' => $acudiente?->telefono,
            ],
            'hijosProfile' => $hijosProfile,
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();

        if ($user->hasRole('estudiante')) {
            return Redirect::route('profile.edit')->with('error', 'Los estudiantes no pueden editar su perfil. Este cambio debe hacerlo el acudiente.');
        }

        $data = $request->validated();

        if ($request->hasFile('foto')) {
            if ($user->foto && !str_starts_with($user->foto, '/storage/') && !str_starts_with($user->foto, 'http://') && !str_starts_with($user->foto, 'https://')) {
                Storage::disk('public')->delete($user->foto);
            }

            $data['foto'] = $request->file('foto')->store('perfiles/usuarios', 'public');
        }

        $user->fill($data);

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return Redirect::route('profile.edit');
    }

    public function updateHijo(Request $request, User $hijo): RedirectResponse
    {
        $padre = $request->user();

        if (!$padre->hasRole('padre')) {
            abort(403);
        }

        $esHijo = $padre->hijos()->where('users.id', $hijo->id)->exists();
        abort_unless($esHijo, 403);

        $data = $request->validate([
            'dificultad_aprendizaje' => ['nullable', 'boolean'],
            'dificultad_aprendizaje_desc' => ['nullable', 'string', 'max:1000'],
            'diagnostico_salud' => ['nullable', 'boolean'],
            'diagnostico_salud_desc' => ['nullable', 'string', 'max:1000'],
            'alergias' => ['nullable', 'boolean'],
            'alergias_desc' => ['nullable', 'string', 'max:1000'],
            'nombre_madre' => ['nullable', 'string', 'max:255'],
            'telefono_madre' => ['nullable', 'regex:/^[0-9]{7,10}$/'],
            'ocupacion_madre' => ['nullable', 'string', 'max:255'],
            'nombre_padre' => ['nullable', 'string', 'max:255'],
            'telefono_padre' => ['nullable', 'regex:/^[0-9]{7,10}$/'],
            'ocupacion_padre' => ['nullable', 'string', 'max:255'],
            'convive_con' => ['nullable', 'string', 'max:255'],
            'numero_hermanos' => ['nullable', 'integer', 'min:0', 'max:20'],
            'lugar_que_ocupa_familia' => ['nullable', 'string', 'max:255'],
        ]);

        $boolFields = ['dificultad_aprendizaje', 'diagnostico_salud', 'alergias'];
        foreach ($boolFields as $field) {
            $data[$field] = (bool) ($data[$field] ?? false);
        }

        $descByBool = [
            'dificultad_aprendizaje' => 'dificultad_aprendizaje_desc',
            'diagnostico_salud' => 'diagnostico_salud_desc',
            'alergias' => 'alergias_desc',
        ];

        foreach ($descByBool as $flagField => $descField) {
            if (!$data[$flagField]) {
                $data[$descField] = null;
            }
        }

        $hijo->fill($data);
        $hijo->save();

        return Redirect::route('profile.edit')->with('success', 'Información del estudiante actualizada.');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    private function resolveFotoUrl(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        if (str_starts_with($value, '/storage/') || str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        return Storage::url($value);
    }
}
