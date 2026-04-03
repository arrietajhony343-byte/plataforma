import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { profesorMenuItems } from '@/Config/profesorMenu';

// ── Types ──
interface Actividad {
    id: number;
    titulo: string;
    descripcion: string | null;
    tipo: string;
    curso: string;
    cursoId: number;
    materia: string;
    cursoMateriaId: number;
    fechaAsignacion: string;
    fechaEntrega: string;
    porcentaje: number;
    activa: boolean;
    totalEstudiantes: number;
    entregados: number;
    calificados: number;
    pendientes: number;
}

interface CursoMateria {
    id: number;
    curso: string;
    cursoId: number;
    materia: string;
    nivel: string;
    totalEstudiantes?: number;
}

interface CursoResumen {
    id: number;
    nombre: string;
    nivel: string;
    totalEstudiantes: number;
    totalMaterias: number;
    totalActividades: number;
    activas: number;
    porCalificar: number;
    vencidas: number;
    materias: { id: number; nombre: string; pesoUsado: number }[];
}

interface EntregaDetail {
    id: number;
    estudianteId: number;
    estudiante: string;
    estado: 'pendiente' | 'entregada' | 'calificada' | 'atrasada' | 'devuelta';
    contenido: string | null;
    archivo: string | null;
    calificacion: number | null;
    retroalimentacion: string | null;
    notaDevolucion: string | null;
    fechaEntrega: string | null;
    fechaLimiteIndividual: string | null;
}

interface Props {
    profesor: { nombre: string };
    actividades: Actividad[];
    cursoMaterias: CursoMateria[];
    cursos: CursoResumen[];
}

// ── Tipo config ──
const tiposConfig: Record<string, { label: string; color: string; bg: string }> = {
    tarea:    { label: 'Tarea',    color: 'text-blue-700',   bg: 'bg-blue-100'   },
    quiz:     { label: 'Quiz',     color: 'text-purple-700', bg: 'bg-purple-100' },
    examen:   { label: 'Examen',   color: 'text-red-700',    bg: 'bg-red-100'    },
    proyecto: { label: 'Proyecto', color: 'text-emerald-700',bg: 'bg-emerald-100'},
    taller:   { label: 'Taller',   color: 'text-amber-700',  bg: 'bg-amber-100'  },
};

const tiposOpciones = ['tarea', 'quiz', 'examen', 'proyecto', 'taller'] as const;

