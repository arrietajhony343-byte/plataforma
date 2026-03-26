<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cursos', function (Blueprint $table) {
            if (!Schema::hasColumn('cursos', 'imagen')) {
                $table->string('imagen')->nullable()->after('sede_id');
            }
        });

        Schema::table('materias', function (Blueprint $table) {
            if (!Schema::hasColumn('materias', 'imagen')) {
                $table->string('imagen')->nullable()->after('activa');
            }
        });
    }

    public function down(): void
    {
        Schema::table('cursos', function (Blueprint $table) {
            if (Schema::hasColumn('cursos', 'imagen')) {
                $table->dropColumn('imagen');
            }
        });

        Schema::table('materias', function (Blueprint $table) {
            if (Schema::hasColumn('materias', 'imagen')) {
                $table->dropColumn('imagen');
            }
        });
    }
};
