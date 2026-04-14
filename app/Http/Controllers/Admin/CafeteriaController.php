<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\ScopesBySede;
use App\Models\{CafeteriaProducto, CafeteriaMovimiento, Sede};
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CafeteriaController extends Controller
{
    use ScopesBySede;

    /* ════════════════════════════════════════════════════════════════════════
     * INDEX
     * ════════════════════════════════════════════════════════════════════════ */
    public function index(): Response
    {
        $sedeId = $this->sedeId();

        $sedes = Sede::where('activa', true)
            ->when($sedeId, fn($q) => $q->where('id', $sedeId))
            ->orderBy('nombre')
            ->get()
            ->map(fn($s) => ['id' => $s->id, 'nombre' => $s->nombre])
            ->values();

        $productos = CafeteriaProducto::with('sede:id,nombre')
            ->when($sedeId, fn($q) => $q->where('sede_id', $sedeId))
            ->orderBy('nombre')
            ->get()
            ->map(fn(CafeteriaProducto $p) => [
                'id'             => $p->id,
                'nombre'         => $p->nombre,
                'categoria'      => $p->categoria ?? '',
                'precio_compra'  => (float) $p->precio_compra,
                'precio_venta'   => (float) $p->precio_venta,
                'stock'          => $p->stock,
                'stock_minimo'   => $p->stock_minimo,
                'activo'         => $p->activo,
                'stock_bajo'     => $p->stock <= $p->stock_minimo,
                'sede_id'        => $p->sede_id,
                'sede'           => $p->sede?->nombre ?? '—',
            ]);

        $movimientos = CafeteriaMovimiento::with(['producto:id,nombre,sede_id', 'usuario:id,name'])
            ->when($sedeId, fn($q) =>
                $q->whereHas('producto', fn($pq) => $pq->where('sede_id', $sedeId))
            )
            ->orderByDesc('created_at')
            ->limit(300)
            ->get()
            ->map(fn(CafeteriaMovimiento $m) => [
                'id'              => $m->id,
                'tipo'            => $m->tipo,
                'producto'        => $m->producto->nombre ?? '—',
                'producto_id'     => $m->producto_id,
                'cantidad'        => $m->cantidad,
                'precio_unitario' => (float) $m->precio_unitario,
                'total'           => (float) $m->total,
                'metodo_pago'     => $m->metodo_pago,
                'referencia'      => $m->referencia,
                'observacion'     => $m->observacion,
                'registrado_por'  => $m->usuario->name ?? '—',
                'fecha'           => $m->created_at->format('Y-m-d H:i'),
            ]);

        // Base de movimientos filtrada por sede para resumen
        $movBase = CafeteriaMovimiento::when($sedeId, fn($q) =>
            $q->whereHas('producto', fn($pq) => $pq->where('sede_id', $sedeId))
        );

        $totalCompras = (clone $movBase)->where('tipo', 'compra')->sum('total');
        $totalVentas  = (clone $movBase)->where('tipo', 'venta')->sum('total');

        $costoVendido = (clone $movBase)->where('cafeteria_movimientos.tipo', 'venta')
            ->join('cafeteria_productos', 'cafeteria_movimientos.producto_id', '=', 'cafeteria_productos.id')
            ->selectRaw('SUM(cafeteria_movimientos.cantidad * cafeteria_productos.precio_compra) as costo')
            ->value('costo') ?? 0;

        $prodBase = CafeteriaProducto::when($sedeId, fn($q) => $q->where('sede_id', $sedeId));

        $resumen = [
            'total_compras'     => (float) $totalCompras,
            'total_ventas'      => (float) $totalVentas,
            'costo_vendido'     => (float) $costoVendido,
            'utilidad_bruta'    => (float) $totalVentas - (float) $costoVendido,
            'productos_total'   => (clone $prodBase)->count(),
            'productos_activos' => (clone $prodBase)->activo()->count(),
            'stock_bajo'        => (clone $prodBase)->activo()->stockBajo()->count(),
        ];

        return Inertia::render('Admin/Cafeteria', [
            'productos'   => $productos,
            'movimientos' => $movimientos,
            'resumen'     => $resumen,
            'sedes'       => $sedes,
        ]);
    }

    /* ════════════════════════════════════════════════════════════════════════
     * PRODUCTOS — CRUD
     * ════════════════════════════════════════════════════════════════════════ */
    public function storeProducto(Request $request)
    {
        $data = $request->validate([
            'nombre'        => 'required|string|max:150',
            'categoria'     => 'nullable|string|max:80',
            'precio_compra' => 'required|numeric|min:0',
            'precio_venta'  => 'required|numeric|min:0',
            'stock'         => 'required|integer|min:0',
            'stock_minimo'  => 'required|integer|min:0',
            'sede_id'       => 'nullable|exists:sedes,id',
        ]);

        CafeteriaProducto::create(array_merge($data, ['activo' => true]));

        return redirect()->back()->with('success', 'Producto creado exitosamente.');
    }

    public function updateProducto(Request $request, CafeteriaProducto $producto)
    {
        $data = $request->validate([
            'nombre'        => 'required|string|max:150',
            'categoria'     => 'nullable|string|max:80',
            'precio_compra' => 'required|numeric|min:0',
            'precio_venta'  => 'required|numeric|min:0',
            'stock'         => 'required|integer|min:0',
            'stock_minimo'  => 'required|integer|min:0',
            'activo'        => 'required|boolean',
            'sede_id'       => 'nullable|exists:sedes,id',
        ]);

        $producto->update($data);

        return redirect()->back()->with('success', 'Producto actualizado.');
    }

    public function destroyProducto(CafeteriaProducto $producto)
    {
        if ($producto->movimientos()->exists()) {
            return redirect()->back()->with('error', 'No se puede eliminar: tiene movimientos registrados.');
        }

        $producto->delete();

        return redirect()->back()->with('success', 'Producto eliminado.');
    }

    /* ════════════════════════════════════════════════════════════════════════
     * COMPRAS — Nota de Débito
     * ════════════════════════════════════════════════════════════════════════ */
    public function registrarCompra(Request $request)
    {
        $data = $request->validate([
            'producto_id'     => 'required|exists:cafeteria_productos,id',
            'cantidad'        => 'required|integer|min:1',
            'precio_unitario' => 'required|numeric|min:0',
            'metodo_pago'     => 'nullable|string|max:50',
            'referencia'      => 'nullable|string|max:100',
            'observacion'     => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($data) {
            $producto = CafeteriaProducto::lockForUpdate()->findOrFail($data['producto_id']);
            $total    = $data['cantidad'] * $data['precio_unitario'];

            CafeteriaMovimiento::create([
                'tipo'            => 'compra',
                'producto_id'     => $producto->id,
                'cantidad'        => $data['cantidad'],
                'precio_unitario' => $data['precio_unitario'],
                'total'           => $total,
                'metodo_pago'     => $data['metodo_pago'] ?? null,
                'referencia'      => $data['referencia'] ?? null,
                'observacion'     => $data['observacion'] ?? null,
                'registrado_por'  => auth()->id(),
            ]);

            $producto->increment('stock', $data['cantidad']);

            if ((float) $producto->precio_compra !== (float) $data['precio_unitario']) {
                $producto->update(['precio_compra' => $data['precio_unitario']]);
            }
        });

        return redirect()->back()->with('success', "Compra registrada: {$data['cantidad']} unidades.");
    }

    /* ════════════════════════════════════════════════════════════════════════
     * VENTAS — Nota de Crédito (venta rápida multi-item)
     * ════════════════════════════════════════════════════════════════════════ */
    public function registrarVenta(Request $request)
    {
        $data = $request->validate([
            'items'                   => 'required|array|min:1',
            'items.*.producto_id'     => 'required|exists:cafeteria_productos,id',
            'items.*.cantidad'        => 'required|integer|min:1',
            'metodo_pago'             => 'nullable|string|max:50',
            'referencia'              => 'nullable|string|max:100',
            'observacion'             => 'nullable|string|max:500',
        ]);

        // Cargar todos los productos de una sola query y verificar stock antes de abrir transacción
        $ids      = collect($data['items'])->pluck('producto_id');
        $productos = CafeteriaProducto::whereIn('id', $ids)->get()->keyBy('id');

        $errores = [];
        foreach ($data['items'] as $item) {
            $p = $productos->get($item['producto_id']);
            if (!$p || $p->stock < $item['cantidad']) {
                $errores[] = "Stock insuficiente de " . ($p?->nombre ?? "producto #{$item['producto_id']}") . " (disponible: " . ($p?->stock ?? 0) . ").";
            }
        }

        if (!empty($errores)) {
            return redirect()->back()->with('error', implode(' ', $errores));
        }

        // Todo OK — procesar en una única transacción atómica (todo o nada)
        DB::transaction(function () use ($data, $ids) {
            // Re-cargar con lock para evitar race conditions
            $productos = CafeteriaProducto::whereIn('id', $ids)
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            foreach ($data['items'] as $item) {
                $producto = $productos->get($item['producto_id']);

                // Segunda verificación dentro del lock
                if ($producto->stock < $item['cantidad']) {
                    throw new \RuntimeException(
                        "Stock insuficiente de {$producto->nombre} (disponible: {$producto->stock})."
                    );
                }

                CafeteriaMovimiento::create([
                    'tipo'            => 'venta',
                    'producto_id'     => $producto->id,
                    'cantidad'        => $item['cantidad'],
                    'precio_unitario' => $producto->precio_venta,
                    'total'           => $item['cantidad'] * (float) $producto->precio_venta,
                    'metodo_pago'     => $data['metodo_pago'] ?? null,
                    'referencia'      => $data['referencia'] ?? null,
                    'observacion'     => $data['observacion'] ?? null,
                    'registrado_por'  => auth()->id(),
                ]);

                $producto->decrement('stock', $item['cantidad']);
            }
        });

        return redirect()->back()->with('success', 'Venta registrada exitosamente.');
    }
}
