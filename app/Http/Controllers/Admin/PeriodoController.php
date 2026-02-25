<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Periodo;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PeriodoController extends Controller
{
    public function index(Request $request): Response
    {
        // Años disponibles
        $anios = Periodo::select('anio')->distinct()->orderByDesc('anio')->pluck('anio')->toArray();
        $anioActual = (int) ($request->query('anio') ?? ($anios[0] ?? now()->year));

        // Asegurar que el año seleccionado esté en la lista
        if (!in_array($anioActual, $anios) && count($anios) > 0) {
            $anioActual = $anios[0];
        }

        $periodos = Periodo::where('anio', $anioActual)
            ->orderBy('numero')
            ->withCount(['notas', 'boletines'])
            ->get()
            ->map(fn(Periodo $p) => [
                'id'            => $p->id,
                'nombre'        => $p->nombre,
                'numero'        => $p->numero,
                'fecha_inicio'  => $p->fecha_inicio->format('Y-m-d'),
                'fecha_fin'     => $p->fecha_fin->format('Y-m-d'),
                'estado'        => $p->estado,
                'porcentaje'    => (float) $p->porcentaje,
                'anio'          => $p->anio,
                'notas_count'   => $p->notas_count ?? 0,
                'boletines_count' => $p->boletines_count ?? 0,
                'tiene_datos'   => ($p->notas_count ?? 0) > 0 || ($p->boletines_count ?? 0) > 0,
            ]);

        // Validar si la suma de % llega a 100
        $sumaPorcentajes = $periodos->sum('porcentaje');

        return Inertia::render('Admin/Periodos', [
            'periodos'         => $periodos,
            'anio'             => $anioActual,
            'aniosDisponibles' => $anios,
            'sumaPorcentajes'  => $sumaPorcentajes,
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

    public function destroy(Periodo $periodo)
    {
        // Proteger contra eliminar periodos con datos académicos
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
