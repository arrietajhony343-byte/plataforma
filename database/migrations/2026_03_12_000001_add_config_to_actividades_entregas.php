<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Actividades: configuración de entrega ──────────────────────────────
        Schema::table('actividades', function (Blueprint $table) {
            // fecha_entrega en actividades era DATE, cambiamos a DATETIME para precisión
            // En SQLite se maneja como string, así que simplemente renombrar + recrear
            // Añadir campos de configuración
            $table->boolean('permite_entrega_tardia')->default(false)->after('activa');
            $table->integer('max_intentos')->nullable()->after('permite_entrega_tardia'); // null = ilimitado (quiz)
            $table->boolean('cerrada_manualmente')->default(false)->after('max_intentos');
        });

        // ── Entregas: campos adicionales ───────────────────────────────────────
        Schema::table('entregas', function (Blueprint $table) {
            // Agregar campos si no existen
            if (!Schema::hasColumn('entregas', 'nota_devolucion')) {
                $table->text('nota_devolucion')->nullable()->after('retroalimentacion');
            }
            if (!Schema::hasColumn('entregas', 'fecha_limite_individual')) {
                $table->timestamp('fecha_limite_individual')->nullable()->after('fecha_entrega');
            }
            $table->integer('intentos_usados')->default(0)->after('estado');
            $table->json('respuestas_quiz')->nullable()->after('intentos_usados');
            // 'devuelta' como nuevo estado — en SQLite las enums son strings sin restricción
        });
    }

    public function down(): void
    {
        Schema::table('actividades', function (Blueprint $table) {
            $table->dropColumn(['permite_entrega_tardia', 'max_intentos', 'cerrada_manualmente']);
        });

        Schema::table('entregas', function (Blueprint $table) {
            $table->dropColumn(['intentos_usados', 'respuestas_quiz']);
        });
    }
};
