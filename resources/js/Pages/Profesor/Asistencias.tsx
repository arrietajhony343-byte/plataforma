import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { profesorMenuItems } from '@/Config/profesorMenu';

/* ══════════════════ Types ══════════════════ */

interface Periodo {
    id: number;
    nombre: string;
    estado: string;
    fecha_inicio: string;
    fecha_fin: string;
}

interface CursoMateriaMap {
    id: number;
    curso_id: number;
    materia_id: number;
}

interface Bloque {
    id: number;
    curso_materia_id: number;
    dia: string;
    hora_inicio: string;
    hora_fin: string;
    salon: string | null;
}

interface BloqueDelDia {
    id: number;
    hora_inicio: string;
    hora_fin: string;
    salon: string | null;
}

interface Estudiante {
    id: number;
    nombre: string;
    documento: string;
}

interface RegistroAsistencia {
    id?: number;
    estudiante_id: number;
    horario_bloque_id: number | null;
    estado: 'presente' | 'ausente' | 'tarde' | 'excusa';
    observacion: string;
}

interface ResumenEstudiante {
    estudiante_id: number;
    total: number;
    presentes: number;
    ausentes: number;
    tardes: number;
    excusas: number;
    porcentaje: number;
}

interface Props {
    cursos: Array<{ id: number; nombre: string }>;
    materias: Array<{ id: number; nombre: string }>;
    cursoMaterias: CursoMateriaMap[];
    bloques: Bloque[];
    periodos: Periodo[];
}

/* ══════════════════ Helpers ══════════════════ */

const ESTADOS = ['presente', 'ausente', 'tarde', 'excusa'] as const;
type Estado = typeof ESTADOS[number];

