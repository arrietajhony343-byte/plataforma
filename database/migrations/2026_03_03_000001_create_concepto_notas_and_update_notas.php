<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add notas_abiertas flag to periodos
        Schema::table('periodos', function (Blueprint $table) {
            $table->boolean('notas_abiertas')->default(true)->after('estado');
        });

        // 2. Create concepto_notas — breakdown of evaluation concepts per curso_materia + periodo
        Schema::create('concepto_notas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('curso_materia_id')->constrained('curso_materia')->cascadeOnDelete();
            $table->foreignId('periodo_id')->constrained()->cascadeOnDelete();
            $table->string('nombre');                          // "Actividades", "Participación", etc.
            $table->decimal('porcentaje', 5, 2);               // Weight out of 100
            $table->enum('tipo', ['actividades', 'manual'])->default('manual');
            $table->integer('orden')->default(0);
            $table->timestamps();

            $table->unique(['curso_materia_id', 'periodo_id', 'nombre'], 'cm_periodo_nombre_unique');
        });

        // 3. Add concepto_nota_id FK to notas table
        Schema::table('notas', function (Blueprint $table) {
            $table->foreignId('concepto_nota_id')->nullable()->after('periodo_id')
                  ->constrained('concepto_notas')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('notas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('concepto_nota_id');
        });

        Schema::dropIfExists('concepto_notas');

        Schema::table('periodos', function (Blueprint $table) {
            $table->dropColumn('notas_abiertas');
        });
    }
};
