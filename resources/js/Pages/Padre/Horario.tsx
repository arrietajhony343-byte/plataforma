import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useMemo } from 'react';
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

interface HorarioSemanalItem {
    id: number;
    dia: string;
    horaInicio: string | null;
    horaFin: string | null;
    materia: string;
    profesor: string;
    salon: string | null;
}

interface Props {
    padre: {
        nombre: string;
    };
    hijos: HijoOption[];
    hijo: HijoData | null;
    horarioSemanal: HorarioSemanalItem[];
}

const DAY_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;

const normalizeDay = (dia: string) =>
    dia
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const parseHora = (raw?: string | null): { h: number; m: number } | null => {
    if (!raw) return null;
    const [hRaw, mRaw = '0'] = String(raw).trim().split(':');
    const h = Number.parseInt(hRaw, 10);
    const m = Number.parseInt(mRaw, 10);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return { h, m };
};

const toMinutes = (raw?: string | null) => {
    const parsed = parseHora(raw);
    if (!parsed) return Number.MAX_SAFE_INTEGER;
    return parsed.h * 60 + parsed.m;
};

const formatHora = (raw?: string | null) => {
    const parsed = parseHora(raw);
    if (!parsed) return '--:--';
    return `${String(parsed.h).padStart(2, '0')}:${String(parsed.m).padStart(2, '0')}`;
};

const dayLabel = (dia: string) => {
    if (dia === 'miercoles') return 'Miércoles';
    if (dia === 'sabado') return 'Sábado';
    return dia.charAt(0).toUpperCase() + dia.slice(1);
};

