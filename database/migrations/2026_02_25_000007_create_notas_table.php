<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estudiante_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('curso_materia_id')->constrained('curso_materia')->cascadeOnDelete();
            $table->foreignId('periodo_id')->constrained()->cascadeOnDelete();
            $table->decimal('valor', 3, 1); // 0.0 a 5.0
            $table->string('tipo')->default('definitiva'); // parcial, quiz, examen, definitiva
            $table->string('descripcion')->nullable();
            $table->timestamps();

            $table->index(['estudiante_id', 'periodo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notas');
    }
};
