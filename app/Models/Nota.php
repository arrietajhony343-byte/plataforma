<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Nota extends Model
{
    protected $fillable = [
        'estudiante_id', 'curso_materia_id', 'periodo_id', 'valor', 'tipo', 'descripcion',
    ];

    protected function casts(): array
    {
        return [
            'valor' => 'decimal:1',
        ];
    }

    /* ── Relaciones ── */

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'estudiante_id');
    }

    public function cursoMateria(): BelongsTo
    {
        return $this->belongsTo(CursoMateria::class);
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(Periodo::class);
    }

    /* ── Scopes ── */

    public function scopeTipo($query, string $tipo)
    {
        return $query->where('tipo', $tipo);
    }
}
