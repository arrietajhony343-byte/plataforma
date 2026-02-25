<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Actividad extends Model
{
    protected $table = 'actividades';

    protected $fillable = [
        'curso_materia_id', 'titulo', 'descripcion', 'tipo',
        'fecha_asignacion', 'fecha_entrega', 'porcentaje', 'activa',
    ];

    protected function casts(): array
    {
        return [
            'fecha_asignacion' => 'date',
            'fecha_entrega'    => 'date',
            'porcentaje'       => 'decimal:2',
            'activa'           => 'boolean',
        ];
    }

    /* ── Relaciones ── */

    public function cursoMateria(): BelongsTo
    {
        return $this->belongsTo(CursoMateria::class);
    }

    public function entregas(): HasMany
    {
        return $this->hasMany(Entrega::class);
    }

    /* ── Scopes ── */

    public function scopeActiva($query)
    {
        return $query->where('activa', true);
    }

    public function scopeProximas($query)
    {
        return $query->where('fecha_entrega', '>=', now())->orderBy('fecha_entrega');
    }
}
