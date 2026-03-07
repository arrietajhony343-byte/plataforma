<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Curso, Materia, CursoMateria, User, Matricula, Sede};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CursoController extends Controller
{
    public function index(): Response
    {
        $anio = Curso::max('anio') ?? now()->year;

        $cursos = Curso::where('anio', $anio)
            ->with(['directorGrupo', 'cursoMaterias.materia', 'cursoMaterias.profesor', 'sede'])
            ->orderBy('nivel')->orderBy('grado')->orderBy('grupo')
            ->get()
            ->map(function (Curso $c) {
                // Contar estudiantes DISTINTOS con matrícula activa en este curso
                $estudiantesCount = Matricula::where('curso_id', $c->id)
                    ->where('estado', 'activa')
                    ->distinct('estudiante_id')
                    ->count('estudiante_id');

                return [
                    'id'               => $c->id,
                    'nombre'           => $c->nombre,
                    'nivel'            => $c->nivel,
                    'grado'            => $c->grado,
                    'seccion'          => $c->grupo,
                    'jornada'          => $c->jornada,
                    'cupo_maximo'      => $c->cupo_maximo,
                    'director_grupo_id'=> $c->director_grupo_id,
                    'materias'         => $c->cursoMaterias->map(fn($cm) => [
                        'id'          => $cm->materia?->id,
                        'nombre'      => $cm->materia?->nombre ?? 'Sin materia',
                        'profesor'    => $cm->profesor?->name ?? null,
                        'profesor_id' => $cm->profesor_id,
                    ])->toArray(),
                    'materias_nombres' => $c->cursoMaterias->pluck('materia.nombre')->filter()->values()->toArray(),
                    'profesor_guia'    => $c->directorGrupo?->name ?? 'Sin asignar',
                    'estudiantes'      => $estudiantesCount,
                    'activo'           => $c->activo,
                    'sede_id'          => $c->sede_id,
                    'sede_nombre'      => $c->sede?->nombre ?? null,
                ];
            });

        // Materias con sus profesores autorizados (tabla materia_profesor)
        $materias = Materia::withCount(['cursoMaterias as cursos_count' => fn($q) => $q->whereHas('curso', fn($cq) => $cq->where('anio', $anio))])
            ->with(['profesores:id,name'])
            ->orderBy('nombre')
            ->get()
            ->map(fn(Materia $m) => [
                'id'             => $m->id,
                'nombre'         => $m->nombre,
                'area'           => $m->area,
                'codigo'         => $m->codigo,
                'cursos'         => $m->cursos_count ?? 0,
                'profesores'     => $m->profesores->map(fn($p) => ['id' => $p->id, 'name' => $p->name])->toArray(),
                'horasSemanales' => $m->horas_semanales,
                'activa'         => $m->activa,
            ]);

        // Mapa materia_id → [{ id, name }] para filtrar el selector de profesor en el modal de curso
        $materiasProfesores = $materias->mapWithKeys(fn($m) => [$m['id'] => $m['profesores']]);

        $profesores = User::role('profesor')->activo()->select('id', 'name', 'sede_id')->orderBy('name')->get();

        $sedes = Sede::activa()->orderBy('nombre')->get()
            ->map(fn ($s) => ['id' => $s->id, 'nombre' => $s->nombre, 'ciudad' => $s->ciudad ?? '']);

        // Total de estudiantes DISTINTOS matriculados activamente en cursos de este año
        $totalEstudiantes = Matricula::whereHas('curso', fn($q) => $q->where('anio', $anio))
            ->where('estado', 'activa')
            ->distinct('estudiante_id')
            ->count('estudiante_id');

        return Inertia::render('Admin/Cursos', [
            'cursos'             => $cursos,
            'materias'           => $materias,
            'profesores'         => $profesores,
            'materiasProfesores' => $materiasProfesores,
            'totalEstudiantes'   => $totalEstudiantes,
            'anio'               => $anio,
            'sedes'              => $sedes,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre'            => 'required|string|max:50',
            'nivel'             => 'required|in:prejardin,preescolar,transicion,primaria,bachillerato',
            'grado'             => 'required|string|max:10',
            'grupo'             => 'required|string|max:5',
            'jornada'           => 'required|string|max:20',
            'cupo_maximo'       => 'nullable|integer|min:1|max:60',
            'director_grupo_id' => 'nullable|exists:users,id',
            'sede_id'           => 'nullable|exists:sedes,id',
            'materias_asignadas'              => 'nullable|array',
            'materias_asignadas.*.materia_id' => 'required|exists:materias,id',
            'materias_asignadas.*.profesor_id'=> 'required|exists:users,id',
        ]);

        $anio = Curso::max('anio') ?? now()->year;
        $materiasData = $data['materias_asignadas'] ?? [];
        unset($data['materias_asignadas']);

        $curso = Curso::create(array_merge($data, ['anio' => $anio, 'activo' => true]));

        // Sincronizar materias asignadas
        $this->syncMaterias($curso, $materiasData);

        return redirect()->back()->with('success', 'Curso creado exitosamente.');
    }

    public function update(Request $request, Curso $curso)
    {
        $data = $request->validate([
            'nombre'            => 'required|string|max:50',
            'nivel'             => 'required|in:prejardin,preescolar,transicion,primaria,bachillerato',
            'grado'             => 'required|string|max:10',
            'grupo'             => 'required|string|max:5',
            'jornada'           => 'required|string|max:20',
            'cupo_maximo'       => 'nullable|integer|min:1|max:60',
            'director_grupo_id' => 'nullable|exists:users,id',
            'sede_id'           => 'nullable|exists:sedes,id',
            'materias_asignadas'              => 'nullable|array',
            'materias_asignadas.*.materia_id' => 'required|exists:materias,id',
            'materias_asignadas.*.profesor_id'=> 'required|exists:users,id',
        ]);

        $materiasData = $data['materias_asignadas'] ?? [];
        unset($data['materias_asignadas']);

        $curso->update($data);

        // Sincronizar materias asignadas
        $this->syncMaterias($curso, $materiasData);

        return redirect()->back()->with('success', 'Curso actualizado.');
    }

    public function destroy(Curso $curso)
    {
        if ($curso->matriculas()->where('estado', 'activa')->count() > 0) {
            return redirect()->back()->withErrors(['error' => 'No se puede eliminar un curso con matrículas activas.']);
        }

        $curso->cursoMaterias()->delete();
        $curso->delete();

        return redirect()->back()->with('success', 'Curso eliminado.');
    }

    /**
     * Sincroniza las materias y profesores asignados a un curso.
     */
    private function syncMaterias(Curso $curso, array $materiasData): void
    {
        // Eliminar las existentes
        $curso->cursoMaterias()->delete();

        // Recrear con los datos nuevos
        foreach ($materiasData as $item) {
            CursoMateria::create([
                'curso_id'   => $curso->id,
                'materia_id' => $item['materia_id'],
                'profesor_id'=> $item['profesor_id'] ?? null,
            ]);
        }
    }
}
