<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comprobante extends Model
{
    protected $fillable = [
        'pago_id', 'archivo', 'estado', 'nota_admin',
    ];

    /* ── Relaciones ── */

    public function pago(): BelongsTo
    {
        return $this->belongsTo(Pago::class);
    }
}
