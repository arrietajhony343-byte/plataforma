<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\UsuarioController;
use App\Http\Controllers\Admin\CursoController;
use App\Http\Controllers\Admin\MateriaController;
use App\Http\Controllers\Admin\PeriodoController;
use App\Http\Controllers\Admin\EstudianteController;
use App\Http\Controllers\Admin\PagoController;
use App\Http\Controllers\Admin\BoletinController;
use App\Http\Controllers\Admin\CertificadoController;
use App\Http\Controllers\Admin\HorarioController;
use App\Http\Controllers\Admin\ReporteController;
use App\Http\Controllers\Admin\ContabilidadController;
use App\Http\Controllers\Auth\ForcePasswordChangeController;
use App\Http\Controllers\Profesor\DashboardController as ProfesorDashboardController;
use App\Http\Controllers\Profesor\NotaController as ProfesorNotaController;
use App\Http\Controllers\Profesor\ObservadorController as ProfesorObservadorController;
use App\Http\Controllers\Profesor\CalendarioController as ProfesorCalendarioController;
use App\Http\Controllers\Profesor\ActividadController as ProfesorActividadController;
use App\Http\Controllers\Profesor\MensajeController as ProfesorMensajeController;
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

// Cambio obligatorio de contraseña
Route::middleware('auth')->group(function () {
    Route::get('/force-change-password', [ForcePasswordChangeController::class, 'show'])->name('password.force-change');
    Route::post('/force-change-password', [ForcePasswordChangeController::class, 'update'])->name('password.force-update');
});

// Rutas de Administrador
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    
    Route::get('/usuarios', [UsuarioController::class, 'index'])->name('usuarios');
    Route::post('/usuarios', [UsuarioController::class, 'store'])->name('usuarios.store');
    Route::put('/usuarios/{user}', [UsuarioController::class, 'update'])->name('usuarios.update');
    Route::patch('/usuarios/{user}/toggle-status', [UsuarioController::class, 'toggleStatus'])->name('usuarios.toggle-status');
    Route::patch('/usuarios/{user}/reset-password', [UsuarioController::class, 'resetPassword'])->name('usuarios.reset-password');
    Route::delete('/usuarios/{user}', [UsuarioController::class, 'destroy'])->name('usuarios.destroy');
    
    // Cursos + Materias
    Route::get('/cursos', [CursoController::class, 'index'])->name('cursos');
    Route::post('/cursos', [CursoController::class, 'store'])->name('cursos.store');
    Route::put('/cursos/{curso}', [CursoController::class, 'update'])->name('cursos.update');
    Route::delete('/cursos/{curso}', [CursoController::class, 'destroy'])->name('cursos.destroy');
    Route::post('/materias', [MateriaController::class, 'store'])->name('materias.store');
    Route::put('/materias/{materia}', [MateriaController::class, 'update'])->name('materias.update');
    Route::delete('/materias/{materia}', [MateriaController::class, 'destroy'])->name('materias.destroy');
    Route::post('/materias/{materia}/profesores', [MateriaController::class, 'asignarProfesores'])->name('materias.asignar-profesores');

    // Periodos
    Route::get('/periodos', [PeriodoController::class, 'index'])->name('periodos');
    Route::post('/periodos', [PeriodoController::class, 'store'])->name('periodos.store');
    Route::put('/periodos/{periodo}', [PeriodoController::class, 'update'])->name('periodos.update');
    Route::patch('/periodos/{periodo}/estado', [PeriodoController::class, 'cambiarEstado'])->name('periodos.cambiar-estado');
    Route::delete('/periodos/{periodo}', [PeriodoController::class, 'destroy'])->name('periodos.destroy');

    // Estudiantes
    Route::get('/estudiantes', [EstudianteController::class, 'index'])->name('estudiantes');
    Route::get('/estudiantes/export', [EstudianteController::class, 'export'])->name('estudiantes.export');
    Route::put('/estudiantes/{estudiante}', [EstudianteController::class, 'update'])->name('estudiantes.update');
    Route::patch('/estudiantes/{estudiante}/toggle-status', [EstudianteController::class, 'toggleStatus'])->name('estudiantes.toggle-status');
    Route::post('/estudiantes/{estudiante}/mensaje', [EstudianteController::class, 'sendMessage'])->name('estudiantes.mensaje');
    Route::get('/estudiantes/{estudiante}/notas', [EstudianteController::class, 'notas'])->name('estudiantes.notas');
    Route::get('/estudiantes/{estudiante}/observaciones', [EstudianteController::class, 'observaciones'])->name('estudiantes.observaciones');
    Route::get('/estudiantes/{estudiante}/pagos', [EstudianteController::class, 'pagos'])->name('estudiantes.pagos');

    // Pagos
    Route::get('/pagos', [PagoController::class, 'index'])->name('pagos');
    Route::post('/pagos', [PagoController::class, 'store'])->name('pagos.store');
    Route::put('/pagos/{pago}', [PagoController::class, 'update'])->name('pagos.update');

    // Boletines
    Route::get('/boletines', [BoletinController::class, 'index'])->name('boletines');
    Route::post('/boletines/generar', [BoletinController::class, 'generate'])->name('boletines.generar');

    // Certificados
    Route::get('/certificados', [CertificadoController::class, 'index'])->name('certificados');
    Route::post('/certificados', [CertificadoController::class, 'store'])->name('certificados.store');
    Route::put('/certificados/{certificado}', [CertificadoController::class, 'update'])->name('certificados.update');
    Route::delete('/certificados/{certificado}', [CertificadoController::class, 'destroy'])->name('certificados.destroy');
    Route::get('/certificados/{certificado}/download', [CertificadoController::class, 'download'])->name('certificados.download');
    // Tipos de certificado
    Route::post('/certificados/tipos', [CertificadoController::class, 'storeTipo'])->name('certificados.tipos.store');
    Route::put('/certificados/tipos/{tipo}', [CertificadoController::class, 'updateTipo'])->name('certificados.tipos.update');
    Route::delete('/certificados/tipos/{tipo}', [CertificadoController::class, 'destroyTipo'])->name('certificados.tipos.destroy');

    // Horarios
    Route::get('/horarios', [HorarioController::class, 'index'])->name('horarios');
    Route::post('/horarios', [HorarioController::class, 'store'])->name('horarios.store');
    Route::put('/horarios/{horarioBloque}', [HorarioController::class, 'update'])->name('horarios.update');
    Route::delete('/horarios/{horarioBloque}', [HorarioController::class, 'destroy'])->name('horarios.destroy');

    // Reportes
    Route::get('/reportes', [ReporteController::class, 'index'])->name('reportes');
    Route::get('/reportes/rendimiento', [ReporteController::class, 'rendimiento'])->name('reportes.rendimiento');
    Route::get('/reportes/comentarios', [ReporteController::class, 'comentarios'])->name('reportes.comentarios');
    Route::get('/reportes/asistencia', [ReporteController::class, 'asistencia'])->name('reportes.asistencia');
    Route::get('/reportes/exportar-rendimiento', [ReporteController::class, 'exportarRendimiento'])->name('reportes.exportar-rendimiento');

    // Contabilidad (read-only)
    Route::get('/contabilidad', [ContabilidadController::class, 'index'])->name('contabilidad');
});

