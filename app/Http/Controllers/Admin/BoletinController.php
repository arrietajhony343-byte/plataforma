<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Boletin, Nota, User, Curso, Periodo, CursoMateria};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BoletinController extends Controller
{
    public function index(): Response
    {
        $boletines = Boletin::with(['estudiante', 'periodo', 'curso'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn(Boletin $b) => [
                'id'               => $b->id,
                'estudiante'       => $b->estudiante->name,
                'nivel'            => $b->curso->nivel,
                'curso'            => $b->curso->nombre,
                'periodo'          => $b->periodo->nombre,
                'promedio'         => (float) $b->promedio,
                'estado'           => $b->estado,
                'fecha_generacion' => $b->created_at->format('Y-m-d'),
            ]);

        // Resumen de notas por curso
        $periodos = Periodo::orderByDesc('anio')->orderBy('numero')->get();
        $cursos   = Curso::activo()->where('anio', now()->year)->get();

        $resumenNotas = $cursos->map(function (Curso $curso) {
            $cmsIds = CursoMateria::where('curso_id', $curso->id)->pluck('id');

            $definitivas = Nota::whereIn('curso_materia_id', $cmsIds)
                ->where('tipo', 'definitiva')
                ->get();

            $promedio  = $definitivas->avg('valor') ?? 0;
            $aprobados = $definitivas->where('valor', '>=', 3.0)->count();
            $reprobados= $definitivas->where('valor', '<', 3.0)->count();

            // Mejor y peor materia
            $porMateria = $definitivas->groupBy('curso_materia_id')->map(fn($g) => $g->avg('valor'));
            $mejorCmId  = $porMateria->sortDesc()->keys()->first();
            $peorCmId   = $porMateria->sort()->keys()->first();

            $mejorMateria = $mejorCmId ? CursoMateria::find($mejorCmId)?->materia?->nombre : '-';
            $peorMateria  = $peorCmId ? CursoMateria::find($peorCmId)?->materia?->nombre : '-';

            return [
                'nivel'        => $curso->nivel,
                'curso'        => $curso->nombre,
                'promedio'     => round($promedio, 1),
                'aprobados'    => $aprobados,
                'reprobados'   => $reprobados,
                'mejorMateria' => $mejorMateria,
                'peorMateria'  => $peorMateria,
            ];
        });

        return Inertia::render('Admin/Boletines', [
            'boletines'    => $boletines,
            'resumenNotas' => $resumenNotas,
            'periodos'     => $periodos->map(fn($p) => ['id' => $p->id, 'nombre' => $p->nombre, 'anio' => $p->anio]),
            'cursos'       => $cursos->map(fn($c) => ['id' => $c->id, 'nombre' => $c->nombre, 'nivel' => $c->nivel]),
        ]);
    }

    public function generate(Request $request)
    {
        // Generar boletines para un periodo/curso específico
        $data = $request->validate([
            'periodo_id' => 'required|exists:periodos,id',
            'curso_id'   => 'nullable|exists:cursos,id',
        ]);

        $query = \App\Models\Matricula::where('periodo_id', $data['periodo_id'])->where('estado', 'activa');

        if (isset($data['curso_id'])) {
            $query->where('curso_id', $data['curso_id']);
        }

        $matriculas = $query->get();

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
        }

        return redirect()->back()->with('success', "Se generaron {$matriculas->count()} boletines.");
    }
}
