<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\{Actividad, CursoMateria, Entrega, Matricula, Nota};
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class MateriaController extends Controller
{
    public function index(): Response
    {
        $user = auth()->user();

        $matriculas = Matricula::with('curso')
            ->where('estudiante_id', $user->id)
            ->where('estado', 'activa')
            ->get();

        $cursoIds = $matriculas->pluck('curso_id')->unique()->values();

        $paleta = [
            ['from-blue-500 to-blue-600', 'bg-blue-50', 'text-blue-700', 'border-blue-200'],
            ['from-amber-500 to-amber-600', 'bg-amber-50', 'text-amber-700', 'border-amber-200'],
            ['from-green-500 to-green-600', 'bg-green-50', 'text-green-700', 'border-green-200'],
            ['from-purple-500 to-purple-600', 'bg-purple-50', 'text-purple-700', 'border-purple-200'],
            ['from-indigo-500 to-indigo-600', 'bg-indigo-50', 'text-indigo-700', 'border-indigo-200'],
            ['from-cyan-500 to-cyan-600', 'bg-cyan-50', 'text-cyan-700', 'border-cyan-200'],
            ['from-orange-500 to-orange-600', 'bg-orange-50', 'text-orange-700', 'border-orange-200'],
            ['from-pink-500 to-pink-600', 'bg-pink-50', 'text-pink-700', 'border-pink-200'],
        ];

        $cursoMaterias = CursoMateria::with(['materia', 'profesor', 'curso', 'actividades'])
            ->whereIn('curso_id', $cursoIds)
            ->orderBy('id')
            ->get();

        $materias = $cursoMaterias->values()->map(function ($cm, $idx) use ($user, $paleta) {
            $colors = $paleta[$idx % count($paleta)];

            $entregas = Entrega::with('actividad')
                ->where('estudiante_id', $user->id)
                ->whereHas('actividad', fn($q) => $q->where('curso_materia_id', $cm->id))
                ->get()
                ->keyBy('actividad_id');

            // Se listan desde actividades para no perder registros históricos si faltó crear una entrega.
            $actividades = $cm->actividades
                ->sortByDesc(fn(Actividad $actividad) => $actividad->fecha_entrega?->timestamp ?? 0)
                ->map(function (Actividad $actividad) use ($entregas) {
                    /** @var Entrega|null $entrega */
                    $entrega = $entregas->get($actividad->id);
                    $estado = $entrega
                        ? $this->estadoConsolidado($actividad->fecha_entrega, $entrega)
                        : $this->estadoSinEntrega($actividad);

                    $limite = $entrega
                        ? ($entrega->fechaLimiteEfectiva() ?? $actividad->fecha_entrega)
                        : $actividad->fecha_entrega;

                    $puedeEntregar = $actividad->activa
                        && !$actividad->cerrada_manualmente
                        && $estado !== 'calificada'
                        && ($limite === null || now()->lte($limite) || $actividad->permite_entrega_tardia);

                    if ($actividad->max_intentos !== null && $entrega && ($entrega->intentos_usados ?? 0) >= $actividad->max_intentos) {
                        $puedeEntregar = false;
                    }

                    return [
                        'id'                 => $actividad->id,
                        'titulo'             => $actividad->titulo,
                        'descripcion'        => $actividad->descripcion ?? 'Sin descripcion',
                        'tipo'               => (string) $actividad->tipo,
                        'tienePreguntas'     => (bool) $actividad->tiene_preguntas,
                        'fechaAsignada'      => $actividad->fecha_asignacion?->format('d M Y') ?? '-',
                        'fechaEntrega'       => $actividad->fecha_entrega?->format('d M Y H:i') ?? '-',
                        'fechaLimiteIndividual' => $entrega?->fecha_limite_individual?->format('d M Y H:i'),
                        'estado'             => $estado,
                        'puedeEntregar'      => $puedeEntregar,
                        'permiteEntregaTardia' => (bool) $actividad->permite_entrega_tardia,
                        'maxIntentos'        => $actividad->max_intentos !== null ? (int) $actividad->max_intentos : null,
                        'intentosUsados'     => (int) ($entrega?->intentos_usados ?? 0),
                        'nota'               => $entrega && $entrega->calificacion !== null ? (float) $entrega->calificacion : null,
                        'peso'               => (float) $actividad->porcentaje,
                        'retroalimentacion'  => $entrega?->retroalimentacion,
                        'notaDevolucion'     => $entrega?->nota_devolucion,
                    ];
                })
                ->values();

            $promedio = Nota::where('estudiante_id', $user->id)
                ->where('curso_materia_id', $cm->id)
                ->avg('valor');

            $promedioNum = $promedio !== null ? round((float)$promedio, 1) : 0.0;

            $cortes = Nota::where('estudiante_id', $user->id)
                ->where('curso_materia_id', $cm->id)
                ->selectRaw('periodo_id, AVG(valor) as promedio')
                ->groupBy('periodo_id')
                ->orderBy('periodo_id')
                ->get()
                ->map(function ($row, $i) {
                    return [
                        'corte' => 'Periodo ' . ($i + 1),
                        'nota'  => round((float)$row->promedio, 1),
                    ];
                })
                ->values();

            if ($cortes->isEmpty()) {
                $cortes = collect([
                    ['corte' => 'Periodo 1', 'nota' => 0],
                    ['corte' => 'Periodo 2', 'nota' => 0],
                    ['corte' => 'Periodo 3', 'nota' => 0],
                ]);
            }

            $nombreMateria = $cm->materia?->nombre ?? 'Materia';
            $icono = $this->inicialesMateria($nombreMateria);

            return [
                'id'              => $cm->id,
                'nombre'          => $nombreMateria,
                'profesor'        => $cm->profesor?->name ?? 'Sin profesor',
                'imagen'          => $this->resolveImageUrl($cm->materia?->imagen ?? null, '/images/presets/materia-default.svg'),
                'icono'           => $icono,
                'color'           => $colors[0],
                'colorBg'         => $colors[1],
                'colorText'       => $colors[2],
                'colorBorder'     => $colors[3],
                'promedio'        => $promedioNum,
                'horasSemanales'  => (int)($cm->horas_semanales ?? 0),
                'salon'           => $cm->curso?->nombre ?? 'Sin salon',
                'descripcion'     => $cm->materia?->area
                    ? ('Area: ' . $cm->materia->area)
                    : 'Materia asignada al curso',
                'actividades'     => $actividades,
                'promedioCortes'  => $cortes,
            ];
        });

        $payload = [
            'estudiante' => [
                'nombre' => $user->name,
            ],
            'materias' => $materias->values()->all(),
        ];

        return Inertia::render('Estudiante/Materias', $this->sanitizeForJson($payload));
    }

    private function estadoConsolidado($fechaEntregaActividad, Entrega $entrega): string
    {
        if (
            $entrega->estado === 'devuelta'
            || ($entrega->estado === 'pendiente' && !empty($entrega->nota_devolucion) && $entrega->fecha_entrega === null)
        ) {
            return 'devuelta';
        }

        if ($entrega->estado === 'calificada') {
            return 'calificada';
        }

        if (in_array($entrega->estado, ['entregada', 'atrasada'])) {
            return 'entregada';
        }

        $limite = $entrega->fechaLimiteEfectiva() ?? $fechaEntregaActividad;
        if ($limite && now()->gt($limite)) {
            return 'vencida';
        }

        return 'pendiente';
    }

    private function estadoSinEntrega(Actividad $actividad): string
    {
        if ($actividad->fecha_entrega && now()->gt($actividad->fecha_entrega)) {
            return 'vencida';
        }

        return 'pendiente';
    }

    private function inicialesMateria(string $nombre): string
    {
        $nombre = $this->sanitizeText($nombre);
        $partes = preg_split('/\s+/', trim($nombre)) ?: [];
        if (count($partes) >= 2) {
            return mb_strtoupper(mb_substr($partes[0], 0, 1) . mb_substr($partes[1], 0, 1), 'UTF-8');
        }
        return mb_strtoupper(mb_substr($nombre, 0, 2), 'UTF-8');
    }

    /**
     * Sanea recursivamente datos para serializarse como JSON sin errores de codificacion.
     */
    private function sanitizeForJson(mixed $value): mixed
    {
        if (is_array($value)) {
            foreach ($value as $key => $item) {
                $value[$key] = $this->sanitizeForJson($item);
            }

            return $value;
        }

        if ($value instanceof \Illuminate\Support\Collection) {
            return $this->sanitizeForJson($value->all());
        }

        if (is_string($value)) {
            return $this->sanitizeText($value);
        }

        return $value;
    }

    /**
     * Convierte texto potencialmente mal codificado a UTF-8 valido.
     */
    private function sanitizeText(string $text): string
    {
        if ($text === '') {
            return '';
        }

        if (!mb_check_encoding($text, 'UTF-8')) {
            $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8,ISO-8859-1,Windows-1252');
        }

        $normalized = @iconv('UTF-8', 'UTF-8//IGNORE', $text);

        return $normalized !== false ? $normalized : '';
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
