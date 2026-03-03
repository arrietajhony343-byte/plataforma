import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { profesorMenuItems } from '@/Config/profesorMenu';

/* ══════════════════ Types ══════════════════ */

interface Periodo {
    id: number;
    nombre: string;
    estado: string;
    notasAbiertas: boolean;
}

interface CursoMateriaMap {
    id: number;
    curso_id: number;
    materia_id: number;
}

interface ConceptoNota {
    id: number | null;
    nombre: string;
    porcentaje: number;
    tipo: 'actividades' | 'manual';
    orden: number;
}

interface ActividadDetalle {
    titulo: string;
    tipo: string;
    porcentaje: number;
    calificacion: number | null;
    estado: string;
}

interface EstudianteData {
    id: number;
    nombre: string;
    actividadNota: number | null;
    actividadDetalle: ActividadDetalle[];
    manuales: Record<number, number>;
    definitiva: number | null;
}

interface Props {
    profesor: { nombre: string };
    cursos: Array<{ id: number; nombre: string }>;
    materias: Array<{ id: number; nombre: string }>;
    periodos: Periodo[];
    cursoMaterias: CursoMateriaMap[];
}

/* ══════════════════ Helpers ══════════════════ */

const gradeColor = (v: number | null) => {
    if (v === null) return 'text-gray-400';
    if (v >= 4) return 'text-emerald-600';
    if (v >= 3) return 'text-amber-600';
    return 'text-red-600';
};

const gradeBg = (v: number | null) => {
    if (v === null) return 'bg-gray-50';
    if (v >= 4) return 'bg-emerald-50';
    if (v >= 3) return 'bg-amber-50';
    return 'bg-red-50';
};

const tipoIcon: Record<string, string> = {
    tarea: '📝', examen: '📋', quiz: '❓', proyecto: '🔬', taller: '🛠️',
};

/* ══════════════════ Component ══════════════════ */

