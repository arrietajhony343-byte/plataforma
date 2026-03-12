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
            ->with(['estudiante', 'materia'])
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn($o) => [
                'id'          => $o->id,
                'estudiante'  => $o->estudiante->name,
                'materia'     => $o->materia?->nombre ?? 'N/A',
                'curso'       => '',
                'tipo'        => $o->tipo,
                'categoria'   => $o->categoria,
                'descripcion' => $o->descripcion,
                'fecha'       => $o->fecha instanceof \Carbon\Carbon ? $o->fecha->format('Y-m-d') : $o->fecha,
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
            'tipo'             => 'required|in:positiva,negativa',
            'categoria'        => 'required|string|max:100',
            'descripcion'      => 'required|string|max:1000',
        ]);

        // Extraer materia_id del curso_materia y descartar curso_materia_id (no existe en la tabla)
        $cm = CursoMateria::find($data['curso_materia_id']);
        unset($data['curso_materia_id']);
        $data['materia_id']  = $cm?->materia_id;
        $data['profesor_id'] = auth()->id();
        $data['fecha']       = now()->toDateString();

        Observacion::create($data);

        return redirect()->back()->with('success', 'Observación registrada.');
    }
}
