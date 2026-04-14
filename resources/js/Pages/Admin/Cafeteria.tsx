import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

/* ════════════════════════════════════════════════════════════════════════════
 * TYPES
 * ════════════════════════════════════════════════════════════════════════════ */
interface Producto {
    id: number;
    nombre: string;
    categoria: string;
    precio_compra: number;
    precio_venta: number;
    stock: number;
    stock_minimo: number;
    activo: boolean;
    stock_bajo: boolean;
    sede_id: number | null;
    sede: string;
}

interface Movimiento {
    id: number;
    tipo: 'compra' | 'venta';
    producto: string;
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    total: number;
    metodo_pago: string | null;
    referencia: string | null;
    observacion: string | null;
    registrado_por: string;
    fecha: string;
}

interface Resumen {
    total_compras: number;
    total_ventas: number;
    costo_vendido: number;
    utilidad_bruta: number;
    productos_total: number;
    productos_activos: number;
    stock_bajo: number;
}

interface Sede {
    id: number;
    nombre: string;
}

interface Props {
    productos: Producto[];
    movimientos: Movimiento[];
    resumen: Resumen;
    sedes: Sede[];
}

/* ═══════════════════════  HELPERS  ═══════════════════════ */
const fmt = (n: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

type Tab = 'inventario' | 'venta' | 'compras' | 'movimientos' | 'resumen';

const CATEGORIAS = ['Snacks', 'Bebidas', 'Combos', 'Postres', 'Otros'];

/* ════════════════════════════════════════════════════════════════════════════
 * COMPONENT
 * ════════════════════════════════════════════════════════════════════════════ */
export default function Cafeteria({ productos: initialProductos, movimientos: initialMovimientos, resumen, sedes }: Props) {
    const [productos] = useState<Producto[]>(initialProductos);
    const [movimientos] = useState<Movimiento[]>(initialMovimientos);

    /* ── Tab ── */
    const [activeTab, setActiveTab] = useState<Tab>('inventario');

    /* ── Search & Filters ── */
    const [search, setSearch] = useState('');
    const [catFiltro, setCatFiltro] = useState('todas');
    const [stockFiltro, setStockFiltro] = useState('todos');
    const [sedeSel, setSedeSel] = useState('todas');

    /* ── Modal Producto ── */
    const [showProductoModal, setShowProductoModal] = useState(false);
    const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
    const blankProducto = { nombre: '', categoria: '', precio_compra: '', precio_venta: '', stock: '', stock_minimo: '5', sede_id: '' };
    const [formProd, setFormProd] = useState(blankProducto);
    const [processing, setProcessing] = useState(false);

    /* ── Modal Compra ── */
    const [showCompraModal, setShowCompraModal] = useState(false);
    const blankCompra = { sede_id: sedeSel !== 'todas' ? sedeSel : '', producto_id: '', cantidad: '', precio_unitario: '', metodo_pago: 'efectivo', referencia: '', observacion: '' };
    const [formCompra, setFormCompra] = useState(blankCompra);

    /* ── Venta rápida ── */
    interface CartItem { producto_id: number; nombre: string; cantidad: number; precio: number; stock: number }
    const [cart, setCart] = useState<CartItem[]>([]);
    const [ventaMetodo, setVentaMetodo] = useState('efectivo');
    const [ventaRef, setVentaRef] = useState('');
    const [ventaObs, setVentaObs] = useState('');
    const [searchVenta, setSearchVenta] = useState('');

    /* ── Filtro movimientos ── */
    const [movTipo, setMovTipo] = useState<'todos' | 'compra' | 'venta'>('todos');

    /* ═══════════ COMPUTED ═══════════ */
    // Productos de la sede seleccionada (sin aplicar búsqueda ni filtros de stock)
    const productosPorSede = useMemo(() => {
        if (sedeSel === 'todas') return productos;
        return productos.filter(p => p.sede_id?.toString() === sedeSel);
    }, [productos, sedeSel]);

    // Set de IDs para filtrar movimientos en O(1)
    const productoIdsBySede = useMemo(() => {
        if (sedeSel === 'todas') return null;
        return new Set(productosPorSede.map(p => p.id));
    }, [productosPorSede, sedeSel]);

    const productosFiltrados = useMemo(() => {
        return productosPorSede.filter(p => {
            const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase());
            const matchCat = catFiltro === 'todas' || p.categoria.toLowerCase() === catFiltro.toLowerCase();
            const matchStock = stockFiltro === 'todos' || (stockFiltro === 'bajo' ? p.stock_bajo : !p.stock_bajo);
            return matchSearch && matchCat && matchStock;
        });
    }, [productosPorSede, search, catFiltro, stockFiltro]);

    const productosVenta = useMemo(() => {
        return productosPorSede.filter(p =>
            p.activo && p.stock > 0 && p.nombre.toLowerCase().includes(searchVenta.toLowerCase())
        );
    }, [productosPorSede, searchVenta]);

    const totalCart = useMemo(() => cart.reduce((s, i) => s + i.cantidad * i.precio, 0), [cart]);

    const movFiltrados = useMemo(() => {
        return movimientos.filter(m => {
            if (movTipo !== 'todos' && m.tipo !== movTipo) return false;
            if (productoIdsBySede && !productoIdsBySede.has(m.producto_id)) return false;
            return true;
        });
    }, [movimientos, movTipo, productoIdsBySede]);

    const categorias = useMemo(() => {
        const cats = new Set(productosPorSede.map(p => p.categoria).filter(Boolean));
        return Array.from(cats).sort();
    }, [productosPorSede]);

    /* ═══════════ HANDLERS ═══════════ */
    const openNewProducto = () => {
        setEditingProducto(null);
        setFormProd(blankProducto);
        setShowProductoModal(true);
    };

    const openEditProducto = (p: Producto) => {
        setEditingProducto(p);
        setFormProd({
            nombre: p.nombre,
            categoria: p.categoria,
            precio_compra: String(p.precio_compra),
            precio_venta: String(p.precio_venta),
            stock: String(p.stock),
            stock_minimo: String(p.stock_minimo),
            sede_id: p.sede_id ? String(p.sede_id) : '',
        });
        setShowProductoModal(true);
    };

    const handleSubmitProducto = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        const payload = {
            nombre: formProd.nombre,
            categoria: formProd.categoria,
            precio_compra: parseFloat(formProd.precio_compra),
            precio_venta: parseFloat(formProd.precio_venta),
            stock: parseInt(formProd.stock),
            stock_minimo: parseInt(formProd.stock_minimo),
            sede_id: formProd.sede_id ? parseInt(formProd.sede_id) : null,
            ...(editingProducto ? { activo: editingProducto.activo } : {}),
        };
        const url = editingProducto
            ? `/admin/cafeteria/productos/${editingProducto.id}`
            : '/admin/cafeteria/productos';
        const method = editingProducto ? 'put' : 'post';
        router[method](url, payload, {
            preserveScroll: true,
            onSuccess: () => setShowProductoModal(false),
            onFinish: () => setProcessing(false),
        });
    }, [formProd, editingProducto]);

    const toggleProductoActivo = (p: Producto) => {
        router.put(`/admin/cafeteria/productos/${p.id}`, {
            nombre: p.nombre, categoria: p.categoria,
            precio_compra: p.precio_compra, precio_venta: p.precio_venta,
            stock: p.stock, stock_minimo: p.stock_minimo,
            sede_id: p.sede_id,
            activo: !p.activo,
        }, { preserveScroll: true });
    };

    const deleteProducto = (p: Producto) => {
        if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
        router.delete(`/admin/cafeteria/productos/${p.id}`, { preserveScroll: true });
    };

    const handleSubmitCompra = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        router.post('/admin/cafeteria/compras', {
            producto_id: parseInt(formCompra.producto_id),
            cantidad: parseInt(formCompra.cantidad),
            precio_unitario: parseFloat(formCompra.precio_unitario),
            metodo_pago: formCompra.metodo_pago || null,
            referencia: formCompra.referencia || null,
            observacion: formCompra.observacion || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowCompraModal(false);
                setFormCompra({ sede_id: sedeSel !== 'todas' ? sedeSel : '', producto_id: '', cantidad: '', precio_unitario: '', metodo_pago: 'efectivo', referencia: '', observacion: '' });
            },
            onFinish: () => setProcessing(false),
        });
    }, [formCompra]);

    const addToCart = (p: Producto) => {
        setCart(prev => {
            const exists = prev.find(i => i.producto_id === p.id);
            if (exists) {
                if (exists.cantidad >= p.stock) return prev;
                return prev.map(i => i.producto_id === p.id ? { ...i, cantidad: i.cantidad + 1 } : i);
            }
            return [...prev, { producto_id: p.id, nombre: p.nombre, cantidad: 1, precio: p.precio_venta, stock: p.stock }];
        });
    };

    const updateCartQty = (prodId: number, qty: number) => {
        if (qty <= 0) {
            setCart(prev => prev.filter(i => i.producto_id !== prodId));
            return;
        }
        setCart(prev => prev.map(i => i.producto_id === prodId ? { ...i, cantidad: Math.min(qty, i.stock) } : i));
    };

    const removeFromCart = (prodId: number) => setCart(prev => prev.filter(i => i.producto_id !== prodId));

    const handleVenta = useCallback(() => {
        if (cart.length === 0) return;
        setProcessing(true);
        router.post('/admin/cafeteria/ventas', {
            items: cart.map(i => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
            metodo_pago: ventaMetodo || null,
            referencia: ventaRef || null,
            observacion: ventaObs || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setCart([]);
                setVentaRef('');
                setVentaObs('');
            },
            onFinish: () => setProcessing(false),
        });
    }, [cart, ventaMetodo, ventaRef, ventaObs]);

    const openCompraConProducto = (p: Producto) => {
        setFormCompra({
            sede_id: p.sede_id ? String(p.sede_id) : (sedeSel !== 'todas' ? sedeSel : ''),
            producto_id: String(p.id),
            cantidad: '',
            precio_unitario: String(p.precio_compra),
            metodo_pago: 'efectivo',
            referencia: '',
            observacion: '',
        });
        setShowCompraModal(true);
    };

    /* ═══════════ TABS CONFIG ═══════════ */
    const tabs: { key: Tab; label: string; icon: string }[] = [
        { key: 'inventario', label: 'Inventario', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
        { key: 'venta', label: 'Venta Rápida', icon: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z' },
        { key: 'compras', label: 'Abastecimiento', icon: 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25m-2.25 0h-2.735a2.25 2.25 0 00-1.89 1.026L3.768 12.126A2.25 2.25 0 003.375 13.5v1.875' },
        { key: 'movimientos', label: 'Movimientos', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5' },
        { key: 'resumen', label: 'Resumen', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
    ];

    const SvgIcon = ({ d }: { d: string }) => (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d={d} />
        </svg>
    );

    /* ════════════════════════════════════════════════════════════════════════
     * RENDER
     * ════════════════════════════════════════════════════════════════════════ */
    return (
        <SidebarLayout menuItems={adminMenuItems}>
            <Head title="Cafetería" />
            <div className="p-6 max-w-7xl mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Cafetería</h1>
                        <p className="text-sm text-gray-500 mt-1">Gestión de inventario, ventas y contabilidad de cafetería</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={openNewProducto} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition" style={{ backgroundColor: '#293577' }}>
                            <SvgIcon d="M12 4.5v15m7.5-7.5h-15" /> Nuevo Producto
                        </button>
                        <button onClick={() => { setFormCompra({ sede_id: sedeSel !== 'todas' ? sedeSel : '', producto_id: '', cantidad: '', precio_unitario: '', metodo_pago: 'efectivo', referencia: '', observacion: '' }); setShowCompraModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition bg-emerald-600 hover:bg-emerald-700">
                            <SvgIcon d="M12 4.5v15m7.5-7.5h-15" /> Registrar Compra
                        </button>
                    </div>
                </div>

                {/* ── Summary Cards ── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Productos Activos</p>
                        <p className="text-3xl font-bold mt-1" style={{ color: '#293577' }}>{resumen.productos_activos}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Ventas</p>
                        <p className="text-3xl font-bold mt-1 text-emerald-600">{fmt(resumen.total_ventas)}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Compras</p>
                        <p className="text-3xl font-bold mt-1 text-red-500">{fmt(resumen.total_compras)}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Utilidad Neta</p>
                        <p className={`text-3xl font-bold mt-1 ${resumen.utilidad_bruta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(resumen.utilidad_bruta)}</p>
                    </div>
                </div>

                {/* ── Stock Bajo Alert ── */}
                {resumen.stock_bajo > 0 && (
                    <div className="flex items-center gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        <SvgIcon d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        <span><strong>{resumen.stock_bajo}</strong> producto(s) con stock bajo o agotado.</span>
                    </div>
                )}

                {/* ── Global: filtro de sede ── */}
                {sedes.length > 1 && (
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                        <svg className="w-4 h-4 text-indigo-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10.5h18M9 21l3-18 3 18" /></svg>
                        <span className="text-sm font-medium text-indigo-700">Sede:</span>
                        <div className="relative">
                            <select value={sedeSel} onChange={e => { setSedeSel(e.target.value); setCart([]); }}
                                className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-indigo-200 text-sm bg-white text-indigo-900 font-medium">
                                <option value="todas">Todas las sedes</option>
                                {sedes.map(s => <option key={s.id} value={String(s.id)}>{s.nombre}</option>)}
                            </select>
                             </div>
                        {sedeSel !== 'todas' && (
                            <span className="text-xs text-indigo-500">Mostrando solo productos y movimientos de esta sede</span>
                        )}
                    </div>
                )}

                {/* ── Tabs ── */}
                <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition whitespace-nowrap ${activeTab === t.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                            <SvgIcon d={t.icon} /> {t.label}
                        </button>
                    ))}
                </div>

                {/* ═══════ TAB: INVENTARIO ═══════ */}
                {activeTab === 'inventario' && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                        {/* Filters */}
                        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
                            <input type="text" placeholder="Buscar producto…" value={search} onChange={e => setSearch(e.target.value)}
                                className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                            {sedes.length > 1 && (
                                <div className="relative">
                                    <select value={sedeSel} onChange={e => setSedeSel(e.target.value)}
                                        className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                                        <option value="todas">Todas las sedes</option>
                                        {sedes.map(s => <option key={s.id} value={String(s.id)}>{s.nombre}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="relative">
                                <select value={catFiltro} onChange={e => setCatFiltro(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                                    <option value="todas">Todas las categorías</option>
                                    {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                               </div>
                            <div className="relative">
                                <select value={stockFiltro} onChange={e => setStockFiltro(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-gray-200 text-sm bg-white">
                                    <option value="todos">Todo stock</option>
                                    <option value="bajo">Stock bajo</option>
                                    <option value="ok">Stock OK</option>
                                </select>
                              </div>
                        </div>
                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Producto</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Categoría</th>
                                        <th className="px-5 py-3 text-right font-semibold text-gray-600">Costo</th>
                                        <th className="px-5 py-3 text-right font-semibold text-gray-600">Precio Venta</th>
                                        <th className="px-5 py-3 text-right font-semibold text-gray-600">Margen</th>
                                        <th className="px-5 py-3 text-center font-semibold text-gray-600">Stock</th>
                                        <th className="px-5 py-3 text-center font-semibold text-gray-600">Estado</th>
                                        <th className="px-5 py-3 text-center font-semibold text-gray-600">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {productosFiltrados.length === 0 && (
                                        <tr><td colSpan={8} className="px-5 py-10 text-center text-gray-400">No se encontraron productos.</td></tr>
                                    )}
                                    {productosFiltrados.map(p => {
                                        const margen = p.precio_venta - p.precio_compra;
                                        return (
                                            <tr key={p.id} className="hover:bg-gray-50 transition">
                                                <td className="px-5 py-3 font-medium text-gray-900">{p.nombre}</td>
                                                <td className="px-5 py-3 text-gray-500">{p.categoria || '—'}</td>
                                                <td className="px-5 py-3 text-right text-gray-600">{fmt(p.precio_compra)}</td>
                                                <td className="px-5 py-3 text-right font-medium text-gray-900">{fmt(p.precio_venta)}</td>
                                                <td className={`px-5 py-3 text-right font-medium ${margen >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(margen)}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${p.stock_bajo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                        {p.stock}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {p.activo ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => openEditProducto(p)} title="Editar" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-indigo-600 transition">
                                                            <SvgIcon d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                        </button>
                                                        <button onClick={() => openCompraConProducto(p)} title="Abastecer" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-emerald-600 transition">
                                                            <SvgIcon d="M12 4.5v15m7.5-7.5h-15" />
                                                        </button>
                                                        <button onClick={() => toggleProductoActivo(p)} title={p.activo ? 'Desactivar' : 'Activar'} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-amber-600 transition">
                                                            <SvgIcon d={p.activo ? 'M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88' : 'M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z'} />
                                                        </button>
                                                        <button onClick={() => deleteProducto(p)} title="Eliminar" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600 transition">
                                                            <SvgIcon d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ═══════ TAB: VENTA RÁPIDA ═══════ */}
                {activeTab === 'venta' && (
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Product picker */}
                        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                            <input type="text" placeholder="Buscar producto para vender…" value={searchVenta} onChange={e => setSearchVenta(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
                                {productosVenta.map(p => (
                                    <button key={p.id} onClick={() => addToCart(p)}
                                        className="flex flex-col items-center gap-1 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition text-center">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#293577' }}>
                                            {p.nombre.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 line-clamp-2">{p.nombre}</span>
                                        <span className="text-xs text-gray-400">Stock: {p.stock}</span>
                                        <span className="text-sm font-bold" style={{ color: '#293577' }}>{fmt(p.precio_venta)}</span>
                                    </button>
                                ))}
                                {productosVenta.length === 0 && <p className="col-span-full text-center text-gray-400 py-10">No hay productos disponibles.</p>}
                            </div>
                        </div>
                        {/* Cart */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Carrito de Venta</h3>
                            {cart.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-10">Agrega productos para vender.</p>
                            ) : (
                                <div className="flex-1 overflow-y-auto space-y-3">
                                    {cart.map(item => (
                                        <div key={item.producto_id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-gray-900">{item.nombre}</p>
                                                <p className="text-xs text-gray-400">{fmt(item.precio)} c/u</p>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => updateCartQty(item.producto_id, item.cantidad - 1)} className="w-7 h-7 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold hover:bg-gray-300">−</button>
                                                <span className="w-8 text-center text-sm font-bold">{item.cantidad}</span>
                                                <button onClick={() => updateCartQty(item.producto_id, item.cantidad + 1)} className="w-7 h-7 rounded-lg bg-gray-200 text-gray-600 flex items-center justify-center text-sm font-bold hover:bg-gray-300">+</button>
                                            </div>
                                            <p className="text-sm font-bold w-24 text-right" style={{ color: '#293577' }}>{fmt(item.cantidad * item.precio)}</p>
                                            <button onClick={() => removeFromCart(item.producto_id)} className="text-red-400 hover:text-red-600">
                                                <SvgIcon d="M6 18L18 6M6 6l12 12" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {cart.length > 0 && (
                                <div className="mt-4 space-y-3 border-t border-gray-200 pt-4">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span style={{ color: '#293577' }}>{fmt(totalCart)}</span>
                                    </div>
                                    <select value={ventaMetodo} onChange={e => setVentaMetodo(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                                        <option value="efectivo">Efectivo</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="nequi">Nequi</option>
                                        <option value="daviplata">Daviplata</option>
                                    </select>
                                    <input type="text" placeholder="Referencia (opcional)" value={ventaRef} onChange={e => setVentaRef(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" />
                                    <button onClick={handleVenta} disabled={processing}
                                        className="w-full py-3 rounded-xl text-white font-semibold text-sm transition disabled:opacity-50"
                                        style={{ backgroundColor: '#293577' }}>
                                        {processing ? 'Procesando…' : 'Confirmar Venta'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════ TAB: COMPRAS / ABASTECIMIENTO ═══════ */}
                {activeTab === 'compras' && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900">Historial de Compras (Notas de Débito)</h3>
                            <button onClick={() => { setFormCompra({ sede_id: sedeSel !== 'todas' ? sedeSel : '', producto_id: '', cantidad: '', precio_unitario: '', metodo_pago: 'efectivo', referencia: '', observacion: '' }); setShowCompraModal(true); }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium bg-emerald-600 hover:bg-emerald-700 transition">
                                <SvgIcon d="M12 4.5v15m7.5-7.5h-15" /> Nueva Compra
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Fecha</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Producto</th>
                                        <th className="px-5 py-3 text-right font-semibold text-gray-600">Cantidad</th>
                                        <th className="px-5 py-3 text-right font-semibold text-gray-600">Costo Unit.</th>
                                        <th className="px-5 py-3 text-right font-semibold text-gray-600">Total</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Método</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Registró</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {movimientos.filter(m => m.tipo === 'compra' && (!productoIdsBySede || productoIdsBySede.has(m.producto_id))).length === 0 && (
                                        <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">Sin compras registradas.</td></tr>
                                    )}
                                    {movimientos.filter(m => m.tipo === 'compra' && (!productoIdsBySede || productoIdsBySede.has(m.producto_id))).map(m => (
                                        <tr key={m.id} className="hover:bg-gray-50 transition">
                                            <td className="px-5 py-3 text-gray-500">{m.fecha}</td>
                                            <td className="px-5 py-3 font-medium text-gray-900">{m.producto}</td>
                                            <td className="px-5 py-3 text-right">{m.cantidad}</td>
                                            <td className="px-5 py-3 text-right text-gray-600">{fmt(m.precio_unitario)}</td>
                                            <td className="px-5 py-3 text-right font-medium text-red-600">{fmt(m.total)}</td>
                                            <td className="px-5 py-3 text-gray-500 capitalize">{m.metodo_pago || '—'}</td>
                                            <td className="px-5 py-3 text-gray-500">{m.registrado_por}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ═══════ TAB: MOVIMIENTOS ═══════ */}
                {activeTab === 'movimientos' && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-600">Filtrar:</span>
                            {(['todos', 'compra', 'venta'] as const).map(t => (
                                <button key={t} onClick={() => setMovTipo(t)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${movTipo === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    {t === 'todos' ? 'Todos' : t === 'compra' ? 'Compras (Débito)' : 'Ventas (Crédito)'}
                                </button>
                            ))}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Fecha</th>
                                        <th className="px-5 py-3 text-center font-semibold text-gray-600">Tipo</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Producto</th>
                                        <th className="px-5 py-3 text-right font-semibold text-gray-600">Cant.</th>
                                        <th className="px-5 py-3 text-right font-semibold text-gray-600">Precio Unit.</th>
                                        <th className="px-5 py-3 text-right font-semibold text-gray-600">Total</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Método</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Observación</th>
                                        <th className="px-5 py-3 text-left font-semibold text-gray-600">Registró</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {movFiltrados.length === 0 && (
                                        <tr><td colSpan={9} className="px-5 py-10 text-center text-gray-400">Sin movimientos.</td></tr>
                                    )}
                                    {movFiltrados.map(m => (
                                        <tr key={m.id} className="hover:bg-gray-50 transition">
                                            <td className="px-5 py-3 text-gray-500">{m.fecha}</td>
                                            <td className="px-5 py-3 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${m.tipo === 'compra' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {m.tipo === 'compra' ? 'Débito' : 'Crédito'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 font-medium text-gray-900">{m.producto}</td>
                                            <td className="px-5 py-3 text-right">{m.cantidad}</td>
                                            <td className="px-5 py-3 text-right text-gray-600">{fmt(m.precio_unitario)}</td>
                                            <td className={`px-5 py-3 text-right font-medium ${m.tipo === 'compra' ? 'text-red-600' : 'text-emerald-600'}`}>{m.tipo === 'compra' ? '-' : '+'}{fmt(m.total)}</td>
                                            <td className="px-5 py-3 text-gray-500 capitalize">{m.metodo_pago || '—'}</td>
                                            <td className="px-5 py-3 text-gray-500 max-w-[200px] truncate">{m.observacion || '—'}</td>
                                            <td className="px-5 py-3 text-gray-500">{m.registrado_por}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ═══════ TAB: RESUMEN ═══════ */}
                {activeTab === 'resumen' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Balance General Cafetería</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-500">Ingresos por ventas (Crédito)</span>
                                    <span className="text-sm font-bold text-emerald-600">{fmt(resumen.total_ventas)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-500">Egresos por compras (Débito)</span>
                                    <span className="text-sm font-bold text-red-500">{fmt(resumen.total_compras)}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-500">Costo de productos vendidos</span>
                                    <span className="text-sm font-bold text-gray-600">{fmt(resumen.costo_vendido)}</span>
                                </div>
                                <div className="flex justify-between py-3 bg-gray-50 rounded-xl px-4">
                                    <span className="text-sm font-semibold text-gray-900">Utilidad Neta (Ventas − Costo)</span>
                                    <span className={`text-lg font-bold ${resumen.utilidad_bruta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(resumen.utilidad_bruta)}</span>
                                </div>
                                <div className="flex justify-between py-3 bg-indigo-50 rounded-xl px-4">
                                    <span className="text-sm font-semibold" style={{ color: '#293577' }}>Flujo de caja (Ventas − Compras)</span>
                                    <span className={`text-lg font-bold ${(resumen.total_ventas - resumen.total_compras) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(resumen.total_ventas - resumen.total_compras)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Estado del Inventario</h3>
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-500">Total de productos</span>
                                    <span className="text-sm font-bold text-gray-900">{resumen.productos_total}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-500">Productos activos</span>
                                    <span className="text-sm font-bold text-emerald-600">{resumen.productos_activos}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-500">Con stock bajo / agotado</span>
                                    <span className={`text-sm font-bold ${resumen.stock_bajo > 0 ? 'text-amber-600' : 'text-gray-400'}`}>{resumen.stock_bajo}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-500">Valor total inventario (costo)</span>
                                    <span className="text-sm font-bold" style={{ color: '#293577' }}>
                                        {fmt(productosPorSede.reduce((s, p) => s + p.stock * p.precio_compra, 0))}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-sm text-gray-500">Valor total inventario (venta)</span>
                                    <span className="text-sm font-bold text-emerald-600">
                                        {fmt(productosPorSede.reduce((s, p) => s + p.stock * p.precio_venta, 0))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ MODAL: PRODUCTO ═══════ */}
                {showProductoModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">{editingProducto ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                                <button onClick={() => setShowProductoModal(false)} className="text-gray-400 hover:text-gray-600"><SvgIcon d="M6 18L18 6M6 6l12 12" /></button>
                            </div>
                            <form onSubmit={handleSubmitProducto} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                    <input type="text" required value={formProd.nombre} onChange={e => setFormProd(p => ({ ...p, nombre: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                    <select value={formProd.categoria} onChange={e => setFormProd(p => ({ ...p, categoria: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                                        <option value="">Sin categoría</option>
                                        {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                {sedes.length > 1 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Sede</label>
                                        <select value={formProd.sede_id} onChange={e => setFormProd(p => ({ ...p, sede_id: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                                            <option value="">Sin asignar</option>
                                            {sedes.map(s => <option key={s.id} value={String(s.id)}>{s.nombre}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio Compra (Costo) *</label>
                                        <input type="number" step="1" min="0" required value={formProd.precio_compra} onChange={e => setFormProd(p => ({ ...p, precio_compra: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio Venta *</label>
                                        <input type="number" step="1" min="0" required value={formProd.precio_venta} onChange={e => setFormProd(p => ({ ...p, precio_venta: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Inicial *</label>
                                        <input type="number" min="0" required value={formProd.stock} onChange={e => setFormProd(p => ({ ...p, stock: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo *</label>
                                        <input type="number" min="0" required value={formProd.stock_minimo} onChange={e => setFormProd(p => ({ ...p, stock_minimo: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                                    </div>
                                </div>
                                <div className="border-t border-gray-200 pt-4 flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowProductoModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                                    <button type="submit" disabled={processing} className="px-4 py-2 rounded-xl text-white text-sm font-medium transition disabled:opacity-50" style={{ backgroundColor: '#293577' }}>
                                        {processing ? 'Guardando…' : editingProducto ? 'Actualizar' : 'Crear Producto'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ═══════ MODAL: COMPRA ═══════ */}
                {showCompraModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold text-gray-900">Registrar Compra (Nota de Débito)</h2>
                                <button onClick={() => setShowCompraModal(false)} className="text-gray-400 hover:text-gray-600"><SvgIcon d="M6 18L18 6M6 6l12 12" /></button>
                            </div>
                            <form onSubmit={handleSubmitCompra} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                <div>
                                    {sedes.length > 1 && (
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Sede *</label>
                                            <select
                                                required
                                                value={formCompra.sede_id}
                                                onChange={e => setFormCompra(f => ({ ...f, sede_id: e.target.value, producto_id: '', precio_unitario: '' }))}
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                                            >
                                                <option value="">Seleccionar sede…</option>
                                                {sedes.map(s => <option key={s.id} value={String(s.id)}>{s.nombre}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Producto *</label>
                                    <select required value={formCompra.producto_id} onChange={e => {
                                        const prod = productos.find(p => p.id === parseInt(e.target.value));
                                        setFormCompra(f => ({ ...f, producto_id: e.target.value, precio_unitario: prod ? String(prod.precio_compra) : f.precio_unitario }));
                                    }} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                                        <option value="">Seleccionar producto…</option>
                                        {productos
                                            .filter(p => !formCompra.sede_id || p.sede_id?.toString() === formCompra.sede_id)
                                            .map(p => <option key={p.id} value={p.id}>{p.nombre} (stock: {p.stock})</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad *</label>
                                        <input type="number" min="1" required value={formCompra.cantidad} onChange={e => setFormCompra(f => ({ ...f, cantidad: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Costo Unitario *</label>
                                        <input type="number" step="1" min="0" required value={formCompra.precio_unitario} onChange={e => setFormCompra(f => ({ ...f, precio_unitario: e.target.value }))}
                                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none" />
                                    </div>
                                </div>
                                {formCompra.cantidad && formCompra.precio_unitario && (
                                    <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between">
                                        <span className="text-sm font-medium text-gray-600">Total Compra</span>
                                        <span className="text-lg font-bold text-red-600">{fmt(parseInt(formCompra.cantidad || '0') * parseFloat(formCompra.precio_unitario || '0'))}</span>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                                    <select value={formCompra.metodo_pago} onChange={e => setFormCompra(f => ({ ...f, metodo_pago: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm">
                                        <option value="efectivo">Efectivo</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="nequi">Nequi</option>
                                        <option value="daviplata">Daviplata</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                                    <input type="text" value={formCompra.referencia} onChange={e => setFormCompra(f => ({ ...f, referencia: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" placeholder="N° factura o referencia" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Observación</label>
                                    <textarea value={formCompra.observacion} onChange={e => setFormCompra(f => ({ ...f, observacion: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm" rows={2} placeholder="Notas adicionales…" />
                                </div>
                                <div className="border-t border-gray-200 pt-4 flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowCompraModal(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                                    <button type="submit" disabled={processing} className="px-4 py-2 rounded-xl text-white text-sm font-medium bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50">
                                        {processing ? 'Registrando…' : 'Registrar Compra'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}
