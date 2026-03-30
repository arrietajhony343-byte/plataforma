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

type DiaKey = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';

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

const DAY_LABELS: Record<string, string> = {
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miercoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sabado',
    domingo: 'Domingo',
};

const dias: { key: DiaKey; label: string }[] = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miercoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
];

export default function Horario({ profesor, resumen, clasesSemanales }: Props) {
    const clasesOrdenadas = useMemo(() => [...clasesSemanales].sort((a, b) => {
        const dayDiff = (DAY_ORDER[a.dia.toLowerCase()] ?? 99) - (DAY_ORDER[b.dia.toLowerCase()] ?? 99);
        if (dayDiff !== 0) return dayDiff;
        return a.horaInicio.localeCompare(b.horaInicio);
    }), [clasesSemanales]);

    const horarioGrid = useMemo<HorarioSlot[]>(() => {
        const slotsMap = new Map<string, HorarioSlot>();

        clasesOrdenadas.forEach((clase) => {
            const key = `${clase.horaInicio}-${clase.horaFin}`;
            if (!slotsMap.has(key)) {
                slotsMap.set(key, {
                    horaInicio: clase.horaInicio,
                    horaFin: clase.horaFin,
                    clases: {},
                });
            }

            const slot = slotsMap.get(key)!;
            const dia = clase.dia.toLowerCase() as DiaKey;

            if (dias.some((d) => d.key === dia) && !slot.clases[dia]) {
                slot.clases[dia] = clase;
            }
        });

        return Array.from(slotsMap.values()).sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
    }, [clasesOrdenadas]);

    return (
        <SidebarLayout menuItems={profesorMenuItems} userInfo={{ name: profesor.nombre, role: 'Profesor' }}>
            <Head title="Mi Horario" />

            <div className="space-y-6">
                <section className="rounded-[24px] bg-gradient-to-br from-[#1f2b67] via-[#293577] to-[#11163b] p-6 text-white shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-100/80">Mi horario docente</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight">Bloques semanales de clase</h1>
                    <p className="mt-2 max-w-2xl text-sm text-blue-100/90">
                        Esta vista concentra solo tu carga de horario para que la revises rapido, sin mezclarla con hitos administrativos.
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
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Dias con clase</p>
                        <p className="mt-2 text-3xl font-black text-[#293577]">{resumen.diasConClase}</p>
                    </div>
                </section>

                <section className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-100 px-5 py-4">
                        <h2 className="text-lg font-black text-gray-900">Horario semanal</h2>
                    </div>

                    {clasesOrdenadas.length === 0 ? (
                        <div className="px-6 py-10 text-center text-sm text-gray-500">
                            No hay bloques asignados para este ano.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[860px]">
                                <thead>
                                    <tr>
                                        <th className="px-3 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-white/90 bg-gradient-to-r from-[#181b49] to-[#293577] w-[110px]">Hora</th>
                                        {dias.map((d) => (
                                            <th key={d.key} className="px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-white bg-gradient-to-r from-[#181b49] to-[#293577]">
                                                {d.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {horarioGrid.map((slot, idx) => (
                                        <tr key={`${slot.horaInicio}-${slot.horaFin}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                                            <td className="px-3 py-2 border-r border-gray-100 align-top">
                                                <div className="text-xs font-bold text-gray-800">{slot.horaInicio}</div>
                                                <div className="text-[10px] text-gray-400">{slot.horaFin}</div>
                                            </td>
                                            {dias.map((d) => {
                                                const clase = slot.clases[d.key];

                                                return (
                                                    <td key={d.key} className="px-2 py-2 align-top min-w-[140px]">
                                                        {clase ? (
                                                            <div className="rounded-lg border border-gray-100 bg-white shadow-sm px-2 py-2">
                                                                <p className="text-xs font-bold text-gray-800 leading-tight">{clase.materia ?? 'Sin materia'}</p>
                                                                <p className="mt-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 inline-block px-1.5 py-0.5 rounded">
                                                                    {clase.curso ?? 'Sin curso'}
                                                                </p>
                                                                <p className="mt-1 text-[10px] text-gray-500">Salon: {clase.salon ?? '—'}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="h-[66px] rounded-lg border border-dashed border-gray-200 bg-gray-50/60" />
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
                </section>
            </div>
        </SidebarLayout>
    );
}
