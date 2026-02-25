<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{HorarioBloque, CursoMateria, Curso, User, Materia};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HorarioController extends Controller
{
    public function index(): Response
    {
        $anio = now()->year;

        // Datos de profesores con sus materias y cursos
        $profesores = User::role('profesor')->activo()
            ->with(['cursoMaterias' => fn($q) => $q->with('materia', 'curso', 'horarioBloques')
                ->whereHas('curso', fn($cq) => $cq->where('anio', $anio))])
            ->get()
            ->map(function (User $p) {
                $materias = $p->cursoMaterias->pluck('materia.nombre')->unique()->values()->toArray();
                $cursos   = $p->cursoMaterias->pluck('curso.nombre')->unique()->values()->toArray();
                $horas    = $p->cursoMaterias->sum(fn($cm) => $cm->horarioBloques->count());

                return [
                    'id'             => $p->id,
                    'nombre'         => $p->name,
                    'especialidad'   => $materias[0] ?? 'General',
                    'materias'       => $materias,
                    'cursos'         => $cursos,
                    'horasSemanales' => $horas,
                    'maxHoras'       => 30,
                    'email'          => $p->email,
                    'telefono'       => $p->telefono,
                ];
            });

        // Bloques de horario organizados por curso
        $cursos = Curso::activo()->where('anio', $anio)
            ->with(['cursoMaterias.horarioBloques', 'cursoMaterias.materia', 'cursoMaterias.profesor'])
            ->get();

        $horarios = [];
        foreach ($cursos as $curso) {
            foreach ($curso->cursoMaterias as $cm) {
                foreach ($cm->horarioBloques as $bloque) {
                    $horarios[] = [
                        'id'        => $bloque->id,
                        'curso'     => $curso->nombre,
                        'curso_id'  => $curso->id,
                        'materia'   => $cm->materia->nombre,
                        'profesor'  => $cm->profesor->name,
                        'dia'       => $bloque->dia,
                        'hora'      => $bloque->hora_inicio,
                        'horaFin'   => $bloque->hora_fin,
                        'salon'     => $bloque->salon,
                    ];
                }
            }
        }

        $materias = Materia::activa()->select('id', 'nombre')->get();

        return Inertia::render('Admin/Horarios', [
            'profesores'  => $profesores,
            'horarios'    => $horarios,
            'cursos'      => $cursos->map(fn($c) => ['id' => $c->id, 'nombre' => $c->nombre]),
            'materias'    => $materias,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'curso_materia_id' => 'required|exists:curso_materia,id',
            'dia'              => 'required|in:lunes,martes,miercoles,jueves,viernes',
            'hora_inicio'      => 'required|date_format:H:i',
            'hora_fin'         => 'required|date_format:H:i|after:hora_inicio',
            'salon'            => 'nullable|string|max:50',
        ]);

        HorarioBloque::create($data);

        return redirect()->back()->with('success', 'Bloque de horario creado.');
    }

    public function update(Request $request, HorarioBloque $horarioBloque)
    {
        $data = $request->validate([
            'curso_materia_id' => 'required|exists:curso_materia,id',
            'dia'              => 'required|in:lunes,martes,miercoles,jueves,viernes',
            'hora_inicio'      => 'required|date_format:H:i',
            'hora_fin'         => 'required|date_format:H:i|after:hora_inicio',
            'salon'            => 'nullable|string|max:50',
        ]);

        $horarioBloque->update($data);

        return redirect()->back()->with('success', 'Bloque actualizado.');
    }

    public function destroy(HorarioBloque $horarioBloque)
    {
        $horarioBloque->delete();
        return redirect()->back()->with('success', 'Bloque eliminado.');
    }
}
