import { profesorMenuItems } from '@/Config/profesorMenu';
import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useMemo } from 'react';

interface ClaseSemanal {
    id: number;
    materia: string | null;
    curso: string | null;
    dia: string;
    horaInicio: string;
    horaFin: string;
    salon: string | null;
}

interface Props {
    profesor: { nombre: string };
    resumen: {
        totalCursos: number;
        totalClasesSemanales: number;
        diasConClase: number;
    };
    clasesSemanales: ClaseSemanal[];
}

type DiaKey = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';

interface HorarioSlot {
    horaInicio: string;
    horaFin: string;
    clases: Partial<Record<DiaKey, ClaseSemanal>>;
}

const DAY_ORDER: Record<string, number> = {
    lunes: 1,
    martes: 2,
    miercoles: 3,
    jueves: 4,
    viernes: 5,
    sabado: 6,
    domingo: 7,
};

const DAY_LABELS: Record<DiaKey, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
};

const WEEKDAY_TO_DIA: Record<number, DiaKey> = {
    1: 'lunes',
    2: 'martes',
    3: 'miercoles',
    4: 'jueves',
    5: 'viernes',
    6: 'sabado',
};

const parseHora = (raw: string) => {
    const [hRaw, mRaw = '0'] = raw.split(':');
    const h = Number.parseInt(hRaw, 10);
    const m = Number.parseInt(mRaw, 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return { h, m };
};

const toMinutes = (raw: string) => {
    const parsed = parseHora(raw);
    if (!parsed) return Number.MAX_SAFE_INTEGER;
    return parsed.h * 60 + parsed.m;
};

const formatHora = (raw: string) => {
    const parsed = parseHora(raw);
    if (!parsed) return raw;
    return `${String(parsed.h).padStart(2, '0')}:${String(parsed.m).padStart(2, '0')}`;
};

const MATERIA_COLORS = [
    { border: 'border-violet-200', bg: 'bg-violet-50', text: 'text-violet-800', badge: 'bg-violet-100 text-violet-700' },
    { border: 'border-sky-200',    bg: 'bg-sky-50',    text: 'text-sky-800',    badge: 'bg-sky-100 text-sky-700'    },
    { border: 'border-emerald-200',bg: 'bg-emerald-50',text: 'text-emerald-800',badge: 'bg-emerald-100 text-emerald-700'},
    { border: 'border-amber-200',  bg: 'bg-amber-50',  text: 'text-amber-800',  badge: 'bg-amber-100 text-amber-700' },
    { border: 'border-rose-200',   bg: 'bg-rose-50',   text: 'text-rose-800',   badge: 'bg-rose-100 text-rose-700'  },
    { border: 'border-cyan-200',   bg: 'bg-cyan-50',   text: 'text-cyan-800',   badge: 'bg-cyan-100 text-cyan-700'  },
    { border: 'border-fuchsia-200',bg: 'bg-fuchsia-50',text: 'text-fuchsia-800',badge: 'bg-fuchsia-100 text-fuchsia-700'},
];

export default function Horario({ profesor, resumen, clasesSemanales }: Props) {
    const todayDia = WEEKDAY_TO_DIA[new Date().getDay()] ?? null;

    const clasesOrdenadas = useMemo(() => [...clasesSemanales].sort((a, b) => {
        const dayDiff = (DAY_ORDER[a.dia.toLowerCase()] ?? 99) - (DAY_ORDER[b.dia.toLowerCase()] ?? 99);
        if (dayDiff !== 0) return dayDiff;
        return toMinutes(a.horaInicio) - toMinutes(b.horaInicio);
    }), [clasesSemanales]);

    const hasSabado = useMemo(
        () => clasesOrdenadas.some(c => c.dia.toLowerCase() === 'sabado'),
        [clasesOrdenadas],
    );

    const dias = useMemo<{ key: DiaKey; label: string }[]>(() => {
        const base: { key: DiaKey; label: string }[] = [
            { key: 'lunes',     label: DAY_LABELS.lunes     },
            { key: 'martes',    label: DAY_LABELS.martes    },
            { key: 'miercoles', label: DAY_LABELS.miercoles },
            { key: 'jueves',    label: DAY_LABELS.jueves    },
            { key: 'viernes',   label: DAY_LABELS.viernes   },
        ];
        if (hasSabado) base.push({ key: 'sabado', label: DAY_LABELS.sabado });
        return base;
    }, [hasSabado]);

    // Assign stable color per materia name
    const materiaColorMap = useMemo(() => {
        const map = new Map<string, number>();
        let idx = 0;
        clasesOrdenadas.forEach(c => {
            const key = c.materia ?? '';
            if (!map.has(key)) map.set(key, idx++ % MATERIA_COLORS.length);
        });
        return map;
    }, [clasesOrdenadas]);

    const horarioGrid = useMemo<HorarioSlot[]>(() => {
        const slotsMap = new Map<string, HorarioSlot>();

        clasesOrdenadas.forEach((clase) => {
            const key = `${clase.horaInicio}-${clase.horaFin}`;
            if (!slotsMap.has(key)) {
                slotsMap.set(key, { horaInicio: clase.horaInicio, horaFin: clase.horaFin, clases: {} });
            }

            const slot = slotsMap.get(key)!;
            const dia = clase.dia.toLowerCase() as DiaKey;

            if (dias.some((d) => d.key === dia) && !slot.clases[dia]) {
                slot.clases[dia] = clase;
            }
        });

        return Array.from(slotsMap.values()).sort((a, b) => toMinutes(a.horaInicio) - toMinutes(b.horaInicio));
    }, [clasesOrdenadas, dias]);

    return (
        <SidebarLayout menuItems={profesorMenuItems} userInfo={{ name: profesor.nombre, role: 'Profesor' }}>
            <Head title="Mi Horario" />

            <div className="space-y-6">
                <section className="rounded-[24px] bg-gradient-to-br from-[#1f2b67] via-[#293577] to-[#11163b] p-6 text-white shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100/80">Mi horario docente</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight">Bloques semanales de clase</h1>
                    <p className="mt-2 max-w-2xl text-sm text-blue-100/90">
                        Vista de tu carga horaria semanal. Los colores agrupan materias para que identifiques rápido tus bloques.
                    </p>
                </section>

                <section className="grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Cursos</p>
                        <p className="mt-2 text-3xl font-black text-[#293577]">{resumen.totalCursos}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Bloques semanales</p>
                        <p className="mt-2 text-3xl font-black text-[#293577]">{resumen.totalClasesSemanales}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Días con clase</p>
                        <p className="mt-2 text-3xl font-black text-[#293577]">{resumen.diasConClase}</p>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between gap-3">
                        <h2 className="text-lg font-black text-gray-900">Horario semanal</h2>
                        {todayDia && (
                            <span className="rounded-full bg-[#293577]/10 px-3 py-1 text-xs font-bold text-[#293577]">
                                Hoy: {DAY_LABELS[todayDia]}
                            </span>
                        )}
                    </div>

                    {clasesOrdenadas.length === 0 ? (
                        <div className="px-6 py-14 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-sm font-semibold text-gray-600">No hay bloques asignados para este año.</p>
                            <p className="mt-1 text-xs text-gray-400">Contacta al coordinador para que configure tu horario.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[860px]">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white/90 bg-gradient-to-r from-[#181b49] to-[#293577] w-[110px]">Hora</th>
                                        {dias.map((d) => {
                                            const isToday = d.key === todayDia;
                                            return (
                                                <th
                                                    key={d.key}
                                                    className={`px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wider bg-gradient-to-r from-[#181b49] to-[#293577] ${isToday ? 'text-cyan-200' : 'text-white'}`}
                                                >
                                                    {d.label}
                                                    {isToday && <span className="ml-1.5 text-[10px] font-normal text-cyan-300/80 normal-case">hoy</span>}
                                                </th>
                                            );
                                        })}
                                    </tr>
                                </thead>
                                <tbody>
                                    {horarioGrid.map((slot, idx) => (
                                        <tr key={`${slot.horaInicio}-${slot.horaFin}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                                            <td className="px-3 py-2 border-r border-gray-100 align-middle">
                                                <div className="text-xs font-bold text-gray-800">{formatHora(slot.horaInicio)}</div>
                                                <div className="text-[10px] text-gray-400">{formatHora(slot.horaFin)}</div>
                                            </td>
                                            {dias.map((d) => {
                                                const clase = slot.clases[d.key];
                                                const isToday = d.key === todayDia;
                                                const colorIdx = clase ? (materiaColorMap.get(clase.materia ?? '') ?? 0) : 0;
                                                const color = MATERIA_COLORS[colorIdx];

                                                return (
                                                    <td key={d.key} className={`px-2 py-2 align-top min-w-[140px] ${isToday ? 'bg-blue-50/25' : ''}`}>
                                                        {clase ? (
                                                            <div className={`rounded-xl border px-2.5 py-2 shadow-sm ${color.border} ${color.bg}`}>
                                                                <p className={`text-xs font-bold leading-tight ${color.text}`}>{clase.materia ?? 'Sin materia'}</p>
                                                                <p className={`mt-1 text-[11px] font-semibold inline-block px-1.5 py-0.5 rounded ${color.badge}`}>
                                                                    {clase.curso ?? 'Sin curso'}
                                                                </p>
                                                                {clase.salon && (
                                                                    <p className="mt-1 text-[10px] text-gray-500">Salón: {clase.salon}</p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className={`h-[70px] rounded-xl border border-dashed ${isToday ? 'border-[#293577]/15 bg-[#293577]/3' : 'border-gray-200 bg-gray-50/40'}`} />
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Color legend */}
                    {clasesOrdenadas.length > 0 && (
                        <div className="border-t border-gray-100 px-5 py-3 flex flex-wrap gap-2">
                            {Array.from(materiaColorMap.entries()).map(([materia, colorIdx]) => {
                                const color = MATERIA_COLORS[colorIdx];
                                return (
                                    <span key={materia} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${color.border} ${color.badge}`}>
                                        <span className={`h-2 w-2 rounded-full ${color.border} border`} style={{ background: 'currentColor' }} />
                                        {materia || 'Sin materia'}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </SidebarLayout>
    );
}
