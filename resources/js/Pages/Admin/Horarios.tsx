import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

/* ═══════════════════════════ INTERFACES ═══════════════════════════ */
interface Clase {
    id: number;
    curso_materia_id: number;
    materia: string;
    materia_id: number;
    curso: string;
    curso_id: number;
    profesor: string;
    profesor_id: number | null;
    aula: string;
    dia: string;
    hora: string;
    horaFin: string;
}

interface ProfesorBackend {
    id: number;
    nombre: string;
    especialidad: string;
    materias: string[];
    cursos: string[];
    horasSemanales: number;
    maxHoras: number;
    email: string;
    telefono: string;
}

interface Profesor extends ProfesorBackend {
    foto: string;
    color: string;
    colorBg: string;
    colorBorder: string;
    colorText: string;
}

interface HorarioBackend {
    id: number;
    curso_materia_id: number;
    curso: string;
    curso_id: number;
    materia: string;
    materia_id: number;
    profesor: string;
    profesor_id: number | null;
    dia: string;
    hora: string;
    horaFin: string;
    salon: string;
}

interface CursoMateriaBackend {
    id: number;
    curso_id: number;
    curso: string;
    materia_id: number;
    materia: string;
    profesor_id: number | null;
    profesor: string | null;
}

type DiaKey = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';

interface HorarioSlot {
    hora: string;
    horaFin: string;
    esDescanso?: boolean;
    clases: Partial<Record<DiaKey, Clase>>;
}

/** Para la vista general: varias clases por franja horaria y día */
interface HorarioSlotMulti {
    hora: string;
    horaFin: string;
    esDescanso?: boolean;
    clases: Partial<Record<DiaKey, Clase[]>>;
}

interface Props {
    profesores: ProfesorBackend[];
    horarios: HorarioBackend[];
    cursos: { id: number; nombre: string }[];
    materias: { id: number; nombre: string }[];
    cursoMaterias: CursoMateriaBackend[];
    anioVigente: number;
}

/* ═══════════════════════════ CONSTANTES ═══════════════════════════ */
const profesorColors = [
    { color: 'blue', colorBg: 'bg-blue-50', colorBorder: 'border-blue-200', colorText: 'text-blue-700' },
    { color: 'green', colorBg: 'bg-green-50', colorBorder: 'border-green-200', colorText: 'text-green-700' },
    { color: 'purple', colorBg: 'bg-purple-50', colorBorder: 'border-purple-200', colorText: 'text-purple-700' },
    { color: 'orange', colorBg: 'bg-amber-50', colorBorder: 'border-amber-200', colorText: 'text-amber-700' },
    { color: 'red', colorBg: 'bg-red-50', colorBorder: 'border-red-200', colorText: 'text-red-700' },
    { color: 'teal', colorBg: 'bg-teal-50', colorBorder: 'border-teal-200', colorText: 'text-teal-700' },
    { color: 'pink', colorBg: 'bg-pink-50', colorBorder: 'border-pink-200', colorText: 'text-pink-700' },
    { color: 'lime', colorBg: 'bg-lime-50', colorBorder: 'border-lime-200', colorText: 'text-lime-700' },
    { color: 'rose', colorBg: 'bg-rose-50', colorBorder: 'border-rose-200', colorText: 'text-rose-700' },
    { color: 'violet', colorBg: 'bg-violet-50', colorBorder: 'border-violet-200', colorText: 'text-violet-700' },
    { color: 'indigo', colorBg: 'bg-indigo-50', colorBorder: 'border-indigo-200', colorText: 'text-indigo-700' },
    { color: 'cyan', colorBg: 'bg-cyan-50', colorBorder: 'border-cyan-200', colorText: 'text-cyan-700' },
];

const DEFAULT_TIME_SLOTS = [
    { hora: '7:00', horaFin: '7:50' },
    { hora: '7:50', horaFin: '8:40' },
    { hora: '8:40', horaFin: '9:30' },
    { hora: '9:30', horaFin: '10:00', esDescanso: true },
    { hora: '10:00', horaFin: '10:50' },
    { hora: '10:50', horaFin: '11:40' },
    { hora: '11:40', horaFin: '12:00', esDescanso: true },
    { hora: '12:00', horaFin: '12:50' },
    { hora: '12:50', horaFin: '13:40' },
];

const dias: { key: DiaKey; label: string }[] = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
];

const EMPTY_FORM = { curso_materia_id: '', dia: 'lunes' as string, hora_inicio: '7:00', hora_fin: '7:50', salon: '' };

const SearchIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

