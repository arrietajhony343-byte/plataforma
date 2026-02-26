import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

/* ═══════════════════════════ TYPES ═══════════════════════════ */
interface TipoCertificado {
    id: number;
    nombre: string;
    codigo: string;
    descripcion: string | null;
    precio: number;
    activo: boolean;
}

interface Estudiante {
    id: number;
    name: string;
    nivel: string;
    curso: string;
    curso_id: number | null;
}

interface Curso {
    id: number;
    nombre: string;
    nivel: string;
    grado: string;
}

interface Certificado {
    id: number;
    tipo_certificado_id: number | null;
    tipo_nombre: string;
    tipo_codigo: string;
    estudiante_id: number;
    estudiante: string;
    nivel: string;
    curso_id: number | null;
    curso: string;
    descripcion: string | null;
    archivo: string | null;
    fecha_solicitud: string;
    fecha_entrega: string | null;
    estado: 'solicitado' | 'en_proceso' | 'listo' | 'entregado';
}

interface Props {
    certificados: Certificado[];
    tiposCertificado: TipoCertificado[];
    estudiantes: Estudiante[];
    cursos: Curso[];
    niveles: string[];
}

/* ═══════════════════════════ HELPERS ═══════════════════════════ */
const nivelesConfig: Record<string, { label: string; color: string; chipActive: string }> = {
    preescolar:   { label: 'Pre-escolar',  color: 'bg-pink-100 text-pink-700',     chipActive: 'bg-pink-500' },
    transicion:   { label: 'Transición',   color: 'bg-purple-100 text-purple-700', chipActive: 'bg-purple-500' },
    primaria:     { label: 'Primaria',     color: 'bg-blue-100 text-blue-700',     chipActive: 'bg-blue-500' },
    secundaria:   { label: 'Secundaria',   color: 'bg-cyan-100 text-cyan-700',     chipActive: 'bg-cyan-500' },
    media:        { label: 'Media',        color: 'bg-amber-100 text-amber-700',   chipActive: 'bg-amber-500' },
    bachillerato: { label: 'Bachillerato', color: 'bg-emerald-100 text-emerald-700', chipActive: 'bg-emerald-500' },
};

const estadosConfig: Record<string, { label: string; color: string }> = {
    solicitado: { label: 'Solicitado',       color: 'bg-yellow-100 text-yellow-800' },
    en_proceso: { label: 'En Proceso',       color: 'bg-blue-100 text-blue-800' },
    listo:      { label: 'Listo para Entrega', color: 'bg-green-100 text-green-800' },
    entregado:  { label: 'Entregado',        color: 'bg-gray-100 text-gray-600' },
};

const getNivelBadge = (nivel: string) => nivelesConfig[nivel]?.color ?? 'bg-gray-100 text-gray-700';
const getNivelLabel = (nivel: string) => nivelesConfig[nivel]?.label ?? nivel;
const getNivelChipActive = (nivel: string) => nivelesConfig[nivel]?.chipActive ?? 'bg-gray-500';
const getEstadoBadge = (estado: string) => estadosConfig[estado]?.color ?? 'bg-gray-100 text-gray-700';
const getEstadoLabel = (estado: string) => estadosConfig[estado]?.label ?? estado;

const formatPrecio = (precio: number) => '$' + precio.toLocaleString('es-CO');

