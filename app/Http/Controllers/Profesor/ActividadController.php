<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\{CursoMateria, Actividad, Entrega};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActividadController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $anio = now()->year;

        $cursoMaterias = CursoMateria::where('profesor_id', $user->id)
            ->whereHas('curso', fn($q) => $q->where('anio', $anio))
            ->with(['curso', 'materia'])
            ->get();

        $cmIds = $cursoMaterias->pluck('id');

        $actividades = Actividad::whereIn('curso_materia_id', $cmIds)
            ->with(['cursoMateria.curso', 'cursoMateria.materia'])
            ->withCount('entregas')
            ->latest()
            ->get()
            ->map(fn($a) => [
                'id'           => $a->id,
                'titulo'       => $a->titulo,
                'descripcion'  => $a->descripcion,
                'tipo'         => $a->tipo,
                'curso'        => $a->cursoMateria?->curso?->nombre,
                'materia'      => $a->cursoMateria?->materia?->nombre,
                'cursoMateriaId' => $a->curso_materia_id,
                'fechaEntrega' => $a->fecha_entrega?->format('Y-m-d'),
                'fechaCreacion' => $a->created_at->format('Y-m-d'),
                'activa'       => $a->activa,
                'entregas'     => $a->entregas_count,
            ]);

        $cursoMateriasMap = $cursoMaterias->map(fn($cm) => [
            'id'      => $cm->id,
            'curso'   => $cm->curso->nombre,
            'materia' => $cm->materia->nombre,
        ]);

        return Inertia::render('Profesor/Actividades', [
            'profesor'      => ['nombre' => $user->name],
            'actividades'   => $actividades,
            'cursoMaterias' => $cursoMateriasMap,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'curso_materia_id' => 'required|exists:curso_materia,id',
            'titulo'           => 'required|string|max:255',
            'descripcion'      => 'nullable|string|max:2000',
            'tipo'             => 'required|in:tarea,examen,quiz,proyecto,exposicion',
            'fecha_entrega'    => 'required|date|after:today',
            'activa'           => 'boolean',
        ]);

        Actividad::create($data);

        return redirect()->back()->with('success', 'Actividad creada exitosamente.');
    }

    public function update(Request $request, Actividad $actividad)
    {
        $data = $request->validate([
            'titulo'        => 'required|string|max:255',
            'descripcion'   => 'nullable|string|max:2000',
            'tipo'          => 'required|in:tarea,examen,quiz,proyecto,exposicion',
            'fecha_entrega' => 'required|date',
            'activa'        => 'boolean',
        ]);

        $actividad->update($data);

        return redirect()->back()->with('success', 'Actividad actualizada.');
    }

    public function destroy(Actividad $actividad)
    {
        $actividad->delete();
        return redirect()->back()->with('success', 'Actividad eliminada.');
    }

    /**
     * Ver entregas de una actividad específica.
     */
    public function entregas(Actividad $actividad)
    {
        $entregas = Entrega::where('actividad_id', $actividad->id)
            ->with('estudiante')
            ->get()
            ->map(fn($e) => [
                'id'            => $e->id,
                'estudiante'    => $e->estudiante->name,
                'fechaEntrega'  => $e->created_at->format('Y-m-d H:i'),
                'archivo'       => $e->archivo,
                'comentario'    => $e->comentario,
                'calificacion'  => $e->calificacion,
                'retroalimentacion' => $e->retroalimentacion,
            ]);

        return response()->json($entregas);
    }
}
