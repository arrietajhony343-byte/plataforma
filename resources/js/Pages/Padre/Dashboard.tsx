import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, Link, router } from '@inertiajs/react';
import { padreMenuItems } from '@/Config/padreMenu';

interface HijoOption {
    id: number;
    nombre: string;
}

interface HijoData {
    id: number;
    nombre: string;
    grado: string;
    seccion: string;
    foto: string | null;
    promedio: number;
    materias_aprobadas: number;
    materias_totales: number;
    asistencia: number;
}

interface ActividadData {
    id: number;
    materia: string;
    actividad: string;
    fecha: string | null;
    profesor: string;
}

interface Notificacion {
    id: number;
    tipo: 'nota' | 'actividad' | 'pago' | 'mensaje' | 'alerta';
    titulo: string;
    descripcion: string;
    tiempo: string;
    leida: boolean;
}

interface NotaReciente {
    materia: string;
    nota: number;
    tipo: string;
    fecha: string | null;
}

interface EstadoPago {
    ultimoPago: string | null;
    proximoPago: string | null;
    vencimiento: string | null;
    monto: number;
    estado: 'pendiente' | 'pagado' | 'vencido' | string;
}

interface AlertaItem {
    id: string;
    tipo: 'alerta';
    origen: 'asistencia' | 'observador';
    titulo: string;
    descripcion: string;
    fecha: string | null;
}

interface Props {
    padre: {
        nombre: string;
    };
    hijos: HijoOption[];
    hijo: HijoData | null;
    proximasActividades: ActividadData[];
    notificaciones: Notificacion[];
    ultimasNotas: NotaReciente[];
    estadoPagos: EstadoPago | null;
    alertas: AlertaItem[];
}

