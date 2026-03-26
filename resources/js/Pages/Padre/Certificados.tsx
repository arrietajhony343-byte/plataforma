import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { padreMenuItems } from '@/Config/padreMenu';

interface HijoOption {
    id: number;
    nombre: string;
}

interface TipoCertificado {
    id: number;
    nombre: string;
    descripcion: string | null;
    precio: number;
    codigo: string;
}

interface Solicitud {
    id: number;
    tipo: string;
    precio: number;
    descripcion: string | null;
    estado: 'solicitado' | 'en_proceso' | 'listo' | 'entregado';
    fecha_solicitud: string | null;
    fecha_entrega: string | null;
    pago: {
        id: number;
        estado: 'pendiente' | 'pagado' | 'vencido' | 'anulado';
        monto: number;
        fecha_vencimiento: string | null;
        fecha_pago: string | null;
    } | null;
}

interface Props {
    hijos: HijoOption[];
    hijo: { id: number; nombre: string } | null;
    tipos: TipoCertificado[];
    solicitudes: Solicitud[];
}

export default function Certificados({ hijos, hijo, tipos, solicitudes }: Props) {
    const { data, setData, post, processing, reset, errors } = useForm({
        hijo_id: hijo?.id ?? 0,
        tipo_certificado_id: tipos[0]?.id ?? 0,
        descripcion: '',
    });

    useEffect(() => {
        if (hijo) {
            setData('hijo_id', hijo.id);
        }
    }, [hijo, setData]);

    const formatMonto = (monto: number) => new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(monto);

    const onHijoChange = (id: number) => {
        router.get('/padre/certificados', { hijo_id: id }, { preserveState: true });
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/padre/certificados', {
            preserveScroll: true,
            onSuccess: () => reset('descripcion'),
        });
    };

    return (
        <SidebarLayout menuItems={padreMenuItems} userInfo={{ name: 'Padre', role: 'Padre' }}>
            <Head title="Solicitud de Certificados" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {!hijo ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                        <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Solicitud de Certificados</h1>
                        <p className="text-gray-500 mt-2">No hay hijos vinculados para solicitar tramites.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Solicitud de Certificados</h1>
                                <p className="text-gray-600">Gestiona solicitudes y revisa su estado para {hijo.nombre}</p>
                            </div>
                            {hijos.length > 1 && (
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Cambiar de hijo/a</p>
                                    <select value={hijo.id} onChange={(e) => onHijoChange(Number(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg min-w-[220px] focus:ring-2 focus:ring-[#293577] focus:border-transparent">
                                        {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-1">
                                <h2 className="font-bold text-[#181b49] mb-4">Nueva solicitud</h2>
                                <form onSubmit={submit} className="space-y-3">
                                    <div>
                                        <label className="text-sm text-gray-600">Tipo de certificado</label>
                                        <select
                                            value={data.tipo_certificado_id}
                                            onChange={(e) => setData('tipo_certificado_id', Number(e.target.value))}
                                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent"
                                        >
                                            {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre} - {formatMonto(t.precio)}</option>)}
                                        </select>
                                        {errors.tipo_certificado_id && <p className="text-xs text-red-600 mt-1">{errors.tipo_certificado_id}</p>}
                                    </div>

                                    <div>
                                        <label className="text-sm text-gray-600">Detalle (opcional)</label>
                                        <textarea
                                            value={data.descripcion}
                                            onChange={(e) => setData('descripcion', e.target.value)}
                                            rows={4}
                                            placeholder="Describe para que necesitas el certificado"
                                            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent"
                                        />
                                        {errors.descripcion && <p className="text-xs text-red-600 mt-1">{errors.descripcion}</p>}
                                    </div>

                                    <button type="submit" disabled={processing || tipos.length === 0} className="w-full px-4 py-2 rounded-lg bg-[#293577] text-white font-semibold hover:bg-[#181b49] disabled:opacity-60">
                                        {processing ? 'Enviando...' : 'Solicitar certificado'}
                                    </button>
                                </form>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-100 p-5 lg:col-span-2">
                                <h2 className="font-bold text-[#181b49] mb-4">Tipos disponibles</h2>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {tipos.map((t) => (
                                        <div key={t.id} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                                            <p className="font-semibold text-gray-800">{t.nombre}</p>
                                            <p className="text-xs text-gray-500 mt-1">{t.descripcion || 'Sin descripcion adicional'}</p>
                                            <p className="text-sm font-bold text-[#293577] mt-2">{formatMonto(t.precio)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <div className="px-4 py-3 border-b bg-gray-50">
                                <h3 className="font-semibold text-gray-700">Historial de solicitudes</h3>
                            </div>

                            <div className="divide-y">
                                {solicitudes.length === 0 && (
                                    <div className="p-6 text-center text-gray-500 text-sm">Aun no hay solicitudes registradas.</div>
                                )}

                                {solicitudes.map((s) => (
                                    <div key={s.id} className="p-4">
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-gray-800">{s.tipo}</p>
                                                <p className="text-sm text-gray-500">Solicitado: {s.fecha_solicitud || '—'}</p>
                                                {s.descripcion && <p className="text-sm text-gray-600 mt-1">{s.descripcion}</p>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                    s.estado === 'entregado' ? 'bg-green-100 text-green-700' :
                                                    s.estado === 'listo' ? 'bg-blue-100 text-blue-700' :
                                                    s.estado === 'en_proceso' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {s.estado.replace('_', ' ')}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#293577]/10 text-[#293577]">{formatMonto(s.precio)}</span>
                                            </div>
                                        </div>

                                        {s.pago && (
                                            <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                                <div className="text-sm text-gray-600">
                                                    <p>Pago: <strong className="text-gray-800">{s.pago.estado}</strong> · {formatMonto(s.pago.monto)}</p>
                                                    <p className="text-xs">Vence: {s.pago.fecha_vencimiento || '—'} {s.pago.fecha_pago ? `· Pagado: ${s.pago.fecha_pago}` : ''}</p>
                                                </div>
                                                {s.pago.estado !== 'pagado' && (
                                                    <button
                                                        onClick={() => router.get('/padre/pagos', { hijo_id: hijo.id }, { preserveState: true })}
                                                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
                                                    >
                                                        Ir a pagar
                                                    </button>
                                                )}
                                            </div>
                                        )}
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