/* ═══════════════════════════ COMPONENT ═══════════════════════════ */
export default function Horarios({ profesores: profesoresRaw, horarios, cursos, materias, cursoMaterias, anioVigente }: Props) {
    /* ── Vista ── */
    const [vistaActiva, setVistaActiva] = useState<'general' | 'profesor' | 'curso'>('general');
    const [profesorSeleccionado, setProfesorSeleccionado] = useState('');
    const [cursoSeleccionado, setCursoSeleccionado] = useState('');
    const [searchProfesor, setSearchProfesor] = useState('');

    /* ── Jornada configurable ── */
    const [customSlots, setCustomSlots] = useState(DEFAULT_TIME_SLOTS);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [configSlots, setConfigSlots] = useState(DEFAULT_TIME_SLOTS);

    /* ── CRUD Modal ── */
    const [showModal, setShowModal] = useState(false);
    const [editingClase, setEditingClase] = useState<Clase | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [formFilterCurso, setFormFilterCurso] = useState('');
    /** Cuando está en vista "Por Profesor" bloqueamos el formulario al profesor seleccionado */
    const [formFilterProfesor, setFormFilterProfesor] = useState('');
    /** Cuando está en vista "Por Curso" bloqueamos el formulario al curso seleccionado */
    const [formCursoLocked, setFormCursoLocked] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);

    /* ── Detalle modals ── */
    const [claseDetalle, setClaseDetalle] = useState<Clase | null>(null);
    const [profesorDetalle, setProfesorDetalle] = useState<Profesor | null>(null);

    /* ── Delete modal ── */
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingClase, setDeletingClase] = useState<Clase | null>(null);

    /* ── Slot expandido (vista general: ver todas las clases de una celda) ── */
    const [slotExpandido, setSlotExpandido] = useState<{ hora: string; horaFin: string; dia: string; clases: Clase[] } | null>(null);

    /* ── Profesores enriquecidos ── */
    const profesores: Profesor[] = useMemo(() => profesoresRaw.map((p, i) => {
        const c = profesorColors[i % profesorColors.length];
        const initials = p.nombre.split(' ').map(n => n[0]).join('').slice(0, 2);
        return { ...p, foto: initials, ...c };
    }), [profesoresRaw]);

    const profesorColorMap = useMemo(() => {
        const map: Record<string, { bg: string; border: string; text: string }> = {};
        profesores.forEach(p => { map[p.nombre] = { bg: p.colorBg, border: p.colorBorder, text: p.colorText }; });
        return map;
    }, [profesores]);

    /* ── Grid data (vista general — múltiples clases por celda) ── */
    /* Normaliza '07:00' → '7:00' como safety net ante datos legacy */
    const normalizeHora = (h: string) => h.replace(/^0(\d):/, '$1:');

    const horarioData: HorarioSlotMulti[] = useMemo(() => {
        const descansoHoras = new Set(customSlots.filter(s => s.esDescanso).map(s => s.hora));
        return customSlots.map(slot => {
            if (slot.esDescanso) return { hora: slot.hora, horaFin: slot.horaFin, esDescanso: true as const, clases: {} };
            const clases: Partial<Record<DiaKey, Clase[]>> = {};
            horarios.forEach(h => {
                const hn = normalizeHora(h.hora);
                if (!descansoHoras.has(hn) && hn === slot.hora && dias.some(d => d.key === h.dia)) {
                    const dia = h.dia as DiaKey;
                    if (!clases[dia]) clases[dia] = [];
                    clases[dia]!.push({
                        id: h.id, curso_materia_id: h.curso_materia_id,
                        materia: h.materia, materia_id: h.materia_id,
                        curso: h.curso, curso_id: h.curso_id,
                        profesor: h.profesor, profesor_id: h.profesor_id,
                        aula: h.salon ?? '', dia: h.dia,
                        hora: hn, horaFin: h.horaFin,
                    });
                }
            });
            return { hora: slot.hora, horaFin: slot.horaFin, clases };
        });
    }, [horarios, customSlots]);

    /* allClases: directamente del prop, excluyendo cualquier entrada en horario de descanso */
    const allClases = useMemo<Clase[]>(() => {
        const descansoHoras = new Set(customSlots.filter(s => s.esDescanso).map(s => s.hora));
        return horarios
            .filter(h => !descansoHoras.has(normalizeHora(h.hora)))
            .map(h => ({
                id: h.id, curso_materia_id: h.curso_materia_id,
                materia: h.materia, materia_id: h.materia_id,
                curso: h.curso, curso_id: h.curso_id,
                profesor: h.profesor, profesor_id: h.profesor_id,
                aula: h.salon ?? '', dia: h.dia,
                hora: h.hora, horaFin: h.horaFin,
            }));
    }, [horarios, customSlots]);

    const stats = useMemo(() => {
        const bloquesPosibles = customSlots.filter(s => !s.esDescanso).length * 5;
        return {
            totalClases: allClases.length,
            totalProfesores: profesores.length,
            horasTotales: profesores.reduce((a, p) => a + p.horasSemanales, 0),
            disponibilidad: bloquesPosibles > 0 ? Math.round((1 - allClases.length / bloquesPosibles) * 100) : 100,
            totalCursos: cursos.length,
            cursosConClases: new Set(allClases.map(c => c.curso_id)).size,
        };
    }, [allClases, profesores, customSlots, cursos]);

    const filteredProfesores = useMemo(() => {
        if (!searchProfesor) return profesores;
        const s = searchProfesor.toLowerCase();
        return profesores.filter(p =>
            p.nombre.toLowerCase().includes(s) || p.especialidad.toLowerCase().includes(s) || p.materias.some(m => m.toLowerCase().includes(s))
        );
    }, [searchProfesor, profesores]);

    /* ── Helpers vista — construyen grid propio filtrando desde el prop de horarios ── */
    const buildSlotGrid = (filtered: typeof horarios) => {
        const descansoHoras = new Set(customSlots.filter(s => s.esDescanso).map(s => s.hora));
        return customSlots.map(slot => {
            if (slot.esDescanso) return { hora: slot.hora, horaFin: slot.horaFin, esDescanso: true as const, clases: {} };
            const clases: Partial<Record<DiaKey, Clase>> = {};
            filtered.forEach(h => {
                const horaNorm = normalizeHora(h.hora);
                if (!descansoHoras.has(horaNorm) && horaNorm === slot.hora && dias.some(d => d.key === h.dia)) {
                    clases[h.dia as DiaKey] = {
                        id: h.id, curso_materia_id: h.curso_materia_id,
                        materia: h.materia, materia_id: h.materia_id,
                        curso: h.curso, curso_id: h.curso_id,
                        profesor: h.profesor, profesor_id: h.profesor_id,
                        aula: h.salon ?? '', dia: h.dia,
                        hora: h.hora, horaFin: h.horaFin,
                    };
                }
            });
            return { hora: slot.hora, horaFin: slot.horaFin, clases };
        });
    };

    const getHorarioProfesor = (nombre: string) =>
        buildSlotGrid(horarios.filter(h => h.profesor === nombre));

    const getHorarioCurso = (curso: string) =>
        buildSlotGrid(horarios.filter(h => h.curso === curso));

    const getClaseColor = (profesor: string) => {
        const c = profesorColorMap[profesor];
        return c ? `${c.bg} ${c.border} border` : 'bg-gray-50 border border-gray-200';
    };

    const getCargaLabel = (horas: number, max: number) => {
        const pct = (horas / max) * 100;
        if (pct >= 95) return { label: 'Completa', color: 'text-red-600', bg: 'bg-red-500', badge: 'bg-red-100 text-red-700' };
        if (pct >= 75) return { label: 'Alta', color: 'text-amber-600', bg: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700' };
        if (pct >= 50) return { label: 'Media', color: 'text-blue-600', bg: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' };
        return { label: 'Baja', color: 'text-emerald-600', bg: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' };
    };

    const displayHorario = vistaActiva === 'profesor' && profesorSeleccionado
        ? getHorarioProfesor(profesorSeleccionado)
        : vistaActiva === 'curso' && cursoSeleccionado
            ? getHorarioCurso(cursoSeleccionado)
            : horarioData;

    const getDisplayTitle = () => {
        if (vistaActiva === 'profesor' && profesorSeleccionado) return `Horario de ${profesorSeleccionado}`;
        if (vistaActiva === 'curso' && cursoSeleccionado) return `Horario del curso ${cursoSeleccionado}`;
        return 'Horario General — Todos los cursos';
    };

    /* ═══════════════════════════ CRUD HANDLERS ═══════════════════════════ */
    const openCreate = (dia?: DiaKey, hora?: string) => {
        const slot = customSlots.find(s => s.hora === hora);
        setEditingClase(null);
        setForm({ ...EMPTY_FORM, dia: dia ?? 'lunes', hora_inicio: hora ?? customSlots[0]?.hora ?? '7:00', hora_fin: slot?.horaFin ?? customSlots[0]?.horaFin ?? '7:50' });

        // Pre-seleccionar y bloquear contexto según la vista activa
        if (vistaActiva === 'curso' && cursoSeleccionado) {
            const c = cursos.find(c => c.nombre === cursoSeleccionado);
            setFormFilterCurso(c ? String(c.id) : '');
            setFormCursoLocked(true);          // bloquear curso
            setFormFilterProfesor('');          // sin restricción de profesor
        } else if (vistaActiva === 'profesor' && profesorSeleccionado) {
            const prof = profesores.find(p => p.nombre === profesorSeleccionado);
            setFormFilterProfesor(profesorSeleccionado); // bloquear profesor
            setFormCursoLocked(false);
            const profCMs = prof ? cursoMaterias.filter(cm => cm.profesor_id === prof.id) : [];
            setFormFilterCurso(profCMs.length > 0 ? String(profCMs[0].curso_id) : '');
        } else {
            setFormFilterCurso('');
            setFormFilterProfesor('');
            setFormCursoLocked(false);
        }
        setFormErrors({});
        setShowModal(true);
    };

    const openEdit = (clase: Clase) => {
        setEditingClase(clase);
        setFormFilterCurso(String(clase.curso_id));
        // En edición no bloqueamos — mostramos el CM ya guardado
        setFormFilterProfesor('');
        setFormCursoLocked(false);
        setForm({
            curso_materia_id: String(clase.curso_materia_id),
            dia: clase.dia,
            hora_inicio: clase.hora,
            hora_fin: clase.horaFin,
            salon: clase.aula,
        });
        setFormErrors({});
        setShowModal(true);
    };

    const openDeleteModal = (clase: Clase) => {
        setDeletingClase(clase);
        setShowDeleteModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setFormErrors({});

        const payload = {
            curso_materia_id: parseInt(form.curso_materia_id),
            dia: form.dia,
            hora_inicio: form.hora_inicio,
            hora_fin: form.hora_fin,
            salon: form.salon || null,
        };

        // ── Validación frontend de conflictos ─────────────────────────
        const cm = cursoMaterias.find(c => c.id === payload.curso_materia_id);
        const horaNorm = normalizeHora(payload.hora_inicio);

        if (cm) {
            // 1) Mismo curso, mismo día, misma hora (excluyendo el bloque que se edita)
            const conflictoCurso = allClases.find(c =>
                c.curso_id === cm.curso_id &&
                c.dia === payload.dia &&
                normalizeHora(c.hora) === horaNorm &&
                c.id !== editingClase?.id
            );
            if (conflictoCurso) {
                setFormErrors({ hora_inicio: `El curso ya tiene "${conflictoCurso.materia}" asignada el ${payload.dia} a las ${horaNorm}.` });
                setProcessing(false);
                return;
            }

            // 2) Mismo profesor, mismo día, misma hora
            const conflictoProfesor = allClases.find(c =>
                c.profesor_id === cm.profesor_id &&
                c.dia === payload.dia &&
                normalizeHora(c.hora) === horaNorm &&
                c.id !== editingClase?.id
            );
            if (conflictoProfesor) {
                setFormErrors({ hora_inicio: `El profesor ya tiene "${conflictoProfesor.materia}" en ${conflictoProfesor.curso} el ${payload.dia} a las ${horaNorm}.` });
                setProcessing(false);
                return;
            }
        }
        // ──────────────────────────────────────────────────────────────

        if (editingClase) {
            router.put(`/admin/horarios/${editingClase.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => { setShowModal(false); setProcessing(false); },
                onError: (errs) => { setFormErrors(errs as Record<string, string>); setProcessing(false); },
            });
        } else {
            router.post('/admin/horarios', payload, {
                preserveScroll: true,
                onSuccess: () => { setShowModal(false); setProcessing(false); },
                onError: (errs) => { setFormErrors(errs as Record<string, string>); setProcessing(false); },
            });
        }
    };

    const handleDelete = () => {
        if (!deletingClase) return;
        setProcessing(true);
        router.delete(`/admin/horarios/${deletingClase.id}`, {
            preserveScroll: true,
            onSuccess: () => { setShowDeleteModal(false); setDeletingClase(null); setProcessing(false); },
            onError: () => setProcessing(false),
        });
    };

    /* ── Cursos disponibles en el modal (filtrados por profesor si aplica) ── */
    const filteredCursosForModal = useMemo(() => {
        if (!formFilterProfesor) return cursos;
        const profId = profesores.find(p => p.nombre === formFilterProfesor)?.id;
        if (!profId) return cursos;
        const cursosIds = new Set(cursoMaterias.filter(cm => cm.profesor_id === profId).map(cm => cm.curso_id));
        return cursos.filter(c => cursosIds.has(c.id));
    }, [cursos, cursoMaterias, profesores, formFilterProfesor]);

    /* ── cursoMateria filtrado para select del formulario ── */
    const filteredCursoMaterias = useMemo(() => {
        if (!formFilterCurso) return [];
        let cms = cursoMaterias.filter(cm => cm.curso_id === parseInt(formFilterCurso));
        // Si hay un profesor bloqueado, mostrar SOLO sus materias
        if (formFilterProfesor) {
            const profId = profesores.find(p => p.nombre === formFilterProfesor)?.id;
            if (profId) cms = cms.filter(cm => cm.profesor_id === profId);
        }
        return cms;
    }, [cursoMaterias, formFilterCurso, formFilterProfesor, profesores]);

    /** CursoMaterias del curso sin restricción de profesor (para mostrar deshabilitados) */
    const allCursoMateriasForCurso = useMemo(() => {
        if (!formFilterCurso) return [];
        return cursoMaterias.filter(cm => cm.curso_id === parseInt(formFilterCurso));
    }, [cursoMaterias, formFilterCurso]);

    const selectedCM = cursoMaterias.find(cm => cm.id === parseInt(form.curso_materia_id));

    /* ── Auto-update hora_fin al cambiar hora_inicio ── */
    const handleHoraChange = (hora: string) => {
        const slot = customSlots.find(s => s.hora === hora);
        setForm(f => ({ ...f, hora_inicio: hora, hora_fin: slot?.horaFin ?? f.hora_fin }));
    };

    /* ── Configuración de jornada ── */
    const openConfig = () => {
        setConfigSlots(customSlots.map(s => ({ ...s })));
        setShowConfigModal(true);
    };
    const saveConfig = () => {
        setCustomSlots(configSlots);
        setShowConfigModal(false);
    };
    const addConfigSlot = (esDescanso = false) => {
        const last = configSlots[configSlots.length - 1];
        setConfigSlots([...configSlots, { hora: last?.horaFin ?? '7:00', horaFin: '', ...(esDescanso ? { esDescanso: true } : {}) }]);
    };
    const removeConfigSlot = (idx: number) => {
        setConfigSlots(configSlots.filter((_, i) => i !== idx));
    };
    const updateConfigSlot = (idx: number, field: string, value: string | boolean) => {
        setConfigSlots(configSlots.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    };

    /* ═══════════════════════════ EXPORT & PRINT ═══════════════════════════ */
    const buildExportData = useCallback((tipo: 'general' | 'profesor' | 'curso', nombre?: string) => {
        const rows: { Hora: string; Dia: string; Materia: string; Curso: string; Profesor: string; Aula: string }[] = [];

        if (tipo === 'profesor' && nombre) {
            const data: HorarioSlot[] = getHorarioProfesor(nombre);
            data.forEach(slot => {
                if (slot.esDescanso) return;
                dias.forEach(d => {
                    const c = slot.clases[d.key];
                    if (c) rows.push({ Hora: `${slot.hora} - ${slot.horaFin}`, Dia: d.label, Materia: c.materia, Curso: c.curso, Profesor: c.profesor, Aula: c.aula });
                });
            });
        } else if (tipo === 'curso' && nombre) {
            const data: HorarioSlot[] = getHorarioCurso(nombre);
            data.forEach(slot => {
                if (slot.esDescanso) return;
                dias.forEach(d => {
                    const c = slot.clases[d.key];
                    if (c) rows.push({ Hora: `${slot.hora} - ${slot.horaFin}`, Dia: d.label, Materia: c.materia, Curso: c.curso, Profesor: c.profesor, Aula: c.aula });
                });
            });
        } else {
            // General: multiple classes per slot/day
            horarioData.forEach(slot => {
                if (slot.esDescanso) return;
                dias.forEach(d => {
                    const lista = slot.clases[d.key] ?? [];
                    lista.forEach(c => rows.push({ Hora: `${slot.hora} - ${slot.horaFin}`, Dia: d.label, Materia: c.materia, Curso: c.curso, Profesor: c.profesor, Aula: c.aula }));
                });
            });
        }

        return rows;
    }, [horarioData]);

    const buildGridMatrix = useCallback((tipo: 'general' | 'profesor' | 'curso', nombre?: string) => {
        const header = ['Hora', ...dias.map(d => d.label)];
        const rows: string[][] = [];

        if (tipo === 'general') {
            // Vista general: múltiples clases por celda
            horarioData.forEach(slot => {
                if (slot.esDescanso) {
                    rows.push([`${slot.hora} - ${slot.horaFin}`, 'DESCANSO', '', '', '', '']);
                } else {
                    const row = [`${slot.hora} - ${slot.horaFin}`];
                    dias.forEach(d => {
                        const lista = slot.clases[d.key] ?? [];
                        row.push(lista.length > 0 ? lista.map(c => `${c.materia} / ${c.curso}`).join('\n') : '');
                    });
                    rows.push(row);
                }
            });
        } else {
            const data: HorarioSlot[] = tipo === 'profesor' ? getHorarioProfesor(nombre!) : getHorarioCurso(nombre!);
            data.forEach(slot => {
                if (slot.esDescanso) {
                    rows.push([`${slot.hora} - ${slot.horaFin}`, 'DESCANSO', '', '', '', '']);
                } else {
                    const row = [`${slot.hora} - ${slot.horaFin}`];
                    dias.forEach(d => {
                        const c = slot.clases[d.key];
                        row.push(c ? (tipo === 'profesor'
                            ? `${c.materia}\n${c.curso}${c.aula ? '\nAula: ' + c.aula : ''}`
                            : `${c.materia}\n${c.profesor}${c.aula ? '\nAula: ' + c.aula : ''}`
                        ) : '');
                    });
                    rows.push(row);
                }
            });
        }
        return { header, rows };
    }, [horarioData]);

    const handleExportXLSX = async () => {
        const XLSX = await import('xlsx');
        const wb = XLSX.utils.book_new();

        if (vistaActiva === 'profesor' && profesorSeleccionado) {
            const { header, rows } = buildGridMatrix('profesor', profesorSeleccionado);
            const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
            ws['!cols'] = [{ wch: 14 }, ...dias.map(() => ({ wch: 25 }))];
            XLSX.utils.book_append_sheet(wb, ws, profesorSeleccionado.slice(0, 31));
        } else if (vistaActiva === 'curso' && cursoSeleccionado) {
            const { header, rows } = buildGridMatrix('curso', cursoSeleccionado);
            const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
            ws['!cols'] = [{ wch: 14 }, ...dias.map(() => ({ wch: 25 }))];
            XLSX.utils.book_append_sheet(wb, ws, cursoSeleccionado.slice(0, 31));
        } else {
            // General: una hoja por curso + una general
            const { header: gH, rows: gR } = buildGridMatrix('general');
            const wsGeneral = XLSX.utils.aoa_to_sheet([gH, ...gR]);
            wsGeneral['!cols'] = [{ wch: 14 }, ...dias.map(() => ({ wch: 30 }))];
            XLSX.utils.book_append_sheet(wb, wsGeneral, 'General');

            cursos.forEach(c => {
                const { header, rows } = buildGridMatrix('curso', c.nombre);
                if (rows.some(r => r.slice(1).some(cell => cell !== '' && cell !== 'DESCANSO'))) {
                    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
                    ws['!cols'] = [{ wch: 14 }, ...dias.map(() => ({ wch: 25 }))];
                    XLSX.utils.book_append_sheet(wb, ws, c.nombre.slice(0, 31));
                }
            });

            profesores.forEach(p => {
                const { header, rows } = buildGridMatrix('profesor', p.nombre);
                if (rows.some(r => r.slice(1).some(cell => cell !== '' && cell !== 'DESCANSO'))) {
                    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
                    ws['!cols'] = [{ wch: 14 }, ...dias.map(() => ({ wch: 25 }))];
                    XLSX.utils.book_append_sheet(wb, ws, `Prof ${p.nombre}`.slice(0, 31));
                }
            });
        }

        const titulo = vistaActiva === 'profesor' && profesorSeleccionado
            ? `Horario_${profesorSeleccionado.replace(/ /g, '_')}`
            : vistaActiva === 'curso' && cursoSeleccionado
                ? `Horario_${cursoSeleccionado.replace(/ /g, '_')}`
                : 'Horarios_General';

        XLSX.writeFile(wb, `${titulo}_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handlePrintPDF = async () => {
        const jsPDFModule = await import('jspdf');
        const jsPDF = (jsPDFModule as any).jsPDF ?? jsPDFModule.default;
        const autoTableModule = await import('jspdf-autotable');
        const autoTable = (autoTableModule as any).default ?? autoTableModule;

        const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
        const pageW = doc.internal.pageSize.getWidth();
        const primary = [41, 53, 119] as [number, number, number]; // #293577
        const dark = [24, 27, 73] as [number, number, number]; // #181b49

        const addHeader = (title: string, subtitle: string) => {
            doc.setFillColor(...dark);
            doc.rect(0, 0, pageW, 22, 'F');
            doc.setFillColor(...primary);
            doc.rect(0, 17, pageW, 5, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('EMPRENDEDORES DEL SABER', pageW / 2, 10, { align: 'center' });
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text(title, pageW / 2, 15, { align: 'center' });
            doc.setFontSize(7);
            doc.text(subtitle, pageW / 2, 20.5, { align: 'center' });
        };

        const addGrid = (data: HorarioSlot[], startY: number, showCurso = false) => {
            const head = [['Hora', ...dias.map(d => d.label)]];
            const body: (string | { content: string; styles?: Record<string, unknown> })[][] = [];

            data.forEach(slot => {
                if (slot.esDescanso) {
                    body.push([{ content: `${slot.hora} - ${slot.horaFin}`, styles: { fontStyle: 'bold' as const, fillColor: [240, 240, 240] as [number, number, number] } },
                        { content: 'DESCANSO', styles: { halign: 'center' as const, colSpan: 5, fillColor: [240, 240, 240] as [number, number, number], fontStyle: 'italic' as const, textColor: [150, 150, 150] as [number, number, number] } }, '', '', '', '']);
                } else {
                    const row: string[] = [`${slot.hora} - ${slot.horaFin}`];
                    dias.forEach(d => {
                        const c = slot.clases[d.key];
                        if (c) {
                            const lineas = [c.materia];
                            if (showCurso) lineas.push(c.curso);
                            lineas.push(c.profesor);
                            if (c.aula) lineas.push('Aula: ' + c.aula);
                            row.push(lineas.join('\n'));
                        } else {
                            row.push('');
                        }
                    });
                    body.push(row);
                }
            });

            autoTable(doc, {
                startY,
                head,
                body,
                theme: 'grid',
                headStyles: { fillColor: primary, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center' },
                bodyStyles: { fontSize: 7, cellPadding: 2, valign: 'middle' },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 22, halign: 'center' } },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { left: 10, right: 10 },
                didParseCell: (data: any) => {
                    if (data.section === 'body' && data.column.index > 0 && data.cell.raw && data.cell.raw !== '') {
                        data.cell.styles.fillColor = [235, 245, 255];
                    }
                },
            });
        };

        const addGridGeneral = (startY: number) => {
            // Para la vista general usamos buildGridMatrix que ya tiene múltiples clases
            const { header, rows } = buildGridMatrix('general');
            const body: (string | { content: string; styles?: Record<string, unknown> })[][] = rows.map(row => {
                if (row[1] === 'DESCANSO') {
                    return [
                        { content: row[0], styles: { fontStyle: 'bold' as const, fillColor: [240,240,240] as [number,number,number] } },
                        { content: 'DESCANSO', styles: { halign: 'center' as const, colSpan: 5, fillColor: [240,240,240] as [number,number,number], fontStyle: 'italic' as const, textColor: [150,150,150] as [number,number,number] } },
                        '', '', '', ''
                    ];
                }
                return row;
            });
            autoTable(doc, {
                startY,
                head: [header],
                body,
                theme: 'grid',
                headStyles: { fillColor: primary, textColor: [255,255,255], fontSize: 8, fontStyle: 'bold', halign: 'center' },
                bodyStyles: { fontSize: 6.5, cellPadding: 1.5, valign: 'top' },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 22, halign: 'center' } },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                margin: { left: 10, right: 10 },
            });
        };

        const addFooter = () => {
            const pageH = doc.internal.pageSize.getHeight();
            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text(`Generado el ${new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 10, pageH - 5);
            doc.text('Emprendedores del Saber — Sistema de Gestión Académica', pageW - 10, pageH - 5, { align: 'right' });
        };

        if (vistaActiva === 'profesor' && profesorSeleccionado) {
            const prof = profesores.find(p => p.nombre === profesorSeleccionado);
            addHeader('HORARIO DEL PROFESOR', `${profesorSeleccionado} · ${prof?.especialidad ?? ''} · ${prof?.horasSemanales ?? 0}h semanales`);
            addGrid(getHorarioProfesor(profesorSeleccionado), 26, true); // showCurso=true
            addFooter();
        } else if (vistaActiva === 'curso' && cursoSeleccionado) {
            const clasesCount = allClases.filter(c => c.curso === cursoSeleccionado).length;
            const profsCount = [...new Set(allClases.filter(c => c.curso === cursoSeleccionado).map(c => c.profesor))].length;
            addHeader('HORARIO DEL CURSO', `${cursoSeleccionado} · ${clasesCount} clases · ${profsCount} profesores`);
            addGrid(getHorarioCurso(cursoSeleccionado), 26, false); // showCurso=false (ya es el curso)
            addFooter();
        } else {
            // General: resumen primero, luego uno por curso
            addHeader('HORARIO GENERAL', `${allClases.length} clases · ${profesores.length} profesores · ${stats.cursosConClases}/${stats.totalCursos} cursos con horario`);
            addGridGeneral(26);
            addFooter();

            // Páginas adicionales: un curso por página
            cursos.forEach(c => {
                const cursoClases = allClases.filter(cl => cl.curso === c.nombre);
                if (cursoClases.length === 0) return;
                doc.addPage();
                addHeader(`HORARIO — ${c.nombre.toUpperCase()}`, `${cursoClases.length} clases · ${[...new Set(cursoClases.map(cl => cl.profesor))].length} profesores`);
                addGrid(getHorarioCurso(c.nombre), 26, false);
                addFooter();
            });

            // Páginas de profesores
            profesores.forEach(p => {
                const profClases = allClases.filter(cl => cl.profesor === p.nombre);
                if (profClases.length === 0) return;
                doc.addPage();
                addHeader(`HORARIO DEL PROFESOR`, `${p.nombre} · ${p.especialidad} · ${p.horasSemanales}h semanales`);
                addGrid(getHorarioProfesor(p.nombre), 26, true);
                addFooter();
            });
        }

        // Page numbers
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            const pageH = doc.internal.pageSize.getHeight();
            doc.setFontSize(7);
            doc.setTextColor(180, 180, 180);
            doc.text(`Página ${i} de ${totalPages}`, pageW / 2, pageH - 5, { align: 'center' });
        }

        const titulo = vistaActiva === 'profesor' && profesorSeleccionado
            ? `Horario_${profesorSeleccionado.replace(/ /g, '_')}`
            : vistaActiva === 'curso' && cursoSeleccionado
                ? `Horario_${cursoSeleccionado.replace(/ /g, '_')}`
                : 'Horarios_Completo';
        doc.save(`${titulo}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    /* ═══════════════════════════ HORARIO GRID ═══════════════════════════ */
    /** Vista General: múltiples clases apiladas por celda */
    /* Iniciales de un nombre completo */
    const getIniciales = (nombre: string) =>
        nombre.split(' ').filter(Boolean).map(n => n[0].toUpperCase()).slice(0, 2).join('');

    const renderHorarioGridGeneral = (data: HorarioSlotMulti[]) => (
        <>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="bg-gradient-to-r from-[#181b49] to-[#293577]">
                            <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white/80 w-[90px]">
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                    Hora
                                </div>
                            </th>
                            {dias.map(d => (
                                <th key={d.key} className="px-2 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-white">{d.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((slot, idx) => (
                            <tr key={idx} className={slot.esDescanso ? 'bg-gradient-to-r from-gray-50 to-gray-100' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                                <td className="px-3 py-2 whitespace-nowrap border-r border-gray-100">
                                    <div className="text-xs font-bold text-gray-800">{slot.hora}</div>
                                    <div className="text-[10px] text-gray-400">{slot.horaFin}</div>
                                </td>
                                {slot.esDescanso ? (
                                    <td colSpan={5} className="px-3 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2 text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.362-6.387 8.25 8.25 0 0 0 3 2Z" /></svg>
                                            <span className="text-xs font-semibold uppercase tracking-widest">Descanso</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.362-6.387 8.25 8.25 0 0 0 3 2Z" /></svg>
                                        </div>
                                    </td>
                                ) : (
                                    dias.map(d => {
                                        const clases = slot.clases[d.key] ?? [];
                                        const MAX_VISIBLE = 2;
                                        const visible = clases.slice(0, MAX_VISIBLE);
                                        const ocultas = clases.length - MAX_VISIBLE;
                                        return (
                                            <td key={d.key} className="px-1 py-1 align-top min-w-[120px]">
                                                {clases.length > 0 ? (
                                                    <div className="flex flex-col gap-1">
                                                        {visible.map(clase => {
                                                            const colores = profesorColorMap[clase.profesor];
                                                            const iniciales = getIniciales(clase.profesor);
                                                            return (
                                                                <div
                                                                    key={clase.id}
                                                                    onClick={() => setClaseDetalle(clase)}
                                                                    className="flex items-stretch rounded-lg overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-px transition-all bg-white group"
                                                                >
                                                                    {/* Barra lateral con color del profesor */}
                                                                    <div className={`w-1.5 flex-shrink-0 ${colores?.bg ?? 'bg-gray-300'}`} />
                                                                    <div className="flex-1 px-1.5 py-1 min-w-0">
                                                                        <p className="text-[10px] font-bold text-gray-800 leading-tight truncate">{clase.materia}</p>
                                                                        {/* Badge curso */}
                                                                        <span className="inline-block mt-0.5 px-1 py-px rounded text-[8px] font-bold bg-indigo-50 text-indigo-700 leading-none truncate max-w-full">{clase.curso}</span>
                                                                        {/* Profesor con avatar */}
                                                                        <div className="flex items-center gap-1 mt-0.5">
                                                                            <span className={`flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-bold text-white ${colores?.bg ?? 'bg-gray-400'}`}>
                                                                                {iniciales}
                                                                            </span>
                                                                            <p className={`text-[9px] font-medium truncate ${colores?.text ?? 'text-gray-500'}`}>{clase.profesor}</p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {/* Botón "ver N más" */}
                                                        {ocultas > 0 && (
                                                            <button
                                                                onClick={() => setSlotExpandido({ hora: slot.hora, horaFin: slot.horaFin, dia: d.label, clases })}
                                                                className="w-full flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg border border-dashed border-indigo-300 bg-indigo-50/60 hover:bg-indigo-100 transition-colors text-indigo-600"
                                                            >
                                                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                                                <span className="text-[9px] font-bold">{ocultas} más</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={() => openCreate(d.key, slot.hora)}
                                                        className="p-2 h-[52px] border border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all group"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* ── Modal: todas las clases de una franja ── */}
        {slotExpandido && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setSlotExpandido(null)}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#181b49] to-[#293577] px-5 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-white/70 text-xs font-medium uppercase tracking-widest">{slotExpandido.dia}</p>
                            <h3 className="text-white text-base font-bold">{slotExpandido.hora} — {slotExpandido.horaFin}</h3>
                            <p className="text-white/60 text-xs mt-0.5">{slotExpandido.clases.length} clases en esta franja</p>
                        </div>
                        <button onClick={() => setSlotExpandido(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                    {/* Lista */}
                    <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
                        {slotExpandido.clases.map((clase, i) => {
                            const colores = profesorColorMap[clase.profesor];
                            const iniciales = getIniciales(clase.profesor);
                            return (
                                <div
                                    key={clase.id}
                                    className="flex items-stretch rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                    onClick={() => { setClaseDetalle(clase); setSlotExpandido(null); }}
                                >
                                    {/* Barra color profesor */}
                                    <div className={`w-2 flex-shrink-0 ${colores?.bg ?? 'bg-gray-300'}`} />
                                    <div className="flex-1 px-3 py-2.5">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-800 leading-tight">{clase.materia}</p>
                                                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">{clase.curso}</span>
                                            </div>
                                            {clase.aula && (
                                                <span className="flex-shrink-0 text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium">Aula {clase.aula}</span>
                                            )}
                                        </div>
                                        {/* Profesor */}
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0 ${colores?.bg ?? 'bg-gray-400'}`}>
                                                {iniciales}
                                            </div>
                                            <span className={`text-xs font-semibold ${colores?.text ?? 'text-gray-600'}`}>{clase.profesor}</span>
                                        </div>
                                    </div>
                                    {/* Flecha */}
                                    <div className="flex items-center pr-3">
                                        <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        )}
        </>
    );

    const renderHorarioGrid = (data: HorarioSlot[]) => (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr className="bg-gradient-to-r from-[#181b49] to-[#293577]">
                            <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white/80 w-[90px]">
                                <div className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                    Hora
                                </div>
                            </th>
                            {dias.map(d => (
                                <th key={d.key} className="px-2 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-white">{d.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((slot, idx) => (
                            <tr key={idx} className={slot.esDescanso ? 'bg-gradient-to-r from-gray-50 to-gray-100' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                                <td className="px-3 py-2 whitespace-nowrap border-r border-gray-100">
                                    <div className="text-xs font-bold text-gray-800">{slot.hora}</div>
                                    <div className="text-[10px] text-gray-400">{slot.horaFin}</div>
                                </td>
                                {slot.esDescanso ? (
                                    <td colSpan={5} className="px-3 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2 text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.362-6.387 8.25 8.25 0 0 0 3 2Z" /></svg>
                                            <span className="text-xs font-semibold uppercase tracking-widest">Descanso</span>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.362-6.387 8.25 8.25 0 0 0 3 2Z" /></svg>
                                        </div>
                                    </td>
                                ) : (
                                    dias.map(d => {
                                        const clase = slot.clases[d.key];
                                        return (
                                            <td key={d.key} className="px-1.5 py-1.5">
                                                {clase ? (
                                                    <div
                                                        onClick={() => setClaseDetalle(clase)}
                                                        className={`p-2 rounded-lg ${getClaseColor(clase.profesor)} cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5 group relative`}
                                                    >
                                                        <p className="text-[11px] font-bold text-gray-800 leading-tight">{clase.materia}</p>
                                                        <p className="text-[10px] text-gray-600 font-medium">{clase.curso}</p>
                                                        <p className="text-[10px] text-gray-500 truncate">{clase.profesor}</p>
                                                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className="text-[9px] bg-white/80 rounded px-1 py-0.5 text-gray-500">{clase.aula}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        onClick={() => openCreate(d.key, slot.hora)}
                                                        className="p-2 h-[52px] border border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all group"
                                                    >
                                                        <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    /* ═══════════════════════════ RENDER ═══════════════════════════ */
    return (
        <SidebarLayout menuItems={adminMenuItems} title="Horarios Profesores">
            <Head title="Horarios Profesores" />

            <div className="space-y-5" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Horarios de Profesores</h1>
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">{anioVigente}</span>
                        </div>
                        <p className="text-gray-500 text-sm">Administra y visualiza los horarios de clases — año escolar {anioVigente}</p>
                    </div>
                    <button
                        onClick={() => openCreate()}
                        className="flex items-center gap-2 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-[#293577]/25 transition-all text-sm font-medium"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        Asignar Clase
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {[
                        { label: 'Clases Program.', value: stats.totalClases, icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>), color: 'from-blue-500 to-blue-600' },
                        { label: 'Profesores', value: stats.totalProfesores, icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>), color: 'from-indigo-500 to-indigo-600' },
                        { label: 'Horas Totales', value: `${stats.horasTotales}h`, icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>), color: 'from-emerald-500 to-emerald-600' },
                        { label: 'Cursos Totales', value: `${stats.cursosConClases}/${stats.totalCursos}`, icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" /></svg>), color: 'from-amber-500 to-amber-600' },
                        { label: 'Slots Libres', value: `${stats.disponibilidad}%`, icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>), color: 'from-purple-500 to-purple-600' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <span className={`bg-gradient-to-br ${stat.color} text-white p-2 rounded-lg flex items-center justify-center`}>{stat.icon}</span>
                                <div className={`w-8 h-1 rounded-full bg-gradient-to-r ${stat.color}`} />
                            </div>
                            <p className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="bg-white rounded-xl shadow-sm p-1 inline-flex">
                        {([
                            { key: 'general' as const, label: 'Horario General', icon: (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>) },
                            { key: 'profesor' as const, label: 'Por Profesor', icon: (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>) },
                            { key: 'curso' as const, label: 'Por Curso', icon: (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" /></svg>) },
                        ]).map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    const destino = tab.key as 'general' | 'profesor' | 'curso';
                                    if (destino === 'curso' && vistaActiva === 'profesor' && profesorSeleccionado) {
                                        // Llevar el primer curso del profesor activo a "Por Curso"
                                        const prof = profesores.find(p => p.nombre === profesorSeleccionado);
                                        const primCM = prof ? cursoMaterias.find(cm => cm.profesor_id === prof.id) : null;
                                        const primerCurso = primCM ? cursos.find(c => c.id === primCM.curso_id)?.nombre ?? '' : '';
                                        setVistaActiva(destino);
                                        setProfesorSeleccionado('');
                                        setCursoSeleccionado(primerCurso);
                                    } else if (destino === 'profesor' && vistaActiva === 'curso' && cursoSeleccionado) {
                                        // Ir a "Por Profesor" mostrando la grilla de cards (sin forzar un único prof)
                                        setVistaActiva(destino);
                                        setProfesorSeleccionado('');
                                        setCursoSeleccionado('');
                                    } else {
                                        setVistaActiva(destino);
                                        setProfesorSeleccionado('');
                                        setCursoSeleccionado('');
                                    }
                                }}
                                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${vistaActiva === tab.key ? 'bg-gradient-to-r from-[#293577] to-[#181b49] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={openConfig}
                            className="flex items-center gap-1.5 px-3 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-sm text-gray-500 hover:bg-gray-50 hover:text-[#293577] transition-colors"
                            title="Configurar jornada horaria"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                            <span className="hidden sm:inline">Jornada</span>
                        </button>
                        <button
                            onClick={handlePrintPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M9.75 8.25h.008v.008H9.75V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                            Imprimir PDF
                        </button>
                        <button
                            onClick={handleExportXLSX}
                            className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                            Exportar Excel
                        </button>
                    </div>
                </div>

                {/* ===== Horario General ===== */}
                {vistaActiva === 'general' && (
                    <>
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-bold text-gray-700">{getDisplayTitle()}</h2>
                            <div className="flex-1 h-px bg-gray-200" />
                        </div>
                        {renderHorarioGridGeneral(horarioData)}

                   
                    </>
                )}

                {/* ===== Por Profesor ===== */}
                {vistaActiva === 'profesor' && (
                    <>
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 space-y-4">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800"><SearchIcon className="w-4 h-4" /></span>
                                <input
                                    type="text"
                                    placeholder="Buscar profesor por nombre, especialidad o materia..."
                                    value={searchProfesor}
                                    onChange={(e) => setSearchProfesor(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {filteredProfesores.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setProfesorSeleccionado(profesorSeleccionado === p.nombre ? '' : p.nombre)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                                            profesorSeleccionado === p.nombre
                                                ? `${p.colorBg} ${p.colorBorder} ${p.colorText} shadow-sm`
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg ${p.colorBg} flex items-center justify-center text-xs font-bold ${p.colorText}`}>
                                            {p.foto}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-semibold leading-tight">{p.nombre}</p>
                                            <p className="text-[10px] opacity-70">{p.materias.slice(0, 2).join(', ')}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {profesorSeleccionado ? (
                            <>
                                {(() => {
                                    const prof = profesores.find(p => p.nombre === profesorSeleccionado);
                                    if (!prof) return null;
                                    const carga = getCargaLabel(prof.horasSemanales, prof.maxHoras);
                                    return (
                                        <div className={`${prof.colorBg} ${prof.colorBorder} border rounded-xl p-5`}>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-14 h-14 rounded-xl ${prof.colorBg} flex items-center justify-center font-bold text-lg ${prof.colorText} shadow-sm border ${prof.colorBorder}`}>
                                                        {prof.foto}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-800 text-lg">{prof.nombre}</h3>
                                                        <p className="text-sm text-gray-500">{prof.especialidad}</p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {prof.materias.map((m, i) => (
                                                                <span key={i} className="px-2 py-0.5 bg-white/80 rounded text-[11px] text-gray-600 font-medium">{m}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-center">
                                                        <p className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>{prof.horasSemanales}h</p>
                                                        <p className="text-[10px] text-gray-500">de {prof.maxHoras}h</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>{prof.cursos.length}</p>
                                                        <p className="text-[10px] text-gray-500">Cursos</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${carga.badge}`}>
                                                        Carga {carga.label}
                                                    </span>
                                                    <button onClick={() => setProfesorDetalle(prof)} className="p-2 text-gray-400 hover:text-[#293577] hover:bg-white rounded-lg transition-colors">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-3">
                                                <div className="w-full bg-white/60 rounded-full h-2">
                                                    <div className={`h-2 rounded-full ${carga.bg} transition-all`} style={{ width: `${Math.min(100, (prof.horasSemanales / prof.maxHoras) * 100)}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                                {renderHorarioGrid(getHorarioProfesor(profesorSeleccionado))}
                            </>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredProfesores.map(profesor => {
                                    const carga = getCargaLabel(profesor.horasSemanales, profesor.maxHoras);
                                    const clasesProfesor = allClases.filter(c => c.profesor === profesor.nombre);
                                    return (
                                        <div key={profesor.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all overflow-hidden">
                                            <div className={`h-1.5 ${profesor.colorBg}`} style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                                            <div className="p-5">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-12 h-12 rounded-xl ${profesor.colorBg} flex items-center justify-center font-bold ${profesor.colorText} shadow-sm border ${profesor.colorBorder}`}>
                                                            {profesor.foto}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-800 text-sm">{profesor.nombre}</h3>
                                                            <p className="text-xs text-gray-500">{profesor.especialidad}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${carga.badge}`}>{carga.label}</span>
                                                </div>

                                                <div className="grid grid-cols-3 gap-2 mb-4">
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <p className="text-lg font-extrabold text-[#293577]" style={{ fontFamily: "'Inter', sans-serif" }}>{profesor.horasSemanales}h</p>
                                                        <p className="text-[10px] text-gray-500">Horas/Sem</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <p className="text-lg font-extrabold text-emerald-600" style={{ fontFamily: "'Inter', sans-serif" }}>{profesor.materias.length}</p>
                                                        <p className="text-[10px] text-gray-500">Materias</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <p className="text-lg font-extrabold text-amber-600" style={{ fontFamily: "'Inter', sans-serif" }}>{clasesProfesor.length}</p>
                                                        <p className="text-[10px] text-gray-500">Clases</p>
                                                    </div>
                                                </div>

                                                <div className="mb-3">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] text-gray-500">Carga horaria</span>
                                                        <span className="text-[10px] font-medium text-gray-600">{profesor.horasSemanales}/{profesor.maxHoras}h</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                        <div className={`h-1.5 rounded-full ${carga.bg} transition-all`} style={{ width: `${Math.min(100, (profesor.horasSemanales / profesor.maxHoras) * 100)}%` }} />
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-1 mb-4">
                                                    {profesor.materias.map((m, i) => (
                                                        <span key={i} className={`px-2 py-0.5 ${profesor.colorBg} ${profesor.colorText} rounded text-[11px] font-medium`}>{m}</span>
                                                    ))}
                                                </div>

                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setProfesorSeleccionado(profesor.nombre)}
                                                        className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#293577] to-[#181b49] text-white py-2 rounded-lg text-sm hover:shadow-md transition-all font-medium"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                                                        Ver Horario
                                                    </button>
                                                    <button onClick={() => setProfesorDetalle(profesor)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-[#293577] transition-colors">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* ===== Por Curso ===== */}
                {vistaActiva === 'curso' && (
                    <>
                        {/* Selector de cursos con indicador de clases */}
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Seleccionar curso — {anioVigente}</p>
                                <span className="text-[10px] text-gray-400">{stats.cursosConClases} de {stats.totalCursos} con horario</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                                {cursos.map(c => {
                                    const clasesDelCurso = allClases.filter(cl => cl.curso_id === c.id).length;
                                    const isSelected = cursoSeleccionado === c.nombre;
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => setCursoSeleccionado(isSelected ? '' : c.nombre)}
                                            className={`relative flex flex-col items-start px-3 py-2.5 rounded-xl text-xs font-medium transition-all border ${
                                                isSelected
                                                    ? 'bg-gradient-to-r from-[#293577] to-[#181b49] text-white border-transparent shadow-md'
                                                    : clasesDelCurso > 0
                                                        ? 'bg-blue-50 border-blue-200 text-blue-700 hover:shadow-sm'
                                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="font-semibold leading-tight">{c.nombre}</span>
                                            <span className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/70' : clasesDelCurso > 0 ? 'text-blue-500' : 'text-gray-400'}`}>
                                                {clasesDelCurso > 0 ? `${clasesDelCurso} clase${clasesDelCurso !== 1 ? 's' : ''}` : 'Sin horario'}
                                            </span>
                                            {clasesDelCurso > 0 && !isSelected && (
                                                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {cursoSeleccionado ? (() => {
                            const cursoObj = cursos.find(c => c.nombre === cursoSeleccionado);
                            const clasesDelCurso = allClases.filter(c => c.curso === cursoSeleccionado);
                            const profsDelCurso = [...new Set(clasesDelCurso.map(c => c.profesor))];
                            return (
                                <>
                                    {/* Header del curso seleccionado */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#293577] to-[#181b49] flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                                                {cursoSeleccionado.replace(/[^\d°]/g, '') || cursoSeleccionado.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h2 className="text-base font-bold text-gray-800">Horario — {cursoSeleccionado}</h2>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-xs text-gray-400">
                                                        <strong className="text-gray-600">{clasesDelCurso.length}</strong> clases · <strong className="text-gray-600">{profsDelCurso.length}</strong> prof.
                                                    </span>
                                                    {profsDelCurso.slice(0, 3).map((prof, i) => {
                                                        const p = profesores.find(p => p.nombre === prof);
                                                        return p ? (
                                                            <span key={i} className={`px-2 py-0.5 ${p.colorBg} ${p.colorText} rounded text-[10px] font-medium`}>{prof.split(' ')[0]}</span>
                                                        ) : null;
                                                    })}
                                                    {profsDelCurso.length > 3 && <span className="text-[10px] text-gray-400">+{profsDelCurso.length - 3} más</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => openCreate(undefined, undefined)}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-[#293577]/10 text-[#293577] rounded-xl text-xs font-medium hover:bg-[#293577]/20 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                            Agregar clase
                                        </button>
                                    </div>
                                    {renderHorarioGrid(getHorarioCurso(cursoSeleccionado))}
                                </>
                            );
                        })() : (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" /></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-700 mb-1">Selecciona un curso</h3>
                                <p className="text-sm text-gray-500">Elige un curso de la cuadrícula para ver o editar su horario semanal</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ═══════ MODAL DETALLE CLASE ═══════ */}
            {claseDetalle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setClaseDetalle(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className={`${getClaseColor(claseDetalle.profesor)} rounded-t-2xl px-6 py-5`}>
                            <h2 className="text-lg font-bold text-gray-800">{claseDetalle.materia}</h2>
                            <p className="text-sm text-gray-600">{claseDetalle.curso}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="w-10 h-10 rounded-lg bg-[#293577] text-white flex items-center justify-center font-bold text-sm">
                                    {claseDetalle.profesor.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">{claseDetalle.profesor}</p>
                                    <p className="text-xs text-gray-500">Profesor(a)</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 bg-gray-50 rounded-xl text-center">
                                    <svg className="w-5 h-5 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                    <p className="text-sm font-bold text-gray-800">{claseDetalle.hora}</p>
                                    <p className="text-[10px] text-gray-500">{claseDetalle.horaFin}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl text-center">
                                    <svg className="w-5 h-5 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                                    <p className="text-sm font-bold text-gray-800 capitalize">{claseDetalle.dia}</p>
                                    <p className="text-[10px] text-gray-500">Día</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl text-center">
                                    <svg className="w-5 h-5 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" /></svg>
                                    <p className="text-sm font-bold text-gray-800">{claseDetalle.aula || '—'}</p>
                                    <p className="text-[10px] text-gray-500">Aula</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { openDeleteModal(claseDetalle); setClaseDetalle(null); }}
                                    className="px-4 py-2.5 border border-red-200 rounded-xl hover:bg-red-50 text-sm font-medium text-red-500 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                </button>
                                <button
                                    onClick={() => { setClaseDetalle(null); }}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={() => { openEdit(claseDetalle); setClaseDetalle(null); }}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#293577] to-[#181b49] text-white rounded-xl hover:shadow-lg text-sm font-medium flex items-center justify-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" /></svg>
                                    Editar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ MODAL DETALLE PROFESOR ═══════ */}
            {profesorDetalle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setProfesorDetalle(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className={`${profesorDetalle.colorBg} ${profesorDetalle.colorBorder} border-b rounded-t-2xl px-6 py-5`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-xl ${profesorDetalle.colorBg} flex items-center justify-center font-bold text-xl ${profesorDetalle.colorText} shadow-md border-2 ${profesorDetalle.colorBorder}`}>
                                    {profesorDetalle.foto}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{profesorDetalle.nombre}</h2>
                                    <p className="text-sm text-gray-500">{profesorDetalle.especialidad}</p>
                                    <div className="flex gap-2 mt-1">
                                        {profesorDetalle.materias.map((m, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-white/80 rounded text-[11px] text-gray-600 font-medium">{m}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-4 gap-3">
                                <div className="text-center p-3 bg-gray-50 rounded-xl">
                                    <p className="text-xl font-extrabold text-[#293577]" style={{ fontFamily: "'Inter', sans-serif" }}>{profesorDetalle.horasSemanales}h</p>
                                    <p className="text-[10px] text-gray-500">Horas/Sem</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-xl">
                                    <p className="text-xl font-extrabold text-emerald-600" style={{ fontFamily: "'Inter', sans-serif" }}>{profesorDetalle.materias.length}</p>
                                    <p className="text-[10px] text-gray-500">Materias</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-xl">
                                    <p className="text-xl font-extrabold text-amber-600" style={{ fontFamily: "'Inter', sans-serif" }}>{profesorDetalle.cursos.length}</p>
                                    <p className="text-[10px] text-gray-500">Cursos</p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 rounded-xl">
                                    <p className="text-xl font-extrabold text-purple-600" style={{ fontFamily: "'Inter', sans-serif" }}>{allClases.filter(c => c.profesor === profesorDetalle.nombre).length}</p>
                                    <p className="text-[10px] text-gray-500">Clases</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Información de contacto</p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                                        <span className="text-sm text-gray-600">{profesorDetalle.email}</span>
                                    </div>
                                    {profesorDetalle.telefono && (
                                        <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                                            <span className="text-sm text-gray-600">{profesorDetalle.telefono}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Cursos asignados</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {profesorDetalle.cursos.map((c, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-700 font-medium">{c}</span>
                                    ))}
                                    {profesorDetalle.cursos.length === 0 && <span className="text-xs text-gray-400">Sin cursos asignados</span>}
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-gray-700">Carga horaria</p>
                                    <span className={`text-xs font-semibold ${getCargaLabel(profesorDetalle.horasSemanales, profesorDetalle.maxHoras).badge} px-2 py-0.5 rounded-full`}>
                                        {getCargaLabel(profesorDetalle.horasSemanales, profesorDetalle.maxHoras).label}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div className={`h-3 rounded-full ${getCargaLabel(profesorDetalle.horasSemanales, profesorDetalle.maxHoras).bg} transition-all`} style={{ width: `${Math.min(100, (profesorDetalle.horasSemanales / profesorDetalle.maxHoras) * 100)}%` }} />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{profesorDetalle.horasSemanales} de {profesorDetalle.maxHoras} horas máximas semanales</p>
                            </div>

                            <div className="flex gap-3">
                                <button type="button" onClick={() => setProfesorDetalle(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                    Cerrar
                                </button>
                                <button
                                    onClick={() => { setProfesorDetalle(null); setProfesorSeleccionado(profesorDetalle.nombre); setVistaActiva('profesor'); }}
                                    className="flex-1 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-4 py-2.5 rounded-xl hover:shadow-lg text-sm font-medium"
                                >
                                    Ver Horario Completo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ MODAL ASIGNAR / EDITAR CLASE ═══════ */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#181b49] to-[#293577] rounded-t-2xl px-6 py-4">
                            <h2 className="text-lg font-bold text-white">{editingClase ? 'Editar Clase' : 'Asignar Clase'}</h2>
                            <p className="text-blue-200 text-xs">
                                {editingClase ? 'Modifica los datos de la clase programada' : 'Programa una nueva clase en el horario'}
                            </p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">

                            {/* Banner: curso bloqueado */}
                            {formCursoLocked && !editingClase && (() => {
                                const cursoNombre = cursos.find(c => String(c.id) === formFilterCurso)?.nombre ?? '';
                                return (
                                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-indigo-50 border-indigo-200">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold bg-gradient-to-br from-[#293577] to-[#181b49] text-white shadow-sm">
                                            {cursoNombre.replace(/[^\d°]/g, '') || cursoNombre.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-semibold text-[#293577]">{cursoNombre}</p>
                                            <p className="text-[10px] text-gray-500">Asignando clase para este curso — selecciona la materia y el bloque</p>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                    </div>
                                );
                            })()}

                            {/* Banner: profesor bloqueado */}
                            {formFilterProfesor && !editingClase && (() => {
                                const profObj = profesores.find(p => p.nombre === formFilterProfesor);
                                return (
                                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${profObj?.colorBg ?? 'bg-blue-50'} ${profObj?.colorBorder ?? 'border-blue-200'}`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${profObj?.colorBg ?? 'bg-blue-100'} ${profObj?.colorText ?? 'text-blue-700'} border ${profObj?.colorBorder ?? 'border-blue-300'}`}>
                                            {profObj?.foto ?? formFilterProfesor.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-semibold ${profObj?.colorText ?? 'text-blue-800'}`}>{formFilterProfesor}</p>
                                            <p className="text-[10px] text-gray-500">Solo se muestran los cursos y materias de este profesor</p>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                    </div>
                                );
                            })()}

                            {/* Paso 1: Curso */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="w-5 h-5 rounded-full bg-[#293577] text-white text-[10px] flex items-center justify-center font-bold">1</span>
                                        Curso *
                                        {formFilterProfesor && !editingClase && (
                                            <span className="ml-1 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[9px] font-semibold tracking-wide">FILTRADO</span>
                                        )}
                                        {formCursoLocked && !editingClase && (
                                            <span className="ml-1 px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-semibold tracking-wide">FIJO</span>
                                        )}
                                    </span>
                                </label>

                                {/* Curso bloqueado: mostrar como display en lugar de select */}
                                {formCursoLocked && !editingClase ? (
                                    <div className="w-full px-4 py-2.5 border border-indigo-200 bg-indigo-50 rounded-xl text-sm text-[#293577] font-medium flex items-center justify-between">
                                        <span>{cursos.find(c => String(c.id) === formFilterCurso)?.nombre ?? '—'}</span>
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                    </div>
                                ) : (
                                    <select
                                        value={formFilterCurso}
                                        onChange={e => { setFormFilterCurso(e.target.value); setForm(f => ({ ...f, curso_materia_id: '' })); }}
                                        className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] transition-all ${!formFilterCurso && formErrors.curso_materia_id ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                    >
                                        <option value="">
                                            {formFilterProfesor && !editingClase
                                                ? `Seleccionar curso de ${formFilterProfesor.split(' ')[0]}...`
                                                : 'Seleccionar curso...'}
                                        </option>
                                        {filteredCursosForModal.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                )}

                                {formFilterProfesor && !editingClase && filteredCursosForModal.length === 0 && (
                                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
                                        Este profesor no tiene materias asignadas en ningún curso
                                    </p>
                                )}
                            </div>

                            {/* Paso 2: Materia */}
                            {formFilterCurso && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        <span className="inline-flex items-center gap-1.5">
                                            <span className="w-5 h-5 rounded-full bg-[#293577] text-white text-[10px] flex items-center justify-center font-bold">2</span>
                                            Materia *
                                        </span>
                                    </label>

                                    {/* Con filtro de profesor: solo sus materias */}
                                    {formFilterProfesor && !editingClase ? (
                                        filteredCursoMaterias.length > 0 ? (
                                            <select
                                                value={form.curso_materia_id}
                                                onChange={e => setForm(f => ({ ...f, curso_materia_id: e.target.value }))}
                                                className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] transition-all ${formErrors.curso_materia_id ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                            >
                                                <option value="">Seleccionar materia...</option>
                                                {filteredCursoMaterias.map(cm => (
                                                    <option key={cm.id} value={cm.id}>{cm.materia}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
                                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                                                <span><strong>{formFilterProfesor.split(' ')[0]}</strong> no tiene materias asignadas en este curso. Ve a <strong>Cursos</strong> para asignarle materias.</span>
                                            </div>
                                        )
                                    ) : (
                                        /* Sin filtro de profesor (general/curso): mostrar todas, deshabilitar las sin profesor */
                                        allCursoMateriasForCurso.length > 0 ? (
                                            <>
                                                <select
                                                    value={form.curso_materia_id}
                                                    onChange={e => setForm(f => ({ ...f, curso_materia_id: e.target.value }))}
                                                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] transition-all ${formErrors.curso_materia_id ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                                >
                                                    <option value="">Seleccionar materia...</option>
                                                    {allCursoMateriasForCurso.map(cm => (
                                                        <option key={cm.id} value={cm.id} disabled={!cm.profesor_id}>
                                                            {cm.profesor_id
                                                                ? `${cm.materia} — ${cm.profesor}`
                                                                : `${cm.materia} — (Sin profesor asignado)`}
                                                        </option>
                                                    ))}
                                                </select>
                                                {allCursoMateriasForCurso.some(cm => !cm.profesor_id) && (
                                                    <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" /></svg>
                                                        Las materias sin profesor no pueden programarse hasta asignar uno en <strong>Cursos</strong>
                                                    </p>
                                                )}
                                            </>
                                        ) : (
                                            <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex items-center gap-2">
                                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                                                Este curso no tiene materias asignadas. Ve a <strong>Cursos</strong> para configurarlas.
                                            </div>
                                        )
                                    )}
                                    {formErrors.curso_materia_id && <p className="text-xs text-red-500 mt-1">{formErrors.curso_materia_id}</p>}
                                </div>
                            )}

                            {/* Info del profesor auto-detectado */}
                            {selectedCM && (
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-3 border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[#293577] text-white flex items-center justify-center font-bold text-xs">
                                            {selectedCM.profesor ? selectedCM.profesor.split(' ').map(n => n[0]).join('').slice(0, 2) : '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800">{selectedCM.materia}</p>
                                            <p className="text-xs text-gray-500 truncate">{selectedCM.curso} · Prof. {selectedCM.profesor ?? 'Sin asignar'}</p>
                                        </div>
                                        <svg className="w-5 h-5 text-green-500 ml-auto flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                    </div>
                                </div>
                            )}

                            {/* Paso 3: Horario */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="w-5 h-5 rounded-full bg-[#293577] text-white text-[10px] flex items-center justify-center font-bold">3</span>
                                        Horario
                                    </span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] text-gray-500 mb-1">Día *</label>
                                        <select
                                            value={form.dia}
                                            onChange={e => setForm(f => ({ ...f, dia: e.target.value }))}
                                            className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] transition-all ${formErrors.dia ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                        >
                                            {dias.map(d => (
                                                <option key={d.key} value={d.key}>{d.label}</option>
                                            ))}
                                        </select>
                                        {formErrors.dia && <p className="text-xs text-red-500 mt-1">{formErrors.dia}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-gray-500 mb-1">Bloque horario *</label>
                                        <select
                                            value={form.hora_inicio}
                                            onChange={e => handleHoraChange(e.target.value)}
                                            className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] transition-all ${formErrors.hora_inicio ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                        >
                                            {customSlots.filter(s => !s.esDescanso).map(s => (
                                                <option key={s.hora} value={s.hora}>{s.hora} — {s.horaFin}</option>
                                            ))}
                                        </select>
                                        {formErrors.hora_inicio && <p className="text-xs text-red-500 mt-1">{formErrors.hora_inicio}</p>}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aula / Salón</label>
                                <input
                                    type="text"
                                    placeholder="Ej: A-201, Lab-1, Cancha..."
                                    value={form.salon}
                                    onChange={e => setForm(f => ({ ...f, salon: e.target.value }))}
                                    className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] transition-all ${formErrors.salon ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                />
                                {formErrors.salon && <p className="text-xs text-red-500 mt-1">{formErrors.salon}</p>}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processing || !form.curso_materia_id} className="flex-1 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-[#293577]/25 text-sm font-medium disabled:opacity-50">
                                    {processing ? 'Guardando...' : editingClase ? 'Guardar cambios' : 'Asignar Clase'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════ MODAL ELIMINAR ═══════ */}
            {showDeleteModal && deletingClase && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowDeleteModal(false); setDeletingClase(null); }}>
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar esta clase?</h3>
                            <p className="text-sm text-gray-500 mb-1">
                                <strong>{deletingClase.materia}</strong> — {deletingClase.curso}
                            </p>
                            <p className="text-xs text-gray-400 mb-1 capitalize">
                                {deletingClase.dia} {deletingClase.hora} - {deletingClase.horaFin} · Prof. {deletingClase.profesor}
                            </p>
                            <p className="text-xs text-red-500 mb-6">Esta acción no se puede deshacer.</p>
                            <div className="flex gap-3">
                                <button onClick={() => { setShowDeleteModal(false); setDeletingClase(null); }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                    Cancelar
                                </button>
                                <button onClick={handleDelete} disabled={processing} className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl hover:bg-red-600 text-sm font-medium disabled:opacity-50">
                                    {processing ? 'Eliminando...' : 'Sí, eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ MODAL CONFIGURAR JORNADA ═══════ */}
            {showConfigModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowConfigModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#181b49] to-[#293577] rounded-t-2xl px-6 py-4 flex-shrink-0">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                Configurar Jornada Horaria
                            </h2>
                            <p className="text-blue-200 text-xs">Define los bloques de clase y descansos del día escolar</p>
                        </div>
                        <div className="p-6 space-y-2 overflow-y-auto flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Bloques ({configSlots.length})</p>
                                <p className="text-[10px] text-gray-400">{configSlots.filter(s => !s.esDescanso).length} clases · {configSlots.filter(s => s.esDescanso).length} descansos</p>
                            </div>
                            {configSlots.map((slot, idx) => (
                                <div key={idx} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${slot.esDescanso ? 'bg-amber-50/50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <span className="text-[10px] text-gray-400 font-mono w-4 text-center">{idx + 1}</span>
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] text-gray-500">Inicio</label>
                                            <input
                                                type="time"
                                                value={slot.hora.padStart(5, '0')}
                                                onChange={e => { const [h, m] = e.target.value.split(':'); updateConfigSlot(idx, 'hora', `${parseInt(h)}:${m}`); }}
                                                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500">Fin</label>
                                            <input
                                                type="time"
                                                value={(slot.horaFin || '').padStart(5, '0')}
                                                onChange={e => { const [h, m] = e.target.value.split(':'); updateConfigSlot(idx, 'horaFin', `${parseInt(h)}:${m}`); }}
                                                className="w-full text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]"
                                            />
                                        </div>
                                    </div>
                                    <label className="flex items-center gap-1 cursor-pointer px-1">
                                        <input
                                            type="checkbox"
                                            checked={!!slot.esDescanso}
                                            onChange={e => updateConfigSlot(idx, 'esDescanso', e.target.checked)}
                                            className="rounded text-amber-500 focus:ring-amber-300 w-3.5 h-3.5"
                                        />
                                        <span className={`text-[10px] whitespace-nowrap ${slot.esDescanso ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>Desc.</span>
                                    </label>
                                    <button type="button" onClick={() => removeConfigSlot(idx)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={() => addConfigSlot(false)} className="flex-1 px-3 py-2.5 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center justify-center gap-1.5 font-medium">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    Bloque de clase
                                </button>
                                <button type="button" onClick={() => addConfigSlot(true)} className="flex-1 px-3 py-2.5 border border-dashed border-amber-300 rounded-xl text-xs text-amber-600 hover:bg-amber-50 hover:border-amber-400 transition-colors flex items-center justify-center gap-1.5 font-medium">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.362-6.387 8.25 8.25 0 0 0 3 2Z" /></svg>
                                    Descanso
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
                            <button type="button" onClick={() => setShowConfigModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                Cancelar
                            </button>
                            <button type="button" onClick={() => setConfigSlots(DEFAULT_TIME_SLOTS.map(s => ({ ...s })))} className="px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-xs font-medium text-gray-500">
                                Restablecer
                            </button>
                            <button type="button" onClick={saveConfig} className="flex-1 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-[#293577]/25 text-sm font-medium">
                                Guardar Jornada
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
