<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ForcePasswordChangeController extends Controller
{
    /**
     * Mostrar formulario de cambio obligatorio de contraseña.
     */
    public function show(): Response
    {
        return Inertia::render('Auth/ForceChangePassword');
    }

    /**
     * Procesar el cambio de contraseña.
     */
    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'password'              => ['required', 'confirmed', Password::min(8)],
            'password_confirmation' => 'required',
        ]);

        $user = Auth::user();
        $user->update([
            'password'             => Hash::make($data['password']),
            'must_change_password' => false,
        ]);

        // Redirigir según rol
        if ($user->hasRole('admin')) {
            return redirect('/admin/dashboard')->with('success', 'Contraseña actualizada exitosamente.');
        } elseif ($user->hasRole('profesor')) {
            return redirect('/profesor/dashboard')->with('success', 'Contraseña actualizada exitosamente.');
        } elseif ($user->hasRole('estudiante')) {
            return redirect('/estudiante/dashboard')->with('success', 'Contraseña actualizada exitosamente.');
        } elseif ($user->hasRole('padre')) {
            return redirect('/padre/dashboard')->with('success', 'Contraseña actualizada exitosamente.');
        }

        return redirect('/dashboard')->with('success', 'Contraseña actualizada exitosamente.');
    }
}
