<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        /* ── 1. Tabla sedes ── */
        Schema::create('sedes', function (Blueprint $table) {
            $table->id();
            $table->string('nombre');           // "Sede Cartagena"
            $table->string('ciudad')->nullable();
            $table->string('direccion')->nullable();
            $table->string('telefono')->nullable();
            $table->boolean('activa')->default(true);
            $table->timestamps();
        });

        /* ── 2. Agregar sede_id a users ── */
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('sede_id')
                ->nullable()
                ->after('last_login_at')
                ->constrained('sedes')
                ->nullOnDelete();
        });

        /* ── 3. Agregar sede_id a cursos y actualizar unique constraint ── */
        Schema::table('cursos', function (Blueprint $table) {
            // Eliminar la restricción única anterior (grado, grupo, jornada, anio)
            // SQLite no soporta DROP CONSTRAINT directamente — lo hacemos vía recreación de tabla
            // pero Laravel con SQLite soporta dropUnique si conocemos el nombre del índice
            // Nombre auto-generado: cursos_grado_grupo_jornada_anio_unique
            try {
                $table->dropUnique(['grado', 'grupo', 'jornada', 'anio']);
            } catch (\Exception $e) {
                // Puede fallar en SQLite: ignoramos y agregamos directamente
            }

            $table->foreignId('sede_id')
                ->nullable()
                ->after('activo')
                ->constrained('sedes')
                ->nullOnDelete();
        });

        // Agregar nueva restricción única incluyendo sede_id
        // SQLite: recreamos el índice
        DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS cursos_sede_grado_grupo_jornada_anio_unique ON cursos (sede_id, grado, grupo, jornada, anio)');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS cursos_sede_grado_grupo_jornada_anio_unique');

        Schema::table('cursos', function (Blueprint $table) {
            $table->dropForeign(['sede_id']);
            $table->dropColumn('sede_id');
            $table->unique(['grado', 'grupo', 'jornada', 'anio']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['sede_id']);
            $table->dropColumn('sede_id');
        });

        Schema::dropIfExists('sedes');
    }
};