export default function Horario({ padre, hijos, hijo, horarioSemanal }: Props) {
    const onHijoChange = (id: number) => {
        router.get('/padre/horario', { hijo_id: id }, { preserveState: true, replace: true });
    };

    const dias = useMemo(() => {
        const presentes = new Set<string>();
        horarioSemanal.forEach((item) => {
            presentes.add(normalizeDay(item.dia));
        });

        const ordered = DAY_ORDER.filter((d) => presentes.has(d));
        return ordered.length > 0 ? ordered : ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
    }, [horarioSemanal]);

    const franjas = useMemo(() => {
        const map = new Map<string, { inicio: string; fin: string | null }>();

        horarioSemanal.forEach((item) => {
            const inicio = formatHora(item.horaInicio);
            if (inicio === '--:--') return;

            const fin = item.horaFin ? formatHora(item.horaFin) : null;
            const prev = map.get(inicio);

            if (!prev) {
                map.set(inicio, { inicio, fin });
                return;
            }

            if ((!prev.fin || prev.fin === '--:--') && fin) {
                prev.fin = fin;
            }
        });

        return Array.from(map.values()).sort((a, b) => toMinutes(a.inicio) - toMinutes(b.inicio));
    }, [horarioSemanal]);

    const bloquesPorCelda = useMemo(() => {
        const map = new Map<string, HorarioSemanalItem[]>();

        for (const item of horarioSemanal) {
            const dia = normalizeDay(item.dia);
            const hora = formatHora(item.horaInicio);
            const key = `${dia}-${hora}`;
            const prev = map.get(key) ?? [];
            prev.push(item);
            map.set(key, prev);
        }

        return map;
    }, [horarioSemanal]);

    const totalMaterias = useMemo(() => new Set(horarioSemanal.map((b) => b.materia)).size, [horarioSemanal]);
    const totalDocentes = useMemo(() => new Set(horarioSemanal.map((b) => b.profesor)).size, [horarioSemanal]);

    return (
        <SidebarLayout menuItems={padreMenuItems} userInfo={{ name: padre.nombre, role: 'Padre' }}>
            <Head title="Horario" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {!hijo ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                        <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Horario</h1>
                        <p className="text-gray-500 mt-2">No hay hijos vinculados a este acudiente.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Horario de clases</h1>
                                <p className="text-gray-600">{hijo.nombre} · {hijo.grado} Sección {hijo.seccion}</p>
                            </div>

                            <div className="flex items-center gap-2 w-full lg:w-auto">
                                {hijos.length > 1 && (
                                    <div className="w-full lg:w-auto">
                                        <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Cambiar de hijo/a</p>
                                        <select
                                            value={hijo.id}
                                            onChange={(e) => onHijoChange(Number(e.target.value))}
                                            className="w-full lg:min-w-[260px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent"
                                        >
                                            {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Bloques</p>
                                <p className="text-2xl font-bold text-[#181b49]">{horarioSemanal.length}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Materias</p>
                                <p className="text-2xl font-bold text-[#293577]">{totalMaterias}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Docentes</p>
                                <p className="text-2xl font-bold text-[#293577]">{totalDocentes}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 p-4">
                            {horarioSemanal.length === 0 ? (
                                <div className="rounded-lg border border-dashed border-gray-300 p-8 text-sm text-gray-500 text-center">
                                    No hay bloques de horario registrados para este curso.
                                </div>
                            ) : (
                                <>
                                    <div className="hidden lg:block overflow-x-auto">
                                        <table className="min-w-[920px] w-full border-separate border-spacing-2">
                                            <thead>
                                                <tr>
                                                    <th className="w-28 text-left text-xs font-semibold uppercase text-gray-500 px-2 py-2">Hora</th>
                                                    {dias.map((dia) => (
                                                        <th key={dia} className="text-center text-xs font-semibold uppercase text-gray-500 px-2 py-2">
                                                            {dayLabel(dia)}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {franjas.map((franja) => (
                                                    <tr key={franja.inicio}>
                                                        <td className="align-top rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm font-semibold text-gray-700">
                                                            <p>{franja.inicio}</p>
                                                            <p className="text-[11px] text-gray-400">{franja.fin ?? '--:--'}</p>
                                                        </td>
                                                        {dias.map((dia) => {
                                                            const key = `${dia}-${franja.inicio}`;
                                                            const bloques = bloquesPorCelda.get(key) ?? [];

                                                            return (
                                                                <td key={key} className="align-top rounded-lg border border-gray-100 p-2 min-h-[96px]">
                                                                    {bloques.length === 0 ? (
                                                                        <div className="h-[84px] flex items-center justify-center text-xs text-gray-300">-</div>
                                                                    ) : (
                                                                        <div className="space-y-2">
                                                                            {bloques.map((bloque) => (
                                                                                <div key={bloque.id} className="rounded-lg border border-indigo-100 bg-indigo-50 p-2.5">
                                                                                    <p className="text-xs font-semibold text-indigo-900">{bloque.materia}</p>
                                                                                    <p className="text-[11px] text-indigo-700">{formatHora(bloque.horaInicio)} - {formatHora(bloque.horaFin)}</p>
                                                                                    <p className="text-[11px] text-gray-600">{bloque.profesor}</p>
                                                                                    {bloque.salon && <p className="text-[11px] text-gray-500">Salón {bloque.salon}</p>}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="lg:hidden space-y-3">
                                        {dias.map((dia) => {
                                            const bloquesDia = horarioSemanal
                                                .filter((item) => normalizeDay(item.dia) === dia)
                                                .sort((a, b) => toMinutes(a.horaInicio) - toMinutes(b.horaInicio));

                                            if (bloquesDia.length === 0) return null;

                                            return (
                                                <div key={dia} className="rounded-lg border border-gray-100 p-3">
                                                    <p className="text-sm font-semibold text-gray-700 mb-2">{dayLabel(dia)}</p>
                                                    <div className="space-y-2">
                                                        {bloquesDia.map((bloque) => (
                                                            <div key={bloque.id} className="rounded-lg border border-indigo-100 bg-indigo-50 p-2.5">
                                                                <p className="text-sm font-semibold text-indigo-900">{bloque.materia}</p>
                                                                <p className="text-xs text-indigo-700">{formatHora(bloque.horaInicio)} - {formatHora(bloque.horaFin)}</p>
                                                                <p className="text-xs text-gray-600">{bloque.profesor}</p>
                                                                {bloque.salon && <p className="text-xs text-gray-500">Salón {bloque.salon}</p>}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        </SidebarLayout>
    );
}
