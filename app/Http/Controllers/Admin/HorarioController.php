<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{HorarioBloque, CursoMateria, Curso, User, Materia, Sede, Jornada};
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class HorarioController extends Controller
{
    /* ================================================================
     *  INDEX — Vista principal con todos los datos
     * ================================================================ */
    public function index(): Response
    {
        // Usar el año más reciente con cursos activos (no hardcodear now()->year)
        $anio = Curso::activo()->max('anio') ?? now()->year;

        // Cursos activos del año vigente (ordenados para el selector)
        $nivelOrder = ['preescolar' => 1, 'transicion' => 2, 'primaria' => 3, 'secundaria' => 4, 'media' => 5];

        $cursosQuery = Curso::activo()
            ->where('anio', $anio)
            ->with(['cursoMaterias.horarioBloques', 'cursoMaterias.materia', 'cursoMaterias.profesor', 'sede'])
            ->orderBy('grado')
            ->orderBy('grupo')
            ->get()
            ->sortBy(fn($c) => ($nivelOrder[strtolower($c->nivel ?? '')] ?? 9) . '-' . str_pad($c->grado ?? 0, 3, '0', STR_PAD_LEFT) . '-' . ($c->grupo ?? ''))
            ->values();

        // Bloques de horario planos para la vista
        $horarios = [];
        foreach ($cursosQuery as $curso) {
            foreach ($curso->cursoMaterias as $cm) {
                foreach ($cm->horarioBloques as $bloque) {
                    $horarios[] = [
                        'id'              => $bloque->id,
                        'curso_materia_id'=> $cm->id,
                        'curso'           => $curso->nombre,
                        'curso_id'        => $curso->id,
                        'materia'         => $cm->materia->nombre,
                        'materia_id'      => $cm->materia_id,
                        'profesor'        => $cm->profesor ? $cm->profesor->name : '—',
                        'profesor_id'     => $cm->profesor_id,
                        'dia'             => $bloque->dia,
                        'hora'            => $bloque->hora_inicio,
                        'horaFin'         => $bloque->hora_fin,
                        'salon'           => $bloque->salon ?? '',
                        'sede_id'         => $curso->sede_id,
                        'sede_nombre'     => $curso->sede?->nombre ?? null,
                    ];
                }
            }
        }

        // CursoMaterias para los selects del formulario
        $cursoMaterias = CursoMateria::with(['curso', 'materia', 'profesor'])
            ->whereHas('curso', fn($q) => $q->where('anio', $anio)->where('activo', true))
            ->get()
            ->sortBy(fn($cm) => $cm->curso->nombre . $cm->materia->nombre)
            ->values()
            ->map(fn($cm) => [
                'id'          => $cm->id,
                'curso_id'    => $cm->curso_id,
                'curso'       => $cm->curso->nombre,
                'materia_id'  => $cm->materia_id,
                'materia'     => $cm->materia->nombre,
                'profesor_id' => $cm->profesor_id,
                'profesor'    => $cm->profesor ? $cm->profesor->name : null,
            ]);

        // Profesores con carga horaria real
        $profesores = User::role('profesor')->activo()
            ->with(['cursoMaterias' => fn($q) => $q->with('materia', 'curso', 'horarioBloques')
                ->whereHas('curso', fn($cq) => $cq->where('anio', $anio)->where('activo', true))])
            ->get()
            ->map(function (User $p) {
                $cms      = $p->cursoMaterias;
                $materias = $cms->pluck('materia.nombre')->unique()->sort()->values()->toArray();
                $cursos   = $cms->pluck('curso.nombre')->unique()->sort()->values()->toArray();
                $horas    = $cms->sum(fn($cm) => $cm->horarioBloques->count());

                return [
                    'id'             => $p->id,
                    'nombre'         => $p->name,
                    'especialidad'   => $materias[0] ?? 'General',
                    'materias'       => $materias,
                    'cursos'         => $cursos,
                    'horasSemanales' => $horas,
                    'maxHoras'       => 30,
                    'email'          => $p->email,
                    'telefono'       => $p->telefono ?? '',
                ];
            })
            ->filter(fn($p) => !empty($p['materias']))  // solo profesores con materias asignadas en este año
            ->sortBy('nombre')
            ->values();

        $materias = Materia::activa()->select('id', 'nombre')->orderBy('nombre')->get();

        $sedes = Sede::activa()->orderBy('nombre')->get()
            ->map(fn ($s) => ['id' => $s->id, 'nombre' => $s->nombre, 'ciudad' => $s->ciudad ?? '']);

        // Jornadas configuradas por nivel (defaults si aún no existen)
        $jornadasDefaults = [
            'general'      => [
                ['hora'=>'7:00','horaFin'=>'7:50'],['hora'=>'7:50','horaFin'=>'8:40'],
                ['hora'=>'8:40','horaFin'=>'9:30'],['hora'=>'9:30','horaFin'=>'10:00','esDescanso'=>true],
                ['hora'=>'10:00','horaFin'=>'10:50'],['hora'=>'10:50','horaFin'=>'11:40'],
                ['hora'=>'11:40','horaFin'=>'12:00','esDescanso'=>true],
                ['hora'=>'12:00','horaFin'=>'12:50'],['hora'=>'12:50','horaFin'=>'13:40'],
            ],
            'prejardin'    => [
                ['hora'=>'7:00','horaFin'=>'7:50'],['hora'=>'7:50','horaFin'=>'8:40'],
                ['hora'=>'8:40','horaFin'=>'9:10','esDescanso'=>true],
                ['hora'=>'9:10','horaFin'=>'10:00'],['hora'=>'10:00','horaFin'=>'10:50'],
                ['hora'=>'10:50','horaFin'=>'11:15','esDescanso'=>true],['hora'=>'11:15','horaFin'=>'12:05'],
            ],
            'primaria'     => null, // fallback a general
            'bachillerato' => null,
        ];

        $jornadas = [];
        foreach (array_keys($jornadasDefaults) as $nivel) {
            $row = Jornada::where('nivel', $nivel)->first();
            $jornadas[$nivel] = $row ? $row->bloques : ($jornadasDefaults[$nivel] ?? $jornadasDefaults['general']);
        }

        return Inertia::render('Admin/Horarios', [
            'profesores'    => $profesores,
            'horarios'      => $horarios,
            'cursos'        => $cursosQuery->map(fn($c) => ['id' => $c->id, 'nombre' => $c->nombre, 'sede_id' => $c->sede_id, 'nivel' => $c->nivel]),
            'materias'      => $materias,
            'cursoMaterias' => $cursoMaterias,
            'anioVigente'   => $anio,
            'sedes'         => $sedes,
            'jornadas'      => $jornadas,
        ]);
    }

    /* ================================================================
     *  STORE — Crear bloque con validación de conflictos
     * ================================================================ */
    public function store(Request $request)
    {
        $data = $request->validate([
            'curso_materia_id' => 'required|exists:curso_materia,id',
            'dia'              => 'required|in:lunes,martes,miercoles,jueves,viernes',
            'hora_inicio'      => ['required', 'regex:/^\d{1,2}:\d{2}$/'],
            'hora_fin'         => ['required', 'regex:/^\d{1,2}:\d{2}$/'],
            'salon'            => 'nullable|string|max:50',
        ]);

        if (strtotime($data['hora_fin']) <= strtotime($data['hora_inicio'])) {
            throw ValidationException::withMessages([
                'hora_fin' => 'La hora de fin debe ser posterior a la hora de inicio.',
            ]);
        }

        // Normalizar horas: '07:00' → '7:00' (quitar cero inicial)
        $normHora = fn(string $h): string => (int) explode(':', $h)[0] . ':' . explode(':', $h)[1];
        $data['hora_inicio'] = $normHora($data['hora_inicio']);
        $data['hora_fin']    = $normHora($data['hora_fin']);

        $cm = CursoMateria::with('curso', 'materia', 'profesor')->findOrFail($data['curso_materia_id']);

        // Verificar que el curso_materia tiene un profesor asignado
        if (!$cm->profesor_id) {
            throw ValidationException::withMessages([
                'curso_materia_id' => "La materia '{$cm->materia->nombre}' del curso '{$cm->curso->nombre}' no tiene un profesor asignado. Asigna un profesor en la sección Cursos antes de programar clases.",
            ]);
        }

        // 1) Conflicto: mismo curso, mismo día, misma hora
        $conflictoCurso = HorarioBloque::whereHas('cursoMateria', fn($q) => $q->where('curso_id', $cm->curso_id))
            ->where('dia', $data['dia'])
            ->where('hora_inicio', $data['hora_inicio'])
            ->exists();

        if ($conflictoCurso) {
            throw ValidationException::withMessages([
                'hora_inicio' => "El curso {$cm->curso->nombre} ya tiene una clase programada el {$data['dia']} a las {$data['hora_inicio']}.",
            ]);
        }

        // 2) Conflicto: mismo profesor, mismo día, misma hora (en cualquier curso)
        if ($cm->profesor_id) {
            $conflictoProfesor = HorarioBloque::whereHas('cursoMateria', fn($q) => $q->where('profesor_id', $cm->profesor_id))
                ->where('dia', $data['dia'])
                ->where('hora_inicio', $data['hora_inicio'])
                ->exists();

            if ($conflictoProfesor) {
                throw ValidationException::withMessages([
                    'hora_inicio' => "El profesor {$cm->profesor->name} ya tiene una clase el {$data['dia']} a las {$data['hora_inicio']}.",
                ]);
            }
        }

        // 3) Conflicto: mismo salón, mismo día, misma hora
        if (!empty($data['salon'])) {
            $conflictoSalon = HorarioBloque::where('salon', $data['salon'])
                ->where('dia', $data['dia'])
                ->where('hora_inicio', $data['hora_inicio'])
                ->exists();

            if ($conflictoSalon) {
                throw ValidationException::withMessages([
                    'salon' => "El aula {$data['salon']} ya está ocupada el {$data['dia']} a las {$data['hora_inicio']}.",
                ]);
            }
        }

        HorarioBloque::create($data);

        return redirect()->back()->with('success', 'Clase asignada correctamente.');
    }

    /* ================================================================
     *  UPDATE — Editar bloque con mismas validaciones
     * ================================================================ */
    public function update(Request $request, HorarioBloque $horarioBloque)
    {
        $data = $request->validate([
            'curso_materia_id' => 'required|exists:curso_materia,id',
            'dia'              => 'required|in:lunes,martes,miercoles,jueves,viernes',
            'hora_inicio'      => ['required', 'regex:/^\d{1,2}:\d{2}$/'],
            'hora_fin'         => ['required', 'regex:/^\d{1,2}:\d{2}$/'],
            'salon'            => 'nullable|string|max:50',
        ]);

        if (strtotime($data['hora_fin']) <= strtotime($data['hora_inicio'])) {
            throw ValidationException::withMessages([
                'hora_fin' => 'La hora de fin debe ser posterior a la hora de inicio.',
            ]);
        }
        // Normalizar horas: '07:00' → '7:00'
        $normHora = fn(string $h): string => (int) explode(':', $h)[0] . ':' . explode(':', $h)[1];
        $data['hora_inicio'] = $normHora($data['hora_inicio']);
        $data['hora_fin']    = $normHora($data['hora_fin']);
        $cm = CursoMateria::with('curso', 'materia', 'profesor')->findOrFail($data['curso_materia_id']);

        // Verificar que el curso_materia tiene un profesor asignado
        if (!$cm->profesor_id) {
            throw ValidationException::withMessages([
                'curso_materia_id' => "La materia '{$cm->materia->nombre}' no tiene un profesor asignado. Asigna uno en Cursos antes de programar clases.",
            ]);
        }

        // Conflicto curso (excluir el bloque actual)
        $conflictoCurso = HorarioBloque::whereHas('cursoMateria', fn($q) => $q->where('curso_id', $cm->curso_id))
            ->where('dia', $data['dia'])
            ->where('hora_inicio', $data['hora_inicio'])
            ->where('id', '!=', $horarioBloque->id)
            ->exists();

        if ($conflictoCurso) {
            throw ValidationException::withMessages([
                'hora_inicio' => "El curso {$cm->curso->nombre} ya tiene una clase programada el {$data['dia']} a las {$data['hora_inicio']}.",
            ]);
        }

        // Conflicto profesor
        if ($cm->profesor_id) {
            $conflictoProfesor = HorarioBloque::whereHas('cursoMateria', fn($q) => $q->where('profesor_id', $cm->profesor_id))
                ->where('dia', $data['dia'])
                ->where('hora_inicio', $data['hora_inicio'])
                ->where('id', '!=', $horarioBloque->id)
                ->exists();

            if ($conflictoProfesor) {
                throw ValidationException::withMessages([
                    'hora_inicio' => "El profesor {$cm->profesor->name} ya tiene una clase el {$data['dia']} a las {$data['hora_inicio']}.",
                ]);
            }
        }

        // Conflicto salón
        if (!empty($data['salon'])) {
            $conflictoSalon = HorarioBloque::where('salon', $data['salon'])
                ->where('dia', $data['dia'])
                ->where('hora_inicio', $data['hora_inicio'])
                ->where('id', '!=', $horarioBloque->id)
                ->exists();

            if ($conflictoSalon) {
                throw ValidationException::withMessages([
                    'salon' => "El aula {$data['salon']} ya está ocupada el {$data['dia']} a las {$data['hora_inicio']}.",
                ]);
            }
        }

        $horarioBloque->update($data);

        return redirect()->back()->with('success', 'Bloque actualizado correctamente.');
    }

    /* ================================================================
     *  DESTROY
     * ================================================================ */
    public function destroy(HorarioBloque $horarioBloque)
    {
        $horarioBloque->delete();
        return redirect()->back()->with('success', 'Bloque eliminado.');
    }
}
