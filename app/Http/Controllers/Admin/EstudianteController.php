<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{User, Matricula, Nota, Pago, Observacion, Curso, Periodo, Mensaje, UserActivityLog};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\{DB, Hash, Response};
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class EstudianteController extends Controller
{
    /* ──────────────────── INDEX ──────────────────── */
    public function index(): InertiaResponse
    {
        $estudiantes = $this->getEstudiantes();

        $cursos = Curso::select('id', 'nombre', 'nivel', 'grado', 'grupo')
            ->orderBy('nivel')->orderBy('grado')->get();

        $padres = User::role('padre')
            ->select('id', 'name', 'documento')
            ->orderBy('name')->get()
            ->map(fn ($p) => ['id' => $p->id, 'name' => $p->name, 'documento' => $p->documento]);

        return Inertia::render('Admin/Estudiantes', [
            'estudiantes' => $estudiantes,
            'cursos'      => $cursos,
            'padres'      => $padres,
        ]);
    }

    /* ──────────────────── UPDATE ──────────────────── */
    public function update(Request $request, User $estudiante)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'email'            => ['required', 'email', Rule::unique('users')->ignore($estudiante->id)],
            'phone'            => ['nullable', 'string', 'regex:/^[0-9]{7,10}$/'],
            'documento'        => ['nullable', 'string', 'regex:/^[0-9]{5,15}$/', Rule::unique('users')->ignore($estudiante->id)],
            'tipo_documento'   => 'required|in:CC,TI,CE,RC,PP',
            'direccion'        => 'nullable|string|max:255',
            'fecha_nacimiento' => 'nullable|date|before:today',
            'genero'           => 'nullable|in:M,F,otro',
            'curso_id'         => 'nullable|exists:cursos,id',
            'acudiente_id'     => 'nullable|integer',
        ], [
            'documento.regex'  => 'El documento solo debe contener números (5–15 dígitos).',
            'documento.unique' => 'Este número de documento ya está registrado.',
            'phone.regex'      => 'El teléfono solo debe contener números (7–10 dígitos).',
        ]);

        $estudiante->update([
            'name'             => $data['name'],
            'email'            => $data['email'],
            'telefono'         => $data['phone'] ?? $estudiante->telefono,
            'documento'        => $data['documento'] ?? $estudiante->documento,
            'tipo_documento'   => $data['tipo_documento'],
            'direccion'        => $data['direccion'] ?? $estudiante->direccion,
            'fecha_nacimiento' => $data['fecha_nacimiento'] ?? $estudiante->fecha_nacimiento,
            'genero'           => $data['genero'] ?? $estudiante->genero,
        ]);

        // Actualizar matrícula
        if (array_key_exists('curso_id', $data)) {
            $matricula = Matricula::where('estudiante_id', $estudiante->id)->latest()->first();
            if ($data['curso_id']) {
                if ($matricula) {
                    $matricula->update(['curso_id' => $data['curso_id']]);
                } else {
                    $periodo = Periodo::orderBy('id')->first();
                    Matricula::create([
                        'estudiante_id'   => $estudiante->id,
                        'curso_id'        => $data['curso_id'],
                        'periodo_id'      => $periodo?->id,
                        'estado'          => 'activa',
                        'fecha_matricula' => now(),
                    ]);
                }
            } elseif ($matricula) {
                $matricula->delete();
            }
        }

        // Actualizar acudiente
        if (array_key_exists('acudiente_id', $data)) {
            DB::table('padre_estudiante')->where('estudiante_id', $estudiante->id)->delete();
            if ($data['acudiente_id']) {
                DB::table('padre_estudiante')->insert([
                    'padre_id'      => $data['acudiente_id'],
                    'estudiante_id' => $estudiante->id,
                    'parentesco'    => 'acudiente',
                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
            }
        }

        $this->logActivity($estudiante->id, 'editar', 'Información del estudiante actualizada');

        return redirect()->back()->with('success', 'Estudiante actualizado exitosamente.');
    }

    /* ──────────────────── TOGGLE STATUS ──────────────────── */
    public function toggleStatus(User $estudiante)
    {
        $nuevoEstado = !$estudiante->activo;
        $estudiante->update(['activo' => $nuevoEstado]);

        $action = $nuevoEstado ? 'activar' : 'bloquear';
        $this->logActivity($estudiante->id, $action, $nuevoEstado ? 'Estudiante activado' : 'Estudiante bloqueado');

        return redirect()->back()->with('success', $nuevoEstado ? 'Estudiante activado.' : 'Estudiante bloqueado.');
    }

    /* ──────────────────── SEND MESSAGE ──────────────────── */
    public function sendMessage(Request $request, User $estudiante)
    {
        $data = $request->validate([
            'asunto'    => 'required|string|max:255',
            'contenido' => 'required|string|max:2000',
        ]);

        Mensaje::create([
            'remitente_id'    => auth()->id(),
            'destinatario_id' => $estudiante->id,
            'asunto'          => $data['asunto'],
            'contenido'       => $data['contenido'],
            'leido'           => false,
        ]);

        return redirect()->back()->with('success', 'Mensaje enviado exitosamente.');
    }

    /* ──────────────────── NOTAS (JSON for modal) ──────────────────── */
    public function notas(User $estudiante)
    {
        $notas = Nota::where('estudiante_id', $estudiante->id)
            ->with(['cursoMateria.materia', 'periodo'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($n) => [
                'id'      => $n->id,
                'materia' => $n->cursoMateria?->materia?->nombre ?? 'Sin materia',
                'periodo' => $n->periodo?->nombre ?? '—',
                'tipo'    => $n->tipo,
                'valor'   => $n->valor,
                'desc'    => $n->descripcion,
            ]);

        return response()->json($notas);
    }

    /* ──────────────────── OBSERVACIONES (JSON for modal) ──────────────────── */
    public function observaciones(User $estudiante)
    {
        $obs = Observacion::where('estudiante_id', $estudiante->id)
            ->with('profesor')
            ->orderByDesc('fecha')
            ->get()
            ->map(fn ($o) => [
                'id'        => $o->id,
                'tipo'      => $o->tipo,
                'categoria' => $o->categoria,
                'desc'      => $o->descripcion,
                'fecha'     => $o->fecha->format('Y-m-d'),
                'profesor'  => $o->profesor?->name ?? '—',
            ]);

        return response()->json($obs);
    }

    /* ──────────────────── PAGOS (JSON for modal) ──────────────────── */
    public function pagos(User $estudiante)
    {
        $pagos = Pago::where('estudiante_id', $estudiante->id)
            ->with('conceptoPago')
            ->orderByDesc('fecha_vencimiento')
            ->get()
            ->map(fn ($p) => [
                'id'        => $p->id,
                'concepto'  => $p->conceptoPago?->nombre ?? '—',
                'monto'     => $p->monto,
                'estado'    => $p->estado,
                'metodo'    => $p->metodo_pago,
                'vence'     => $p->fecha_vencimiento->format('Y-m-d'),
                'pagado'    => $p->fecha_pago?->format('Y-m-d'),
                'ref'       => $p->referencia,
            ]);

        return response()->json($pagos);
    }

    /* ──────────────────── EXPORT CSV ──────────────────── */
    public function export(Request $request)
    {
        $nivel  = $request->query('nivel', 'todos');
        $curso  = $request->query('curso', 'todos');
        $estado = $request->query('estado', 'todos');
        $pagos  = $request->query('pagos', 'todos');

        $estudiantes = $this->getEstudiantes();

        if ($nivel !== 'todos') {
            $estudiantes = $estudiantes->filter(fn ($e) => $e['nivel'] === $nivel);
        }
        if ($curso !== 'todos') {
            $estudiantes = $estudiantes->filter(fn ($e) => $e['curso_nombre'] === $curso);
        }
        if ($estado !== 'todos') {
            $estudiantes = $estudiantes->filter(fn ($e) => $e['estado'] === $estado);
        }
        if ($pagos !== 'todos') {
            $estudiantes = $estudiantes->filter(fn ($e) => $e['pagos'] === $pagos);
        }

        $nivelOrder = ['preescolar' => 1, 'transicion' => 2, 'primaria' => 3, 'bachillerato' => 4];
        $estudiantes = $estudiantes->sortBy([
            fn ($a, $b) => ($nivelOrder[$a['nivel']] ?? 99) <=> ($nivelOrder[$b['nivel']] ?? 99),
            fn ($a, $b) => ($a['curso_nombre'] ?? '') <=> ($b['curso_nombre'] ?? ''),
            fn ($a, $b) => $a['nombre'] <=> $b['nombre'],
        ]);

        $nivelLabels = ['preescolar' => 'Pre-escolar', 'transicion' => 'Transición', 'primaria' => 'Primaria', 'bachillerato' => 'Bachillerato'];

        $headers = [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="estudiantes_' . now()->format('Y-m-d') . '.csv"',
        ];

        $callback = function () use ($estudiantes, $nivelLabels) {
            $fp = fopen('php://output', 'w');
            fprintf($fp, chr(0xEF) . chr(0xBB) . chr(0xBF));

            fputcsv($fp, [
                'N°', 'Nombre Completo', 'Documento', 'Tipo Doc.', 'Nivel Educativo',
                'Curso', 'Acudiente', 'Teléfono', 'Email', 'Dirección',
                'Fecha Nacimiento', 'Género', 'Estado', 'Promedio', 'Estado Pagos', 'Observaciones',
            ], ';');

            $currentNivel = '';
            $n = 1;
            foreach ($estudiantes as $est) {
                $nivelLabel = $nivelLabels[$est['nivel']] ?? ($est['nivel'] ?: 'Sin nivel');
                if ($est['nivel'] !== $currentNivel) {
                    $currentNivel = $est['nivel'];
                    fputcsv($fp, [], ';');
                    fputcsv($fp, ["=== {$nivelLabel} ==="], ';');
                }

                fputcsv($fp, [
                    $n++,
                    $est['nombre'],
                    $est['identificacion'],
                    $est['tipo_documento'],
                    $nivelLabel,
                    $est['curso_nombre'],
                    $est['acudiente'],
                    $est['telefono'],
                    $est['email'],
                    $est['direccion'],
                    $est['fecha_nacimiento'],
                    $est['genero'] === 'M' ? 'Masculino' : ($est['genero'] === 'F' ? 'Femenino' : ($est['genero'] ?: 'N/A')),
                    ucfirst($est['estado']),
                    $est['promedio'],
                    $est['pagos'] === 'al_dia' ? 'Al día' : ($est['pagos'] === 'pendiente' ? 'Pendiente' : 'Moroso'),
                    $est['observaciones'],
                ], ';');
            }

            fclose($fp);
        };

        return Response::stream($callback, 200, $headers);
    }

    /* ──────────────────── HELPERS ──────────────────── */
    private function getEstudiantes()
    {
        return User::role('estudiante')
            ->with([
                'matriculas' => fn ($q) => $q->where('estado', 'activa')->with('curso'),
                'padres',
            ])
            ->get()
            ->map(function (User $est) {
                $matricula = $est->matriculas->first();
                $curso     = $matricula?->curso;

                $promedio = Nota::where('estudiante_id', $est->id)
                    ->where('tipo', 'definitiva')
                    ->avg('valor');

                $pagosPendientes = Pago::where('estudiante_id', $est->id)
                    ->whereIn('estado', ['pendiente', 'vencido'])
                    ->count();
                $pagosVencidos = Pago::where('estudiante_id', $est->id)
                    ->where('estado', 'vencido')
                    ->count();
                $estadoPagos = $pagosVencidos > 0 ? 'moroso' : ($pagosPendientes > 0 ? 'pendiente' : 'al_dia');

                $obsCount = Observacion::where('estudiante_id', $est->id)->count();
                $padre = $est->padres->first();

                return [
                    'id'               => $est->id,
                    'nombre'           => $est->name,
                    'identificacion'   => $est->documento ?? '',
                    'tipo_documento'   => $est->tipo_documento ?? 'TI',
                    'nivel'            => $curso?->nivel ?? '',
                    'curso_id'         => $curso?->id,
                    'curso_nombre'     => $curso?->nombre ?? 'Sin asignar',
                    'grado'            => $curso?->grado ?? '',
                    'seccion'          => $curso?->grupo ?? '',
                    'acudiente'        => $padre?->name ?? 'Sin acudiente',
                    'acudiente_id'     => $padre?->id,
                    'telefono'         => $est->telefono ?? '',
                    'email'            => $est->email,
                    'direccion'        => $est->direccion ?? '',
                    'fecha_nacimiento' => $est->fecha_nacimiento?->format('Y-m-d') ?? '',
                    'genero'           => $est->genero ?? '',
                    'estado'           => $est->activo ? 'activo' : 'inactivo',
                    'promedio'         => $promedio ? round($promedio, 1) : 0,
                    'pagos'            => $estadoPagos,
                    'observaciones'    => $obsCount,
                ];
            });
    }

    private function logActivity(int $userId, string $action, ?string $reason = null): void
    {
        UserActivityLog::create([
            'user_id'           => $userId,
            'action'            => $action,
            'performed_by_name' => auth()->user()->name,
            'performed_by_id'   => auth()->id(),
            'reason'            => $reason,
        ]);
    }
}
