<?php

namespace App\Providers;

use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        
        // Forzar HTTPS y URL correcta en GitHub Codespaces
        if (str_contains(request()->getHost(), 'app.github.dev')) {
            URL::forceScheme('https');
            // Forzar la URL sin el puerto
            $host = request()->getHost();
            URL::forceRootUrl('https://' . $host);
        }
    }
}
