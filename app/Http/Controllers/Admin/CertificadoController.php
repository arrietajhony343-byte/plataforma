<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Certificado, TipoCertificado, User, Curso};
use Illuminate\Http\{Request, JsonResponse};
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CertificadoController extends Controller
{
    /**
     * Display the certificates management page
     */
    public function index(): Response
    {
        // Get all certificates with relationships
        $certificados = Certificado::with(['estudiante', 'tipoCertificado'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Certificado $c) {
                // Get student's active enrollment
                $mat = $c->estudiante->matriculas()
                    ->where('estado', 'activa')
                    ->with('curso')
                    ->first();

                return [
                    'id'                  => $c->id,
                    'tipo_certificado_id' => $c->tipo_certificado_id,
                    'tipo_nombre'         => $c->tipoCertificado?->nombre ?? $c->tipo ?? 'Sin tipo',
                    'tipo_codigo'         => $c->tipoCertificado?->codigo ?? $c->tipo,
                    'estudiante_id'       => $c->estudiante_id,
                    'estudiante'          => $c->estudiante->name,
                    'nivel'               => $mat?->curso?->nivel ?? '',
                    'curso_id'            => $mat?->curso_id,
                    'curso'               => $mat?->curso?->nombre ?? '',
                    'descripcion'         => $c->descripcion,
                    'archivo'             => $c->archivo,
                    'fecha_solicitud'     => $c->fecha_solicitud?->format('Y-m-d'),
                    'fecha_entrega'       => $c->fecha_entrega?->format('Y-m-d'),
                    'estado'              => $c->estado,
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
                'id'     => $c->id,
                'nombre' => $c->nombre,
                'nivel'  => $c->nivel,
                'grado'  => $c->grado,
            ]);

        // Get unique niveles from cursos
        $niveles = $cursos->pluck('nivel')->unique()->values();

        return Inertia::render('Admin/Certificados', [
            'certificados'     => $certificados,
            'tiposCertificado' => $tiposCertificado,
            'estudiantes'      => $estudiantes,
            'cursos'           => $cursos,
            'niveles'          => $niveles,
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

        Certificado::create([
            'estudiante_id'       => $data['estudiante_id'],
            'tipo_certificado_id' => $data['tipo_certificado_id'],
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
