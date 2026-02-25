<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boletines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estudiante_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('periodo_id')->constrained()->cascadeOnDelete();
            $table->foreignId('curso_id')->constrained()->cascadeOnDelete();
            $table->decimal('promedio', 3, 1)->nullable();
            $table->integer('puesto')->nullable();
            $table->text('observacion_general')->nullable();
            $table->string('archivo')->nullable();
            $table->enum('estado', ['borrador', 'generado', 'entregado'])->default('borrador');
            $table->timestamps();

            $table->unique(['estudiante_id', 'periodo_id']);
        });

        Schema::create('certificados', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estudiante_id')->constrained('users')->cascadeOnDelete();
            $table->string('tipo'); // estudio, notas, constancia, paz_y_salvo
            $table->string('descripcion')->nullable();
            $table->string('archivo')->nullable();
            $table->enum('estado', ['solicitado', 'en_proceso', 'listo', 'entregado'])->default('solicitado');
            $table->date('fecha_solicitud');
            $table->date('fecha_entrega')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certificados');
        Schema::dropIfExists('boletines');
    }
};
