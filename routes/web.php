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
use App\Http\Controllers\Admin\SedeController;
use App\Http\Controllers\Admin\JornadaController;
use App\Http\Controllers\Auth\ForcePasswordChangeController;
use App\Http\Controllers\Profesor\DashboardController as ProfesorDashboardController;
use App\Http\Controllers\Profesor\NotaController as ProfesorNotaController;
use App\Http\Controllers\Profesor\ObservadorController as ProfesorObservadorController;
use App\Http\Controllers\Profesor\CalendarioController as ProfesorCalendarioController;
use App\Http\Controllers\Profesor\ActividadController as ProfesorActividadController;
use App\Http\Controllers\MensajeController;
use App\Http\Controllers\Profesor\AsistenciaController as ProfesorAsistenciaController;
use App\Http\Controllers\Estudiante\DashboardController as EstudianteDashboardController;
use App\Http\Controllers\Estudiante\ActividadController as EstudianteActividadController;
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
    } elseif ($user->hasRole('coordinador')) {
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

// Rutas de Administrador — accesibles también por Coordinador
Route::middleware(['auth', 'verified', 'role:admin|coordinador'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

    // Cursos + Materias
    Route::get('/cursos', [CursoController::class, 'index'])->name('cursos');
    Route::post('/cursos', [CursoController::class, 'store'])->name('cursos.store');
    Route::put('/cursos/{curso}', [CursoController::class, 'update'])->name('cursos.update');
    Route::delete('/cursos/{curso}', [CursoController::class, 'destroy'])->name('cursos.destroy');
    Route::post('/materias', [MateriaController::class, 'store'])->name('materias.store');
    Route::put('/materias/{materia}', [MateriaController::class, 'update'])->name('materias.update');
    Route::delete('/materias/{materia}', [MateriaController::class, 'destroy'])->name('materias.destroy');
    Route::post('/materias/{materia}/profesores', [MateriaController::class, 'asignarProfesores'])->name('materias.asignar-profesores');

    // Estudiantes
    Route::get('/estudiantes', [EstudianteController::class, 'index'])->name('estudiantes');
    Route::get('/estudiantes/export', [EstudianteController::class, 'export'])->name('estudiantes.export');
    Route::put('/estudiantes/{estudiante}', [EstudianteController::class, 'update'])->name('estudiantes.update');
    Route::patch('/estudiantes/{estudiante}/toggle-status', [EstudianteController::class, 'toggleStatus'])->name('estudiantes.toggle-status');
    Route::post('/estudiantes/{estudiante}/mensaje', [EstudianteController::class, 'sendMessage'])->name('estudiantes.mensaje');
    Route::get('/estudiantes/{estudiante}/notas', [EstudianteController::class, 'notas'])->name('estudiantes.notas');
    Route::get('/estudiantes/{estudiante}/observaciones', [EstudianteController::class, 'observaciones'])->name('estudiantes.observaciones');
    Route::get('/estudiantes/{estudiante}/pagos', [EstudianteController::class, 'pagos'])->name('estudiantes.pagos');

    // Boletines
    Route::get('/boletines', [BoletinController::class, 'index'])->name('boletines');
    Route::post('/boletines/generar', [BoletinController::class, 'generate'])->name('boletines.generar');
    Route::post('/boletines/{boletin}/notificar', [BoletinController::class, 'notificar'])->name('boletines.notificar');
    Route::post('/boletines/notificar-masivo', [BoletinController::class, 'notificarMasivo'])->name('boletines.notificar-masivo');
    Route::post('/boletines/{boletin}/enviar', [BoletinController::class, 'marcarEnviado'])->name('boletines.enviar');

    // Certificados
    Route::get('/certificados', [CertificadoController::class, 'index'])->name('certificados');
    Route::post('/certificados', [CertificadoController::class, 'store'])->name('certificados.store');
    Route::put('/certificados/{certificado}', [CertificadoController::class, 'update'])->name('certificados.update');
    Route::delete('/certificados/{certificado}', [CertificadoController::class, 'destroy'])->name('certificados.destroy');
    Route::get('/certificados/{certificado}/download', [CertificadoController::class, 'download'])->name('certificados.download');
    Route::post('/certificados/{certificado}/notificar', [CertificadoController::class, 'notificarPadre'])->name('certificados.notificar');
    // Tipos de certificado
    Route::post('/certificados/tipos', [CertificadoController::class, 'storeTipo'])->name('certificados.tipos.store');
    Route::put('/certificados/tipos/{tipo}', [CertificadoController::class, 'updateTipo'])->name('certificados.tipos.update');
    Route::delete('/certificados/tipos/{tipo}', [CertificadoController::class, 'destroyTipo'])->name('certificados.tipos.destroy');

    // Horarios
    Route::get('/horarios', [HorarioController::class, 'index'])->name('horarios');
    Route::post('/horarios', [HorarioController::class, 'store'])->name('horarios.store');
    Route::put('/horarios/{horarioBloque}', [HorarioController::class, 'update'])->name('horarios.update');
    Route::delete('/horarios/{horarioBloque}', [HorarioController::class, 'destroy'])->name('horarios.destroy');

    // Jornadas por nivel
    Route::post('/jornadas', [JornadaController::class, 'store'])->name('jornadas.store');

    // Reportes
    Route::get('/reportes', [ReporteController::class, 'index'])->name('reportes');
    Route::get('/reportes/rendimiento', [ReporteController::class, 'rendimiento'])->name('reportes.rendimiento');
    Route::get('/reportes/comentarios', [ReporteController::class, 'comentarios'])->name('reportes.comentarios');
    Route::get('/reportes/asistencia', [ReporteController::class, 'asistencia'])->name('reportes.asistencia');
    Route::get('/reportes/exportar-rendimiento', [ReporteController::class, 'exportarRendimiento'])->name('reportes.exportar-rendimiento');
    Route::get('/reportes/estudiante/{id}/observaciones', [ReporteController::class, 'estudianteObservaciones'])->name('reportes.estudiante-obs');

    // Mensajes
    Route::get('/mensajes', [MensajeController::class, 'index'])->name('mensajes');
    Route::post('/mensajes', [MensajeController::class, 'store'])->name('mensajes.store');
    Route::post('/mensajes/{contacto}/leer', [MensajeController::class, 'markRead'])->name('mensajes.read');
    Route::get('/mensajes/{contacto}/novedades', [MensajeController::class, 'poll'])->name('mensajes.poll');

    // Pagos (control de pagos)
    Route::get('/pagos', [PagoController::class, 'index'])->name('pagos');
    Route::post('/pagos', [PagoController::class, 'store'])->name('pagos.store');
    Route::put('/pagos/{pago}', [PagoController::class, 'update'])->name('pagos.update');
    Route::put('/pagos/{pago}/confirmar', [PagoController::class, 'confirmar'])->name('pagos.confirmar');
    Route::put('/pagos/{pago}/anular', [PagoController::class, 'anular'])->name('pagos.anular');
    Route::delete('/pagos/{pago}', [PagoController::class, 'destroy'])->name('pagos.destroy');
    Route::post('/pagos/conceptos', [PagoController::class, 'storeConcepto'])->name('pagos.conceptos.store');
    Route::put('/pagos/conceptos/{concepto}', [PagoController::class, 'updateConcepto'])->name('pagos.conceptos.update');
    Route::put('/pagos/conceptos/{concepto}/toggle', [PagoController::class, 'toggleConcepto'])->name('pagos.conceptos.toggle');
});

// Rutas de Administrador — exclusivas para admin
Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    // Sedes
    Route::get('/sedes', [SedeController::class, 'index'])->name('sedes');
    Route::post('/sedes', [SedeController::class, 'store'])->name('sedes.store');
    Route::put('/sedes/{sede}', [SedeController::class, 'update'])->name('sedes.update');
    Route::delete('/sedes/{sede}', [SedeController::class, 'destroy'])->name('sedes.destroy');
    Route::get('/sedes/{sede}/detalle', [SedeController::class, 'detalle'])->name('sedes.detalle');

    // Usuarios
    Route::get('/usuarios', [UsuarioController::class, 'index'])->name('usuarios');
    Route::post('/usuarios', [UsuarioController::class, 'store'])->name('usuarios.store');
    Route::put('/usuarios/{user}', [UsuarioController::class, 'update'])->name('usuarios.update');
    Route::patch('/usuarios/{user}/toggle-status', [UsuarioController::class, 'toggleStatus'])->name('usuarios.toggle-status');
    Route::patch('/usuarios/{user}/reset-password', [UsuarioController::class, 'resetPassword'])->name('usuarios.reset-password');
    Route::delete('/usuarios/{user}', [UsuarioController::class, 'destroy'])->name('usuarios.destroy');

    // Periodos
    Route::get('/periodos', [PeriodoController::class, 'index'])->name('periodos');
    Route::post('/periodos', [PeriodoController::class, 'store'])->name('periodos.store');
    Route::put('/periodos/{periodo}', [PeriodoController::class, 'update'])->name('periodos.update');
    Route::patch('/periodos/{periodo}/estado', [PeriodoController::class, 'cambiarEstado'])->name('periodos.cambiar-estado');
    Route::patch('/periodos/{periodo}/ventana', [PeriodoController::class, 'ventanaConfig'])->name('periodos.ventana-config');
    Route::patch('/periodos/{periodo}/toggle-ventana', [PeriodoController::class, 'toggleVentana'])->name('periodos.toggle-ventana');
    Route::post('/periodos/{periodo}/excepciones', [PeriodoController::class, 'storeExcepcion'])->name('periodos.excepciones.store');
    Route::delete('/periodos/{periodo}/excepciones/{excepcion}', [PeriodoController::class, 'destroyExcepcion'])->name('periodos.excepciones.destroy');
    Route::patch('/periodos/{periodo}/excepciones/{excepcion}/toggle', [PeriodoController::class, 'toggleExcepcion'])->name('periodos.excepciones.toggle');
    Route::post('/periodos/{periodo}/notificar', [PeriodoController::class, 'notificarProfesores'])->name('periodos.notificar');
    Route::delete('/periodos/{periodo}', [PeriodoController::class, 'destroy'])->name('periodos.destroy');

    // Pagos
    // (movido al grupo role:admin|coordinador)

    // Contabilidad (read-only)
    Route::get('/contabilidad', [ContabilidadController::class, 'index'])->name('contabilidad');
});