export default function RegistrarNotas({ profesor, cursos, materias, periodos, cursoMaterias }: Props) {

    // ── Filters ──
    const [cursoSel, setCursoSel]     = useState(cursos[0]?.id?.toString() ?? '');

    // Init materia to the first one matching the initial curso
    const [materiaSel, setMateriaSel] = useState(() => {
        const first = materias.find(m => cursoMaterias.some(cm => cm.curso_id === cursos[0]?.id && cm.materia_id === m.id));
        return first?.id?.toString() ?? '';
    });

    // Init period to the active one first, then first available
    const [periodoSel, setPeriodoSel] = useState(() => {
        const active = periodos.find(p => p.estado === 'activo');
        return (active ?? periodos[0])?.id?.toString() ?? '';
    });

    // ── Data ──
    const [conceptos, setConceptos]       = useState<ConceptoNota[]>([]);
    const [estudiantes, setEstudiantes]   = useState<EstudianteData[]>([]);
    const [notasLocales, setNotasLocales] = useState<Record<number, Record<number, string>>>({});
    const [notasAbiertas, setNotasAbiertas] = useState(true);
    const [loading, setLoading]   = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // ── Concept config panel ──
    const [configOpen, setConfigOpen]   = useState(false);
    const [editConceptos, setEditConceptos] = useState<ConceptoNota[]>([]);
    const [guardandoConf, setGuardandoConf] = useState(false);

    // ── Unsaved changes tracking ──
    const [isDirty, setIsDirty] = useState(false);
    const isDirtyRef = useRef(false);
    useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

    // Block browser tab close / reload
    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!isDirtyRef.current) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    // Block Inertia SPA navigation
    useEffect(() => {
        const unsubscribe = router.on('before', () => {
            if (!isDirtyRef.current) return;
            return window.confirm('Tienes notas sin guardar. ¿Seguro que quieres salir? Se perderán los cambios.');
        });
        return () => unsubscribe();
    }, []);

    // ── Activity detail expand ──
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    // ── Derived ──
    const materiasDisponibles = useMemo(() =>
        materias.filter(m => cursoMaterias.some(cm => cm.curso_id === Number(cursoSel) && cm.materia_id === m.id)),
        [cursoSel, materias, cursoMaterias]
    );

    const cursoMateriaId = useMemo(() =>
        cursoMaterias.find(cm => cm.curso_id === Number(cursoSel) && cm.materia_id === Number(materiaSel))?.id,
        [cursoSel, materiaSel, cursoMaterias]
    );

    const periodoActual = useMemo(() =>
        periodos.find(p => p.id === Number(periodoSel)),
        [periodoSel, periodos]
    );

    // Auto-select first available materia when curso changes
    useEffect(() => {
        const first = materiasDisponibles[0];
        if (first && !materiasDisponibles.some(m => m.id === Number(materiaSel))) {
            setMateriaSel(first.id.toString());
        }
    }, [cursoSel, materiasDisponibles]);

    // ── Load data when filters change ──
    const cargarDatos = useCallback(() => {
        if (!cursoMateriaId || !periodoSel) return;
        setLoading(true);
        setExpandedRow(null);
        fetch(`/profesor/notas/datos?curso_materia_id=${cursoMateriaId}&periodo_id=${periodoSel}`)
            .then(r => r.json())
            .then((data: { conceptos: ConceptoNota[]; estudiantes: EstudianteData[]; notasAbiertas: boolean }) => {
                setConceptos(data.conceptos);
                setEstudiantes(data.estudiantes);
                setNotasAbiertas(data.notasAbiertas);

                // Init local grades from backend
                const locales: Record<number, Record<number, string>> = {};
                data.estudiantes.forEach(est => {
                    locales[est.id] = {};
                    Object.entries(est.manuales || {}).forEach(([cId, val]) => {
                        locales[est.id][Number(cId)] = val.toString();
                    });
                });
                setNotasLocales(locales);
                setIsDirty(false); // fresh data, no unsaved changes
            })
            .catch(() => setErrorMsg('Error cargando datos.'))
            .finally(() => setLoading(false));
    }, [cursoMateriaId, periodoSel]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    // ── Computed: definitiva with local edits ──
    const calcDefLocal = (est: EstudianteData) => {
        let sum = 0, peso = 0;
        conceptos.forEach(c => {
            let val: number | null = null;
            if (c.tipo === 'actividades') {
                val = est.actividadNota;
            } else {
                const local = notasLocales[est.id]?.[c.id!];
                val = local !== undefined && local !== '' ? parseFloat(local) : null;
            }
            if (val !== null && !isNaN(val)) {
                sum += val * c.porcentaje;
                peso += c.porcentaje;
            }
        });
        return peso > 0 ? Math.round((sum / peso) * 10) / 10 : null;
    };

    // ── Save manual grades ──
    const guardarNotas = () => {
        if (!notasAbiertas) return;
        setGuardando(true);
        setErrorMsg(null);

        const manualConceptos = conceptos.filter(c => c.tipo === 'manual');
        const notas: Array<{ concepto_nota_id: number; estudiante_id: number; valor: number }> = [];

        estudiantes.forEach(est => {
            manualConceptos.forEach(c => {
                const val = notasLocales[est.id]?.[c.id!];
                if (val !== undefined && val !== '') {
                    notas.push({
                        concepto_nota_id: c.id!,
                        estudiante_id: est.id,
                        valor: Math.min(5, Math.max(0, parseFloat(val) || 0)),
                    });
                }
            });
        });

        if (notas.length === 0) {
            setGuardando(false);
            return;
        }

        fetch('/profesor/notas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ notas }),
        })
            .then(r => {
                if (!r.ok) return r.json().then(d => { throw new Error(d.message || 'Error al guardar'); });
                return r.json();
            })
            .then(() => {
                setIsDirty(false);
                setSuccessMsg('Notas guardadas correctamente.');
                setTimeout(() => setSuccessMsg(null), 3000);
                cargarDatos();
            })
            .catch(e => setErrorMsg(e.message))
            .finally(() => setGuardando(false));
    };

    // ── Concept config handlers ──
    const openConfig = () => {
        setEditConceptos(conceptos.map(c => ({ ...c })));
        setConfigOpen(true);
    };

    const addConcepto = () => {
        setEditConceptos(prev => [
            ...prev,
            { id: null, nombre: '', porcentaje: 0, tipo: 'manual', orden: prev.length },
        ]);
    };

    const removeConcepto = (idx: number) => {
        if (editConceptos[idx].tipo === 'actividades') return; // can't remove actividades
        setEditConceptos(prev => prev.filter((_, i) => i !== idx).map((c, i) => ({ ...c, orden: i })));
    };

    const updateConcepto = (idx: number, field: keyof ConceptoNota, value: any) => {
        setEditConceptos(prev => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [field]: value };
            return copy;
        });
    };

    const sumaPorcentajes = editConceptos.reduce((s, c) => s + (Number(c.porcentaje) || 0), 0);
    const sumaPorcentajesActual = conceptos.reduce((s, c) => s + c.porcentaje, 0);

    const guardarConceptos = () => {
        if (Math.abs(sumaPorcentajes - 100) > 0.01) return;
        if (editConceptos.some(c => !c.nombre.trim())) return;
        setGuardandoConf(true);

        fetch('/profesor/notas/conceptos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                curso_materia_id: cursoMateriaId,
                periodo_id: Number(periodoSel),
                conceptos: editConceptos.map((c, i) => ({
                    id: c.id,
                    nombre: c.nombre.trim(),
                    porcentaje: Number(c.porcentaje),
                    tipo: c.tipo,
                    orden: i,
                })),
            }),
        })
            .then(r => {
                if (!r.ok) return r.json().then(d => { throw new Error(d.message || 'Error'); });
                return r.json();
            })
            .then(() => {
                setConfigOpen(false);
                setSuccessMsg('Configuración guardada.');
                setTimeout(() => setSuccessMsg(null), 3000);
                cargarDatos();
            })
            .catch(e => setErrorMsg(e.message))
            .finally(() => setGuardandoConf(false));
    };

    // ── Input handler ──
    const handleNotaChange = (estId: number, conceptoId: number, value: string) => {
        // Allow empty, or decimal 0-5
        if (value !== '' && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 5)) return;
        setIsDirty(true);
        setNotasLocales(prev => ({
            ...prev,
            [estId]: { ...prev[estId], [conceptoId]: value },
        }));
    };

    // ── Guard for filter changes with unsaved data ──
    const guardedChange = (change: () => void) => {
        if (isDirtyRef.current) {
            if (!window.confirm('Tienes notas sin guardar. ¿Seguro que quieres cambiar de vista? Se perderán los cambios.')) return;
            setIsDirty(false);
        }
        change();
    };

    const manualConceptos = conceptos.filter(c => c.tipo === 'manual');
    const actConcepto = conceptos.find(c => c.tipo === 'actividades');

    const materiaNombre = materias.find(m => m.id === Number(materiaSel))?.nombre || 'Materia';
    const cursoNombre = cursos.find(c => c.id === Number(cursoSel))?.nombre || 'Curso';

    return (
        <SidebarLayout menuItems={profesorMenuItems} userInfo={{ name: profesor?.nombre || 'Profesor', role: 'Profesor' }}>
            <Head title="Registrar Notas" />

            <div className="max-w-7xl mx-auto space-y-5">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Registro de Notas</h1>
                            {isDirty && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 animate-pulse">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                    Sin guardar
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{materiaNombre} — {cursoNombre}</p>
                    </div>
                    {notasAbiertas && cursoMateriaId && estudiantes.length > 0 && (
                        <button
                            onClick={guardarNotas}
                            disabled={guardando || manualConceptos.length === 0}
                            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm ${
                                isDirty
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300'
                                    : 'bg-[#293577] hover:bg-[#181b49] text-white'
                            } disabled:opacity-40`}
                        >
                            {guardando ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    {isDirty ? 'Guardar Cambios' : 'Guardar Notas'}
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* ── Dirty banner ── */}
                {isDirty && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-amber-800">
                            <svg className="w-4 h-4 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
                            <span className="text-sm font-semibold">Tienes notas sin guardar. Si cambias de vista o cierras la pestaña, se perderán.</span>
                        </div>
                        <button
                            onClick={guardarNotas}
                            disabled={guardando}
                            className="flex-shrink-0 inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-40"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Guardar ahora
                        </button>
                    </div>
                )}

                {/* ── Toasts ── */}
                {successMsg && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2 animate-fade-in">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2 cursor-pointer" onClick={() => setErrorMsg(null)}>
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {errorMsg}
                    </div>
                )}

                {/* ── Filters ── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                    <div className="flex flex-wrap items-end gap-4">

                        {/* Curso */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Curso</label>
                            <select value={cursoSel} onChange={e => { const v = e.target.value; guardedChange(() => setCursoSel(v)); }}
                                className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] transition-colors min-w-[100px]">
                                {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>

                        {/* Materia */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Materia</label>
                            <select value={materiaSel} onChange={e => { const v = e.target.value; guardedChange(() => setMateriaSel(v)); }}
                                className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] transition-colors min-w-[140px]">
                                {materiasDisponibles.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                            </select>
                        </div>

                        {/* Periodo */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Periodo</label>
                            <select value={periodoSel} onChange={e => { const v = e.target.value; guardedChange(() => setPeriodoSel(v)); }}
                                className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] transition-colors min-w-[160px]">
                                {periodos.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre}{p.estado === 'activo' ? ' ✓' : p.estado === 'finalizado' ? ' (Cerrado)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Lock indicator */}
                        {periodoActual && (
                            <div className={`mb-0.5 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border ${
                                notasAbiertas
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                                {notasAbiertas ? (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                ) : (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                )}
                                {notasAbiertas ? 'Notas Abiertas' : 'Bloqueadas'}
                            </div>
                        )}

                    </div>
                </div>

                {/* ── Lock banner ── */}
                {!notasAbiertas && cursoMateriaId && !loading && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <div>
                            <p className="font-bold text-amber-800 text-sm">Registro de notas bloqueado</p>
                            <p className="text-amber-700 text-xs mt-0.5">El periodo actual no permite registrar o modificar notas. Contacta al administrador si necesitas realizar cambios.</p>
                        </div>
                    </div>
                )}

                {/* ── Concept config ── */}
                {cursoMateriaId && !loading && conceptos.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        {/* Concept bar header */}
                        <div className="p-4 pb-3">
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-[#293577]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                    Configuración de Evaluación
                                </h2>
                                {notasAbiertas && (
                                    <button onClick={configOpen ? () => setConfigOpen(false) : openConfig}
                                        className="text-xs font-semibold text-[#293577] hover:text-[#181b49] flex items-center gap-1 transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={configOpen ? "M6 18L18 6M6 6l12 12" : "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"} /></svg>
                                        {configOpen ? 'Cancelar' : 'Configurar'}
                                    </button>
                                )}
                            </div>

                            {/* Visual bar */}
                            <div className="flex rounded-lg overflow-hidden h-8 bg-gray-100 mb-2">
                                {conceptos.map((c, i) => {
                                    const colors = [
                                        'bg-[#293577] text-white',
                                        'bg-blue-500 text-white',
                                        'bg-violet-500 text-white',
                                        'bg-emerald-500 text-white',
                                        'bg-amber-500 text-white',
                                        'bg-rose-500 text-white',
                                    ];
                                    return (
                                        <div key={c.id ?? i} className={`flex items-center justify-center text-xs font-bold transition-all ${colors[i % colors.length]}`}
                                             style={{ width: `${c.porcentaje}%` }}
                                             title={`${c.nombre}: ${c.porcentaje}%`}>
                                            {c.porcentaje >= 10 && <span>{c.nombre} {c.porcentaje}%</span>}
                                        </div>
                                    );
                                })}
                                {sumaPorcentajesActual < 100 && (
                                    <div className="flex items-center justify-center text-xs text-gray-400 font-medium"
                                         style={{ width: `${100 - sumaPorcentajesActual}%` }}>
                                        {100 - sumaPorcentajesActual}% libre
                                    </div>
                                )}
                            </div>

                            {/* Pills */}
                            <div className="flex flex-wrap gap-2">
                                {conceptos.map((c, i) => (
                                    <span key={c.id ?? i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                        {c.tipo === 'actividades' ? (
                                            <svg className="w-3 h-3 text-[#293577]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                        ) : (
                                            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        )}
                                        {c.nombre} — {c.porcentaje}%
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Config panel (expandable) */}
                        {configOpen && (
                            <div className="border-t border-gray-200 bg-gray-50/50 p-4 space-y-3">
                                {editConceptos.map((c, idx) => (
                                    <div key={idx} className="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 p-3">
                                        <div className="flex-1 min-w-[140px]">
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase">Nombre</label>
                                            <input
                                                type="text"
                                                value={c.nombre}
                                                onChange={e => updateConcepto(idx, 'nombre', e.target.value)}
                                                disabled={c.tipo === 'actividades'}
                                                placeholder="Ej: Participación"
                                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] disabled:bg-gray-50 disabled:text-gray-500"
                                            />
                                        </div>
                                        <div className="w-24">
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase">Porcentaje</label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min="0" max="100" step="1"
                                                    value={c.porcentaje}
                                                    onChange={e => updateConcepto(idx, 'porcentaje', Number(e.target.value))}
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm pr-7 focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                                            </div>
                                        </div>
                                        <div className="w-36">
                                            <label className="text-[10px] font-semibold text-gray-400 uppercase">Tipo</label>
                                            <select
                                                value={c.tipo}
                                                onChange={e => updateConcepto(idx, 'tipo', e.target.value)}
                                                disabled={c.tipo === 'actividades'}
                                                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] disabled:bg-gray-50"
                                            >
                                                <option value="manual">Manual</option>
                                                {(c.tipo === 'actividades' || !editConceptos.some(e => e.tipo === 'actividades')) && (
                                                    <option value="actividades">Actividades</option>
                                                )}
                                            </select>
                                        </div>
                                        {c.tipo !== 'actividades' && (
                                            <button onClick={() => removeConcepto(idx)} className="mt-4 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {/* Add + Save buttons */}
                                <div className="flex items-center gap-3 pt-1">
                                    <button onClick={addConcepto} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#293577] hover:text-[#181b49] transition-colors">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                        Agregar Concepto
                                    </button>
                                    <div className="ml-auto flex items-center gap-3">
                                        <span className={`text-xs font-bold ${Math.abs(sumaPorcentajes - 100) < 0.01 ? 'text-emerald-600' : 'text-red-500'}`}>
                                            Total: {sumaPorcentajes}%
                                            {Math.abs(sumaPorcentajes - 100) > 0.01 && <span className="font-normal text-red-400"> (debe ser 100%)</span>}
                                        </span>
                                        <button
                                            onClick={guardarConceptos}
                                            disabled={guardandoConf || Math.abs(sumaPorcentajes - 100) > 0.01 || editConceptos.some(c => !c.nombre.trim())}
                                            className="inline-flex items-center gap-1.5 bg-[#293577] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#181b49] disabled:opacity-40 transition-colors"
                                        >
                                            {guardandoConf ? (
                                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            )}
                                            Guardar Configuración
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Grade table ── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-flex items-center gap-3 text-gray-400">
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-[#293577] rounded-full animate-spin" />
                                <span className="text-sm font-medium">Cargando estudiantes...</span>
                            </div>
                        </div>
                    ) : !cursoMateriaId ? (
                        <div className="p-12 text-center">
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                            <p className="text-gray-400 text-sm font-medium">Selecciona una combinación curso-materia válida</p>
                        </div>
                    ) : estudiantes.length === 0 ? (
                        <div className="p-12 text-center">
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            <p className="text-gray-400 text-sm font-medium">No hay estudiantes matriculados en este curso</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-slate-50 to-gray-50">
                                        <th className="text-left px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200 sticky left-0 bg-slate-50 z-10 min-w-[180px]">
                                            Estudiante
                                        </th>
                                        {actConcepto && (
                                            <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider border-b border-gray-200 text-[#293577] min-w-[120px]">
                                                <div className="flex flex-col items-center">
                                                    <span>{actConcepto.nombre}</span>
                                                    <span className="text-[10px] font-semibold text-gray-400 mt-0.5">{actConcepto.porcentaje}%</span>
                                                </div>
                                            </th>
                                        )}
                                        {manualConceptos.map(c => (
                                            <th key={c.id} className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider border-b border-gray-200 text-gray-700 min-w-[110px]">
                                                <div className="flex flex-col items-center">
                                                    <span>{c.nombre}</span>
                                                    <span className="text-[10px] font-semibold text-gray-400 mt-0.5">{c.porcentaje}%</span>
                                                </div>
                                            </th>
                                        ))}
                                        <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider border-b border-gray-200 text-gray-900 min-w-[100px]">
                                            Definitiva
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {estudiantes.map((est, idx) => {
                                        const def = calcDefLocal(est);
                                        const isExpanded = expandedRow === est.id;
                                        return (
                                            <>
                                            <tr key={est.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30 transition-colors`}>
                                                {/* Student name */}
                                                <td className={`px-4 py-3 border-b border-gray-100 sticky left-0 z-10 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-[#293577]/10 flex items-center justify-center text-xs font-bold text-[#293577]">
                                                            {est.nombre.charAt(0).toUpperCase()}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-800 truncate">{est.nombre}</span>
                                                    </div>
                                                </td>

                                                {/* Activity grade */}
                                                {actConcepto && (
                                                    <td className="px-3 py-3 text-center border-b border-gray-100">
                                                        <button
                                                            onClick={() => setExpandedRow(isExpanded ? null : est.id)}
                                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm font-bold transition-colors ${
                                                                est.actividadNota !== null
                                                                    ? `${gradeBg(est.actividadNota)} ${gradeColor(est.actividadNota)} hover:ring-2 hover:ring-gray-200`
                                                                    : 'bg-gray-100 text-gray-400'
                                                            }`}
                                                            title="Ver detalle de actividades"
                                                        >
                                                            {est.actividadNota !== null ? est.actividadNota.toFixed(1) : '—'}
                                                            <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                )}

                                                {/* Manual grades */}
                                                {manualConceptos.map(c => (
                                                    <td key={c.id} className="px-3 py-3 text-center border-b border-gray-100">
                                                        <input
                                                            type="number"
                                                            min="0" max="5" step="0.1"
                                                            value={notasLocales[est.id]?.[c.id!] ?? ''}
                                                            onChange={e => handleNotaChange(est.id, c.id!, e.target.value)}
                                                            disabled={!notasAbiertas}
                                                            placeholder="—"
                                                            className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-semibold focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] disabled:bg-gray-100 disabled:text-gray-400 transition-colors"
                                                        />
                                                    </td>
                                                ))}

                                                {/* Definitiva */}
                                                <td className="px-3 py-3 text-center border-b border-gray-100">
                                                    <span className={`text-lg font-extrabold ${gradeColor(def)}`}>
                                                        {def !== null ? def.toFixed(1) : '—'}
                                                    </span>
                                                </td>
                                            </tr>

                                            {/* Expanded activity detail */}
                                            {isExpanded && (
                                                <tr key={`detail-${est.id}`} className="bg-blue-50/40">
                                                    <td colSpan={2 + manualConceptos.length + (actConcepto ? 1 : 0)} className="px-4 py-3 border-b border-gray-200">
                                                        <div className="max-w-xl ml-9">
                                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Detalle de Actividades — {est.nombre}</p>
                                                            {est.actividadDetalle.length === 0 ? (
                                                                <p className="text-xs text-gray-400 italic">No hay actividades registradas para este periodo.</p>
                                                            ) : (
                                                                <div className="space-y-1.5">
                                                                    {est.actividadDetalle.map((a, ai) => (
                                                                        <div key={ai} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 border border-gray-100">
                                                                            <span className="text-sm">{tipoIcon[a.tipo] || '📄'}</span>
                                                                            <span className="flex-1 text-sm text-gray-700 font-medium truncate">{a.titulo}</span>
                                                                            <span className="text-xs text-gray-400 font-medium">{a.porcentaje}%</span>
                                                                            {a.calificacion !== null ? (
                                                                                <span className={`text-sm font-bold ${gradeColor(a.calificacion)}`}>
                                                                                    {a.calificacion.toFixed(1)}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-xs text-gray-300 italic">
                                                                                    {a.estado === 'pendiente' ? 'Pendiente' : 'Sin calificar'}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    {est.actividadNota !== null && (
                                                                        <div className="flex items-center justify-end gap-2 pt-1">
                                                                            <span className="text-xs font-semibold text-gray-500">Promedio ponderado:</span>
                                                                            <span className={`text-sm font-extrabold ${gradeColor(est.actividadNota)}`}>{est.actividadNota.toFixed(1)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Bottom save bar (mobile) ── */}
                {notasAbiertas && cursoMateriaId && estudiantes.length > 0 && manualConceptos.length > 0 && (
                    <div className="sm:hidden sticky bottom-4">
                        <button
                            onClick={guardarNotas}
                            disabled={guardando}
                            className="w-full bg-[#293577] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#181b49] disabled:opacity-40 transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                            {guardando ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Guardar Notas
                                </>
                            )}
                        </button>
                    </div>
                )}

            </div>
        </SidebarLayout>
    );
}
