<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Profesor\DashboardController as ProfesorDashboardController;
use App\Http\Controllers\Estudiante\DashboardController as EstudianteDashboardController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return Inertia::render('Auth/Login');
});

// Dashboard general - redirige según rol
Route::get('/dashboard', function () {
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
    
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Rutas de Administrador
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    
    Route::get('/usuarios', function () {
        return Inertia::render('Admin/Usuarios');
    })->name('usuarios');
    
    Route::get('/cursos', function () {
        return Inertia::render('Admin/Cursos');
    })->name('cursos');
    
    Route::get('/periodos', function () {
        return Inertia::render('Admin/Periodos');
    })->name('periodos');
    
    Route::get('/reportes', function () {
        return Inertia::render('Admin/Reportes');
    })->name('reportes');

    // Nuevas rutas de administración
    Route::get('/certificados', function () {
        return Inertia::render('Admin/Certificados');
    })->name('certificados');

    Route::get('/boletines', function () {
        return Inertia::render('Admin/Boletines');
    })->name('boletines');

    Route::get('/pagos', function () {
        return Inertia::render('Admin/Pagos');
    })->name('pagos');

    Route::get('/contabilidad', function () {
        return Inertia::render('Admin/Contabilidad');
    })->name('contabilidad');

    Route::get('/horarios', function () {
        return Inertia::render('Admin/Horarios');
    })->name('horarios');

    Route::get('/estudiantes', function () {
        return Inertia::render('Admin/Estudiantes');
    })->name('estudiantes');
});

// Rutas de Profesor
Route::middleware(['auth', 'verified', 'role:profesor'])->prefix('profesor')->name('profesor.')->group(function () {
    Route::get('/dashboard', [ProfesorDashboardController::class, 'index'])->name('dashboard');
    Route::get('/notas', function () {
        return Inertia::render('Profesor/RegistrarNotas', [
            'profesor' => ['nombre' => auth()->user()->name],
        ]);
    })->name('notas');
    Route::get('/observador', function () {
        return Inertia::render('Profesor/Observador', [
            'profesor' => ['nombre' => auth()->user()->name],
        ]);
    })->name('observador');
    Route::get('/calendario', function () {
        return Inertia::render('Profesor/Calendario');
    })->name('calendario');
});

// Rutas de Estudiante
Route::middleware(['auth', 'verified', 'role:estudiante'])->prefix('estudiante')->name('estudiante.')->group(function () {
    Route::get('/dashboard', [EstudianteDashboardController::class, 'index'])->name('dashboard');
});

// Rutas de Padre
Route::middleware(['auth', 'verified', 'role:padre'])->prefix('padre')->name('padre.')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Padre/Dashboard');
    })->name('dashboard');

    Route::get('/boletin', function () {
        return Inertia::render('Padre/Boletin');
    })->name('boletin');

    Route::get('/calendario', function () {
        return Inertia::render('Padre/Calendario');
    })->name('calendario');

    Route::get('/seguimiento', function () {
        return Inertia::render('Padre/Seguimiento');
    })->name('seguimiento');

    Route::get('/notificaciones', function () {
        return Inertia::render('Padre/Notificaciones');
    })->name('notificaciones');

    Route::get('/pagos', function () {
        return Inertia::render('Padre/Pagos');
    })->name('pagos');

    Route::get('/comprobantes', function () {
        return Inertia::render('Padre/Comprobantes');
    })->name('comprobantes');

    Route::get('/mensajes', function () {
        return Inertia::render('Padre/Mensajes');
    })->name('mensajes');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
