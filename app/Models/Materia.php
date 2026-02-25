<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Materia extends Model
{
    protected $fillable = [
        'nombre', 'area', 'codigo', 'horas_semanales', 'activa',
    ];

    protected function casts(): array
    {
        return [
            'activa' => 'boolean',
        ];
    }

    /* ── Relaciones ── */

    public function cursos(): BelongsToMany
    {
        return $this->belongsToMany(Curso::class, 'curso_materia')
                    ->withPivot('profesor_id', 'horas_semanales')
                    ->withTimestamps();
    }

    public function cursoMaterias(): HasMany
    {
        return $this->hasMany(CursoMateria::class);
    }

    /** Profesores autorizados para dictar esta materia */
    public function profesores(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'materia_profesor', 'materia_id', 'profesor_id')
                    ->withTimestamps();
    }

    public function observaciones(): HasMany
    {
        return $this->hasMany(Observacion::class);
    }

    /* ── Scopes ── */

    public function scopeActiva($query)
    {
        return $query->where('activa', true);
    }
}
