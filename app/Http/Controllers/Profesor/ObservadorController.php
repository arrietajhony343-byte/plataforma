<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\{CursoMateria, Observacion, Matricula};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ObservadorController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $anio = now()->year;

        // Cursos/materias asignados
        $cursoMaterias = CursoMateria::where('profesor_id', $user->id)
            ->whereHas('curso', fn($q) => $q->where('anio', $anio))
            ->with(['curso', 'materia'])
            ->get();

        $cursos = $cursoMaterias->pluck('curso')->unique('id')->map(fn($c) => [
            'id' => $c->id, 'nombre' => $c->nombre,
        ])->values();

        // Estudiantes de todos los cursos del profesor
        $cursoIds = $cursoMaterias->pluck('curso_id')->unique();
        $estudiantes = Matricula::whereIn('curso_id', $cursoIds)
            ->activa()
            ->with(['estudiante', 'curso'])
            ->get()
            ->map(fn($m) => [
                'id'     => $m->estudiante->id,
                'nombre' => $m->estudiante->name,
                'curso'  => $m->curso->nombre,
            ])
            ->unique('id')
            ->sortBy('nombre')
            ->values();

        // Observaciones escritas por este profesor
        $observaciones = Observacion::where('profesor_id', $user->id)
            ->with(['estudiante', 'cursoMateria.curso', 'cursoMateria.materia'])
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn($o) => [
                'id'          => $o->id,
                'estudiante'  => $o->estudiante->name,
                'curso'       => $o->cursoMateria?->curso?->nombre ?? 'N/A',
                'materia'     => $o->cursoMateria?->materia?->nombre ?? 'N/A',
                'tipo'        => $o->tipo,
                'descripcion' => $o->descripcion,
                'fecha'       => $o->created_at->format('Y-m-d'),
            ]);

        $cursoMateriasMap = $cursoMaterias->map(fn($cm) => [
            'id'         => $cm->id,
            'curso_id'   => $cm->curso_id,
            'materia_id' => $cm->materia_id,
        ]);

        return Inertia::render('Profesor/Observador', [
            'profesor'       => ['nombre' => $user->name],
            'cursos'         => $cursos,
            'estudiantes'    => $estudiantes,
            'observaciones'  => $observaciones,
            'cursoMaterias'  => $cursoMateriasMap,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'estudiante_id'    => 'required|exists:users,id',
            'curso_materia_id' => 'required|exists:curso_materia,id',
            'tipo'             => 'required|in:positiva,negativa,neutral',
            'descripcion'      => 'required|string|max:1000',
        ]);

        $data['profesor_id'] = auth()->id();

        Observacion::create($data);

        return redirect()->back()->with('success', 'Observación registrada.');
    }
}