export default function Dashboard({ padre, hijos, hijo, proximasActividades, notificaciones, ultimasNotas, estadoPagos, alertas }: Props) {
    const notifNoLeidas = notificaciones.filter((n) => !n.leida).length;

    const getNotifIcon = (tipo: string) => {
        switch (tipo) {
            case 'alerta': return 'bg-red-100 text-red-600';
            case 'nota': return 'bg-blue-100 text-blue-600';
            case 'actividad': return 'bg-green-100 text-green-600';
            case 'pago': return 'bg-yellow-100 text-yellow-600';
            case 'mensaje': return 'bg-purple-100 text-purple-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const formatFecha = (f: string | null) => {
        if (!f) return '—';
        const d = new Date(f);
        if (Number.isNaN(d.getTime())) return f;
        return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    return (
        <SidebarLayout menuItems={padreMenuItems} userInfo={{ name: padre.nombre, role: 'Padre' }}>
            <Head title="Dashboard Padre" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {!hijo ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                        <h1 className="text-2xl font-extrabold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>Sin hijos vinculados</h1>
                        <p className="text-gray-500 mt-2">No hay estudiantes asociados a este acudiente. Contacta a administracion para relacionar el estudiante.</p>
                    </div>
                ) : (
                    <>
                        <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #181b49 0%, #293577 50%, #171f54 100%)' }}>
                            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                    {hijo.nombre.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl font-extrabold" style={{ fontFamily: "'Inter', sans-serif" }}>
                                        Bienvenido, {padre.nombre}
                                    </h1>
                                    <p className="text-blue-100">{hijo.nombre} · {hijo.grado} - Seccion {hijo.seccion}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {hijos.length > 1 && (
                                        <div className="text-right">
                                            <p className="text-[11px] uppercase tracking-wide text-blue-100/90 font-semibold mb-1">
                                                Cambiar de hijo/a
                                            </p>
                                            <select
                                                value={hijo.id}
                                                onChange={(e) => router.get('/padre/dashboard', { hijo_id: e.target.value }, { preserveState: true })}
                                                className="bg-white/15 border border-white/20 text-white rounded-lg px-3 py-2 text-sm min-w-[220px]"
                                                aria-label="Cambiar de hijo o hija"
                                            >
                                                {hijos.map((h) => (
                                                    <option key={h.id} value={h.id} className="text-gray-900">{h.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    {notifNoLeidas > 0 && (
                                        <Link href="/padre/notificaciones" className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-colors text-sm font-semibold">
                                            {notifNoLeidas} nuevas
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <div className="text-3xl font-bold" style={{ color: '#891248' }}>{hijo.promedio.toFixed(1)}</div>
                                <p className="text-gray-600 text-sm mt-1">Promedio General</p>
                                <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                                    <div className="h-1.5 rounded-full" style={{ width: `${(hijo.promedio / 5) * 100}%`, backgroundColor: '#891248' }} />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <div className="text-3xl font-bold" style={{ color: '#073f65' }}>{hijo.materias_aprobadas}/{hijo.materias_totales}</div>
                                <p className="text-gray-600 text-sm mt-1">Materias Aprobadas</p>
                                <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                                    <div className="h-1.5 rounded-full" style={{ width: `${(hijo.materias_aprobadas / hijo.materias_totales) * 100}%`, backgroundColor: '#073f65' }} />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <div className="text-3xl font-bold" style={{ color: '#185929' }}>{hijo.asistencia}%</div>
                                <p className="text-gray-600 text-sm mt-1">Asistencia (30 dias)</p>
                                <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                                    <div className="h-1.5 rounded-full" style={{ width: `${hijo.asistencia}%`, backgroundColor: '#185929' }} />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <div className={`text-3xl font-bold ${estadoPagos?.estado === 'pagado' ? 'text-green-600' : estadoPagos?.estado === 'vencido' ? 'text-red-600' : 'text-yellow-600'}`}>
                                    {estadoPagos?.estado === 'pagado' ? 'OK' : estadoPagos?.estado === 'vencido' ? '!' : '$'}
                                </div>
                                <p className="text-gray-600 text-sm mt-1">Estado de Pago</p>
                                <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                                    estadoPagos?.estado === 'pagado' ? 'bg-green-100 text-green-800' :
                                    estadoPagos?.estado === 'vencido' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {estadoPagos?.estado === 'pagado' ? 'Al dia' : estadoPagos?.estado === 'vencido' ? 'Vencido' : 'Pendiente'}
                                </span>
                            </div>
                        </div>

                        {alertas.length > 0 && (
                            <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-2xl">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                                    </span>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-red-800">Observaciones y alertas de asistencia</h3>
                                        <div className="space-y-1 mt-1">
                                            {alertas.slice(0, 3).map((a) => (
                                                <p key={a.id} className="text-sm text-red-700">
                                                    [{a.origen === 'asistencia' ? 'Asistencia' : 'Observador'}] {a.descripcion}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                    <Link href="/padre/seguimiento" className="text-red-700 hover:text-red-900 text-sm font-semibold whitespace-nowrap">
                                        Ver detalle →
                                    </Link>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow-sm">
                                <div className="flex justify-between items-center p-4 border-b">
                                    <h2 className="text-lg font-semibold text-gray-800">Ultimas Notas</h2>
                                    <Link href="/padre/boletin" className="text-[#293577] hover:underline text-sm">Ver boletin →</Link>
                                </div>
                                {ultimasNotas.length === 0 ? (
                                    <div className="p-6 text-sm text-gray-500">Aun no hay notas registradas para este estudiante.</div>
                                ) : (
                                    <div className="divide-y">
                                        {ultimasNotas.map((nota, i) => (
                                            <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                                <div>
                                                    <p className="font-medium text-gray-800">{nota.materia}</p>
                                                    <p className="text-xs text-gray-500">{nota.tipo} - {formatFecha(nota.fecha)}</p>
                                                </div>
                                                <div className={`text-lg font-bold px-3 py-1 rounded-lg ${
                                                    nota.nota >= 4.0 ? 'bg-green-100 text-green-700' :
                                                    nota.nota >= 3.0 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {nota.nota.toFixed(1)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white rounded-xl shadow-sm">
                                <div className="flex justify-between items-center p-4 border-b">
                                    <h2 className="text-lg font-semibold text-gray-800">Notificaciones</h2>
                                    <Link href="/padre/notificaciones" className="text-[#293577] hover:underline text-sm">Ver todas →</Link>
                                </div>
                                {notificaciones.length === 0 ? (
                                    <div className="p-6 text-sm text-gray-500">No hay notificaciones recientes.</div>
                                ) : (
                                    <div className="divide-y">
                                        {notificaciones.slice(0, 4).map((notif) => (
                                            <div key={notif.id} className={`p-4 flex items-start gap-3 hover:bg-gray-50 ${!notif.leida ? 'bg-blue-50' : ''}`}>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotifIcon(notif.tipo)}`}>
                                                    {notif.tipo === 'alerta' ? '!' : notif.tipo === 'nota' ? 'N' : notif.tipo === 'actividad' ? 'A' : notif.tipo === 'pago' ? '$' : 'M'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${!notif.leida ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>{notif.titulo}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.descripcion}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{notif.tiempo}</p>
                                                </div>
                                                {!notif.leida && <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm">
                            <div className="flex justify-between items-center p-4 border-b">
                                <h2 className="text-lg font-semibold text-gray-800">Proximas Actividades</h2>
                                <Link href="/padre/calendario" className="text-[#293577] hover:underline text-sm">Ver calendario →</Link>
                            </div>
                            {proximasActividades.length === 0 ? (
                                <div className="p-6 text-sm text-gray-500">No hay actividades proximas registradas.</div>
                            ) : (
                                <div className="divide-y">
                                    {proximasActividades.map((act) => (
                                        <div key={act.id} className="p-4 hover:bg-gray-50">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-800 truncate">{act.actividad}</p>
                                                    <p className="text-sm text-gray-500 truncate">{act.materia} · Prof. {act.profesor}</p>
                                                </div>
                                                <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                                                    {formatFecha(act.fecha)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </SidebarLayout>
    );
}
