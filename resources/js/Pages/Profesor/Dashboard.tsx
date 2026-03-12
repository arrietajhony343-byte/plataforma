import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, Link } from '@inertiajs/react';
import { profesorMenuItems } from '@/Config/profesorMenu';
import { useState, useMemo } from 'react';

// ── Types ──
interface Materia {
    id: number;
    materia_id: number;
    nombre: string;
    horas: number;
    actividades: number;
    promedio: number | null;
}

interface Curso {
    id: number;
    nombre: string;
    nivel: string;
    nivelLabel: string;
    grado: string;
    estudiantes: number;
    materias: Materia[];
}

interface Stats {
    totalCursos: number;
    totalMaterias: number;
    totalEstudiantes: number;
    totalActividades: number;
    entregasPendientes: number;
    entregasPorCalificar: number;
    mensajesNoLeidos: number;
    observacionesMes: number;
}

interface Alerta {
    id: number;
    estudiante: string;
    materia: string;
    mensaje: string;
    fecha: string;
}

interface ActividadProxima {
    id: number;
    titulo: string;
    tipo: string;
    materia: string;
    curso: string;
    fecha: string;
    diasRestantes: number;
}

interface ClaseHoy {
    id: number;
    materia: string;
    curso: string;
    horaInicio: string;
    horaFin: string;
    salon: string | null;
}

interface ActividadHoy {
    id: number;
    titulo: string;
    tipo: string;
    materia: string;
    curso: string;
}

interface Props {
    profesor: { nombre: string; directorDe: string | null };
    cursos: Curso[];
    stats: Stats;
    alertas: Alerta[];
    actividadesProximas: ActividadProxima[];
    clasesHoy: ClaseHoy[];
    actividadesHoy: ActividadHoy[];
}

