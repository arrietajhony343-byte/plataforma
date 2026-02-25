<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('documento')->nullable()->unique()->after('name'); // CC, TI, etc.
            $table->string('tipo_documento')->default('CC')->after('documento'); // CC, TI, CE, RC
            $table->string('telefono')->nullable()->after('email');
            $table->string('direccion')->nullable()->after('telefono');
            $table->date('fecha_nacimiento')->nullable()->after('direccion');
            $table->enum('genero', ['M', 'F', 'otro'])->nullable()->after('fecha_nacimiento');
            $table->string('foto')->nullable()->after('genero');
            $table->boolean('activo')->default(true)->after('foto');
            $table->integer('login_attempts')->default(0)->after('activo');
            $table->timestamp('last_login_at')->nullable()->after('login_attempts');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'documento', 'tipo_documento', 'telefono', 'direccion',
                'fecha_nacimiento', 'genero', 'foto', 'activo',
                'login_attempts', 'last_login_at'
            ]);
        });
    }
};
