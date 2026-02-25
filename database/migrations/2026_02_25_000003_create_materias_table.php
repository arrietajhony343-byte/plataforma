<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('materias', function (Blueprint $table) {
            $table->id();
            $table->string('nombre'); // Matemáticas, Español, etc.
            $table->string('area'); // Ciencias Exactas, Humanidades, etc.
            $table->string('codigo')->unique(); // MAT, ESP, CN, etc.
            $table->integer('horas_semanales')->default(4);
            $table->boolean('activa')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materias');
    }
};
