<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('entregas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actividad_id')->constrained('actividades')->cascadeOnDelete();
            $table->foreignId('estudiante_id')->constrained('users')->cascadeOnDelete();
            $table->text('contenido')->nullable();
            $table->string('archivo')->nullable();
            $table->decimal('calificacion', 3, 1)->nullable(); // 0.0 a 5.0
            $table->text('retroalimentacion')->nullable();
            $table->enum('estado', ['pendiente', 'entregada', 'calificada', 'atrasada'])->default('pendiente');
            $table->timestamp('fecha_entrega')->nullable();
            $table->timestamps();

            $table->unique(['actividad_id', 'estudiante_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('entregas');
    }
};
