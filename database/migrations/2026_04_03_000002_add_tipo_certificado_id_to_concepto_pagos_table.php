<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('concepto_pagos', 'tipo_certificado_id')) {
            Schema::table('concepto_pagos', function (Blueprint $table) {
                $table->foreignId('tipo_certificado_id')
                    ->nullable()
                    ->after('id')
                    ->constrained('tipo_certificados')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('concepto_pagos', 'tipo_certificado_id')) {
            // En SQLite, si el indice persiste al intentar borrar la columna, el rollback falla.
            try {
                Schema::table('concepto_pagos', function (Blueprint $table) {
                    $table->dropIndex(['tipo_certificado_id']);
                });
            } catch (\Throwable $e) {
                // No-op: el indice puede no existir segun el motor/estado previo.
            }

            try {
                Schema::table('concepto_pagos', function (Blueprint $table) {
                    $table->dropForeign(['tipo_certificado_id']);
                });
            } catch (\Throwable $e) {
                // No-op: en algunos motores/estados no hay FK o no aplica el drop.
            }

            Schema::table('concepto_pagos', function (Blueprint $table) {
                $table->dropColumn('tipo_certificado_id');
            });
        }
    }
};
