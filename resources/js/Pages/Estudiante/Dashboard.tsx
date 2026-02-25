import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, Link } from '@inertiajs/react';
import { estudianteMenuItems } from '@/Config/estudianteMenu';

interface Props {
    estudiante: {
        nombre: string;
        grado?: string;
    };
}

export default function Dashboard({ estudiante }: Props) {
    const nombre = estudiante?.nombre || 'Estudiante';
    const grado = estudiante?.grado || '8° A';

    // Info del estudiante
    const infoEstudiante = {
        identificacion: '1.098.765.432',
        edad: 14,
        tipoSangre: 'O+',
        padres: 'Carlos Muñoz & María Guevara',
        estadoPago: 'Al día',
        promedioActual: 4.2,
        jornada: 'Mañana',
        direccion: 'Calle 45 #12-34, Barranquilla',
    };

    // Materias actuales con notas
    const materias = [
        { id: 1, nombre: 'Matemáticas', profesor: 'María García', promedio: 4.5, icono: '📐', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', actividades: 3 },
        { id: 2, nombre: 'Español', profesor: 'Juan Pérez', promedio: 3.8, icono: '📝', color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', actividades: 2 },
        { id: 3, nombre: 'Ciencias', profesor: 'Pedro Sánchez', promedio: 4.2, icono: '🔬', color: 'from-green-500 to-green-600', bg: 'bg-green-50', actividades: 1 },
        { id: 4, nombre: 'Historia', profesor: 'Carlos López', promedio: 3.5, icono: '🏛️', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50', actividades: 0 },
        { id: 5, nombre: 'Inglés', profesor: 'Ana Martínez', promedio: 4.7, icono: '🌐', color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50', actividades: 2 },
        { id: 6, nombre: 'Química', profesor: 'Roberto Gómez', promedio: 3.2, icono: '⚗️', color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50', actividades: 1 },
        { id: 7, nombre: 'Ed. Física', profesor: 'Pedro Sánchez', promedio: 4.8, icono: '⚽', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50', actividades: 0 },
        { id: 8, nombre: 'Artes', profesor: 'Sandra Vega', promedio: 4.6, icono: '🎨', color: 'from-pink-500 to-pink-600', bg: 'bg-pink-50', actividades: 1 },
    ];

    // Actividades pendientes
    const actividadesPendientes = [
        { id: 1, materia: 'Matemáticas', titulo: 'Taller de ecuaciones cuadráticas', fechaEntrega: '26 Feb 2026', tipo: 'Taller', prioridad: 'alta' },
        { id: 2, materia: 'Español', titulo: 'Ensayo: Cien Años de Soledad', fechaEntrega: '27 Feb 2026', tipo: 'Ensayo', prioridad: 'alta' },
        { id: 3, materia: 'Inglés', titulo: 'Present Perfect Worksheet', fechaEntrega: '28 Feb 2026', tipo: 'Tarea', prioridad: 'media' },
        { id: 4, materia: 'Ciencias', titulo: 'Informe de laboratorio #3', fechaEntrega: '01 Mar 2026', tipo: 'Informe', prioridad: 'media' },
        { id: 5, materia: 'Matemáticas', titulo: 'Quiz factorización', fechaEntrega: '02 Mar 2026', tipo: 'Evaluación', prioridad: 'alta' },
    ];

    // Mensajes recientes (para conteo)
    const mensajesRecientes = [
        { id: 1, de: 'Prof. María García', materia: 'Matemáticas', mensaje: 'Recuerda estudiar para el quiz del lunes.', hora: 'Hace 2h', leido: false },
        { id: 2, de: 'Prof. Juan Pérez', materia: 'Español', mensaje: 'Tu ensayo tiene buena estructura, revisa la conclusión.', hora: 'Hace 5h', leido: false },
        { id: 3, de: 'Coord. Académica', materia: 'General', mensaje: 'Reunión de padres programada para el 28 de febrero.', hora: 'Ayer', leido: true },
    ];

    const promedioGeneral = (materias.reduce((acc, m) => acc + m.promedio, 0) / materias.length).toFixed(1);
    const totalActividades = materias.reduce((acc, m) => acc + m.actividades, 0);

    const getPromedioColor = (p: number) => {
        if (p >= 4.0) return 'text-green-600';
        if (p >= 3.0) return 'text-amber-600';
        return 'text-red-600';
    };

    const getPromedioBarColor = (p: number) => {
        if (p >= 4.0) return 'bg-green-500';
        if (p >= 3.0) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getPrioridadBadge = (p: string) => {
        if (p === 'alta') return 'bg-red-100 text-red-700 border-red-200';
        if (p === 'media') return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-green-100 text-green-700 border-green-200';
    };

    return (
        <SidebarLayout
            menuItems={estudianteMenuItems}
            userInfo={{ name: nombre, role: 'Estudiante' }}
        >
            <Head title="Panel del Estudiante" />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Panel de Estudiante
                </h1>
                <p className="text-gray-500 mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Bienvenido de vuelta, {nombre}</p>
            </div>

            {/* Tarjeta de perfil + Stats rápidos */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                {/* Perfil */}
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#181b49] to-[#293577] flex items-center justify-center mb-3 shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                    </div>
                    <h2 className="font-bold text-gray-900 text-lg">{nombre}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Grado {grado} • Jornada {infoEstudiante.jornada}</p>
                    <div className="mt-3 w-full space-y-1.5 text-left">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">ID:</span>
                            <span className="text-gray-700 font-medium">{infoEstudiante.identificacion}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Edad:</span>
                            <span className="text-gray-700 font-medium">{infoEstudiante.edad} años</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Sangre:</span>
                            <span className="text-gray-700 font-medium">{infoEstudiante.tipoSangre}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Acudiente:</span>
                            <span className="text-gray-700 font-medium text-right text-[11px]">{infoEstudiante.padres}</span>
                        </div>
                    </div>
                    <div className="mt-3 w-full pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${infoEstudiante.estadoPago === 'Al día' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {infoEstudiante.estadoPago}
                        </span>
                        <span className={`text-lg font-extrabold ${getPromedioColor(Number(promedioGeneral))}`}>
                            {promedioGeneral}
                        </span>
                    </div>
                </div>

                {/* Stats Cards - clickables */}
                <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Link href="/estudiante/materias" className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">Materias</span>
                        </div>
                        <p className="text-2xl font-extrabold text-gray-900">{materias.length}</p>
                        <p className="text-xs text-gray-400 mt-0.5">cursando actualmente</p>
                    </Link>
                    <Link href="/estudiante/actividades" className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">Pendientes</span>
                        </div>
                        <p className="text-2xl font-extrabold text-gray-900">{totalActividades}</p>
                        <p className="text-xs text-gray-400 mt-0.5">actividades por entregar</p>
                    </Link>
                    <Link href="/estudiante/notas" className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">Promedio</span>
                        </div>
                        <p className={`text-2xl font-extrabold ${getPromedioColor(Number(promedioGeneral))}`}>{promedioGeneral}</p>
                        <p className="text-xs text-gray-400 mt-0.5">promedio general</p>
                    </Link>
                    <Link href="/estudiante/mensajes" className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">Mensajes</span>
                        </div>
                        <p className="text-2xl font-extrabold text-gray-900">{mensajesRecientes.filter(m => !m.leido).length}</p>
                        <p className="text-xs text-gray-400 mt-0.5">sin leer</p>
                    </Link>

                    {/* Promedio por materia - barra compacta */}
                    <div className="col-span-2 sm:col-span-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-800">Resumen de Notas por Materia</h3>
                            <span className="text-xs text-gray-400">Periodo 1 - 2026</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {materias.map(m => (
                                <div key={m.id} className="flex items-center gap-2">
                                    <span className="text-xs text-gray-600 w-20 truncate">{m.nombre}</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                                        <div className={`h-2 rounded-full ${getPromedioBarColor(m.promedio)}`} style={{ width: `${(m.promedio / 5) * 100}%` }}></div>
                                    </div>
                                    <span className={`text-xs font-bold w-7 text-right ${getPromedioColor(m.promedio)}`}>{m.promedio}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Actividades Pendientes - full width */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-xs">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </span>
                        Actividades Pendientes
                    </h3>
                    <Link href="/estudiante/actividades" className="text-xs text-[#293577] hover:underline font-semibold">Ver todas →</Link>
                </div>
                <div className="divide-y divide-gray-50">
                    {actividadesPendientes.map(act => (
                        <div key={act.id} className="px-5 py-3 hover:bg-gray-50/50 transition-colors flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex flex-col items-center justify-center">
                                <span className="text-[10px] font-bold text-gray-500 leading-none">
                                    {act.fechaEntrega.split(' ')[0]}
                                </span>
                                <span className="text-[9px] text-gray-400 leading-none">
                                    {act.fechaEntrega.split(' ')[1]}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{act.titulo}</p>
                                <p className="text-xs text-gray-400">{act.materia} • {act.tipo}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPrioridadBadge(act.prioridad)}`}>
                                {act.prioridad}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </SidebarLayout>
    );
}
