<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ScopesBySede;
use App\Models\{Curso, Materia, CursoMateria, User, Matricula, Sede};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CursoController extends Controller
{
    use ScopesBySede;

    public function index(): Response
    {
        $anio = Curso::max('anio') ?? now()->year;

        $cursos = Curso::where('anio', $anio)
            ->when($this->sedeId(), fn($q, $sedeId) => $q->where('sede_id', $sedeId))
            ->with(['directorGrupo', 'cursoMaterias.materia', 'cursoMaterias.profesor', 'sede'])
            ->orderBy('nivel')->orderBy('grado')->orderBy('grupo')
            ->get()
            ->map(function (Curso $c) {
                // Contar estudiantes DISTINTOS con matrícula activa en este curso
                $estudiantesCount = Matricula::where('curso_id', $c->id)
                    ->where('estado', 'activa')
                    ->distinct('estudiante_id')
                    ->count('estudiante_id');

                $estudiantesList = Matricula::where('matriculas.curso_id', $c->id)
                    ->where('matriculas.estado', 'activa')
                    ->join('users', 'users.id', '=', 'matriculas.estudiante_id')
                    ->select('users.id', 'users.name')
                    ->orderBy('users.name')
                    ->get()
                    ->map(fn($u) => ['id' => $u->id, 'name' => $u->name])
                    ->values()
                    ->toArray();

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
                    'estudiantes_lista'=> $estudiantesList,
                    'activo'           => $c->activo,
                    'sede_id'          => $c->sede_id,
                    'sede_nombre'      => $c->sede?->nombre ?? null,
                    'imagen'           => $this->resolveImageUrl($c->imagen, '/images/presets/curso-default.svg'),
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
                'imagen'         => $this->resolveImageUrl($m->imagen, '/images/presets/materia-default.svg'),
            ]);

        // Mapa materia_id → [{ id, name }] para filtrar el selector de profesor en el modal de curso
        $materiasProfesores = $materias->mapWithKeys(fn($m) => [$m['id'] => $m['profesores']]);

        $profesores = User::role('profesor')->activo()->select('id', 'name', 'sede_id')->orderBy('name')->get();

        $sedes = Sede::activa()->orderBy('nombre')
            ->when($this->sedeId(), fn($q, $s) => $q->where('id', $s))
            ->get()
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
            'imagen_preset'      => 'nullable|string|max:255',
            'imagen_file'        => 'nullable|image|max:4096',
        ]);

        $anio = Curso::max('anio') ?? now()->year;
        $materiasData = $data['materias_asignadas'] ?? [];
        unset($data['materias_asignadas']);

        $curso = Curso::create(array_merge($data, [
            'anio' => $anio,
            'activo' => true,
            'imagen' => $this->resolveImageInput($request),
        ]));

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
            'imagen_preset'      => 'nullable|string|max:255',
            'imagen_file'        => 'nullable|image|max:4096',
        ]);

        $materiasData = $data['materias_asignadas'] ?? [];
        unset($data['materias_asignadas']);

        $data['imagen'] = $this->resolveImageInput($request, $curso->imagen);
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

    private function resolveImageInput(Request $request, ?string $current = null): string
    {
        if ($request->hasFile('imagen_file')) {
            if ($current && !str_starts_with($current, '/images/presets/')) {
                Storage::disk('public')->delete($current);
            }

            return $request->file('imagen_file')->store('catalogo/cursos', 'public');
        }

        $preset = $request->input('imagen_preset');
        if (is_string($preset) && $preset !== '') {
            return $preset;
        }

        return $current ?: '/images/presets/curso-default.svg';
    }

    private function resolveImageUrl(?string $value, string $fallback): string
    {
        if (!$value) {
            return $fallback;
        }

        if (str_starts_with($value, '/images/') || str_starts_with($value, 'http://') || str_starts_with($value, 'https://') || str_starts_with($value, '/storage/')) {
            return $value;
        }

        return Storage::url($value);
    }
}
