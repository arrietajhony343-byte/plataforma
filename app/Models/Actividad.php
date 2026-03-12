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
        'permite_entrega_tardia', 'max_intentos', 'cerrada_manualmente',
    ];

    protected function casts(): array
    {
        return [
            'fecha_asignacion'        => 'date',
            'fecha_entrega'           => 'datetime',
            'porcentaje'              => 'decimal:2',
            'activa'                  => 'boolean',
            'tiene_preguntas'         => 'boolean',
            'instrucciones_extra'     => 'array',
            'permite_entrega_tardia'  => 'boolean',
            'max_intentos'            => 'integer',
            'cerrada_manualmente'     => 'boolean',
        ];
    }

    /**
     * Determina si el estudiante puede entregar ahora.
     * Toma en cuenta fecha_entrega, permite_entrega_tardia y cerrada_manualmente.
     */
    public function estaAbierta(): bool
    {
        if (!$this->activa || $this->cerrada_manualmente) {
            return false;
        }
        if ($this->fecha_entrega && now()->gt($this->fecha_entrega)) {
            return $this->permite_entrega_tardia;
        }
        return true;
    }

    /**
     * ¿Pasó la fecha límite general?
     */
    public function estaVencida(): bool
    {
        return $this->fecha_entrega && now()->gt($this->fecha_entrega);
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
