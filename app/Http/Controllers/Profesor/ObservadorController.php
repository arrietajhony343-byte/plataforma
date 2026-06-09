<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\{Asistencia, Boletin, Curso, CursoMateria, Matricula, Observacion, ObservadorPeriodo, Periodo};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ObservadorController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();
        $anio = now('America/Bogota')->year;

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
                'id'      => $m->estudiante->id,
                'nombre'  => $m->estudiante->name,
                'curso'   => $m->curso->nombre,
                'curso_id' => $m->curso_id,
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
            'id'             => $cm->id,
            'curso_id'       => $cm->curso_id,
            'materia_id'     => $cm->materia_id,
            'materia_nombre' => $cm->materia?->nombre ?? '',
        ]);

        $periodos = Periodo::where('anio', $anio)
            ->orderBy('numero')
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'numero' => $p->numero,
                'fecha_inicio' => $p->fecha_inicio?->format('Y-m-d'),
                'fecha_fin' => $p->fecha_fin?->format('Y-m-d'),
                'estado' => $p->estado,
            ]);

        $directorCursos = Curso::where('director_grupo_id', $user->id)
            ->where('anio', $anio)
            ->orderBy('grado')
            ->orderBy('grupo')
            ->get(['id', 'nombre'])
            ->map(fn($c) => ['id' => $c->id, 'nombre' => $c->nombre])
            ->values();

        $directorCursoIds = $directorCursos->pluck('id');
        $directorEstudiantes = Matricula::whereIn('curso_id', $directorCursoIds)
            ->where('estado', 'activa')
            ->with([
                'estudiante:id,name,documento,fecha_nacimiento,direccion,telefono,foto',
                'estudiante.padres:id,name,telefono',
                'curso:id,nombre,grado,grupo,director_grupo_id',
                'curso.directorGrupo:id,name',
                'periodo:id,nombre',
            ])
            ->get()
            ->map(fn($m) => [
                'estudiante_id' => $m->estudiante_id,
                'estudiante' => $m->estudiante?->name,
                'documento' => $m->estudiante?->documento,
                'fecha_nacimiento' => $m->estudiante?->fecha_nacimiento?->format('Y-m-d'),
                'direccion' => $m->estudiante?->direccion,
                'telefono' => $m->estudiante?->telefono,
                'foto' => $this->resolveFotoUrl($m->estudiante?->foto),
                'acudiente' => $m->estudiante?->padres?->first()?->name,
                'telefono_acudiente' => $m->estudiante?->padres?->first()?->telefono,
                'curso_id' => $m->curso_id,
                'curso' => $m->curso?->nombre,
                'grado' => $m->curso?->grado,
                'grupo' => $m->curso?->grupo,
                'director_grupo' => $m->curso?->directorGrupo?->name,
                'periodo_id' => $m->periodo_id,
                'periodo' => $m->periodo?->nombre,
            ])
            ->filter(fn($m) => !empty($m['estudiante']))
            ->values();

        $boletinObservaciones = Boletin::whereIn('curso_id', $directorCursoIds)
            ->whereHas('periodo', fn($q) => $q->where('anio', $anio))
            ->get(['id', 'estudiante_id', 'curso_id', 'periodo_id', 'observacion_general'])
            ->map(fn($b) => [
                'id' => $b->id,
                'estudiante_id' => $b->estudiante_id,
                'curso_id' => $b->curso_id,
                'periodo_id' => $b->periodo_id,
                'observacion' => $b->observacion_general,
            ])
            ->values();

        $observadorDirector = ObservadorPeriodo::where('director_id', $user->id)
            ->whereHas('periodo', fn($q) => $q->where('anio', $anio))
            ->with(['estudiante:id,name', 'curso:id,nombre', 'periodo:id,nombre'])
            ->latest('updated_at')
            ->limit(120)
            ->get()
            ->map(fn($r) => [
                'id' => $r->id,
                'estudiante_id' => $r->estudiante_id,
                'estudiante' => $r->estudiante?->name,
                'curso_id' => $r->curso_id,
                'curso' => $r->curso?->nombre,
                'periodo_id' => $r->periodo_id,
                'periodo' => $r->periodo?->nombre,
                'fecha_realizacion' => $r->fecha_realizacion?->format('Y-m-d'),
                'fortalezas' => $r->fortalezas,
                'dificultades' => $r->dificultades,
                'compromisos' => $r->compromisos,
                'resumen_general' => $r->resumen_general,
                'ficha' => $r->ficha,
                'estado' => $r->estado,
                'updated_at' => $r->updated_at?->format('Y-m-d H:i'),
            ])
            ->values();

        return Inertia::render('Profesor/Observador', [
            'profesor'       => ['nombre' => $user->name],
            'cursos'         => $cursos,
            'estudiantes'    => $estudiantes,
            'observaciones'  => $observaciones,
            'cursoMaterias'  => $cursoMateriasMap,
            'periodos'       => $periodos,
            'directorCursos' => $directorCursos,
            'directorEstudiantes' => $directorEstudiantes,
            'observadorDirector' => $observadorDirector,
            'boletinObservaciones' => $boletinObservaciones,
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
        $data['fecha']       = now('America/Bogota')->toDateString();

        Observacion::create($data);

        return redirect()->back()->with('success', 'Observación registrada.');
    }

    public function comentariosConsolidados(Request $request)
    {
        $data = $request->validate([
            'estudiante_id' => 'required|exists:users,id',
            'curso_id' => 'required|exists:cursos,id',
            'periodo_id' => 'required|exists:periodos,id',
        ]);

        $this->assertDirectorOwnsCurso(auth()->id(), (int) $data['curso_id']);

        $periodo = Periodo::findOrFail($data['periodo_id']);
        $inicio = $periodo->fecha_inicio;
        $fin = $periodo->fecha_fin;

        $docentes = Observacion::where('estudiante_id', $data['estudiante_id'])
            ->whereBetween('fecha', [$inicio, $fin])
            ->latest('fecha')
            ->limit(8)
            ->get(['id', 'tipo', 'categoria', 'descripcion', 'fecha'])
            ->map(fn($o) => [
                'id' => 'obs-' . $o->id,
                'origen' => 'docente',
                'tipo' => $o->tipo,
                'categoria' => $o->categoria,
                'descripcion' => $o->descripcion,
                'fecha' => $o->fecha?->format('Y-m-d'),
            ])
            ->values();

        $cmIds = CursoMateria::where('curso_id', $data['curso_id'])->pluck('id');
        $asistencia = Asistencia::where('estudiante_id', $data['estudiante_id'])
            ->whereIn('curso_materia_id', $cmIds)
            ->whereBetween('fecha', [$inicio, $fin])
            ->whereNotNull('observacion')
            ->where('observacion', '!=', '')
            ->latest('fecha')
            ->limit(8)
            ->get(['id', 'estado', 'observacion', 'fecha'])
            ->map(fn($a) => [
                'id' => 'asi-' . $a->id,
                'origen' => 'asistencia',
                'tipo' => $a->estado,
                'categoria' => 'Asistencia',
                'descripcion' => $a->observacion,
                'fecha' => $a->fecha?->format('Y-m-d'),
            ])
            ->values();

        return response()->json([
            'comentarios_docentes' => $docentes,
            'comentarios_asistencia' => $asistencia,
            'total' => $docentes->count() + $asistencia->count(),
        ]);
    }

    public function storeDirectorReporte(Request $request)
    {
        $data = $request->validate([
            'estudiante_id' => 'required|exists:users,id',
            'curso_id' => 'required|exists:cursos,id',
            'periodo_id' => 'required|exists:periodos,id',
            'fecha_realizacion' => 'nullable|date',
            'resumen_general' => 'nullable|string|max:3000',
            'fortalezas' => 'nullable|string|max:3000',
            'dificultades' => 'nullable|string|max:3000',
            'compromisos' => 'nullable|string|max:3000',
            'ficha' => 'nullable|array',
        ]);

        $directorId = auth()->id();
        $this->assertDirectorOwnsCurso($directorId, (int) $data['curso_id']);

        $matricula = Matricula::where('estudiante_id', $data['estudiante_id'])
            ->where('curso_id', $data['curso_id'])
            ->where('periodo_id', $data['periodo_id'])
            ->where('estado', 'activa')
            ->first();

        if (!$matricula) {
            return redirect()->back()->with('error', 'El estudiante no tiene matrícula activa en ese curso y período.');
        }

        $fortalezas = trim((string) ($data['fortalezas'] ?? ''));
        $dificultades = trim((string) ($data['dificultades'] ?? ''));
        $compromisos = trim((string) ($data['compromisos'] ?? ''));
        $estado = ($fortalezas !== '' && $dificultades !== '' && $compromisos !== '') ? 'completo' : 'borrador';

        ObservadorPeriodo::updateOrCreate(
            [
                'estudiante_id' => $data['estudiante_id'],
                'curso_id' => $data['curso_id'],
                'periodo_id' => $data['periodo_id'],
            ],
            [
                'director_id' => $directorId,
                'fecha_realizacion' => $data['fecha_realizacion'] ?? now('America/Bogota')->toDateString(),
                'resumen_general' => trim((string) ($data['resumen_general'] ?? '')),
                'fortalezas' => $fortalezas,
                'dificultades' => $dificultades,
                'compromisos' => $compromisos,
                'ficha' => $data['ficha'] ?? null,
                'estado' => $estado,
            ]
        );

        return redirect()->back()->with('success', 'Observador de período guardado.');
    }

    public function storeBoletinObservacion(Request $request)
    {
        $data = $request->validate([
            'estudiante_id' => 'required|exists:users,id',
            'curso_id' => 'required|exists:cursos,id',
            'periodo_id' => 'required|exists:periodos,id',
            'observacion_general' => 'required|string|min:8|max:2500',
        ]);

        $directorId = auth()->id();
        $this->assertDirectorOwnsCurso($directorId, (int) $data['curso_id']);

        $matricula = Matricula::where('estudiante_id', $data['estudiante_id'])
            ->where('curso_id', $data['curso_id'])
            ->where('periodo_id', $data['periodo_id'])
            ->where('estado', 'activa')
            ->exists();

        if (!$matricula) {
            return redirect()->back()->with('error', 'El estudiante no tiene matrícula activa en ese curso y período.');
        }

        $boletin = Boletin::firstOrNew([
            'estudiante_id' => $data['estudiante_id'],
            'periodo_id' => $data['periodo_id'],
        ]);

        $boletin->curso_id = $data['curso_id'];
        $boletin->observacion_general = trim($data['observacion_general']);
        if (!$boletin->exists) {
            $boletin->estado = 'borrador';
        }
        $boletin->save();

        return redirect()->back()->with('success', 'Observación de boletín guardada por el director de grupo.');
    }

    private function assertDirectorOwnsCurso(int $directorId, int $cursoId): void
    {
        $esDirector = Curso::where('id', $cursoId)
            ->where('director_grupo_id', $directorId)
            ->exists();

        abort_unless($esDirector, 403, 'No tienes permisos de director para este curso.');
    }

    private function resolveFotoUrl(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        if (str_starts_with($value, '/storage/') || str_starts_with($value, 'http://') || str_starts_with($value, 'https://')) {
            return $value;
        }

        return Storage::url($value);
    }
}