/* ═══════════════════════════ COMPONENT ═══════════════════════════ */
export default function Certificados({ certificados, tiposCertificado, estudiantes, cursos, niveles }: Props) {
    // ── Filter State ──
    const [nivelSeleccionado, setNivelSeleccionado] = useState('todos');
    const [cursoSeleccionado, setCursoSeleccionado] = useState('todos');
    const [tipoSeleccionado, setTipoSeleccionado] = useState('todos');
    const [estadoSeleccionado, setEstadoSeleccionado] = useState('todos');
    const [busqueda, setBusqueda] = useState('');

    // ── Modal State ──
    const [showModalSolicitud, setShowModalSolicitud] = useState(false);
    const [showModalTipo, setShowModalTipo] = useState(false);
    const [showModalGestionar, setShowModalGestionar] = useState<Certificado | null>(null);
    const [editingTipo, setEditingTipo] = useState<TipoCertificado | null>(null);

    // ── Form State ──
    const [formSolicitud, setFormSolicitud] = useState({
        estudiante_id: '',
        tipo_certificado_id: '',
        descripcion: '',
    });
    const [formTipo, setFormTipo] = useState({
        nombre: '',
        codigo: '',
        descripcion: '',
        precio: 0,
        activo: true,
    });
    const [processing, setProcessing] = useState(false);

    // ── Computed ──
    const tiposActivos = useMemo(() => tiposCertificado.filter(t => t.activo), [tiposCertificado]);

    const cursosDisponibles = useMemo(() => {
        if (nivelSeleccionado === 'todos') return cursos;
        return cursos.filter(c => c.nivel === nivelSeleccionado);
    }, [cursos, nivelSeleccionado]);

    const estudiantesFiltrados = useMemo(() => {
        let lista = estudiantes;
        if (nivelSeleccionado !== 'todos') {
            lista = lista.filter(e => e.nivel === nivelSeleccionado);
        }
        if (cursoSeleccionado !== 'todos') {
            lista = lista.filter(e => e.curso_id?.toString() === cursoSeleccionado);
        }
        return lista;
    }, [estudiantes, nivelSeleccionado, cursoSeleccionado]);

    const certificadosFiltrados = useMemo(() => {
        return certificados.filter(cert => {
            const matchNivel = nivelSeleccionado === 'todos' || cert.nivel === nivelSeleccionado;
            const matchCurso = cursoSeleccionado === 'todos' || cert.curso_id?.toString() === cursoSeleccionado;
            const matchTipo = tipoSeleccionado === 'todos' || cert.tipo_certificado_id?.toString() === tipoSeleccionado;
            const matchEstado = estadoSeleccionado === 'todos' || cert.estado === estadoSeleccionado;
            const matchBusqueda = busqueda === '' ||
                cert.estudiante.toLowerCase().includes(busqueda.toLowerCase()) ||
                cert.tipo_nombre.toLowerCase().includes(busqueda.toLowerCase());
            return matchNivel && matchCurso && matchTipo && matchEstado && matchBusqueda;
        });
    }, [certificados, nivelSeleccionado, cursoSeleccionado, tipoSeleccionado, estadoSeleccionado, busqueda]);

    const stats = useMemo(() => ({
        solicitado: certificadosFiltrados.filter(c => c.estado === 'solicitado').length,
        en_proceso: certificadosFiltrados.filter(c => c.estado === 'en_proceso').length,
        listo: certificadosFiltrados.filter(c => c.estado === 'listo').length,
        entregado: certificadosFiltrados.filter(c => c.estado === 'entregado').length,
    }), [certificadosFiltrados]);

    const hayFiltrosActivos = nivelSeleccionado !== 'todos' || cursoSeleccionado !== 'todos' || tipoSeleccionado !== 'todos' || estadoSeleccionado !== 'todos' || busqueda !== '';

    // ── Handlers ──
    const handleNivelChange = (nivel: string) => {
        setNivelSeleccionado(nivel);
        setCursoSeleccionado('todos');
    };

    const limpiarFiltros = () => {
        setNivelSeleccionado('todos');
        setCursoSeleccionado('todos');
        setTipoSeleccionado('todos');
        setEstadoSeleccionado('todos');
        setBusqueda('');
    };

    const openModalTipo = (tipo?: TipoCertificado) => {
        if (tipo) {
            setEditingTipo(tipo);
            setFormTipo({
                nombre: tipo.nombre,
                codigo: tipo.codigo,
                descripcion: tipo.descripcion ?? '',
                precio: tipo.precio,
                activo: tipo.activo,
            });
        } else {
            setEditingTipo(null);
            setFormTipo({ nombre: '', codigo: '', descripcion: '', precio: 0, activo: true });
        }
        setShowModalTipo(true);
    };

    const closeModalTipo = () => {
        setShowModalTipo(false);
        setEditingTipo(null);
        setFormTipo({ nombre: '', codigo: '', descripcion: '', precio: 0, activo: true });
    };

    const openModalSolicitud = () => {
        setFormSolicitud({ estudiante_id: '', tipo_certificado_id: tiposActivos[0]?.id.toString() ?? '', descripcion: '' });
        setShowModalSolicitud(true);
    };

    const closeModalSolicitud = () => {
        setShowModalSolicitud(false);
        setFormSolicitud({ estudiante_id: '', tipo_certificado_id: '', descripcion: '' });
    };

    // ── Submit Handlers ──
    const handleSubmitSolicitud = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formSolicitud.estudiante_id || !formSolicitud.tipo_certificado_id) return;
        setProcessing(true);
        router.post('/admin/certificados', {
            estudiante_id: parseInt(formSolicitud.estudiante_id),
            tipo_certificado_id: parseInt(formSolicitud.tipo_certificado_id),
            descripcion: formSolicitud.descripcion || null,
        }, {
            onSuccess: () => closeModalSolicitud(),
            onFinish: () => setProcessing(false),
        });
    };

    const handleSubmitTipo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTipo.nombre || !formTipo.codigo) return;
        setProcessing(true);
        const url = editingTipo
            ? `/admin/certificados/tipos/${editingTipo.id}`
            : '/admin/certificados/tipos';
        const method = editingTipo ? 'put' : 'post';
        router[method](url, formTipo, {
            onSuccess: () => closeModalTipo(),
            onFinish: () => setProcessing(false),
        });
    };

    const handleDeleteTipo = (tipo: TipoCertificado) => {
        if (!confirm(`¿Eliminar el tipo "${tipo.nombre}"? Esta acción no se puede deshacer.`)) return;
        router.delete(`/admin/certificados/tipos/${tipo.id}`);
    };

    const handleUpdateEstado = (cert: Certificado, nuevoEstado: string) => {
        router.put(`/admin/certificados/${cert.id}`, { estado: nuevoEstado }, {
            onSuccess: () => setShowModalGestionar(null),
        });
    };

    const handleDeleteCertificado = (cert: Certificado) => {
        if (!confirm(`¿Eliminar la solicitud de ${cert.estudiante}?`)) return;
        router.delete(`/admin/certificados/${cert.id}`);
    };

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Certificados">
            <Head title="Certificados" />

            <div className="space-y-4 sm:space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* ═══ Header ═══ */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>
                            Gestión de Certificados
                        </h1>
                        <p className="text-gray-600 text-sm">Genera y administra certificados y constancias</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => openModalTipo()}
                            className="flex items-center gap-2 bg-white border border-[#293577] text-[#293577] px-4 py-2 rounded-lg hover:bg-[#293577]/5 text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                            </svg>
                            Gestionar Tipos
                        </button>
                        <button
                            onClick={openModalSolicitud}
                            className="flex items-center gap-2 bg-[#293577] text-white px-4 py-2 rounded-lg hover:bg-[#181b49] text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Nueva Solicitud
                        </button>
                    </div>
                </div>

                {/* ═══ Tipos de Certificado ═══ */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-800 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                            Tipos de Certificados Disponibles
                        </h2>
                        <button
                            onClick={() => openModalTipo()}
                            className="text-xs text-[#293577] hover:text-[#181b49] font-medium flex items-center gap-1"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Agregar tipo
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tiposCertificado.map((tipo) => (
                            <div
                                key={tipo.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${tipo.activo ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-300 opacity-60'}`}
                            >
                                <div className="min-w-0 flex-1">
                                    <span className="text-sm text-gray-800 font-medium truncate block">{tipo.nombre}</span>
                                    {tipo.descripcion && (
                                        <span className="text-xs text-gray-500 truncate block">{tipo.descripcion}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                    <span className="text-sm font-bold text-green-600">{formatPrecio(tipo.precio)}</span>
                                    <button
                                        onClick={() => openModalTipo(tipo)}
                                        className="p-1 text-gray-400 hover:text-[#293577]"
                                        title="Editar"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══ Stats ═══ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        { key: 'solicitado', label: 'Pendientes', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', subtext: 'text-yellow-700' },
                        { key: 'en_proceso', label: 'En Proceso', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', subtext: 'text-blue-700' },
                        { key: 'listo', label: 'Listos', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', subtext: 'text-green-700' },
                        { key: 'entregado', label: 'Entregados', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', subtext: 'text-gray-700' },
                    ].map(stat => (
                        <button
                            key={stat.key}
                            onClick={() => setEstadoSeleccionado(estadoSeleccionado === stat.key ? 'todos' : stat.key)}
                            className={`${stat.bg} border ${stat.border} rounded-xl p-3 sm:p-4 text-center transition-all ${estadoSeleccionado === stat.key ? 'ring-2 ring-offset-1 ring-[#293577]' : 'hover:shadow-md'}`}
                        >
                            <p className={`text-2xl sm:text-3xl font-bold ${stat.text}`}>{stats[stat.key as keyof typeof stats]}</p>
                            <p className={`text-xs sm:text-sm ${stat.subtext}`}>{stat.label}</p>
                        </button>
                    ))}
                </div>

                {/* ═══ Filtros ═══ */}
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-4 border border-gray-100">
                    {/* Nivel educativo chips */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nivel Educativo</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleNivelChange('todos')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${nivelSeleccionado === 'todos' ? 'bg-[#293577] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Todos
                            </button>
                            {niveles.map(nivel => (
                                <button
                                    key={nivel}
                                    onClick={() => handleNivelChange(nivel)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${nivelSeleccionado === nivel ? `${getNivelChipActive(nivel)} text-white shadow-md` : `${getNivelBadge(nivel)} hover:opacity-80`}`}
                                >
                                    {getNivelLabel(nivel)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Curso, Tipo, Estado, Búsqueda */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Curso</label>
                            <select
                                value={cursoSeleccionado}
                                onChange={(e) => setCursoSeleccionado(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="todos">Todos los cursos</option>
                                {cursosDisponibles.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo de Certificado</label>
                            <select
                                value={tipoSeleccionado}
                                onChange={(e) => setTipoSeleccionado(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="todos">Todos los tipos</option>
                                {tiposCertificado.map(t => (
                                    <option key={t.id} value={t.id}>{t.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Estado</label>
                            <select
                                value={estadoSeleccionado}
                                onChange={(e) => setEstadoSeleccionado(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="todos">Todos los estados</option>
                                {Object.entries(estadosConfig).map(([key, cfg]) => (
                                    <option key={key} value={key}>{cfg.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Buscar</label>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Estudiante o tipo..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filtros activos */}
                    {hayFiltrosActivos && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="text-xs text-gray-500">Filtros activos:</span>
                            {nivelSeleccionado !== 'todos' && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getNivelBadge(nivelSeleccionado)}`}>
                                    {getNivelLabel(nivelSeleccionado)}
                                    <button onClick={() => handleNivelChange('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {cursoSeleccionado !== 'todos' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                    {cursos.find(c => c.id.toString() === cursoSeleccionado)?.nombre}
                                    <button onClick={() => setCursoSeleccionado('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {tipoSeleccionado !== 'todos' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                    {tiposCertificado.find(t => t.id.toString() === tipoSeleccionado)?.nombre}
                                    <button onClick={() => setTipoSeleccionado('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {estadoSeleccionado !== 'todos' && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(estadoSeleccionado)}`}>
                                    {getEstadoLabel(estadoSeleccionado)}
                                    <button onClick={() => setEstadoSeleccionado('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {busqueda && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                    "{busqueda}"
                                    <button onClick={() => setBusqueda('')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            <button onClick={limpiarFiltros} className="text-xs text-red-500 hover:text-red-700 font-medium ml-1">
                                Limpiar todo
                            </button>
                        </div>
                    )}
                </div>

                {/* ═══ Tabla Desktop ═══ */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hidden sm:block">
                    {certificadosFiltrados.length === 0 ? (
                        <div className="p-12 text-center">
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                            <p className="text-gray-500 font-medium">No se encontraron certificados</p>
                            <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px]">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nivel</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Curso</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Solicitud</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {certificadosFiltrados.map((cert) => (
                                        <tr key={cert.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-medium text-gray-800">{cert.tipo_nombre}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{cert.estudiante}</td>
                                            <td className="px-4 py-3">
                                                {cert.nivel ? (
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getNivelBadge(cert.nivel)}`}>
                                                        {getNivelLabel(cert.nivel)}
                                                    </span>
                                                ) : <span className="text-gray-400">-</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{cert.curso || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{cert.fecha_solicitud}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getEstadoBadge(cert.estado)}`}>
                                                    {getEstadoLabel(cert.estado)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {cert.estado === 'listo' && cert.archivo && (
                                                        <a
                                                            href={`/admin/certificados/${cert.id}/download`}
                                                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                        >
                                                            Descargar
                                                        </a>
                                                    )}
                                                    {cert.estado !== 'entregado' && (
                                                        <button
                                                            onClick={() => setShowModalGestionar(cert)}
                                                            className="text-[#293577] hover:text-[#181b49] text-sm font-medium"
                                                        >
                                                            Gestionar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteCertificado(cert)}
                                                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ═══ Cards Mobile ═══ */}
                <div className="sm:hidden space-y-3">
                    {certificadosFiltrados.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                            <p className="text-gray-500 text-sm">No se encontraron certificados</p>
                        </div>
                    ) : (
                        certificadosFiltrados.map((cert) => (
                            <div key={cert.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-800 text-sm">{cert.tipo_nombre}</p>
                                        <p className="text-xs text-gray-500">{cert.fecha_solicitud}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getEstadoBadge(cert.estado)}`}>
                                        {getEstadoLabel(cert.estado)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-800">{cert.estudiante}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {cert.nivel && (
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getNivelBadge(cert.nivel)}`}>
                                                    {getNivelLabel(cert.nivel)}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500">{cert.curso}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        {cert.estado !== 'entregado' && (
                                            <button
                                                onClick={() => setShowModalGestionar(cert)}
                                                className="text-[#293577] text-xs font-medium"
                                            >
                                                Gestionar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Contador */}
                <div className="text-center">
                    <p className="text-xs text-gray-400">
                        Mostrando {certificadosFiltrados.length} de {certificados.length} certificados
                    </p>
                </div>
            </div>

            {/* ═══════════════════════════ MODAL NUEVA SOLICITUD ═══════════════════════════ */}
            {showModalSolicitud && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md">
                        <h2 className="text-lg font-bold text-gray-800 mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                            Nueva Solicitud de Certificado
                        </h2>
                        <form onSubmit={handleSubmitSolicitud} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante *</label>
                                <select
                                    value={formSolicitud.estudiante_id}
                                    onChange={(e) => setFormSolicitud({ ...formSolicitud, estudiante_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                                    required
                                >
                                    <option value="">Seleccionar estudiante...</option>
                                    {estudiantes.map(e => (
                                        <option key={e.id} value={e.id}>{e.name} {e.curso ? `(${e.curso})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Certificado *</label>
                                <select
                                    value={formSolicitud.tipo_certificado_id}
                                    onChange={(e) => setFormSolicitud({ ...formSolicitud, tipo_certificado_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                                    required
                                >
                                    {tiposActivos.map(t => (
                                        <option key={t.id} value={t.id}>{t.nombre} - {formatPrecio(t.precio)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                                <textarea
                                    value={formSolicitud.descripcion}
                                    onChange={(e) => setFormSolicitud({ ...formSolicitud, descripcion: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#293577]"
                                    placeholder="Notas adicionales..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModalSolicitud}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !formSolicitud.estudiante_id}
                                    className="flex-1 bg-[#293577] text-white px-4 py-2 rounded-lg hover:bg-[#181b49] text-sm font-medium disabled:opacity-50"
                                >
                                    {processing ? 'Creando...' : 'Crear Solicitud'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════ MODAL GESTIONAR TIPO ═══════════════════════════ */}
            {showModalTipo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>
                                {editingTipo ? 'Editar Tipo de Certificado' : 'Nuevo Tipo de Certificado'}
                            </h2>
                            <button onClick={closeModalTipo} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmitTipo} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        value={formTipo.nombre}
                                        onChange={(e) => setFormTipo({ ...formTipo, nombre: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                                        placeholder="Ej: Constancia de Estudios"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                                    <input
                                        type="text"
                                        value={formTipo.codigo}
                                        onChange={(e) => setFormTipo({ ...formTipo, codigo: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                                        placeholder="Ej: constancia_estudios"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    value={formTipo.descripcion}
                                    onChange={(e) => setFormTipo({ ...formTipo, descripcion: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#293577]"
                                    placeholder="Descripción del certificado..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={formTipo.precio}
                                        onChange={(e) => setFormTipo({ ...formTipo, precio: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                                        required
                                    />
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formTipo.activo}
                                            onChange={(e) => setFormTipo({ ...formTipo, activo: e.target.checked })}
                                            className="w-4 h-4 text-[#293577] border-gray-300 rounded focus:ring-[#293577]"
                                        />
                                        <span className="text-sm text-gray-700">Activo</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                {editingTipo && (
                                    <button
                                        type="button"
                                        onClick={() => { handleDeleteTipo(editingTipo); closeModalTipo(); }}
                                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                                    >
                                        Eliminar
                                    </button>
                                )}
                                <div className="flex-1 flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={closeModalTipo}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || !formTipo.nombre || !formTipo.codigo}
                                        className="bg-[#293577] text-white px-6 py-2 rounded-lg hover:bg-[#181b49] text-sm font-medium disabled:opacity-50"
                                    >
                                        {processing ? 'Guardando...' : editingTipo ? 'Actualizar' : 'Crear'}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Lista de tipos existentes */}
                        {!editingTipo && tiposCertificado.length > 0 && (
                            <div className="mt-6 pt-4 border-t">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Tipos existentes</h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {tiposCertificado.map(t => (
                                        <div
                                            key={t.id}
                                            className={`flex items-center justify-between p-2 rounded-lg ${t.activo ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`}
                                        >
                                            <div className="min-w-0">
                                                <span className="text-sm font-medium text-gray-800">{t.nombre}</span>
                                                <span className="text-xs text-gray-500 ml-2">{formatPrecio(t.precio)}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openModalTipo(t)}
                                                className="text-xs text-[#293577] hover:text-[#181b49] font-medium"
                                            >
                                                Editar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════ MODAL GESTIONAR CERTIFICADO ═══════════════════════════ */}
            {showModalGestionar && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-md">
                        <h2 className="text-lg font-bold text-gray-800 mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                            Gestionar Certificado
                        </h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tipo:</span>
                                <span className="font-medium text-gray-800">{showModalGestionar.tipo_nombre}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Estudiante:</span>
                                <span className="font-medium text-gray-800">{showModalGestionar.estudiante}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Curso:</span>
                                <span className="text-gray-800">{showModalGestionar.curso || '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Fecha solicitud:</span>
                                <span className="text-gray-800">{showModalGestionar.fecha_solicitud}</span>
                            </div>
                            <div className="flex justify-between text-sm items-center">
                                <span className="text-gray-500">Estado actual:</span>
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getEstadoBadge(showModalGestionar.estado)}`}>
                                    {getEstadoLabel(showModalGestionar.estado)}
                                </span>
                            </div>
                            {showModalGestionar.descripcion && (
                                <div className="pt-2 border-t">
                                    <span className="text-xs text-gray-500 block mb-1">Observaciones:</span>
                                    <p className="text-sm text-gray-700">{showModalGestionar.descripcion}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2 mb-4">
                            <p className="text-sm font-medium text-gray-700">Cambiar estado:</p>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(estadosConfig).map(([key, cfg]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleUpdateEstado(showModalGestionar, key)}
                                        disabled={showModalGestionar.estado === key}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                            showModalGestionar.estado === key
                                                ? 'bg-[#293577] text-white cursor-default'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {cfg.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2 border-t">
                            <button
                                onClick={() => { handleDeleteCertificado(showModalGestionar); setShowModalGestionar(null); }}
                                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                            >
                                Eliminar
                            </button>
                            <button
                                onClick={() => setShowModalGestionar(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
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
