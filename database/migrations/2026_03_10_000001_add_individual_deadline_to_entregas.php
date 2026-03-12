<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('entregas', function (Blueprint $table) {
            $table->timestamp('fecha_limite_individual')->nullable()->after('fecha_entrega')
                  ->comment('Plazo extendido individualmente por el profesor');
            $table->text('nota_devolucion')->nullable()->after('retroalimentacion')
                  ->comment('Motivo de devolución cuando el profesor resetea la entrega');
        });
    }

    public function down(): void
    {
        Schema::table('entregas', function (Blueprint $table) {
            $table->dropColumn(['fecha_limite_individual', 'nota_devolucion']);
        });
    }
};
