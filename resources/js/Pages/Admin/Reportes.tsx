import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import React, { useState, useMemo, useEffect } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';
import * as XLSX from 'xlsx';

/* ═══════════════════════════ TYPES ═══════════════════════════ */
interface Periodo {
    id: number;
    nombre: string;
    numero: number;
    activo: boolean;
    estado: string;
}

interface CursoItem {
    id: number;
    nombre: string;
    nivel: string;
    grado: string;
}

interface RendimientoRow {
    id: number;
    nivel: string;
    curso: string;
    promedio: number;
    aprobados: number;
    reprobados: number;
    totalEstud: number;
    mejorMateria: string;
    peorMateria: string;
}

interface ComentariosData {
    total: number;
    positivas: number;
    negativas: number;
    neutras: number;
    topNegativos: { nombre: string; total: number }[];
    categorias: { categoria: string; total: number }[];
}

interface AsistenciaData {
    porCurso: { curso: string; nivel: string; totalEstudiantes: number; promedioAsist: number; inasistencias: number; tardanzas: number }[];
    promedioGeneral: number;
    totalInasistencias: number;
    totalTardanzas: number;
    mensaje: string;
}

interface Props {
    periodos: Periodo[];
    periodoActualId: number | null;
    cursos: CursoItem[];
    anioVigente: number;
}

/* ═══════════════════════════ HELPERS ═══════════════════════════ */
const nivelesConfig: Record<string, { label: string; color: string; colorChip: string }> = {
    preescolar:  { label: 'Pre-escolar',  color: 'bg-pink-100 text-pink-700',    colorChip: 'bg-pink-500' },
    transicion:  { label: 'Transición',   color: 'bg-purple-100 text-purple-700', colorChip: 'bg-purple-500' },
    primaria:    { label: 'Primaria',     color: 'bg-blue-100 text-blue-700',    colorChip: 'bg-blue-500' },
    secundaria:  { label: 'Secundaria',   color: 'bg-cyan-100 text-cyan-700',    colorChip: 'bg-cyan-500' },
    media:       { label: 'Media',        color: 'bg-amber-100 text-amber-700',  colorChip: 'bg-amber-500' },
    bachillerato:{ label: 'Bachillerato', color: 'bg-emerald-100 text-emerald-700', colorChip: 'bg-emerald-500' },
};

const getNivelBadge = (nivel: string) => nivelesConfig[nivel]?.color ?? 'bg-gray-100 text-gray-700';
const getNivelLabel = (nivel: string) => nivelesConfig[nivel]?.label ?? nivel;
const getNivelChipColor = (nivel: string) => nivelesConfig[nivel]?.colorChip ?? 'bg-gray-500';

