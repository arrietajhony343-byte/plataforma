<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cafeteria_productos', function (Blueprint $table) {
            $table->foreignId('sede_id')->nullable()->after('activo')->constrained('sedes')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('cafeteria_productos', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\Sede::class);
        });
    }
};
