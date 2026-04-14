<?php

namespace App\Http\Controllers\Padre;

use App\Http\Controllers\Controller;
use App\Models\{Actividad, Asistencia, Matricula, Nota, Notificacion, Observacion, Pago, Periodo, User};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $padre = $request->user();

        $hijos = $padre->hijos()
            ->select('users.id', 'users.name')
            ->orderBy('users.name')
            ->get();

        if ($hijos->isEmpty()) {
            return Inertia::render('Padre/Dashboard', [
                'padre' => [
                    'nombre' => $padre->name,
                ],
                'hijos' => [],
                'hijo' => null,
                'proximasActividades' => [],
                'notificaciones' => [],
                'ultimasNotas' => [],
                'estadoPagos' => null,
                'alertas' => [],
            ]);
        }

        $hijoIdSeleccionado = (int) ($request->query('hijo_id') ?: $hijos->first()->id);
        if (!$hijos->pluck('id')->contains($hijoIdSeleccionado)) {
            $hijoIdSeleccionado = (int) $hijos->first()->id;
        }

        $hijo = User::findOrFail($hijoIdSeleccionado);

        $matriculaActiva = Matricula::query()
            ->where('estudiante_id', $hijo->id)
            ->where('estado', 'activa')
            ->with('curso:id,nombre,grado,grupo')
            ->latest('id')
            ->first();

        $cursoMateriaIds = collect();
        if ($matriculaActiva?->curso_id) {
            $cursoMateriaIds = \App\Models\CursoMateria::query()
                ->where('curso_id', $matriculaActiva->curso_id)
                ->pluck('id');
        }

        $periodoActivo = Periodo::query()->where('estado', 'activo')->first();
        $periodoIdRef = $periodoActivo?->id;
        if (!$periodoIdRef) {
            $periodoIdRef = (int) (Nota::query()->where('estudiante_id', $hijo->id)->max('periodo_id') ?: 0);
        }

        $notasRef = Nota::query()
            ->where('estudiante_id', $hijo->id)
            ->when($periodoIdRef > 0, fn($q) => $q->where('periodo_id', $periodoIdRef))
            ->with('cursoMateria.materia:id,nombre')
            ->get();

        $promedio = $notasRef->isNotEmpty() ? round((float) $notasRef->avg('valor'), 1) : 0.0;

        $materiasTotales = $cursoMateriaIds->count() ?: $notasRef
            ->pluck('curso_materia_id')
            ->filter()
            ->unique()
            ->count();

        $materiasAprobadas = $notasRef
            ->groupBy('curso_materia_id')
            ->map(fn($ns) => (float) $ns->avg('valor'))
            ->filter(fn($avg) => $avg >= 3.0)
            ->count();

        $asistenciasRef = Asistencia::query()
            ->where('estudiante_id', $hijo->id)
            ->when($cursoMateriaIds->isNotEmpty(), fn($q) => $q->whereIn('curso_materia_id', $cursoMateriaIds))
            ->whereDate('fecha', '>=', now()->subDays(30))
            ->get();

        $totalAsist = $asistenciasRef->count();
        $presentes = $asistenciasRef->whereIn('estado', ['presente', 'tarde', 'excusa'])->count();
        $asistenciaPct = $totalAsist > 0 ? (int) round(($presentes / $totalAsist) * 100) : 0;

        $ultimasNotas = Nota::query()
            ->where('estudiante_id', $hijo->id)
            ->with('cursoMateria.materia:id,nombre')
            ->latest('updated_at')
            ->limit(6)
            ->get()
            ->map(fn($n) => [
                'materia' => $n->cursoMateria?->materia?->nombre ?? 'Materia',
                'nota' => (float) $n->valor,
                'tipo' => $n->tipo ?: 'nota',
                'fecha' => $n->updated_at?->format('Y-m-d'),
            ])
            ->values();

        $proximasActividades = collect();
        if ($cursoMateriaIds->isNotEmpty()) {
            $proximasActividades = Actividad::query()
                ->whereIn('curso_materia_id', $cursoMateriaIds)
                ->whereDate('fecha_entrega', '>=', now()->toDateString())
                ->with('cursoMateria.materia:id,nombre', 'cursoMateria.profesor:id,name')
                ->orderBy('fecha_entrega')
                ->limit(6)
                ->get()
                ->map(fn($a) => [
                    'id' => $a->id,
                    'materia' => $a->cursoMateria?->materia?->nombre ?? 'Materia',
                    'actividad' => $a->titulo,
                    'fecha' => $a->fecha_entrega?->format('Y-m-d'),
                    'profesor' => $a->cursoMateria?->profesor?->name ?? 'Sin profesor',
                ])
                ->values();
        }

        $notificaciones = Notificacion::query()
            ->where('user_id', $padre->id)
            ->latest('created_at')
            ->limit(8)
            ->get()
            ->map(fn($n) => [
                'id' => $n->id,
                'tipo' => $this->mapNotifType((string) $n->tipo),
                'titulo' => $n->titulo,
                'descripcion' => $n->mensaje,
                'tiempo' => $n->created_at?->diffForHumans(),
                'leida' => (bool) $n->leida,
            ])
            ->values();

        $pagoPendiente = Pago::query()
            ->where('estudiante_id', $hijo->id)
            ->whereIn('estado', ['pendiente', 'vencido'])
            ->orderBy('fecha_vencimiento')
            ->first();

        $ultimoPago = Pago::query()
            ->where('estudiante_id', $hijo->id)
            ->where('estado', 'pagado')
            ->orderByDesc('fecha_pago')
            ->first();

        $estadoPagos = [
            'ultimoPago' => $ultimoPago?->fecha_pago?->format('Y-m') ?? null,
            'proximoPago' => $pagoPendiente?->fecha_vencimiento?->format('Y-m') ?? null,
            'vencimiento' => $pagoPendiente?->fecha_vencimiento?->format('Y-m-d') ?? null,
            'monto' => $pagoPendiente ? (float) $pagoPendiente->monto : 0,
            'estado' => $pagoPendiente?->estado ?? ($ultimoPago ? 'pagado' : 'pendiente'),
        ];

        $alertasAsistencia = Asistencia::query()
            ->where('estudiante_id', $hijo->id)
            ->when($cursoMateriaIds->isNotEmpty(), fn($q) => $q->whereIn('curso_materia_id', $cursoMateriaIds))
            ->whereIn('estado', ['ausente', 'tarde'])
            ->with('cursoMateria.materia:id,nombre')
            ->latest('fecha')
            ->limit(5)
            ->get()
            ->map(fn($a) => [
                'id' => 'asi-' . $a->id,
                'tipo' => 'alerta',
                'origen' => 'asistencia',
                'titulo' => $a->estado === 'ausente' ? 'No entro a clase' : 'Llegada tarde',
                'descripcion' => $a->observacion
                    ?: ($hijo->name . ' registro ' . $a->estado . ' en ' . ($a->cursoMateria?->materia?->nombre ?? 'materia')),
                'fecha' => $a->fecha?->format('Y-m-d'),
            ]);

        $alertasObservador = Observacion::query()
            ->where('estudiante_id', $hijo->id)
            ->where('tipo', 'negativa')
            ->with('materia:id,nombre', 'profesor:id,name')
            ->latest('fecha')
            ->limit(5)
            ->get()
            ->map(fn($o) => [
                'id' => 'obs-' . $o->id,
                'tipo' => 'alerta',
                'origen' => 'observador',
                'titulo' => 'Observacion academica',
                'descripcion' => ($o->materia?->nombre ? $o->materia->nombre . ': ' : '') . $o->descripcion,
                'fecha' => $o->fecha?->format('Y-m-d'),
            ]);

        $alertas = $alertasAsistencia
            ->concat($alertasObservador)
            ->sortByDesc('fecha')
            ->values()
            ->take(6)
            ->values();

        return Inertia::render('Padre/Dashboard', [
            'padre' => [
                'nombre' => $padre->name,
            ],
            'hijos' => $hijos->map(fn($h) => ['id' => $h->id, 'nombre' => $h->name])->values(),
            'hijo' => [
                'id' => $hijo->id,
                'nombre' => $hijo->name,
                'grado' => $matriculaActiva?->curso?->grado ? ($matriculaActiva->curso->grado . '°') : 'Sin grado',
                'seccion' => $matriculaActiva?->curso?->grupo ?? '—',
                'foto' => null,
                'promedio' => $promedio,
                'materias_aprobadas' => $materiasAprobadas,
                'materias_totales' => max($materiasTotales, 1),
                'asistencia' => $asistenciaPct,
            ],
            'proximasActividades' => $proximasActividades,
            'notificaciones' => $notificaciones,
            'ultimasNotas' => $ultimasNotas,
            'estadoPagos' => $estadoPagos,
            'alertas' => $alertas,
        ]);
    }

    private function mapNotifType(string $tipo): string
    {
        return match ($tipo) {
            'nota' => 'nota',
            'actividad' => 'actividad',
            'pago' => 'pago',
            'mensaje' => 'mensaje',
            'alerta', 'asistencia', 'observacion' => 'alerta',
            default => 'mensaje',
        };
    }
}
