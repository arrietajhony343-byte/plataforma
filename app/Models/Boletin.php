<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Boletin extends Model
{
    protected $table = 'boletines';

    protected $fillable = [
        'estudiante_id', 'periodo_id', 'curso_id', 'promedio',
        'puesto', 'observacion_general', 'archivo', 'estado',
    ];

    protected function casts(): array
    {
        return [
            'promedio' => 'decimal:1',
        ];
    }

    /* ── Relaciones ── */

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'estudiante_id');
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(Periodo::class);
    }

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class);
    }
}
