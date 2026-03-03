<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Curso extends Model
{
    protected $fillable = [
        'nombre', 'nivel', 'grado', 'grupo', 'jornada', 'anio',
        'cupo_maximo', 'director_grupo_id', 'activo', 'sede_id',
    ];

    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
        ];
    }

    /* ── Relaciones ── */

    public function directorGrupo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'director_grupo_id');
    }

    public function sede(): BelongsTo
    {
        return $this->belongsTo(Sede::class);
    }

    public function materias(): BelongsToMany
    {
        return $this->belongsToMany(Materia::class, 'curso_materia')
                    ->withPivot('profesor_id', 'horas_semanales')
                    ->withTimestamps();
    }

    public function cursoMaterias(): HasMany
    {
        return $this->hasMany(CursoMateria::class);
    }

    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class);
    }

    public function boletines(): HasMany
    {
        return $this->hasMany(Boletin::class);
    }

    /** Estudiantes matriculados (a través de matrículas activas) */
    public function estudiantes(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'matriculas', 'curso_id', 'estudiante_id')
                    ->withPivot('periodo_id', 'estado', 'fecha_matricula')
                    ->withTimestamps();
    }

    /* ── Scopes ── */

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function scopeAnio($query, int $anio)
    {
        return $query->where('anio', $anio);
    }
}
