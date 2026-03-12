<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mensaje extends Model
{
    protected $fillable = [
        'remitente_id', 'destinatario_id', 'contenido', 'asunto', 'leido', 'leido_at',
        'archivo_url', 'archivo_nombre', 'archivo_tipo', 'archivo_tamano',
    ];

    protected function casts(): array
    {
        return [
            'leido'    => 'boolean',
            'leido_at' => 'datetime',
        ];
    }

    /* ── Relaciones ── */

    public function remitente(): BelongsTo
    {
        return $this->belongsTo(User::class, 'remitente_id');
    }

    public function destinatario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'destinatario_id');
    }

    /* ── Scopes ── */

    public function scopeNoLeido($query)
    {
        return $query->where('leido', false);
    }

    /** Mensajes de una conversación entre dos usuarios */
    public function scopeConversacion($query, int $userId1, int $userId2)
    {
        return $query->where(function ($q) use ($userId1, $userId2) {
            $q->where('remitente_id', $userId1)->where('destinatario_id', $userId2);
        })->orWhere(function ($q) use ($userId1, $userId2) {
            $q->where('remitente_id', $userId2)->where('destinatario_id', $userId1);
        });
    }
}
