<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notificacion extends Model
{
    protected $table = 'notificaciones';

    protected $fillable = [
        'user_id', 'tipo', 'titulo', 'mensaje', 'leida', 'leida_at',
    ];

    protected function casts(): array
    {
        return [
            'leida'    => 'boolean',
            'leida_at' => 'datetime',
        ];
    }

    /* ── Relaciones ── */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /* ── Scopes ── */

    public function scopeNoLeida($query)
    {
        return $query->where('leida', false);
    }
}
