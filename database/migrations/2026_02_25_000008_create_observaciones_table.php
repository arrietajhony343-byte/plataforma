<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('observaciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estudiante_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('profesor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('materia_id')->nullable()->constrained()->nullOnDelete();
            $table->enum('tipo', ['positiva', 'negativa']);
            $table->string('categoria'); // Participación, Desempeño Académico, Incumplimiento, etc.
            $table->text('descripcion');
            $table->date('fecha');
            $table->timestamps();

            $table->index(['estudiante_id', 'tipo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('observaciones');
    }
};
