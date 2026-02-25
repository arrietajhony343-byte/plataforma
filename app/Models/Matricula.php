<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Matricula extends Model
{
    protected $fillable = [
        'estudiante_id', 'curso_id', 'periodo_id', 'estado', 'fecha_matricula',
    ];

    protected function casts(): array
    {
        return [
            'fecha_matricula' => 'date',
        ];
    }

    /* ── Relaciones ── */

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'estudiante_id');
    }

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class);
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(Periodo::class);
    }

    /* ── Scopes ── */

    public function scopeActiva($query)
    {
        return $query->where('estado', 'activa');
    }
}
