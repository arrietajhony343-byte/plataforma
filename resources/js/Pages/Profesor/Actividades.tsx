import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { profesorMenuItems } from '@/Config/profesorMenu';

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
    curso: string;
    materia: string;
    fechaAsignada: string;
    fechaEntrega: string;
    peso: number;
    entregados: number;
    totalEstudiantes: number;
    calificados: number;
    estado: 'activa' | 'cerrada' | 'borrador';
}

export default function Actividades() {
    const nombre = 'María García';
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroCurso, setFiltroCurso] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todas');
    const [showDetalle, setShowDetalle] = useState<Actividad | null>(null);

    const actividades: Actividad[] = [
        { id: 1, titulo: 'Taller de ecuaciones cuadráticas', descripcion: 'Resolver los 20 ejercicios del capítulo 5. Mostrar procedimiento completo.', tipo: 'Taller', curso: '8° A', materia: 'Matemáticas', fechaAsignada: '20 Feb 2026', fechaEntrega: '26 Feb 2026', peso: 15, entregados: 12, totalEstudiantes: 32, calificados: 0, estado: 'activa' },
        { id: 2, titulo: 'Quiz factorización', descripcion: 'Evaluación presencial sobre factorización de polinomios.', tipo: 'Evaluación', curso: '8° A', materia: 'Matemáticas', fechaAsignada: '22 Feb 2026', fechaEntrega: '02 Mar 2026', peso: 20, entregados: 0, totalEstudiantes: 32, calificados: 0, estado: 'activa' },
        { id: 3, titulo: 'Tarea: Funciones lineales', descripcion: 'Graficar 10 funciones lineales e identificar pendiente e intercepto.', tipo: 'Tarea', curso: '8° A', materia: 'Matemáticas', fechaAsignada: '10 Feb 2026', fechaEntrega: '17 Feb 2026', peso: 10, entregados: 30, totalEstudiantes: 32, calificados: 30, estado: 'cerrada' },
        { id: 4, titulo: 'Examen parcial - Álgebra', descripcion: 'Examen del primer corte cubriendo todos los temas.', tipo: 'Examen', curso: '8° A', materia: 'Matemáticas', fechaAsignada: '05 Feb 2026', fechaEntrega: '05 Feb 2026', peso: 30, entregados: 32, totalEstudiantes: 32, calificados: 32, estado: 'cerrada' },
        { id: 5, titulo: 'Ejercicios de fracciones', descripcion: 'Taller de refuerzo sobre operaciones con fracciones.', tipo: 'Taller', curso: '6° A', materia: 'Matemáticas', fechaAsignada: '21 Feb 2026', fechaEntrega: '28 Feb 2026', peso: 15, entregados: 8, totalEstudiantes: 32, calificados: 0, estado: 'activa' },
        { id: 6, titulo: 'Geometría: Áreas y perímetros', descripcion: 'Calcular áreas y perímetros de figuras compuestas.', tipo: 'Tarea', curso: '6° A', materia: 'Matemáticas', fechaAsignada: '15 Feb 2026', fechaEntrega: '22 Feb 2026', peso: 10, entregados: 28, totalEstudiantes: 32, calificados: 25, estado: 'activa' },
        { id: 7, titulo: 'Probabilidad básica', descripcion: 'Ejercicios introductorios de probabilidad y estadística.', tipo: 'Taller', curso: '7° A', materia: 'Matemáticas', fechaAsignada: '19 Feb 2026', fechaEntrega: '26 Feb 2026', peso: 15, entregados: 5, totalEstudiantes: 28, calificados: 0, estado: 'activa' },
        { id: 8, titulo: 'Números enteros: operaciones', descripcion: 'Borrador de taller para la próxima semana.', tipo: 'Taller', curso: '7° A', materia: 'Matemáticas', fechaAsignada: '', fechaEntrega: '', peso: 15, entregados: 0, totalEstudiantes: 28, calificados: 0, estado: 'borrador' },
    ];

    const cursos = [...new Set(actividades.map(a => a.curso))];

    const stats = useMemo(() => ({
        activas: actividades.filter(a => a.estado === 'activa').length,
        sinCalificar: actividades.reduce((acc, a) => acc + (a.entregados - a.calificados), 0),
        porCalificar: actividades.filter(a => a.entregados > a.calificados && a.estado !== 'borrador').length,
        borradores: actividades.filter(a => a.estado === 'borrador').length,
    }), []);

    const filtradas = useMemo(() => {
        let result = actividades;
        if (filtroEstado !== 'todas') result = result.filter(a => a.estado === filtroEstado);
        if (filtroCurso) result = result.filter(a => a.curso === filtroCurso);
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            result = result.filter(a => a.titulo.toLowerCase().includes(s) || a.curso.toLowerCase().includes(s));
        }
        return result;
    }, [filtroEstado, filtroCurso, searchTerm]);

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'activa': return 'bg-green-100 text-green-700 border-green-200';
            case 'cerrada': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'borrador': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    // Entregas mock para detalle
    const entregasMock = [
        { estudiante: 'Andrés F. Muñoz', entregado: true, fecha: '24 Feb 2026', nota: null },
        { estudiante: 'Laura Rodríguez', entregado: true, fecha: '23 Feb 2026', nota: null },
        { estudiante: 'Carlos Jiménez', entregado: true, fecha: '25 Feb 2026', nota: null },
        { estudiante: 'Sofía Herrera', entregado: false, fecha: '', nota: null },
        { estudiante: 'Miguel Ángel Torres', entregado: false, fecha: '', nota: null },
    ];

    return (
        <SidebarLayout
            menuItems={profesorMenuItems}
            userInfo={{ name: nombre, role: 'Profesor' }}
        >
            <Head title="Gestión de Actividades" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
                        Gestión de Actividades
                    </h1>
                    <p className="text-gray-500 mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Crea, asigna y califica actividades para tus estudiantes</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-5 py-2.5 bg-[#293577] text-white rounded-xl text-sm font-semibold hover:bg-[#181b49] transition-colors flex items-center gap-2 shadow-lg"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Nueva Actividad
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-white rounded-xl border border-green-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg></div>
                    <div>
                        <p className="text-2xl font-extrabold text-green-600">{stats.activas}</p>
                        <p className="text-xs text-gray-400">Activas</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-amber-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg></div>
                    <div>
                        <p className="text-2xl font-extrabold text-amber-600">{stats.sinCalificar}</p>
                        <p className="text-xs text-gray-400">Por calificar</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-blue-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                    <div>
                        <p className="text-2xl font-extrabold text-blue-600">{stats.porCalificar}</p>
                        <p className="text-xs text-gray-400">Con entregas</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></div>
                    <div>
                        <p className="text-2xl font-extrabold text-gray-600">{stats.borradores}</p>
                        <p className="text-xs text-gray-400">Borradores</p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800"><SearchIcon className="w-4 h-4" /></span>
                    <input type="text" placeholder="Buscar actividad..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm" />
                </div>
                <select value={filtroCurso} onChange={(e) => setFiltroCurso(e.target.value)}
                    className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]/30 min-w-[140px]">
                    <option value="">Todos los cursos</option>
                    {cursos.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-1 flex-wrap">
                    {[{ k: 'todas', l: 'Todas' }, { k: 'activa', l: 'Activas' }, { k: 'cerrada', l: 'Cerradas' }, { k: 'borrador', l: 'Borradores' }].map(f => (
                        <button key={f.k} onClick={() => setFiltroEstado(f.k)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filtroEstado === f.k ? 'bg-[#293577] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {f.l}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista actividades */}
            <div className="space-y-3">
                {filtradas.map(act => (
                    <div key={act.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                        <div className="p-4 flex items-start gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <span className="text-xl"><svg className="w-5 h-5 text-[#293577]" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg></span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h4 className="font-bold text-gray-900 text-sm">{act.titulo}</h4>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getEstadoBadge(act.estado)}`}>{act.estado}</span>
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{act.tipo}</span>
                                </div>
                                <p className="text-xs text-gray-500">{act.descripcion}</p>
                                <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400 flex-wrap">
                                    <span className="font-semibold text-blue-600">{act.curso}</span>
                                    <span>Peso: {act.peso}%</span>
                                    {act.fechaEntrega && <span>Entrega: {act.fechaEntrega}</span>}
                                </div>
                                {/* Barra de progreso */}
                                {act.estado !== 'borrador' && (
                                    <div className="mt-2 flex items-center gap-3">
                                        <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-xs">
                                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(act.entregados / act.totalEstudiantes) * 100}%` }}></div>
                                        </div>
                                        <span className="text-[11px] text-gray-500">{act.entregados}/{act.totalEstudiantes} entregados</span>
                                        {act.calificados > 0 && (
                                            <span className="text-[11px] text-green-600">{act.calificados} calificados</span>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                                <button
                                    onClick={() => setShowDetalle(act)}
                                    className="px-3 py-1.5 bg-[#293577] text-white rounded-lg text-xs font-semibold hover:bg-[#181b49] transition"
                                >
                                    {act.estado === 'borrador' ? 'Editar' : 'Ver entregas'}
                                </button>
                                {act.entregados > act.calificados && act.estado !== 'borrador' && (
                                    <button className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition">
                                        Calificar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Nueva Actividad */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                            <h3 className="font-bold text-gray-900 text-lg">Nueva Actividad</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input type="text" placeholder="Ej: Taller de ecuaciones cuadráticas" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea rows={3} placeholder="Instrucciones detalladas para los estudiantes..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm resize-none"></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm">
                                        <option>8° A</option><option>6° A</option><option>6° B</option><option>7° A</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm">
                                        <option>Taller</option><option>Tarea</option><option>Evaluación</option><option>Examen</option>
                                        <option>Proyecto</option><option>Exposición</option><option>Laboratorio</option><option>Ensayo</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de entrega</label>
                                    <input type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Peso (%)</label>
                                    <input type="number" min={1} max={100} placeholder="15" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adjuntar archivo (opcional)</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:border-[#293577]/30 transition cursor-pointer">
                                    <p className="text-xs text-gray-400">Arrastra o selecciona un archivo de apoyo</p>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">
                                    Guardar borrador
                                </button>
                                <button onClick={() => { alert('Actividad publicada'); setShowModal(false); }}
                                    className="flex-1 py-2.5 bg-[#293577] text-white rounded-lg text-sm font-semibold hover:bg-[#181b49] transition">
                                    Publicar actividad
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detalle / Entregas */}
            {showDetalle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
                            <div>
                                <h3 className="font-bold text-gray-900">{showDetalle.titulo}</h3>
                                <p className="text-xs text-gray-400">{showDetalle.curso} • {showDetalle.tipo} • Peso: {showDetalle.peso}%</p>
                            </div>
                            <button onClick={() => setShowDetalle(null)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-gray-600 mb-4">{showDetalle.descripcion}</p>
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex-1 bg-gray-100 rounded-full h-3">
                                    <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${(showDetalle.entregados / showDetalle.totalEstudiantes) * 100}%` }}></div>
                                </div>
                                <span className="text-sm font-bold text-gray-700">{showDetalle.entregados}/{showDetalle.totalEstudiantes}</span>
                            </div>
                            <h4 className="font-bold text-gray-800 text-sm mb-3">Entregas de estudiantes</h4>
                            <div className="space-y-2">
                                {entregasMock.map((e, i) => (
                                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${e.entregado ? 'bg-green-50/30 border-green-100' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${e.entregado ? 'bg-green-500' : 'bg-gray-300'}`}>
                                            {e.entregado ? '✓' : '—'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-800">{e.estudiante}</p>
                                            <p className="text-[11px] text-gray-400">{e.entregado ? `Entregado: ${e.fecha}` : 'Sin entregar'}</p>
                                        </div>
                                        {e.entregado && (
                                            <div className="flex gap-2">
                                                <button className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-[11px] font-semibold hover:bg-blue-200">Ver</button>
                                                <input type="number" min={0} max={5} step={0.1} placeholder="Nota" className="w-16 px-2 py-1 border border-gray-300 rounded text-xs text-center" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex gap-3">
                                <button className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition">
                                    Guardar calificaciones
                                </button>
                                <button className="px-4 py-2.5 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition">
                                    Recordatorio
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
