<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Jornada extends Model
{
    protected $fillable = ['nivel', 'bloques'];

    protected $casts = [
        'bloques' => 'array',
    ];
}
