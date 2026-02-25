import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { padreMenuItems } from '@/Config/padreMenu';

interface Notificacion {
    id: number;
    tipo: 'nota' | 'actividad' | 'pago' | 'mensaje' | 'alerta' | 'sistema';
    titulo: string;
    descripcion: string;
    detalle?: string;
    fecha: string;
    hora: string;
    leida: boolean;
    materia?: string;
    profesor?: string;
    enlace?: string;
}

export default function Notificaciones() {
    const [filtro, setFiltro] = useState('todas');
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([
        {
            id: 1, tipo: 'alerta', titulo: 'Actividad no entregada',
            descripcion: 'Carlos no entregó "Taller de Ecuaciones" en Matemáticas',
            detalle: 'La fecha límite de entrega fue el 10 de Febrero de 2026. Contacte al profesor si necesita una extensión.',
            fecha: '2026-02-13', hora: '10:30 AM', leida: false, materia: 'Matemáticas', profesor: 'María García',
        },
        {
            id: 2, tipo: 'alerta', titulo: 'Actividad no entregada',
            descripcion: 'Carlos no entregó "Ensayo literario" en Español',
            detalle: 'La fecha límite es el 20 de Febrero. Aún tiene tiempo para entregar.',
            fecha: '2026-02-13', hora: '9:00 AM', leida: false, materia: 'Español', profesor: 'Juan Pérez',
        },
        {
            id: 3, tipo: 'nota', titulo: 'Nueva nota registrada',
            descripcion: 'Ciencias Naturales - Quiz Ecosistemas: 4.5/5.0',
            detalle: 'Excelente desempeño en el quiz. Carlos demostró buen dominio del tema de ecosistemas.',
            fecha: '2026-02-12', hora: '3:45 PM', leida: false, materia: 'Ciencias Naturales', profesor: 'Ana Martínez',
        },
        {
            id: 4, tipo: 'actividad', titulo: 'Nueva actividad asignada',
            descripcion: 'Exposición: Revolución Industrial - Historia',
            detalle: 'Exposición en grupo (3 personas). Fecha de presentación: 25 de Febrero. Preparar material visual.',
            fecha: '2026-02-12', hora: '11:00 AM', leida: false, materia: 'Historia', profesor: 'Carlos Mendoza',
        },
        {
            id: 5, tipo: 'nota', titulo: 'Nota actualizada',
            descripcion: 'Matemáticas - Parcial 1: 3.8/5.0',
            detalle: 'El parcial cubrió ecuaciones lineales y cuadráticas. Necesita reforzar factorización.',
            fecha: '2026-02-10', hora: '2:00 PM', leida: true, materia: 'Matemáticas', profesor: 'María García',
        },
        {
            id: 6, tipo: 'pago', titulo: 'Recordatorio de pago',
            descripcion: 'La mensualidad de Febrero 2026 vence el 15/02/2026',
            detalle: 'Monto: $250.000 COP. Puede pagar desde la plataforma en la sección de Pagos.',
            fecha: '2026-02-10', hora: '8:00 AM', leida: true,
        },
        {
            id: 7, tipo: 'actividad', titulo: 'Examen programado',
            descripcion: 'Examen parcial de Álgebra - 18 de Febrero',
            detalle: 'Temas: Ecuaciones de primer y segundo grado. Traer calculadora científica. Duración: 90 minutos.',
            fecha: '2026-02-08', hora: '9:00 AM', leida: true, materia: 'Matemáticas', profesor: 'María García',
        },
        {
            id: 8, tipo: 'mensaje', titulo: 'Nuevo mensaje del profesor',
            descripcion: 'Prof. Laura Stevens le envió un mensaje sobre el rendimiento de Carlos en Inglés',
            detalle: 'Sugiero que Carlos practique listening en casa al menos 20 minutos diarios. Puede usar la app Duolingo.',
            fecha: '2026-02-07', hora: '4:30 PM', leida: true, materia: 'Inglés', profesor: 'Laura Stevens',
        },
        {
            id: 9, tipo: 'sistema', titulo: 'Boletín Periodo 1 disponible',
            descripcion: 'El boletín del Primer Periodo ya está disponible para descarga',
            detalle: 'Puede descargar el boletín en formato PDF desde la sección Boletín & Notas.',
            fecha: '2026-02-05', hora: '6:00 PM', leida: true,
        },
        {
            id: 10, tipo: 'nota', titulo: 'Nota baja registrada',
            descripcion: 'Inglés - Listening Test: 3.2/5.0',
            detalle: 'Carlos tuvo dificultades en la comprensión auditiva. Se recomienda práctica adicional en casa.',
            fecha: '2026-02-03', hora: '1:00 PM', leida: true, materia: 'Inglés', profesor: 'Laura Stevens',
        },
    ]);

    const [selectedNotif, setSelectedNotif] = useState<Notificacion | null>(null);

    const filteredNotifs = filtro === 'todas'
        ? notificaciones
        : filtro === 'no_leidas'
        ? notificaciones.filter(n => !n.leida)
        : notificaciones.filter(n => n.tipo === filtro);

    const marcarLeida = (id: number) => {
        setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    };

    const marcarTodasLeidas = () => {
        setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    };

    const noLeidas = notificaciones.filter(n => !n.leida).length;

    const getNotifStyle = (tipo: string) => {
        switch (tipo) {
            case 'alerta': return { bg: 'bg-red-50', border: 'border-red-400', iconBg: 'bg-red-100 text-red-600', icon: '!' };
            case 'nota': return { bg: 'bg-blue-50', border: 'border-blue-400', iconBg: 'bg-blue-100 text-blue-600', icon: 'N' };
            case 'actividad': return { bg: 'bg-green-50', border: 'border-green-400', iconBg: 'bg-green-100 text-green-600', icon: 'A' };
            case 'pago': return { bg: 'bg-yellow-50', border: 'border-yellow-400', iconBg: 'bg-yellow-100 text-yellow-600', icon: '$' };
            case 'mensaje': return { bg: 'bg-purple-50', border: 'border-purple-400', iconBg: 'bg-purple-100 text-purple-600', icon: 'M' };
            case 'sistema': return { bg: 'bg-gray-50', border: 'border-gray-400', iconBg: 'bg-gray-100 text-gray-600', icon: 'S' };
            default: return { bg: 'bg-gray-50', border: 'border-gray-400', iconBg: 'bg-gray-100 text-gray-600', icon: '•' };
        }
    };

    return (
        <SidebarLayout menuItems={padreMenuItems} title="Notificaciones">
            <Head title="Notificaciones" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>
                            Notificaciones
                            {noLeidas > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-sm px-2.5 py-0.5 rounded-full">{noLeidas}</span>
                            )}
                        </h1>
                        <p className="text-gray-600">Notas, actividades y alertas automáticas de la plataforma</p>
                    </div>
                    {noLeidas > 0 && (
                        <button
                            onClick={marcarTodasLeidas}
                            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                            ✓ Marcar todas como leídas
                        </button>
                    )}
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm p-3">
                    <div className="flex flex-wrap gap-2">
                        {[
                            { key: 'todas', label: 'Todas', count: notificaciones.length },
                            { key: 'no_leidas', label: 'No leídas', count: noLeidas },
                            { key: 'alerta', label: 'Alertas', count: notificaciones.filter(n => n.tipo === 'alerta').length },
                            { key: 'nota', label: 'Notas', count: notificaciones.filter(n => n.tipo === 'nota').length },
                            { key: 'actividad', label: 'Actividades', count: notificaciones.filter(n => n.tipo === 'actividad').length },
                            { key: 'pago', label: 'Pagos', count: notificaciones.filter(n => n.tipo === 'pago').length },
                            { key: 'mensaje', label: 'Mensajes', count: notificaciones.filter(n => n.tipo === 'mensaje').length },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFiltro(f.key)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                    filtro === f.key
                                        ? 'bg-[#293577] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {f.label} ({f.count})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lista de notificaciones */}
                <div className="space-y-3">
                    {filteredNotifs.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                            <span className="text-4xl">🔔</span>
                            <p className="text-gray-500 mt-2">No hay notificaciones con este filtro</p>
                        </div>
                    ) : (
                        filteredNotifs.map(notif => {
                            const style = getNotifStyle(notif.tipo);
                            return (
                                <button
                                    key={notif.id}
                                    onClick={() => { setSelectedNotif(notif); marcarLeida(notif.id); }}
                                    className={`w-full text-left bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
                                        !notif.leida ? 'border-l-4 ' + style.border : ''
                                    }`}
                                >
                                    <div className={`p-4 ${!notif.leida ? style.bg : ''}`}>
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${style.iconBg}`}>
                                                {style.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className={`text-sm ${!notif.leida ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                        {notif.titulo}
                                                    </p>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        {!notif.leida && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-0.5">{notif.descripcion}</p>
                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span className="text-xs text-gray-400">{notif.fecha} · {notif.hora}</span>
                                                    {notif.materia && (
                                                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{notif.materia}</span>
                                                    )}
                                                    {notif.profesor && (
                                                        <span className="text-xs text-gray-500">Prof. {notif.profesor}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Modal detalle */}
            {selectedNotif && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${getNotifStyle(selectedNotif.tipo).iconBg}`}>
                                    {getNotifStyle(selectedNotif.tipo).icon}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">{selectedNotif.titulo}</h2>
                                    <p className="text-xs text-gray-500">{selectedNotif.fecha} · {selectedNotif.hora}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedNotif(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>

                        <div className="space-y-4">
                            <p className="text-gray-700">{selectedNotif.descripcion}</p>
                            {selectedNotif.detalle && (
                                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                                    {selectedNotif.detalle}
                                </div>
                            )}
                            {selectedNotif.materia && (
                                <div className="flex items-center gap-4 text-sm">
                                    <span className="text-gray-500">Materia: <strong className="text-gray-800">{selectedNotif.materia}</strong></span>
                                    {selectedNotif.profesor && (
                                        <span className="text-gray-500">Profesor: <strong className="text-gray-800">{selectedNotif.profesor}</strong></span>
                                    )}
                                </div>
                            )}
                            {selectedNotif.tipo === 'alerta' && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-800 font-medium">
                                        💡 Puede comunicarse con el profesor desde la sección de Mensajes para más información.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            {selectedNotif.tipo === 'alerta' && (
                                <a href="/padre/mensajes" className="flex-1 bg-[#293577] text-white px-4 py-2 rounded-lg text-center hover:bg-[#181b49] text-sm">
                                    Contactar profesor
                                </a>
                            )}
                            <button
                                onClick={() => setSelectedNotif(null)}
                                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
