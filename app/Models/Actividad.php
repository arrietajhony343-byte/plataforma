<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Actividad extends Model
{
    protected $table = 'actividades';

    protected $fillable = [
        'curso_materia_id', 'periodo_id', 'titulo', 'descripcion', 'archivo_instrucciones',
        'instrucciones_extra', 'tipo', 'fecha_asignacion', 'fecha_entrega',
        'porcentaje', 'activa', 'tiene_preguntas',
    ];

    protected function casts(): array
    {
        return [
            'fecha_asignacion'   => 'date',
            'fecha_entrega'      => 'datetime',
            'porcentaje'         => 'decimal:2',
            'activa'             => 'boolean',
            'tiene_preguntas'    => 'boolean',
            'instrucciones_extra'=> 'array',
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

    public function entregas(): HasMany
    {
        return $this->hasMany(Entrega::class);
    }

    public function preguntas(): HasMany
    {
        return $this->hasMany(Pregunta::class)->orderBy('orden');
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
