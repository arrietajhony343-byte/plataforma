<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Entrega extends Model
{
    protected $fillable = [
        'actividad_id', 'estudiante_id', 'contenido', 'archivo',
        'calificacion', 'retroalimentacion', 'nota_devolucion', 'estado',
        'fecha_entrega', 'fecha_limite_individual',
        'intentos_usados', 'respuestas_quiz',
    ];

    protected function casts(): array
    {
        return [
            'calificacion'           => 'decimal:1',
            'fecha_entrega'          => 'datetime',
            'fecha_limite_individual'=> 'datetime',
            'intentos_usados'        => 'integer',
            'respuestas_quiz'        => 'array',
        ];
    }

    /**
     * Fecha límite efectiva: la individual (si existe y es posterior) o la de la actividad.
     */
    public function fechaLimiteEfectiva(): ?\Carbon\Carbon
    {
        if ($this->fecha_limite_individual) {
            return $this->fecha_limite_individual;
        }
        return $this->actividad?->fecha_entrega;
    }

    /**
     * ¿Puede el estudiante enviar/re-enviar?
     */
    public function puedeEntregar(): bool
    {
        // Si ya fue calificada, no puede
        if ($this->estado === 'calificada') {
            return false;
        }
        // Si tiene límite individual, usarlo
        $limite = $this->fechaLimiteEfectiva();
        if ($limite && now()->gt($limite)) {
            return false;
        }
        return true;
    }

    /* ── Relaciones ── */

    public function actividad(): BelongsTo
    {
        return $this->belongsTo(Actividad::class);
    }

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'estudiante_id');
    }

    /* ── Scopes ── */

    public function scopePendiente($query)
    {
        return $query->where('estado', 'pendiente');
    }

    public function scopeCalificada($query)
    {
        return $query->where('estado', 'calificada');
    }
}
