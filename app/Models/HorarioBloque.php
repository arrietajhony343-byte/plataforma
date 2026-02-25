<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HorarioBloque extends Model
{
    protected $fillable = [
        'curso_materia_id', 'dia', 'hora_inicio', 'hora_fin', 'salon',
    ];

    /* ── Relaciones ── */

    public function cursoMateria(): BelongsTo
    {
        return $this->belongsTo(CursoMateria::class);
    }
}
