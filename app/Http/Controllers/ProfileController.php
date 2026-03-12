<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
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

        $rolLabel = match ($user->getRoleNames()->first()) {
            'admin'      => 'Administrador',
            'profesor'   => 'Docente',
            'padre'      => 'Padre de Familia',
            'estudiante' => 'Estudiante',
            default      => 'Usuario',
        };

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
            ],
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

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
}
