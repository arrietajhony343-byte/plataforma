<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Periodo extends Model
{
    protected $fillable = [
        'anio', 'nombre', 'numero', 'fecha_inicio', 'fecha_fin', 'porcentaje', 'estado',
        'notas_abiertas', 'ventana_inicio', 'ventana_fin',
    ];

    protected function casts(): array
    {
        return [
            'fecha_inicio'    => 'date',
            'fecha_fin'       => 'date',
            'porcentaje'      => 'decimal:2',
            'notas_abiertas'  => 'boolean',
            'ventana_inicio'  => 'datetime',
            'ventana_fin'     => 'datetime',
        ];
    }

    /* ── Relaciones ── */

    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class);
    }

    public function notas(): HasMany
    {
        return $this->hasMany(Nota::class);
    }

    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class);
    }

    public function boletines(): HasMany
    {
        return $this->hasMany(Boletin::class);
    }

    public function observadoresPeriodo(): HasMany
    {
        return $this->hasMany(ObservadorPeriodo::class);
    }

    public function excepciones(): HasMany
    {
        return $this->hasMany(VentanaExcepcion::class);
    }

    public function eventos(): HasMany
    {
        return $this->hasMany(PeriodoEvento::class);
    }

    /* ── Scopes ── */

    public function scopeActivo($query)
    {
        return $query->where('estado', 'activo');
    }

    public function scopeAnio($query, int $anio)
    {
        return $query->where('anio', $anio);
    }
}
