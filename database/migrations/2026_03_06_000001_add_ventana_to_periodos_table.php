<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('periodos', function (Blueprint $table) {
            $table->dateTime('ventana_inicio')->nullable()->after('notas_abiertas');
            $table->dateTime('ventana_fin')->nullable()->after('ventana_inicio');
        });
    }

    public function down(): void
    {
        Schema::table('periodos', function (Blueprint $table) {
            $table->dropColumn(['ventana_inicio', 'ventana_fin']);
        });
    }
};
