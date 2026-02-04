<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $totalEstudiantes = User::role('estudiante')->count();
        $totalProfesores = User::role('profesor')->count();
        $cursosActivos = 18; // TODO: Implementar modelo Curso
        $diasRestantes = 12; // TODO: Calcular según periodo

        // Actividad reciente (mock por ahora)
        $actividadReciente = [
            [
                'name' => 'Juan Pérez (Estudiante)',
                'description' => 'Login',
                'time' => '10:15 AM',
            ],
            [
                'name' => 'María Rodríguez (Profesor)',
                'description' => 'Actualizó Perfil',
                'time' => '09:45 AM',
            ],
            [
                'name' => 'Sistema',
                'description' => 'Nuevo Curso 7B Creado',
                'time' => '09:00 AM',
            ],
            [
                'name' => 'Sistema',
                'description' => 'Nuevo Curso 7B Creado',
                'time' => '09:00 AM',
            ],
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'totalEstudiantes' => $totalEstudiantes,
                'totalProfesores' => $totalProfesores,
                'cursosActivos' => $cursosActivos,
                'diasRestantes' => $diasRestantes,
            ],
            'actividadReciente' => $actividadReciente,
        ]);
    }
}
