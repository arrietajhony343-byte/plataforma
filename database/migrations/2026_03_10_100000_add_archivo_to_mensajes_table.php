<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('mensajes', function (Blueprint $table) {
            $table->string('archivo_url')->nullable()->after('asunto');
            $table->string('archivo_nombre')->nullable()->after('archivo_url');
            $table->string('archivo_tipo')->nullable()->after('archivo_nombre');
            $table->unsignedInteger('archivo_tamano')->nullable()->after('archivo_tipo');
        });
    }

    public function down(): void
    {
        Schema::table('mensajes', function (Blueprint $table) {
            $table->dropColumn(['archivo_url', 'archivo_nombre', 'archivo_tipo', 'archivo_tamano']);
        });
    }
};
