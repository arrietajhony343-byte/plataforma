import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

interface Boletin {
    id: number;
    estudiante: string;
    nivel: string;
    curso: string;
    periodo: string;
    promedio: number;
    estado: 'generado' | 'pendiente' | 'enviado';
    fecha_generacion: string | null;
}

interface ResumenNota {
    nivel: string;
    curso: string;
    promedio: number;
    aprobados: number;
    reprobados: number;
    mejorMateria: string;
    peorMateria: string;
}

// Estructura de niveles y cursos del colegio
const nivelesEducativos: Record<string, { label: string; color: string; cursos: string[] }> = {
    preescolar: {
        label: 'Pre-escolar',
        color: 'pink',
        cursos: ['Pre-Jardín', 'Jardín'],
    },
    transicion: {
        label: 'Transición',
        color: 'purple',
        cursos: ['Transición A', 'Transición B'],
    },
    primaria: {
        label: 'Primaria',
        color: 'blue',
        cursos: ['1°', '2°', '3°', '4°', '5°'],
    },
    bachillerato: {
        label: 'Bachillerato',
        color: 'emerald',
        cursos: ['6°', '7°', '8°', '9°', '10°', '11°'],
    },
};

const nivelesKeys = Object.keys(nivelesEducativos);

interface Props {
    boletines: Boletin[];
    resumenNotas: ResumenNota[];
}