// Rutas de Profesor
Route::middleware(['auth', 'verified', 'role:profesor'])->prefix('profesor')->name('profesor.')->group(function () {
    Route::get('/dashboard', [ProfesorDashboardController::class, 'index'])->name('dashboard');

    // Notas
    Route::get('/notas', [ProfesorNotaController::class, 'index'])->name('notas');
    Route::get('/notas/estudiantes', [ProfesorNotaController::class, 'estudiantes'])->name('notas.estudiantes');
    Route::post('/notas', [ProfesorNotaController::class, 'store'])->name('notas.store');

    // Observador
    Route::get('/observador', [ProfesorObservadorController::class, 'index'])->name('observador');
    Route::post('/observador', [ProfesorObservadorController::class, 'store'])->name('observador.store');

    // Calendario
    Route::get('/calendario', [ProfesorCalendarioController::class, 'index'])->name('calendario');

    // Actividades
    Route::get('/actividades', [ProfesorActividadController::class, 'index'])->name('actividades');
    Route::post('/actividades', [ProfesorActividadController::class, 'store'])->name('actividades.store');
    Route::put('/actividades/{actividad}', [ProfesorActividadController::class, 'update'])->name('actividades.update');
    Route::delete('/actividades/{actividad}', [ProfesorActividadController::class, 'destroy'])->name('actividades.destroy');
    Route::get('/actividades/{actividad}/entregas', [ProfesorActividadController::class, 'entregas'])->name('actividades.entregas');

    // Mensajes
    Route::get('/mensajes', [ProfesorMensajeController::class, 'index'])->name('mensajes');
    Route::post('/mensajes', [ProfesorMensajeController::class, 'store'])->name('mensajes.store');
});

// Rutas de Estudiante
Route::middleware(['auth', 'verified', 'role:estudiante'])->prefix('estudiante')->name('estudiante.')->group(function () {
    Route::get('/dashboard', [EstudianteDashboardController::class, 'index'])->name('dashboard');
    Route::get('/materias', function () {
        return Inertia::render('Estudiante/Materias');
    })->name('materias');
    Route::get('/actividades', function () {
        return Inertia::render('Estudiante/Actividades');
    })->name('actividades');
    Route::get('/notas', function () {
        return Inertia::render('Estudiante/Notas');
    })->name('notas');
    Route::get('/horario', function () {
        return Inertia::render('Estudiante/Horario');
    })->name('horario');
    Route::get('/mensajes', function () {
        return Inertia::render('Estudiante/Mensajes');
    })->name('mensajes');
    Route::get('/observador', function () {
        return Inertia::render('Estudiante/Observador');
    })->name('observador');
    Route::get('/boletines', function () {
        return Inertia::render('Estudiante/Boletines');
    })->name('boletines');
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

    // Notificaciones API (todos los roles)
    Route::prefix('api/notificaciones')->group(function () {
        Route::get('/',                        [\App\Http\Controllers\NotificacionController::class, 'index']);
        Route::post('/{id}/marcar-leida',      [\App\Http\Controllers\NotificacionController::class, 'marcarLeida']);
        Route::post('/marcar-todas-leidas',    [\App\Http\Controllers\NotificacionController::class, 'marcarTodasLeidas']);
    });
});

require __DIR__.'/auth.php';
