<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asistencias', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estudiante_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('curso_materia_id')->constrained('curso_materia')->cascadeOnDelete();
            $table->foreignId('horario_bloque_id')->nullable()->constrained('horario_bloques')->nullOnDelete();
            $table->date('fecha');
            $table->enum('estado', ['presente', 'ausente', 'tarde', 'excusa'])->default('presente');
            $table->text('observacion')->nullable();
            $table->foreignId('registrado_por')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            // Un estudiante solo puede tener un registro por materia+bloque+fecha
            $table->unique(['estudiante_id', 'curso_materia_id', 'fecha', 'horario_bloque_id'], 'asist_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asistencias');
    }
};
