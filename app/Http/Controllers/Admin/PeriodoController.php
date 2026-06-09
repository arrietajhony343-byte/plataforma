<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Curso;
use App\Models\Periodo;
use App\Models\User;
use App\Models\VentanaExcepcion;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PeriodoController extends Controller
{
    public function index(Request $request): Response
    {
        // Años disponibles
        $anios = Periodo::select('anio')->distinct()->orderByDesc('anio')->pluck('anio')->toArray();
        $anioActual = (int) ($request->query('anio') ?? ($anios[0] ?? now('America/Bogota')->year));

        // Asegurar que el año seleccionado esté en la lista
        if (!in_array($anioActual, $anios) && count($anios) > 0) {
            $anioActual = $anios[0];
        }

        $periodos = Periodo::where('anio', $anioActual)
            ->orderBy('numero')
            ->withCount(['notas', 'boletines'])
            ->with(['excepciones', 'eventos' => fn($q) => $q->orderBy('fecha')])
            ->get()
            ->map(fn(Periodo $p) => [
                'id'              => $p->id,
                'nombre'          => $p->nombre,
                'numero'          => $p->numero,
                'fecha_inicio'    => $p->fecha_inicio->format('Y-m-d'),
                'fecha_fin'       => $p->fecha_fin->format('Y-m-d'),
                'estado'          => $p->estado,
                'porcentaje'      => (float) $p->porcentaje,
                'anio'            => $p->anio,
                'notas_count'     => $p->notas_count ?? 0,
                'boletines_count' => $p->boletines_count ?? 0,
                'tiene_datos'     => ($p->notas_count ?? 0) > 0 || ($p->boletines_count ?? 0) > 0,
                'notas_abiertas'  => (bool) $p->notas_abiertas,
                'ventana_inicio'  => $p->ventana_inicio?->format('Y-m-d\TH:i'),
                'ventana_fin'     => $p->ventana_fin?->format('Y-m-d\TH:i'),
                'excepciones'     => $p->excepciones->map(fn($e) => [
                    'id'                => $e->id,
                    'tipo'              => $e->tipo,
                    'referencia_id'     => $e->referencia_id,
                    'nombre_referencia' => $e->nombre_referencia,
                    'motivo'            => $e->motivo,
                    'activa'            => (bool) $e->activa,
                ])->toArray(),
                'eventos'         => $p->eventos->map(fn($ev) => [
                    'id'          => $ev->id,
                    'fecha'       => $ev->fecha?->format('Y-m-d'),
                    'tipo'        => $ev->tipo,
                    'titulo'      => $ev->titulo,
                    'descripcion' => $ev->descripcion,
                ])->toArray(),
            ]);

        $sumaPorcentajes = $periodos->sum('porcentaje');

        $profesores = User::role('profesor')
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        $cursos = Curso::where('anio', $anioActual)
            ->select('id', 'nombre', 'nivel', 'grado', 'grupo')
            ->orderBy('nivel')
            ->orderBy('grado')
            ->get();

        return Inertia::render('Admin/Periodos', [
            'periodos'         => $periodos,
            'anio'             => $anioActual,
            'aniosDisponibles' => $anios,
            'sumaPorcentajes'  => $sumaPorcentajes,
            'profesores'       => $profesores,
            'cursos'           => $cursos,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre'       => 'required|string|max:100',
            'numero'       => 'required|integer|min:1|max:6',
            'anio'         => 'required|integer|min:2020|max:2035',
            'fecha_inicio' => 'required|date',
            'fecha_fin'    => 'required|date|after:fecha_inicio',
            'porcentaje'   => 'required|numeric|min:0|max:100',
            'estado'       => 'required|in:activo,finalizado,pendiente',
        ]);

        // Verificar que no exista ese número para ese año
        if (Periodo::where('anio', $data['anio'])->where('numero', $data['numero'])->exists()) {
            return redirect()->back()->withErrors([
                'numero' => "Ya existe el periodo #{$data['numero']} para el año {$data['anio']}.",
            ]);
        }

        // Verificar que no se supere 100% en el año
        $sumaActual = Periodo::where('anio', $data['anio'])->sum('porcentaje');
        if ($sumaActual + $data['porcentaje'] > 100.01) {
            return redirect()->back()->withErrors([
                'porcentaje' => "La suma de porcentajes superaría 100% (actual: {$sumaActual}%).",
            ]);
        }

        // Si es el primer periodo del año, y no hay activo, activarlo automáticamente
        if (!Periodo::where('anio', $data['anio'])->where('estado', 'activo')->exists() && $data['estado'] === 'pendiente') {
            $data['estado'] = 'activo';
        }

        Periodo::create($data);

        return redirect()->back()->with('success', 'Periodo creado exitosamente.');
    }

    public function update(Request $request, Periodo $periodo)
    {
        $data = $request->validate([
            'nombre'       => 'required|string|max:100',
            'fecha_inicio' => 'required|date',
            'fecha_fin'    => 'required|date|after:fecha_inicio',
            'porcentaje'   => 'required|numeric|min:0|max:100',
            'estado'       => 'required|in:activo,finalizado,pendiente',
        ]);

        // Verificar porcentaje total sin contar el periodo actual
        $sumaOtros = Periodo::where('anio', $periodo->anio)
            ->where('id', '!=', $periodo->id)
            ->sum('porcentaje');
        if ($sumaOtros + $data['porcentaje'] > 100.01) {
            return redirect()->back()->withErrors([
                'porcentaje' => "La suma de porcentajes superaría 100% (otros periodos: {$sumaOtros}%).",
            ]);
        }

        // Si se activa este periodo, desactivar el que estaba activo
        if ($data['estado'] === 'activo' && $periodo->estado !== 'activo') {
            Periodo::where('anio', $periodo->anio)
                ->where('id', '!=', $periodo->id)
                ->where('estado', 'activo')
                ->update(['estado' => 'pendiente']);
        }

        $periodo->update($data);

        return redirect()->back()->with('success', 'Periodo actualizado.');
    }

    /**
     * Cambiar estado de un periodo (activar / finalizar / reabrir).
     */
    public function cambiarEstado(Request $request, Periodo $periodo)
    {
        $data = $request->validate([
            'estado' => 'required|in:activo,finalizado,pendiente',
        ]);

        $nuevoEstado = $data['estado'];

        // Si se activa, desactivar el activo actual del mismo año
        if ($nuevoEstado === 'activo') {
            Periodo::where('anio', $periodo->anio)
                ->where('id', '!=', $periodo->id)
                ->where('estado', 'activo')
                ->update(['estado' => 'pendiente']);
        }

        // Si se finaliza, activar automáticamente el siguiente pendiente
        if ($nuevoEstado === 'finalizado') {
            $siguiente = Periodo::where('anio', $periodo->anio)
                ->where('numero', '>', $periodo->numero)
                ->where('estado', 'pendiente')
                ->orderBy('numero')
                ->first();

            if ($siguiente) {
                $siguiente->update(['estado' => 'activo']);
            }
        }

        $periodo->update(['estado' => $nuevoEstado]);

        $msg = match ($nuevoEstado) {
            'activo'     => "Periodo \"{$periodo->nombre}\" activado.",
            'finalizado' => "Periodo \"{$periodo->nombre}\" finalizado.",
            'pendiente'  => "Periodo \"{$periodo->nombre}\" reabierto como pendiente.",
        };

        return redirect()->back()->with('success', $msg);
    }

    /**
     * Configurar ventana automática (fechas de referencia de apertura/cierre).
     */
    public function ventanaConfig(Request $request, Periodo $periodo)
    {
        $data = $request->validate([
            'ventana_inicio' => 'nullable|date',
            'ventana_fin'    => 'nullable|date|after_or_equal:ventana_inicio',
            'notificar'      => 'boolean',
            'mensaje'        => 'nullable|string|max:1000',
        ]);

        $periodo->update([
            'ventana_inicio' => $data['ventana_inicio'] ?: null,
            'ventana_fin'    => $data['ventana_fin'] ?: null,
        ]);

        if (!empty($data['notificar']) && !empty($data['ventana_inicio'])) {
            $profesores = User::role('profesor')->get();

            $inicio = \Carbon\Carbon::parse($data['ventana_inicio'])
                ->setTimezone('America/Bogota')
                ->translatedFormat('d \d\e F \d\e Y \a \l\a\s g:i a');

            $finTexto = '';
            if (!empty($data['ventana_fin'])) {
                $fin = \Carbon\Carbon::parse($data['ventana_fin'])
                    ->setTimezone('America/Bogota')
                    ->translatedFormat('d \d\e F \d\e Y \a \l\a\s g:i a');
                $finTexto = " hasta el {$fin}";
            }

            $mensajeFinal = !empty($data['mensaje'])
                ? $data['mensaje']
                : "La ventana de calificación para **{$periodo->nombre}** estará disponible a partir del {$inicio}{$finTexto}. Por favor ten en cuenta estas fechas para el registro de notas.";

            foreach ($profesores as $prof) {
                $prof->notificaciones()->create([
                    'tipo'    => 'academica',
                    'titulo'  => "📅 Ventana programada: {$periodo->nombre}",
                    'mensaje' => $mensajeFinal,
                ]);
            }
        }

        return redirect()->back()->with('success', 'Programación de ventana guardada.');
    }

    /**
     * Abrir o cerrar manualmente la ventana de notas y opcionalmente notificar profesores.
     */
    public function toggleVentana(Request $request, Periodo $periodo)
    {
        $data = $request->validate([
            'notas_abiertas' => 'required|boolean',
            'notificar'      => 'boolean',
            'mensaje'        => 'nullable|string|max:1000',
        ]);

        $periodo->update(['notas_abiertas' => $data['notas_abiertas']]);

        if (!empty($data['notificar'])) {
            $profesores = User::role('profesor')->get();

            $titulo = $data['notas_abiertas']
                ? "📝 Notas abiertas: {$periodo->nombre}"
                : "🔒 Notas cerradas: {$periodo->nombre}";

            $mensajeDefecto = $data['notas_abiertas']
                ? "La ventana de registro de notas para el {$periodo->nombre} ya está disponible. Por favor ingresa las calificaciones dentro del tiempo establecido."
                : "El período de registro de notas para el {$periodo->nombre} ha finalizado.";

            $mensajeFinal = !empty($data['mensaje']) ? $data['mensaje'] : $mensajeDefecto;

            foreach ($profesores as $prof) {
                $prof->notificaciones()->create([
                    'tipo'    => 'academica',
                    'titulo'  => $titulo,
                    'mensaje' => $mensajeFinal,
                ]);
            }
        }

        $accion = $data['notas_abiertas'] ? 'abierta' : 'cerrada';
        return redirect()->back()->with('success', "Ventana de notas {$accion} para {$periodo->nombre}.");
    }

    /**
     * Agregar excepción a la ventana de notas de un periodo.
     */
    public function storeExcepcion(Request $request, Periodo $periodo)
    {
        $data = $request->validate([
            'tipo'              => 'required|in:profesor,curso',
            'referencia_id'     => 'required|integer',
            'nombre_referencia' => 'required|string|max:150',
            'motivo'            => 'nullable|string|max:300',
        ]);

        if ($periodo->excepciones()
            ->where('tipo', $data['tipo'])
            ->where('referencia_id', $data['referencia_id'])
            ->exists()) {
            return redirect()->back()->withErrors([
                'excepcion' => 'Ya existe una excepción para este ' . $data['tipo'] . ' en este periodo.',
            ]);
        }

        $periodo->excepciones()->create([...$data, 'activa' => true]);

        return redirect()->back()->with('success', 'Excepción agregada correctamente.');
    }

    /**
     * Eliminar una excepción de ventana.
     */
    public function destroyExcepcion(Periodo $periodo, int $excepcion)
    {
        $ex = $periodo->excepciones()->findOrFail($excepcion);
        $ex->delete();

        return redirect()->back()->with('success', 'Excepción eliminada.');
    }

    /**
     * Activar o desactivar una excepción de ventana.
     */
    public function toggleExcepcion(Periodo $periodo, int $excepcion)
    {
        $ex = $periodo->excepciones()->findOrFail($excepcion);
        $ex->update(['activa' => !$ex->activa]);

        $estado = $ex->activa ? 'activada' : 'desactivada';
        return redirect()->back()->with('success', "Excepción {$estado}.");
    }

    /**
     * Agregar un día especial (evento) al periodo.
     */
    public function storeEvento(Request $request, Periodo $periodo)
    {
        $data = $request->validate([
            'fecha'       => 'required|date',
            'tipo'        => 'required|in:evento,reunion_padres,institucional,academico,otro',
            'titulo'      => 'required|string|max:150',
            'descripcion' => 'nullable|string|max:300',
        ]);

        $fecha = \Carbon\Carbon::parse($data['fecha'])->startOfDay();
        if ($fecha->lt($periodo->fecha_inicio) || $fecha->gt($periodo->fecha_fin)) {
            return redirect()->back()->withErrors([
                'evento' => 'La fecha del evento debe estar dentro del rango del periodo.',
            ]);
        }

        $periodo->eventos()->create($data);

        return redirect()->back()->with('success', 'Día especial agregado correctamente.');
    }

    /**
     * Eliminar un evento del periodo.
     */
    public function destroyEvento(Periodo $periodo, int $evento)
    {
        $ev = $periodo->eventos()->findOrFail($evento);
        $ev->delete();

        return redirect()->back()->with('success', 'Día especial eliminado.');
    }

    /**
     * Notificar a los profesores sobre el estado de la ventana de notas.
     */
    public function notificarProfesores(Request $request, Periodo $periodo)
    {
        $data = $request->validate([
            'titulo'              => 'required|string|max:150',
            'mensaje'             => 'required|string|max:1000',
            'solo_con_asignacion' => 'boolean',
        ]);

        if (!empty($data['solo_con_asignacion'])) {
            $profesores = User::role('profesor')
                ->whereHas('cursoMaterias', fn($q) => $q->whereHas('curso', fn($q2) => $q2->where('anio', $periodo->anio)))
                ->get();
        } else {
            $profesores = User::role('profesor')->get();
        }

        foreach ($profesores as $prof) {
            $prof->notificaciones()->create([
                'tipo'    => 'academica',
                'titulo'  => $data['titulo'],
                'mensaje' => $data['mensaje'],
            ]);
        }

        return redirect()->back()->with('success', "Notificación enviada a {$profesores->count()} profesor(es).");
    }

    public function destroy(Periodo $periodo)
    {
        $notasCount = $periodo->notas()->count();
        $boletinesCount = $periodo->boletines()->count();

        if ($notasCount > 0 || $boletinesCount > 0) {
            return redirect()->back()->withErrors([
                'error' => "No se puede eliminar: este periodo tiene {$notasCount} notas y {$boletinesCount} boletines registrados.",
            ]);
        }

        $periodo->delete();
        return redirect()->back()->with('success', 'Periodo eliminado.');
    }
}
