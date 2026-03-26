<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Jornada;
use Illuminate\Http\Request;

class JornadaController extends Controller
{
    /**
     * Guardar (upsert) la jornada de un nivel.
     * Body JSON: { nivel: 'prejardin', bloques: [{hora, horaFin, esDescanso?}, ...] }
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nivel'          => ['required', 'string', 'in:general,prejardin,preescolar,primaria,bachillerato'],
            'bloques'        => ['required', 'array', 'min:1'],
            'bloques.*.hora'    => ['required', 'string'],
            'bloques.*.horaFin' => ['required', 'string'],
            'bloques.*.esDescanso' => ['nullable', 'boolean'],
        ]);

        // Compatibilidad retro: unificar clave de nivel.
        if ($data['nivel'] === 'preescolar') {
            $data['nivel'] = 'prejardin';
        }

        Jornada::updateOrCreate(
            ['nivel' => $data['nivel']],
            ['bloques' => $data['bloques']]
        );

        // Inertia espera una redirección/response de Inertia, no JSON plano.
        if ($request->header('X-Inertia')) {
            return back(303)->with('success', 'Jornada guardada correctamente.');
        }

        return response()->json(['ok' => true]);
    }
}