// Rutas de Profesor
Route::middleware(['auth', 'verified', 'role:profesor'])->prefix('profesor')->name('profesor.')->group(function () {
    Route::get('/dashboard', [ProfesorDashboardController::class, 'index'])->name('dashboard');

    // Notas
    Route::get('/notas', [ProfesorNotaController::class, 'index'])->name('notas');
    Route::get('/notas/datos', [ProfesorNotaController::class, 'datos'])->name('notas.datos');
    Route::post('/notas/conceptos', [ProfesorNotaController::class, 'guardarConceptos'])->name('notas.conceptos');
    Route::post('/notas', [ProfesorNotaController::class, 'store'])->name('notas.store');

    // Observador
    Route::get('/observador', [ProfesorObservadorController::class, 'index'])->name('observador');
    Route::post('/observador', [ProfesorObservadorController::class, 'store'])->name('observador.store');

    // Calendario
    Route::get('/calendario', [ProfesorCalendarioController::class, 'index'])->name('calendario');

    // Actividades
    Route::get('/actividades', [ProfesorActividadController::class, 'index'])->name('actividades');
    Route::get('/actividades/crear', [ProfesorActividadController::class, 'create'])->name('actividades.create');
    Route::post('/actividades', [ProfesorActividadController::class, 'store'])->name('actividades.store');
    Route::get('/actividades/{actividad}/editar', [ProfesorActividadController::class, 'edit'])->name('actividades.edit');
    Route::put('/actividades/{actividad}', [ProfesorActividadController::class, 'update'])->name('actividades.update');
    Route::delete('/actividades/{actividad}', [ProfesorActividadController::class, 'destroy'])->name('actividades.destroy');
    Route::get('/actividades/{actividad}/entregas', [ProfesorActividadController::class, 'entregas'])->name('actividades.entregas');
    Route::post('/actividades/{actividad}/calificar', [ProfesorActividadController::class, 'calificar'])->name('actividades.calificar');
    Route::put('/entregas/{entrega}/extender', [ProfesorActividadController::class, 'extenderEntrega'])->name('entregas.extender');
    Route::put('/actividades/{actividad}/extender-plazo', [ProfesorActividadController::class, 'extenderPlazoGeneral'])->name('actividades.extenderPlazo');

    // Mensajes
    Route::get('/mensajes', [MensajeController::class, 'index'])->name('mensajes');
    Route::post('/mensajes', [MensajeController::class, 'store'])->name('mensajes.store');
    Route::post('/mensajes/{contacto}/leer', [MensajeController::class, 'markRead'])->name('mensajes.read');
    Route::get('/mensajes/{contacto}/novedades', [MensajeController::class, 'poll'])->name('mensajes.poll');

    // Asistencias
    Route::get('/asistencias', [ProfesorAsistenciaController::class, 'index'])->name('asistencias');
    Route::get('/asistencias/datos', [ProfesorAsistenciaController::class, 'datos'])->name('asistencias.datos');
    Route::post('/asistencias', [ProfesorAsistenciaController::class, 'store'])->name('asistencias.store');
    Route::get('/asistencias/resumen', [ProfesorAsistenciaController::class, 'resumen'])->name('asistencias.resumen');
});

