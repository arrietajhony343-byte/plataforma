import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

// Ícono SVG de lupa negra reutilizable
const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

interface Estudiante {
    id: number;
    nombre: string;
    identificacion: string;
    nivel: string;
    grado: string;
    seccion: string;
    acudiente: string;
    telefono: string;
    email: string;
    estado: 'activo' | 'inactivo' | 'retirado';
    promedio: number;
    pagos: 'al_dia' | 'pendiente' | 'moroso';
    observaciones: number;
}

// Estructura de niveles educativos
const nivelesEducativos: Record<string, { label: string; grados: string[] }> = {
    preescolar: { label: 'Pre-escolar', grados: ['Pre-Jardín', 'Jardín'] },
    transicion: { label: 'Transición', grados: ['Transición'] },
    primaria: { label: 'Primaria', grados: ['1°', '2°', '3°', '4°', '5°'] },
    bachillerato: { label: 'Bachillerato', grados: ['6°', '7°', '8°', '9°', '10°', '11°'] },
};

const nivelesKeys = Object.keys(nivelesEducativos);

export default function Estudiantes() {
    const [busqueda, setBusqueda] = useState('');
    const [nivelSeleccionado, setNivelSeleccionado] = useState('todos');
    const [gradoSeleccionado, setGradoSeleccionado] = useState('todos');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [filtroPagos, setFiltroPagos] = useState('todos');
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Estudiante | null>(null);

    const estudiantes: Estudiante[] = [
        // Pre-escolar
        { id: 1, nombre: 'Valentina Torres Ruiz', identificacion: '1101234001', nivel: 'preescolar', grado: 'Pre-Jardín', seccion: 'A', acudiente: 'Claudia Ruiz', telefono: '3001111111', email: 'claudia@email.com', estado: 'activo', promedio: 4.6, pagos: 'al_dia', observaciones: 0 },
        { id: 2, nombre: 'Samuel Díaz Mora', identificacion: '1101234002', nivel: 'preescolar', grado: 'Jardín', seccion: 'A', acudiente: 'Andrea Mora', telefono: '3002222222', email: 'andrea@email.com', estado: 'activo', promedio: 4.3, pagos: 'al_dia', observaciones: 1 },
        // Transición
        { id: 3, nombre: 'Isabella Moreno Gil', identificacion: '1101234003', nivel: 'transicion', grado: 'Transición', seccion: 'A', acudiente: 'Laura Gil', telefono: '3003333333', email: 'laura@email.com', estado: 'activo', promedio: 4.4, pagos: 'al_dia', observaciones: 0 },
        { id: 4, nombre: 'Nicolás Castro Peña', identificacion: '1101234004', nivel: 'transicion', grado: 'Transición', seccion: 'B', acudiente: 'Marta Peña', telefono: '3004444444', email: 'marta@email.com', estado: 'activo', promedio: 3.9, pagos: 'pendiente', observaciones: 2 },
        // Primaria
        { id: 5, nombre: 'Juan Pérez García', identificacion: '1001234567', nivel: 'primaria', grado: '3°', seccion: 'A', acudiente: 'Pedro Pérez', telefono: '3001234567', email: 'padre@email.com', estado: 'activo', promedio: 4.2, pagos: 'al_dia', observaciones: 2 },
        { id: 6, nombre: 'María García López', identificacion: '1007654321', nivel: 'primaria', grado: '4°', seccion: 'A', acudiente: 'Ana López', telefono: '3109876543', email: 'madre@email.com', estado: 'activo', promedio: 4.5, pagos: 'al_dia', observaciones: 0 },
        { id: 7, nombre: 'Laura Jiménez Rojas', identificacion: '1008765432', nivel: 'primaria', grado: '5°', seccion: 'A', acudiente: 'Rosa Rojas', telefono: '3115551234', email: 'rosa@email.com', estado: 'activo', promedio: 4.6, pagos: 'al_dia', observaciones: 0 },
        { id: 8, nombre: 'Diego Ruiz Herrera', identificacion: '1009876543', nivel: 'primaria', grado: '1°', seccion: 'A', acudiente: 'Julia Herrera', telefono: '3126661234', email: 'julia@email.com', estado: 'activo', promedio: 3.5, pagos: 'pendiente', observaciones: 3 },
        // Bachillerato
        { id: 9, nombre: 'Carlos López Martínez', identificacion: '1002345678', nivel: 'bachillerato', grado: '7°', seccion: 'B', acudiente: 'Luis López', telefono: '3201234567', email: 'tutor@email.com', estado: 'activo', promedio: 3.8, pagos: 'pendiente', observaciones: 3 },
        { id: 10, nombre: 'Ana Martínez Rodríguez', identificacion: '1003456789', nivel: 'bachillerato', grado: '8°', seccion: 'A', acudiente: 'María Rodríguez', telefono: '3112345678', email: 'acudiente@email.com', estado: 'inactivo', promedio: 3.5, pagos: 'moroso', observaciones: 5 },
        { id: 11, nombre: 'Pedro Sánchez Díaz', identificacion: '1004567890', nivel: 'bachillerato', grado: '6°', seccion: 'B', acudiente: 'José Sánchez', telefono: '3003456789', email: 'padre2@email.com', estado: 'activo', promedio: 4.0, pagos: 'al_dia', observaciones: 1 },
        { id: 12, nombre: 'Sofía Rodríguez Castro', identificacion: '1005678901', nivel: 'bachillerato', grado: '9°', seccion: 'A', acudiente: 'Carmen Castro', telefono: '3154567890', email: 'madre2@email.com', estado: 'activo', promedio: 4.8, pagos: 'al_dia', observaciones: 0 },
        { id: 13, nombre: 'Luis Hernández Vargas', identificacion: '1006789012', nivel: 'bachillerato', grado: '7°', seccion: 'A', acudiente: 'Fernando Hernández', telefono: '3205678901', email: 'padre3@email.com', estado: 'retirado', promedio: 3.2, pagos: 'moroso', observaciones: 8 },
        { id: 14, nombre: 'Gabriela Ríos Luna', identificacion: '1007890123', nivel: 'bachillerato', grado: '11°', seccion: 'A', acudiente: 'Patricia Luna', telefono: '3216789012', email: 'patricia@email.com', estado: 'activo', promedio: 4.7, pagos: 'al_dia', observaciones: 0 },
        { id: 15, nombre: 'Andrés Medina Correa', identificacion: '1008901234', nivel: 'bachillerato', grado: '10°', seccion: 'A', acudiente: 'Jorge Medina', telefono: '3227890123', email: 'jorge@email.com', estado: 'activo', promedio: 3.2, pagos: 'moroso', observaciones: 4 },
    ];

    // Grados disponibles según nivel
    const gradosDisponibles = useMemo(() => {
        if (nivelSeleccionado === 'todos') {
            return nivelesKeys.flatMap(k => nivelesEducativos[k].grados);
        }
        return nivelesEducativos[nivelSeleccionado]?.grados ?? [];
    }, [nivelSeleccionado]);

    const handleNivelChange = (nivel: string) => {
        setNivelSeleccionado(nivel);
        setGradoSeleccionado('todos');
    };

    const filteredEstudiantes = useMemo(() => {
        return estudiantes.filter(est => {
            const matchBusqueda = busqueda === '' ||
                est.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                est.identificacion.includes(busqueda);
            const matchNivel = nivelSeleccionado === 'todos' || est.nivel === nivelSeleccionado;
            const matchGrado = gradoSeleccionado === 'todos' || est.grado === gradoSeleccionado;
            const matchEstado = filtroEstado === 'todos' || est.estado === filtroEstado;
            const matchPagos = filtroPagos === 'todos' || est.pagos === filtroPagos;
            return matchBusqueda && matchNivel && matchGrado && matchEstado && matchPagos;
        });
    }, [busqueda, nivelSeleccionado, gradoSeleccionado, filtroEstado, filtroPagos]);

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

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'activo': return 'bg-green-100 text-green-800';
            case 'inactivo': return 'bg-yellow-100 text-yellow-800';
            case 'retirado': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPagosBadge = (pagos: string) => {
        switch (pagos) {
            case 'al_dia': return 'bg-green-100 text-green-800';
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'moroso': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPromedioColor = (promedio: number) => {
        if (promedio >= 4.0) return 'text-green-600';
        if (promedio >= 3.0) return 'text-yellow-600';
        return 'text-red-600';
    };

    const hayFiltrosActivos = nivelSeleccionado !== 'todos' || gradoSeleccionado !== 'todos' || filtroEstado !== 'todos' || filtroPagos !== 'todos' || busqueda !== '';

    const limpiarFiltros = () => {
        setNivelSeleccionado('todos');
        setGradoSeleccionado('todos');
        setFiltroEstado('todos');
        setFiltroPagos('todos');
        setBusqueda('');
    };

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Buscar Estudiantes">
            <Head title="Buscar Estudiantes" />

            <div className="space-y-4 sm:space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                            <SearchIcon className="w-6 h-6 sm:w-7 sm:h-7" /> Buscar Estudiantes
                        </h1>
                        <p className="text-gray-600 text-sm sm:text-base">Encuentra y gestiona información de estudiantes</p>
                    </div>
                    <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                        📥 Exportar Lista
                    </button>
                </div>

                {/* Barra de búsqueda y filtros */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-4">
                    {/* Búsqueda principal con lupa SVG */}
                    <div className="flex-1 relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-800">
                            <SearchIcon className="w-5 h-5" />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o número de identificación..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-[#293577] text-sm"
                        />
                    </div>

                    {/* Nivel educativo como chips */}
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
                                🏫 Todos
                            </button>
                            <button
                                onClick={() => handleNivelChange('preescolar')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    nivelSeleccionado === 'preescolar'
                                        ? 'bg-pink-500 text-white shadow-md'
                                        : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                                }`}
                            >
                                🧒 Pre-escolar
                            </button>
                            <button
                                onClick={() => handleNivelChange('transicion')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    nivelSeleccionado === 'transicion'
                                        ? 'bg-purple-500 text-white shadow-md'
                                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                }`}
                            >
                                🎒 Transición
                            </button>
                            <button
                                onClick={() => handleNivelChange('primaria')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    nivelSeleccionado === 'primaria'
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                }`}
                            >
                                📚 Primaria
                            </button>
                            <button
                                onClick={() => handleNivelChange('bachillerato')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                    nivelSeleccionado === 'bachillerato'
                                        ? 'bg-emerald-500 text-white shadow-md'
                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                            >
                                🎓 Bachillerato
                            </button>
                        </div>
                    </div>

                    {/* Filtros secundarios */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Grado</label>
                            <select
                                value={gradoSeleccionado}
                                onChange={(e) => setGradoSeleccionado(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="todos">Todos los grados</option>
                                {gradosDisponibles.map(g => (
                                    <option key={g} value={g}>{g}</option>
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
                                <option value="activo">Activos</option>
                                <option value="inactivo">Inactivos</option>
                                <option value="retirado">Retirados</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pagos</label>
                            <select
                                value={filtroPagos}
                                onChange={(e) => setFiltroPagos(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="todos">Todos</option>
                                <option value="al_dia">Al día</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="moroso">Moroso</option>
                            </select>
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
                            {gradoSeleccionado !== 'todos' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                    {gradoSeleccionado}
                                    <button onClick={() => setGradoSeleccionado('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {filtroEstado !== 'todos' && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(filtroEstado)}`}>
                                    {filtroEstado}
                                    <button onClick={() => setFiltroEstado('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {filtroPagos !== 'todos' && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getPagosBadge(filtroPagos)}`}>
                                    {filtroPagos === 'al_dia' ? 'Al día' : filtroPagos}
                                    <button onClick={() => setFiltroPagos('todos')} className="ml-0.5 hover:opacity-70">×</button>
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

                    <p className="text-sm text-gray-500">
                        {filteredEstudiantes.length} de {estudiantes.length} estudiante(s) encontrado(s)
                    </p>
                </div>

                {/* Resultados */}
                {filteredEstudiantes.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <SearchIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-gray-600 font-medium">No se encontraron estudiantes</p>
                        <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filteredEstudiantes.map((estudiante) => (
                            <div
                                key={estudiante.id}
                                className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => setEstudianteSeleccionado(estudiante)}
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-[#181b49] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                                            {estudiante.nombre.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-800">{estudiante.nombre}</h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm text-gray-500">ID: {estudiante.identificacion}</p>
                                                <span className="text-gray-300">•</span>
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getNivelBadge(estudiante.nivel)}`}>
                                                    {getNivelLabel(estudiante.nivel)}
                                                </span>
                                                <span className="text-sm text-gray-500">{estudiante.grado} {estudiante.seccion}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getEstadoBadge(estudiante.estado)}`}>
                                            {estudiante.estado}
                                        </span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPagosBadge(estudiante.pagos)}`}>
                                            {estudiante.pagos === 'al_dia' ? '💰 Al día' : estudiante.pagos === 'pendiente' ? '⏳ Pendiente' : '⚠️ Moroso'}
                                        </span>
                                        <span className={`px-3 py-1 bg-gray-100 rounded-full text-xs font-bold ${getPromedioColor(estudiante.promedio)}`}>
                                            Prom: {estudiante.promedio.toFixed(1)}
                                        </span>
                                        {estudiante.observaciones > 0 && (
                                            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                                📝 {estudiante.observaciones} obs.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Detalle Estudiante */}
            {estudianteSeleccionado && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-[#181b49] rounded-full flex items-center justify-center text-white font-bold text-2xl">
                                    {estudianteSeleccionado.nombre.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{estudianteSeleccionado.nombre}</h2>
                                    <p className="text-gray-500">ID: {estudianteSeleccionado.identificacion}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEstudianteSeleccionado(null)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {/* Info del estudiante */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Nivel Educativo</p>
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getNivelBadge(estudianteSeleccionado.nivel)}`}>
                                        {getNivelLabel(estudianteSeleccionado.nivel)}
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Grado y Sección</p>
                                    <p className="font-medium text-gray-800">{estudianteSeleccionado.grado} {estudianteSeleccionado.seccion}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Estado</p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getEstadoBadge(estudianteSeleccionado.estado)}`}>
                                        {estudianteSeleccionado.estado}
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Promedio Actual</p>
                                    <p className={`text-2xl font-bold ${getPromedioColor(estudianteSeleccionado.promedio)}`}>
                                        {estudianteSeleccionado.promedio.toFixed(1)}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Acudiente</p>
                                    <p className="font-medium text-gray-800">{estudianteSeleccionado.acudiente}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Teléfono</p>
                                    <p className="font-medium text-gray-800">📞 {estudianteSeleccionado.telefono}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="font-medium text-gray-800 text-sm">✉️ {estudianteSeleccionado.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Acciones rápidas */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                            <button className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 text-center">
                                📊 Ver Notas
                            </button>
                            <button className="p-3 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 text-center">
                                📄 Boletín
                            </button>
                            <button className="p-3 bg-orange-50 text-orange-700 rounded-lg text-sm hover:bg-orange-100 text-center">
                                📝 Observador
                            </button>
                            <button className="p-3 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 text-center">
                                💰 Pagos
                            </button>
                        </div>

                        {/* Estado de pagos */}
                        <div className={`p-4 rounded-lg mb-4 ${estudianteSeleccionado.pagos === 'al_dia' ? 'bg-green-50' : estudianteSeleccionado.pagos === 'pendiente' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-800">Estado de Pagos</p>
                                    <p className="text-sm text-gray-600">
                                        {estudianteSeleccionado.pagos === 'al_dia' ? '✅ Todos los pagos al día' :
                                         estudianteSeleccionado.pagos === 'pendiente' ? '⏳ Tiene pagos pendientes' :
                                         '⚠️ Estudiante en mora'}
                                    </p>
                                </div>
                                <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getPagosBadge(estudianteSeleccionado.pagos)}`}>
                                    {estudianteSeleccionado.pagos === 'al_dia' ? 'Al Día' : estudianteSeleccionado.pagos === 'pendiente' ? 'Pendiente' : 'Moroso'}
                                </span>
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex flex-wrap gap-2">
                            <button className="flex-1 bg-[#293577] text-white py-2 rounded-lg text-sm hover:bg-[#181b49]">
                                ✏️ Editar Información
                            </button>
                            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                                📧 Enviar Mensaje
                            </button>
                            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">
                                🚫 Bloquear
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
