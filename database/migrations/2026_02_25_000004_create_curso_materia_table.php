<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Pivot: qué materia se dicta en qué curso y quién la da
        Schema::create('curso_materia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('curso_id')->constrained()->cascadeOnDelete();
            $table->foreignId('materia_id')->constrained()->cascadeOnDelete();
            $table->foreignId('profesor_id')->constrained('users')->cascadeOnDelete();
            $table->integer('horas_semanales')->default(4);
            $table->timestamps();

            $table->unique(['curso_id', 'materia_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('curso_materia');
    }
};
