<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CafeteriaProducto extends Model
{
    protected $fillable = [
        'nombre', 'categoria', 'precio_compra', 'precio_venta',
        'stock', 'stock_minimo', 'activo', 'sede_id',
    ];

    protected function casts(): array
    {
        return [
            'precio_compra' => 'decimal:2',
            'precio_venta'  => 'decimal:2',
            'activo'        => 'boolean',
        ];
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(CafeteriaMovimiento::class, 'producto_id');
    }

    public function sede(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Sede::class);
    }

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function scopeStockBajo($query)
    {
        return $query->whereColumn('stock', '<=', 'stock_minimo');
    }
}
