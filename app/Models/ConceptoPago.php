<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConceptoPago extends Model
{
    protected $fillable = [
        'nombre', 'descripcion', 'monto', 'periodicidad', 'activo',
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

    /* ── Scopes ── */

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
}
