import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

interface Certificado {
    id: number;
    tipo: string;
    estudiante: string;
    nivel: string;
    curso: string;
    fecha_solicitud: string;
    fecha_entrega: string | null;
    estado: 'pendiente' | 'en_proceso' | 'listo' | 'entregado';
}

// Estructura de niveles y cursos del colegio
const nivelesEducativos: Record<string, { label: string; cursos: string[] }> = {
    preescolar: {
        label: 'Pre-escolar',
        cursos: ['Pre-Jardín', 'Jardín'],
    },
    transicion: {
        label: 'Transición',
        cursos: ['Transición A', 'Transición B'],
    },
    primaria: {
        label: 'Primaria',
        cursos: ['1°', '2°', '3°', '4°', '5°'],
    },
    bachillerato: {
        label: 'Bachillerato',
        cursos: ['6°', '7°', '8°', '9°', '10°', '11°'],
    },
};

const nivelesKeys = Object.keys(nivelesEducativos);

interface Props {
    certificados: Certificado[];
}

export default function Certificados({ certificados }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [nivelSeleccionado, setNivelSeleccionado] = useState('todos');
    const [cursoSeleccionado, setCursoSeleccionado] = useState('todos');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    const [busqueda, setBusqueda] = useState('');

    const tiposCertificado = [
        { id: 'constancia_estudios', nombre: 'Constancia de Estudios', precio: 15000 },
        { id: 'certificado_notas', nombre: 'Certificado de Notas', precio: 20000 },
        { id: 'constancia_matricula', nombre: 'Constancia de Matrícula', precio: 10000 },
        { id: 'certificado_conducta', nombre: 'Certificado de Conducta', precio: 15000 },
        { id: 'paz_y_salvo', nombre: 'Paz y Salvo', precio: 5000 },
    ];

    // Cursos disponibles según nivel
    const cursosDisponibles = useMemo(() => {
        if (nivelSeleccionado === 'todos') {
            return nivelesKeys.flatMap(k => nivelesEducativos[k].cursos);
        }
        return nivelesEducativos[nivelSeleccionado]?.cursos ?? [];
    }, [nivelSeleccionado]);

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'en_proceso': return 'bg-blue-100 text-blue-800';
            case 'listo': return 'bg-green-100 text-green-800';
            case 'entregado': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getEstadoTexto = (estado: string) => {
        switch (estado) {
            case 'pendiente': return 'Pendiente';
            case 'en_proceso': return 'En Proceso';
            case 'listo': return 'Listo para Entrega';
            case 'entregado': return 'Entregado';
            default: return estado;
        }
    };

    const getNivelBadge = (nivel: string) => {
        switch (nivel) {
            case 'preescolar': return 'bg-pink-100 text-pink-700';
            case 'transicion': return 'bg-purple-100 text-purple-700';
            case 'primaria': return 'bg-blue-100 text-blue-700';
            case 'bachillerato': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getNivelLabel = (nivel: string) => nivelesEducativos[nivel]?.label ?? nivel;

    // Resetear curso al cambiar nivel
    const handleNivelChange = (nivel: string) => {
        setNivelSeleccionado(nivel);
        setCursoSeleccionado('todos');
    };

    // Filtrado con todos los criterios
    const filteredCertificados = useMemo(() => {
        return certificados.filter(cert => {
            const matchNivel = nivelSeleccionado === 'todos' || cert.nivel === nivelSeleccionado;
            const matchCurso = cursoSeleccionado === 'todos' || cert.curso === cursoSeleccionado;
            const matchEstado = filtroEstado === 'todos' || cert.estado === filtroEstado;
            const matchTipo = filtroTipo === 'todos' || cert.tipo === filtroTipo;
            const matchBusqueda = busqueda === '' ||
                cert.estudiante.toLowerCase().includes(busqueda.toLowerCase()) ||
                cert.tipo.toLowerCase().includes(busqueda.toLowerCase());
            return matchNivel && matchCurso && matchEstado && matchTipo && matchBusqueda;
        });
    }, [nivelSeleccionado, cursoSeleccionado, filtroEstado, filtroTipo, busqueda]);

    const hayFiltrosActivos = nivelSeleccionado !== 'todos' || cursoSeleccionado !== 'todos' || filtroEstado !== 'todos' || filtroTipo !== 'todos' || busqueda !== '';

    const limpiarFiltros = () => {
        setNivelSeleccionado('todos');
        setCursoSeleccionado('todos');
        setFiltroEstado('todos');
        setFiltroTipo('todos');
        setBusqueda('');
    };

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Certificados">
            <Head title="Certificados" />

            <div className="space-y-4 sm:space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Gestión de Certificados</h1>
                        <p className="text-gray-600 text-sm sm:text-base">Genera y administra certificados y constancias</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-[#293577] text-white px-4 py-2 rounded-lg hover:bg-[#181b49] text-sm sm:text-base"
                    >
                        <span>+</span> Nueva Solicitud
                    </button>
                </div>

                {/* Tipos de certificado disponibles */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <h2 className="font-bold text-gray-800 mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>Tipos de Certificados Disponibles</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tiposCertificado.map((tipo) => (
                            <div key={tipo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-700">{tipo.nombre}</span>
                                <span className="text-sm font-medium text-green-600">${tipo.precio.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{filteredCertificados.filter(c => c.estado === 'pendiente').length}</p>
                        <p className="text-xs sm:text-sm text-yellow-700">Pendientes</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600">{filteredCertificados.filter(c => c.estado === 'en_proceso').length}</p>
                        <p className="text-xs sm:text-sm text-blue-700">En Proceso</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-green-600">{filteredCertificados.filter(c => c.estado === 'listo').length}</p>
                        <p className="text-xs sm:text-sm text-green-700">Listos</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-gray-600">{filteredCertificados.filter(c => c.estado === 'entregado').length}</p>
                        <p className="text-xs sm:text-sm text-gray-700">Entregados</p>
                    </div>
                </div>

                {/* Filtros mejorados */}
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
                    {/* Fila 1: Nivel educativo como chips */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nivel Educativo</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleNivelChange('todos')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    nivelSeleccionado === 'todos'
                                        ? 'bg-[#293577] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => handleNivelChange('preescolar')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    nivelSeleccionado === 'preescolar'
                                        ? 'bg-pink-500 text-white shadow-md'
                                        : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                                }`}
                            >
                                Pre-escolar
                            </button>
                            <button
                                onClick={() => handleNivelChange('transicion')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    nivelSeleccionado === 'transicion'
                                        ? 'bg-purple-500 text-white shadow-md'
                                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                }`}
                            >
                                Transición
                            </button>
                            <button
                                onClick={() => handleNivelChange('primaria')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    nivelSeleccionado === 'primaria'
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}
                            >
                                Primaria
                            </button>
                            <button
                                onClick={() => handleNivelChange('bachillerato')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    nivelSeleccionado === 'bachillerato'
                                        ? 'bg-emerald-500 text-white shadow-md'
                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                            >
                                Bachillerato
                            </button>
                        </div>
                    </div>

                    {/* Fila 2: Curso, Tipo, Estado y Búsqueda */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Curso</label>
                            <select
                                value={cursoSeleccionado}
                                onChange={(e) => setCursoSeleccionado(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="todos">Todos los cursos</option>
                                {cursosDisponibles.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo de Certificado</label>
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="todos">Todos los tipos</option>
                                {tiposCertificado.map(t => (
                                    <option key={t.id} value={t.nombre}>{t.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Estado</label>
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="pendiente">Pendientes</option>
                                <option value="en_proceso">En Proceso</option>
                                <option value="listo">Listos</option>
                                <option value="entregado">Entregados</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Buscar</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800">
                                    <SearchIcon className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Estudiante o tipo..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
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
                                    {cursoSeleccionado}
                                    <button onClick={() => setCursoSeleccionado('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {filtroTipo !== 'todos' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                    {filtroTipo}
                                    <button onClick={() => setFiltroTipo('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {filtroEstado !== 'todos' && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(filtroEstado)}`}>
                                    {getEstadoTexto(filtroEstado)}
                                    <button onClick={() => setFiltroEstado('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {busqueda && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                    "{busqueda}"
                                    <button onClick={() => setBusqueda('')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            <button
                                onClick={limpiarFiltros}
                                className="text-xs text-red-500 hover:text-red-700 font-medium ml-1"
                            >
                                Limpiar todo
                            </button>
                        </div>
                    )}
                </div>

                {/* Tabla Desktop */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden sm:block">
                    {filteredCertificados.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500 font-medium">No se encontraron certificados</p>
                            <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed min-w-[800px]">
                                <colgroup>
                                    <col className="w-[165px]" />
                                    <col />
                                    <col className="w-[100px]" />
                                    <col className="w-[90px]" />
                                    <col className="w-[105px]" />
                                    <col className="w-[130px]" />
                                    <col className="w-[140px]" />
                                </colgroup>
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitud</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredCertificados.map((cert) => (
                                        <tr key={cert.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="text-lg flex-shrink-0"></span>
                                                    <span className="text-sm font-medium text-gray-800 truncate">{cert.tipo}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 truncate">{cert.estudiante}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getNivelBadge(cert.nivel)}`}>
                                                    {getNivelLabel(cert.nivel)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{cert.curso}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{cert.fecha_solicitud}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(cert.estado)}`}>
                                                    {getEstadoTexto(cert.estado)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {cert.estado === 'listo' && (
                                                        <button className="text-green-600 hover:text-green-800 text-sm font-medium">Descargar</button>
                                                    )}
                                                    {cert.estado !== 'entregado' && (
                                                        <button className="text-[#293577] hover:text-[#181b49] text-sm font-medium">Gestionar</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Cards Mobile */}
                <div className="sm:hidden space-y-3">
                    {filteredCertificados.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                            <p className="text-3xl mb-2"></p>
                            <p className="text-gray-500 text-sm">No se encontraron certificados</p>
                        </div>
                    ) : (
                        filteredCertificados.map((cert) => (
                            <div key={cert.id} className="bg-white rounded-xl shadow-sm p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-xl flex-shrink-0"></span>
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-800 text-sm truncate">{cert.tipo}</p>
                                            <p className="text-xs text-gray-500">{cert.fecha_solicitud}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getEstadoBadge(cert.estado)}`}>
                                        {getEstadoTexto(cert.estado)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-800 truncate">{cert.estudiante}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getNivelBadge(cert.nivel)}`}>
                                                {getNivelLabel(cert.nivel)}
                                            </span>
                                            <span className="text-xs text-gray-500">{cert.curso}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        {cert.estado === 'listo' && (
                                            <button className="text-green-600 text-xs font-medium"></button>
                                        )}
                                        {cert.estado !== 'entregado' && (
                                            <button className="text-[#293577] text-xs font-medium"></button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Contador resultados */}
                <div className="text-center">
                    <p className="text-xs text-gray-400">
                        Mostrando {filteredCertificados.length} de {certificados.length} certificados
                    </p>
                </div>

                
            </div>

            {/* Modal Nueva Solicitud */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>Nueva Solicitud de Certificado</h2>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nivel Educativo</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm">
                                    <option value="">Seleccionar nivel...</option>
                                    {nivelesKeys.map(k => (
                                        <option key={k} value={k}>{nivelesEducativos[k].label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante</label>
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-800" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                                    <input
                                        type="text"
                                        placeholder="Buscar estudiante..."
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Certificado</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm">
                                    {tiposCertificado.map((tipo) => (
                                        <option key={tipo.id} value={tipo.id}>{tipo.nombre} - ${tipo.precio.toLocaleString()}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm resize-none"
                                    placeholder="Notas adicionales..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#293577] text-white px-4 py-2 rounded-lg hover:bg-[#181b49] text-sm"
                                >
                                    Crear Solicitud
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
