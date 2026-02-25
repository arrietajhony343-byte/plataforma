<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('periodos', function (Blueprint $table) {
            $table->id();
            $table->integer('anio');
            $table->string('nombre'); // "Primer Periodo", "Segundo Periodo", etc.
            $table->integer('numero'); // 1, 2, 3, 4
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->decimal('porcentaje', 5, 2)->default(25.00); // peso del periodo
            $table->enum('estado', ['activo', 'finalizado', 'pendiente'])->default('pendiente');
            $table->timestamps();

            $table->unique(['anio', 'numero']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('periodos');
    }
};