const estadoConfig: Record<Estado, { label: string; icon: string; color: string; bg: string; border: string }> = {
    presente: { label: 'Presente', icon: 'M5 13l4 4L19 7', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    ausente:  { label: 'Ausente',  icon: 'M6 18L18 6M6 6l12 12', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
    tarde:    { label: 'Tarde',    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    excusa:   { label: 'Excusa',   icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
};

const diasSemana: Record<string, number> = {
    domingo: 0, lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6,
};

const diasLabel: Record<string, string> = {
    lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles', jueves: 'Jueves',
    viernes: 'Viernes', sabado: 'Sábado', domingo: 'Domingo',
};

function getDiaSemana(fecha: string): string {
    const d = new Date(fecha + 'T12:00:00');
    const map = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    return map[d.getDay()];
}

function formatFecha(fecha: string): string {
    const d = new Date(fecha + 'T12:00:00');
    return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatHora(hora: string): string {
    const [h, m] = hora.split(':');
    const hh = parseInt(h);
    const ampm = hh >= 12 ? 'PM' : 'AM';
    return `${hh > 12 ? hh - 12 : hh === 0 ? 12 : hh}:${m} ${ampm}`;
}

const csrfToken = () =>
    document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';

/* ══════════════════ Component ══════════════════ */

export default function Asistencias({ cursos, materias, cursoMaterias, bloques, periodos }: Props) {

    /* ── Filters ── */
    const [cursoSel, setCursoSel] = useState(cursos[0]?.id?.toString() ?? '');

    const [materiaSel, setMateriaSel] = useState(() => {
        const first = materias.find(m =>
            cursoMaterias.some(cm => cm.curso_id === cursos[0]?.id && cm.materia_id === m.id)
        );
        return first?.id?.toString() ?? '';
    });

    const [fechaSel, setFechaSel] = useState(() => {
        const now = new Date();
        return now.toISOString().slice(0, 10);
    });

    const [periodoSel, setPeriodoSel] = useState(() => {
        const active = periodos.find(p => p.estado === 'activo');
        return (active ?? periodos[0])?.id?.toString() ?? '';
    });

    /* ── View mode ── */
    const [vistaResumen, setVistaResumen] = useState(false);

    /* ── Data states ── */
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
    const [bloquesDelDia, setBloquesDelDia] = useState<BloqueDelDia[]>([]);
    const [registros, setRegistros] = useState<Record<string, RegistroAsistencia>>({});
    const [loading, setLoading] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    /* ── Resumen states ── */
    const [resumen, setResumen] = useState<ResumenEstudiante[]>([]);
    const [fechasRegistradas, setFechasRegistradas] = useState<string[]>([]);
    const [loadingResumen, setLoadingResumen] = useState(false);

    /* ── Unsaved changes ── */
    const [isDirty, setIsDirty] = useState(false);
    const isDirtyRef = useRef(false);
    useEffect(() => { isDirtyRef.current = isDirty; }, [isDirty]);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!isDirtyRef.current) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    useEffect(() => {
        const unsub = router.on('before', () => {
            if (!isDirtyRef.current) return;
            return window.confirm('Tienes asistencias sin guardar. ¿Seguro que quieres salir?');
        });
        return () => unsub();
    }, []);

    /* ── Observación popup ── */
    const [obsPopup, setObsPopup] = useState<{ key: string; nombre: string } | null>(null);

    /* ── Derived ── */
    const materiasDisponibles = useMemo(() =>
        materias.filter(m => cursoMaterias.some(cm => cm.curso_id === Number(cursoSel) && cm.materia_id === m.id)),
        [cursoSel, materias, cursoMaterias]
    );

    const cursoMateriaId = useMemo(() =>
        cursoMaterias.find(cm => cm.curso_id === Number(cursoSel) && cm.materia_id === Number(materiaSel))?.id,
        [cursoSel, materiaSel, cursoMaterias]
    );

    // Auto-select first materia when curso changes
    useEffect(() => {
        const first = materiasDisponibles[0];
        if (first && !materiasDisponibles.some(m => m.id === Number(materiaSel))) {
            setMateriaSel(first.id.toString());
        }
    }, [cursoSel, materiasDisponibles]);

    // Bloques from initial props for selected date & curso_materia
    const bloquesHoy = useMemo(() => {
        if (!cursoMateriaId) return [];
        const dia = getDiaSemana(fechaSel);
        return bloques
            .filter(b => b.curso_materia_id === cursoMateriaId && b.dia === dia)
            .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
    }, [cursoMateriaId, fechaSel, bloques]);

    const tieneClaseHoy = bloquesHoy.length > 0;

    // Check if date is in the selected period
    const periodoActual = useMemo(() => periodos.find(p => p.id === Number(periodoSel)), [periodoSel, periodos]);

    const fechaEnPeriodo = useMemo(() => {
        if (!periodoActual) return false;
        return fechaSel >= periodoActual.fecha_inicio && fechaSel <= periodoActual.fecha_fin;
    }, [fechaSel, periodoActual]);

    /* ── Guard filter changes ── */
    const guardedChange = (change: () => void) => {
        if (isDirtyRef.current) {
            if (!window.confirm('Tienes cambios sin guardar. ¿Seguro que quieres cambiar? Se perderán los cambios.')) return;
            setIsDirty(false);
        }
        change();
    };

    /* ── Load attendance data ── */
    const cargarDatos = useCallback(() => {
        if (!cursoMateriaId) return;
        setLoading(true);
        setRegistros({});
        setEstudiantes([]);
        setBloquesDelDia([]);
        setErrorMsg(null);

        fetch(`/profesor/asistencias/datos?curso_materia_id=${cursoMateriaId}&fecha=${fechaSel}`)
            .then(r => { if (!r.ok) throw new Error('Error cargando datos'); return r.json(); })
            .then((data: { estudiantes: Estudiante[]; asistencias: any[]; bloquesDelDia: BloqueDelDia[]; totalClases: number }) => {
                setEstudiantes(data.estudiantes);
                setBloquesDelDia(data.bloquesDelDia);

                // Build register map
                const regs: Record<string, RegistroAsistencia> = {};
                data.asistencias.forEach((a: any) => {
                    const key = `${a.estudiante_id}-${a.horario_bloque_id ?? 0}`;
                    regs[key] = {
                        id: a.id,
                        estudiante_id: a.estudiante_id,
                        horario_bloque_id: a.horario_bloque_id,
                        estado: a.estado,
                        observacion: a.observacion ?? '',
                    };
                });

                // For students without records, default to 'presente'
                const activeBloques = data.bloquesDelDia.length > 0 ? data.bloquesDelDia : [{ id: 0, hora_inicio: '', hora_fin: '', salon: null }];
                data.estudiantes.forEach(est => {
                    activeBloques.forEach(bl => {
                        const key = `${est.id}-${bl.id}`;
                        if (!regs[key]) {
                            regs[key] = {
                                estudiante_id: est.id,
                                horario_bloque_id: bl.id === 0 ? null : bl.id,
                                estado: 'presente',
                                observacion: '',
                            };
                        }
                    });
                });
                setRegistros(regs);
                setIsDirty(false);
            })
            .catch(e => setErrorMsg(e.message))
            .finally(() => setLoading(false));
    }, [cursoMateriaId, fechaSel]);

    useEffect(() => {
        if (!vistaResumen) cargarDatos();
    }, [cargarDatos, vistaResumen]);

    /* ── Load resumen data ── */
    const cargarResumen = useCallback(() => {
        if (!cursoMateriaId) return;
        setLoadingResumen(true);
        fetch(`/profesor/asistencias/resumen?curso_materia_id=${cursoMateriaId}&periodo_id=${periodoSel}`)
            .then(r => { if (!r.ok) throw new Error('Error'); return r.json(); })
            .then((data: { stats: ResumenEstudiante[]; fechasRegistradas: string[] }) => {
                setResumen(data.stats);
                setFechasRegistradas(data.fechasRegistradas);
            })
            .catch(() => setErrorMsg('Error cargando resumen'))
            .finally(() => setLoadingResumen(false));
    }, [cursoMateriaId, periodoSel]);

    useEffect(() => {
        if (vistaResumen) cargarResumen();
    }, [cargarResumen, vistaResumen]);

    /* ── Update a student's state ── */
    const setEstado = (key: string, estado: Estado) => {
        setIsDirty(true);
        setRegistros(prev => ({ ...prev, [key]: { ...prev[key], estado } }));
    };

    const setObservacion = (key: string, obs: string) => {
        setIsDirty(true);
        setRegistros(prev => ({ ...prev, [key]: { ...prev[key], observacion: obs } }));
    };

    /* ── Cycle through states (quick click) ── */
    const cycleEstado = (key: string) => {
        const current = registros[key]?.estado ?? 'presente';
        const idx = ESTADOS.indexOf(current);
        const next = ESTADOS[(idx + 1) % ESTADOS.length];
        setEstado(key, next);
    };

    /* ── Bulk actions ── */
    const marcarTodos = (estado: Estado, bloqueId: number | null) => {
        setIsDirty(true);
        setRegistros(prev => {
            const copy = { ...prev };
            const bId = bloqueId ?? 0;
            estudiantes.forEach(est => {
                const key = `${est.id}-${bId}`;
                if (copy[key]) copy[key] = { ...copy[key], estado };
            });
            return copy;
        });
    };

    /* ── Save attendance ── */
    const guardarAsistencia = () => {
        if (!cursoMateriaId) return;
        setGuardando(true);
        setErrorMsg(null);

        const regs = Object.values(registros).map(r => ({
            estudiante_id: r.estudiante_id,
            horario_bloque_id: r.horario_bloque_id,
            estado: r.estado,
            observacion: r.observacion || null,
        }));

        fetch('/profesor/asistencias', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                curso_materia_id: cursoMateriaId,
                fecha: fechaSel,
                registros: regs,
            }),
        })
            .then(r => {
                if (!r.ok) return r.json().then(d => { throw new Error(d.message || 'Error al guardar'); });
                return r.text();
            })
            .then(() => {
                setIsDirty(false);
                setSuccessMsg('Asistencia guardada correctamente.');
                setTimeout(() => setSuccessMsg(null), 3500);
                cargarDatos();
            })
            .catch(e => setErrorMsg(e.message))
            .finally(() => setGuardando(false));
    };

    /* ── Stats for current view ── */
    const statsHoy = useMemo(() => {
        const vals = Object.values(registros);
        return {
            total: vals.length,
            presentes: vals.filter(r => r.estado === 'presente').length,
            ausentes: vals.filter(r => r.estado === 'ausente').length,
            tardes: vals.filter(r => r.estado === 'tarde').length,
            excusas: vals.filter(r => r.estado === 'excusa').length,
        };
    }, [registros]);

    /* ── Quick navigation ── */
    const navigateDate = (offset: number) => {
        guardedChange(() => {
            const d = new Date(fechaSel + 'T12:00:00');
            d.setDate(d.getDate() + offset);
            setFechaSel(d.toISOString().slice(0, 10));
        });
    };

    const materiaNombre = materias.find(m => m.id === Number(materiaSel))?.nombre || 'Materia';
    const cursoNombre = cursos.find(c => c.id === Number(cursoSel))?.nombre || 'Curso';

    // Active bloques to show (from server response, or from props if no data loaded yet)
    const activeBloques = bloquesDelDia.length > 0 ? bloquesDelDia : (bloquesHoy.length > 0 ? bloquesHoy.map(b => ({ id: b.id, hora_inicio: b.hora_inicio, hora_fin: b.hora_fin, salon: b.salon })) : []);
    const hasBloques = activeBloques.length > 0;

    // Schedules for the week for the selected curso_materia
    const horarioSemanal = useMemo(() => {
        if (!cursoMateriaId) return [];
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
        return dias.map(dia => ({
            dia,
            label: diasLabel[dia],
            bloques: bloques
                .filter(b => b.curso_materia_id === cursoMateriaId && b.dia === dia)
                .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)),
        })).filter(d => d.bloques.length > 0);
    }, [cursoMateriaId, bloques]);

    /* ══════════════════ Render ══════════════════ */

    return (
        <SidebarLayout menuItems={profesorMenuItems}>
            <Head title="Asistencias" />

            <div className="max-w-7xl mx-auto space-y-5">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Control de Asistencias</h1>
                            {isDirty && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200 animate-pulse">
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                                    Sin guardar
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{materiaNombre} — {cursoNombre}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View toggle */}
                        <div className="flex bg-gray-100 rounded-xl p-0.5">
                            <button
                                onClick={() => { guardedChange(() => setVistaResumen(false)); }}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${!vistaResumen ? 'bg-white text-[#293577] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Registro
                            </button>
                            <button
                                onClick={() => { guardedChange(() => setVistaResumen(true)); }}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${vistaResumen ? 'bg-white text-[#293577] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Resumen
                            </button>
                        </div>

                        {/* Save button */}
                        {!vistaResumen && cursoMateriaId && estudiantes.length > 0 && (
                            <button
                                onClick={guardarAsistencia}
                                disabled={guardando}
                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm ${
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
                                        {isDirty ? 'Guardar Cambios' : 'Guardar'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Dirty banner ── */}
                {isDirty && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 text-amber-800">
                            <svg className="w-4 h-4 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
                            <span className="text-sm font-semibold">Tienes asistencias sin guardar.</span>
                        </div>
                        <button
                            onClick={guardarAsistencia}
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

                        {!vistaResumen ? (
                            /* Fecha (modo registro) */
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Fecha</label>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => navigateDate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Día anterior">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <input
                                        type="date"
                                        value={fechaSel}
                                        onChange={e => { const v = e.target.value; guardedChange(() => setFechaSel(v)); }}
                                        className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] transition-colors"
                                    />
                                    <button onClick={() => navigateDate(1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors" title="Día siguiente">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                    <button onClick={() => guardedChange(() => setFechaSel(new Date().toISOString().slice(0, 10)))}
                                        className="px-2.5 py-2 rounded-lg text-xs font-bold text-[#293577] hover:bg-[#293577]/5 transition-colors"
                                        title="Ir a hoy">
                                        Hoy
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Periodo (modo resumen) */
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-0.5">Periodo</label>
                                <select value={periodoSel} onChange={e => setPeriodoSel(e.target.value)}
                                    className="border border-gray-200 bg-white rounded-xl px-3 py-2 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] transition-colors min-w-[160px]">
                                    {periodos.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nombre}{p.estado === 'activo' ? ' ✓' : p.estado === 'finalizado' ? ' (Cerrado)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                    </div>

                    {/* ── Date context info ── */}
                    {!vistaResumen && cursoMateriaId && (
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                            <span className="text-sm text-gray-600 font-medium capitalize">{formatFecha(fechaSel)}</span>
                            {tieneClaseHoy ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    {bloquesHoy.length} {bloquesHoy.length === 1 ? 'bloque' : 'bloques'} de clase
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold border border-gray-200">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01" /></svg>
                                    Sin horario programado
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Weekly schedule pill ── */}
                {!vistaResumen && cursoMateriaId && horarioSemanal.length > 0 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-[#293577]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Horario Semanal
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {horarioSemanal.map(d => {
                                const isToday = getDiaSemana(fechaSel) === d.dia;
                                return (
                                    <div key={d.dia}
                                        className={`rounded-xl border px-3 py-2 text-xs transition-all cursor-pointer ${
                                            isToday
                                                ? 'bg-[#293577]/5 border-[#293577]/30 ring-1 ring-[#293577]/20'
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                        }`}
                                        onClick={() => {
                                            // Jump to this day in the current week
                                            const currentDate = new Date(fechaSel + 'T12:00:00');
                                            const currentDay = currentDate.getDay();
                                            const targetDay = diasSemana[d.dia];
                                            const diff = targetDay - currentDay;
                                            const newDate = new Date(currentDate);
                                            newDate.setDate(newDate.getDate() + diff);
                                            guardedChange(() => setFechaSel(newDate.toISOString().slice(0, 10)));
                                        }}
                                    >
                                        <span className={`font-bold ${isToday ? 'text-[#293577]' : 'text-gray-700'}`}>{d.label}</span>
                                        <div className="mt-1 space-y-0.5">
                                            {d.bloques.map(b => (
                                                <div key={b.id} className="text-gray-500">
                                                    {formatHora(b.hora_inicio)} - {formatHora(b.hora_fin)}
                                                    {b.salon && <span className="text-gray-400 ml-1">({b.salon})</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ═══════════════ REGISTRO VIEW ═══════════════ */}
                {!vistaResumen && (
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
                                <p className="text-gray-400 text-sm font-medium">Selecciona un curso y materia</p>
                            </div>
                        ) : estudiantes.length === 0 ? (
                            <div className="p-12 text-center">
                                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <p className="text-gray-400 text-sm font-medium">No hay estudiantes matriculados</p>
                            </div>
                        ) : (
                            <>
                                {/* ── Stats bar ── */}
                                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Resumen:</span>
                                        <div className="flex flex-wrap gap-2">
                                            {(['presente', 'ausente', 'tarde', 'excusa'] as Estado[]).map(e => {
                                                const count = e === 'presente' ? statsHoy.presentes : e === 'ausente' ? statsHoy.ausentes : e === 'tarde' ? statsHoy.tardes : statsHoy.excusas;
                                                return (
                                                    <span key={e} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${estadoConfig[e].bg} ${estadoConfig[e].color} ${estadoConfig[e].border}`}>
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={estadoConfig[e].icon} /></svg>
                                                        {count}
                                                    </span>
                                                );
                                            })}
                                            {statsHoy.total > 0 && (
                                                <span className="text-xs text-gray-400 font-medium self-center">
                                                    ({Math.round(((statsHoy.presentes + statsHoy.tardes) / statsHoy.total) * 100)}% asistencia)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ── Bloques loop ── */}
                                {(hasBloques ? activeBloques : [{ id: 0, hora_inicio: '', hora_fin: '', salon: null }]).map((bloque) => (
                                    <div key={bloque.id}>
                                        {/* Bloque header */}
                                        {hasBloques && (
                                            <div className="bg-[#293577]/5 border-b border-[#293577]/10 px-4 py-2.5 flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <svg className="w-4 h-4 text-[#293577]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    <span className="text-sm font-bold text-[#293577]">
                                                        {formatHora(bloque.hora_inicio)} — {formatHora(bloque.hora_fin)}
                                                    </span>
                                                    {bloque.salon && (
                                                        <span className="text-xs text-gray-500 font-medium">Salón: {bloque.salon}</span>
                                                    )}
                                                </div>
                                                {/* Quick mark all buttons */}
                                                <div className="flex items-center gap-1">
                                                    <span className="text-[10px] text-gray-400 font-semibold uppercase mr-1">Todos:</span>
                                                    {ESTADOS.map(e => (
                                                        <button
                                                            key={e}
                                                            onClick={() => marcarTodos(e, bloque.id === 0 ? null : bloque.id)}
                                                            className={`p-1.5 rounded-lg transition-colors ${estadoConfig[e].bg} ${estadoConfig[e].color} hover:ring-2 hover:ring-gray-300`}
                                                            title={`Marcar todos como ${estadoConfig[e].label}`}
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={estadoConfig[e].icon} /></svg>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Student rows */}
                                        <div className="divide-y divide-gray-100">
                                            {estudiantes.map((est, idx) => {
                                                const key = `${est.id}-${bloque.id}`;
                                                const reg = registros[key];
                                                if (!reg) return null;
                                                const estado = reg.estado;
                                                const conf = estadoConfig[estado];

                                                return (
                                                    <div
                                                        key={key}
                                                        className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30`}
                                                    >
                                                        {/* Avatar + name */}
                                                        <div className="flex items-center gap-2.5 min-w-[180px] flex-1">
                                                            <div className="w-8 h-8 rounded-full bg-[#293577]/10 flex items-center justify-center text-xs font-bold text-[#293577] flex-shrink-0">
                                                                {est.nombre.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-gray-800 truncate">{est.nombre}</p>
                                                                {est.documento && <p className="text-[10px] text-gray-400">{est.documento}</p>}
                                                            </div>
                                                        </div>

                                                        {/* Estado buttons */}
                                                        <div className="flex items-center gap-1.5">
                                                            {ESTADOS.map(e => {
                                                                const c = estadoConfig[e];
                                                                const active = estado === e;
                                                                return (
                                                                    <button
                                                                        key={e}
                                                                        onClick={() => setEstado(key, e)}
                                                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                                                            active
                                                                                ? `${c.bg} ${c.color} ${c.border} ring-1 ring-offset-1 ${c.border}`
                                                                                : 'bg-white border-gray-200 text-gray-400 hover:bg-gray-50'
                                                                        }`}
                                                                        title={c.label}
                                                                    >
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={c.icon} /></svg>
                                                                        <span className="hidden sm:inline">{c.label}</span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Observation button */}
                                                        <button
                                                            onClick={() => setObsPopup(obsPopup?.key === key ? null : { key, nombre: est.nombre })}
                                                            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                                                                reg.observacion
                                                                    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                                    : 'text-gray-300 hover:text-gray-500 hover:bg-gray-100'
                                                            }`}
                                                            title={reg.observacion || 'Agregar observación'}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}

                                {/* Observation popup */}
                                {obsPopup && (
                                    <div className="border-t border-gray-200 bg-blue-50/40 px-4 py-3">
                                        <div className="max-w-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-gray-600">
                                                    Observación — {obsPopup.nombre}
                                                </span>
                                                <button onClick={() => setObsPopup(null)} className="text-gray-400 hover:text-gray-600">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>
                                            <textarea
                                                value={registros[obsPopup.key]?.observacion ?? ''}
                                                onChange={e => setObservacion(obsPopup.key, e.target.value)}
                                                placeholder="Ej: Llegó 10 minutos tarde por cita médica..."
                                                rows={2}
                                                maxLength={500}
                                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] transition-colors resize-none"
                                            />
                                            <p className="text-[10px] text-gray-400 mt-1 text-right">
                                                {(registros[obsPopup.key]?.observacion ?? '').length}/500
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ═══════════════ RESUMEN VIEW ═══════════════ */}
                {vistaResumen && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        {loadingResumen ? (
                            <div className="p-12 text-center">
                                <div className="inline-flex items-center gap-3 text-gray-400">
                                    <div className="w-5 h-5 border-2 border-gray-300 border-t-[#293577] rounded-full animate-spin" />
                                    <span className="text-sm font-medium">Cargando resumen...</span>
                                </div>
                            </div>
                        ) : !cursoMateriaId ? (
                            <div className="p-12 text-center">
                                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                                <p className="text-gray-400 text-sm font-medium">Selecciona un curso y materia</p>
                            </div>
                        ) : resumen.length === 0 ? (
                            <div className="p-12 text-center">
                                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                <p className="text-gray-400 text-sm font-medium">No hay registros de asistencia en este periodo</p>
                                <p className="text-xs text-gray-300 mt-1">{fechasRegistradas.length} fecha(s) con registro</p>
                            </div>
                        ) : (
                            <>
                                {/* Resumen header with period stats */}
                                <div className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200 px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            {fechasRegistradas.length} día(s) registrado(s)
                                        </span>
                                        {periodoActual && (
                                            <span className="text-xs text-gray-400">
                                                {periodoActual.nombre}: {periodoActual.fecha_inicio} → {periodoActual.fecha_fin}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Summary table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[700px]">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-slate-50 to-gray-50">
                                                <th className="text-left px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider border-b border-gray-200 sticky left-0 bg-slate-50 z-10 min-w-[200px]">
                                                    Estudiante
                                                </th>
                                                <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider border-b border-gray-200 text-emerald-700">
                                                    <div className="flex flex-col items-center">
                                                        <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                        Presentes
                                                    </div>
                                                </th>
                                                <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider border-b border-gray-200 text-red-700">
                                                    <div className="flex flex-col items-center">
                                                        <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        Ausentes
                                                    </div>
                                                </th>
                                                <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider border-b border-gray-200 text-amber-700">
                                                    <div className="flex flex-col items-center">
                                                        <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        Tardes
                                                    </div>
                                                </th>
                                                <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider border-b border-gray-200 text-blue-700">
                                                    <div className="flex flex-col items-center">
                                                        <svg className="w-4 h-4 mb-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        Excusas
                                                    </div>
                                                </th>
                                                <th className="text-center px-3 py-3 font-bold text-xs uppercase tracking-wider border-b border-gray-200 text-gray-700 min-w-[120px]">
                                                    % Asistencia
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {resumen.map((r, idx) => {
                                                const est = estudiantes.find(e => e.id === r.estudiante_id);
                                                const porcentaje = r.porcentaje;
                                                const barColor = porcentaje >= 80 ? 'bg-emerald-500' : porcentaje >= 60 ? 'bg-amber-500' : 'bg-red-500';
                                                const textColor = porcentaje >= 80 ? 'text-emerald-700' : porcentaje >= 60 ? 'text-amber-700' : 'text-red-700';

                                                return (
                                                    <tr key={r.estudiante_id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/30 transition-colors`}>
                                                        <td className={`px-4 py-3 border-b border-gray-100 sticky left-0 z-10 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-7 h-7 rounded-full bg-[#293577]/10 flex items-center justify-center text-xs font-bold text-[#293577]">
                                                                    {est?.nombre?.charAt(0)?.toUpperCase() || '?'}
                                                                </div>
                                                                <span className="text-sm font-medium text-gray-800 truncate">{est?.nombre || `ID: ${r.estudiante_id}`}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-3 text-center border-b border-gray-100">
                                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-bold">
                                                                {r.presentes}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 text-center border-b border-gray-100">
                                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${r.ausentes > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-300'}`}>
                                                                {r.ausentes}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 text-center border-b border-gray-100">
                                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${r.tardes > 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-300'}`}>
                                                                {r.tardes}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 text-center border-b border-gray-100">
                                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${r.excusas > 0 ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-300'}`}>
                                                                {r.excusas}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-3 text-center border-b border-gray-100">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className={`text-sm font-extrabold ${textColor}`}>{porcentaje}%</span>
                                                                <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(100, porcentaje)}%` }} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ── Bottom save bar (mobile) ── */}
                {!vistaResumen && cursoMateriaId && estudiantes.length > 0 && (
                    <div className="sm:hidden sticky bottom-4">
                        <button
                            onClick={guardarAsistencia}
                            disabled={guardando}
                            className="w-full bg-[#293577] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#181b49] disabled:opacity-40 transition-colors shadow-lg flex items-center justify-center gap-2"
                        >
                            {guardando ? (
                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Guardar Asistencia
                                </>
                            )}
                        </button>
                    </div>
                )}

            </div>
        </SidebarLayout>
    );
}
