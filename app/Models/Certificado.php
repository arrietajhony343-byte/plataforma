<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certificado extends Model
{
    protected $fillable = [
        'estudiante_id', 'tipo', 'descripcion', 'archivo',
        'estado', 'fecha_solicitud', 'fecha_entrega',
    ];

    protected function casts(): array
    {
        return [
            'fecha_solicitud' => 'date',
            'fecha_entrega'   => 'date',
        ];
    }

    /* ── Relaciones ── */

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'estudiante_id');
    }
}
