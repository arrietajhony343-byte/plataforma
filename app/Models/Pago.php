<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pago extends Model
{
    protected $fillable = [
        'estudiante_id', 'concepto_pago_id', 'periodo_id', 'monto',
        'estado', 'metodo_pago', 'referencia', 'fecha_vencimiento',
        'fecha_pago', 'notas',
    ];

    protected function casts(): array
    {
        return [
            'monto'             => 'decimal:2',
            'fecha_vencimiento' => 'date',
            'fecha_pago'        => 'date',
        ];
    }

    /* ── Relaciones ── */

    public function estudiante(): BelongsTo
    {
        return $this->belongsTo(User::class, 'estudiante_id');
    }

    public function conceptoPago(): BelongsTo
    {
        return $this->belongsTo(ConceptoPago::class);
    }

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(Periodo::class);
    }

    public function comprobantes(): HasMany
    {
        return $this->hasMany(Comprobante::class);
    }

    /* ── Scopes ── */

    public function scopePendiente($query)
    {
        return $query->where('estado', 'pendiente');
    }

    public function scopeVencido($query)
    {
        return $query->where('estado', 'vencido');
    }

    public function scopePagado($query)
    {
        return $query->where('estado', 'pagado');
    }
}