export default function Actividades({ profesor, actividades, cursoMaterias, cursos }: Props) {
    // ── State ──
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todas');
    const [cursoSeleccionadoId, setCursoSeleccionadoId] = useState<number | null>(cursos[0]?.id ?? null);
    const [materiaSeleccionadaId, setMateriaSeleccionadaId] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Modal crear/editar
    const [showForm, setShowForm] = useState(false);
    const [editando, setEditando] = useState<Actividad | null>(null);
    const [form, setForm] = useState({
        curso_materia_id: '',
        titulo: '',
        descripcion: '',
        tipo: 'tarea' as string,
        fecha_entrega: '',
        porcentaje: '',
        activa: true,
    });

    // Modal entregas/calificar
    const [showEntregas, setShowEntregas] = useState<Actividad | null>(null);
    const [entregas, setEntregas] = useState<EntregaDetail[]>([]);
    const [loadingEntregas, setLoadingEntregas] = useState(false);
    const [calificaciones, setCalificaciones] = useState<Record<number, { nota: string; retro: string }>>({});
    const [filtroEntrega, setFiltroEntrega] = useState('todos');

    // Modal detalle actividad (vista expandida)
    const [showDetalle, setShowDetalle] = useState<Actividad | null>(null);

    // Devolver / Extender states
    const [devolviendo, setDevolviendo] = useState<{ id: number; nota: string } | null>(null);
    const [extendiendoInd, setExtendiendoInd] = useState<{ id: number; fecha: string } | null>(null);
    const [extendiendoGeneral, setExtendiendoGeneral] = useState(false);
    const [fechaExtGeneral, setFechaExtGeneral] = useState('');

    // ── Computed ──
    useEffect(() => {
        if (cursos.length === 0) {
            setCursoSeleccionadoId(null);
            return;
        }
        if (cursoSeleccionadoId === null || !cursos.some(c => c.id === cursoSeleccionadoId)) {
            setCursoSeleccionadoId(cursos[0].id);
        }
    }, [cursos, cursoSeleccionadoId]);

    useEffect(() => {
        setMateriaSeleccionadaId(null);
    }, [cursoSeleccionadoId]);

    const cursoSeleccionado = useMemo(
        () => cursos.find(c => c.id === cursoSeleccionadoId) ?? null,
        [cursos, cursoSeleccionadoId]
    );

    const materiasCursoSeleccionado = useMemo(() => {
        if (!cursoSeleccionadoId) return [];

        return cursoMaterias
            .filter(cm => cm.cursoId === cursoSeleccionadoId)
            .map(cm => {
                const acts = actividades.filter(a => a.cursoMateriaId === cm.id);
                return {
                    ...cm,
                    totalActividades: acts.length,
                    activas: acts.filter(a => a.activa).length,
                    porCalificar: acts.reduce((s, a) => s + Math.max(0, a.entregados - a.calificados), 0),
                    pesoProgramado: acts.reduce((s, a) => s + a.porcentaje, 0),
                };
            })
            .sort((a, b) => a.materia.localeCompare(b.materia));
    }, [cursoSeleccionadoId, cursoMaterias, actividades]);

    const stats = useMemo(() => {
        const activas = actividades.filter(a => a.activa).length;
        const inactivas = actividades.filter(a => !a.activa).length;
        const porCalificar = actividades.reduce((s, a) => s + Math.max(0, a.entregados - a.calificados), 0);
        const totalEst = new Set(actividades.map(a => a.cursoId)).size;
        return { activas, inactivas, porCalificar, total: actividades.length, cursos: totalEst };
    }, [actividades]);

    const filtradas = useMemo(() => {
        let r = [...actividades];
        if (cursoSeleccionadoId) r = r.filter(a => a.cursoId === cursoSeleccionadoId);
        if (materiaSeleccionadaId) r = r.filter(a => a.cursoMateriaId === materiaSeleccionadaId);
        if (filtroEstado === 'activas') r = r.filter(a => a.activa);
        else if (filtroEstado === 'cerradas') r = r.filter(a => !a.activa);
        else if (filtroEstado === 'porCalificar') r = r.filter(a => a.entregados > a.calificados && a.activa);
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            r = r.filter(a =>
                a.titulo.toLowerCase().includes(s) ||
                a.materia.toLowerCase().includes(s) ||
                a.curso.toLowerCase().includes(s)
            );
        }
        return r;
    }, [actividades, cursoSeleccionadoId, materiaSeleccionadaId, filtroEstado, searchTerm]);

    // Agrupadas por materia
    const actividadesPorMateria = useMemo(() => {
        const grupos: Record<number, { cmId: number; materia: string; curso: string; actividades: Actividad[] }> = {};
        filtradas.forEach(act => {
            if (!grupos[act.cursoMateriaId]) {
                grupos[act.cursoMateriaId] = { cmId: act.cursoMateriaId, materia: act.materia, curso: act.curso, actividades: [] };
            }
            grupos[act.cursoMateriaId].actividades.push(act);
        });
        return Object.values(grupos).sort((a, b) => a.materia.localeCompare(b.materia));
    }, [filtradas]);

    // ── Handlers ──
    const openCreate = () => {
        setEditando(null);
        setForm({
            curso_materia_id: cursoMaterias[0]?.id.toString() ?? '',
            titulo: '', descripcion: '', tipo: 'tarea',
            fecha_entrega: '', porcentaje: '', activa: true,
        });
        setShowForm(true);
    };

    const openEdit = (act: Actividad) => {
        setEditando(act);
        setForm({
            curso_materia_id: act.cursoMateriaId.toString(),
            titulo: act.titulo,
            descripcion: act.descripcion ?? '',
            tipo: act.tipo,
            fecha_entrega: act.fechaEntrega,
            porcentaje: act.porcentaje.toString(),
            activa: act.activa,
        });
        setShowForm(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.curso_materia_id || !form.titulo || !form.fecha_entrega) return;
        setProcessing(true);

        const payload = {
            curso_materia_id: parseInt(form.curso_materia_id),
            titulo: form.titulo,
            descripcion: form.descripcion || null,
            tipo: form.tipo,
            fecha_entrega: form.fecha_entrega,
            porcentaje: parseFloat(form.porcentaje) || 0,
            activa: form.activa,
        };

        if (editando) {
            router.put(`/profesor/actividades/${editando.id}`, payload, {
                onSuccess: () => { setShowForm(false); setEditando(null); },
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post('/profesor/actividades', payload, {
                onSuccess: () => setShowForm(false),
                onFinish: () => setProcessing(false),
            });
        }
    };

    const handleDelete = (act: Actividad) => {
        if (!confirm(`¿Eliminar "${act.titulo}"? Se eliminarán todas las entregas asociadas.`)) return;
        router.delete(`/profesor/actividades/${act.id}`);
    };

    const handleToggleActiva = (act: Actividad) => {
        router.put(`/profesor/actividades/${act.id}`, { activa: !act.activa }, { preserveScroll: true });
    };

    // ── Entregas ──
    const openEntregas = useCallback(async (act: Actividad) => {
        setShowEntregas(act);
        setLoadingEntregas(true);
        setFeedback(null);
        setFiltroEntrega('todos');
        setCalificaciones({});
        try {
            const res = await fetch(`/profesor/actividades/${act.id}/entregas`);
            const data = await res.json();
            const ents: EntregaDetail[] = data.entregas ?? data;
            setEntregas(ents);
            const init: Record<number, { nota: string; retro: string }> = {};
            ents.forEach(e => {
                init[e.id] = {
                    nota: e.calificacion?.toString() ?? '',
                    retro: e.retroalimentacion ?? '',
                };
            });
            setCalificaciones(init);
        } catch {
            setEntregas([]);
        }
        setLoadingEntregas(false);
    }, []);

    const csrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';

    const putEntrega = async (entregaId: number, body: Record<string, unknown>) => {
        const res = await fetch(`/profesor/entregas/${entregaId}/extender`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf(), 'Accept': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.message || 'No se pudo actualizar la entrega.');
        }
        return data;
    };

    const handleGuardarCalificaciones = async () => {
        if (!showEntregas) return;

        setFeedback(null);

        const invalidNote = Object.entries(calificaciones).find(([, v]) => {
            if (v.nota === '') return false;
            const nota = Number.parseFloat(v.nota);
            return Number.isNaN(nota) || nota < 0 || nota > 5;
        });

        if (invalidNote) {
            setFeedback({ type: 'error', text: 'Cada nota debe ser un número entre 0.0 y 5.0.' });
            return;
        }

        const cals = Object.entries(calificaciones)
            .filter(([, v]) => v.nota !== '')
            .map(([id, v]) => ({
                entrega_id: parseInt(id),
                calificacion: parseFloat(v.nota),
                retroalimentacion: v.retro || null,
            }));
        if (cals.length === 0) return;
        setProcessing(true);
        try {
            const res = await fetch(`/profesor/actividades/${showEntregas.id}/calificar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf(), 'Accept': 'application/json' },
                body: JSON.stringify({ calificaciones: cals }),
            });
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.message || 'No se pudieron guardar las calificaciones.');
            }

            if ((data.saved ?? 0) > 0) {
                setShowEntregas(null);
                router.reload({ only: ['actividades'] });
                return;
            }

            setFeedback({ type: 'error', text: 'No se guardaron calificaciones. Verifica que el estudiante haya entregado antes de calificar.' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al guardar calificaciones.';
            setFeedback({ type: 'error', text: message });
        } finally {
            setProcessing(false);
        }
    };

    const handleDevolver = async (entregaId: number, nota: string) => {
        try {
            setFeedback(null);
            await putEntrega(entregaId, { tipo: 'devolver', nota_devolucion: nota || null });
            setDevolviendo(null);
            if (showEntregas) await openEntregas(showEntregas);
            router.reload({ only: ['actividades'] });
            setFeedback({ type: 'success', text: 'Entrega devuelta correctamente. El estudiante fue notificado y ya puede volver a enviarla.' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo devolver la entrega.';
            setFeedback({ type: 'error', text: message });
        }
    };

    const handleExtenderIndividual = async (entregaId: number, fecha: string) => {
        if (!fecha) return;
        try {
            setFeedback(null);
            await putEntrega(entregaId, { tipo: 'extender_individual', nueva_fecha: fecha });
            setExtendiendoInd(null);
            if (showEntregas) await openEntregas(showEntregas);
            setFeedback({ type: 'success', text: 'Plazo individual actualizado.' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo extender el plazo individual.';
            setFeedback({ type: 'error', text: message });
        }
    };

    const handleExtenderGeneral = async () => {
        if (!showEntregas || !fechaExtGeneral) return;
        setProcessing(true);
        try {
            setFeedback(null);
            const res = await fetch(`/profesor/actividades/${showEntregas.id}/extender-plazo`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrf(), 'Accept': 'application/json' },
                body: JSON.stringify({ nueva_fecha: fechaExtGeneral }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.message || 'No se pudo extender el plazo general.');
            }

            setExtendiendoGeneral(false);
            setFechaExtGeneral('');
            if (showEntregas) await openEntregas(showEntregas);
            router.reload({ only: ['actividades'] });
            setFeedback({ type: 'success', text: 'Plazo general actualizado para todos los estudiantes.' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo extender el plazo general.';
            setFeedback({ type: 'error', text: message });
        } finally {
            setProcessing(false);
        }
    };

    const handleReenviar = async (entregaId: number) => {
        if (!confirm('¿Reactivar para que el estudiante vuelva a enviar? Se eliminará la calificación actual.')) return;
        try {
            setFeedback(null);
            await putEntrega(entregaId, { tipo: 'reactivar' });
            if (showEntregas) await openEntregas(showEntregas);
            router.reload({ only: ['actividades'] });
            setFeedback({ type: 'success', text: 'Entrega reactivada. El estudiante fue notificado para reenviar.' });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'No se pudo reactivar la entrega.';
            setFeedback({ type: 'error', text: message });
        }
    };

    const entregasFiltradas = useMemo(() => {
        if (filtroEntrega === 'todos') return entregas;
        return entregas.filter(e => e.estado === filtroEntrega);
    }, [entregas, filtroEntrega]);

    // ── Date helpers ──
    const formatDate = (d: string) => {
        if (!d) return '—';
        const date = new Date(d.slice(0, 10) + 'T00:00:00');
        return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getDaysLeft = (d: string) => {
        if (!d) return null;
        const diff = Math.ceil((new Date(d.slice(0, 10) + 'T00:00:00').getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
        return diff;
    };

    const getEstado = (act: Actividad) => {
        if (!act.activa) return 'cerrada';
        const days = getDaysLeft(act.fechaEntrega);
        if (days !== null && days < 0) return 'vencida';
        return 'activa';
    };

    const estadoConfig: Record<string, { label: string; cls: string }> = {
        activa:  { label: 'Activa',  cls: 'bg-emerald-100 text-emerald-700' },
        cerrada: { label: 'Cerrada', cls: 'bg-gray-100 text-gray-500' },
        vencida: { label: 'Vencida', cls: 'bg-red-100 text-red-600' },
    };

    const entregaEstadoConfig: Record<string, { label: string; cls: string; dot: string }> = {
        pendiente:  { label: 'Pendiente',  cls: 'text-amber-600', dot: 'bg-amber-400' },
        entregada:  { label: 'Entregada',  cls: 'text-blue-600',  dot: 'bg-blue-400'  },
        calificada: { label: 'Calificada', cls: 'text-emerald-600', dot: 'bg-emerald-400' },
        atrasada:   { label: 'Atrasada',   cls: 'text-red-600',   dot: 'bg-red-400'   },
        devuelta:   { label: 'Devuelta',   cls: 'text-orange-600', dot: 'bg-orange-400' },
    };

    // ── Render ──
    return (
        <SidebarLayout menuItems={profesorMenuItems} userInfo={{ name: profesor?.nombre ?? '', role: 'Profesor' }}>
            <Head title="Actividades" />

            <div className="max-w-7xl mx-auto space-y-5">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Gestión de Actividades</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Crea, asigna y califica actividades para tus estudiantes</p>
                    </div>
                    <Link
                        href={cursoSeleccionado ? `/profesor/actividades/crear?curso_id=${cursoSeleccionado.id}` : '/profesor/actividades/crear'}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#293577] text-white rounded-xl text-sm font-semibold hover:bg-[#181b49] transition-colors shadow-lg shadow-[#293577]/20"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                        Nueva Actividad
                    </Link>
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Activas', value: stats.activas, color: 'emerald', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { label: 'Por calificar', value: stats.porCalificar, color: 'amber', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
                        { label: 'Cerradas', value: stats.inactivas, color: 'gray', icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z' },
                        { label: 'Total', value: stats.total, color: 'blue', icon: 'M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4">
                            <div className={`w-9 h-9 rounded-lg bg-${s.color}-100 flex items-center justify-center mb-2`}>
                                <svg className={`w-5 h-5 text-${s.color}-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={s.icon} /></svg>
                            </div>
                            <p className="text-xl sm:text-2xl font-extrabold text-gray-800">{s.value}</p>
                            <p className="text-xs text-gray-500">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* ── Cursos asignados ── */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                        <div>
                            <h2 className="text-sm sm:text-base font-extrabold text-gray-900">Tus cursos</h2>
                            <p className="text-xs text-gray-500">Selecciona un curso para ver su detalle y gestionar actividades por materia</p>
                        </div>
                        <span className="text-xs font-semibold text-[#293577] bg-[#293577]/10 px-2.5 py-1 rounded-full w-fit">
                            {cursos.length} curso{cursos.length !== 1 ? 's' : ''} asignado{cursos.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {cursos.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                            No tienes cursos asignados en el año activo.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                            {cursos.map(curso => {
                                const activo = cursoSeleccionadoId === curso.id;
                                return (
                                    <div
                                        key={curso.id}
                                        className={`rounded-xl border p-3.5 transition-all ${
                                            activo
                                                ? 'border-[#293577] bg-[#293577]/5 shadow-sm'
                                                : 'border-gray-200 bg-white hover:border-[#293577]/40 hover:shadow-sm'
                                        }`}
                                    >
                                        <button
                                            onClick={() => setCursoSeleccionadoId(curso.id)}
                                            className="w-full text-left"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="text-sm font-extrabold text-gray-900">{curso.nombre}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">Nivel: {curso.nivel}</p>
                                                </div>
                                                {activo && (
                                                    <span className="text-[10px] font-bold text-[#293577] bg-white border border-[#293577]/20 rounded-full px-2 py-0.5">
                                                        Seleccionado
                                                    </span>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mt-3">
                                                <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
                                                    <p className="text-[10px] text-gray-500">Estudiantes</p>
                                                    <p className="text-sm font-extrabold text-gray-800">{curso.totalEstudiantes}</p>
                                                </div>
                                                <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
                                                    <p className="text-[10px] text-gray-500">Materias</p>
                                                    <p className="text-sm font-extrabold text-gray-800">{curso.totalMaterias}</p>
                                                </div>
                                                <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
                                                    <p className="text-[10px] text-gray-500">Actividades</p>
                                                    <p className="text-sm font-extrabold text-gray-800">{curso.totalActividades}</p>
                                                </div>
                                                <div className="rounded-lg bg-gray-50 border border-gray-100 p-2">
                                                    <p className="text-[10px] text-gray-500">Por calificar</p>
                                                    <p className="text-sm font-extrabold text-amber-600">{curso.porCalificar}</p>
                                                </div>
                                            </div>
                                        </button>

                                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                            <span className="text-[11px] text-gray-500">{curso.activas} activas · {curso.vencidas} vencidas</span>
                                            <Link
                                                href={`/profesor/actividades/crear?curso_id=${curso.id}`}
                                                className="text-xs font-bold text-[#293577] hover:underline"
                                            >
                                                Asignar actividad
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Detalle del curso seleccionado ── */}
                {cursoSeleccionado && (
                    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-base font-extrabold text-gray-900">Detalle de {cursoSeleccionado.nombre}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {cursoSeleccionado.totalEstudiantes} estudiantes · {cursoSeleccionado.totalMaterias} materias · {cursoSeleccionado.totalActividades} actividades
                                </p>
                            </div>
                            <Link
                                href={`/profesor/actividades/crear?curso_id=${cursoSeleccionado.id}`}
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#293577] text-white text-xs font-semibold hover:bg-[#181b49] transition-colors w-fit"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                Nueva actividad para este curso
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {materiasCursoSeleccionado.map(cm => {
                                const activo = materiaSeleccionadaId === cm.id;
                                return (
                                    <div
                                        key={cm.id}
                                        className={`rounded-xl border p-3 ${activo ? 'border-[#293577] bg-[#293577]/5' : 'border-gray-200 bg-white'}`}
                                    >
                                        <button
                                            onClick={() => setMateriaSeleccionadaId(prev => (prev === cm.id ? null : cm.id))}
                                            className="w-full text-left"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-bold text-gray-900">{cm.materia}</p>
                                                {activo && <span className="text-[10px] font-bold text-[#293577]">Filtrando</span>}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {cm.totalActividades} actividad{cm.totalActividades !== 1 ? 'es' : ''} · {cm.pesoProgramado.toFixed(0)}% programado
                                            </p>
                                            <p className="text-[11px] text-gray-500 mt-1">
                                                {cm.activas} activas · {cm.porCalificar} por calificar
                                            </p>
                                        </button>
                                        <div className="mt-2 pt-2 border-t border-gray-100">
                                            <Link
                                                href={`/profesor/actividades/crear?curso_id=${cursoSeleccionado.id}&curso_materia_id=${cm.id}`}
                                                className="text-xs font-bold text-[#293577] hover:underline"
                                            >
                                                Asignar por esta materia
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Filters ── */}
                <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Buscar por título, materia o curso..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/20 focus:border-[#293577]"
                        />
                    </div>
                    <select
                        value={materiaSeleccionadaId ? materiaSeleccionadaId.toString() : ''}
                        onChange={e => setMateriaSeleccionadaId(e.target.value ? parseInt(e.target.value) : null)}
                        disabled={!cursoSeleccionado}
                        className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/20 min-w-[220px] disabled:bg-gray-50 disabled:text-gray-400"
                    >
                        <option value="">{cursoSeleccionado ? 'Todas las materias del curso' : 'Selecciona un curso'}</option>
                        {materiasCursoSeleccionado.map(cm => (
                            <option key={cm.id} value={cm.id}>{cm.materia} — {cm.totalActividades} act.</option>
                        ))}
                    </select>
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hidden">
                        {[
                            { k: 'todas', l: 'Todas' },
                            { k: 'activas', l: 'Activas' },
                            { k: 'porCalificar', l: 'Por calificar' },
                            { k: 'cerradas', l: 'Cerradas' },
                        ].map(f => (
                            <button
                                key={f.k}
                                onClick={() => setFiltroEstado(f.k)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                    filtroEstado === f.k
                                        ? 'bg-[#293577] text-white shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {f.l}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Activity List by Materia ── */}
                {actividadesPorMateria.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                        <svg className="w-14 h-14 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                        <p className="text-sm font-semibold text-gray-500 mb-1">
                            {cursoSeleccionado ? `No hay actividades para ${cursoSeleccionado.nombre}` : 'No se encontraron actividades'}
                        </p>
                        <p className="text-xs text-gray-400 mb-4">Prueba con otros filtros o crea una nueva actividad</p>
                        <Link
                            href={cursoSeleccionado ? `/profesor/actividades/crear?curso_id=${cursoSeleccionado.id}` : '/profesor/actividades/crear'}
                            className="inline-flex items-center gap-2 text-sm text-[#293577] font-semibold hover:underline"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Crear primera actividad
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {actividadesPorMateria.map(grupo => {
                            const totalGrupo = grupo.actividades.length;
                            const activasGrupo = grupo.actividades.filter(a => a.activa).length;
                            const porCalificarGrupo = grupo.actividades.reduce((s, a) => s + Math.max(0, a.entregados - a.calificados), 0);
                            const pesoTotal = grupo.actividades.reduce((s, a) => s + a.porcentaje, 0);

                            return (
                                <div key={grupo.cmId} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                    {/* ── Materia Header ── */}
                                    <div className="bg-gradient-to-r from-[#293577]/5 via-blue-50/50 to-white border-b border-[#293577]/10 px-5 py-4 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-[#293577] flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-sm">
                                                {grupo.materia.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-gray-900 text-base leading-tight">{grupo.materia}</h3>
                                                <p className="text-xs text-gray-500">{grupo.curso} · {totalGrupo} actividad{totalGrupo !== 1 ? 'es' : ''} · {pesoTotal.toFixed(0)}% peso total</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {activasGrupo > 0 && (
                                                <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold">{activasGrupo} activa{activasGrupo !== 1 ? 's' : ''}</span>
                                            )}
                                            {porCalificarGrupo > 0 && (
                                                <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold">{porCalificarGrupo} por calificar</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* ── Actividades del grupo ── */}
                                    <div className="divide-y divide-gray-100">
                                        {grupo.actividades.map((act, actIdx) => {
                                            const estado = getEstado(act);
                                            const ec = estadoConfig[estado];
                                            const tc = tiposConfig[act.tipo] || tiposConfig.tarea;
                                            const days = getDaysLeft(act.fechaEntrega);
                                            const progreso = act.totalEstudiantes > 0 ? (act.entregados / act.totalEstudiantes) * 100 : 0;
                                            const progresoCalif = act.totalEstudiantes > 0 ? (act.calificados / act.totalEstudiantes) * 100 : 0;
                                            const sinCalificar = act.entregados - act.calificados;

                                            return (
                                                <div key={act.id} className={`flex items-start gap-3 sm:gap-4 px-5 py-3.5 transition-colors ${actIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'} hover:bg-blue-50/20 ${!act.activa ? 'opacity-60' : ''}`}>
                                                    {/* Tipo badge */}
                                                    <div className={`w-9 h-9 rounded-xl ${tc.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                                        <svg className={`w-4 h-4 ${tc.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                                            <h4 className="font-bold text-gray-900 text-sm truncate">{act.titulo}</h4>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ec.cls}`}>{ec.label}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tc.bg} ${tc.color}`}>{tc.label}</span>
                                                        </div>
                                                        {act.descripcion && (
                                                            <p className="text-[11px] text-gray-400 line-clamp-1 mb-1.5">{act.descripcion}</p>
                                                        )}
                                                        <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap">
                                                            <span className="font-semibold text-gray-600">Peso: {act.porcentaje}%</span>
                                                            <span className="flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" /></svg>
                                                                {formatDate(act.fechaEntrega)}
                                                            </span>
                                                            {days !== null && act.activa && (
                                                                <span className={`font-bold ${days < 0 ? 'text-red-500' : days <= 2 ? 'text-amber-500' : 'text-emerald-600'}`}>
                                                                    {days < 0 ? `Vencida (${Math.abs(days)}d)` : days === 0 ? 'Vence hoy' : days === 1 ? 'Vence mañana' : `${days}d restantes`}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {/* Barra de progreso */}
                                                        <div className="mt-2 flex items-center gap-2.5">
                                                            <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden flex flex-shrink-0">
                                                                <div className="bg-emerald-500 h-full transition-all" style={{ width: `${progresoCalif}%` }} />
                                                                <div className="bg-blue-400 h-full transition-all" style={{ width: `${Math.max(0, progreso - progresoCalif)}%` }} />
                                                            </div>
                                                            <span className="text-[10px] text-gray-400">{act.entregados}/{act.totalEstudiantes}</span>
                                                            {act.calificados > 0 && <span className="text-[10px] text-emerald-600 font-bold">{act.calificados} calif.</span>}
                                                            {sinCalificar > 0 && <span className="text-[10px] text-amber-600 font-bold">{sinCalificar} pend.</span>}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                                        <button
                                                            onClick={() => openEntregas(act)}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                                                sinCalificar > 0
                                                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                                                    : 'bg-[#293577] hover:bg-[#181b49] text-white'
                                                            }`}
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                                                            <span className="hidden sm:inline">{sinCalificar > 0 ? 'Calificar' : 'Entregas'}</span>
                                                        </button>
                                                        <Link
                                                            href={`/profesor/actividades/${act.id}/editar`}
                                                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-[#293577] hover:border-[#293577]/30 transition-colors"
                                                            title="Editar"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleToggleActiva(act)}
                                                            className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-colors ${
                                                                act.activa ? 'border-gray-200 text-gray-400 hover:bg-orange-50 hover:text-orange-500 hover:border-orange-200' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                                                            }`}
                                                            title={act.activa ? 'Cerrar actividad' : 'Reactivar'}
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={act.activa ? 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z' : 'M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z'} /></svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(act)}
                                                            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Legend ── */}
                <div className="flex items-center gap-4 text-[10px] text-gray-400 px-1">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-emerald-500" /> Calificados</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-blue-400" /> Entregados sin calificar</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-gray-200" /> Pendientes</span>
                </div>
            </div>

            {/* ════════════════════════════════════════════════════
                █  Modal: Crear / Editar Actividad
                ════════════════════════════════════════════════════ */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-br from-[#293577] to-[#181b49] p-5 text-white flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    </div>
                                    <div>
                                        <h2 className="font-extrabold">{editando ? 'Editar Actividad' : 'Nueva Actividad'}</h2>
                                        <p className="text-white/60 text-xs">Configura los detalles de la actividad</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto p-5">
                            <form id="form-actividad" onSubmit={handleSubmit} className="space-y-4">
                                {/* Curso-Materia */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Curso y Materia *</label>
                                    <select
                                        value={form.curso_materia_id}
                                        onChange={e => setForm({ ...form, curso_materia_id: e.target.value })}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                        disabled={!!editando}
                                        required
                                    >
                                        <option value="">Seleccionar...</option>
                                        {cursoMaterias.map(cm => (
                                            <option key={cm.id} value={cm.id}>{cm.materia} — {cm.curso}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Titulo */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Título *</label>
                                    <input
                                        type="text"
                                        value={form.titulo}
                                        onChange={e => setForm({ ...form, titulo: e.target.value })}
                                        placeholder="Ej: Taller de ecuaciones cuadráticas"
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                        required
                                    />
                                </div>

                                {/* Instrucciones */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Instrucciones / Descripción</label>
                                    <textarea
                                        value={form.descripcion}
                                        onChange={e => setForm({ ...form, descripcion: e.target.value })}
                                        rows={4}
                                        placeholder="Escribe las instrucciones detalladas para tus estudiantes..."
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                    />
                                </div>

                                {/* Tipo + Porcentaje */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo *</label>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {tiposOpciones.map(t => {
                                                const tc = tiposConfig[t];
                                                return (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setForm({ ...form, tipo: t })}
                                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all border ${
                                                            form.tipo === t
                                                                ? `${tc.bg} ${tc.color} border-current`
                                                                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <span className={`w-2 h-2 rounded-full ${form.tipo === t ? 'bg-current' : 'bg-gray-300'}`} />
                                                        {tc.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha Entrega *</label>
                                            <input
                                                type="date"
                                                value={form.fecha_entrega}
                                                onChange={e => setForm({ ...form, fecha_entrega: e.target.value })}
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Peso (%)</label>
                                            <input
                                                type="number"
                                                value={form.porcentaje}
                                                onChange={e => setForm({ ...form, porcentaje: e.target.value })}
                                                min={0}
                                                max={100}
                                                step={0.01}
                                                placeholder="15"
                                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                            />
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.activa}
                                                onChange={e => setForm({ ...form, activa: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-[#293577] focus:ring-[#293577]"
                                            />
                                            <span className="text-sm text-gray-700 font-medium">Publicar al guardar</span>
                                        </label>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3 flex-shrink-0">
                            <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="form-actividad"
                                disabled={processing}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#293577] text-white px-4 py-2.5 rounded-xl hover:bg-[#181b49] text-sm font-semibold disabled:opacity-50 transition-colors"
                            >
                                {processing ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                                ) : (
                                    <>{editando ? 'Guardar Cambios' : 'Crear Actividad'}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ════════════════════════════════════════════════════
                █  Modal: Entregas + Calificar
                ════════════════════════════════════════════════════ */}
            {showEntregas && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4" onClick={() => setShowEntregas(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-br from-[#293577] to-[#181b49] p-5 text-white flex-shrink-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="font-extrabold text-base">{showEntregas.titulo}</h2>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-white/60">
                                        <span>{showEntregas.materia} · {showEntregas.curso}</span>
                                        <span>·</span>
                                        <span>Peso: {showEntregas.porcentaje}%</span>
                                        <span>·</span>
                                        <span>Entrega: {formatDate(showEntregas.fechaEntrega)}</span>
                                    </div>
                                </div>
                                <button onClick={() => setShowEntregas(null)} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Progress summary */}
                            <div className="grid grid-cols-3 gap-3 mt-4">
                                <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                                    <p className="text-lg font-extrabold">{showEntregas.entregados}/{showEntregas.totalEstudiantes}</p>
                                    <p className="text-[10px] text-white/50">Entregados</p>
                                </div>
                                <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                                    <p className="text-lg font-extrabold text-emerald-300">{showEntregas.calificados}</p>
                                    <p className="text-[10px] text-white/50">Calificados</p>
                                </div>
                                <div className="bg-white/10 rounded-xl px-3 py-2 text-center">
                                    <p className="text-lg font-extrabold text-amber-300">{showEntregas.pendientes}</p>
                                    <p className="text-[10px] text-white/50">Pendientes</p>
                                </div>
                            </div>
                        </div>

                        {/* Filter entregas */}
                        <div className="px-5 pt-3 pb-2 border-b border-gray-100 flex items-center gap-2 overflow-x-auto scrollbar-hidden flex-shrink-0">
                            {[
                                { k: 'todos', l: 'Todos' },
                                { k: 'pendiente', l: 'Pendientes' },
                                { k: 'entregada', l: 'Entregadas' },
                                { k: 'atrasada', l: 'Atrasadas' },
                                { k: 'devuelta', l: 'Devueltas' },
                                { k: 'calificada', l: 'Calificadas' },
                            ].map(f => (
                                <button
                                    key={f.k}
                                    onClick={() => setFiltroEntrega(f.k)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                                        filtroEntrega === f.k ? 'bg-[#293577] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {f.l}
                                </button>
                            ))}
                        </div>

                        <div className="px-5 py-2.5 border-b border-gray-100 bg-amber-50/60">
                            <p className="text-[11px] text-amber-800">
                                <span className="font-bold">Devolver:</span> devuelve la entrega actual con comentario para corrección.
                                {' '}
                                <span className="font-bold">Reenviar (Reactivar):</span> reabre una entrega calificada para un nuevo intento.
                            </p>
                        </div>

                        {feedback && (
                            <div className={`mx-4 mt-3 mb-1 rounded-lg border px-3 py-2 text-xs ${
                                feedback.type === 'success'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                    : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                                {feedback.text}
                            </div>
                        )}

                        {/* Entregas list */}
                        <div className="overflow-y-auto flex-1 p-4 space-y-2">
                            {loadingEntregas ? (
                                <div className="py-12 text-center">
                                    <div className="w-8 h-8 border-3 border-[#293577] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                                    <p className="text-sm text-gray-400">Cargando entregas...</p>
                                </div>
                            ) : entregasFiltradas.length === 0 ? (
                                <div className="py-12 text-center">
                                    <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
                                    <p className="text-sm text-gray-400">No hay entregas en este estado</p>
                                </div>
                            ) : (
                                entregasFiltradas.map(e => {
                                    const ec = entregaEstadoConfig[e.estado] || entregaEstadoConfig.pendiente;
                                    const cal = calificaciones[e.id] || { nota: '', retro: '' };
                                    return (
                                        <div key={e.id} className={`rounded-xl border p-3 sm:p-4 transition-all ${
                                            e.estado === 'calificada' ? 'bg-emerald-50/30 border-emerald-200' :
                                            e.estado === 'entregada' ? 'bg-blue-50/30 border-blue-200' :
                                            e.estado === 'devuelta' ? 'bg-orange-50/40 border-orange-200' :
                                            'bg-gray-50/50 border-gray-200'
                                        }`}>
                                            <div className="flex items-start gap-3">
                                                {/* Avatar */}
                                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                                                    e.estado === 'calificada' ? 'bg-emerald-500' :
                                                    e.estado === 'entregada' ? 'bg-blue-500' :
                                                    'bg-gray-300'
                                                }`}>
                                                    {e.estudiante.charAt(0)}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-semibold text-gray-800">{e.estudiante}</p>
                                                        <span className={`flex items-center gap-1 text-[10px] font-bold ${ec.cls}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${ec.dot}`} />
                                                            {ec.label}
                                                        </span>
                                                        {e.fechaLimiteIndividual && (
                                                            <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                                                                Ext: {new Date(e.fechaLimiteIndividual).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {e.fechaEntrega && (
                                                        <p className="text-[11px] text-gray-400 mt-0.5">Entregado: {e.fechaEntrega}</p>
                                                    )}
                                                    {e.notaDevolucion && (
                                                        <p className="text-[11px] text-orange-600 bg-orange-50 rounded px-2 py-1 mt-1">
                                                            <span className="font-bold">Devuelta:</span> {e.notaDevolucion}
                                                        </p>
                                                    )}
                                                    {e.contenido && (
                                                        <p className="text-xs text-gray-500 mt-1 bg-white rounded-lg px-2.5 py-1.5 border border-gray-100 line-clamp-2">{e.contenido}</p>
                                                    )}

                                                    {/* Inline devolver form */}
                                                    {devolviendo?.id === e.id && (
                                                        <div className="mt-2 p-3 bg-orange-50 rounded-xl border border-orange-200">
                                                            <p className="text-[11px] font-bold text-orange-700 mb-1.5">Motivo de devolución (opcional):</p>
                                                            <textarea
                                                                value={devolviendo.nota}
                                                                onChange={ev => setDevolviendo({ id: e.id, nota: ev.target.value })}
                                                                rows={2}
                                                                maxLength={400}
                                                                placeholder="Ej: Falta el desarrollo del problema 3..."
                                                                className="w-full text-xs border border-orange-200 rounded-lg px-2.5 py-2 resize-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
                                                            />
                                                            <div className="flex gap-2 mt-2">
                                                                <button onClick={() => handleDevolver(e.id, devolviendo.nota)} className="flex-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition-colors">
                                                                    Confirmar devolución
                                                                </button>
                                                                <button onClick={() => setDevolviendo(null)} className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                                                                    Cancelar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Inline extender individual form */}
                                                    {extendiendoInd?.id === e.id && (
                                                        <div className="mt-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
                                                            <p className="text-[11px] font-bold text-blue-700 mb-1.5">Nueva fecha límite individual:</p>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="date"
                                                                    value={extendiendoInd.fecha}
                                                                    onChange={ev => setExtendiendoInd({ id: e.id, fecha: ev.target.value })}
                                                                    min={new Date().toISOString().slice(0, 10)}
                                                                    className="flex-1 text-xs border border-blue-200 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-blue-300"
                                                                />
                                                                <button onClick={() => handleExtenderIndividual(e.id, extendiendoInd.fecha)} disabled={!extendiendoInd.fecha} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors">
                                                                    Guardar
                                                                </button>
                                                                <button onClick={() => setExtendiendoInd(null)} className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Grade inputs */}
                                                    {(e.estado === 'entregada' || e.estado === 'atrasada' || e.estado === 'calificada') && devolviendo?.id !== e.id && (
                                                        <div className="mt-2 flex flex-col sm:flex-row gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <label className="text-[11px] text-gray-500 font-medium whitespace-nowrap">Nota:</label>
                                                                <input
                                                                    type="number"
                                                                    min={0}
                                                                    max={5}
                                                                    step={0.1}
                                                                    value={calificaciones[e.id]?.nota ?? ''}
                                                                    onChange={ev => setCalificaciones(prev => ({
                                                                        ...prev,
                                                                        [e.id]: { ...prev[e.id], nota: ev.target.value },
                                                                    }))}
                                                                    placeholder="0-5"
                                                                    className="w-20 px-2.5 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                                                />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={calificaciones[e.id]?.retro ?? ''}
                                                                onChange={ev => setCalificaciones(prev => ({
                                                                    ...prev,
                                                                    [e.id]: { ...prev[e.id], retro: ev.target.value },
                                                                }))}
                                                                placeholder="Retroalimentación (opcional)..."
                                                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions per entrega */}
                                                <div className="flex flex-col gap-1 flex-shrink-0">
                                                    {(e.estado === 'entregada' || e.estado === 'atrasada' || e.estado === 'calificada') && devolviendo?.id !== e.id && (
                                                        <button
                                                            onClick={() => setDevolviendo({ id: e.id, nota: '' })}
                                                            className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg text-[10px] font-bold hover:bg-orange-200 transition-colors"
                                                            title="Devolver para corrección"
                                                        >
                                                            Devolver
                                                        </button>
                                                    )}
                                                    {e.estado === 'calificada' && (
                                                        <button
                                                            onClick={() => handleReenviar(e.id)}
                                                            className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold hover:bg-amber-200 transition-colors"
                                                        >
                                                            Reactivar
                                                        </button>
                                                    )}
                                                    {extendiendoInd?.id !== e.id && (
                                                        <button
                                                            onClick={() => setExtendiendoInd({ id: e.id, fecha: '' })}
                                                            className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold hover:bg-blue-200 transition-colors"
                                                        >
                                                            Extender
                                                        </button>
                                                    )}
                                                    {e.estado === 'pendiente' && (
                                                        <span className="px-2.5 py-1 bg-gray-100 text-gray-400 rounded-lg text-[10px] font-medium text-center">
                                                            Sin entrega
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Extender plazo general panel */}
                        {extendiendoGeneral && (
                            <div className="px-4 py-3 border-t border-orange-200 bg-orange-50/80">
                                <p className="text-xs font-bold text-orange-700 mb-2">
                                    <svg className="w-3.5 h-3.5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Nueva fecha límite para <span className="font-black">todos los estudiantes</span>:
                                </p>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="date"
                                        value={fechaExtGeneral}
                                        onChange={ev => setFechaExtGeneral(ev.target.value)}
                                        min={new Date().toISOString().slice(0, 10)}
                                        className="flex-1 text-sm border border-orange-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-orange-400 bg-white"
                                    />
                                    <button
                                        onClick={handleExtenderGeneral}
                                        disabled={!fechaExtGeneral || processing}
                                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
                                    >
                                        {processing ? 'Guardando...' : 'Confirmar'}
                                    </button>
                                    <button
                                        onClick={() => { setExtendiendoGeneral(false); setFechaExtGeneral(''); }}
                                        className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-2 flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setExtendiendoGeneral(v => !v)}
                                className="px-4 py-2.5 border border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Extender plazo general
                            </button>
                            <div className="flex gap-2 sm:ml-auto">
                                <button type="button" onClick={() => setShowEntregas(null)} className="px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors">
                                    Cerrar
                                </button>
                                <button
                                    onClick={handleGuardarCalificaciones}
                                    disabled={processing || Object.values(calificaciones).every(c => c.nota === '')}
                                    className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 text-sm font-semibold disabled:opacity-50 transition-colors"
                                >
                                    {processing ? (
                                        <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                                    ) : (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.5 12.75l6 6 9-13.5" /></svg> Guardar Calificaciones</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
