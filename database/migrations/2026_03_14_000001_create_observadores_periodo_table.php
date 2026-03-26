<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('observadores_periodo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estudiante_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('curso_id')->constrained()->cascadeOnDelete();
            $table->foreignId('periodo_id')->constrained()->cascadeOnDelete();
            $table->foreignId('director_id')->constrained('users')->cascadeOnDelete();
            $table->date('fecha_realizacion')->nullable();
            $table->text('resumen_general')->nullable();
            $table->text('fortalezas')->nullable();
            $table->text('dificultades')->nullable();
            $table->text('compromisos')->nullable();
            $table->json('ficha')->nullable();
            $table->enum('estado', ['borrador', 'completo'])->default('borrador');
            $table->timestamps();

            $table->unique(['estudiante_id', 'curso_id', 'periodo_id'], 'obs_periodo_unique');
            $table->index(['curso_id', 'periodo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('observadores_periodo');
    }
};