export default function Boletines({ boletines, resumenNotas }: Props) {
    const [nivelSeleccionado, setNivelSeleccionado] = useState('todos');
    const [cursoSeleccionado, setCursoSeleccionado] = useState('todos');
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    const [vistaActiva, setVistaActiva] = useState<'boletines' | 'notas'>('boletines');

    // Cursos disponibles según nivel seleccionado
    const cursosDisponibles = useMemo(() => {
        if (nivelSeleccionado === 'todos') {
            return nivelesKeys.flatMap(k => nivelesEducativos[k].cursos);
        }
        return nivelesEducativos[nivelSeleccionado]?.cursos ?? [];
    }, [nivelSeleccionado]);

    // Filtrado de boletines
    const boletinesFiltrados = useMemo(() => {
        return boletines.filter(b => {
            const matchNivel = nivelSeleccionado === 'todos' || b.nivel === nivelSeleccionado;
            const matchCurso = cursoSeleccionado === 'todos' || b.curso === cursoSeleccionado;
            const matchPeriodo = periodoSeleccionado === 'todos' || b.periodo === periodoSeleccionado;
            const matchBusqueda = busqueda === '' || b.estudiante.toLowerCase().includes(busqueda.toLowerCase());
            return matchNivel && matchCurso && matchPeriodo && matchBusqueda;
        });
    }, [nivelSeleccionado, cursoSeleccionado, periodoSeleccionado, busqueda]);

    // Filtrado de resumen de notas
    const resumenFiltrado = useMemo(() => {
        return resumenNotas.filter(r => {
            const matchNivel = nivelSeleccionado === 'todos' || r.nivel === nivelSeleccionado;
            const matchCurso = cursoSeleccionado === 'todos' || r.curso === cursoSeleccionado;
            return matchNivel && matchCurso;
        });
    }, [nivelSeleccionado, cursoSeleccionado]);

    // Resetear curso al cambiar nivel
    const handleNivelChange = (nivel: string) => {
        setNivelSeleccionado(nivel);
        setCursoSeleccionado('todos');
    };

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'generado': return 'bg-green-100 text-green-800';
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'enviado': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPromedioColor = (promedio: number) => {
        if (promedio >= 4.0) return 'text-green-600';
        if (promedio >= 3.0) return 'text-yellow-600';
        return 'text-red-600';
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

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Boletines & Notas">
            <Head title="Boletines & Notas" />

            <div className="space-y-4 sm:space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Boletines & Notas</h1>
                        <p className="text-gray-600 text-sm sm:text-base">Gestiona boletines y visualiza información de notas</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                            Exportar Todo
                        </button>
                        <button className="flex items-center gap-2 bg-[#293577] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#181b49] text-sm">
                            Generar Masivo
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm p-1 inline-flex">
                    <button
                        onClick={() => setVistaActiva('boletines')}
                        className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm ${vistaActiva === 'boletines' ? 'bg-[#293577] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Boletines
                    </button>
                    <button
                        onClick={() => setVistaActiva('notas')}
                        className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm ${vistaActiva === 'notas' ? 'bg-[#293577] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Resumen Notas
                    </button>
                </div>

                {/* Filtros mejorados con niveles */}
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
                                Todos los niveles
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

                    {/* Fila 2: Curso, Periodo y Búsqueda */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-shrink-0">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Curso</label>
                            <select
                                value={cursoSeleccionado}
                                onChange={(e) => setCursoSeleccionado(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm min-w-[180px] focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="todos">Todos los cursos</option>
                                {cursosDisponibles.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-shrink-0">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Periodo</label>
                            <select
                                value={periodoSeleccionado}
                                onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm min-w-[170px] focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="todos">Todos los periodos</option>
                                <option value="1">1er Periodo</option>
                                <option value="2">2do Periodo</option>
                                <option value="3">3er Periodo</option>
                                <option value="4">4to Periodo</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Buscar</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800">
                                    <SearchIcon className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Buscar estudiante por nombre..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Resumen de filtro activo */}
                    {(nivelSeleccionado !== 'todos' || cursoSeleccionado !== 'todos' || periodoSeleccionado !== 'todos' || busqueda) && (
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
                            {periodoSeleccionado !== 'todos' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                    Per. {periodoSeleccionado}
                                    <button onClick={() => setPeriodoSeleccionado('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {busqueda && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                    "{busqueda}"
                                    <button onClick={() => setBusqueda('')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            <button
                                onClick={() => { handleNivelChange('todos'); setPeriodoSeleccionado('todos'); setBusqueda(''); }}
                                className="text-xs text-red-500 hover:text-red-700 font-medium ml-1"
                            >
                                Limpiar todo
                            </button>
                        </div>
                    )}
                </div>

                {vistaActiva === 'boletines' ? (
                    <>
                        {/* Stats de boletines filtrados */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4 text-center">
                                <p className="text-xl sm:text-2xl font-bold text-yellow-600">{boletinesFiltrados.filter(b => b.estado === 'pendiente').length}</p>
                                <p className="text-xs sm:text-sm text-yellow-700">Pendientes</p>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
                                <p className="text-xl sm:text-2xl font-bold text-green-600">{boletinesFiltrados.filter(b => b.estado === 'generado').length}</p>
                                <p className="text-xs sm:text-sm text-green-700">Generados</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 text-center">
                                <p className="text-xl sm:text-2xl font-bold text-blue-600">{boletinesFiltrados.filter(b => b.estado === 'enviado').length}</p>
                                <p className="text-xs sm:text-sm text-blue-700">Enviados</p>
                            </div>
                        </div>

                        {/* Tabla de boletines */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            {boletinesFiltrados.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-gray-500 font-medium">No se encontraron boletines</p>
                                    <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop */}
                                    <div className="overflow-x-auto hidden sm:block">
                                        <table className="w-full table-fixed min-w-[750px]">
                                            <colgroup>
                                                <col />
                                                <col className="w-[110px]" />
                                                <col className="w-[90px]" />
                                                <col className="w-[90px]" />
                                                <col className="w-[110px]" />
                                                <col className="w-[150px]" />
                                            </colgroup>
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Prom.</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {boletinesFiltrados.map((boletin) => (
                                                    <tr key={boletin.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="w-8 h-8 flex-shrink-0 bg-[#181b49] rounded-full flex items-center justify-center text-white text-sm">
                                                                    {boletin.estudiante.charAt(0)}
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-800 truncate">{boletin.estudiante}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getNivelBadge(boletin.nivel)}`}>
                                                                {getNivelLabel(boletin.nivel)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{boletin.curso}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`text-lg font-bold ${getPromedioColor(boletin.promedio)}`}>
                                                                {boletin.promedio.toFixed(1)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getEstadoBadge(boletin.estado)}`}>
                                                                {boletin.estado}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {boletin.estado === 'pendiente' && (
                                                                    <button className="text-[#293577] hover:text-[#181b49] text-sm font-medium">Generar</button>
                                                                )}
                                                                {boletin.estado === 'generado' && (
                                                                    <>
                                                                        <button className="text-green-600 hover:text-green-800 text-sm font-medium">PDF</button>
                                                                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Enviar</button>
                                                                    </>
                                                                )}
                                                                {boletin.estado === 'enviado' && (
                                                                    <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">Ver</button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Mobile Cards */}
                                    <div className="sm:hidden divide-y divide-gray-100">
                                        {boletinesFiltrados.map((boletin) => (
                                            <div key={boletin.id} className="p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-9 h-9 flex-shrink-0 bg-[#181b49] rounded-full flex items-center justify-center text-white text-sm font-bold">
                                                            {boletin.estudiante.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-800 truncate">{boletin.estudiante}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getNivelBadge(boletin.nivel)}`}>
                                                                    {getNivelLabel(boletin.nivel)}
                                                                </span>
                                                                <span className="text-xs text-gray-500">{boletin.curso}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <span className={`text-xl font-bold ${getPromedioColor(boletin.promedio)}`}>
                                                        {boletin.promedio.toFixed(1)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getEstadoBadge(boletin.estado)}`}>
                                                        {boletin.estado}
                                                    </span>
                                                    <div className="flex gap-3">
                                                        {boletin.estado === 'pendiente' && (
                                                            <button className="text-[#293577] text-xs font-medium">Generar</button>
                                                        )}
                                                        {boletin.estado === 'generado' && (
                                                            <>
                                                                <button className="text-green-600 text-xs font-medium">PDF</button>
                                                                <button className="text-blue-600 text-xs font-medium">Enviar</button>
                                                            </>
                                                        )}
                                                        {boletin.estado === 'enviado' && (
                                                            <button className="text-gray-600 text-xs font-medium">Ver</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Contador de resultados */}
                        <div className="text-center">
                            <p className="text-xs text-gray-400">
                                Mostrando {boletinesFiltrados.length} de {boletines.length} boletines
                            </p>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Resumen de notas por curso filtrado */}
                        {resumenFiltrado.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                                <p className="text-gray-500 font-medium">No hay resúmenes para los filtros seleccionados</p>
                                <p className="text-gray-400 text-sm mt-1">Ajusta el nivel o curso para ver resultados</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {resumenFiltrado.map((curso, idx) => (
                                    <div key={idx} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-[#181b49] rounded-xl flex items-center justify-center text-white font-bold text-sm">
                                                    {curso.curso}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-800">Curso {curso.curso}</h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getNivelBadge(curso.nivel)}`}>
                                                            {getNivelLabel(curso.nivel)}
                                                        </span>
                                                        <span className="text-sm text-gray-500">{curso.aprobados + curso.reprobados} estudiantes</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`text-3xl font-bold ${getPromedioColor(curso.promedio)}`}>
                                                {curso.promedio.toFixed(1)}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="bg-green-50 rounded-lg p-3 text-center">
                                                <p className="text-lg font-bold text-green-600">{curso.aprobados}</p>
                                                <p className="text-xs text-green-700">Aprobados</p>
                                            </div>
                                            <div className="bg-red-50 rounded-lg p-3 text-center">
                                                <p className="text-lg font-bold text-red-600">{curso.reprobados}</p>
                                                <p className="text-xs text-red-700">Reprobados</p>
                                            </div>
                                            <div className="bg-blue-50 rounded-lg p-3 text-center">
                                                <p className="text-sm font-medium text-blue-600">✓ {curso.mejorMateria}</p>
                                                <p className="text-xs text-blue-700">Mejor Materia</p>
                                            </div>
                                            <div className="bg-orange-50 rounded-lg p-3 text-center">
                                                <p className="text-sm font-medium text-orange-600">{curso.peorMateria}</p>
                                                <p className="text-xs text-orange-700">Necesita Atención</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </SidebarLayout>
    );
}
