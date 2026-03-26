import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { padreMenuItems } from '@/Config/padreMenu';

interface HijoOption {
    id: number;
    nombre: string;
}

interface HijoData {
    id: number;
    nombre: string;
    grado: string;
    seccion: string;
}

interface PeriodoItem {
    id: number;
    nombre: string;
    estado: string;
}

interface NotaDetalle {
    nombre: string;
    nota: number;
    fecha: string | null;
    peso: number | null;
}

interface MateriaRendimiento {
    materia: string;
    profesor: string;
    promedioActual: number;
    tendencia: 'subiendo' | 'bajando' | 'estable';
    notas: NotaDetalle[];
    observaciones: number;
    asistencia: number;
}

interface ObservacionReciente {
    id: string;
    tipo: 'positiva' | 'negativa';
    materia: string;
    profesor: string;
    descripcion: string;
    fecha: string | null;
}

interface Props {
    padre: {
        nombre: string;
    };
    hijos: HijoOption[];
    hijo: HijoData | null;
    periodos: PeriodoItem[];
    periodoSeleccionadoId: number | null;
    resumen: {
        promedioGeneral: number | null;
        asistenciaGeneral: number;
        totalObservaciones: number;
        materiasEnRiesgo: number;
    };
    materias: MateriaRendimiento[];
    observacionesRecientes: ObservacionReciente[];
}

