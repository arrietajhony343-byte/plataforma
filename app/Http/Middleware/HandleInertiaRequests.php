<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $fotoUrl = null;
        if ($user?->foto) {
            $raw = $user->foto;
            $fotoUrl = str_starts_with($raw, '/storage/') || str_starts_with($raw, 'http')
                ? $raw
                : Storage::url($raw);
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'rol'     => $user->getRoleNames()->first() ?? null,
                    'foto_url' => $fotoUrl,
                ]) : null,
            ],
        ];
    }
}
