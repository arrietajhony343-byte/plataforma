<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('lugar_nacimiento')->nullable()->after('fecha_nacimiento');
            $table->string('grupo_sanguineo', 5)->nullable()->after('genero');
            $table->string('eps')->nullable()->after('grupo_sanguineo');

            $table->boolean('dificultad_aprendizaje')->default(false)->after('eps');
            $table->text('dificultad_aprendizaje_desc')->nullable()->after('dificultad_aprendizaje');

            $table->boolean('diagnostico_salud')->default(false)->after('dificultad_aprendizaje_desc');
            $table->text('diagnostico_salud_desc')->nullable()->after('diagnostico_salud');

            $table->boolean('alergias')->default(false)->after('diagnostico_salud_desc');
            $table->text('alergias_desc')->nullable()->after('alergias');

            $table->string('nombre_madre')->nullable()->after('alergias_desc');
            $table->string('telefono_madre')->nullable()->after('nombre_madre');
            $table->string('ocupacion_madre')->nullable()->after('telefono_madre');

            $table->string('nombre_padre')->nullable()->after('ocupacion_madre');
            $table->string('telefono_padre')->nullable()->after('nombre_padre');
            $table->string('ocupacion_padre')->nullable()->after('telefono_padre');

            $table->string('convive_con')->nullable()->after('ocupacion_padre');
            $table->unsignedTinyInteger('numero_hermanos')->nullable()->after('convive_con');
            $table->string('lugar_que_ocupa_familia')->nullable()->after('numero_hermanos');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'lugar_nacimiento',
                'grupo_sanguineo',
                'eps',
                'dificultad_aprendizaje',
                'dificultad_aprendizaje_desc',
                'diagnostico_salud',
                'diagnostico_salud_desc',
                'alergias',
                'alergias_desc',
                'nombre_madre',
                'telefono_madre',
                'ocupacion_madre',
                'nombre_padre',
                'telefono_padre',
                'ocupacion_padre',
                'convive_con',
                'numero_hermanos',
                'lugar_que_ocupa_familia',
            ]);
        });
    }
};
