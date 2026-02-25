<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('actividades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('curso_materia_id')->constrained('curso_materia')->cascadeOnDelete();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->enum('tipo', ['tarea', 'quiz', 'examen', 'proyecto', 'taller']);
            $table->date('fecha_asignacion');
            $table->date('fecha_entrega');
            $table->decimal('porcentaje', 5, 2)->default(0); // peso en la nota
            $table->boolean('activa')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('actividades');
    }
};
