<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\{Certificado, User, Curso};
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CertificadoController extends Controller
{
    public function index(): Response
    {
        $certificados = Certificado::with('estudiante')
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Certificado $c) {
                // Obtener curso del estudiante
                $mat = $c->estudiante->matriculas()
                    ->where('estado', 'activa')
                    ->with('curso')
                    ->first();

                return [
                    'id'              => $c->id,
                    'tipo'            => $c->tipo,
                    'estudiante'      => $c->estudiante->name,
                    'nivel'           => $mat?->curso?->nivel ?? '',
                    'curso'           => $mat?->curso?->nombre ?? '',
                    'fecha_solicitud' => $c->fecha_solicitud?->format('Y-m-d'),
                    'fecha_entrega'   => $c->fecha_entrega?->format('Y-m-d'),
                    'estado'          => $c->estado,
                ];
            });

        $estudiantes = User::role('estudiante')->activo()->select('id', 'name')->get();

        return Inertia::render('Admin/Certificados', [
            'certificados' => $certificados,
            'estudiantes'  => $estudiantes,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'estudiante_id' => 'required|exists:users,id',
            'tipo'          => 'required|in:estudio,notas,constancia,paz_y_salvo',
            'descripcion'   => 'nullable|string|max:500',
        ]);

        Certificado::create(array_merge($data, [
            'estado'          => 'solicitado',
            'fecha_solicitud' => now(),
        ]));

        return redirect()->back()->with('success', 'Solicitud de certificado registrada.');
    }

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

        return redirect()->back()->with('success', 'Certificado actualizado.');
    }
}
