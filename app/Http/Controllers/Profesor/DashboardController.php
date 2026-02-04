<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        // Cursos asignados (mock por ahora)
        $cursosAsignados = [
            [
                'id' => 1,
                'nombre' => 'Matemáticas',
                'grado' => 'Grado 6A',
                'estudiantes' => 25,
                'color' => 'blue',
            ],
            [
                'id' => 2,
                'nombre' => 'Física',
                'grado' => 'Grado 10B',
                'estudiantes' => 20,
                'color' => 'green',
            ],
        ];

        // Alertas recientes
        $alertas = [
            [
                'id' => 1,
                'estudiante' => 'Juan Pérez',
                'curso' => '6A',
                'mensaje' => '3 observaciones disciplinarias esta semana - Requiere atención.',
                'tipo' => 'warning',
            ],
            [
                'id' => 2,
                'estudiante' => 'María Gómez',
                'curso' => '10B',
                'mensaje' => 'Baja participación y 2 faltas de tarea - Seguimiento urgente.',
                'tipo' => 'danger',
            ],
        ];

        return Inertia::render('Profesor/Dashboard', [
            'profesor' => [
                'nombre' => $user->name,
            ],
            'cursosAsignados' => $cursosAsignados,
            'alertas' => $alertas,
        ]);
    }
}
