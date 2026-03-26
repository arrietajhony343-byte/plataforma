<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
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

        $rolLabel = match ($user->getRoleNames()->first()) {
            'admin'      => 'Administrador',
            'profesor'   => 'Docente',
            'padre'      => 'Padre de Familia',
            'estudiante' => 'Estudiante',
            default      => 'Usuario',
        };

        $acudiente = $user->hasRole('estudiante') ? $user->padres->first() : null;

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status'          => session('status'),
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
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
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
