<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Campo para forzar cambio de contraseña en primer login
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('must_change_password')->default(false)->after('last_login_at');
        });

        // Tabla de logs de actividad de usuarios (admin)
        Schema::create('user_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('action'); // crear, editar, activar, bloquear, eliminar
            $table->string('performed_by_name'); // nombre del admin que realizó la acción
            $table->foreignId('performed_by_id')->constrained('users')->cascadeOnDelete();
            $table->text('reason')->nullable();
            $table->json('details')->nullable(); // datos adicionales
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_activity_logs');

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('must_change_password');
        });
    }
};
