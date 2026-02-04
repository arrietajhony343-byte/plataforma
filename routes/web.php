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

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
