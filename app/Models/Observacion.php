<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Observacion extends Model
{
    protected $table = 'observaciones';

    protected $fillable = [
        'estudiante_id', 'profesor_id', 'materia_id', 'tipo', 'categoria', 'descripcion', 'fecha',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
        ];
    }

    /* ── Relaciones ── */

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'estudiante_id');
    }

    public function profesor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'profesor_id');
    }

    public function materia(): BelongsTo
    {
        return $this->belongsTo(Materia::class);
    }

    /* ── Scopes ── */

    public function scopePositiva($query)
    {
        return $query->where('tipo', 'positiva');
    }

    public function scopeNegativa($query)
    {
        return $query->where('tipo', 'negativa');
    }
}
