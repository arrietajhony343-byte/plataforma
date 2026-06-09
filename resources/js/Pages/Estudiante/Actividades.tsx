import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { estudianteMenuItems } from '@/Config/estudianteMenu';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface ActividadItem {
    id: number;
    titulo: string;
    descripcion: string | null;
    tipo: string;
    materia: string | null;
    curso: string | null;
    profesor: string | null;
    fechaAsignacion: string;
    fechaEntrega: string;
    fechaEntregaISO: string;
    fechaLimiteIndividual: string | null;
    peso: number;
    estado: 'pendiente' | 'vencida' | 'entregada' | 'devuelta' | 'calificada';
    puedeEntregar: boolean;
    permiteEntregaTardia: boolean;
    maxIntentos: number | null;
    intentosUsados: number;
    tienePreguntas: boolean;
    entregaFecha: string | null;
    calificacion: number | null;
    retroalimentacion: string | null;
    notaDevolucion: string | null;
}

interface Props {
    estudiante: { nombre: string };
    pendientes: ActividadItem[];
    vencidas: ActividadItem[];
    entregadas: ActividadItem[];
    calificadas: ActividadItem[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = {
    tarea: 'Tarea', quiz: 'Quiz', examen: 'Examen',
    proyecto: 'Proyecto', taller: 'Taller',
};

const TIPO_COLOR: Record<string, string> = {
    tarea: 'bg-indigo-100 text-indigo-700',
    quiz: 'bg-rose-100 text-rose-700',
    examen: 'bg-red-100 text-red-700',
    proyecto: 'bg-purple-100 text-purple-700',
    taller: 'bg-blue-100 text-blue-700',
};

const ESTADO_CONFIG: Record<string, { label: string; pill: string; dot: string }> = {
    pendiente: { label: 'Pendiente', pill: 'bg-amber-100 text-amber-700 border-amber-200',   dot: 'bg-amber-400' },
    vencida:   { label: 'Vencida',   pill: 'bg-red-100 text-red-700 border-red-200',         dot: 'bg-red-400' },
    entregada: { label: 'Entregada', pill: 'bg-blue-100 text-blue-700 border-blue-200',      dot: 'bg-blue-400' },
    devuelta:  { label: 'Devuelta',  pill: 'bg-orange-100 text-orange-700 border-orange-200',dot: 'bg-orange-400' },
    calificada:{ label: 'Calificada',pill: 'bg-green-100 text-green-700 border-green-200',   dot: 'bg-green-400' },
};

function notaColor(n: number) {
    return n >= 4 ? 'text-green-600' : n >= 3 ? 'text-amber-600' : 'text-red-600';
}

// ── Tarjeta de actividad ──────────────────────────────────────────────────────

function ActividadCard({ act }: { act: ActividadItem }) {
    const estado = ESTADO_CONFIG[act.estado] ?? ESTADO_CONFIG.pendiente;
    const tipoLabel = TIPO_LABEL[act.tipo] ?? act.tipo;
    const tipoColor = TIPO_COLOR[act.tipo] ?? 'bg-gray-100 text-gray-600';

    return (
        <Link href={route('estudiante.actividades.show', act.id)}
            className={`block bg-white rounded-xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden ${
                act.estado === 'vencida' ? 'border-red-200' : 'border-gray-100'
            }`}>
            {/* Barra de color superior */}
            <div className={`h-1 w-full ${act.estado === 'vencida' ? 'bg-red-400' : 'bg-[#293577]'}`} />

            <div className="p-4">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${estado.pill}`}>
                        {estado.label}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tipoColor}`}>
                        {tipoLabel}
                    </span>
                    {act.permiteEntregaTardia && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">
                            tardía ✓
                        </span>
                    )}
                </div>

                <h4 className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">{act.titulo}</h4>
                <p className="text-xs text-gray-400 mb-3">{act.materia} · Prof. {act.profesor}</p>

                {/* Info */}
                <div className="space-y-1 text-[11px] text-gray-500">
                    <div className="flex justify-between">
                        <span>📅 Entrega</span>
                        <span className={`font-semibold ${act.estado === 'vencida' ? 'text-red-600' : 'text-gray-700'}`}>
                            {act.fechaLimiteIndividual ?? act.fechaEntrega}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>⚖️ Peso</span>
                        <span className="font-semibold text-gray-700">{act.peso}%</span>
                    </div>
                    {act.maxIntentos !== null && (
                        <div className="flex justify-between">
                            <span>🔄 Intentos</span>
                            <span className="font-semibold text-gray-700">{act.intentosUsados}/{act.maxIntentos}</span>
                        </div>
                    )}
                </div>

                {/* Calificación */}
                {act.calificacion !== null && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Nota obtenida</span>
                        <span className={`text-lg font-extrabold ${notaColor(act.calificacion)}`}>{act.calificacion.toFixed(1)}</span>
                    </div>
                )}

                {/* Nota devolución */}
                {act.estado === 'devuelta' && act.notaDevolucion && (
                    <div className="mt-2 p-2 bg-orange-50 rounded-lg text-[11px] text-orange-700 italic line-clamp-2">
                        ↩ "{act.notaDevolucion}"
                    </div>
                )}

