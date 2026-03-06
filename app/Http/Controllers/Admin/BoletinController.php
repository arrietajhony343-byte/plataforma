<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Boletin, Nota, User, Curso, Periodo, CursoMateria, Mensaje, Notificacion, Matricula, Sede};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BoletinController extends Controller
{
    public function index(): Response
    {
        // Periodos disponibles
        $periodos = Periodo::orderByDesc('anio')->orderBy('numero')->get();
        $periodoActivo = Periodo::where('activo', true)->first();

        // Cursos activos del año actual
        $cursos = Curso::activo()
            ->orderByRaw("CASE WHEN nivel = 'preescolar' THEN 1 WHEN nivel = 'transicion' THEN 2 WHEN nivel = 'primaria' THEN 3 WHEN nivel = 'bachillerato' THEN 4 ELSE 5 END")
            ->orderBy('grado')
            ->orderBy('grupo')
            ->get();

        // Niveles únicos (normalizar preescolar → transicion)
        $niveles = $cursos->pluck('nivel')
            ->map(fn($n) => $n === 'preescolar' ? 'transicion' : $n)
            ->unique()->values();

        // Sedes activas
        $sedes = Sede::where('activa', true)->orderBy('nombre')
            ->get()->map(fn($s) => ['id' => $s->id, 'nombre' => $s->nombre]);

        // Boletines con relaciones completas
        $boletines = Boletin::with(['estudiante.padres', 'periodo', 'curso'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Boletin $b) {
                $padres = $b->estudiante->padres()
                    ->select('users.id', 'users.name')
                    ->get()
                    ->map(fn($p) => ['id' => $p->id, 'name' => $p->name])
                    ->values();

                // Notas definitivas del estudiante en este período, agrupadas por materia
                $notas = Nota::where('estudiante_id', $b->estudiante_id)
                    ->where('periodo_id', $b->periodo_id)
                    ->where('tipo', 'definitiva')
                    ->with('cursoMateria.materia')
                    ->get()
                    ->filter(fn($n) => $n->cursoMateria?->materia !== null)
                    ->map(fn($n) => [
                        'materia'    => $n->cursoMateria->materia->nombre,
                        'definitiva' => round((float) $n->valor, 1),
                    ])
                    ->values();

                return [
                    'id'               => $b->id,
                    'estudiante_id'    => $b->estudiante_id,
                    'estudiante'       => $b->estudiante->name,
                    'periodo_id'       => $b->periodo_id,
                    'periodo'          => $b->periodo->nombre,
                    'curso_id'         => $b->curso_id,
                    'curso'            => $b->curso->nombre,
                    'nivel'            => $b->curso->nivel,
                    'promedio'         => (float) $b->promedio,
                    'puesto'           => $b->puesto,
                    'observacion'      => $b->observacion_general,
                    'estado'           => $b->estado,
                    'fecha_generacion' => $b->created_at->format('Y-m-d'),
                    'padres'           => $padres,
                    'notas'            => $notas,
                ];
            });

        // Resumen de notas por curso (sólo cursos con notas definitivas)
        $resumenNotas = $cursos->map(function (Curso $curso) use ($periodoActivo) {
            $cmsIds = CursoMateria::where('curso_id', $curso->id)->pluck('id');

            $definitivas = Nota::whereIn('curso_materia_id', $cmsIds)
                ->when($periodoActivo, fn($q) => $q->where('periodo_id', $periodoActivo->id))
                ->where('tipo', 'definitiva')
                ->with('cursoMateria.materia', 'estudiante')
                ->get();

            if ($definitivas->isEmpty()) {
                return null;
            }

            $promedio   = $definitivas->avg('valor') ?? 0;
            $aprobados  = $definitivas->where('valor', '>=', 3.0)->count();
            $reprobados = $definitivas->where('valor', '<', 3.0)->count();
            $total      = Matricula::where('curso_id', $curso->id)->where('estado', 'activa')->count();

            // Mejor y peor materia
            $porMateria = $definitivas->groupBy('curso_materia_id')->map(fn($g) => $g->avg('valor'));
            $mejorCmId  = $porMateria->sortDesc()->keys()->first();
            $peorCmId   = $porMateria->sort()->keys()->first();

            $mejorMateria = $mejorCmId ? CursoMateria::find($mejorCmId)?->materia?->nombre : '-';
            $peorMateria  = $peorCmId ? CursoMateria::find($peorCmId)?->materia?->nombre : '-';

            // Detalle por materia
            $materias = $definitivas
                ->groupBy('curso_materia_id')
                ->map(function ($notas, $cmId) {
                    $nombre = $notas->first()?->cursoMateria?->materia?->nombre ?? 'Desconocida';
                    $avg    = round($notas->avg('valor'), 2);
                    return [
                        'materia'    => $nombre,
                        'promedio'   => $avg,
                        'aprobados'  => $notas->where('valor', '>=', 3.0)->count(),
                        'reprobados' => $notas->where('valor', '<', 3.0)->count(),
                        'total'      => $notas->count(),
                    ];
                })
                ->sortByDesc('promedio')
                ->values();

            // Detalle por estudiante
            $estudiantes = $definitivas
                ->groupBy('estudiante_id')
                ->map(function ($notas) {
                    $nombre   = $notas->first()?->estudiante?->name ?? 'Desconocido';
                    $avg      = round($notas->avg('valor'), 2);
                    return [
                        'nombre'     => $nombre,
                        'promedio'   => $avg,
                        'aprobadas'  => $notas->where('valor', '>=', 3.0)->count(),
                        'reprobadas' => $notas->where('valor', '<', 3.0)->count(),
                        'total'      => $notas->count(),
                    ];
                })
                ->sortByDesc('promedio')
                ->values();

            return [
                'curso_id'         => $curso->id,
                'nivel'            => $curso->nivel,
                'curso'            => $curso->nombre,
                'totalEstudiantes' => $total,
                'promedio'         => round($promedio, 1),
                'aprobados'        => $aprobados,
                'reprobados'       => $reprobados,
                'mejorMateria'     => $mejorMateria,
                'peorMateria'      => $peorMateria,
                'materias'         => $materias,
                'estudiantes'      => $estudiantes,
            ];
        })->filter()->values();

        return Inertia::render('Admin/Boletines', [
            'boletines'     => $boletines,
            'resumenNotas'  => $resumenNotas,
            'periodos'      => $periodos->map(fn($p) => ['id' => $p->id, 'nombre' => $p->nombre, 'anio' => $p->anio, 'activo' => $p->activo]),
            'cursos'        => $cursos->map(fn($c) => ['id' => $c->id, 'nombre' => $c->nombre, 'nivel' => $c->nivel, 'sede_id' => $c->sede_id]),
            'niveles'       => $niveles,
            'sedes'         => $sedes,
            'periodoActivo' => $periodoActivo ? ['id' => $periodoActivo->id, 'nombre' => $periodoActivo->nombre] : null,
        ]);
    }

    /**
     * Generar boletines masivamente
     */
    public function generate(Request $request)
    {
        $data = $request->validate([
            'periodo_id' => 'required|exists:periodos,id',
            'curso_id'   => 'nullable|exists:cursos,id',
            'nivel'      => 'nullable|string',
        ]);

        $query = Matricula::where('periodo_id', $data['periodo_id'])->where('estado', 'activa');

        if (!empty($data['curso_id'])) {
            $query->where('curso_id', $data['curso_id']);
        } elseif (!empty($data['nivel'])) {
            $cursoIds = Curso::where('nivel', $data['nivel'])->pluck('id');
            $query->whereIn('curso_id', $cursoIds);
        }

        $matriculas = $query->with('curso')->get();
        $count = 0;

        foreach ($matriculas as $mat) {
            $promedio = Nota::where('estudiante_id', $mat->estudiante_id)
                ->where('periodo_id', $data['periodo_id'])
                ->where('tipo', 'definitiva')
                ->avg('valor');

            Boletin::updateOrCreate(
                [
                    'estudiante_id' => $mat->estudiante_id,
                    'periodo_id'    => $data['periodo_id'],
                    'curso_id'      => $mat->curso_id,
                ],
                [
                    'promedio'            => round($promedio ?? 0, 1),
                    'observacion_general' => 'Boletín generado automáticamente.',
                    'estado'              => 'generado',
                ]
            );
            $count++;
        }

        return redirect()->back()->with('success', "Se generaron {$count} boletines.");
    }

    /**
     * Notificar a los padres que el boletín está listo
     */
    public function notificar(Boletin $boletin)
    {
        $estudiante = $boletin->estudiante;
        $padres     = $estudiante->padres;
        $periodo    = $boletin->periodo->nombre ?? 'el período actual';

        if ($padres->isEmpty()) {
            return redirect()->back()->with('error', 'El estudiante no tiene acudientes registrados.');
        }

        $admin    = auth()->user();
        $asunto   = "Boletín disponible: {$periodo}";
        $contenido = "Estimado acudiente, le informamos que el boletín de notas de {$estudiante->name} correspondiente a {$periodo} ya está disponible para su consulta. Puede acceder a la plataforma para visualizarlo o descargarlo.";

        foreach ($padres as $padre) {
            Mensaje::create([
                'remitente_id'    => $admin->id,
                'destinatario_id' => $padre->id,
                'asunto'          => $asunto,
                'contenido'       => $contenido,
                'leido'           => false,
            ]);

            Notificacion::create([
                'user_id' => $padre->id,
                'tipo'    => 'nota',
                'titulo'  => $asunto,
                'mensaje' => $contenido,
                'leida'   => false,
            ]);
        }

        // Marcar como entregado
        $boletin->update(['estado' => 'entregado']);

        $count = $padres->count();
        return redirect()->back()->with('success', "Notificación enviada a {$count} acudiente(s).");
    }

    /**
     * Notificar masivamente según filtros
     */
    public function notificarMasivo(Request $request)
    {
        $data = $request->validate([
            'periodo_id' => 'required|exists:periodos,id',
            'curso_id'   => 'nullable|exists:cursos,id',
            'nivel'      => 'nullable|string',
        ]);

        $query = Boletin::where('periodo_id', $data['periodo_id'])
            ->where('estado', 'generado');

        if (!empty($data['curso_id'])) {
            $query->where('curso_id', $data['curso_id']);
        } elseif (!empty($data['nivel'])) {
            $cursoIds = Curso::where('nivel', $data['nivel'])->pluck('id');
            $query->whereIn('curso_id', $cursoIds);
        }

        $boletines = $query->with(['estudiante.padres', 'periodo'])->get();
        $admin     = auth()->user();
        $enviados  = 0;

        foreach ($boletines as $boletin) {
            $estudiante = $boletin->estudiante;
            $padres     = $estudiante->padres;
            $periodo    = $boletin->periodo->nombre ?? 'el período';

            if ($padres->isEmpty()) continue;

            $asunto    = "Boletín disponible: {$periodo}";
            $contenido = "Estimado acudiente, el boletín de notas de {$estudiante->name} correspondiente a {$periodo} ya está disponible para su consulta.";

            foreach ($padres as $padre) {
                Mensaje::create([
                    'remitente_id'    => $admin->id,
                    'destinatario_id' => $padre->id,
                    'asunto'          => $asunto,
                    'contenido'       => $contenido,
                    'leido'           => false,
                ]);

                Notificacion::create([
                    'user_id' => $padre->id,
                    'tipo'    => 'nota',
                    'titulo'  => $asunto,
                    'mensaje' => $contenido,
                    'leida'   => false,
                ]);
            }

            $boletin->update(['estado' => 'entregado']);
            $enviados++;
        }

        return redirect()->back()->with('success', "Se notificaron {$enviados} boletines.");
    }

    /**
     * Marcar boletín individual como enviado
     */
    public function marcarEnviado(Boletin $boletin)
    {
        $boletin->update(['estado' => 'entregado']);
        return redirect()->back()->with('success', 'Boletín marcado como entregado.');
    }
}
