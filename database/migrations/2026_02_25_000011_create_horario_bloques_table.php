<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('horario_bloques', function (Blueprint $table) {
            $table->id();
            $table->foreignId('curso_materia_id')->constrained('curso_materia')->cascadeOnDelete();
            $table->enum('dia', ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']);
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->string('salon')->nullable();
            $table->timestamps();

            $table->unique(['curso_materia_id', 'dia', 'hora_inicio']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('horario_bloques');
    }
};
