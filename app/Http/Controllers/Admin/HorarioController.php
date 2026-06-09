<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ScopesBySede;
use App\Models\{HorarioBloque, CursoMateria, Curso, User, Materia, Sede, Jornada};
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class HorarioController extends Controller
{
    use ScopesBySede;

    private function normalizeNivel(?string $nivel): string
    {
        $normalized = strtolower(trim((string) $nivel));
        $normalized = strtr($normalized, [
            'á' => 'a',
            'é' => 'e',
            'í' => 'i',
            'ó' => 'o',
            'ú' => 'u',
            'ñ' => 'n',
        ]);
        $normalized = preg_replace('/\s+/', ' ', $normalized) ?? $normalized;

        return $normalized === 'pre jardin' ? 'prejardin' : $normalized;
    }

    private function isNivelInicial(?string $nivel): bool
    {
        return in_array($this->normalizeNivel($nivel), ['prejardin', 'jardin', 'preescolar', 'transicion'], true);
    }

    private function canShareProfesorSlot(CursoMateria $cursoMateria, Collection $conflictos): bool
    {
        if (!$this->isNivelInicial($cursoMateria->curso?->nivel)) {
            return false;
        }

        if ($conflictos->isEmpty()) {
            return true;
        }

        $nivelesValidos = $conflictos->every(fn(HorarioBloque $bloque) => $this->isNivelInicial($bloque->cursoMateria?->curso?->nivel));
        if (!$nivelesValidos) {
            return false;
        }

        // En inicial permitimos clases conjuntas, pero solo hasta 2 cursos simultáneos por docente.
        $cursosSimultaneos = $conflictos
            ->map(fn(HorarioBloque $bloque) => $bloque->cursoMateria?->curso_id)
            ->filter()
            ->push($cursoMateria->curso_id)
            ->unique()
            ->count();

        return $cursosSimultaneos <= 2;
    }

    private function canShareSalonSlot(CursoMateria $cursoMateria, Collection $conflictos): bool
    {
        if (!$this->canShareProfesorSlot($cursoMateria, $conflictos)) {
            return false;
        }

        if (!$cursoMateria->profesor_id) {
            return false;
        }

        return $conflictos->every(fn(HorarioBloque $bloque) => (int) ($bloque->cursoMateria?->profesor_id ?? 0) === (int) $cursoMateria->profesor_id);
    }

    private function normalizeHour(mixed $value): string
    {
        $raw = trim((string) $value);
        if ($raw === '') {
            return '0:00';
        }

        if (preg_match('/^(\d{1,2})$/', $raw, $m)) {
            return ((int) $m[1]) . ':00';
        }

        if (preg_match('/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/', $raw, $m)) {
            return ((int) $m[1]) . ':' . str_pad((string) ((int) $m[2]), 2, '0', STR_PAD_LEFT);
        }

        return $raw;
    }

    private function hourVariants(string $hour): array
    {
        $normalized = $this->normalizeHour($hour);
        [$h, $m] = array_pad(explode(':', $normalized), 2, '00');
        $hInt = (int) $h;
        $mInt = (int) $m;
        $mPad = str_pad((string) $mInt, 2, '0', STR_PAD_LEFT);

        $variants = [
            $hInt . ':' . $mPad,
            str_pad((string) $hInt, 2, '0', STR_PAD_LEFT) . ':' . $mPad,
            $hInt . ':' . $mInt,
            $hInt . ':' . $mPad . ':00',
            str_pad((string) $hInt, 2, '0', STR_PAD_LEFT) . ':' . $mPad . ':00',
        ];

        // Las formas sin minutos solo representan :00; no deben coincidir con 8:45, 9:30, etc.
        if ($mInt === 0) {
            $variants[] = $hInt . ':00';
            $variants[] = str_pad((string) $hInt, 2, '0', STR_PAD_LEFT);
            $variants[] = (string) $hInt;
        }

        return array_values(array_unique($variants));
    }

    private function normalizeJornadaBloques(array $bloques, string $nivel, array $defaults): array
    {
        $base = $defaults[$nivel] ?? $defaults['general'] ?? [];

        $descansoBase = [];
        foreach ($base as $slot) {
            if (!empty($slot['esDescanso'])) {
                $descansoBase[] = $this->normalizeHour($slot['hora'] ?? '') . '-' . $this->normalizeHour($slot['horaFin'] ?? '');
            }
        }

        $items = [];
        foreach ($bloques as $slot) {
            $hora = $this->normalizeHour($slot['hora'] ?? '');
            $horaFin = $this->normalizeHour($slot['horaFin'] ?? '');
            if ($hora === '0:00' || $horaFin === '0:00') {
                continue;
            }

            $key = $hora . '-' . $horaFin;
            $items[$key] = [
                'hora' => $hora,
                'horaFin' => $horaFin,
                'esDescanso' => (bool) ($slot['esDescanso'] ?? in_array($key, $descansoBase, true)),
            ];
        }

        usort($items, fn($a, $b) => strcmp($a['hora'], $b['hora']));

        return array_values($items);
    }
    /* ================================================================
     *  INDEX — Vista principal con todos los datos
     * ================================================================ */
    public function index(): Response
    {
        // Usar el año más reciente con cursos activos (no hardcodear now('America/Bogota')->year)
        $anio = Curso::activo()->max('anio') ?? now('America/Bogota')->year;

        // Cursos activos del año vigente (ordenados para el selector)
        $nivelOrder = ['preescolar' => 1, 'transicion' => 2, 'primaria' => 3, 'secundaria' => 4, 'media' => 5];

        $cursosQuery = Curso::activo()
            ->where('anio', $anio)
            ->when($this->sedeId(), fn($q, $s) => $q->where('sede_id', $s))
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
                        'hora'            => $this->normalizeHour($bloque->hora_inicio),
                        'horaFin'         => $this->normalizeHour($bloque->hora_fin),
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
            ->when($this->sedeId(), fn($q, $s) =>
                $q->whereHas('cursoMaterias.curso', fn($cq) => $cq->where('sede_id', $s)->where('anio', $anio)->where('activo', true))
            )
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

        $sedes = Sede::activa()->orderBy('nombre')
            ->when($this->sedeId(), fn($q, $s) => $q->where('id', $s))
            ->get()
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
            $row = $nivel === 'prejardin'
                ? Jornada::whereIn('nivel', ['prejardin', 'preescolar', 'transicion'])->orderByRaw("CASE nivel WHEN 'prejardin' THEN 0 WHEN 'preescolar' THEN 1 ELSE 2 END")->first()
                : Jornada::where('nivel', $nivel)->first();

            $sourceBloques = $row ? (array) $row->bloques : (array) ($jornadasDefaults[$nivel] ?? $jornadasDefaults['general']);
            $jornadas[$nivel] = $this->normalizeJornadaBloques($sourceBloques, $nivel, $jornadasDefaults);
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
            'hora_inicio'      => ['required', 'regex:/^\d{1,2}(:\d{1,2}(:\d{1,2})?)?$/'],
            'hora_fin'         => ['required', 'regex:/^\d{1,2}(:\d{1,2}(:\d{1,2})?)?$/'],
            'salon'            => 'nullable|string|max:50',
        ]);

        $data['hora_inicio'] = $this->normalizeHour($data['hora_inicio']);
        $data['hora_fin'] = $this->normalizeHour($data['hora_fin']);

        if (strtotime($data['hora_fin']) <= strtotime($data['hora_inicio'])) {
            throw ValidationException::withMessages([
                'hora_fin' => 'La hora de fin debe ser posterior a la hora de inicio.',
            ]);
        }
        $horaVariants = $this->hourVariants($data['hora_inicio']);

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
            ->whereIn('hora_inicio', $horaVariants)
            ->exists();

        if ($conflictoCurso) {
            throw ValidationException::withMessages([
                'hora_inicio' => "El curso {$cm->curso->nombre} ya tiene una clase programada el {$data['dia']} a las {$data['hora_inicio']}.",
            ]);
        }

        // 2) Conflicto: mismo profesor, mismo día, misma hora (en cualquier curso)
        if ($cm->profesor_id) {
            $conflictosProfesor = HorarioBloque::with('cursoMateria.curso')
                ->whereHas('cursoMateria', fn($q) => $q->where('profesor_id', $cm->profesor_id))
                ->where('dia', $data['dia'])
                ->whereIn('hora_inicio', $horaVariants)
                ->get();

            if ($conflictosProfesor->isNotEmpty() && !$this->canShareProfesorSlot($cm, $conflictosProfesor)) {
                throw ValidationException::withMessages([
                    'hora_inicio' => "El profesor {$cm->profesor->name} ya tiene una clase el {$data['dia']} a las {$data['hora_inicio']}.",
                ]);
            }
        }

        // 3) Conflicto: mismo salón, mismo día, misma hora
        if (!empty($data['salon'])) {
            $conflictosSalon = HorarioBloque::with('cursoMateria.curso')
                ->where('salon', $data['salon'])
                ->where('dia', $data['dia'])
                ->whereIn('hora_inicio', $horaVariants)
                ->get();

            if ($conflictosSalon->isNotEmpty() && !$this->canShareSalonSlot($cm, $conflictosSalon)) {
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
            'hora_inicio'      => ['required', 'regex:/^\d{1,2}(:\d{1,2}(:\d{1,2})?)?$/'],
            'hora_fin'         => ['required', 'regex:/^\d{1,2}(:\d{1,2}(:\d{1,2})?)?$/'],
            'salon'            => 'nullable|string|max:50',
        ]);

        $data['hora_inicio'] = $this->normalizeHour($data['hora_inicio']);
        $data['hora_fin'] = $this->normalizeHour($data['hora_fin']);
        $horaVariants = $this->hourVariants($data['hora_inicio']);

        if (strtotime($data['hora_fin']) <= strtotime($data['hora_inicio'])) {
            throw ValidationException::withMessages([
                'hora_fin' => 'La hora de fin debe ser posterior a la hora de inicio.',
            ]);
        }
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
            ->whereIn('hora_inicio', $horaVariants)
            ->where('id', '!=', $horarioBloque->id)
            ->exists();

        if ($conflictoCurso) {
            throw ValidationException::withMessages([
                'hora_inicio' => "El curso {$cm->curso->nombre} ya tiene una clase programada el {$data['dia']} a las {$data['hora_inicio']}.",
            ]);
        }

        // Conflicto profesor
        if ($cm->profesor_id) {
            $conflictosProfesor = HorarioBloque::with('cursoMateria.curso')
                ->whereHas('cursoMateria', fn($q) => $q->where('profesor_id', $cm->profesor_id))
                ->where('dia', $data['dia'])
                ->whereIn('hora_inicio', $horaVariants)
                ->where('id', '!=', $horarioBloque->id)
                ->get();

            if ($conflictosProfesor->isNotEmpty() && !$this->canShareProfesorSlot($cm, $conflictosProfesor)) {
                throw ValidationException::withMessages([
                    'hora_inicio' => "El profesor {$cm->profesor->name} ya tiene una clase el {$data['dia']} a las {$data['hora_inicio']}.",
                ]);
            }
        }

        // Conflicto salón
        if (!empty($data['salon'])) {
            $conflictosSalon = HorarioBloque::with('cursoMateria.curso')
                ->where('salon', $data['salon'])
                ->where('dia', $data['dia'])
                ->whereIn('hora_inicio', $horaVariants)
                ->where('id', '!=', $horarioBloque->id)
                ->get();

            if ($conflictosSalon->isNotEmpty() && !$this->canShareSalonSlot($cm, $conflictosSalon)) {
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
