<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Entrega extends Model
{
    protected $fillable = [
        'actividad_id', 'estudiante_id', 'contenido', 'archivo',
        'calificacion', 'retroalimentacion', 'estado', 'fecha_entrega',
    ];

    protected function casts(): array
    {
        return [
            'calificacion'  => 'decimal:1',
            'fecha_entrega' => 'datetime',
        ];
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
