<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Productos de cafetería
        Schema::create('cafeteria_productos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 150);
            $table->string('categoria', 80)->nullable();         // snacks, bebidas, combos…
            $table->decimal('precio_compra', 12, 2);              // costo unitario (débito)
            $table->decimal('precio_venta', 12, 2);               // precio al público (crédito)
            $table->integer('stock')->default(0);
            $table->integer('stock_minimo')->default(5);          // alerta cuando stock <= min
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        // Movimientos de caja (notas de débito = compras, notas de crédito = ventas)
        Schema::create('cafeteria_movimientos', function (Blueprint $table) {
            $table->id();
            $table->enum('tipo', ['compra', 'venta']);            // compra = débito, venta = crédito
            $table->foreignId('producto_id')->constrained('cafeteria_productos')->cascadeOnDelete();
            $table->integer('cantidad');
            $table->decimal('precio_unitario', 12, 2);            // costo si compra, precio venta si venta
            $table->decimal('total', 12, 2);                      // cantidad × precio_unitario
            $table->string('metodo_pago', 50)->nullable();        // efectivo, transferencia, etc.
            $table->string('referencia', 100)->nullable();
            $table->text('observacion')->nullable();
            $table->foreignId('registrado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['tipo', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cafeteria_movimientos');
        Schema::dropIfExists('cafeteria_productos');
    }
};
