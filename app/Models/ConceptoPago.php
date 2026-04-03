<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConceptoPago extends Model
{
    protected $fillable = [
        'tipo_certificado_id', 'nombre', 'descripcion', 'monto', 'periodicidad', 'activo',
    ];

    protected function casts(): array
    {
        return [
            'monto'  => 'decimal:2',
            'activo' => 'boolean',
        ];
    }

    /* ── Relaciones ── */

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class);
    }

    public function tipoCertificado(): BelongsTo
    {
        return $this->belongsTo(TipoCertificado::class);
    }

    /* ── Scopes ── */

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
