<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VentanaExcepcion extends Model
{
    protected $table = 'ventana_excepciones';

    protected $fillable = [
        'periodo_id', 'tipo', 'referencia_id', 'nombre_referencia', 'motivo', 'activa',
    ];

    protected function casts(): array
    {
        return [
            'activa' => 'boolean',
        ];
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(Periodo::class);
    }
}
