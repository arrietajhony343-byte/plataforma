<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Asistencia extends Model
{
    protected $fillable = [
        'estudiante_id',
        'curso_materia_id',
        'horario_bloque_id',
        'fecha',
        'estado',
        'observacion',
        'registrado_por',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
        ];
    }

    /* ── Relaciones ── */

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'estudiante_id');
    }

    public function cursoMateria(): BelongsTo
    {
        return $this->belongsTo(CursoMateria::class);
    }

    public function horarioBloque(): BelongsTo
    {
        return $this->belongsTo(HorarioBloque::class);
    }

    public function registrador(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registrado_por');
    }

    /* ── Scopes ── */

    public function scopeFecha($query, string $fecha)
    {
        return $query->where('fecha', $fecha);
    }
}