// ── Nivel colors ──
const normalizeNivel = (n: string) => (n === 'preescolar' || n === 'transicion') ? 'prejardin' : n;
const nivelLabels: Record<string, string> = { prejardin: 'Pre-Jardín', primaria: 'Primaria', bachillerato: 'Bachillerato' };
const nivelColors: Record<string, { bg: string; text: string; dot: string; badge: string }> = {
    prejardin:    { bg: 'bg-pink-50',    text: 'text-pink-700',    dot: 'bg-pink-500',    badge: 'bg-pink-100 text-pink-700'    },
    primaria:     { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' },
    bachillerato: { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500',   badge: 'bg-blue-100 text-blue-700'   },
};

const tipoActividadIcons: Record<string, string> = {
    tarea: '📝', quiz: '❓', examen: '📋', proyecto: '🚀', taller: '🔧',
};

export default function Dashboard({ profesor, cursos, stats, alertas, actividadesProximas, clasesHoy, actividadesHoy }: Props) {
    const [filtroNivel, setFiltroNivel] = useState<string>('todos');
    const [cursoExpandido, setCursoExpandido] = useState<number | null>(null);
    const [vistaMode, setVistaMode] = useState<'cards' | 'list'>('cards');

    // Greeting dinámico
    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buenos días' : hora < 18 ? 'Buenas tardes' : 'Buenas noches';

    // Niveles disponibles
    const nivelesDisponibles = useMemo(() => {
        const set = new Set(cursos.map(c => normalizeNivel(c.nivel)));
        return Array.from(set);
    }, [cursos]);

    // Cursos filtrados
    const cursosFiltrados = useMemo(() => {
        if (filtroNivel === 'todos') return cursos;
        return cursos.filter(c => normalizeNivel(c.nivel) === filtroNivel);
    }, [cursos, filtroNivel]);

    const getPromedioColor = (p: number | null) => {
        if (p === null) return 'text-gray-400';
        if (p >= 4.0) return 'text-emerald-600';
        if (p >= 3.0) return 'text-blue-600';
        if (p >= 2.0) return 'text-amber-600';
        return 'text-red-600';
    };

    const getPromedioBar = (p: number | null) => {
        if (p === null) return 0;
        return Math.min((p / 5) * 100, 100);
    };

    return (
        <SidebarLayout menuItems={profesorMenuItems} userInfo={{ name: profesor.nombre, role: 'Profesor' }}>
            <Head title="Dashboard Profesor" />

            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Header / Greeting ── */}
                <div className="bg-gradient-to-br from-[#293577] to-[#181b49] rounded-2xl p-5 sm:p-7 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                    <div className="relative z-10">
                        <p className="text-white/60 text-sm font-medium">{saludo}</p>
                        <h1 className="text-xl sm:text-2xl font-extrabold mt-1">{profesor.nombre}</h1>
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                                {stats.totalMaterias} materias
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" /></svg>
                                {stats.totalCursos} cursos
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-medium">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                                {stats.totalEstudiantes} estudiantes
                            </span>
                            {profesor.directorDe && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/20 text-yellow-300 text-xs font-bold">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                                    Director de {profesor.directorDe}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Stats Grid ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <StatCard
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>}
                        label="Actividades"
                        value={stats.totalActividades}
                        color="blue"
                        href="/profesor/actividades"
                    />
                    <StatCard
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        label="Por calificar"
                        value={stats.entregasPorCalificar}
                        color="amber"
                        href="/profesor/actividades"
                    />
                    <StatCard
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>}
                        label="Mensajes"
                        value={stats.mensajesNoLeidos}
                        color="indigo"
                        href="/profesor/mensajes"
                        badge={stats.mensajesNoLeidos > 0 ? 'nuevo' : undefined}
                    />
                    <StatCard
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                        label="Observaciones"
                        value={stats.observacionesMes}
                        color="rose"
                        href="/profesor/observador"
                        subtitle="este mes"
                    />
                </div>

                {/* ── Main Grid: Cursos + Sidebar ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Left: Cursos ── */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Cabecera: título + filtros de nivel + toggle de vista */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <h2 className="text-lg font-bold text-gray-800">Mis Cursos y Materias</h2>
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="flex gap-1.5 overflow-x-auto scrollbar-hidden pb-0.5">
                                    <button
                                        onClick={() => setFiltroNivel('todos')}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                            filtroNivel === 'todos'
                                                ? 'bg-[#293577] text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        Todos ({cursos.length})
                                    </button>
                                    {nivelesDisponibles.map(n => {
                                        const nc = nivelColors[n] || nivelColors.primaria;
                                        const count = cursos.filter(c => normalizeNivel(c.nivel) === n).length;
                                        return (
                                            <button
                                                key={n}
                                                onClick={() => setFiltroNivel(n)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                                                    filtroNivel === n
                                                        ? `${nc.badge} shadow-sm`
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            >
                                                {nivelLabels[n] ?? (n.charAt(0).toUpperCase() + n.slice(1))} ({count})
                                            </button>
                                        );
                                    })}
                                </div>
                                {/* Toggle Cards / Lista */}
                                <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm flex-shrink-0">
                                    <button
                                        onClick={() => setVistaMode('cards')}
                                        title="Vista tarjetas"
                                        className={`p-1.5 transition-colors ${
                                            vistaMode === 'cards' ? 'bg-[#293577] text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setVistaMode('list')}
                                        title="Vista lista"
                                        className={`p-1.5 transition-colors ${
                                            vistaMode === 'list' ? 'bg-[#293577] text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ── Vista Tarjetas (por defecto) ── */}
                        {vistaMode === 'cards' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {cursosFiltrados.map(curso => {
                                    const nc = nivelColors[normalizeNivel(curso.nivel)] || nivelColors.primaria;
                                    const totalActividades = curso.materias.reduce((s, m) => s + m.actividades, 0);
                                    const promedios = curso.materias.filter(m => m.promedio !== null).map(m => m.promedio!);
                                    const promedioGeneral = promedios.length > 0
                                        ? (promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(1)
                                        : null;

                                    return (
                                        <div key={curso.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col">
                                            {/* Franja de color superior */}
                                            <div className={`h-1 w-full ${nc.dot}`} />

                                            {/* Header */}
                                            <div className="p-5 pb-3">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-12 h-12 rounded-xl ${nc.bg} flex items-center justify-center flex-shrink-0`}>
                                                            <span className={`text-base font-extrabold ${nc.text}`}>{curso.grado}</span>
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-800 text-sm leading-tight">{curso.nombre}</h3>
                                                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${nc.badge}`}>
                                                                {curso.nivelLabel}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {promedioGeneral && (
                                                        <div className="text-right flex-shrink-0">
                                                            <p className={`text-xl font-extrabold leading-tight ${getPromedioColor(parseFloat(promedioGeneral))}`}>{promedioGeneral}</p>
                                                            <p className="text-[10px] text-gray-400">promedio</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Stats */}
                                                <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                                                        {curso.estudiantes} estudiantes
                                                    </span>
                                                    {totalActividades > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
                                                            {totalActividades} actividades
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Materias como chips */}
                                            <div className="px-5 pb-4 flex-1">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Materias ({curso.materias.length})</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {curso.materias.map(mat => (
                                                        <div key={mat.id} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${nc.bg}`}>
                                                            <div className={`w-1.5 h-1.5 rounded-full ${nc.dot} flex-shrink-0`} />
                                                            <span className={`text-[11px] font-semibold ${nc.text} leading-none`}>{mat.nombre}</span>
                                                            {mat.promedio !== null && (
                                                                <span className={`text-[10px] font-extrabold ${getPromedioColor(mat.promedio)} ml-0.5`}>
                                                                    {mat.promedio.toFixed(1)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Acciones */}
                                            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex gap-2 flex-wrap">
                                                <Link
                                                    href="/profesor/notas"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#293577] text-white text-xs font-semibold rounded-lg hover:bg-[#181b49] transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                                                    Notas
                                                </Link>
                                                <Link
                                                    href="/profesor/actividades"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
                                                    Actividades
                                                </Link>
                                                <Link
                                                    href="/profesor/asistencias"
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    Asistencia
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}

                                {cursosFiltrados.length === 0 && (
                                    <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-10 text-center">
                                        <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                                        <p className="text-sm text-gray-500">No tienes cursos asignados en este nivel.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Vista Lista ── */}
                        {vistaMode === 'list' && (
                        <div className="space-y-3">
                            {cursosFiltrados.map(curso => {
                                const nc = nivelColors[normalizeNivel(curso.nivel)] || nivelColors.primaria;
                                const isExpanded = cursoExpandido === curso.id;
                                const totalActividades = curso.materias.reduce((s, m) => s + m.actividades, 0);
                                const promedios = curso.materias.filter(m => m.promedio !== null).map(m => m.promedio!);
                                const promedioGeneral = promedios.length > 0
                                    ? (promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(1)
                                    : null;

                                return (
                                    <div key={curso.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                        {/* Curso header */}
                                        <button
                                            onClick={() => setCursoExpandido(isExpanded ? null : curso.id)}
                                            className="w-full flex items-center gap-3 sm:gap-4 p-4 text-left"
                                        >
                                            {/* Grado badge */}
                                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${nc.bg} flex items-center justify-center flex-shrink-0`}>
                                                <span className={`text-sm sm:text-base font-extrabold ${nc.text}`}>{curso.grado}</span>
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-bold text-gray-800 text-sm sm:text-base">{curso.nombre}</h3>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${nc.badge}`}>
                                                        {curso.nivelLabel}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                                                        {curso.estudiantes} est.
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                                                        {curso.materias.length} mat.
                                                    </span>
                                                    {totalActividades > 0 && (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
                                                            {totalActividades} act.
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Promedio + chevron */}
                                            <div className="flex items-center gap-3 flex-shrink-0">
                                                {promedioGeneral && (
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Prom.</p>
                                                        <p className={`text-lg font-extrabold ${getPromedioColor(parseFloat(promedioGeneral))}`}>
                                                            {promedioGeneral}
                                                        </p>
                                                    </div>
                                                )}
                                                <svg className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>

                                        {/* Expanded: Materias detail */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100">
                                                <div className="px-4 py-3 bg-gray-50/50">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Materias asignadas</p>
                                                </div>
                                                <div className="divide-y divide-gray-100">
                                                    {curso.materias.map(mat => (
                                                        <div key={mat.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                                                            <div className={`w-2 h-2 rounded-full ${nc.dot} flex-shrink-0`} />
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-gray-800">{mat.nombre}</p>
                                                                <p className="text-xs text-gray-400">
                                                                    {mat.horas}h/sem · {mat.actividades} actividad{mat.actividades !== 1 ? 'es' : ''}
                                                                </p>
                                                            </div>
                                                            {mat.promedio !== null ? (
                                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden hidden sm:block">
                                                                        <div
                                                                            className={`h-full rounded-full ${
                                                                                mat.promedio >= 4 ? 'bg-emerald-500' :
                                                                                mat.promedio >= 3 ? 'bg-blue-500' :
                                                                                mat.promedio >= 2 ? 'bg-amber-500' : 'bg-red-500'
                                                                            }`}
                                                                            style={{ width: `${getPromedioBar(mat.promedio)}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className={`text-sm font-bold ${getPromedioColor(mat.promedio)}`}>
                                                                        {mat.promedio.toFixed(1)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">Sin notas</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Quick actions for course */}
                                                <div className="px-4 py-3 bg-gray-50/50 flex flex-wrap gap-2">
                                                    <Link
                                                        href="/profesor/notas"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#293577] text-white text-xs font-semibold rounded-lg hover:bg-[#181b49] transition-colors"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>
                                                        Registrar notas
                                                    </Link>
                                                    <Link
                                                        href="/profesor/actividades"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
                                                        Actividades
                                                    </Link>
                                                    <Link
                                                        href="/profesor/observador"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                        Observador
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {cursosFiltrados.length === 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
                                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                                    <p className="text-sm text-gray-500">No tienes cursos asignados en este nivel.</p>
                                </div>
                            )}
                        </div>
                        )}
                    </div>

                    {/* ── Right Sidebar ── */}
                    <div className="space-y-4">

                        {/* Actividades próximas */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-800">Próximos Vencimientos</h3>
                                <Link href="/profesor/actividades" className="text-xs text-[#293577] font-semibold hover:underline">Ver todo</Link>
                            </div>
                            {actividadesProximas.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {actividadesProximas.map(act => (
                                        <div key={act.id} className="px-4 py-3 flex items-start gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${
                                                act.diasRestantes <= 1 ? 'bg-red-100' :
                                                act.diasRestantes <= 3 ? 'bg-amber-100' : 'bg-blue-100'
                                            }`}>
                                                {tipoActividadIcons[act.tipo] || '📋'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{act.titulo}</p>
                                                <p className="text-xs text-gray-400 truncate">{act.materia} · {act.curso}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className={`text-xs font-bold ${
                                                    act.diasRestantes <= 1 ? 'text-red-600' :
                                                    act.diasRestantes <= 3 ? 'text-amber-600' : 'text-blue-600'
                                                }`}>
                                                    {act.diasRestantes === 0 ? 'Hoy' :
                                                     act.diasRestantes === 1 ? 'Mañana' :
                                                     `${act.diasRestantes}d`}
                                                </p>
                                                <p className="text-[10px] text-gray-400">{act.fecha}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="px-4 py-8 text-center">
                                    <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    <p className="text-xs text-gray-400">Sin actividades próximas</p>
                                </div>
                            )}
                        </div>

                        {/* Widget Hoy */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Header calendario */}
                            <div className="bg-gradient-to-br from-[#293577] to-[#181b49] px-4 py-4 text-white">
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                                    {new Date().toLocaleDateString('es-CO', { weekday: 'long' })}
                                </p>
                                <div className="flex items-end gap-3 mt-1">
                                    <span className="text-4xl font-black leading-none">
                                        {new Date().getDate()}
                                    </span>
                                    <div className="pb-0.5">
                                        <p className="text-sm font-semibold capitalize">
                                            {new Date().toLocaleDateString('es-CO', { month: 'long' })}
                                        </p>
                                        <p className="text-white/50 text-xs">{new Date().getFullYear()}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/15 text-xs font-semibold">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {clasesHoy.length} clase{clasesHoy.length !== 1 ? 's' : ''}
                                    </span>
                                    {actividadesHoy.length > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-400/30 text-red-200 text-xs font-semibold">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                                            {actividadesHoy.length} vence{actividadesHoy.length !== 1 ? 'n' : ''} hoy
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Clases del día */}
                            {clasesHoy.length > 0 ? (
                                <div>
                                    <div className="px-4 pt-3 pb-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Clases programadas</p>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {clasesHoy.map(clase => (
                                            <div key={clase.id} className="px-4 py-2.5 flex items-center gap-3">
                                                <div className="flex flex-col items-center w-11 flex-shrink-0">
                                                    <span className="text-[11px] font-black text-[#293577]">{clase.horaInicio}</span>
                                                    <div className="w-px h-3 bg-gray-200 my-0.5" />
                                                    <span className="text-[9px] text-gray-400">{clase.horaFin}</span>
                                                </div>
                                                <div className="w-1.5 h-10 rounded-full bg-[#293577]/20 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">{clase.materia}</p>
                                                    <p className="text-xs text-gray-400 truncate">
                                                        {clase.curso}
                                                        {clase.salon && <span className="ml-1.5 text-gray-300">· {clase.salon}</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="px-4 py-5 text-center">
                                    <svg className="w-8 h-8 mx-auto text-gray-200 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                                    <p className="text-xs text-gray-400">Sin clases programadas hoy</p>
                                </div>
                            )}

                            {/* Actividades que vencen hoy */}
                            {actividadesHoy.length > 0 && (
                                <div className="border-t border-gray-100">
                                    <div className="px-4 pt-3 pb-1">
                                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                            Vencen hoy
                                        </p>
                                    </div>
                                    <div className="divide-y divide-gray-100">
                                        {actividadesHoy.map(act => (
                                            <Link key={act.id} href="/profesor/actividades" className="px-4 py-2.5 flex items-center gap-2.5 hover:bg-red-50/50 transition-colors">
                                                <span className="text-base">{tipoActividadIcons[act.tipo] || '📋'}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate">{act.titulo}</p>
                                                    <p className="text-xs text-gray-400 truncate">{act.materia} · {act.curso}</p>
                                                </div>
                                                <span className="text-[10px] font-black text-red-500 flex-shrink-0">HOY</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="p-3 border-t border-gray-100">
                                <Link href="/profesor/asistencias" className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[#293577]/5 hover:bg-[#293577]/10 text-[#293577] text-xs font-bold transition-colors">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Registrar asistencia de hoy
                                </Link>
                            </div>
                        </div>

                        {/* Quick links */}
                       
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}

// ── Sub-components ──

function StatCard({ icon, label, value, color, href, badge, subtitle }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
    href: string;
    badge?: string;
    subtitle?: string;
}) {
    const colors: Record<string, { bg: string; icon: string; ring: string }> = {
        blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   ring: 'ring-blue-200'   },
        amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  ring: 'ring-amber-200'  },
        indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', ring: 'ring-indigo-200' },
        rose:   { bg: 'bg-rose-50',   icon: 'text-rose-600',   ring: 'ring-rose-200'   },
    };
    const c = colors[color] || colors.blue;
    return (
        <Link
            href={href}
            className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-all group relative"
        >
            {badge && (
                <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                    {badge}
                </span>
            )}
            <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center ${c.icon} mb-2`}>
                {icon}
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-gray-800 group-hover:text-[#293577] transition-colors">
                {value}
            </p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
                {label}
                {subtitle && <span className="text-gray-400 ml-1">({subtitle})</span>}
            </p>
        </Link>
    );
}

function QuickLink({ href, label, icon, badge }: {
    href: string;
    label: string;
    icon: React.ReactNode;
    badge?: number;
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
        >
            <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-[#293577]/10 flex items-center justify-center text-gray-500 group-hover:text-[#293577] transition-colors flex-shrink-0">
                {icon}
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">{label}</span>
            {badge !== undefined && badge > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {badge}
                </span>
            )}
            <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </Link>
    );
}
