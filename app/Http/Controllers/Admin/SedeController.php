<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sede;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SedeController extends Controller
{
    public function index(): Response
    {
        $sedes = Sede::withCount([
            'usuarios as total_usuarios',
            'cursos as total_cursos',
        ])->orderBy('nombre')->get()->map(fn ($s) => [
            'id'             => $s->id,
            'nombre'         => $s->nombre,
            'ciudad'         => $s->ciudad ?? '',
            'direccion'      => $s->direccion ?? '',
            'telefono'       => $s->telefono ?? '',
            'activa'         => $s->activa,
            'total_usuarios' => $s->total_usuarios ?? 0,
            'total_cursos'   => $s->total_cursos ?? 0,
        ]);

        return Inertia::render('Admin/Sedes', [
            'sedes' => $sedes,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre'    => 'required|string|max:100',
            'ciudad'    => 'nullable|string|max:100',
            'direccion' => 'nullable|string|max:255',
            'telefono'  => 'nullable|string|max:30',
        ]);

        Sede::create(array_merge($data, ['activa' => true]));

        return redirect()->back()->with('success', 'Sede creada exitosamente.');
    }

    public function update(Request $request, Sede $sede)
    {
        $data = $request->validate([
            'nombre'    => 'required|string|max:100',
            'ciudad'    => 'nullable|string|max:100',
            'direccion' => 'nullable|string|max:255',
            'telefono'  => 'nullable|string|max:30',
            'activa'    => 'boolean',
        ]);

        $sede->update($data);

        return redirect()->back()->with('success', 'Sede actualizada.');
    }

    public function destroy(Sede $sede)
    {
        if ($sede->usuarios()->count() > 0 || $sede->cursos()->count() > 0) {
            return redirect()->back()->withErrors([
                'error' => 'No se puede eliminar una sede con usuarios o cursos asignados.',
            ]);
        }

        $sede->delete();

        return redirect()->back()->with('success', 'Sede eliminada.');
    }

    public function detalle(Sede $sede)
    {
        $estudiantes = $sede->usuarios()
            ->whereHas('roles', fn($q) => $q->where('name', 'estudiante'))
            ->select('id', 'name', 'email', 'documento')
            ->orderBy('name')
            ->get();

        $profesores = $sede->usuarios()
            ->whereHas('roles', fn($q) => $q->where('name', 'profesor'))
            ->select('id', 'name', 'email', 'documento')
            ->orderBy('name')
            ->get();

        $padres = $sede->usuarios()
            ->whereHas('roles', fn($q) => $q->where('name', 'padre'))
            ->select('id', 'name', 'email', 'documento')
            ->orderBy('name')
            ->get();

        $cursos = $sede->cursos()
            ->select('id', 'nombre', 'nivel', 'activo')
            ->withCount('matriculas as total_estudiantes')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'sede'        => [
                'id'        => $sede->id,
                'nombre'    => $sede->nombre,
                'ciudad'    => $sede->ciudad,
                'direccion' => $sede->direccion,
                'telefono'  => $sede->telefono,
                'activa'    => $sede->activa,
            ],
            'estudiantes' => $estudiantes,
            'profesores'  => $profesores,
            'padres'      => $padres,
            'cursos'      => $cursos,
        ]);
    }
}
