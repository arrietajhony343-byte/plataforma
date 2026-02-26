<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TipoCertificado extends Model
{
    protected $fillable = [
        'nombre',
        'codigo',
        'descripcion',
        'precio',
        'activo',
    ];

    protected function casts(): array
    {
        return [
            'precio' => 'integer',
            'activo' => 'boolean',
        ];
    }

    /* ── Scopes ── */

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    /* ── Relaciones ── */

    public function certificados(): HasMany
    {
        return $this->hasMany(Certificado::class);
    }
}
