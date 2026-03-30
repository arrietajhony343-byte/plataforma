<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProfesorEvento extends Model
{
    protected $table = 'profesor_eventos';

    protected $fillable = [
        'user_id',
        'titulo',
        'descripcion',
        'fecha',
        'hora',
        'color',
    ];

    protected function casts(): array
    {
        return [
            'fecha' => 'date',
        ];
    }

    public function profesor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
