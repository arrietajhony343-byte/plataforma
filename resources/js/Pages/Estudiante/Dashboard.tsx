import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, Link } from '@inertiajs/react';
import { estudianteMenuItems } from '@/Config/estudianteMenu';

interface ActividadDash {
    id: number;
    titulo: string;
    materia: string;
    tipo: string;
    fechaAsignacion: string;
    fechaEntrega: string;
    fechaEntregaISO: string;
    estado: 'pendiente' | 'vencida' | 'entregada' | 'devuelta' | 'calificada';
    peso: number;
    profesor: string;
    prioridad: 'alta' | 'media' | 'baja';
    tienePreguntas?: boolean;
}

interface Props {
    estudiante: {
        nombre: string;
        grado?: string;
        foto?: string | null;
        tipo_documento?: string | null;
        documento?: string | null;
        telefono?: string | null;
        direccion?: string | null;
        fecha_nacimiento?: string | null;
        grupo_sanguineo?: string | null;
        eps?: string | null;
        acudiente?: string | null;
        telefono_acudiente?: string | null;
    };
    pendientes: ActividadDash[];
    vencidas: ActividadDash[];
}

export default function Dashboard({ estudiante, pendientes: pendientesData, vencidas: vencidasData }: Props) {
    const nombre = estudiante?.nombre || 'Estudiante';
    const grado = estudiante?.grado || 'Sin asignar';

    const formatFecha = (f: string | null | undefined) => {
        if (!f) return 'No registrada';
        const d = new Date(f.length === 10 ? f + 'T12:00:00' : f);
        if (Number.isNaN(d.getTime())) return f;
        return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // Usar los datos del backend
    const pendientes = pendientesData || [];
    const vencidas = vencidasData || [];
    const totalActividades = pendientes.length + vencidas.length;

    // Helpers para estilos
    const getPrioridadBadge = (p: string) => {
        if (p === 'alta') return 'bg-red-100 text-red-700 border-red-200';
        if (p === 'media') return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-green-100 text-green-700 border-green-200';
    };

    const getTipoBadge = (tipo: string) => {
        const map: Record<string, string> = {
            'Taller': 'bg-blue-50 text-blue-700', 'Tarea': 'bg-indigo-50 text-indigo-700',
            'Ensayo': 'bg-amber-50 text-amber-700', 'Informe': 'bg-green-50 text-green-700',
            'Proyecto': 'bg-purple-50 text-purple-700', 'Quiz': 'bg-rose-50 text-rose-700',
            'Evaluación': 'bg-red-50 text-red-700', 'Laboratorio': 'bg-teal-50 text-teal-700',
            'Exposición': 'bg-orange-50 text-orange-700',
        };
        return map[tipo] || 'bg-gray-50 text-gray-600';
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
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-[#181b49] to-[#293577] flex items-center justify-center mb-3 shadow-lg">
                        {estudiante?.foto ? (
                            <img src={estudiante.foto} alt={nombre} className="w-full h-full object-cover" />
                        ) : (
                            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                            </svg>
                        )}
                    </div>
                    <h2 className="font-bold text-gray-900 text-lg">{nombre}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Grado {grado}</p>
                </div>

                {/* Stats Cards - clickables */}
                <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Link href="/estudiante/materias" className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">Todas</span>
                        </div>
                        <p className="text-2xl font-extrabold text-gray-900">{totalActividades}</p>
                        <p className="text-xs text-gray-400 mt-0.5">actividades</p>
                    </Link>
                    <Link href="/estudiante/materias" className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">Pendientes</span>
                        </div>
                        <p className="text-2xl font-extrabold text-gray-900">{pendientes.length}</p>
                        <p className="text-xs text-gray-400 mt-0.5">por entregar</p>
                    </Link>
                    <Link href="/estudiante/materias" className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A9.003 9.003 0 1020.25 12M12 2.25v10.5" /></svg>
                            </div>
                            <span className="text-xs text-gray-400 font-medium">Vencidas</span>
                        </div>
                        <p className="text-2xl font-extrabold text-gray-900">{vencidas.length}</p>
                        <p className="text-xs text-gray-400 mt-0.5">entregas tardías</p>
                    </Link>
                </div>
            </div>

            {/* Datos importantes del estudiante */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-800">Información del estudiante</h3>
                    <Link href="/profile" className="text-xs text-[#293577] hover:underline font-semibold">Editar perfil →</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100"><span className="text-gray-500">Documento:</span> <p className="font-semibold text-gray-800">{(estudiante?.tipo_documento || '') + ' ' + (estudiante?.documento || 'No registrado')}</p></div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100"><span className="text-gray-500">Teléfono:</span> <p className="font-semibold text-gray-800">{estudiante?.telefono || 'No registrado'}</p></div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100"><span className="text-gray-500">Fecha de nacimiento:</span> <p className="font-semibold text-gray-800">{formatFecha(estudiante?.fecha_nacimiento)}</p></div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100"><span className="text-gray-500">Dirección:</span> <p className="font-semibold text-gray-800">{estudiante?.direccion || 'No registrada'}</p></div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100"><span className="text-gray-500">Grupo sanguíneo:</span> <p className="font-semibold text-gray-800">{estudiante?.grupo_sanguineo || 'No registrado'}</p></div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100"><span className="text-gray-500">EPS:</span> <p className="font-semibold text-gray-800">{estudiante?.eps || 'No registrada'}</p></div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100"><span className="text-gray-500">Acudiente:</span> <p className="font-semibold text-gray-800">{estudiante?.acudiente || 'No registrado'}</p></div>
                    <div className="p-3 rounded-xl bg-gray-50 border border-gray-100"><span className="text-gray-500">Tel. acudiente:</span> <p className="font-semibold text-gray-800">{estudiante?.telefono_acudiente || 'No registrado'}</p></div>
                </div>
            </div>

            {/* Actividades - pendientes + vencidas */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-xs">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </span>
                        Actividades Pendientes
                        {pendientes.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">{pendientes.length}</span>
                        )}
                        {vencidas.length > 0 && (
                            <span className="ml-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">{vencidas.length} vencidas</span>
                        )}
                    </h3>
                    <Link href="/estudiante/materias" className="text-xs text-[#293577] hover:underline font-semibold">Ver en materias →</Link>
                </div>

                {/* Pendientes */}
                {pendientes.length > 0 && (
                    <div className="divide-y divide-gray-50">
                        {pendientes.map(act => (
                            <Link key={act.id} href={route('estudiante.actividades.show', act.id)}
                                className="w-full px-5 py-3 hover:bg-amber-50/40 transition-colors flex items-center gap-3 text-left group">
                                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex flex-col items-center justify-center">
                                    <span className="text-[11px] font-bold text-amber-700 leading-none">{act.fechaEntrega.split(' ')[0]}</span>
                                    <span className="text-[9px] text-amber-500 leading-none">{act.fechaEntrega.split(' ')[1]}</span>
                                </div>
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${act.prioridad === 'alta' ? 'bg-red-500' : act.prioridad === 'media' ? 'bg-amber-400' : 'bg-green-400'}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#293577] transition-colors">{act.titulo}</p>
                                    <p className="text-xs text-gray-400">{act.materia} • {act.tipo} • {act.peso}%</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${getPrioridadBadge(act.prioridad)}`}>
                                    {act.prioridad}
                                </span>
                                <svg className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-[#293577] transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Divider + Vencidas */}
                {vencidas.length > 0 && (
                    <>
                        <div className="px-5 py-2 bg-red-50/60 border-y border-red-100 flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <span className="text-[11px] font-bold text-red-600 uppercase tracking-wide">Vencidas — entrega tardía</span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {vencidas.map(act => (
                                <Link key={act.id} href={route('estudiante.actividades.show', act.id)}
                                    className="w-full px-5 py-3 hover:bg-red-50/40 transition-colors flex items-center gap-3 text-left group opacity-90">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex flex-col items-center justify-center">
                                        <span className="text-[11px] font-bold text-red-600 leading-none">{act.fechaEntrega.split(' ')[0]}</span>
                                        <span className="text-[9px] text-red-400 leading-none">{act.fechaEntrega.split(' ')[1]}</span>
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-700 truncate group-hover:text-red-700 transition-colors">{act.titulo}</p>
                                        <p className="text-xs text-gray-400">{act.materia} • {act.tipo} • {act.peso}%</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-red-100 text-red-700 border-red-200 flex-shrink-0">
                                        vencida
                                    </span>
                                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            ))}
                        </div>
                    </>
                )}

                {pendientes.length === 0 && vencidas.length === 0 && (
                    <div className="px-5 py-12 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">No hay actividades pendientes ni vencidas</p>
                        <p className="text-xs text-gray-400 mt-1">Cuando tus profesores publiquen nuevas actividades aparecerán aquí.</p>
                    </div>
                )}
            </div>

        </SidebarLayout>
    );
}

