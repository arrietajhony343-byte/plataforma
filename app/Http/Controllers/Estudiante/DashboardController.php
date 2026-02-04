<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        return Inertia::render('Estudiante/Dashboard', [
            'estudiante' => [
                'nombre' => $user->name,
            ],
        ]);
    }
}
