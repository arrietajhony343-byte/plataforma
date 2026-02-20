import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

// Ícono SVG de lupa
const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

// Estructura de niveles educativos
const nivelesEducativos: Record<string, { label: string; cursos: string[] }> = {
    preescolar: { label: 'Pre-escolar', cursos: ['Pre-Jardín', 'Jardín'] },
    transicion: { label: 'Transición', cursos: ['Transición A', 'Transición B'] },
    primaria: { label: 'Primaria', cursos: ['1°', '2°', '3°', '4°', '5°'] },
    bachillerato: { label: 'Bachillerato', cursos: ['6°', '7°', '8°', '9°', '10°', '11°'] },
};

const nivelesKeys = Object.keys(nivelesEducativos);

interface RendimientoRow {
    nivel: string;
    curso: string;
    promedio: number;
    aprobados: number;
    reprobados: number;
    mejorMateria: string;
    peorMateria: string;
}

export default function Reportes() {
    const [selectedReport, setSelectedReport] = useState('rendimiento');
    const [selectedPeriodo, setSelectedPeriodo] = useState('2');
    const [nivelSeleccionado, setNivelSeleccionado] = useState('todos');
    const [selectedCurso, setSelectedCurso] = useState('todos');

    const reportTypes = [
        { id: 'rendimiento', name: 'Rendimiento Académico', icon: '📊', description: 'Promedios y estadísticas por curso' },
        { id: 'asistencia', name: 'Asistencia', icon: '📋', description: 'Control de asistencia por periodo' },
        { id: 'observador', name: 'Observador', icon: '📝', description: 'Resumen de observaciones' },
        { id: 'boletines', name: 'Boletines', icon: '📄', description: 'Generación masiva de boletines' },
    ];

    const rendimientoData: RendimientoRow[] = [
        // Pre-escolar
        { nivel: 'preescolar', curso: 'Pre-Jardín', promedio: 4.5, aprobados: 18, reprobados: 0, mejorMateria: 'Motricidad', peorMateria: 'Lectoescritura' },
        { nivel: 'preescolar', curso: 'Jardín', promedio: 4.3, aprobados: 20, reprobados: 1, mejorMateria: 'Arte', peorMateria: 'Números' },
        // Transición
        { nivel: 'transicion', curso: 'Transición A', promedio: 4.1, aprobados: 22, reprobados: 2, mejorMateria: 'Ciencias', peorMateria: 'Lectura' },
        { nivel: 'transicion', curso: 'Transición B', promedio: 3.9, aprobados: 20, reprobados: 3, mejorMateria: 'Sociales', peorMateria: 'Matemáticas' },
        // Primaria
        { nivel: 'primaria', curso: '1°', promedio: 4.0, aprobados: 25, reprobados: 2, mejorMateria: 'Español', peorMateria: 'Matemáticas' },
        { nivel: 'primaria', curso: '2°', promedio: 3.8, aprobados: 24, reprobados: 3, mejorMateria: 'Ciencias', peorMateria: 'Inglés' },
        { nivel: 'primaria', curso: '3°', promedio: 4.2, aprobados: 28, reprobados: 2, mejorMateria: 'Español', peorMateria: 'Matemáticas' },
        { nivel: 'primaria', curso: '4°', promedio: 3.9, aprobados: 26, reprobados: 3, mejorMateria: 'Historia', peorMateria: 'Inglés' },
        { nivel: 'primaria', curso: '5°', promedio: 4.1, aprobados: 27, reprobados: 2, mejorMateria: 'Ciencias', peorMateria: 'Matemáticas' },
        // Bachillerato
        { nivel: 'bachillerato', curso: '6° A', promedio: 4.2, aprobados: 30, reprobados: 2, mejorMateria: 'Ciencias', peorMateria: 'Matemáticas' },
        { nivel: 'bachillerato', curso: '6° B', promedio: 3.9, aprobados: 27, reprobados: 3, mejorMateria: 'Historia', peorMateria: 'Inglés' },
        { nivel: 'bachillerato', curso: '7° A', promedio: 4.0, aprobados: 26, reprobados: 2, mejorMateria: 'Español', peorMateria: 'Física' },
        { nivel: 'bachillerato', curso: '8° A', promedio: 3.8, aprobados: 32, reprobados: 3, mejorMateria: 'Biología', peorMateria: 'Química' },
        { nivel: 'bachillerato', curso: '9° A', promedio: 4.0, aprobados: 25, reprobados: 2, mejorMateria: 'Ed. Física', peorMateria: 'Trigonometría' },
        { nivel: 'bachillerato', curso: '10°', promedio: 3.6, aprobados: 22, reprobados: 5, mejorMateria: 'Filosofía', peorMateria: 'Cálculo' },
        { nivel: 'bachillerato', curso: '11°', promedio: 4.1, aprobados: 28, reprobados: 2, mejorMateria: 'Lectura Crítica', peorMateria: 'Química' },
    ];

    // Cursos disponibles según nivel
    const cursosDisponibles = useMemo(() => {
        if (nivelSeleccionado === 'todos') {
            return nivelesKeys.flatMap(k => nivelesEducativos[k].cursos);
        }
        return nivelesEducativos[nivelSeleccionado]?.cursos ?? [];
    }, [nivelSeleccionado]);

    const handleNivelChange = (nivel: string) => {
        setNivelSeleccionado(nivel);
        setSelectedCurso('todos');
    };

    // Filtrar datos de rendimiento
    const rendimientoFiltrado = useMemo(() => {
        return rendimientoData.filter(r => {
            const matchNivel = nivelSeleccionado === 'todos' || r.nivel === nivelSeleccionado;
            const matchCurso = selectedCurso === 'todos' || r.curso === selectedCurso;
            return matchNivel && matchCurso;
        });
    }, [nivelSeleccionado, selectedCurso]);

    // Stats calculados del filtrado
    const statsGenerales = useMemo(() => {
        const totalAprobados = rendimientoFiltrado.reduce((s, r) => s + r.aprobados, 0);
        const totalReprobados = rendimientoFiltrado.reduce((s, r) => s + r.reprobados, 0);
        const total = totalAprobados + totalReprobados;
        const promedioGeneral = rendimientoFiltrado.length > 0
            ? rendimientoFiltrado.reduce((s, r) => s + r.promedio, 0) / rendimientoFiltrado.length
            : 0;
        const tasaAprobacion = total > 0 ? Math.round((totalAprobados / total) * 100) : 0;
        return { promedioGeneral, tasaAprobacion, totalEstudiantes: total, totalCursos: rendimientoFiltrado.length };
    }, [rendimientoFiltrado]);

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

    const getPeriodoLabel = (p: string) => {
        switch (p) {
            case '1': return 'Primer Periodo';
            case '2': return 'Segundo Periodo';
            case '3': return 'Tercer Periodo';
            case '4': return 'Cuarto Periodo';
            default: return '';
        }
    };

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Reportes Globales">
            <Head title="Reportes" />

            <div className="space-y-4 sm:space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Reportes Globales</h1>
                        <p className="text-gray-600">Genera y descarga reportes institucionales</p>
                    </div>
                    <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        📥 Exportar a Excel
                    </button>
                </div>

                {/* Tipos de reporte */}
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {reportTypes.map((report) => (
                        <button
                            key={report.id}
                            onClick={() => setSelectedReport(report.id)}
                            className={`p-3 sm:p-4 rounded-xl text-left transition-all ${
                                selectedReport === report.id
                                    ? 'bg-[#293577] text-white shadow-lg'
                                    : 'bg-white text-gray-800 shadow-sm hover:shadow-md'
                            }`}
                        >
                            <span className="text-xl sm:text-2xl">{report.icon}</span>
                            <h3 className="font-bold mt-2 text-sm sm:text-base">{report.name}</h3>
                            <p className={`text-xs sm:text-sm mt-1 ${selectedReport === report.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                {report.description}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Filtros mejorados con niveles */}
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
                    {/* Nivel educativo chips */}
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
                                🏫 Todos los niveles
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

                    {/* Periodo, Curso y botón */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Periodo</label>
                            <select
                                value={selectedPeriodo}
                                onChange={(e) => setSelectedPeriodo(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="1">Primer Periodo</option>
                                <option value="2">Segundo Periodo (Actual)</option>
                                <option value="3">Tercer Periodo</option>
                                <option value="4">Cuarto Periodo</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Curso</label>
                            <select
                                value={selectedCurso}
                                onChange={(e) => setSelectedCurso(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="todos">Todos los cursos</option>
                                {cursosDisponibles.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button className="flex items-center gap-2 bg-[#293577] text-white px-6 py-2 rounded-lg hover:bg-[#181b49] text-sm font-medium">
                                <SearchIcon className="w-4 h-4" /> Generar Reporte
                            </button>
                        </div>
                    </div>

                    {/* Filtros activos */}
                    {(nivelSeleccionado !== 'todos' || selectedCurso !== 'todos') && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="text-xs text-gray-500">Filtros activos:</span>
                            {nivelSeleccionado !== 'todos' && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getNivelBadge(nivelSeleccionado)}`}>
                                    {getNivelLabel(nivelSeleccionado)}
                                    <button onClick={() => handleNivelChange('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {selectedCurso !== 'todos' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                    {selectedCurso}
                                    <button onClick={() => setSelectedCurso('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            <button
                                onClick={() => { handleNivelChange('todos'); }}
                                className="text-xs text-red-500 hover:text-red-700 font-medium ml-1"
                            >
                                Limpiar todo
                            </button>
                        </div>
                    )}
                </div>

                {/* Contenido del reporte */}
                {selectedReport === 'rendimiento' && (
                    <div className="space-y-6">
                        {/* Estadísticas generales dinámicas */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <p className="text-3xl font-bold text-[#181b49]">{statsGenerales.promedioGeneral.toFixed(1)}</p>
                                <p className="text-gray-600 text-sm">Promedio General</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <p className="text-3xl font-bold text-green-600">{statsGenerales.tasaAprobacion}%</p>
                                <p className="text-gray-600 text-sm">Tasa de Aprobación</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <p className="text-3xl font-bold text-[#293577]">{statsGenerales.totalEstudiantes}</p>
                                <p className="text-gray-600 text-sm">Estudiantes Evaluados</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <p className="text-3xl font-bold text-purple-600">{statsGenerales.totalCursos}</p>
                                <p className="text-gray-600 text-sm">Cursos Activos</p>
                            </div>
                        </div>

                        {/* Tabla de rendimiento */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="p-4 border-b">
                                <h2 className="font-bold text-gray-800 text-sm sm:text-base" style={{ fontFamily: "'Inter', sans-serif" }}>
                                    📊 Rendimiento por Curso - {getPeriodoLabel(selectedPeriodo)}
                                    {nivelSeleccionado !== 'todos' && (
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-medium ${getNivelBadge(nivelSeleccionado)}`}>
                                            {getNivelLabel(nivelSeleccionado)}
                                        </span>
                                    )}
                                </h2>
                            </div>
                            {rendimientoFiltrado.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-4xl mb-3">📊</p>
                                    <p className="text-gray-500 font-medium">No hay datos para los filtros seleccionados</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full table-fixed min-w-[700px]">
                                        <colgroup>
                                            <col className="w-[100px]" />
                                            <col className="w-[95px]" />
                                            <col className="w-[90px]" />
                                            <col className="w-[100px]" />
                                            <col className="w-[105px]" />
                                            <col />
                                            <col />
                                        </colgroup>
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Prom.</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aprobados</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reprobados</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mejor Materia</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atención Requerida</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {rendimientoFiltrado.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4">
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getNivelBadge(row.nivel)}`}>
                                                            {getNivelLabel(row.nivel)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="font-medium text-gray-800 whitespace-nowrap">{row.curso}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                            row.promedio >= 4.0 ? 'bg-green-100 text-green-800' :
                                                            row.promedio >= 3.5 ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                            {row.promedio.toFixed(1)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-green-600 font-medium">{row.aprobados}</td>
                                                    <td className="px-4 py-4 text-center text-red-600 font-medium">{row.reprobados}</td>
                                                    <td className="px-4 py-4">
                                                        <span className="text-green-600 truncate">✓ {row.mejorMateria}</span>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <span className="text-orange-600 truncate">⚠️ {row.peorMateria}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Acciones de reporte */}
                        <div className="flex flex-wrap gap-4">
                            <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">
                                📄 Exportar PDF
                            </button>
                            <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                                📊 Exportar Excel
                            </button>
                            <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
                                🖨️ Imprimir
                            </button>
                            <button className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm">
                                📧 Enviar por Email
                            </button>
                        </div>
                    </div>
                )}

                {selectedReport === 'boletines' && (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="font-bold text-gray-800 mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>📄 Generación Masiva de Boletines</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-blue-800">
                                    <strong>Nota:</strong> Se generarán boletines para todos los estudiantes del periodo y curso seleccionados.
                                </p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                        <option>PDF Individual</option>
                                        <option>PDF Consolidado</option>
                                        <option>Excel</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Incluir</label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" defaultChecked className="rounded" /> Notas por materia
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" defaultChecked className="rounded" /> Observaciones
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" className="rounded" /> Gráficos de progreso
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full bg-[#293577] text-white py-3 rounded-lg hover:bg-[#181b49] font-medium">
                                🚀 Generar 125 Boletines
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}
