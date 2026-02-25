<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cursos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre'); // "Preescolar A", "1°A", "2°B", "11°A"
            $table->enum('nivel', ['preescolar', 'transicion', 'primaria', 'bachillerato']);
            $table->string('grado'); // "Pre-jardín", "1°", "2°", ... "11°"
            $table->string('grupo')->default('A'); // A, B, C
            $table->string('jornada')->default('mañana'); // mañana, tarde
            $table->integer('anio');
            $table->integer('cupo_maximo')->default(35);
            $table->foreignId('director_grupo_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->unique(['grado', 'grupo', 'jornada', 'anio']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cursos');
    }
};
