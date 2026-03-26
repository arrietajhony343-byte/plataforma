<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('periodo_eventos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('periodo_id')->constrained('periodos')->cascadeOnDelete();
            $table->date('fecha');
            $table->enum('tipo', ['evento', 'reunion_padres', 'institucional', 'academico', 'otro'])->default('evento');
            $table->string('titulo', 150);
            $table->string('descripcion', 300)->nullable();
            $table->timestamps();

            $table->index(['periodo_id', 'fecha']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('periodo_eventos');
    }
};
