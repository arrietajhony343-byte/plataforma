import { profesorMenuItems } from '@/Config/profesorMenu';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

interface Resumen {
    totalCursos: number;
    totalClasesSemanales: number;
    actividadesPendientes: number;
    ventanasAbiertas: number;
    eventosPersonales?: number;
}

interface ClaseSemanal {
    id: number;
    materia: string | null;
    curso: string | null;
    dia: string;
    horaInicio: string;
    horaFin: string;
    salon: string | null;
}

interface ActividadCalendario {
    id: number;
    titulo: string;
    descripcion: string | null;
    curso: string | null;
    materia: string | null;
    fecha: string;
    hora: string | null;
    tipo: string;
}

interface HitoInstitucional {
    id: string;
    titulo: string;
    descripcion: string;
    fecha: string;
    hora: string | null;
    tipo:
        | 'periodo_inicio'
        | 'periodo_fin'
        | 'apertura_notas'
        | 'cierre_notas'
        | 'evento'
        | 'reunion_padres'
        | 'institucional'
        | 'academico'
        | 'otro';
    periodo: string;
}

interface EventoPersonal {
    id: number;
    titulo: string;
    descripcion: string | null;
    fecha: string;
    hora: string | null;
    color: string | null;
}

interface EventoCalendario {
    id: string;
    sourceId?: number;
    fecha: string;
    inicio: string | null;
    fin: string | null;
    titulo: string;
    descripcion: string | null;
    categoria: 'clase' | 'actividad' | 'institucional' | 'personal';
    tipo: string;
    color?: string | null;
    curso: string | null;
    materia: string | null;
    salon: string | null;
    periodo: string | null;
}

interface Props {
    profesor: { nombre: string };
    resumen: Resumen;
    clasesSemanales: ClaseSemanal[];
    actividades: ActividadCalendario[];
    hitosInstitucionales: HitoInstitucional[];
    eventosPersonales: EventoPersonal[];
}

const DAY_ORDER: Record<string, number> = {
    domingo: 0,
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
};

const DAY_NAMES = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

const ACTIVITY_META: Record<string, { label: string; icon: string }> = {
    tarea: { label: 'Tarea', icon: 'TA' },
    quiz: { label: 'Quiz', icon: 'QZ' },
    examen: { label: 'Examen', icon: 'EX' },
    proyecto: { label: 'Proyecto', icon: 'PR' },
    exposicion: { label: 'Exposicion', icon: 'EP' },
    taller: { label: 'Taller', icon: 'TL' },
};

const HITO_META: Record<HitoInstitucional['tipo'], { label: string; icon: string }> = {
    periodo_inicio: { label: 'Inicio de periodo', icon: 'PI' },
    periodo_fin: { label: 'Cierre de periodo', icon: 'PF' },
    apertura_notas: { label: 'Apertura de notas', icon: 'AN' },
    cierre_notas: { label: 'Cierre de notas', icon: 'CN' },
    evento: { label: 'Evento especial', icon: 'EV' },
    reunion_padres: { label: 'Reunion de padres', icon: 'RP' },
    institucional: { label: 'Actividad institucional', icon: 'IN' },
    academico: { label: 'Actividad academica', icon: 'AC' },
    otro: { label: 'Otro evento', icon: 'OE' },
};

function pad(value: number) {
    return String(value).padStart(2, '0');
}

