import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

/* ─── Interfaces ─── */
interface Excepcion {
    id: number;
    tipo: 'profesor' | 'curso';
    referencia_id: number;
    nombre_referencia: string;
    motivo: string | null;
    activa: boolean;
}

interface Periodo {
    id: number;
    nombre: string;
    numero: number;
    fecha_inicio: string;
    fecha_fin: string;
    estado: 'activo' | 'finalizado' | 'pendiente';
    porcentaje: number;
    anio: number;
    notas_count: number;
    boletines_count: number;
    tiene_datos: boolean;
    notas_abiertas: boolean;
    ventana_inicio: string | null;
    ventana_fin: string | null;
    excepciones: Excepcion[];
}

interface ProfesorItem { id: number; name: string; email: string; }
interface CursoItem { id: number; nombre: string; nivel: string; grado: string; grupo: string; }

interface Props {
    periodos: Periodo[];
    anio: number;
    aniosDisponibles: number[];
    sumaPorcentajes: number;
    profesores: ProfesorItem[];
    cursos: CursoItem[];
}

/* ─── Helpers ─── */
const ESTADO_CONFIG: Record<string, { label: string; bg: string; text: string; border: string; dot: string; circleBg: string }> = {
    activo:     { label: 'Activo',     bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-400', dot: 'bg-emerald-400', circleBg: 'bg-emerald-500' },
    finalizado: { label: 'Finalizado', bg: 'bg-gray-50',     text: 'text-gray-600',    border: 'border-gray-300',    dot: 'bg-gray-400',    circleBg: 'bg-gray-400' },
    pendiente:  { label: 'Pendiente',  bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-300',   dot: 'bg-amber-400',   circleBg: 'bg-amber-400' },
};

const EMPTY_FORM = { nombre: '', numero: '', fecha_inicio: '', fecha_fin: '', porcentaje: '25', estado: 'pendiente' };

const formatDate = (d: string) => {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatDateTime = (dt: string) => {
    const date = new Date(dt);
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) + ' ' +
           date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const diffDays = (from: string, to: string) => Math.max(0, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / 86400000));

/* ═══════════════════════════════════════════════════════ */
export default function Periodos({ periodos, anio, aniosDisponibles, sumaPorcentajes, profesores, cursos }: Props) {
    /* ── State ── */
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEstadoModal, setShowEstadoModal] = useState(false);
    const [editingPeriodo, setEditingPeriodo] = useState<Periodo | null>(null);
    const [deletingPeriodo, setDeletingPeriodo] = useState<Periodo | null>(null);
    const [estadoPeriodo, setEstadoPeriodo] = useState<Periodo | null>(null);
    const [nuevoEstado, setNuevoEstado] = useState<'activo' | 'finalizado' | 'pendiente'>('activo');
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [processing, setProcessing] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // ── Estado ventana de calificación ──
    const [showVentanaModal, setShowVentanaModal] = useState(false);
    const [ventanaPeriodo, setVentanaPeriodo] = useState<Periodo | null>(null);
    const [vtab, setVtab] = useState<'config' | 'excepciones' | 'notificar'>('config');
    // Tab config
    const [ventanaForm, setVentanaForm] = useState({ ventana_inicio: '', ventana_fin: '' });
    const [confirmToggle, setConfirmToggle] = useState<false | 'abrir' | 'cerrar'>(false);
    const [toggleNotify, setToggleNotify] = useState(true);
    const [toggleMsg, setToggleMsg] = useState('');
    const [ventanaProc, setVentanaProc] = useState(false);
    // Tab excepciones
    const [exTipo, setExTipo] = useState<'profesor' | 'curso'>('profesor');
    const [exRefId, setExRefId] = useState('');
    const [exBusq, setExBusq] = useState('');
    const [exMotivo, setExMotivo] = useState('');
    const [exProc, setExProc] = useState(false);
    // Tab notificaciones
    const [ntitulo, setNtitulo] = useState('');
    const [nmensaje, setNmensaje] = useState('');
    const [nSolo, setNSolo] = useState(false);
    const [nProc, setNProc] = useState(false);
    const [nSuccess, setNSuccess] = useState('');

    // Sincronizar ventanaPeriodo con datos frescos de Inertia
    useEffect(() => {
        if (ventanaPeriodo) {
            const updated = periodos.find(p => p.id === ventanaPeriodo.id);
            if (updated) setVentanaPeriodo(updated);
        }
    }, [periodos]);

    /* ── Derived ── */
    const periodosCompletados = useMemo(() => periodos.filter(p => p.estado === 'finalizado').length, [periodos]);
    const periodoActivo = useMemo(() => periodos.find(p => p.estado === 'activo'), [periodos]);
    const diasRestantes = useMemo(() => {
        if (!periodoActivo) return 0;
        return Math.max(0, Math.ceil((new Date(periodoActivo.fecha_fin).getTime() - Date.now()) / 86400000));
    }, [periodoActivo]);
    const progresoAnio = useMemo(() => periodos.filter(p => p.estado === 'finalizado').reduce((s, p) => s + p.porcentaje, 0), [periodos]);
    const porcentajeDisponible = useMemo(() => Math.max(0, 100 - sumaPorcentajes), [sumaPorcentajes]);

    const ventanaEsProgramada = (p: Periodo) =>
        !p.notas_abiertas && !!p.ventana_inicio && new Date(p.ventana_inicio) > new Date();

    const exLista = useMemo(() => {
        const q = exBusq.toLowerCase();
        if (exTipo === 'profesor') {
            return profesores.filter(p =>
                p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
            );
        }
        return cursos.filter(c =>
            c.nombre.toLowerCase().includes(q) || c.nivel.toLowerCase().includes(q)
        );
    }, [exTipo, exBusq, profesores, cursos]);

    /* ── Input helper ── */
    const inputClass = (field: string) =>
        `w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] ${formErrors[field] ? 'border-red-300 bg-red-50/50' : 'border-gray-200'}`;

    /* ── Year navigation ── */
    const changeYear = (y: number) => {
        router.get('/admin/periodos', { anio: y }, { preserveState: true, preserveScroll: true });
    };

    /* ── CRUD Handlers ── */
    const openCreate = () => {
        setEditingPeriodo(null);
        const nextNum = periodos.length > 0 ? Math.max(...periodos.map(p => p.numero)) + 1 : 1;
        setForm({ ...EMPTY_FORM, numero: String(nextNum) });
        setFormErrors({});
        setShowModal(true);
    };

    const openEdit = (p: Periodo) => {
        setEditingPeriodo(p);
        setForm({
            nombre: p.nombre,
            numero: String(p.numero),
            fecha_inicio: p.fecha_inicio,
            fecha_fin: p.fecha_fin,
            porcentaje: String(p.porcentaje),
            estado: p.estado,
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};
        if (!form.nombre.trim()) errors.nombre = 'Requerido';
        if (!form.numero) errors.numero = 'Requerido';
        if (!form.fecha_inicio) errors.fecha_inicio = 'Requerido';
        if (!form.fecha_fin) errors.fecha_fin = 'Requerido';
        if (form.fecha_inicio && form.fecha_fin && form.fecha_fin <= form.fecha_inicio) errors.fecha_fin = 'Debe ser posterior al inicio';
        if (!form.porcentaje) errors.porcentaje = 'Requerido';
        const pct = parseFloat(form.porcentaje);
        if (pct <= 0 || pct > 100) errors.porcentaje = 'Debe ser entre 1 y 100';
        if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

        setProcessing(true);
        const payload: Record<string, any> = {
            nombre: form.nombre,
            numero: parseInt(form.numero),
            anio: anio,
            fecha_inicio: form.fecha_inicio,
            fecha_fin: form.fecha_fin,
            porcentaje: parseFloat(form.porcentaje),
            estado: form.estado,
        };

        if (editingPeriodo) {
            router.put(`/admin/periodos/${editingPeriodo.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => { setShowModal(false); setProcessing(false); },
                onError: (errs) => { setFormErrors(errs as Record<string, string>); setProcessing(false); },
            });
        } else {
            router.post('/admin/periodos', payload, {
                preserveScroll: true,
                onSuccess: () => { setShowModal(false); setProcessing(false); },
                onError: (errs) => { setFormErrors(errs as Record<string, string>); setProcessing(false); },
            });
        }
    };

    const openEstadoModal = (p: Periodo, estado: 'activo' | 'finalizado' | 'pendiente') => {
        setEstadoPeriodo(p);
        setNuevoEstado(estado);
        setShowEstadoModal(true);
    };

    const handleEstadoChange = () => {
        if (!estadoPeriodo) return;
        setProcessing(true);
        router.patch(`/admin/periodos/${estadoPeriodo.id}/estado`, { estado: nuevoEstado }, {
            preserveScroll: true,
            onSuccess: () => { setShowEstadoModal(false); setEstadoPeriodo(null); setProcessing(false); },
            onError: () => setProcessing(false),
        });
    };

    const openDelete = (p: Periodo) => {
        setDeletingPeriodo(p);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (!deletingPeriodo) return;
        setProcessing(true);
        router.delete(`/admin/periodos/${deletingPeriodo.id}`, {
            preserveScroll: true,
            onSuccess: () => { setShowDeleteModal(false); setDeletingPeriodo(null); setProcessing(false); },
            onError: () => setProcessing(false),
        });
    };

    /* ── Ventana handlers ── */
    const openVentanaModal = (p: Periodo) => {
        setVentanaPeriodo(p);
        setVtab('config');
        setVentanaForm({ ventana_inicio: p.ventana_inicio?.slice(0, 16) ?? '', ventana_fin: p.ventana_fin?.slice(0, 16) ?? '' });
        setConfirmToggle(false);
        setExTipo('profesor');
        setExRefId('');
        setExBusq('');
        setExMotivo('');
        setNtitulo('');
        setNmensaje('');
        setNSolo(false);
        setNSuccess('');
        setVentanaProc(false);
        setShowVentanaModal(true);
    };

    const handleVentanaConfig = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ventanaPeriodo) return;
        setVentanaProc(true);
        router.patch(`/admin/periodos/${ventanaPeriodo.id}/ventana`, ventanaForm, {
            preserveScroll: true,
            onSuccess: () => setVentanaProc(false),
            onError: () => setVentanaProc(false),
        });
    };

    const handleToggleVentana = (abrir: boolean) => {
        if (!ventanaPeriodo) return;
        setVentanaProc(true);
        const mensajeDefecto = abrir
            ? `La ventana de registro de notas para el ${ventanaPeriodo.nombre} ya está disponible. Por favor ingresa las calificaciones dentro del tiempo establecido.`
            : `El período de registro de notas para el ${ventanaPeriodo.nombre} ha finalizado.`;
        router.patch(`/admin/periodos/${ventanaPeriodo.id}/toggle-ventana`, {
            notas_abiertas: abrir,
            notificar: toggleNotify,
            mensaje: toggleMsg || mensajeDefecto,
        }, {
            preserveScroll: true,
            onSuccess: () => { setVentanaProc(false); setConfirmToggle(false); setToggleMsg(''); },
            onError: () => setVentanaProc(false),
        });
    };

    const handleAddExcepcion = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ventanaPeriodo || !exRefId) return;
        const lista: Array<ProfesorItem | CursoItem> = exTipo === 'profesor' ? profesores : cursos;
        const found = lista.find(x => String(x.id) === exRefId);
        if (!found) return;
        const nombre = 'name' in found ? found.name : found.nombre;
        setExProc(true);
        router.post(`/admin/periodos/${ventanaPeriodo.id}/excepciones`, {
            tipo: exTipo,
            referencia_id: parseInt(exRefId),
            nombre_referencia: nombre,
            motivo: exMotivo,
        }, {
            preserveScroll: true,
            onSuccess: () => { setExProc(false); setExRefId(''); setExBusq(''); setExMotivo(''); },
            onError: () => setExProc(false),
        });
    };

    const handleDeleteExcepcion = (exId: number) => {
        if (!ventanaPeriodo) return;
        router.delete(`/admin/periodos/${ventanaPeriodo.id}/excepciones/${exId}`, { preserveScroll: true });
    };

    const handleToggleExcepcion = (exId: number) => {
        if (!ventanaPeriodo) return;
        router.patch(`/admin/periodos/${ventanaPeriodo.id}/excepciones/${exId}/toggle`, {}, { preserveScroll: true });
    };

    const handleNotificar = (e: React.FormEvent) => {
        e.preventDefault();
        if (!ventanaPeriodo || !ntitulo || !nmensaje) return;
        setNProc(true);
        router.post(`/admin/periodos/${ventanaPeriodo.id}/notificar`, {
            titulo: ntitulo,
            mensaje: nmensaje,
            solo_con_asignacion: nSolo,
        }, {
            preserveScroll: true,
            onSuccess: () => { setNProc(false); setNSuccess('Notificación enviada exitosamente.'); setTimeout(() => setNSuccess(''), 5000); },
            onError: () => setNProc(false),
        });
    };

    /* ═══════════════════════════ RENDER ═══════════════════════════ */
    return (
        <SidebarLayout menuItems={adminMenuItems} title="Configuración de Periodos">
            <Head title="Periodos Académicos" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>
                            Configuración de Periodos
                        </h1>
                        <p className="text-gray-500 text-sm">Gestiona los periodos académicos y sus configuraciones</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="relative z-10">
                            <select
                                value={anio}
                                onChange={(e) => changeYear(parseInt(e.target.value))}
                                className="appearance-none pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] bg-white"
                            >
                                {aniosDisponibles.map(a => (
                                    <option key={a} value={a}>Año {a}</option>
                                ))}
                                {!aniosDisponibles.includes(anio) && <option value={anio}>Año {anio}</option>}
                            </select>
                            </div>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-[#293577]/25 transition-all text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                            Nuevo Periodo
                        </button>
                    </div>
                </div>

                {/* ── Stats Row ── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {[
                        { label: 'Periodos',     value: periodos.length,       color: 'from-blue-500 to-blue-600',    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg> },
                        { label: 'Completados',  value: periodosCompletados,   color: 'from-emerald-500 to-emerald-600', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> },
                        { label: 'Actual',        value: periodoActivo?.nombre ?? '—', color: 'from-[#293577] to-[#181b49]', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" /></svg> },
                        { label: 'Días restantes', value: `${diasRestantes}d`, color: 'from-amber-500 to-amber-600',   icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg> },
                        { label: 'Progreso año',  value: `${progresoAnio}%`,   color: 'from-purple-500 to-purple-600', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg> },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <span className={`bg-gradient-to-br ${stat.color} text-white p-2 rounded-lg flex items-center justify-center`}>{stat.icon}</span>
                                <div className={`w-8 h-1 rounded-full bg-gradient-to-r ${stat.color}`} />
                            </div>
                            <p className="text-xl font-extrabold text-gray-800 truncate" style={{ fontFamily: "'Inter', sans-serif" }}>{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* ── Porcentaje Warning ── */}
                {sumaPorcentajes !== 100 && periodos.length > 0 && (
                    <div className={`rounded-xl p-4 border flex items-center gap-3 ${sumaPorcentajes > 100 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                        <span className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${sumaPorcentajes > 100 ? 'bg-red-100' : 'bg-amber-100'}`}>
                            {sumaPorcentajes > 100
                                ? <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                                : <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                            }
                        </span>
                        <div>
                            <p className={`text-sm font-medium ${sumaPorcentajes > 100 ? 'text-red-700' : 'text-amber-700'}`}>
                                La suma de porcentajes es {sumaPorcentajes}% {sumaPorcentajes > 100 ? '(excede el 100%)' : `(faltan ${(100 - sumaPorcentajes).toFixed(1)}%)`}
                            </p>
                            <p className="text-xs text-gray-500">Los porcentajes de todos los periodos deben sumar exactamente 100%.</p>
                        </div>
                    </div>
                )}

                {/* ── Timeline de Periodos ── */}
                <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-bold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Año Académico {anio}</h2>
                        <span className="text-xs font-medium text-[#293577] bg-[#293577]/10 px-3 py-1 rounded-full">
                            {periodos.length} periodo{periodos.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {periodos.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-700 mb-1">Sin periodos configurados</h3>
                            <p className="text-sm text-gray-500 mb-4">Agrega periodos para este año académico</p>
                            <button onClick={openCreate} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-5 py-2.5 rounded-xl hover:shadow-lg text-sm font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                Crear primer periodo
                            </button>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Línea vertical */}
                            <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-gray-200" />

                            <div className="space-y-4">
                                {periodos.map((periodo) => {
                                    const cfg = ESTADO_CONFIG[periodo.estado] ?? ESTADO_CONFIG.pendiente;
                                    const duracion = diffDays(periodo.fecha_inicio, periodo.fecha_fin);
                                    const transcurrido = periodo.estado === 'activo'
                                        ? Math.min(100, Math.round((diffDays(periodo.fecha_inicio, new Date().toISOString().split('T')[0]) / duracion) * 100))
                                        : periodo.estado === 'finalizado' ? 100 : 0;

                                    return (
                                        <div key={periodo.id} className="relative flex items-start gap-4 sm:gap-5 group">
                                            {/* Círculo */}
                                            <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${cfg.circleBg} text-white shadow-sm`}>
                                                <span className="text-base sm:text-xl font-bold">{periodo.numero}</span>
                                            </div>

                                            {/* Tarjeta */}
                                            <div className={`flex-1 rounded-xl border-2 p-4 sm:p-5 transition-all ${periodo.estado === 'activo' ? 'border-emerald-400 bg-emerald-50/30 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-200'}`}>
                                                <div className="flex flex-col lg:flex-row justify-between gap-3">
                                                    {/* Info */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                            <h3 className="font-bold text-gray-800">{periodo.nombre}</h3>
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                                                {cfg.label}
                                                            </span>
                                                            {periodo.tiene_datos && (
                                                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-200">
                                                                    {periodo.notas_count} notas · {periodo.boletines_count} boletines
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                                            <span className="flex items-center gap-1.5">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                                                                {formatDate(periodo.fecha_inicio)} → {formatDate(periodo.fecha_fin)}
                                                            </span>
                                                            <span className="text-gray-400">·</span>
                                                            <span>{duracion} días</span>
                                                        </div>
                                                        {/* Barra de progreso para periodo activo */}
                                                        {periodo.estado === 'activo' && (
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${transcurrido}%` }} />
                                                                </div>
                                                                <span className="text-xs font-medium text-emerald-600">{transcurrido}%</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Porcentaje + Acciones */}
                                                    <div className="flex items-center gap-4 lg:flex-col lg:items-end lg:gap-3">
                                                        <div className="text-center lg:text-right">
                                                            <p className="text-2xl font-extrabold text-[#293577]" style={{ fontFamily: "'Inter', sans-serif" }}>{periodo.porcentaje}%</p>
                                                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">del año</p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            {/* Editar */}
                                                            <button
                                                                onClick={() => openEdit(periodo)}
                                                                className="p-2 text-gray-400 hover:text-[#293577] hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Editar periodo"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" /></svg>
                                                            </button>
                                                            {/* Activar (solo pendiente) */}
                                                            {periodo.estado === 'pendiente' && (
                                                                <button
                                                                    onClick={() => openEstadoModal(periodo, 'activo')}
                                                                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                    title="Activar periodo"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" /></svg>
                                                                </button>
                                                            )}
                                                            {/* Finalizar (solo activo) */}
                                                            {periodo.estado === 'activo' && (
                                                                <button
                                                                    onClick={() => openEstadoModal(periodo, 'finalizado')}
                                                                    className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                                                    title="Finalizar periodo"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                                                </button>
                                                            )}
                                                            {/* Reabrir (solo finalizado) */}
                                                            {periodo.estado === 'finalizado' && (
                                                                <button
                                                                    onClick={() => openEstadoModal(periodo, 'pendiente')}
                                                                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                                    title="Reabrir periodo"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" /></svg>
                                                                </button>
                                                            )}
                                                            {/* Eliminar */}
                                                            <button
                                                                onClick={() => openDelete(periodo)}
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title={periodo.tiene_datos ? 'No se puede eliminar (tiene datos)' : 'Eliminar periodo'}
                                                            >
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* ── Ventana de Calificación ── */}
                                                <div className="mt-3 pt-3 border-t border-gray-100">
                                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            {periodo.notas_abiertas ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                                                    Notas abiertas
                                                                </span>
                                                            ) : ventanaEsProgramada(periodo) ? (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                                                    Programada
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-500 border border-red-100">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                                                    Notas cerradas
                                                                </span>
                                                            )}
                                                            {periodo.excepciones.length > 0 && (
                                                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                                    {periodo.excepciones.length} excepción{periodo.excepciones.length !== 1 ? 'es' : ''}
                                                                </span>
                                                            )}
                                                            {periodo.ventana_inicio && !periodo.notas_abiertas && (
                                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                                                                    {formatDateTime(periodo.ventana_inicio)}{periodo.ventana_fin ? ` → ${formatDateTime(periodo.ventana_fin)}` : ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <button
                                                            onClick={() => openVentanaModal(periodo)}
                                                            className="inline-flex items-center gap-1 text-xs font-medium text-[#293577] hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors border border-[#293577]/20"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                                            Configurar ventana
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Resumen + Barra de progreso año ── */}
                <div className="grid md:grid-cols-2 gap-5">
                    {/* Distribución de porcentajes */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="font-bold text-gray-800 mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>Distribución del Año</h2>
                        <div className="space-y-3">
                            {periodos.map(p => {
                                const cfg = ESTADO_CONFIG[p.estado] ?? ESTADO_CONFIG.pendiente;
                                return (
                                    <div key={p.id} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-gray-700">{p.nombre}</span>
                                            <span className={`text-xs font-bold ${cfg.text}`}>{p.porcentaje}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2.5">
                                            <div
                                                className={`h-2.5 rounded-full transition-all ${p.estado === 'finalizado' ? 'bg-gray-400' : p.estado === 'activo' ? 'bg-emerald-500' : 'bg-amber-300'}`}
                                                style={{ width: `${p.porcentaje}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-800">Total</span>
                                <span className={`text-sm font-bold ${sumaPorcentajes === 100 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {sumaPorcentajes}% {sumaPorcentajes === 100 ? '✓' : ''}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Resumen del año */}
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="font-bold text-gray-800 mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>Resumen del Año</h2>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm text-gray-600">Periodos completados</span>
                                <span className="text-sm font-bold text-[#293577]">{periodosCompletados} de {periodos.length}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm text-gray-600">Periodo actual</span>
                                <span className="text-sm font-bold text-emerald-600">{periodoActivo?.nombre ?? 'Ninguno activo'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm text-gray-600">Días restantes</span>
                                <span className={`text-sm font-bold ${diasRestantes <= 7 ? 'text-red-500' : diasRestantes <= 14 ? 'text-amber-600' : 'text-[#293577]'}`}>
                                    {diasRestantes} días
                                </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm text-gray-600">Progreso completado</span>
                                <span className="text-sm font-bold text-purple-600">{progresoAnio}%</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div className="bg-gradient-to-r from-[#293577] to-[#181b49] h-3 rounded-full transition-all" style={{ width: `${progresoAnio}%` }} />
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1.5 text-right">{progresoAnio}% del año lectivo completado</p>
                        </div>
                    </div>
                </div>

                {/* ── Panel de Control de Ventanas de Calificación ── */}
                {periodos.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h2 className="font-bold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Panel de Ventanas de Calificación</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Controla el acceso de profesores al registro de notas por periodo</p>
                            </div>
                            <span className={`text-xs font-medium px-3 py-1 rounded-full ${periodos.some(p => p.notas_abiertas) ? 'text-emerald-700 bg-emerald-50 border border-emerald-200' : 'text-gray-500 bg-gray-100'}`}>
                                {periodos.filter(p => p.notas_abiertas).length} abierta{periodos.filter(p => p.notas_abiertas).length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {periodos.map(p => {
                                const esProg = ventanaEsProgramada(p);
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => openVentanaModal(p)}
                                        className={`rounded-xl p-4 border-2 text-left transition-all hover:shadow-md ${
                                            p.notas_abiertas
                                                ? 'border-emerald-400 bg-emerald-50'
                                                : esProg
                                                    ? 'border-blue-300 bg-blue-50'
                                                    : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="text-sm font-bold text-gray-800 leading-tight">{p.nombre}</span>
                                            {p.notas_abiertas ? (
                                                <span className="bg-emerald-500 text-white p-1 rounded-lg flex-shrink-0 ml-2">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                                </span>
                                            ) : esProg ? (
                                                <span className="bg-blue-400 text-white p-1 rounded-lg flex-shrink-0 ml-2">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                                </span>
                                            ) : (
                                                <span className="bg-gray-300 text-white p-1 rounded-lg flex-shrink-0 ml-2">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs font-semibold ${p.notas_abiertas ? 'text-emerald-600' : esProg ? 'text-blue-500' : 'text-gray-400'}`}>
                                            {p.notas_abiertas ? 'Notas abiertas' : esProg ? 'Programada' : 'Cerrada'}
                                        </p>
                                        {p.excepciones.filter(e => e.activa).length > 0 && (
                                            <p className="text-[10px] text-amber-500 mt-1">
                                                {p.excepciones.filter(e => e.activa).length} excepción{p.excepciones.filter(e => e.activa).length !== 1 ? 'es' : ''} activa{p.excepciones.filter(e => e.activa).length !== 1 ? 's' : ''}
                                            </p>
                                        )}
                                        <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-0.5">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.43l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                                            Configurar
                                        </p>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════ MODAL CREAR/EDITAR ═══════ */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#181b49] to-[#293577] rounded-t-2xl px-6 py-4">
                            <h2 className="text-lg font-bold text-white">{editingPeriodo ? 'Editar Periodo' : 'Nuevo Periodo'}</h2>
                            <p className="text-blue-200 text-xs">
                                {editingPeriodo ? 'Modifica los datos del periodo' : `Registrar un nuevo periodo para el año ${anio}`}
                                {!editingPeriodo && porcentajeDisponible > 0 && ` · ${porcentajeDisponible}% disponible`}
                            </p>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                    <input type="text" placeholder="Ej: Primer Periodo" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className={inputClass('nombre')} />
                                    {formErrors.nombre && <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">N° *</label>
                                    <input type="number" min="1" max="6" value={form.numero} onChange={e => setForm({ ...form, numero: e.target.value })} className={inputClass('numero')} disabled={!!editingPeriodo} />
                                    {formErrors.numero && <p className="text-xs text-red-500 mt-1">{formErrors.numero}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio *</label>
                                    <input type="date" value={form.fecha_inicio} onChange={e => setForm({ ...form, fecha_inicio: e.target.value })} className={inputClass('fecha_inicio')} />
                                    {formErrors.fecha_inicio && <p className="text-xs text-red-500 mt-1">{formErrors.fecha_inicio}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin *</label>
                                    <input type="date" value={form.fecha_fin} onChange={e => setForm({ ...form, fecha_fin: e.target.value })} className={inputClass('fecha_fin')} />
                                    {formErrors.fecha_fin && <p className="text-xs text-red-500 mt-1">{formErrors.fecha_fin}</p>}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje (%) *</label>
                                    <input type="number" min="1" max="100" step="0.5" value={form.porcentaje} onChange={e => setForm({ ...form, porcentaje: e.target.value })} className={inputClass('porcentaje')} />
                                    {formErrors.porcentaje && <p className="text-xs text-red-500 mt-1">{formErrors.porcentaje}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <select value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })} className={inputClass('estado')}>
                                        <option value="pendiente">Pendiente</option>
                                        <option value="activo">Activo</option>
                                        <option value="finalizado">Finalizado</option>
                                    </select>
                                </div>
                            </div>
                            {form.fecha_inicio && form.fecha_fin && form.fecha_fin > form.fecha_inicio && (
                                <div className="bg-gray-50 rounded-xl px-4 py-2.5 text-xs text-gray-500 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-[#293577]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                                    Duración: {diffDays(form.fecha_inicio, form.fecha_fin)} días
                                </div>
                            )}
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processing} className="flex-1 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-[#293577]/25 text-sm font-medium disabled:opacity-50">
                                    {processing ? 'Guardando...' : editingPeriodo ? 'Guardar cambios' : 'Crear Periodo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════ MODAL CAMBIO DE ESTADO ═══════ */}
            {showEstadoModal && estadoPeriodo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEstadoModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${nuevoEstado === 'activo' ? 'bg-emerald-100' : nuevoEstado === 'finalizado' ? 'bg-amber-100' : 'bg-purple-100'}`}>
                                {nuevoEstado === 'activo' && <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9" /></svg>}
                                {nuevoEstado === 'finalizado' && <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>}
                                {nuevoEstado === 'pendiente' && <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" /></svg>}
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">
                                {nuevoEstado === 'activo' ? 'Activar periodo' : nuevoEstado === 'finalizado' ? 'Finalizar periodo' : 'Reabrir periodo'}
                            </h3>
                            <p className="text-sm text-gray-500 mb-1">
                                {nuevoEstado === 'activo' && <>¿Activar <strong>{estadoPeriodo.nombre}</strong>? Si hay otro periodo activo, se cambiará a pendiente.</>}
                                {nuevoEstado === 'finalizado' && <>¿Finalizar <strong>{estadoPeriodo.nombre}</strong>? El siguiente periodo pendiente se activará automáticamente.</>}
                                {nuevoEstado === 'pendiente' && <>¿Reabrir <strong>{estadoPeriodo.nombre}</strong> como pendiente?</>}
                            </p>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowEstadoModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleEstadoChange}
                                    disabled={processing}
                                    className={`flex-1 text-white px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 ${nuevoEstado === 'activo' ? 'bg-emerald-500 hover:bg-emerald-600' : nuevoEstado === 'finalizado' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-purple-500 hover:bg-purple-600'}`}
                                >
                                    {processing ? 'Procesando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ MODAL ELIMINAR ═══════ */}
            {showDeleteModal && deletingPeriodo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowDeleteModal(false); setDeletingPeriodo(null); }}>
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                            </div>
                            {deletingPeriodo.tiene_datos ? (
                                <>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">No se puede eliminar</h3>
                                    <p className="text-sm text-gray-500 mb-1">
                                        <strong>{deletingPeriodo.nombre}</strong> tiene {deletingPeriodo.notas_count} notas y {deletingPeriodo.boletines_count} boletines registrados.
                                    </p>
                                    <p className="text-xs text-red-500 mb-6">Primero debes eliminar los datos académicos asociados.</p>
                                    <button onClick={() => { setShowDeleteModal(false); setDeletingPeriodo(null); }} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                        Entendido
                                    </button>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar periodo?</h3>
                                    <p className="text-sm text-gray-500 mb-1">
                                        Estás a punto de eliminar <strong>{deletingPeriodo.nombre}</strong>.
                                    </p>
                                    <p className="text-xs text-red-500 mb-6">Esta acción no se puede deshacer.</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => { setShowDeleteModal(false); setDeletingPeriodo(null); }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                            Cancelar
                                        </button>
                                        <button onClick={handleDelete} disabled={processing} className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl hover:bg-red-600 text-sm font-medium disabled:opacity-50">
                                            {processing ? 'Eliminando...' : 'Sí, eliminar'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ MODAL VENTANA DE CALIFICACIÓN ═══════ */}
            {showVentanaModal && ventanaPeriodo && (
                <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowVentanaModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl my-8" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#181b49] to-[#293577] rounded-t-2xl px-6 py-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Ventana de Calificación</h2>
                                    <p className="text-blue-200 text-sm mt-0.5">{ventanaPeriodo.nombre} · {ventanaPeriodo.anio}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {ventanaPeriodo.notas_abiertas ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-400/30 text-emerald-200 border border-emerald-400/40">
                                            <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                                            Notas abiertas
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/70 border border-white/20">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                            Cerrada
                                        </span>
                                    )}
                                    <button onClick={() => setShowVentanaModal(false)} className="text-white/60 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            </div>
                            {/* Tabs */}
                            <div className="flex gap-1 mt-4">
                                {([
                                    { key: 'config' as const, label: 'Configuración' },
                                    { key: 'excepciones' as const, label: `Excepciones${ventanaPeriodo.excepciones.length > 0 ? ` (${ventanaPeriodo.excepciones.length})` : ''}` },
                                    { key: 'notificar' as const, label: 'Notificaciones' },
                                ]).map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setVtab(tab.key)}
                                        className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${vtab === tab.key ? 'bg-white text-[#293577]' : 'text-white/70 hover:bg-white/10'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6">

                            {/* ── TAB: Configuración ── */}
                            {vtab === 'config' && (
                                <div className="space-y-6">
                                    {/* Control manual */}
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-800 mb-3">Control manual de acceso</h3>
                                        {!confirmToggle ? (
                                            <div className="flex gap-3">
                                                {!ventanaPeriodo.notas_abiertas ? (
                                                    <button
                                                        onClick={() => { setConfirmToggle('abrir'); setToggleNotify(true); setToggleMsg(''); }}
                                                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                                        Abrir notas ahora
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => { setConfirmToggle('cerrar'); setToggleNotify(true); setToggleMsg(''); }}
                                                        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                                                        Cerrar notas
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className={`rounded-xl p-4 border ${confirmToggle === 'abrir' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                                                <p className="text-sm font-semibold text-gray-800 mb-3">
                                                    {confirmToggle === 'abrir'
                                                        ? `¿Abrir ventana de notas para ${ventanaPeriodo.nombre}?`
                                                        : `¿Cerrar ventana de notas para ${ventanaPeriodo.nombre}?`}
                                                </p>
                                                <label className="flex items-center gap-2 cursor-pointer mb-3">
                                                    <input type="checkbox" checked={toggleNotify} onChange={e => setToggleNotify(e.target.checked)} className="w-4 h-4 rounded accent-[#293577]" />
                                                    <span className="text-sm text-gray-700">Notificar a profesores</span>
                                                </label>
                                                {toggleNotify && (
                                                    <textarea
                                                        value={toggleMsg}
                                                        onChange={e => setToggleMsg(e.target.value)}
                                                        placeholder={confirmToggle === 'abrir'
                                                            ? `La ventana de registro de notas para ${ventanaPeriodo.nombre} ya está disponible...`
                                                            : `El período de registro de notas para ${ventanaPeriodo.nombre} ha finalizado...`}
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] mb-3"
                                                    />
                                                )}
                                                <div className="flex gap-2">
                                                    <button onClick={() => setConfirmToggle(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                                                    <button
                                                        onClick={() => handleToggleVentana(confirmToggle === 'abrir')}
                                                        disabled={ventanaProc}
                                                        className={`flex-1 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50 ${confirmToggle === 'abrir' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}
                                                    >
                                                        {ventanaProc ? 'Procesando...' : confirmToggle === 'abrir' ? 'Confirmar apertura' : 'Confirmar cierre'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Ventana automática */}
                                    <div className="border-t pt-5">
                                        <h3 className="text-sm font-bold text-gray-800 mb-1">Programar ventana automática</h3>
                                        <p className="text-xs text-gray-500 mb-4">Define fechas de referencia para recordar cuándo abrir/cerrar las notas. Cuando la ventana esté programada se mostrará a los profesores.</p>
                                        <form onSubmit={handleVentanaConfig} className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Apertura programada</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={ventanaForm.ventana_inicio}
                                                        onChange={e => setVentanaForm({ ...ventanaForm, ventana_inicio: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-gray-700 mb-1">Cierre programado</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={ventanaForm.ventana_fin}
                                                        onChange={e => setVentanaForm({ ...ventanaForm, ventana_fin: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                {(ventanaForm.ventana_inicio || ventanaForm.ventana_fin) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setVentanaForm({ ventana_inicio: '', ventana_fin: '' })}
                                                        className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50"
                                                    >
                                                        Limpiar fechas
                                                    </button>
                                                )}
                                                <button
                                                    type="submit"
                                                    disabled={ventanaProc}
                                                    className="flex-1 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-50"
                                                >
                                                    {ventanaProc ? 'Guardando...' : 'Guardar programación'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB: Excepciones ── */}
                            {vtab === 'excepciones' && (
                                <div className="space-y-5">
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                                        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                                        <div>
                                            <p className="text-sm font-semibold text-amber-800">¿Qué son las excepciones?</p>
                                            <p className="text-xs text-amber-700 mt-0.5">Permiten a un profesor o curso específico registrar notas aunque la ventana global esté cerrada. Ideal para incapacidades, permisos o entregas tardías justificadas.</p>
                                        </div>
                                    </div>

                                    {/* Tabla de excepciones */}
                                    {ventanaPeriodo.excepciones.length > 0 ? (
                                        <div className="overflow-hidden rounded-xl border border-gray-100">
                                            <table className="w-full text-sm">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Nombre</th>
                                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Tipo</th>
                                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 hidden sm:table-cell">Motivo</th>
                                                        <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-600">Estado</th>
                                                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-600"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {ventanaPeriodo.excepciones.map(ex => (
                                                        <tr key={ex.id} className="hover:bg-gray-50/80">
                                                            <td className="px-4 py-3 font-medium text-gray-800 text-sm">{ex.nombre_referencia}</td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ex.tipo === 'profesor' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                                                                    {ex.tipo === 'profesor' ? 'Profesor' : 'Curso'}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">{ex.motivo ?? '—'}</td>
                                                            <td className="px-4 py-3">
                                                                <button
                                                                    onClick={() => handleToggleExcepcion(ex.id)}
                                                                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${ex.activa ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                                                >
                                                                    {ex.activa ? 'Activa' : 'Inactiva'}
                                                                </button>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <button onClick={() => handleDeleteExcepcion(ex.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-400">
                                            <svg className="w-10 h-10 mx-auto mb-2 text-gray-200" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                            <p className="text-sm">Sin excepciones configuradas para este periodo</p>
                                        </div>
                                    )}

                                    {/* Formulario agregar excepción */}
                                    <form onSubmit={handleAddExcepcion} className="border-t pt-5 space-y-3">
                                        <h3 className="text-sm font-bold text-gray-800">Agregar excepción</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                                                <select
                                                    value={exTipo}
                                                    onChange={e => { setExTipo(e.target.value as 'profesor' | 'curso'); setExRefId(''); setExBusq(''); }}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30"
                                                >
                                                    <option value="profesor">Profesor</option>
                                                    <option value="curso">Curso</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Buscar {exTipo}</label>
                                                <input
                                                    type="text"
                                                    placeholder={exTipo === 'profesor' ? 'Nombre o correo...' : 'Nombre del curso...'}
                                                    value={exBusq}
                                                    onChange={e => { setExBusq(e.target.value); setExRefId(''); }}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30"
                                                />
                                            </div>
                                        </div>
                                        {exBusq.trim().length >= 1 && (
                                            <select
                                                size={Math.min(exLista.length + 1, 5)}
                                                value={exRefId}
                                                onChange={e => setExRefId(e.target.value)}
                                                className="w-full border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30"
                                            >
                                                {exLista.map(item => (
                                                    <option key={item.id} value={String(item.id)}>
                                                        {'name' in item ? `${item.name} — ${item.email}` : `${item.nombre} · ${item.nivel} ${item.grado}${item.grupo ? `-${item.grupo}` : ''}`}
                                                    </option>
                                                ))}
                                                {exLista.length === 0 && <option disabled>Sin resultados</option>}
                                            </select>
                                        )}
                                        {exRefId && (
                                            <div className="bg-[#293577]/5 border border-[#293577]/20 rounded-xl px-3 py-2 text-xs text-[#293577] font-medium">
                                                Seleccionado: {(() => {
                                                    const lista: Array<ProfesorItem | CursoItem> = exTipo === 'profesor' ? profesores : cursos;
                                                    const f = lista.find(x => String(x.id) === exRefId);
                                                    return f ? ('name' in f ? f.name : f.nombre) : exRefId;
                                                })()}
                                            </div>
                                        )}
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Motivo (opcional)</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Incapacidad médica, permiso especial, entrega tardía justificada..."
                                                value={exMotivo}
                                                onChange={e => setExMotivo(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!exRefId || exProc}
                                            className="w-full bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-40 transition-all"
                                        >
                                            {exProc ? 'Agregando...' : 'Agregar excepción'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {/* ── TAB: Notificaciones ── */}
                            {vtab === 'notificar' && (
                                <div className="space-y-5">
                                    {nSuccess && (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                                            <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                                            <span className="text-sm font-medium text-emerald-700">{nSuccess}</span>
                                        </div>
                                    )}

                                    {/* Plantillas rápidas */}
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Plantillas rápidas</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            {[
                                                {
                                                    label: '📝 Apertura de notas',
                                                    titulo: `Apertura de notas: ${ventanaPeriodo.nombre}`,
                                                    mensaje: `Estimado(a) profesor(a), te informamos que la ventana de registro de notas para el ${ventanaPeriodo.nombre} (${ventanaPeriodo.anio}) ya se encuentra disponible. Por favor ingresa las calificaciones dentro del tiempo establecido.`,
                                                },
                                                {
                                                    label: '⏰ Recordatorio',
                                                    titulo: `Recordatorio: Notas del ${ventanaPeriodo.nombre}`,
                                                    mensaje: `Recordatorio: La ventana de registro de notas del ${ventanaPeriodo.nombre} está próxima a cerrarse. Por favor asegúrate de haber ingresado todas las calificaciones a tiempo.`,
                                                },
                                                {
                                                    label: '🔒 Cierre de ventana',
                                                    titulo: `Cierre de ventana: ${ventanaPeriodo.nombre}`,
                                                    mensaje: `Se informa que la ventana de registro de notas para el ${ventanaPeriodo.nombre} ha sido cerrada. Si tienes alguna novedad pendiente, comunícate con la coordinación académica.`,
                                                },
                                            ].map((t, i) => (
                                                <button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => { setNtitulo(t.titulo); setNmensaje(t.mensaje); }}
                                                    className="text-left p-3 border border-gray-100 rounded-xl hover:border-[#293577]/30 hover:bg-blue-50/30 transition-all text-xs font-medium text-gray-700"
                                                >
                                                    {t.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Formulario */}
                                    <form onSubmit={handleNotificar} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Título *</label>
                                            <input
                                                type="text"
                                                value={ntitulo}
                                                onChange={e => setNtitulo(e.target.value)}
                                                placeholder="Ej: Apertura de notas - Primer Periodo"
                                                maxLength={150}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Mensaje *</label>
                                            <textarea
                                                value={nmensaje}
                                                onChange={e => setNmensaje(e.target.value)}
                                                placeholder="Escribe el mensaje completo que recibirán los profesores..."
                                                rows={4}
                                                maxLength={1000}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]"
                                            />
                                            <p className="text-xs text-gray-400 text-right mt-0.5">{nmensaje.length}/1000</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-gray-700 mb-2">Destinatarios</p>
                                            <div className="space-y-2">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" checked={!nSolo} onChange={() => setNSolo(false)} className="accent-[#293577]" />
                                                    <span className="text-sm text-gray-700">Todos los profesores ({profesores.length})</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="radio" checked={nSolo} onChange={() => setNSolo(true)} className="accent-[#293577]" />
                                                    <span className="text-sm text-gray-700">Solo profesores con asignación en {ventanaPeriodo.anio}</span>
                                                </label>
                                            </div>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!ntitulo || !nmensaje || nProc}
                                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-4 py-3 rounded-xl text-sm font-medium hover:shadow-lg disabled:opacity-40 transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
                                            {nProc ? 'Enviando...' : 'Enviar notificación'}
                                        </button>
                                    </form>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
