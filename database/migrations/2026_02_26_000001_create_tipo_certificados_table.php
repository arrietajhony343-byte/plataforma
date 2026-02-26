<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tipo_certificados', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->string('codigo', 50)->unique();
            $table->text('descripcion')->nullable();
            $table->unsignedInteger('precio')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // Add foreign key to certificados table
        Schema::table('certificados', function (Blueprint $table) {
            $table->foreignId('tipo_certificado_id')->nullable()->after('estudiante_id')->constrained('tipo_certificados')->nullOnDelete();
        });

        // Seed default certificate types
        DB::table('tipo_certificados')->insert([
            ['nombre' => 'Constancia de Estudios', 'codigo' => 'constancia_estudios', 'descripcion' => 'Certifica que el estudiante se encuentra matriculado', 'precio' => 15000, 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Certificado de Notas', 'codigo' => 'certificado_notas', 'descripcion' => 'Historial académico oficial con todas las calificaciones', 'precio' => 20000, 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Constancia de Matrícula', 'codigo' => 'constancia_matricula', 'descripcion' => 'Confirma la matrícula activa del estudiante', 'precio' => 10000, 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Certificado de Conducta', 'codigo' => 'certificado_conducta', 'descripcion' => 'Reporte de comportamiento y disciplina', 'precio' => 15000, 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
            ['nombre' => 'Paz y Salvo', 'codigo' => 'paz_y_salvo', 'descripcion' => 'Certifica que el estudiante está al día en pagos y materiales', 'precio' => 5000, 'activo' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::table('certificados', function (Blueprint $table) {
            $table->dropForeign(['tipo_certificado_id']);
            $table->dropColumn('tipo_certificado_id');
        });
        Schema::dropIfExists('tipo_certificados');
    }
};
