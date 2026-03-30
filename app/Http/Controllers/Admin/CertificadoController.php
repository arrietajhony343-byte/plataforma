<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ScopesBySede;
use App\Models\{Certificado, TipoCertificado, User, Curso, Sede, Mensaje, Notificacion, Nota, Pago};
use Illuminate\Http\{Request, JsonResponse, RedirectResponse};
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CertificadoController extends Controller
{
    use ScopesBySede;

    public function index(): Response
    {
        $sedeId = $this->sedeId();

        // Pre-cargar tipos por código para resolver registros legacy
        $tiposPorCodigo = TipoCertificado::all()->keyBy('codigo');

        $pagosCertificados = collect();
        Pago::query()
            ->whereNotNull('notas')
            ->where('notas', 'like', 'certificado:%')
            ->orderByDesc('id')
            ->get()
            ->each(function (Pago $pago) use ($pagosCertificados) {
                $certificadoId = $this->extractCertificadoIdFromNotas($pago->notas);
                if ($certificadoId && !$pagosCertificados->has($certificadoId)) {
                    $pagosCertificados->put($certificadoId, $pago);
                }
            });

        // Get all certificates with relationships
        $certificados = Certificado::with(['estudiante', 'tipoCertificado'])
            ->when($sedeId, fn($q) => $q->whereHas('estudiante', fn($eq) => $eq->where('sede_id', $sedeId)))
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Certificado $c) use ($tiposPorCodigo, $pagosCertificados) {
                // Resolver tipo: si no tiene tipo_certificado_id, buscar por código legacy
                $tipo = $c->tipoCertificado
                    ?? ($c->tipo ? $tiposPorCodigo->get($c->tipo) : null);

                $pago = $pagosCertificados->get($c->id);
                $requierePago = ((int) ($tipo?->precio ?? 0)) > 0;
                $pagoConfirmado = !$requierePago || ($pago && $pago->estado === 'pagado');

                // Si es legacy sin relación, auto-asignar el tipo_certificado_id
                if (!$c->tipo_certificado_id && $tipo) {
                    $c->update(['tipo_certificado_id' => $tipo->id]);
                    $c->tipo_certificado_id = $tipo->id;
                }

                // Get student's active enrollment, fallback to most recent
                $mat = $c->estudiante->matriculas()
                    ->where('estado', 'activa')
                    ->with('curso')
                    ->first()
                    ?? $c->estudiante->matriculas()
                        ->with('curso')
                        ->orderByDesc('created_at')
                        ->first();

                // Get parent(s) for notification
                $padres = $c->estudiante->padres()
                    ->select('users.id', 'users.name')
                    ->get()
                    ->map(fn($p) => ['id' => $p->id, 'name' => $p->name])
                    ->values();

                $notas = Nota::query()
                    ->where('estudiante_id', $c->estudiante_id)
                    ->where('tipo', 'definitiva')
                    ->when($mat?->curso_id, function ($query, $cursoId) {
                        $query->whereHas('cursoMateria', fn($cmQ) => $cmQ->where('curso_id', $cursoId));
                    })
                    ->with('cursoMateria.materia')
                    ->orderByDesc('created_at')
                    ->get()
                    ->filter(fn($n) => $n->cursoMateria?->materia !== null)
                    ->unique('curso_materia_id')
                    ->sortBy(fn($n) => $n->cursoMateria->materia->nombre)
                    ->values()
                    ->map(function ($n) {
                        $definitiva = round((float) $n->valor, 1);

                        return [
                            'materia'    => $n->cursoMateria->materia->nombre,
                            'ih'         => (int) ($n->cursoMateria->horas_semanales ?? 0),
                            'definitiva' => $definitiva,
                            'escala'     => $definitiva >= 4.6 ? 'SUPERIOR'
                                : ($definitiva >= 4.0 ? 'ALTO'
                                    : ($definitiva >= 3.0 ? 'BASICO' : 'BAJO')),
                        ];
                    });

                return [
                    'id'                  => $c->id,
                    'tipo_certificado_id' => $c->tipo_certificado_id,
                    'tipo_nombre'         => $tipo?->nombre ?? $c->tipo ?? 'Sin tipo',
                    'tipo_codigo'         => $tipo?->codigo ?? $c->tipo,
                    'estudiante_id'       => $c->estudiante_id,
                    'estudiante'          => $c->estudiante->name,
                    'estudiante_documento' => $c->estudiante->documento,
                    'estudiante_tipo_documento' => $c->estudiante->tipo_documento,
                    'nivel'               => $mat?->curso?->nivel ?? '',
                    'curso_id'            => $mat?->curso_id,
                    'curso'               => $mat?->curso?->nombre ?? '',
                    'descripcion'         => $c->descripcion,
                    'archivo'             => $c->archivo,
                    'fecha_solicitud'     => $c->fecha_solicitud?->format('Y-m-d'),
                    'fecha_entrega'       => $c->fecha_entrega?->format('Y-m-d'),
                    'estado'              => $c->estado,
                    'pago_estado'         => $pago?->estado,
                    'pago_confirmado'     => (bool) $pagoConfirmado,
                    'requiere_pago'       => (bool) $requierePago,
                    'padres'              => $padres,
                    'notas'               => $notas,
                ];
            });

        // Get active certificate types
        $tiposCertificado = TipoCertificado::orderBy('nombre')
            ->get()
            ->map(fn($t) => [
                'id'          => $t->id,
                'nombre'      => $t->nombre,
                'codigo'      => $t->codigo,
                'descripcion' => $t->descripcion,
                'precio'      => $t->precio,
                'activo'      => $t->activo,
            ]);

        // Get students for new requests
        $estudiantes = User::role('estudiante')
            ->activo()
            ->with(['matriculas' => fn($q) => $q->where('estado', 'activa')->with('curso')])
            ->get()
            ->map(fn($e) => [
                'id'     => $e->id,
                'name'   => $e->name,
                'nivel'  => $e->matriculas->first()?->curso?->nivel ?? '',
                'curso'  => $e->matriculas->first()?->curso?->nombre ?? '',
                'curso_id' => $e->matriculas->first()?->curso_id,
            ]);

        // Get courses for filtering
        $cursos = Curso::where('activo', true)
            ->orderByRaw("CASE WHEN nivel = 'preescolar' THEN 1 WHEN nivel = 'transicion' THEN 2 WHEN nivel = 'primaria' THEN 3 WHEN nivel = 'secundaria' THEN 4 WHEN nivel = 'media' THEN 5 WHEN nivel = 'bachillerato' THEN 6 ELSE 7 END")
            ->orderBy('grado')
            ->orderBy('grupo')
            ->get()
            ->map(fn($c) => [
                'id'      => $c->id,
                'nombre'  => $c->nombre,
                'nivel'   => $c->nivel,
                'grado'   => $c->grado,
                'sede_id' => $c->sede_id,
            ]);

        // Niveles únicos normalizados (preescolar → transicion)
        $niveles = $cursos->pluck('nivel')
            ->map(fn($n) => $n === 'preescolar' ? 'transicion' : $n)
            ->unique()
            ->values();

        $sedes = Sede::where('activa', true)
            ->orderBy('nombre')
            ->when($this->sedeId(), fn($q, $s) => $q->where('id', $s))
            ->get()
            ->map(fn($s) => ['id' => $s->id, 'nombre' => $s->nombre]);

        return Inertia::render('Admin/Certificados', [
            'certificados'     => $certificados,
            'tiposCertificado' => $tiposCertificado,
            'estudiantes'      => $estudiantes,
            'cursos'           => $cursos,
            'niveles'          => $niveles,
            'sedes'            => $sedes,
        ]);
    }

    /**
     * Store a new certificate request
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'estudiante_id'       => 'required|exists:users,id',
            'tipo_certificado_id' => 'required|exists:tipo_certificados,id',
            'descripcion'         => 'nullable|string|max:500',
        ]);

        $tipoCert = TipoCertificado::findOrFail($data['tipo_certificado_id']);

        Certificado::create([
            'estudiante_id'       => $data['estudiante_id'],
            'tipo_certificado_id' => $data['tipo_certificado_id'],
            'tipo'                => $tipoCert->codigo,
            'descripcion'         => $data['descripcion'] ?? null,
            'estado'              => 'solicitado',
            'fecha_solicitud'     => now(),
        ]);

        return redirect()->back()->with('success', 'Solicitud de certificado registrada correctamente.');
    }

    /**
     * Update certificate status
     */
    public function update(Request $request, Certificado $certificado)
    {
        $data = $request->validate([
            'estado' => 'required|in:solicitado,en_proceso,listo,entregado',
        ]);

        $updates = ['estado' => $data['estado']];
        
        if ($data['estado'] === 'entregado') {
            $updates['fecha_entrega'] = now();
        }

        $certificado->update($updates);

        return redirect()->back()->with('success', 'Estado del certificado actualizado.');
    }

    /**
     * Delete a certificate request
     */
    public function destroy(Certificado $certificado)
    {
        // Delete associated file if exists
        if ($certificado->archivo && Storage::exists($certificado->archivo)) {
            Storage::delete($certificado->archivo);
        }

        $certificado->delete();

        return redirect()->back()->with('success', 'Solicitud eliminada.');
    }

    /**
     * Download certificate file
     */
    public function download(Certificado $certificado)
    {
        if (!$certificado->archivo || !Storage::exists($certificado->archivo)) {
            return redirect()->back()->with('error', 'El archivo no está disponible.');
        }

        return Storage::download($certificado->archivo);
    }

    /**
     * Guardar certificado generado (PDF) y marcarlo como generado/enviado.
     */
    public function generar(Request $request, Certificado $certificado): RedirectResponse
    {
        $request->validate([
            'archivo' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ]);

        if (!$this->pagoConfirmadoParaCertificado($certificado)) {
            return redirect()->back()->with('error', 'Debe confirmarse el pago antes de generar el certificado.');
        }

        if ($certificado->archivo && Storage::exists($certificado->archivo)) {
            Storage::delete($certificado->archivo);
        }

        $nombreArchivo = 'certificado_' . $certificado->id . '_' . now()->format('Ymd_His') . '.pdf';
        $rutaArchivo = $request->file('archivo')->storeAs('certificados/' . $certificado->estudiante_id, $nombreArchivo);

        $certificado->update([
            'archivo' => $rutaArchivo,
            'estado' => 'listo',
        ]);

        $notificados = $this->notifyPadresDisponibilidad($certificado, false);

        $mensaje = $notificados > 0
            ? "Certificado generado y enviado. Se notificó a {$notificados} acudiente(s)."
            : 'Certificado generado y enviado.';

        return redirect()->back()->with('success', $mensaje);
    }

    /* ════════════════════════════════════════════════════════════════════════
     * Notify parent / send message
     * ════════════════════════════════════════════════════════════════════════ */

    /**
     * Send message + notification to the student's parent(s)
     */
    public function notificarPadre(Certificado $certificado)
    {
        $count = $this->notifyPadresDisponibilidad($certificado, true);
        if ($count === 0) {
            return redirect()->back()->with('error', 'El estudiante no tiene acudientes registrados.');
        }

        return redirect()->back()->with('success', "Notificación enviada a {$count} acudiente(s) de {$certificado->estudiante->name}.");
    }

    private function notifyPadresDisponibilidad(Certificado $certificado, bool $advanceStatus): int
    {
        $estudiante = $certificado->estudiante;
        $tipo = $certificado->tipoCertificado?->nombre ?? $certificado->tipo ?? 'Certificado';
        $padres = $estudiante->padres;

        if ($padres->isEmpty()) {
            return 0;
        }

        $admin = auth()->user();
        $asunto = "Certificado generado y enviado: {$tipo}";
        $contenido = "Estimado acudiente, el {$tipo} de {$estudiante->name} ya fue generado y enviado en la plataforma. Desde su módulo de certificados puede descargarlo.";

        foreach ($padres as $padre) {
            Mensaje::create([
                'remitente_id' => $admin->id,
                'destinatario_id' => $padre->id,
                'asunto' => $asunto,
                'contenido' => $contenido,
                'leido' => false,
            ]);

            Notificacion::create([
                'user_id' => $padre->id,
                'tipo' => 'success',
                'titulo' => $asunto,
                'mensaje' => $contenido,
                'leida' => false,
            ]);
        }

        if ($advanceStatus && in_array($certificado->estado, ['solicitado', 'en_proceso'], true)) {
            $certificado->update(['estado' => 'listo']);
        }

        return $padres->count();
    }

    private function extractCertificadoIdFromNotas(?string $notas): ?int
    {
        if (!$notas) {
            return null;
        }

        if (!preg_match('/certificado:(\d+)/', $notas, $matches)) {
            return null;
        }

        return (int) ($matches[1] ?? 0) ?: null;
    }

    private function pagoConfirmadoParaCertificado(Certificado $certificado): bool
    {
        $requierePago = ((int) ($certificado->tipoCertificado?->precio ?? 0)) > 0;
        if (!$requierePago) {
            return true;
        }

        $pago = Pago::query()
            ->where('estudiante_id', $certificado->estudiante_id)
            ->where('notas', 'like', 'certificado:' . $certificado->id . '%')
            ->latest('id')
            ->first();

        return $pago?->estado === 'pagado';
    }

    /* ════════════════════════════════════════════════════════════════════════
     * Certificate Types CRUD
     * ════════════════════════════════════════════════════════════════════════ */

    /**
     * Store a new certificate type
     */
    public function storeTipo(Request $request)
    {
        $data = $request->validate([
            'nombre'      => 'required|string|max:100',
            'codigo'      => 'required|string|max:50|unique:tipo_certificados,codigo',
            'descripcion' => 'nullable|string|max:500',
            'precio'      => 'required|integer|min:0',
            'activo'      => 'boolean',
        ]);

        TipoCertificado::create($data);

        return redirect()->back()->with('success', 'Tipo de certificado creado correctamente.');
    }

    /**
     * Update a certificate type
     */
    public function updateTipo(Request $request, TipoCertificado $tipo)
    {
        $data = $request->validate([
            'nombre'      => 'required|string|max:100',
            'codigo'      => 'required|string|max:50|unique:tipo_certificados,codigo,' . $tipo->id,
            'descripcion' => 'nullable|string|max:500',
            'precio'      => 'required|integer|min:0',
            'activo'      => 'boolean',
        ]);

        $tipo->update($data);

        return redirect()->back()->with('success', 'Tipo de certificado actualizado.');
    }

    /**
     * Delete a certificate type
     */
    public function destroyTipo(TipoCertificado $tipo)
    {
        // Check if there are certificates using this type
        if ($tipo->certificados()->exists()) {
            return redirect()->back()->with('error', 'No se puede eliminar: hay certificados de este tipo.');
        }

        $tipo->delete();

        return redirect()->back()->with('success', 'Tipo de certificado eliminado.');
    }
}