/* ═══════════════════════════ COMPONENT ═══════════════════════════ */
export default function Reportes({ periodos, periodoActualId, cursos, anioVigente }: Props) {
    // ── State ──
    const [selectedReport, setSelectedReport] = useState<'rendimiento' | 'asistencia' | 'comentarios'>('rendimiento');
    const [selectedPeriodo, setSelectedPeriodo] = useState<string>(periodoActualId?.toString() ?? '');
    const [nivelSeleccionado, setNivelSeleccionado] = useState('todos');
    const [selectedCurso, setSelectedCurso] = useState<string>('todos');

    // Data states
    const [loading, setLoading] = useState(false);
    const [rendimiento, setRendimiento] = useState<RendimientoRow[]>([]);
    const [rendimientoStats, setRendimientoStats] = useState({ promedioGeneral: 0, tasaAprobacion: 100, totalEstudiantes: 0, totalCursos: 0 });
    const [comentarios, setComentarios] = useState<ComentariosData | null>(null);
    const [asistencia, setAsistencia] = useState<AsistenciaData | null>(null);

    // Report types
    const reportTypes = [
        { id: 'rendimiento' as const, name: 'Rendimiento Académico', description: 'Promedios y estadísticas por curso' },
        { id: 'asistencia' as const, name: 'Asistencia', description: 'Control de asistencia por periodo' },
        { id: 'comentarios' as const, name: 'Comentarios', description: 'Resumen de observaciones' },
    ];

    const reportIcons: Record<string, React.ReactNode> = {
        rendimiento: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
        ),
        asistencia: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" />
            </svg>
        ),
        comentarios: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
        ),
    };

    // Cursos filtrados por nivel
    const cursosDisponibles = useMemo(() => {
        if (nivelSeleccionado === 'todos') return cursos;
        return cursos.filter(c => c.nivel === nivelSeleccionado);
    }, [cursos, nivelSeleccionado]);

    // Niveles únicos de los cursos
    const nivelesDisponibles = useMemo(() => {
        const unique = [...new Set(cursos.map(c => c.nivel))];
        return unique.sort((a, b) => {
            const order = ['preescolar', 'transicion', 'primaria', 'secundaria', 'media', 'bachillerato'];
            return order.indexOf(a) - order.indexOf(b);
        });
    }, [cursos]);

    // Periodo seleccionado info
    const periodoInfo = useMemo(() => {
        return periodos.find(p => p.id.toString() === selectedPeriodo);
    }, [periodos, selectedPeriodo]);

    // ── Data fetching ──
    const fetchRendimiento = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedPeriodo) params.append('periodo_id', selectedPeriodo);
            if (nivelSeleccionado !== 'todos') params.append('nivel', nivelSeleccionado);
            if (selectedCurso !== 'todos') params.append('curso_id', selectedCurso);

            const response = await fetch(`/admin/reportes/rendimiento?${params.toString()}`);
            const data = await response.json();

            setRendimiento(data.rendimiento);
            setRendimientoStats(data.stats);
        } catch (error) {
            console.error('Error fetching rendimiento:', error);
        }
        setLoading(false);
    };

    const fetchComentarios = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedPeriodo) params.append('periodo_id', selectedPeriodo);
            if (selectedCurso !== 'todos') params.append('curso_id', selectedCurso);

            const response = await fetch(`/admin/reportes/comentarios?${params.toString()}`);
            const data = await response.json();
            setComentarios(data);
        } catch (error) {
            console.error('Error fetching comentarios:', error);
        }
        setLoading(false);
    };

    const fetchAsistencia = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedPeriodo) params.append('periodo_id', selectedPeriodo);
            if (selectedCurso !== 'todos') params.append('curso_id', selectedCurso);

            const response = await fetch(`/admin/reportes/asistencia?${params.toString()}`);
            const data = await response.json();
            setAsistencia(data);
        } catch (error) {
            console.error('Error fetching asistencia:', error);
        }
        setLoading(false);
    };

    // Auto-fetch al cambiar filtros o tipo de reporte
    useEffect(() => {
        if (selectedReport === 'rendimiento') fetchRendimiento();
        else if (selectedReport === 'comentarios') fetchComentarios();
        else if (selectedReport === 'asistencia') fetchAsistencia();
    }, [selectedPeriodo, nivelSeleccionado, selectedCurso, selectedReport]);

    const handleGenerarReporte = () => {
        if (selectedReport === 'rendimiento') fetchRendimiento();
        else if (selectedReport === 'comentarios') fetchComentarios();
        else if (selectedReport === 'asistencia') fetchAsistencia();
    };

    const handleNivelChange = (nivel: string) => {
        setNivelSeleccionado(nivel);
        setSelectedCurso('todos');
    };

    // ── Export to Excel ──
    const handleExportExcel = () => {
        let data: Record<string, unknown>[] = [];
        let sheetName = 'Reporte';

        if (selectedReport === 'rendimiento') {
            data = rendimiento.map(r => ({
                'Nivel': getNivelLabel(r.nivel),
                'Curso': r.curso,
                'Promedio': r.promedio,
                'Aprobados': r.aprobados,
                'Reprobados': r.reprobados,
                'Total Estudiantes': r.totalEstud,
                'Mejor Materia': r.mejorMateria,
                'Atención Requerida': r.peorMateria,
            }));
            sheetName = 'Rendimiento';
        } else if (selectedReport === 'comentarios' && comentarios) {
            data = [
                { 'Métrica': 'Total Comentarios', 'Valor': comentarios.total },
                { 'Métrica': 'Positivos', 'Valor': comentarios.positivas },
                { 'Métrica': 'Negativos', 'Valor': comentarios.negativas },
                { 'Métrica': 'Neutros', 'Valor': comentarios.neutras },
            ];
            sheetName = 'Comentarios';
        } else if (selectedReport === 'asistencia' && asistencia) {
            data = asistencia.porCurso.map(a => ({
                'Curso': a.curso,
                'Nivel': getNivelLabel(a.nivel),
                'Estudiantes': a.totalEstudiantes,
                '% Asistencia': a.promedioAsist,
                'Inasistencias': a.inasistencias,
                'Tardanzas': a.tardanzas,
            }));
            sheetName = 'Asistencia';
        }

        if (data.length === 0) {
            alert('No hay datos para exportar. Genera primero el reporte.');
            return;
        }

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        const periodo = periodoInfo?.nombre ?? 'Todos';
        const nivel = nivelSeleccionado === 'todos' ? 'Todos' : getNivelLabel(nivelSeleccionado);
        const fileName = `Reporte_${sheetName}_${periodo.replace(/\s/g, '_')}_${nivel}.xlsx`;

        XLSX.writeFile(wb, fileName);
    };

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Reportes Globales">
            <Head title="Reportes Globales" />

            <div className="space-y-4 sm:space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Reportes Globales</h1>
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">{anioVigente}</span>
                        </div>
                        <p className="text-gray-600 text-sm">Genera y descarga reportes institucionales</p>
                    </div>
                    <button
                        onClick={handleExportExcel}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                        Exportar a Excel
                    </button>
                </div>

                {/* Tipos de reporte */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {reportTypes.map((report) => (
                        <button
                            key={report.id}
                            onClick={() => setSelectedReport(report.id)}
                            className={`p-4 sm:p-5 rounded-xl text-left transition-all flex items-start gap-4 ${
                                selectedReport === report.id
                                    ? 'bg-gradient-to-br from-[#293577] to-[#181b49] text-white shadow-lg shadow-[#293577]/30'
                                    : 'bg-white text-gray-800 shadow-sm hover:shadow-md border border-gray-100 hover:border-[#293577]/30'
                            }`}
                        >
                            <span className={`flex-shrink-0 p-2.5 rounded-lg ${selectedReport === report.id ? 'bg-white/15' : 'bg-[#293577]/10'}`}>
                                <span className={selectedReport === report.id ? 'text-white' : 'text-[#293577]'}>
                                    {reportIcons[report.id]}
                                </span>
                            </span>
                            <div>
                                <h3 className="font-bold text-sm sm:text-base">{report.name}</h3>
                                <p className={`text-xs sm:text-sm mt-0.5 ${selectedReport === report.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {report.description}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-4 border border-gray-100">
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
                                Todos los niveles
                            </button>
                            {nivelesDisponibles.map(nivel => (
                                <button
                                    key={nivel}
                                    onClick={() => handleNivelChange(nivel)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                        nivelSeleccionado === nivel
                                            ? `${getNivelChipColor(nivel)} text-white shadow-md`
                                            : `${getNivelBadge(nivel)} hover:opacity-80`
                                    }`}
                                >
                                    {getNivelLabel(nivel)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Periodo, Curso y botón */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Periodo</label>
                            <select
                                value={selectedPeriodo}
                                onChange={(e) => setSelectedPeriodo(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="">Todos los periodos</option>
                                {periodos.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre} {p.activo ? '(Actual)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Curso</label>
                            <select
                                value={selectedCurso}
                                onChange={(e) => setSelectedCurso(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="todos">Todos los cursos</option>
                                {cursosDisponibles.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={handleGenerarReporte}
                                disabled={loading}
                                className="flex items-center gap-2 bg-[#293577] text-white px-6 py-2 rounded-lg hover:bg-[#181b49] text-sm font-medium disabled:opacity-50 transition-all"
                            >
                                {loading ? (
                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                                )}
                                Generar Reporte
                            </button>
                        </div>
                    </div>

                    {/* Filtros activos */}
                    {(nivelSeleccionado !== 'todos' || selectedCurso !== 'todos' || selectedPeriodo) && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="text-xs text-gray-500">Filtros activos:</span>
                            {selectedPeriodo && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                    {periodoInfo?.nombre}
                                    <button onClick={() => setSelectedPeriodo('')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {nivelSeleccionado !== 'todos' && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getNivelBadge(nivelSeleccionado)}`}>
                                    {getNivelLabel(nivelSeleccionado)}
                                    <button onClick={() => handleNivelChange('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {selectedCurso !== 'todos' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                    {cursos.find(c => c.id.toString() === selectedCurso)?.nombre}
                                    <button onClick={() => setSelectedCurso('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            <button
                                onClick={() => { handleNivelChange('todos'); setSelectedPeriodo(''); }}
                                className="text-xs text-red-500 hover:text-red-700 font-medium ml-1"
                            >
                                Limpiar todo
                            </button>
                        </div>
                    )}
                </div>

                {/* ═══════════════════════════ RENDIMIENTO ═══════════════════════════ */}
                {selectedReport === 'rendimiento' && (
                    <div className="space-y-6">
                        {/* Stats generales */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
                                <p className={`text-3xl font-bold ${rendimientoStats.promedioGeneral >= 3.5 ? 'text-[#181b49]' : 'text-orange-600'}`}>
                                    {rendimientoStats.promedioGeneral.toFixed(1)}
                                </p>
                                <p className="text-gray-600 text-sm">Promedio General</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
                                <p className={`text-3xl font-bold ${rendimientoStats.tasaAprobacion >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                                    {rendimientoStats.tasaAprobacion}%
                                </p>
                                <p className="text-gray-600 text-sm">Tasa de Aprobación</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
                                <p className="text-3xl font-bold text-[#293577]">{rendimientoStats.totalEstudiantes}</p>
                                <p className="text-gray-600 text-sm">Estudiantes Evaluados</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
                                <p className="text-3xl font-bold text-purple-600">{rendimientoStats.totalCursos}</p>
                                <p className="text-gray-600 text-sm">Cursos Activos</p>
                            </div>
                        </div>

                        {/* Tabla de rendimiento */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                <h2 className="font-bold text-gray-800 text-sm sm:text-base" style={{ fontFamily: "'Inter', sans-serif" }}>
                                    Rendimiento por Curso
                                    {periodoInfo && (
                                        <span className="ml-2 text-gray-500 font-normal">— {periodoInfo.nombre}</span>
                                    )}
                                </h2>
                                {loading && (
                                    <svg className="w-5 h-5 animate-spin text-[#293577]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                )}
                            </div>
                            {rendimiento.length === 0 ? (
                                <div className="p-12 text-center">
                                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
                                    <p className="text-gray-500 font-medium">No hay datos para los filtros seleccionados</p>
                                    <p className="text-gray-400 text-sm mt-1">Intenta cambiar los filtros o generar el reporte</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[700px]">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nivel</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Curso</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Prom.</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Aprobados</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Reprobados</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Mejor Materia</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Atención Requerida</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {rendimiento.map((row) => (
                                                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getNivelBadge(row.nivel)}`}>
                                                            {getNivelLabel(row.nivel)}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="font-semibold text-gray-800 whitespace-nowrap">{row.curso}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center justify-center min-w-[40px] px-2 py-1 rounded-full text-sm font-bold ${
                                                            row.promedio >= 4.0 ? 'bg-green-100 text-green-700' :
                                                            row.promedio >= 3.0 ? 'bg-yellow-100 text-yellow-700' :
                                                            row.promedio > 0 ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-400'
                                                        }`}>
                                                            {row.promedio > 0 ? row.promedio.toFixed(1) : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-green-600 font-semibold">{row.aprobados}</td>
                                                    <td className="px-4 py-3 text-center text-red-600 font-semibold">{row.reprobados}</td>
                                                    <td className="px-4 py-3">
                                                        {row.mejorMateria !== '-' ? (
                                                            <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" /></svg>
                                                                {row.mejorMateria}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {row.peorMateria !== '-' ? (
                                                            <span className="inline-flex items-center gap-1 text-orange-600 text-sm">
                                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
                                                                {row.peorMateria}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════ ASISTENCIA ═══════════════════════════ */}
                {selectedReport === 'asistencia' && (
                    <div className="space-y-6">
                        {!asistencia ? (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                                <h3 className="text-lg font-bold text-gray-700 mb-2">Control de Asistencia</h3>
                                <p className="text-gray-500 mb-4">Haz clic en "Generar Reporte" para cargar los datos de asistencia</p>
                                <button
                                    onClick={fetchAsistencia}
                                    className="inline-flex items-center gap-2 bg-[#293577] text-white px-6 py-2.5 rounded-lg hover:bg-[#181b49] text-sm font-medium"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                    Cargar datos
                                </button>
                            </div>
                        ) : (
                            <>
                                {asistencia.mensaje && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
                                        <div>
                                            <p className="text-amber-800 font-medium">Módulo en desarrollo</p>
                                            <p className="text-amber-700 text-sm mt-1">{asistencia.mensaje}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                                    <div className="p-4 border-b border-gray-100">
                                        <h2 className="font-bold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Resumen de Asistencia por Curso</h2>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[600px]">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Curso</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nivel</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Estudiantes</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">% Asistencia</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Inasistencias</th>
                                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Tardanzas</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {asistencia.porCurso.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-gray-50/50">
                                                        <td className="px-4 py-3 font-semibold text-gray-800">{row.curso}</td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getNivelBadge(row.nivel)}`}>
                                                                {getNivelLabel(row.nivel)}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-gray-700">{row.totalEstudiantes}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-gray-400">—</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-gray-400">—</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className="text-gray-400">—</span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════ COMENTARIOS ═══════════════════════════ */}
                {selectedReport === 'comentarios' && (
                    <div className="space-y-6">
                        {loading && !comentarios ? (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                                <svg className="w-8 h-8 animate-spin mx-auto text-[#293577]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                <p className="text-gray-400 mt-3 text-sm">Cargando comentarios...</p>
                            </div>
                        ) : !comentarios ? (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
                                <h3 className="text-lg font-bold text-gray-700 mb-1">Comentarios del Observador</h3>
                                <p className="text-gray-400 text-sm">Selecciona los filtros y espera la carga automática</p>
                            </div>
                        ) : comentarios.total === 0 ? (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-10 text-center">
                                <svg className="w-14 h-14 mx-auto text-green-400 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                <p className="text-green-800 font-semibold text-lg">Sin observaciones registradas</p>
                                <p className="text-green-600 text-sm mt-1">No hay comentarios para los filtros seleccionados</p>
                            </div>
                        ) : (
                            <>
                                {/* ── Fila superior: Termómetro de sentimiento + Totales ── */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Termómetro de sentimiento */}
                                    <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                                        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <svg className="w-4 h-4 text-[#293577]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
                                            Distribución de Sentimiento
                                        </h3>
                                        {/* Barra segmentada */}
                                        <div className="flex rounded-full overflow-hidden h-8 mb-3 gap-0.5">
                                            {comentarios.positivas > 0 && (
                                                <div
                                                    className="bg-emerald-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-700"
                                                    style={{ width: `${Math.round((comentarios.positivas / comentarios.total) * 100)}%` }}
                                                >
                                                    {Math.round((comentarios.positivas / comentarios.total) * 100) > 10 && `${Math.round((comentarios.positivas / comentarios.total) * 100)}%`}
                                                </div>
                                            )}
                                            {comentarios.neutras > 0 && (
                                                <div
                                                    className="bg-slate-400 flex items-center justify-center text-white text-xs font-bold transition-all duration-700"
                                                    style={{ width: `${Math.round((comentarios.neutras / comentarios.total) * 100)}%` }}
                                                >
                                                    {Math.round((comentarios.neutras / comentarios.total) * 100) > 10 && `${Math.round((comentarios.neutras / comentarios.total) * 100)}%`}
                                                </div>
                                            )}
                                            {comentarios.negativas > 0 && (
                                                <div
                                                    className="bg-rose-500 flex items-center justify-center text-white text-xs font-bold transition-all duration-700"
                                                    style={{ width: `${Math.round((comentarios.negativas / comentarios.total) * 100)}%` }}
                                                >
                                                    {Math.round((comentarios.negativas / comentarios.total) * 100) > 10 && `${Math.round((comentarios.negativas / comentarios.total) * 100)}%`}
                                                </div>
                                            )}
                                        </div>
                                        {/* Leyenda */}
                                        <div className="flex flex-wrap gap-4 mt-4">
                                            {[
                                                { label: 'Positivas', count: comentarios.positivas, dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
                                                { label: 'Neutras', count: comentarios.neutras, dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-50' },
                                                { label: 'Negativas', count: comentarios.negativas, dot: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
                                            ].map(item => (
                                                <div key={item.label} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${item.bg}`}>
                                                    <span className={`w-3 h-3 rounded-full ${item.dot}`} />
                                                    <span className={`text-sm font-semibold ${item.text}`}>{item.count}</span>
                                                    <span className="text-xs text-gray-500">{item.label}</span>
                                                    <span className={`text-xs font-bold ${item.text}`}>
                                                        {comentarios.total > 0 ? `(${Math.round((item.count / comentarios.total) * 100)}%)` : ''}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Total grande */}
                                    <div className="bg-gradient-to-br from-[#293577] to-[#181b49] rounded-xl shadow-sm p-5 text-white flex flex-col items-center justify-center">
                                        <svg className="w-10 h-10 text-white/40 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>
                                        <p className="text-5xl font-black">{comentarios.total}</p>
                                        <p className="text-blue-200 text-sm mt-1">Observaciones totales</p>
                                        {periodoInfo && <p className="text-blue-300 text-xs mt-2">{periodoInfo.nombre}</p>}
                                    </div>
                                </div>

                                {/* ── Categorías con barras horizontales ── */}
                                {comentarios.categorias && comentarios.categorias.length > 0 && (
                                    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
                                        <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <svg className="w-4 h-4 text-[#293577]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z" /></svg>
                                            Por Categoría
                                        </h3>
                                        <div className="space-y-3">
                                            {(() => {
                                                const maxCat = Math.max(...comentarios.categorias.map(c => c.total));
                                                const catColors = ['bg-[#293577]', 'bg-indigo-500', 'bg-purple-500', 'bg-violet-500', 'bg-blue-500'];
                                                return comentarios.categorias.map((cat, idx) => (
                                                    <div key={cat.categoria} className="flex items-center gap-3">
                                                        <span className="text-xs text-gray-500 w-28 truncate text-right flex-shrink-0">{cat.categoria}</span>
                                                        <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                                                            <div
                                                                className={`h-full ${catColors[idx % catColors.length]} rounded-full flex items-center justify-end pr-2 transition-all duration-700`}
                                                                style={{ width: `${Math.round((cat.total / maxCat) * 100)}%` }}
                                                            >
                                                                <span className="text-white text-xs font-bold">{cat.total}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}

                                {/* ── Top negativos ── */}
                                {comentarios.topNegativos.length > 0 && (
                                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                                            <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm uppercase tracking-wider">
                                                <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" /></svg>
                                                Requieren Atención
                                            </h3>
                                            <span className="text-xs text-gray-400">Estudiantes con más observaciones negativas</span>
                                        </div>
                                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {comentarios.topNegativos.map((est, idx) => {
                                                const maxNeg = comentarios.topNegativos[0]?.total ?? 1;
                                                const pct = Math.round((est.total / maxNeg) * 100);
                                                const severity = est.total >= 5 ? 'border-rose-300 bg-rose-50' : est.total >= 3 ? 'border-orange-200 bg-orange-50' : 'border-yellow-200 bg-yellow-50';
                                                const badgeColor = est.total >= 5 ? 'bg-rose-500' : est.total >= 3 ? 'bg-orange-400' : 'bg-yellow-400';
                                                const textColor = est.total >= 5 ? 'text-rose-700' : est.total >= 3 ? 'text-orange-700' : 'text-yellow-700';
                                                return (
                                                    <div key={idx} className={`rounded-xl border p-3 ${severity}`}>
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-6 h-6 rounded-full ${badgeColor} text-white text-xs flex items-center justify-center font-bold flex-shrink-0`}>{idx + 1}</span>
                                                                <span className={`font-semibold text-sm ${textColor}`}>{est.nombre}</span>
                                                            </div>
                                                            <span className={`text-sm font-bold ${textColor}`}>{est.total} obs.</span>
                                                        </div>
                                                        <div className="bg-white/60 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className={`h-full ${badgeColor} rounded-full transition-all duration-500`}
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}
