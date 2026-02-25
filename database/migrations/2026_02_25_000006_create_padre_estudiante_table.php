<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('padre_estudiante', function (Blueprint $table) {
            $table->id();
            $table->foreignId('padre_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('estudiante_id')->constrained('users')->cascadeOnDelete();
            $table->string('parentesco')->default('padre'); // padre, madre, acudiente
            $table->timestamps();

            $table->unique(['padre_id', 'estudiante_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('padre_estudiante');
    }
};
