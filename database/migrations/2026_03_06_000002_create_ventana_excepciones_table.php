<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ventana_excepciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('periodo_id')->constrained()->cascadeOnDelete();
            $table->enum('tipo', ['profesor', 'curso']);
            $table->unsignedBigInteger('referencia_id');
            $table->string('nombre_referencia', 150);
            $table->text('motivo')->nullable();
            $table->boolean('activa')->default(true);
            $table->timestamps();

            $table->unique(['periodo_id', 'tipo', 'referencia_id'], 'ventana_excepcion_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ventana_excepciones');
    }
};