function toIsoDate(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseIsoDate(iso: string) {
    const [year, month, day] = iso.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function parseIsoDateTime(iso: string) {
    const [datePart, timePart = '00:00'] = iso.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
}

function formatMonthLabel(date: Date) {
    return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(date);
}

function formatDateLabel(iso: string) {
    return new Intl.DateTimeFormat('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(parseIsoDate(iso));
}

function formatShortDate(iso: string) {
    return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(parseIsoDate(iso));
}

function formatDateTimeLabel(iso: string | null) {
    if (!iso) return 'Sin fecha programada';

    return new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
    }).format(parseIsoDateTime(iso));
}


function sortEvents(events: EventoCalendario[]) {
    const weights: Record<EventoCalendario['categoria'], number> = {
        institucional: 0,
        personal: 1,
        clase: 2,
        actividad: 3,
    };

    return [...events].sort((a, b) => {
        const dateA = `${a.fecha}T${a.inicio ?? '23:59'}`;
        const dateB = `${b.fecha}T${b.inicio ?? '23:59'}`;

        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return weights[a.categoria] - weights[b.categoria];
    });
}

function getEventTone(event: EventoCalendario) {
    if (event.categoria === 'personal') {
        return {
            dot: 'bg-teal-600',
            chip: 'bg-teal-100 text-teal-700',
            soft: 'border-teal-100 bg-teal-50',
            badge: 'bg-teal-600 text-white',
        };
    }

    if (event.categoria === 'clase') {
        return {
            dot: 'bg-[#293577]',
            chip: 'bg-[#293577]/10 text-[#293577]',
            soft: 'border-[#293577]/10 bg-[#293577]/5',
            badge: 'bg-[#293577] text-white',
        };
    }

    if (event.categoria === 'actividad') {
        if (event.tipo === 'quiz' || event.tipo === 'examen') {
            return {
                dot: 'bg-red-500',
                chip: 'bg-red-100 text-red-700',
                soft: 'border-red-100 bg-red-50',
                badge: 'bg-red-500 text-white',
            };
        }

        return {
            dot: 'bg-amber-500',
            chip: 'bg-amber-100 text-amber-700',
            soft: 'border-amber-100 bg-amber-50',
            badge: 'bg-amber-500 text-white',
        };
    }

    if (event.tipo === 'apertura_notas') {
        return {
            dot: 'bg-emerald-500',
            chip: 'bg-emerald-100 text-emerald-700',
            soft: 'border-emerald-100 bg-emerald-50',
            badge: 'bg-emerald-500 text-white',
        };
    }

    if (event.tipo === 'cierre_notas') {
        return {
            dot: 'bg-rose-500',
            chip: 'bg-rose-100 text-rose-700',
            soft: 'border-rose-100 bg-rose-50',
            badge: 'bg-rose-500 text-white',
        };
    }

    if (event.tipo === 'reunion_padres') {
        return {
            dot: 'bg-cyan-600',
            chip: 'bg-cyan-100 text-cyan-700',
            soft: 'border-cyan-100 bg-cyan-50',
            badge: 'bg-cyan-600 text-white',
        };
    }

    if (event.tipo === 'academico') {
        return {
            dot: 'bg-indigo-600',
            chip: 'bg-indigo-100 text-indigo-700',
            soft: 'border-indigo-100 bg-indigo-50',
            badge: 'bg-indigo-600 text-white',
        };
    }

    return {
        dot: 'bg-slate-500',
        chip: 'bg-slate-100 text-slate-700',
        soft: 'border-slate-100 bg-slate-50',
        badge: 'bg-slate-600 text-white',
    };
}

function getEventLabel(event: EventoCalendario) {
    if (event.categoria === 'personal') return 'Evento personal';
    if (event.categoria === 'clase') return 'Clase';
    if (event.categoria === 'actividad') return ACTIVITY_META[event.tipo]?.label ?? 'Actividad';
    return HITO_META[event.tipo as HitoInstitucional['tipo']]?.label ?? 'Hito institucional';
}

function getEventIcon(event: EventoCalendario) {
    if (event.categoria === 'personal') return 'EP';
    if (event.categoria === 'clase') return 'CL';
    if (event.categoria === 'actividad') return ACTIVITY_META[event.tipo]?.icon ?? 'AC';
    return HITO_META[event.tipo as HitoInstitucional['tipo']]?.icon ?? 'HI';
}

export default function Calendario({ profesor, resumen, clasesSemanales, actividades, hitosInstitucionales, eventosPersonales }: Props) {
    const today = new Date();
    const todayIso = toIsoDate(today);
    const nowTime = `${pad(today.getHours())}:${pad(today.getMinutes())}`;

    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState(todayIso);
    const [creatingEvent, setCreatingEvent] = useState(false);
    const [newEvent, setNewEvent] = useState({
        titulo: '',
        descripcion: '',
        fecha: todayIso,
        hora: '',
        color: '#0f766e',
    });

    const monthStart = useMemo(
        () => new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        [currentMonth],
    );

    const monthEnd = useMemo(
        () => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0),
        [currentMonth],
    );

    const monthStartIso = toIsoDate(monthStart);
    const monthEndIso = toIsoDate(monthEnd);

    const monthEvents = useMemo(() => {
        const activityEvents = actividades
            .filter((actividad) => actividad.fecha >= monthStartIso && actividad.fecha <= monthEndIso)
            .map<EventoCalendario>((actividad) => ({
                id: `actividad-${actividad.id}`,
                fecha: actividad.fecha,
                inicio: actividad.hora,
                fin: null,
                titulo: actividad.titulo,
                descripcion: actividad.descripcion,
                categoria: 'actividad',
                tipo: actividad.tipo,
                curso: actividad.curso,
                materia: actividad.materia,
                salon: null,
                periodo: null,
            }));

        const institutionalEvents = hitosInstitucionales
            .filter((hito) => hito.fecha >= monthStartIso && hito.fecha <= monthEndIso)
            .map<EventoCalendario>((hito) => ({
                id: hito.id,
                fecha: hito.fecha,
                inicio: hito.hora,
                fin: null,
                titulo: hito.titulo,
                descripcion: hito.descripcion,
                categoria: 'institucional',
                tipo: hito.tipo,
                curso: null,
                materia: null,
                salon: null,
                periodo: hito.periodo,
            }));

        const personalEvents = eventosPersonales
            .filter((evento) => evento.fecha >= monthStartIso && evento.fecha <= monthEndIso)
            .map<EventoCalendario>((evento) => ({
                id: `personal-${evento.id}`,
                sourceId: evento.id,
                fecha: evento.fecha,
                inicio: evento.hora,
                fin: null,
                titulo: evento.titulo,
                descripcion: evento.descripcion,
                categoria: 'personal',
                tipo: 'personal',
                color: evento.color,
                curso: null,
                materia: null,
                salon: null,
                periodo: null,
            }));

        return sortEvents([...activityEvents, ...institutionalEvents, ...personalEvents]);
    }, [actividades, eventosPersonales, hitosInstitucionales, monthEndIso, monthStartIso]);

    const eventsByDate = useMemo(() => {
        return monthEvents.reduce<Record<string, EventoCalendario[]>>((acc, event) => {
            if (!acc[event.fecha]) acc[event.fecha] = [];
            acc[event.fecha].push(event);
            return acc;
        }, {});
    }, [monthEvents]);

    const selectedDayEvents = useMemo(() => {
        const weekday = parseIsoDate(selectedDate).getDay();
        const classEvents: EventoCalendario[] = clasesSemanales
            .filter(clase => (DAY_ORDER[clase.dia.toLowerCase()] ?? -1) === weekday)
            .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
            .map<EventoCalendario>(clase => ({
                id: `clase-${clase.id}-${selectedDate}`,
                fecha: selectedDate,
                inicio: clase.horaInicio,
                fin: clase.horaFin,
                titulo: clase.materia ?? 'Clase programada',
                descripcion: clase.salon ? `Salón ${clase.salon}` : null,
                categoria: 'clase',
                tipo: 'clase',
                curso: clase.curso,
                materia: clase.materia,
                salon: clase.salon,
                periodo: null,
            }));

        return sortEvents([...classEvents, ...(eventsByDate[selectedDate] ?? [])]);
    }, [eventsByDate, selectedDate, clasesSemanales]);

    const nextAgenda = useMemo(() => {
        const activityEvents = actividades
            .filter((actividad) => actividad.fecha >= todayIso)
            .map<EventoCalendario>((actividad) => ({
                id: `actividad-proxima-${actividad.id}`,
                fecha: actividad.fecha,
                inicio: actividad.hora,
                fin: null,
                titulo: actividad.titulo,
                descripcion: actividad.descripcion,
                categoria: 'actividad',
                tipo: actividad.tipo,
                curso: actividad.curso,
                materia: actividad.materia,
                salon: null,
                periodo: null,
            }));

        const institutionalEvents = hitosInstitucionales
            .filter((hito) => hito.fecha >= todayIso)
            .map<EventoCalendario>((hito) => ({
                id: `hito-proximo-${hito.id}`,
                fecha: hito.fecha,
                inicio: hito.hora,
                fin: null,
                titulo: hito.titulo,
                descripcion: hito.descripcion,
                categoria: 'institucional',
                tipo: hito.tipo,
                curso: null,
                materia: null,
                salon: null,
                periodo: hito.periodo,
            }));

        const personalEvents = eventosPersonales
            .filter((evento) => evento.fecha >= todayIso)
            .map<EventoCalendario>((evento) => ({
                id: `personal-proximo-${evento.id}`,
                sourceId: evento.id,
                fecha: evento.fecha,
                inicio: evento.hora,
                fin: null,
                titulo: evento.titulo,
                descripcion: evento.descripcion,
                categoria: 'personal',
                tipo: 'personal',
                color: evento.color,
                curso: null,
                materia: null,
                salon: null,
                periodo: null,
            }));

        return sortEvents([...activityEvents, ...institutionalEvents, ...personalEvents]).slice(0, 8);
    }, [actividades, eventosPersonales, hitosInstitucionales, todayIso]);

    const todayEvents = useMemo(() => {
        const activityEvents = actividades
            .filter((actividad) => actividad.fecha === todayIso)
            .map<EventoCalendario>((actividad) => ({
                id: `actividad-hoy-${actividad.id}`,
                fecha: actividad.fecha,
                inicio: actividad.hora,
                fin: null,
                titulo: actividad.titulo,
                descripcion: actividad.descripcion,
                categoria: 'actividad',
                tipo: actividad.tipo,
                curso: actividad.curso,
                materia: actividad.materia,
                salon: null,
                periodo: null,
            }));

        const institutionalEvents = hitosInstitucionales
            .filter((hito) => hito.fecha === todayIso)
            .map<EventoCalendario>((hito) => ({
                id: `hito-hoy-${hito.id}`,
                fecha: hito.fecha,
                inicio: hito.hora,
                fin: null,
                titulo: hito.titulo,
                descripcion: hito.descripcion,
                categoria: 'institucional',
                tipo: hito.tipo,
                curso: null,
                materia: null,
                salon: null,
                periodo: hito.periodo,
            }));

        const personalEvents = eventosPersonales
            .filter((evento) => evento.fecha === todayIso)
            .map<EventoCalendario>((evento) => ({
                id: `personal-hoy-${evento.id}`,
                sourceId: evento.id,
                fecha: evento.fecha,
                inicio: evento.hora,
                fin: null,
                titulo: evento.titulo,
                descripcion: evento.descripcion,
                categoria: 'personal',
                tipo: 'personal',
                color: evento.color,
                curso: null,
                materia: null,
                salon: null,
                periodo: null,
            }));

        return sortEvents([...activityEvents, ...institutionalEvents, ...personalEvents]);
    }, [actividades, eventosPersonales, hitosInstitucionales, todayIso]);

    const todayWeekday = today.toLocaleDateString('es-CO', { weekday: 'long' }).toLowerCase();

    const clasesHoy = useMemo(
        () =>
            clasesSemanales
                .filter((clase) => clase.dia.toLowerCase() === todayWeekday)
                .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
        [clasesSemanales, todayWeekday],
    );

    const nextClassToday =
        clasesHoy.find((clase) => clase.horaInicio >= nowTime) ??
        clasesHoy[0] ??
        null;

    const createPersonalEvent = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!newEvent.titulo.trim()) return;

        setCreatingEvent(true);

        router.post('/profesor/calendario/eventos-personales', {
            titulo: newEvent.titulo,
            descripcion: newEvent.descripcion || null,
            fecha: newEvent.fecha,
            hora: newEvent.hora || null,
            color: newEvent.color,
        }, {
            preserveScroll: true,
            onFinish: () => setCreatingEvent(false),
            onSuccess: () => {
                setNewEvent({
                    titulo: '',
                    descripcion: '',
                    fecha: selectedDate,
                    hora: '',
                    color: '#0f766e',
                });
            },
        });
    };

    const deletePersonalEvent = (eventId: number) => {
        router.delete(`/profesor/calendario/eventos-personales/${eventId}`, {
            preserveScroll: true,
        });
    };

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayIndex = (new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() + 6) % 7;

    const changeMonth = (offset: number) => {
        const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
        setCurrentMonth(nextMonth);

        const isCurrentRealMonth =
            nextMonth.getFullYear() === today.getFullYear() && nextMonth.getMonth() === today.getMonth();

        setSelectedDate(
            isCurrentRealMonth
                ? todayIso
                : toIsoDate(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1)),
        );
    };

    return (
        <SidebarLayout menuItems={profesorMenuItems} userInfo={{ name: profesor.nombre, role: 'Profesor' }}>
            <Head title="Mi Calendario" />

            <div className="space-y-6">
                <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#293577] via-[#324093] to-[#151943] p-6 text-white shadow-sm">
                    <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10" />
                    <div className="absolute bottom-0 right-20 h-24 w-24 rounded-full bg-cyan-300/10" />

                    <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-xs font-bold uppercase tracking-[0.22em] text-white/80">
                                Agenda y seguimiento
                            </div>
                            <h1 className="mt-4 text-3xl font-black tracking-tight">Calendario academico del profesor</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100/90">
                                Revisa aperturas y cierres de notas, actividades y fechas institucionales. Tambien puedes crear eventos personales para organizar tu agenda diaria.
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-1 xl:w-[220px]">
                            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/60">Hoy</p>
                                <p className="mt-2 text-3xl font-black">{todayEvents.length}</p>
                                <p className="mt-1 text-xs text-blue-100/80">eventos programados para {formatShortDate(todayIso)}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Proxima clase</p>
                        <p className="mt-2 text-lg font-black text-[#293577]">
                            {nextClassToday ? `${nextClassToday.horaInicio} · ${nextClassToday.materia ?? 'Clase programada'}` : 'Sin clase pendiente hoy'}
                        </p>
                        <p className="mt-2 text-sm text-gray-500">{nextClassToday?.curso ?? 'No hay mas clases por dictar en la jornada de hoy.'}</p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400">Eventos personales</p>
                        <p className="mt-2 text-3xl font-black text-teal-600">{resumen.eventosPersonales ?? 0}</p>
                        <p className="mt-2 text-sm text-gray-500">Eventos personales pendientes desde hoy.</p>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(340px,1fr)]">
                    <section className="space-y-6">
                        <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
                                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                    <div>
                                        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Vista mensual</p>
                                        <h2 className="mt-1 text-2xl font-black capitalize text-gray-900">{formatMonthLabel(currentMonth)}</h2>
                                        <p className="mt-1 text-sm text-gray-500">Selecciona un dia para ver el detalle consolidado de agenda.</p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => changeMonth(-1)}
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-[#293577] hover:text-[#293577]"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                                                setSelectedDate(todayIso);
                                            }}
                                            className="rounded-xl bg-[#293577]/8 px-4 py-2 text-sm font-bold text-[#293577] transition hover:bg-[#293577]/12"
                                        >
                                            Ir a hoy
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => changeMonth(1)}
                                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-[#293577] hover:text-[#293577]"
                                        >
                                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                                    <span className="rounded-full bg-[#293577]/10 px-3 py-1 text-[#293577]">Clases</span>
                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">Actividades</span>
                                    <span className="rounded-full bg-teal-100 px-3 py-1 text-teal-700">Eventos personales</span>
                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">Aperturas de notas</span>
                                    <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">Cierres de notas</span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">Hitos de periodo</span>
                                </div>
                            </div>

                            <div className="px-3 pb-3 pt-4 sm:px-4 sm:pb-4">
                                <div className="grid grid-cols-7 gap-2">
                                    {DAY_NAMES.map((day) => (
                                        <div key={day} className="px-1 pb-2 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 sm:text-xs">
                                            {day}
                                        </div>
                                    ))}

                                    {Array.from({ length: firstDayIndex }).map((_, index) => (
                                        <div key={`empty-${index}`} className="min-h-[110px] rounded-2xl bg-transparent" />
                                    ))}

                                    {Array.from({ length: daysInMonth }).map((_, index) => {
                                        const day = index + 1;
                                        const dateIso = toIsoDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
                                        const dayEvents = eventsByDate[dateIso] ?? [];
                                        const isToday = dateIso === todayIso;
                                        const isSelected = dateIso === selectedDate;

                                        return (
                                            <button
                                                key={dateIso}
                                                type="button"
                                                onClick={() => setSelectedDate(dateIso)}
                                                className={`min-h-[110px] rounded-2xl border p-2 text-left transition sm:min-h-[128px] ${
                                                    isSelected
                                                        ? 'border-[#293577] bg-[#293577]/5 shadow-[0_0_0_1px_rgba(41,53,119,0.08)]'
                                                        : isToday
                                                            ? 'border-blue-200 bg-blue-50/60 hover:border-[#293577]'
                                                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <span className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-black ${isToday ? 'bg-[#293577] text-white' : 'text-gray-800'}`}>
                                                        {day}
                                                    </span>
                                                    {dayEvents.length > 0 && (
                                                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                                                            {dayEvents.length}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="mt-2 space-y-1.5">
                                                    {dayEvents.slice(0, 2).map((event) => {
                                                        const tone = getEventTone(event);

                                                        return (
                                                            <div key={event.id} className={`rounded-xl border px-2 py-1 ${tone.soft}`}>
                                                                <p className="truncate text-[11px] font-bold text-gray-800">{event.titulo}</p>
                                                                <p className="truncate text-[10px] text-gray-500">{event.inicio ?? getEventLabel(event)}</p>
                                                            </div>
                                                        );
                                                    })}

                                                    {dayEvents.length > 2 && (
                                                        <p className="text-[11px] font-semibold text-gray-400">+{dayEvents.length - 2} eventos mas</p>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-5 py-4">
                                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Agenda del dia</p>
                                <h2 className="mt-1 text-xl font-black capitalize text-gray-900">{formatDateLabel(selectedDate)}</h2>
                                <p className="mt-1 text-sm text-gray-500">{selectedDayEvents.length} {selectedDayEvents.length === 1 ? 'elemento' : 'elementos'} — clases, actividades y eventos.</p>
                            </div>

                            <div className="p-4">
                                {selectedDayEvents.length > 0 ? (
                                    <div className="space-y-3">
                                        {selectedDayEvents.map((event) => {
                                            const tone = getEventTone(event);

                                            return (
                                                <div key={event.id} className={`rounded-2xl border p-3 ${tone.soft}`}>
                                                    <div className="flex items-start gap-3">
                                                        <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-[11px] font-black ${tone.badge}`}>
                                                            {getEventIcon(event)}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="truncate text-sm font-black text-gray-900">{event.titulo}</h3>
                                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] ${tone.chip}`}>
                                                                    {getEventLabel(event)}
                                                                </span>
                                                            </div>

                                                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
                                                                {event.inicio && <span>{event.fin ? `${event.inicio} - ${event.fin}` : event.inicio}</span>}
                                                                {event.curso && <span>{event.curso}</span>}
                                                                {event.salon && <span>Salon {event.salon}</span>}
                                                                {event.periodo && <span>{event.periodo}</span>}
                                                            </div>

                                                            {(event.materia || event.descripcion) && (
                                                                <p className="mt-2 text-sm leading-5 text-gray-600">
                                                                    {event.materia && event.categoria !== 'clase' ? `${event.materia}. ` : ''}
                                                                    {event.descripcion}
                                                                </p>
                                                            )}

                                                            {event.categoria === 'personal' && event.sourceId && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => deletePersonalEvent(event.sourceId!)}
                                                                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-100"
                                                                >
                                                                    Eliminar evento
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm">
                                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-gray-600">No hay agenda registrada para este dia.</p>
                                        <p className="mt-1 text-xs text-gray-400">Puedes crear un evento personal o revisar las actividades y hitos institucionales.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-5 py-4">
                                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Organizacion personal</p>
                                <h2 className="mt-1 text-xl font-black text-gray-900">Crear evento personal</h2>
                                <p className="mt-1 text-xs text-gray-500">Se agregara directamente al calendario para la fecha seleccionada.</p>
                            </div>

                            <form onSubmit={createPersonalEvent} className="space-y-3 p-4">
                                <input
                                    type="text"
                                    value={newEvent.titulo}
                                    onChange={(event) => setNewEvent((prev) => ({ ...prev, titulo: event.target.value }))}
                                    placeholder="Ej: Reunion con padres de 5A"
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#293577] focus:outline-none focus:ring-2 focus:ring-[#293577]/20"
                                    required
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="date"
                                        value={newEvent.fecha}
                                        onChange={(event) => setNewEvent((prev) => ({ ...prev, fecha: event.target.value }))}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#293577] focus:outline-none focus:ring-2 focus:ring-[#293577]/20"
                                    />
                                    <input
                                        type="time"
                                        value={newEvent.hora}
                                        onChange={(event) => setNewEvent((prev) => ({ ...prev, hora: event.target.value }))}
                                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#293577] focus:outline-none focus:ring-2 focus:ring-[#293577]/20"
                                    />
                                </div>
                                <textarea
                                    value={newEvent.descripcion}
                                    onChange={(event) => setNewEvent((prev) => ({ ...prev, descripcion: event.target.value }))}
                                    placeholder="Nota opcional"
                                    rows={2}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:border-[#293577] focus:outline-none focus:ring-2 focus:ring-[#293577]/20"
                                />
                                <div className="flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setNewEvent((prev) => ({ ...prev, fecha: selectedDate }))}
                                        className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                                    >
                                        Usar dia seleccionado
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creatingEvent}
                                        className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                                    >
                                        {creatingEvent ? 'Guardando...' : 'Agregar evento'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
                            <div className="border-b border-gray-100 px-5 py-4">
                                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-400">Control institucional</p>
                                <h2 className="mt-1 text-xl font-black text-gray-900">Proximos eventos</h2>
                            </div>

                            <div className="space-y-4 p-4">
                                <div>
                                    <div className="mb-3 flex items-center justify-between">
                                        <p className="text-sm font-black text-gray-900">Agenda consolidada</p>
                                        <span className="text-xs font-semibold text-gray-400">Fuente: administracion, actividades y personal</span>
                                    </div>

                                    {nextAgenda.length > 0 ? (
                                        <div className="space-y-2.5">
                                            {nextAgenda.map((event) => {
                                                const tone = getEventTone(event);

                                                return (
                                                    <div key={event.id} className="flex items-start gap-3 rounded-2xl border border-gray-100 px-3 py-3 transition hover:border-gray-200 hover:bg-gray-50/70">
                                                        <div className={`mt-0.5 h-3 w-3 rounded-full ${tone.dot}`} />
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <p className="truncate text-sm font-bold text-gray-800">{event.titulo}</p>
                                                                <span className="flex-shrink-0 text-[11px] font-semibold text-gray-400">{formatShortDate(event.fecha)}</span>
                                                            </div>
                                                            <p className="mt-0.5 text-xs text-gray-500">
                                                                {event.inicio ? `${event.inicio} · ` : ''}
                                                                {event.curso ?? event.periodo ?? getEventLabel(event)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
                                            No hay eventos proximos cargados.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </SidebarLayout>
    );
}
