<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CafeteriaMovimiento extends Model
{
    protected $fillable = [
        'tipo', 'producto_id', 'cantidad', 'precio_unitario',
        'total', 'metodo_pago', 'referencia', 'observacion', 'registrado_por',
    ];

    protected function casts(): array
    {
        return [
            'precio_unitario' => 'decimal:2',
            'total'           => 'decimal:2',
        ];
    }

    public function producto(): BelongsTo
    {
        return $this->belongsTo(CafeteriaProducto::class, 'producto_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(\App\Models\User::class, 'registrado_por');
    }

    public function scopeCompras($query)
    {
        return $query->where('tipo', 'compra');
    }

    public function scopeVentas($query)
    {
        return $query->where('tipo', 'venta');
    }
}
