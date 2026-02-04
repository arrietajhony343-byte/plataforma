<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ForceAppUrl
{
    public function handle(Request $request, Closure $next): Response
    {
        // Para GitHub Codespaces, usar el host sin puerto
        $host = $request->getHost();
        
        if (str_contains($host, 'app.github.dev')) {
            $appUrl = 'https://' . $host;
        } else {
            $appUrl = $request->getSchemeAndHttpHost();
        }
        
        config(['app.url' => $appUrl]);
        \URL::forceRootUrl($appUrl);
        \URL::forceScheme('https');
        
        return $next($request);
    }
}
