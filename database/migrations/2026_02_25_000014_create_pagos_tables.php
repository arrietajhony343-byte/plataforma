<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('concepto_pagos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre'); // Matrícula, Pensión Febrero, Cafetería, etc.
            $table->text('descripcion')->nullable();
            $table->decimal('monto', 12, 2);
            $table->enum('periodicidad', ['unico', 'mensual', 'anual'])->default('mensual');
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('estudiante_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('concepto_pago_id')->constrained()->cascadeOnDelete();
            $table->foreignId('periodo_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('monto', 12, 2);
            $table->enum('estado', ['pendiente', 'pagado', 'vencido', 'anulado'])->default('pendiente');
            $table->string('metodo_pago')->nullable(); // efectivo, transferencia, PSE, tarjeta
            $table->string('referencia')->nullable(); // número de referencia bancaria
            $table->date('fecha_vencimiento');
            $table->date('fecha_pago')->nullable();
            $table->text('notas')->nullable();
            $table->timestamps();

            $table->index(['estudiante_id', 'estado']);
        });

        Schema::create('comprobantes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pago_id')->constrained()->cascadeOnDelete();
            $table->string('archivo'); // ruta del comprobante subido
            $table->enum('estado', ['pendiente', 'confirmado', 'rechazado'])->default('pendiente');
            $table->text('nota_admin')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comprobantes');
        Schema::dropIfExists('pagos');
        Schema::dropIfExists('concepto_pagos');
    }
};
