import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, Link } from '@inertiajs/react';
import { padreMenuItems } from '@/Config/padreMenu';

interface Notificacion {
    id: number;
    tipo: 'nota' | 'actividad' | 'pago' | 'mensaje' | 'alerta';
    titulo: string;
    descripcion: string;
    tiempo: string;
    leida: boolean;
}

export default function Dashboard() {
    const hijo = {
        nombre: 'Carlos López',
        grado: '7° Secundaria',
        seccion: 'A',
        foto: null,
        promedio: 4.1,
        materias_aprobadas: 6,
        materias_totales: 7,
        asistencia: 95,
    };

    const proximasActividades = [
        { id: 1, materia: 'Matemáticas', actividad: 'Examen parcial - Álgebra', fecha: '2026-02-18', profesor: 'María García' },
        { id: 2, materia: 'Español', actividad: 'Entrega ensayo literario', fecha: '2026-02-20', profesor: 'Juan Pérez' },
        { id: 3, materia: 'Ciencias', actividad: 'Laboratorio - Reacción química', fecha: '2026-02-22', profesor: 'Ana Martínez' },
    ];

    const notificaciones: Notificacion[] = [
        { id: 1, tipo: 'alerta', titulo: 'Actividad no entregada', descripcion: 'Carlos no entregó "Taller de Ecuaciones" en Matemáticas', tiempo: 'Hace 2 horas', leida: false },
        { id: 2, tipo: 'nota', titulo: 'Nueva nota registrada', descripcion: 'Ciencias Naturales - Quiz Ecosistemas: 4.5/5.0', tiempo: 'Hace 5 horas', leida: false },
        { id: 3, tipo: 'actividad', titulo: 'Nueva actividad asignada', descripcion: 'Español - Ensayo literario para el 20 de Feb', tiempo: 'Ayer', leida: true },
        { id: 4, tipo: 'pago', titulo: 'Recordatorio de pago', descripcion: 'La mensualidad de Febrero vence el 15/02/2026', tiempo: 'Hace 2 días', leida: true },
    ];

    const ultimasNotas = [
        { materia: 'Ciencias Naturales', nota: 4.5, tipo: 'Quiz', fecha: '2026-02-13' },
        { materia: 'Matemáticas', nota: 3.8, tipo: 'Parcial', fecha: '2026-02-10' },
        { materia: 'Historia', nota: 4.2, tipo: 'Trabajo', fecha: '2026-02-08' },
        { materia: 'Español', nota: 4.7, tipo: 'Exposición', fecha: '2026-02-05' },
    ];

    const estadoPagos = {
        ultimoPago: 'Enero 2026',
        proximoPago: 'Febrero 2026',
        vencimiento: '15/02/2026',
        monto: 250000,
        estado: 'pendiente' as 'pendiente' | 'pagado' | 'vencido',
    };

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

    const notifNoLeidas = notificaciones.filter(n => !n.leida).length;

    return (
        <SidebarLayout menuItems={padreMenuItems}>
            <Head title="Dashboard Padre" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Bienvenida + Info del hijo */}
                <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #181b49 0%, #293577 50%, #171f54 100%)' }}>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            CL
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-extrabold" style={{ fontFamily: "'Inter', sans-serif" }}>Bienvenido, Padre de {hijo.nombre}</h1>
                            <p className="text-blue-100">{hijo.grado} - Sección {hijo.seccion}</p>
                        </div>
                        <div className="flex gap-3">
                            {notifNoLeidas > 0 && (
                                <Link href="/padre/notificaciones" className="relative bg-white bg-opacity-20 px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors">
                                    {notifNoLeidas} nuevas
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats rápidos */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <div className="text-3xl font-bold" style={{ color: '#891248' }}>{hijo.promedio}</div>
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
                        <p className="text-gray-600 text-sm mt-1">Asistencia</p>
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                            <div className="h-1.5 rounded-full" style={{ width: `${hijo.asistencia}%`, backgroundColor: '#185929' }} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <div className={`text-3xl font-bold ${estadoPagos.estado === 'pagado' ? 'text-green-600' : estadoPagos.estado === 'vencido' ? 'text-red-600' : 'text-yellow-600'}`}>
                            {estadoPagos.estado === 'pagado' ? '✓' : estadoPagos.estado === 'vencido' ? '!' : '$'}
                        </div>
                        <p className="text-gray-600 text-sm mt-1">Pago {estadoPagos.proximoPago}</p>
                        <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                            estadoPagos.estado === 'pagado' ? 'bg-green-100 text-green-800' :
                            estadoPagos.estado === 'vencido' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                        }`}>
                            {estadoPagos.estado === 'pagado' ? 'Al día' : estadoPagos.estado === 'vencido' ? 'Vencido' : 'Pendiente'}
                        </span>
                    </div>
                </div>

                {/* Alertas importantes */}
                {notificaciones.filter(n => !n.leida && n.tipo === 'alerta').length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl"><svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg></span>
                            <div className="flex-1">
                                <h3 className="font-bold text-red-800">Alertas Importantes</h3>
                                {notificaciones.filter(n => !n.leida && n.tipo === 'alerta').map(n => (
                                    <p key={n.id} className="text-sm text-red-700 mt-1">{n.descripcion}</p>
                                ))}
                            </div>
                            <Link href="/padre/notificaciones" className="text-red-600 hover:text-red-800 text-sm font-medium whitespace-nowrap">
                                Ver todas →
                            </Link>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Últimas notas */}
                    <div className="bg-white rounded-xl shadow-sm">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">Últimas Notas</h2>
                            <Link href="/padre/boletin" className="text-[#293577] hover:underline text-sm">Ver boletín →</Link>
                        </div>
                        <div className="divide-y">
                            {ultimasNotas.map((nota, i) => (
                                <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div>
                                        <p className="font-medium text-gray-800">{nota.materia}</p>
                                        <p className="text-xs text-gray-500">{nota.tipo} - {nota.fecha}</p>
                                    </div>
                                    <div className={`text-lg font-bold px-3 py-1 rounded-lg ${
                                        nota.nota >= 4.0 ? 'bg-green-100 text-green-700' :
                                        nota.nota >= 3.0 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {nota.nota}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notificaciones recientes */}
                    <div className="bg-white rounded-xl shadow-sm">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">Notificaciones</h2>
                            <Link href="/padre/notificaciones" className="text-[#293577] hover:underline text-sm">Ver todas →</Link>
                        </div>
                        <div className="divide-y">
                            {notificaciones.slice(0, 4).map((notif) => (
                                <div key={notif.id} className={`p-4 flex items-start gap-3 hover:bg-gray-50 ${!notif.leida ? 'bg-blue-50' : ''}`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotifIcon(notif.tipo)}`}>
                                        {notif.tipo === 'alerta' ? '!' :
                                         notif.tipo === 'nota' ? 'N' :
                                         notif.tipo === 'actividad' ? 'A' :
                                         notif.tipo === 'pago' ? '$' : 'M'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${!notif.leida ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>
                                            {notif.titulo}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.descripcion}</p>
                                        <p className="text-xs text-gray-400 mt-1">{notif.tiempo}</p>
                                    </div>
                                    {!notif.leida && <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Próximas actividades */}
                    <div className="bg-white rounded-xl shadow-sm">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h2 className="text-lg font-semibold text-gray-800">Próximas Actividades</h2>
                            <Link href="/padre/calendario" className="text-[#293577] hover:underline text-sm">Ver calendario →</Link>
                        </div>
                        <div className="divide-y">
                            {proximasActividades.map((act) => (
                                <div key={act.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-gray-800">{act.actividad}</p>
                                            <p className="text-sm text-gray-500">{act.materia} · Prof. {act.profesor}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                                                {new Date(act.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Acciones rápidas */}
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <Link href="/padre/boletin" className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-center">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
                                <span className="text-sm font-medium text-blue-800">Descargar Boletín</span>
                            </Link>
                            <Link href="/padre/pagos" className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-center">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                                <span className="text-sm font-medium text-green-800">Realizar Pago</span>
                            </Link>
                            <Link href="/padre/mensajes" className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-center">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                                <span className="text-sm font-medium text-purple-800">Enviar Mensaje</span>
                            </Link>
                            <Link href="/padre/seguimiento" className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors text-center">
                                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                                <span className="text-sm font-medium text-orange-800">Ver Seguimiento</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