// Rutas de Estudiante
Route::middleware(['auth', 'verified', 'role:estudiante'])->prefix('estudiante')->name('estudiante.')->group(function () {
    Route::get('/dashboard', [EstudianteDashboardController::class, 'index'])->name('dashboard');
    Route::get('/materias', function () {
        return Inertia::render('Estudiante/Materias');
    })->name('materias');
    // Actividades (con backend real)
    Route::get('/actividades', [EstudianteActividadController::class, 'index'])->name('actividades');
    Route::get('/actividades/{actividad}', [EstudianteActividadController::class, 'show'])->name('actividades.show');
    Route::post('/actividades/{actividad}/entregar', [EstudianteActividadController::class, 'entregar'])->name('actividades.entregar');
    Route::post('/actividades/{actividad}/quiz', [EstudianteActividadController::class, 'quiz'])->name('actividades.quiz');
    Route::delete('/actividades/{actividad}/entrega', [EstudianteActividadController::class, 'cancelar'])->name('actividades.cancelar');

    Route::get('/notas', function () {
        return Inertia::render('Estudiante/Notas');
    })->name('notas');
    Route::get('/horario', function () {
        return Inertia::render('Estudiante/Horario');
    })->name('horario');
    Route::get('/mensajes', [MensajeController::class, 'index'])->name('mensajes');
    Route::post('/mensajes', [MensajeController::class, 'store'])->name('mensajes.store');
    Route::post('/mensajes/{contacto}/leer', [MensajeController::class, 'markRead'])->name('mensajes.read');
    Route::get('/mensajes/{contacto}/novedades', [MensajeController::class, 'poll'])->name('mensajes.poll');
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

    Route::get('/mensajes', [MensajeController::class, 'index'])->name('mensajes');
    Route::post('/mensajes', [MensajeController::class, 'store'])->name('mensajes.store');
    Route::post('/mensajes/{contacto}/leer', [MensajeController::class, 'markRead'])->name('mensajes.read');
    Route::get('/mensajes/{contacto}/novedades', [MensajeController::class, 'poll'])->name('mensajes.poll');
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
