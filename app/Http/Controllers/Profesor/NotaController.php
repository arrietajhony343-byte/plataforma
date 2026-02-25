<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\{CursoMateria, Nota, Periodo, Matricula};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotaController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $anio = now()->year;

        // Cursos/materias asignados al profesor
        $cursoMaterias = CursoMateria::where('profesor_id', $user->id)
            ->whereHas('curso', fn($q) => $q->where('anio', $anio))
            ->with(['curso', 'materia'])
            ->get();

        $cursos = $cursoMaterias->pluck('curso')->unique('id')->map(fn($c) => [
            'id' => $c->id, 'nombre' => $c->nombre,
        ])->values();

        $materias = $cursoMaterias->pluck('materia')->unique('id')->map(fn($m) => [
            'id' => $m->id, 'nombre' => $m->nombre,
        ])->values();

        $periodos = Periodo::where('anio', $anio)->orderBy('numero')->get()
            ->map(fn($p) => ['id' => $p->id, 'nombre' => $p->nombre]);

        // Mapear curso_materia_ids para que el frontend pueda filtrar
        $cursoMateriasMap = $cursoMaterias->map(fn($cm) => [
            'id'         => $cm->id,
            'curso_id'   => $cm->curso_id,
            'materia_id' => $cm->materia_id,
        ]);

        return Inertia::render('Profesor/RegistrarNotas', [
            'profesor' => ['nombre' => $user->name],
            'cursos' => $cursos,
            'materias' => $materias,
            'periodos' => $periodos,
            'cursoMaterias' => $cursoMateriasMap,
        ]);
    }

    /**
     * Cargar estudiantes y notas para un curso/materia/periodo específico.
     */
    public function estudiantes(Request $request)
    {
        $request->validate([
            'curso_materia_id' => 'required|exists:curso_materia,id',
            'periodo_id'       => 'required|exists:periodos,id',
        ]);

        $cm = CursoMateria::with('curso')->findOrFail($request->curso_materia_id);

        // Estudiantes matriculados en ese curso
        $matriculas = Matricula::where('curso_id', $cm->curso_id)
            ->activa()
            ->with('estudiante')
            ->get();

        $estudiantes = $matriculas->map(function ($mat) use ($request) {
            $notas = Nota::where('estudiante_id', $mat->estudiante_id)
                ->where('curso_materia_id', $request->curso_materia_id)
                ->where('periodo_id', $request->periodo_id)
                ->get()
                ->map(fn($n) => [
                    'id'    => $n->id,
                    'tipo'  => $n->tipo,
                    'valor' => $n->valor,
                    'peso'  => $n->peso,
                    'descripcion' => $n->descripcion,
                ]);

            $promedio = $notas->count() > 0
                ? round($notas->sum(fn($n) => $n['valor'] * $n['peso']) / max($notas->sum('peso'), 1), 1)
                : null;

            return [
                'id'       => $mat->estudiante->id,
                'nombre'   => $mat->estudiante->name,
                'notas'    => $notas,
                'promedio' => $promedio,
            ];
        })->sortBy('nombre')->values();

        return response()->json($estudiantes);
    }

    /**
     * Guardar o actualizar notas.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'notas'                  => 'required|array',
            'notas.*.estudiante_id'  => 'required|exists:users,id',
            'notas.*.curso_materia_id' => 'required|exists:curso_materia,id',
            'notas.*.periodo_id'     => 'required|exists:periodos,id',
            'notas.*.tipo'           => 'required|in:examen,quiz,tarea,participacion,autoevaluacion',
            'notas.*.valor'          => 'required|numeric|min:0|max:5',
            'notas.*.peso'           => 'required|numeric|min:0|max:100',
            'notas.*.descripcion'    => 'nullable|string|max:255',
        ]);

        foreach ($data['notas'] as $notaData) {
            Nota::updateOrCreate(
                [
                    'estudiante_id'    => $notaData['estudiante_id'],
                    'curso_materia_id' => $notaData['curso_materia_id'],
                    'periodo_id'       => $notaData['periodo_id'],
                    'tipo'             => $notaData['tipo'],
                    'descripcion'      => $notaData['descripcion'] ?? null,
                ],
                [
                    'valor' => $notaData['valor'],
                    'peso'  => $notaData['peso'],
                ]
            );
        }

        return redirect()->back()->with('success', 'Notas guardadas correctamente.');
    }
}
