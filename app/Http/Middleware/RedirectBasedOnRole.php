<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RedirectBasedOnRole
{
    public function handle(Request $request, Closure $next): Response
    {
        if (auth()->check()) {
            $user = auth()->user();
            
            if ($user->hasRole('admin')) {
                return redirect()->route('admin.dashboard');
            } elseif ($user->hasRole('profesor')) {
                return redirect()->route('profesor.dashboard');
            } elseif ($user->hasRole('estudiante')) {
                return redirect()->route('estudiante.dashboard');
            } elseif ($user->hasRole('padre')) {
                return redirect()->route('padre.dashboard');
            }
        }

        return $next($request);
    }
}