export default function Seguimiento({ padre, hijos, hijo, periodos, periodoSeleccionadoId, resumen, materias, observacionesRecientes }: Props) {
    const [selectedMateria, setSelectedMateria] = useState<MateriaRendimiento | null>(null);

    const getTendencia = (t: string) => {
        if (t === 'subiendo') return { icon: '↑', color: 'text-green-600', label: 'Mejorando' };
        if (t === 'bajando') return { icon: '↓', color: 'text-red-600', label: 'Bajando' };
        return { icon: '→', color: 'text-[#293577]', label: 'Estable' };
    };

    const getBarColor = (nota: number) => {
        if (nota >= 4.0) return 'bg-green-500';
        if (nota >= 3.0) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const onFiltersChange = (nextHijoId?: number, nextPeriodoId?: number) => {
        router.get('/padre/seguimiento', {
            hijo_id: nextHijoId ?? hijo?.id,
            periodo_id: nextPeriodoId ?? periodoSeleccionadoId,
        }, { preserveState: true });
    };

    const riesgos = useMemo(() => materias.filter((m) => m.promedioActual < 3.0 || m.tendencia === 'bajando'), [materias]);

    return (
        <SidebarLayout menuItems={padreMenuItems} userInfo={{ name: padre.nombre, role: 'Padre' }}>
            <Head title="Seguimiento Academico" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {!hijo ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                        <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Seguimiento Academico</h1>
                        <p className="text-gray-500 mt-2">No hay hijos vinculados a este acudiente.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Seguimiento Academico</h1>
                                <p className="text-gray-600">{hijo.nombre} · {hijo.grado} Seccion {hijo.seccion}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                {hijos.length > 1 && (
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Cambiar de hijo/a</p>
                                        <select value={hijo.id} onChange={(e) => onFiltersChange(Number(e.target.value), undefined)} className="px-4 py-2 border border-gray-300 rounded-lg min-w-[220px] focus:ring-2 focus:ring-[#293577] focus:border-transparent">
                                            {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Periodo</p>
                                    <select value={periodoSeleccionadoId ?? ''} onChange={(e) => onFiltersChange(undefined, Number(e.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg min-w-[220px] focus:ring-2 focus:ring-[#293577] focus:border-transparent">
                                        {periodos.map((p) => <option key={p.id} value={p.id}>{p.nombre}{p.estado === 'activo' ? ' (Actual)' : ''}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
                                <div className={`text-3xl font-bold ${resumen.promedioGeneral !== null && resumen.promedioGeneral >= 3.0 ? 'text-green-600' : 'text-red-600'}`}>{resumen.promedioGeneral !== null ? resumen.promedioGeneral.toFixed(1) : '—'}</div>
                                <p className="text-gray-600 text-sm mt-1">Promedio General</p>
                                {resumen.promedioGeneral !== null && (
                                    <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                                        <div className={`h-1.5 rounded-full ${getBarColor(resumen.promedioGeneral)}`} style={{ width: `${(resumen.promedioGeneral / 5) * 100}%` }} />
                                    </div>
                                )}
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
                                <div className="text-3xl font-bold text-[#293577]">{resumen.asistenciaGeneral}%</div>
                                <p className="text-gray-600 text-sm mt-1">Asistencia</p>
                                <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                                    <div className="h-1.5 bg-[#293577] rounded-full" style={{ width: `${resumen.asistenciaGeneral}%` }} />
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
                                <div className={`text-3xl font-bold ${resumen.totalObservaciones > 0 ? 'text-amber-600' : 'text-green-600'}`}>{resumen.totalObservaciones}</div>
                                <p className="text-gray-600 text-sm mt-1">Observaciones</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100">
                                <div className={`text-3xl font-bold ${resumen.materiasEnRiesgo > 0 ? 'text-red-600' : 'text-green-600'}`}>{resumen.materiasEnRiesgo}</div>
                                <p className="text-gray-600 text-sm mt-1">Materias en Riesgo</p>
                            </div>
                        </div>

                        {riesgos.length > 0 && (
                            <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4">
                                <h3 className="font-bold text-red-800 mb-2">Atencion Requerida</h3>
                                <div className="space-y-1">
                                    {riesgos.map((m) => (
                                        <p key={m.materia} className="text-sm text-red-700">
                                            • {m.materia} — Promedio {m.promedioActual.toFixed(1)} · {getTendencia(m.tendencia).label}
                                            {m.observaciones > 0 ? ` · ${m.observaciones} observacion(es)` : ''}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                            <h3 className="font-semibold text-gray-700 mb-4">Rendimiento por Materia</h3>
                            <div className="space-y-3">
                                {materias.map((m) => {
                                    const t = getTendencia(m.tendencia);
                                    return (
                                        <button key={m.materia} onClick={() => setSelectedMateria(m)} className="w-full text-left hover:bg-gray-50 rounded-lg p-2 transition-colors">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-800 text-sm">{m.materia}</span>
                                                    <span className={`text-xs ${t.color}`}>{t.icon}</span>
                                                </div>
                                                <span className={`font-bold text-sm ${m.promedioActual >= 4.0 ? 'text-green-600' : m.promedioActual >= 3.0 ? 'text-amber-600' : 'text-red-600'}`}>{m.promedioActual.toFixed(1)}</span>
                                            </div>
                                            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                                <div className={`h-3 rounded-full ${getBarColor(m.promedioActual)}`} style={{ width: `${(m.promedioActual / 5) * 100}%` }} />
                                            </div>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-xs text-gray-500 truncate">Prof. {m.profesor}</span>
                                                <span className="text-xs text-gray-500">Asistencia: {m.asistencia}%</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {observacionesRecientes.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <h3 className="font-semibold text-gray-700 mb-4">Observaciones Recientes</h3>
                                <div className="space-y-2">
                                    {observacionesRecientes.slice(0, 8).map((o) => (
                                        <div key={o.id} className={`p-3 rounded-lg border-l-4 ${o.tipo === 'negativa' ? 'bg-red-50 border-red-400' : 'bg-blue-50 border-[#293577]'}`}>
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <p className="font-medium text-gray-800">{o.materia} - {o.profesor}</p>
                                                    <p className="text-sm text-gray-600 mt-1">{o.descripcion}</p>
                                                </div>
                                                <span className="text-xs text-gray-400 whitespace-nowrap">{o.fecha || '—'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedMateria && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto border border-gray-100">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-[#181b49]">{selectedMateria.materia}</h2>
                                <p className="text-sm text-gray-500">Prof. {selectedMateria.profesor}</p>
                            </div>
                            <button onClick={() => setSelectedMateria(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="text-center bg-gray-50 rounded-lg p-3">
                                <p className={`text-2xl font-bold ${selectedMateria.promedioActual >= 3.0 ? 'text-green-600' : 'text-red-600'}`}>{selectedMateria.promedioActual.toFixed(1)}</p>
                                <p className="text-xs text-gray-500">Promedio</p>
                            </div>
                            <div className="text-center bg-gray-50 rounded-lg p-3">
                                <p className="text-2xl font-bold text-[#293577]">{selectedMateria.asistencia}%</p>
                                <p className="text-xs text-gray-500">Asistencia</p>
                            </div>
                            <div className="text-center bg-gray-50 rounded-lg p-3">
                                <p className={`text-2xl font-bold ${getTendencia(selectedMateria.tendencia).color}`}>{getTendencia(selectedMateria.tendencia).icon}</p>
                                <p className="text-xs text-gray-500">{getTendencia(selectedMateria.tendencia).label}</p>
                            </div>
                        </div>

                        <h3 className="font-semibold text-gray-700 mb-3">Desglose de Notas</h3>
                        <div className="space-y-2 mb-4">
                            {selectedMateria.notas.length === 0 ? (
                                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">Sin notas registradas en este periodo.</div>
                            ) : (
                                selectedMateria.notas.map((n, i) => (
                                    <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                        <div>
                                            <p className="font-medium text-sm text-gray-800">{n.nombre}</p>
                                            <p className="text-xs text-gray-500">{n.fecha || '—'}{n.peso !== null ? ` · Peso: ${n.peso}%` : ''}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg font-bold text-sm ${n.nota >= 4.0 ? 'bg-green-100 text-green-700' : n.nota >= 3.0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{n.nota.toFixed(1)}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        <button onClick={() => setSelectedMateria(null)} className="w-full px-4 py-2 bg-[#293577] text-white rounded-lg hover:bg-[#181b49]">Cerrar</button>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
