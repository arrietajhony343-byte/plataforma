import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { estudianteMenuItems } from '@/Config/estudianteMenu';

const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

interface Actividad {
    id: number;
    titulo: string;
    descripcion: string;
    tipo: string;
    fechaAsignada: string;
    fechaEntrega: string;
    estado: 'pendiente' | 'entregada' | 'calificada' | 'vencida';
    nota?: number;
    peso: number;
    archivos?: string[];
    retroalimentacion?: string;
}

interface Materia {
    id: number;
    nombre: string;
    profesor: string;
    imagen?: string;
    icono: string;
    color: string;
    colorBg: string;
    colorText: string;
    colorBorder: string;
    promedio: number;
    horasSemanales: number;
    salon: string;
    descripcion: string;
    actividades: Actividad[];
    promedioCortes: { corte: string; nota: number }[];
}

interface Props {
    estudiante: {
        nombre: string;
    };
    materias: Materia[];
}

export default function Materias({ estudiante, materias }: Props) {
    const nombre = estudiante?.nombre || 'Estudiante';
    const [materiaActiva, setMateriaActiva] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroActividad, setFiltroActividad] = useState('todas');

    const materiaDetalle = materias.find(m => m.id === materiaActiva);

    const actividadesFiltradas = useMemo(() => {
        if (!materiaDetalle) return [];
        let acts = materiaDetalle.actividades;
        if (filtroActividad !== 'todas') {
            acts = acts.filter(a => a.estado === filtroActividad);
        }
        return acts;
    }, [materiaDetalle, filtroActividad]);

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'pendiente': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'entregada': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'calificada': return 'bg-green-100 text-green-700 border-green-200';
            case 'vencida': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'pendiente': return '';
            case 'entregada': return '';
            case 'calificada': return '';
            case 'vencida': return '';
            default: return '';
        }
    };

    const getNotaColor = (nota: number) => {
        if (nota >= 4.0) return 'text-green-600';
        if (nota >= 3.0) return 'text-amber-600';
        return 'text-red-600';
    };

    const materiasFiltradas = useMemo(() => {
        if (!searchTerm) return materias;
        return materias.filter(m =>
            m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.profesor.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    return (
        <SidebarLayout
            menuItems={estudianteMenuItems}
            userInfo={{ name: nombre, role: 'Estudiante' }}
        >
            <Head title="Mis Materias" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
                        Mis Materias
                    </h1>
                    <p className="text-gray-500 mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                        {materiaActiva ? `${materiaDetalle?.nombre} — ${materiaDetalle?.profesor}` : 'Selecciona una materia para ver detalles y actividades'}
                    </p>
                </div>
                {materiaActiva && (
                    <button
                        onClick={() => { setMateriaActiva(null); setFiltroActividad('todas'); }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver a materias
                    </button>
                )}
            </div>

            {!materiaActiva ? (
                <>
                    {/* Buscador */}
                    <div className="mb-5">
                        <div className="relative max-w-md">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800">
                                <SearchIcon className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar materia..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Grid de materias */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {materiasFiltradas.map(m => {
                            const pendientes = m.actividades.filter(a => a.estado === 'pendiente' || a.estado === 'vencida').length;
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => setMateriaActiva(m.id)}
                                    className="group relative overflow-hidden rounded-2xl border border-[#293577]/20 bg-white shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all text-left"
                                >
                                    {/* Header con gradiente */}
                                    <div className="h-24 sm:h-28 bg-gradient-to-br from-[#293577] to-[#181b49] flex items-center justify-center relative overflow-hidden">
                                        {m.imagen ? (
                                            <>
                                                <img src={m.imagen} alt={m.nombre} className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:scale-105 transition-transform duration-300" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[#181b49]/80 to-transparent" />
                                            </>
                                        ) : null}
                                        <span className="text-4xl sm:text-5xl drop-shadow-lg text-white relative z-10">{m.icono}</span>
                                        {pendientes > 0 && (
                                            <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg animate-pulse">
                                                {pendientes}
                                            </span>
                                        )}
                                    </div>
                                    {/* Content */}
                                    <div className="p-3">
                                        <h3 className="font-bold text-gray-900 text-sm truncate">{m.nombre}</h3>
                                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{m.profesor}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-1">
                                                <div className="w-14 bg-gray-100 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${m.promedio >= 4.0 ? 'bg-green-500' : m.promedio >= 3.0 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${(m.promedio / 5) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-extrabold ${getNotaColor(m.promedio)}`}>{m.promedio}</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </>
            ) : materiaDetalle ? (
                <div className="space-y-5">
                    {/* Info de la materia */}
                    <div className={`rounded-2xl overflow-hidden border ${materiaDetalle.colorBorder}`}>
                        <div className="bg-gradient-to-r from-[#293577] to-[#181b49] p-5 text-white relative overflow-hidden">
                            {materiaDetalle.imagen && (
                                <img src={materiaDetalle.imagen} alt={materiaDetalle.nombre} className="absolute inset-0 w-full h-full object-cover opacity-20" />
                            )}
                            <div className="flex items-center gap-4">
                                <span className="text-4xl drop-shadow-lg relative z-10">{materiaDetalle.icono}</span>
                                <div>
                                    <h2 className="text-xl font-extrabold">{materiaDetalle.nombre}</h2>
                                    <p className="text-white/80 text-sm">{materiaDetalle.descripcion}</p>
                                </div>
                            </div>
                        </div>
                        <div className={`${materiaDetalle.colorBg} p-4 grid grid-cols-2 sm:grid-cols-4 gap-3`}>
                            <div className="text-center">
                                <p className="text-xs text-gray-400">Profesor</p>
                                <p className="text-sm font-bold text-gray-800">{materiaDetalle.profesor}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-400">Horas/Sem</p>
                                <p className="text-sm font-bold text-gray-800">{materiaDetalle.horasSemanales}h</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-400">Salón</p>
                                <p className="text-sm font-bold text-gray-800">{materiaDetalle.salon}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-400">Promedio</p>
                                <p className={`text-lg font-extrabold ${getNotaColor(materiaDetalle.promedio)}`}>{materiaDetalle.promedio}</p>
                            </div>
                        </div>
                    </div>

                    {/* Cortes */}
                    <div className="grid grid-cols-3 gap-3">
                        {materiaDetalle.promedioCortes.map((c, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                                <p className="text-[11px] text-gray-400 font-medium">{c.corte}</p>
                                <p className={`text-xl font-extrabold mt-1 ${c.nota > 0 ? getNotaColor(c.nota) : 'text-gray-300'}`}>
                                    {c.nota > 0 ? c.nota.toFixed(1) : '—'}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Filtros de actividades */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-gray-700">Actividades:</span>
                        {[
                            { key: 'todas', label: 'Todas', count: materiaDetalle.actividades.length },
                            { key: 'pendiente', label: 'Pendientes', count: materiaDetalle.actividades.filter(a => a.estado === 'pendiente').length },
                            { key: 'calificada', label: 'Calificadas', count: materiaDetalle.actividades.filter(a => a.estado === 'calificada').length },
                            { key: 'vencida', label: 'Vencidas', count: materiaDetalle.actividades.filter(a => a.estado === 'vencida').length },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFiltroActividad(f.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    filtroActividad === f.key
                                        ? 'bg-[#293577] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {f.label} ({f.count})
                            </button>
                        ))}
                    </div>

                    {/* Lista de actividades */}
                    <div className="space-y-3">
                        {actividadesFiltradas.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                                <p className="text-gray-400 text-sm">No hay actividades en esta categoría</p>
                            </div>
                        ) : (
                            actividadesFiltradas.map(act => (
                                <div key={act.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className="text-sm">{getEstadoIcon(act.estado)}</span>
                                                    <h4 className="font-bold text-gray-900 text-sm">{act.titulo}</h4>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getEstadoBadge(act.estado)}`}>
                                                        {act.estado}
                                                    </span>
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{act.tipo}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{act.descripcion}</p>
                                                <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400">
                                                    <span>Asignada: {act.fechaAsignada}</span>
                                                    <span>Entrega: {act.fechaEntrega}</span>
                                                    <span>Peso: {act.peso}%</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {act.nota !== undefined && (
                                                    <div className="text-center">
                                                        <p className={`text-2xl font-extrabold ${getNotaColor(act.nota)}`}>{act.nota}</p>
                                                        <p className="text-[10px] text-gray-400">/5.0</p>
                                                    </div>
                                                )}
                                                {(act.estado === 'pendiente' || act.estado === 'vencida') && (
                                                    <Link
                                                        href={route('estudiante.actividades.show', act.id)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${act.estado === 'vencida' ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-[#293577] hover:bg-[#181b49] text-white'}`}
                                                    >
                                                        {act.estado === 'vencida' ? 'Ver' : 'Entregar'}
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                        {act.retroalimentacion && (
                                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <p className="text-xs font-semibold text-blue-700 mb-0.5">Retroalimentación del profesor:</p>
                                                <p className="text-xs text-blue-600 italic">"{act.retroalimentacion}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : null}


        </SidebarLayout>
    );
}
