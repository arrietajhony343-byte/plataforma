<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\{Entrega, Matricula, Actividad};
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        // Obtener IDs de cursos donde el estudiante está matriculado
        $cursoIds = Matricula::where('estudiante_id', $user->id)
            ->where('estado', 'activa')
            ->pluck('curso_id');

        // Obtener entregas del estudiante que pertenecen a sus cursos
        $entregas = Entrega::where('estudiante_id', $user->id)
            ->with([
                'actividad.cursoMateria.materia',
                'actividad.cursoMateria.curso',
                'actividad.cursoMateria.profesor'
            ])
            ->get()
            ->filter(function ($entrega) use ($cursoIds) {
                return $cursoIds->contains($entrega->actividad->cursoMateria?->curso_id);
            });

        // Formatear actividades
        $actividades = $entregas->map(function ($entrega) {
            $actividad = $entrega->actividad;
            $estado = $this->estadoConsolidado($actividad, $entrega);
            $limite = $entrega->fechaLimiteEfectiva();

            return [
                'id'               => $actividad->id,
                'titulo'           => $actividad->titulo,
                'materia'          => $actividad->cursoMateria?->materia?->nombre,
                'tipo'             => $actividad->tipo,
                'fechaAsignacion'  => $actividad->fecha_asignacion?->format('d M Y'),
                'fechaEntrega'     => $actividad->fecha_entrega?->format('d M Y H:i'),
                'fechaEntregaISO'  => $actividad->fecha_entrega?->toIso8601String(),
                'estado'           => $estado,
                'peso'             => (float) $actividad->porcentaje,
                'profesor'         => $actividad->cursoMateria?->profesor?->name,
                'prioridad'        => $this->calcularPrioridad($actividad->fecha_entrega),
                'tienePreguntas'   => $actividad->tiene_preguntas,
            ];
        });

        // Separar en pendientes y vencidas
        $pendientes = $actividades
            ->filter(fn($a) => in_array($a['estado'], ['pendiente', 'devuelta']))
            ->sortBy('fechaEntregaISO')
            ->values();

        $vencidas = $actividades
            ->filter(fn($a) => $a['estado'] === 'vencida')
            ->sortByDesc('fechaEntregaISO')
            ->values();

        return Inertia::render('Estudiante/Dashboard', [
            'estudiante' => [
                'nombre'  => $user->name,
                'grado'   => $user->grado ?? 'Sin asignar',
            ],
            'pendientes' => $pendientes,
            'vencidas'   => $vencidas,
        ]);
    }

    /**
     * Determina el estado consolidado de una actividad para el estudiante.
     */
    private function estadoConsolidado(Actividad $actividad, Entrega $entrega): string
    {
        if ($entrega->estado === 'calificada') {
            return 'calificada';
        }
        if ($entrega->estado === 'devuelta') {
            return 'devuelta';
        }
        if (in_array($entrega->estado, ['entregada', 'atrasada'])) {
            return 'entregada';
        }

        // Estado 'pendiente' — verificar si venció
        $limite = $entrega->fechaLimiteEfectiva();
        if ($limite && now()->gt($limite)) {
            return 'vencida';
        }
        return 'pendiente';
    }

    /**
     * Calcula la prioridad basada en la fecha de entrega.
     */
    private function calcularPrioridad($fechaEntrega)
    {
        if (!$fechaEntrega) {
            return 'media';
        }

        $diasRestantes = now()->diffInDays($fechaEntrega, false);
        if ($diasRestantes <= 2) {
            return 'alta';
        }
        if ($diasRestantes <= 7) {
            return 'media';
        }
        return 'baja';
    }
}

