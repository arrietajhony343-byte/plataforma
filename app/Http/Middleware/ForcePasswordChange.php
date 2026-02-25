<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForcePasswordChange
{
    /**
     * Si el usuario tiene must_change_password = true,
     * lo redirige a la página de cambio obligatorio.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (
            $request->user() &&
            $request->user()->must_change_password &&
            !$request->routeIs('password.force-change') &&
            !$request->routeIs('password.force-update') &&
            !$request->routeIs('logout')
        ) {
            return redirect()->route('password.force-change');
        }

        return $next($request);
    }
}
