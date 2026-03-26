<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ObservadorPeriodo extends Model
{
    protected $table = 'observadores_periodo';

    protected $fillable = [
        'estudiante_id',
        'curso_id',
        'periodo_id',
        'director_id',
        'fecha_realizacion',
        'resumen_general',
        'fortalezas',
        'dificultades',
        'compromisos',
        'ficha',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'fecha_realizacion' => 'date',
            'ficha' => 'array',
        ];
    }

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'estudiante_id');
    }

    public function curso(): BelongsTo
    {
        return $this->belongsTo(Curso::class);
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(Periodo::class);
    }

    public function director(): BelongsTo
    {
        return $this->belongsTo(User::class, 'director_id');
    }
}
