<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConceptoNota extends Model
{
    protected $table = 'concepto_notas';

    protected $fillable = [
        'curso_materia_id', 'periodo_id', 'nombre', 'porcentaje', 'tipo', 'orden',
    ];

    protected function casts(): array
    {
        return [
            'porcentaje' => 'decimal:2',
        ];
    }

    /* ── Relaciones ── */

    public function cursoMateria(): BelongsTo
    {
        return $this->belongsTo(CursoMateria::class);
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(Periodo::class);
    }

    public function notas(): HasMany
    {
        return $this->hasMany(Nota::class);
    }
}
