<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Registrar último acceso y resetear intentos fallidos
        $user = Auth::user();
        $user->update([
            'last_login_at'  => now(),
            'login_attempts' => 0,
        ]);

        // Si debe cambiar contraseña, redirigir a cambio obligatorio
        if ($user->must_change_password) {
            return redirect()->route('password.force-change');
        }

        // Determinar URL de redirección según el rol
        if ($user->hasRole('admin')) {
            return redirect()->intended('/admin/dashboard');
        } elseif ($user->hasRole('profesor')) {
            return redirect()->intended('/profesor/dashboard');
        } elseif ($user->hasRole('estudiante')) {
            return redirect()->intended('/estudiante/dashboard');
        } elseif ($user->hasRole('padre')) {
            return redirect()->intended('/padre/dashboard');
        }

        return redirect()->intended('/dashboard');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
