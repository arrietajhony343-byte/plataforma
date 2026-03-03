<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sede extends Model
{
    protected $fillable = [
        'nombre',
        'ciudad',
        'direccion',
        'telefono',
        'activa',
    ];

    protected function casts(): array
    {
        return [
            'activa' => 'boolean',
        ];
    }

    /* ── Relaciones ── */

    /** Usuarios (estudiantes y profesores) de esta sede */
    public function usuarios(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /** Cursos de esta sede */
    public function cursos(): HasMany
    {
        return $this->hasMany(Curso::class);
    }

    /* ── Scopes ── */

    public function scopeActiva($query)
    {
        return $query->where('activa', true);
    }
}
