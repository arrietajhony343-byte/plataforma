<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add instruction file and extra fields to actividades
        Schema::table('actividades', function (Blueprint $table) {
            $table->string('archivo_instrucciones')->nullable()->after('descripcion');
            $table->json('instrucciones_extra')->nullable()->after('archivo_instrucciones');
            $table->boolean('tiene_preguntas')->default(false)->after('activa');
        });

        // Preguntas for quiz/examen type activities
        Schema::create('preguntas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actividad_id')->constrained('actividades')->cascadeOnDelete();
            $table->text('enunciado');
            $table->string('imagen')->nullable();
            $table->enum('tipo', ['seleccion_multiple', 'verdadero_falso', 'abierta'])->default('seleccion_multiple');
            $table->decimal('puntos', 5, 2)->default(1);
            $table->integer('orden')->default(0);
            $table->timestamps();
        });

        // Opciones for multiple choice questions
        Schema::create('opciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pregunta_id')->constrained('preguntas')->cascadeOnDelete();
            $table->text('texto');
            $table->string('imagen')->nullable();
            $table->boolean('es_correcta')->default(false);
            $table->integer('orden')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opciones');
        Schema::dropIfExists('preguntas');

        Schema::table('actividades', function (Blueprint $table) {
            $table->dropColumn(['archivo_instrucciones', 'instrucciones_extra', 'tiene_preguntas']);
        });
    }
};