                {/* Botón de acción */}
                <div className="mt-3">
                    {(act.estado === 'pendiente' || act.estado === 'devuelta') && act.puedeEntregar ? (
                        <div className={`w-full py-2 rounded-lg text-xs font-bold text-center ${
                            act.tienePreguntas ? 'bg-rose-600 text-white' : 'bg-[#293577] text-white'
                        }`}>
                            {act.tienePreguntas ? '📝 Iniciar Quiz' : '📤 Entregar'}
                        </div>
                    ) : act.estado === 'vencida' && act.puedeEntregar ? (
                        <div className="w-full py-2 rounded-lg text-xs font-bold text-center bg-amber-500 text-white">
                            ⏰ Entregar tarde
                        </div>
                    ) : (
                        <div className="w-full py-2 rounded-lg text-xs font-semibold text-center bg-gray-50 text-gray-400">
                            Ver detalles →
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function Actividades({ estudiante, pendientes, vencidas, entregadas, calificadas }: Props) {
    const [tab, setTab] = useState<'pendientes' | 'vencidas' | 'entregadas' | 'calificadas'>('pendientes');
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroMateria, setFiltroMateria] = useState('');

    const todas = useMemo(() => [...pendientes, ...vencidas, ...entregadas, ...calificadas], [pendientes, vencidas, entregadas, calificadas]);

    const materiasList = useMemo(() => [...new Set(todas.map(a => a.materia).filter(Boolean))], [todas]);

    const tabData: Record<string, ActividadItem[]> = {
        pendientes, vencidas, entregadas, calificadas,
    };

    const filtradas = useMemo(() => {
        let list = tabData[tab] ?? [];
        if (filtroMateria) list = list.filter(a => a.materia === filtroMateria);
        if (searchTerm.trim()) {
            const s = searchTerm.toLowerCase();
            list = list.filter(a =>
                a.titulo.toLowerCase().includes(s) ||
                (a.materia ?? '').toLowerCase().includes(s) ||
                a.tipo.toLowerCase().includes(s)
            );
        }
        return list;
    }, [tab, filtroMateria, searchTerm, pendientes, vencidas, entregadas, calificadas]);

    const TABS = [
        { key: 'pendientes', label: 'Pendientes',  count: pendientes.length,  color: 'text-amber-600' },
        { key: 'vencidas',   label: 'Vencidas',    count: vencidas.length,    color: 'text-red-600' },
        { key: 'entregadas', label: 'Entregadas',  count: entregadas.length,  color: 'text-blue-600' },
        { key: 'calificadas',label: 'Calificadas', count: calificadas.length, color: 'text-green-600' },
    ] as const;

    return (
        <SidebarLayout menuItems={estudianteMenuItems} userInfo={{ name: estudiante.nombre, role: 'Estudiante' }}>
            <Head title="Mis Actividades" />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Mis Actividades</h1>
                <p className="text-gray-500 mt-1 text-sm">Gestiona tus tareas, talleres y evaluaciones</p>
            </div>

            {/* Stats rápidos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`bg-white rounded-xl border p-4 flex items-center gap-3 text-left transition-all hover:shadow-md ${
                            tab === t.key ? 'border-[#293577] shadow-md' : 'border-gray-100'
                        }`}>
                        <div className={`text-2xl font-extrabold ${t.color}`}>{t.count}</div>
                        <div className="text-xs text-gray-500 font-medium">{t.label}</div>
                    </button>
                ))}
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                        <input type="text" placeholder="Buscar actividad…"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]" />
                    </div>
                    {materiasList.length > 1 && (
                        <select value={filtroMateria} onChange={e => setFiltroMateria(e.target.value)}
                            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]/30 min-w-[160px]">
                            <option value="">Todas las materias</option>
                            {materiasList.map(m => <option key={m!} value={m!}>{m}</option>)}
                        </select>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-gray-200 mb-5 overflow-x-auto">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                            tab === t.key
                                ? 'border-[#293577] text-[#293577]'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}>
                        {t.label}
                        {t.count > 0 && (
                            <span className={`ml-1.5 text-xs font-bold px-1.5 py-0.5 rounded-full ${
                                tab === t.key ? 'bg-[#293577]/10 text-[#293577]' : 'bg-gray-100 text-gray-500'
                            }`}>{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Contenido */}
            {filtradas.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
                    <div className="text-5xl mb-3">
                        {tab === 'pendientes' ? '📋' : tab === 'vencidas' ? '⌛' : tab === 'entregadas' ? '✅' : '🏆'}
                    </div>
                    <p className="text-gray-400 text-sm">
                        {searchTerm || filtroMateria
                            ? 'No hay resultados con los filtros aplicados.'
                            : tab === 'pendientes' ? '¡Sin actividades pendientes!' : `No hay actividades ${tab}.`}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtradas.map(act => (
                        <ActividadCard key={act.id} act={act} />
                    ))}
                </div>
            )}
        </SidebarLayout>
    );
}
