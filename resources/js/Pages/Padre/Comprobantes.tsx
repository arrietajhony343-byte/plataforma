import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { padreMenuItems } from '@/Config/padreMenu';

interface HijoOption {
    id: number;
    nombre: string;
}

interface ComprobanteItem {
    id: number;
    referencia: string | null;
    concepto: string;
    detalle: string | null;
    monto: number;
    fecha_pago: string | null;
    metodo_pago: string | null;
    estado: 'pendiente' | 'confirmado' | 'rechazado';
}

interface Props {
    hijos: HijoOption[];
    hijo: { id: number; nombre: string } | null;
    comprobantes: ComprobanteItem[];
}

export default function Comprobantes({ hijos, hijo, comprobantes }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterYear, setFilterYear] = useState<string>('todos');

    const formatMonto = (monto: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(monto);
    };

    const years = useMemo(() => {
        const set = new Set<string>();
        comprobantes.forEach((c) => {
            if (c.fecha_pago) set.add(c.fecha_pago.slice(0, 4));
        });
        return Array.from(set).sort((a, b) => b.localeCompare(a));
    }, [comprobantes]);

    const filtered = comprobantes.filter((c) => {
        const s = searchTerm.toLowerCase();
        const text = `${c.referencia || ''} ${c.concepto} ${c.detalle || ''}`.toLowerCase();
        const bySearch = text.includes(s);
        const byYear = filterYear === 'todos' || (c.fecha_pago ? c.fecha_pago.startsWith(filterYear) : false);
        return bySearch && byYear;
    });

    const total = filtered.reduce((sum, c) => sum + c.monto, 0);

    const onHijoChange = (id: number) => {
        router.get('/padre/comprobantes', { hijo_id: id }, { preserveState: true });
    };

    return (
        <SidebarLayout menuItems={padreMenuItems} userInfo={{ name: 'Padre', role: 'Padre' }}>
            <Head title="Comprobantes" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {!hijo ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                        <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Comprobantes</h1>
                        <p className="text-gray-500 mt-2">No hay hijos vinculados para consultar comprobantes.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Comprobantes de Pago</h1>
                                <p className="text-gray-600">Historial de comprobantes de {hijo.nombre}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {hijos.length > 1 && (
                                    <select value={hijo.id} onChange={(e) => onHijoChange(Number(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent min-w-[220px]">
                                        {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                                    </select>
                                )}
                                <div className="bg-white rounded-xl border border-gray-100 px-4 py-2">
                                    <p className="text-xs text-gray-500">Total filtrado</p>
                                    <p className="text-xl font-bold text-green-600">{formatMonto(total)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 p-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    placeholder="Buscar por referencia o concepto..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577]"
                                />
                                <select
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577]"
                                >
                                    <option value="todos">Todos los anos</option>
                                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <div className="divide-y">
                                {filtered.length === 0 && (
                                    <div className="p-8 text-center text-gray-500 text-sm">No hay comprobantes con los filtros actuales.</div>
                                )}

                                {filtered.map((c) => (
                                    <div key={c.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-gray-800">{c.concepto}</p>
                                            <p className="text-xs text-gray-500">Ref: {c.referencia || 'Sin referencia'} · {c.fecha_pago || 'Sin fecha'}</p>
                                            {c.detalle && <p className="text-xs text-gray-500 mt-1">{c.detalle}</p>}
                                        </div>

                                        <div className="md:text-right">
                                            <p className="font-bold text-gray-800">{formatMonto(c.monto)}</p>
                                            <p className="text-xs text-gray-500">{c.metodo_pago || 'Metodo no registrado'}</p>
                                        </div>

                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                                            c.estado === 'confirmado' ? 'bg-green-100 text-green-700' :
                                            c.estado === 'rechazado' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {c.estado}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </SidebarLayout>
    );
}
