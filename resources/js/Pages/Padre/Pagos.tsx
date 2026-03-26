import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { padreMenuItems } from '@/Config/padreMenu';

interface HijoOption {
    id: number;
    nombre: string;
}

interface PagoItem {
    id: number;
    concepto: string;
    detalle: string | null;
    periodo: string | null;
    monto: number;
    estado: 'pendiente' | 'pagado' | 'vencido' | 'anulado';
    metodo_pago: string | null;
    referencia: string | null;
    fecha_vencimiento: string | null;
    fecha_pago: string | null;
    es_certificado: boolean;
}

interface Props {
    hijos: HijoOption[];
    hijo: { id: number; nombre: string } | null;
    pagos: PagoItem[];
    resumen: {
        total_pagado: number;
        total_pendiente: number;
        total_general: number;
    };
}

export default function Pagos({ hijos, hijo, pagos, resumen }: Props) {
    const [selectedPago, setSelectedPago] = useState<PagoItem | null>(null);
    const [metodoPago, setMetodoPago] = useState<'tarjeta' | 'pse' | 'nequi' | 'transferencia' | 'efectivo'>('tarjeta');
    const [referencia, setReferencia] = useState('');

    const formatMonto = (monto: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(monto);
    };

    const onHijoChange = (id: number) => {
        router.get('/padre/pagos', { hijo_id: id }, { preserveState: true });
    };

    const proximoPago = useMemo(() => {
        return pagos.find((p) => p.estado === 'pendiente' || p.estado === 'vencido') ?? null;
    }, [pagos]);

    const procesarPago = () => {
        if (!selectedPago) return;

        router.post(`/padre/pagos/${selectedPago.id}/pagar`, {
            metodo_pago: metodoPago,
            referencia: referencia || null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelectedPago(null);
                setReferencia('');
                setMetodoPago('tarjeta');
            },
        });
    };

    return (
        <SidebarLayout menuItems={padreMenuItems} userInfo={{ name: 'Padre', role: 'Padre' }}>
            <Head title="Pagos" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {!hijo ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                        <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Pagos</h1>
                        <p className="text-gray-500 mt-2">No hay hijos vinculados para visualizar pagos.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Pagos</h1>
                                <p className="text-gray-600">Estado de cuenta de {hijo.nombre}</p>
                            </div>
                            {hijos.length > 1 && (
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Cambiar de hijo/a</p>
                                    <select
                                        value={hijo.id}
                                        onChange={(e) => onHijoChange(Number(e.target.value))}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent min-w-[220px]"
                                    >
                                        {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
                                <p className="text-sm text-gray-500">Total Pagado</p>
                                <p className="text-2xl font-bold text-green-600">{formatMonto(resumen.total_pagado)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-amber-500">
                                <p className="text-sm text-gray-500">Total Pendiente</p>
                                <p className="text-2xl font-bold text-amber-600">{formatMonto(resumen.total_pendiente)}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#293577]">
                                <p className="text-sm text-gray-500">Total General</p>
                                <p className="text-2xl font-bold text-[#293577]">{formatMonto(resumen.total_general)}</p>
                                <div className="mt-2 h-2 bg-gray-200 rounded-full">
                                    <div className="h-2 bg-green-500 rounded-full" style={{ width: resumen.total_general > 0 ? `${(resumen.total_pagado / resumen.total_general) * 100}%` : '0%' }} />
                                </div>
                            </div>
                        </div>

                        {proximoPago && (
                            <div className={`rounded-xl shadow-sm p-5 ${proximoPago.estado === 'vencido' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'}`}>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <p className="font-bold text-gray-800">Proximo pago</p>
                                        <p className="text-lg font-semibold mt-1">{proximoPago.concepto}</p>
                                        <p className="text-sm text-gray-600">Vence: {proximoPago.fecha_vencimiento || '—'}</p>
                                        {proximoPago.detalle && <p className="text-xs text-gray-500 mt-1">{proximoPago.detalle}</p>}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-gray-800">{formatMonto(proximoPago.monto)}</p>
                                        <button
                                            onClick={() => setSelectedPago(proximoPago)}
                                            className="mt-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                        >
                                            Pagar ahora
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                            <div className="px-4 py-3 border-b bg-gray-50">
                                <h3 className="font-semibold text-gray-700">Detalle de pagos</h3>
                            </div>

                            <div className="divide-y">
                                {pagos.length === 0 && <div className="p-6 text-center text-gray-500 text-sm">No hay pagos registrados.</div>}

                                {pagos.map((p) => (
                                    <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <p className="font-medium text-gray-800">{p.concepto}</p>
                                            <p className="text-xs text-gray-500">{p.periodo || 'Sin periodo'} · Vence: {p.fecha_vencimiento || '—'}</p>
                                            {p.detalle && <p className="text-xs text-gray-500 mt-1">{p.detalle}</p>}
                                            {p.es_certificado && <span className="inline-block mt-2 px-2 py-0.5 bg-[#293577]/10 text-[#293577] text-xs rounded-full">Tramite de certificado</span>}
                                        </div>

                                        <div className="sm:text-right">
                                            <p className="font-bold text-gray-800">{formatMonto(p.monto)}</p>
                                            <p className="text-xs text-gray-500 mt-1">{p.fecha_pago ? `Pagado: ${p.fecha_pago}` : `Estado: ${p.estado}`}</p>
                                        </div>

                                        <div>
                                            {p.estado === 'pagado' ? (
                                                <button
                                                    onClick={() => router.get('/padre/comprobantes', { hijo_id: hijo.id }, { preserveState: true })}
                                                    className="text-[#293577] hover:text-[#181b49] text-sm font-semibold"
                                                >
                                                    Ver comprobante
                                                </button>
                                            ) : p.estado === 'anulado' ? (
                                                <span className="text-xs text-gray-400">Anulado</span>
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedPago(p)}
                                                    className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700"
                                                >
                                                    Pagar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {selectedPago && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-[#181b49]">Confirmar pago</h2>
                            <button onClick={() => setSelectedPago(null)} className="text-gray-400 hover:text-gray-700">✕</button>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-500">Concepto</p>
                            <p className="font-semibold text-gray-800">{selectedPago.concepto}</p>
                            <p className="text-2xl font-bold text-[#293577] mt-2">{formatMonto(selectedPago.monto)}</p>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="text-sm text-gray-600">Metodo de pago</label>
                                <select
                                    value={metodoPago}
                                    onChange={(e) => setMetodoPago(e.target.value as typeof metodoPago)}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577]"
                                >
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="pse">PSE</option>
                                    <option value="nequi">Nequi</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="efectivo">Efectivo</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm text-gray-600">Referencia (opcional)</label>
                                <input
                                    value={referencia}
                                    onChange={(e) => setReferencia(e.target.value)}
                                    placeholder="Ej: TXN-12345"
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577]"
                                />
                            </div>
                        </div>

                        <button
                            onClick={procesarPago}
                            className="mt-5 w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold"
                        >
                            Confirmar pago
                        </button>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
