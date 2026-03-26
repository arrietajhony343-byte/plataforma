<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PeriodoEvento extends Model
{
    protected $table = 'periodo_eventos';

    protected $fillable = [
        'periodo_id',
        'fecha',
        'tipo',
        'titulo',
        'descripcion',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
        ];
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(Periodo::class);
    }
}
