<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Jornada;
use Illuminate\Http\Request;

class JornadaController extends Controller
{
    /**
     * Guardar (upsert) la jornada de un nivel.
     * Body JSON: { nivel: 'preescolar', bloques: [{hora, horaFin, esDescanso?}, ...] }
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'nivel'          => ['required', 'string', 'in:general,preescolar,primaria,bachillerato'],
            'bloques'        => ['required', 'array', 'min:1'],
            'bloques.*.hora'    => ['required', 'string'],
            'bloques.*.horaFin' => ['required', 'string'],
        ]);

        Jornada::updateOrCreate(
            ['nivel' => $data['nivel']],
            ['bloques' => $data['bloques']]
        );

        return response()->json(['ok' => true]);
    }
}
