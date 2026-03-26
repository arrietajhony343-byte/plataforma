<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Materia;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MateriaController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre'          => 'required|string|max:100',
            'area'            => 'required|string|max:100',
            'codigo'          => 'required|string|max:10|unique:materias,codigo',
            'horas_semanales' => 'required|integer|min:1|max:10',
            'imagen_preset'   => 'nullable|string|max:255',
            'imagen_file'     => 'nullable|image|max:4096',
        ]);

        Materia::create(array_merge($data, [
            'activa' => true,
            'imagen' => $this->resolveImageInput($request),
        ]));

        return redirect()->back()->with('success', 'Materia creada.');
    }

    public function update(Request $request, Materia $materia)
    {
        $data = $request->validate([
            'nombre'          => 'required|string|max:100',
            'area'            => 'required|string|max:100',
            'codigo'          => 'required|string|max:10|unique:materias,codigo,' . $materia->id,
            'horas_semanales' => 'required|integer|min:1|max:10',
            'imagen_preset'   => 'nullable|string|max:255',
            'imagen_file'     => 'nullable|image|max:4096',
        ]);

        $data['imagen'] = $this->resolveImageInput($request, $materia->imagen);
        $materia->update($data);

        return redirect()->back()->with('success', 'Materia actualizada.');
    }

    public function destroy(Materia $materia)
    {
        $materia->delete();
        return redirect()->back()->with('success', 'Materia eliminada.');
    }

    /**
     * Sincronizar los profesores autorizados para una materia.
     * Recibe: { profesores_ids: number[] }
     */
    public function asignarProfesores(Request $request, Materia $materia)
    {
        $data = $request->validate([
            'profesores_ids'   => 'nullable|array',
            'profesores_ids.*' => 'exists:users,id',
        ]);

        // Verificar que todos sean realmente profesores
        $ids = collect($data['profesores_ids'] ?? [])
            ->filter()
            ->unique()
            ->toArray();

        $validIds = User::role('profesor')
            ->whereIn('id', $ids)
            ->pluck('id')
            ->toArray();

        // Sync: reemplaza todas las asociaciones
        $materia->profesores()->sync($validIds);

        return redirect()->back()->with('success', 'Profesores de la materia actualizados.');
    }

    private function resolveImageInput(Request $request, ?string $current = null): string
    {
        if ($request->hasFile('imagen_file')) {
            if ($current && !str_starts_with($current, '/images/presets/')) {
                Storage::disk('public')->delete($current);
            }

            return $request->file('imagen_file')->store('catalogo/materias', 'public');
        }

        $preset = $request->input('imagen_preset');
        if (is_string($preset) && $preset !== '') {
            return $preset;
        }

        return $current ?: '/images/presets/materia-default.svg';
    }
}
