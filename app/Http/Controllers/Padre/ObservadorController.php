<?php

namespace App\Http\Controllers\Padre;

use App\Http\Controllers\Controller;
use App\Models\{Boletin, Matricula, Observacion, ObservadorPeriodo, Periodo, User};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ObservadorController extends Controller
{
    public function index(Request $request): Response
    {
        $padre = $request->user();

        $hijos = $padre->hijos()
            ->select('users.id', 'users.name')
            ->orderBy('users.name')
            ->get();

        if ($hijos->isEmpty()) {
            return Inertia::render('Padre/Observador', [
                'padre' => ['nombre' => $padre->name],
                'hijos' => [],
                'hijo' => null,
                'periodos' => [],
                'periodoSeleccionadoId' => null,
                'stats' => [
                    'total' => 0,
                    'positivas' => 0,
                    'negativas' => 0,
                ],
                'observador' => null,
                'boletinObservacion' => null,
                'comentarios' => [],
                'historial' => [],
            ]);
        }

        $hijoId = (int) ($request->query('hijo_id') ?: $hijos->first()->id);
        if (!$hijos->pluck('id')->contains($hijoId)) {
            $hijoId = (int) $hijos->first()->id;
        }

        $hijo = $padre->hijos()
            ->where('users.id', $hijoId)
            ->with([
                'padres:id,name,telefono',
                'matriculas' => fn($q) => $q
                    ->where('estado', 'activa')
                    ->latest('id')
                    ->with([
                        'curso:id,nombre,grado,grupo,anio,director_grupo_id',
                        'curso.directorGrupo:id,name',
                    ]),
            ])
            ->firstOrFail();

        $matricula = $hijo->matriculas->first();
        $anio = (int) ($matricula?->curso?->anio ?? (Periodo::max('anio') ?: now('America/Bogota')->year));

        $periodos = Periodo::query()
            ->where('anio', $anio)
            ->orderBy('numero')
            ->get();

        if ($periodos->isEmpty()) {
            $periodos = Periodo::query()
                ->orderByDesc('anio')
                ->orderBy('numero')
                ->get();
        }

        $periodoSeleccionadoId = (int) ($request->query('periodo_id') ?: 0);
        if (!$periodos->pluck('id')->contains($periodoSeleccionadoId)) {
            $periodoSeleccionadoId = (int) ($periodos->firstWhere('estado', 'activo')?->id ?: ($periodos->first()?->id ?: 0));
        }

        $periodoSel = $periodos->firstWhere('id', $periodoSeleccionadoId);

        $comentariosQuery = Observacion::query()
            ->where('estudiante_id', $hijo->id)
            ->with(['materia:id,nombre', 'profesor:id,name'])
            ->orderByDesc('fecha')
            ->orderByDesc('id');

        if ($periodoSel?->fecha_inicio) {
            $comentariosQuery->whereDate('fecha', '>=', $periodoSel->fecha_inicio);
        }
        if ($periodoSel?->fecha_fin) {
            $comentariosQuery->whereDate('fecha', '<=', $periodoSel->fecha_fin);
        }

        $comentarios = $comentariosQuery->get()->map(fn(Observacion $o) => [
            'id' => $o->id,
            'fecha' => $o->fecha?->format('Y-m-d'),
            'materia' => $o->materia?->nombre ?? 'General',
            'profesor' => $o->profesor?->name ?? 'Docente',
            'tipo' => $o->tipo,
            'categoria' => $o->categoria,
            'descripcion' => $o->descripcion,
        ])->values();

        $observadorBase = ObservadorPeriodo::query()
            ->where('estudiante_id', $hijo->id)
            ->where('periodo_id', $periodoSeleccionadoId)
            ->with([
                'director:id,name',
                'curso:id,nombre,grado,grupo',
                'periodo:id,nombre,numero,anio',
            ]);

        $observador = null;
        if ($matricula?->curso_id) {
            $observador = (clone $observadorBase)
                ->where('curso_id', $matricula->curso_id)
                ->latest('updated_at')
                ->first();
        }

        if (!$observador) {
            $observador = (clone $observadorBase)
                ->latest('updated_at')
                ->first();
        }

        $boletinObservacion = Boletin::query()
            ->where('estudiante_id', $hijo->id)
            ->where('periodo_id', $periodoSeleccionadoId)
            ->value('observacion_general');

        $historial = ObservadorPeriodo::query()
            ->where('estudiante_id', $hijo->id)
            ->with([
                'periodo:id,nombre,numero,anio',
                'curso:id,nombre',
                'director:id,name',
            ])
            ->latest('updated_at')
            ->limit(40)
            ->get()
            ->map(fn(ObservadorPeriodo $r) => [
                'id' => $r->id,
                'periodo_id' => $r->periodo_id,
                'periodo' => $r->periodo?->nombre,
                'anio' => $r->periodo?->anio,
                'curso' => $r->curso?->nombre,
                'director' => $r->director?->name,
                'estado' => $r->estado,
                'fecha_realizacion' => $r->fecha_realizacion?->format('Y-m-d'),
                'updated_at' => $r->updated_at?->format('Y-m-d H:i'),
            ])
            ->values();

        return Inertia::render('Padre/Observador', [
            'padre' => [
                'nombre' => $padre->name,
            ],
            'hijos' => $hijos->map(fn(User $h) => [
                'id' => $h->id,
                'nombre' => $h->name,
            ])->values(),
            'hijo' => [
                'id' => $hijo->id,
                'nombre' => $hijo->name,
                'documento' => $hijo->documento,
                'grado' => $matricula?->curso?->grado ? ($matricula->curso->grado . '°') : 'Sin grado',
                'seccion' => $matricula?->curso?->grupo ?? '—',
                'curso' => $matricula?->curso?->nombre,
                'director_grupo' => $matricula?->curso?->directorGrupo?->name,
                'fecha_nacimiento' => $hijo->fecha_nacimiento?->format('Y-m-d'),
                'lugar_nacimiento' => $hijo->lugar_nacimiento,
                'direccion' => $hijo->direccion,
                'telefono' => $hijo->telefono,
                'grupo_sanguineo' => $hijo->grupo_sanguineo,
                'eps' => $hijo->eps,
                'dificultad_aprendizaje' => $hijo->dificultad_aprendizaje,
                'dificultad_aprendizaje_desc' => $hijo->dificultad_aprendizaje_desc,
                'diagnostico_salud' => $hijo->diagnostico_salud,
                'diagnostico_salud_desc' => $hijo->diagnostico_salud_desc,
                'alergias' => $hijo->alergias,
                'alergias_desc' => $hijo->alergias_desc,
                'nombre_madre' => $hijo->nombre_madre,
                'telefono_madre' => $hijo->telefono_madre,
                'ocupacion_madre' => $hijo->ocupacion_madre,
                'nombre_padre' => $hijo->nombre_padre,
                'telefono_padre' => $hijo->telefono_padre,
                'ocupacion_padre' => $hijo->ocupacion_padre,
                'convive_con' => $hijo->convive_con,
                'numero_hermanos' => $hijo->numero_hermanos,
                'lugar_que_ocupa_familia' => $hijo->lugar_que_ocupa_familia,
                'acudiente' => $hijo->padres->first()?->name,
                'telefono_acudiente' => $hijo->padres->first()?->telefono,
                'foto_url' => $this->resolveFotoUrl($hijo->foto),
            ],
            'periodos' => $periodos->map(fn(Periodo $p) => [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'numero' => $p->numero,
                'anio' => $p->anio,
                'estado' => $p->estado,
            ])->values(),
            'periodoSeleccionadoId' => $periodoSeleccionadoId,
            'stats' => [
                'total' => $comentarios->count(),
                'positivas' => $comentarios->where('tipo', 'positiva')->count(),
                'negativas' => $comentarios->where('tipo', 'negativa')->count(),
            ],
            'observador' => $observador ? [
                'id' => $observador->id,
                'curso' => $observador->curso?->nombre,
                'periodo' => $observador->periodo?->nombre,
                'director' => $observador->director?->name,
                'fecha_realizacion' => $observador->fecha_realizacion?->format('Y-m-d'),
                'resumen_general' => $observador->resumen_general,
                'fortalezas' => $observador->fortalezas,
                'dificultades' => $observador->dificultades,
                'compromisos' => $observador->compromisos,
                'ficha' => $observador->ficha,
                'estado' => $observador->estado,
                'updated_at' => $observador->updated_at?->format('Y-m-d H:i'),
            ] : null,
            'boletinObservacion' => $boletinObservacion,
            'comentarios' => $comentarios,
            'historial' => $historial,
        ]);
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
