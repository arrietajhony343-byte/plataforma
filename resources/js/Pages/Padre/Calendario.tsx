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

interface ItemCalendario {
    id: string;
    origen: 'actividad' | 'evento';
    titulo: string;
    materia: string;
    profesor: string;
    fecha: string;
    hora: string | null;
    tipo: string;
    descripcion: string | null;
    entregada: boolean | null;
    vencida: boolean;
}

interface Props {
    padre: {
        nombre: string;
    };
    hijos: HijoOption[];
    hijo: HijoData | null;
    items: ItemCalendario[];
    pendientes: ItemCalendario[];
    resumen: {
        total: number;
        proximas: number;
        vencidas: number;
    };
}

export default function Calendario({ padre, hijos, hijo, items, pendientes, resumen }: Props) {
    const [vistaActual, setVistaActual] = useState<'calendario' | 'lista'>('calendario');
    const [selectedActividad, setSelectedActividad] = useState<ItemCalendario | null>(null);

    const onHijoChange = (id: number) => {
        router.get('/padre/calendario', { hijo_id: id }, { preserveState: true });
    };

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const fechaBase = useMemo(() => {
        if (items.length === 0) return new Date();
        const d = new Date(items[0].fecha + 'T00:00:00');
        return Number.isNaN(d.getTime()) ? new Date() : d;
    }, [items]);

    const [mesActual, setMesActual] = useState(fechaBase.getMonth());
    const anioActual = fechaBase.getFullYear();

    const getTipoColor = (tipo: string) => {
        if (['examen', 'quiz'].includes(tipo)) return 'bg-red-100 text-red-700 border-red-200';
        if (['tarea', 'proyecto', 'taller'].includes(tipo)) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (['reunion_padres', 'reunion'].includes(tipo)) return 'bg-amber-100 text-amber-800 border-amber-200';
        if (['institucional', 'academico', 'evento', 'otro'].includes(tipo)) return 'bg-slate-100 text-slate-700 border-slate-200';
        return 'bg-[#293577]/10 text-[#293577] border-[#293577]/20';
    };

    const getTipoIcon = (tipo: string) => {
        if (['examen', 'quiz'].includes(tipo)) return 'E';
        if (['tarea', 'proyecto', 'taller'].includes(tipo)) return 'T';
        if (['reunion_padres', 'reunion'].includes(tipo)) return 'R';
        if (['institucional', 'academico', 'evento', 'otro'].includes(tipo)) return 'I';
        return 'A';
    };

    const diasEnMes = new Date(anioActual, mesActual + 1, 0).getDate();
    const primerDiaJS = new Date(anioActual, mesActual, 1).getDay();
    const primerDiaSemana = (primerDiaJS + 6) % 7;
    const dias = Array.from({ length: diasEnMes }, (_, i) => i + 1);

    const getItemsDelDia = (dia: number) => {
        const fecha = `${anioActual}-${String(mesActual + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        return items.filter((a) => a.fecha === fecha);
    };

    const listaOrdenada = [...items].sort((a, b) => {
        const ad = `${a.fecha} ${a.hora ?? '23:59'}`;
        const bd = `${b.fecha} ${b.hora ?? '23:59'}`;
        return ad.localeCompare(bd);
    });

    return (
        <SidebarLayout menuItems={padreMenuItems} userInfo={{ name: padre.nombre, role: 'Padre' }}>
            <Head title="Calendario" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {!hijo ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                        <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Calendario</h1>
                        <p className="text-gray-500 mt-2">No hay hijos vinculados a este acudiente.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Calendario Academico</h1>
                                <p className="text-gray-600">{hijo.nombre} · {hijo.grado} Seccion {hijo.seccion}</p>
                            </div>
                            {hijos.length > 1 && (
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Cambiar de hijo/a</p>
                                    <select
                                        value={hijo.id}
                                        onChange={(e) => onHijoChange(Number(e.target.value))}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent min-w-[220px]"
                                    >
                                        {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                                <p className="text-sm text-gray-500">Total</p>
                                <p className="text-2xl font-bold text-[#181b49]">{resumen.total}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                                <p className="text-sm text-gray-500">Proximas</p>
                                <p className="text-2xl font-bold text-[#293577]">{resumen.proximas}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                                <p className="text-sm text-gray-500">Vencidas</p>
                                <p className="text-2xl font-bold text-red-600">{resumen.vencidas}</p>
                            </div>
                        </div>

                        {pendientes.length > 0 && (
                            <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4">
                                <p className="font-semibold text-red-800">Actividades pendientes o no entregadas</p>
                                <div className="mt-1 space-y-1">
                                    {pendientes.slice(0, 3).map((a) => (
                                        <p key={a.id} className="text-sm text-red-700">• {a.titulo} ({a.materia}) - {a.fecha}</p>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setVistaActual('calendario')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${vistaActual === 'calendario' ? 'bg-[#293577] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                                Calendario
                            </button>
                            <button onClick={() => setVistaActual('lista')} className={`px-4 py-2 rounded-lg text-sm font-semibold ${vistaActual === 'lista' ? 'bg-[#293577] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                                Lista
                            </button>
                            <button
                                onClick={() => router.get('/padre/horario', { hijo_id: hijo.id })}
                                className="px-4 py-2 rounded-lg text-sm font-semibold bg-white border border-gray-200 text-gray-600 hover:border-[#293577] hover:text-[#293577]"
                            >
                                Ver horario
                            </button>
                        </div>

                        {vistaActual === 'calendario' ? (
                            <div className="bg-white rounded-xl border border-gray-100 p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <button onClick={() => setMesActual(Math.max(0, mesActual - 1))} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700">Anterior</button>
                                    <h2 className="text-lg font-bold text-[#181b49]">{meses[mesActual]} {anioActual}</h2>
                                    <button onClick={() => setMesActual(Math.min(11, mesActual + 1))} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700">Siguiente</button>
                                </div>

                                <div className="hidden md:block">
                                    <div className="grid grid-cols-7 gap-1">
                                        {['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'].map((d) => <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>)}
                                        {Array.from({ length: primerDiaSemana }).map((_, i) => <div key={`e-${i}`} className="min-h-[90px]" />)}
                                        {dias.map((dia) => {
                                            const acts = getItemsDelDia(dia);
                                            const hoy = new Date();
                                            const isHoy = dia === hoy.getDate() && mesActual === hoy.getMonth() && anioActual === hoy.getFullYear();
                                            return (
                                                <div key={dia} className={`p-1 min-h-[90px] border rounded-lg ${isHoy ? 'border-[#293577] bg-[#293577]/5' : 'border-gray-100'}`}>
                                                    <p className={`text-sm font-semibold mb-1 ${isHoy ? 'text-[#293577]' : 'text-gray-700'}`}>{dia}</p>
                                                    {acts.map((act) => (
                                                        <button key={act.id} onClick={() => setSelectedActividad(act)} className={`w-full text-left text-[10px] px-1 py-0.5 rounded mb-0.5 border truncate ${getTipoColor(act.tipo)}`}>
                                                            {getTipoIcon(act.tipo)} {act.titulo}
                                                        </button>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="md:hidden space-y-2">
                                    {dias.map((dia) => {
                                        const acts = getItemsDelDia(dia);
                                        if (acts.length === 0) return null;
                                        return (
                                            <div key={dia} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                                                <div className="w-10 h-10 rounded-lg bg-[#293577] text-white flex items-center justify-center font-bold">{dia}</div>
                                                <div className="flex-1 space-y-1">
                                                    {acts.map((act) => (
                                                        <button key={act.id} onClick={() => setSelectedActividad(act)} className={`w-full text-left text-xs px-2 py-1.5 rounded-lg border ${getTipoColor(act.tipo)}`}>
                                                            {getTipoIcon(act.tipo)} <strong>{act.titulo}</strong> · {act.materia}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                                <div className="px-4 py-3 border-b bg-gray-50"><h3 className="font-semibold text-gray-700">Agenda</h3></div>
                                <div className="divide-y">
                                    {listaOrdenada.map((act) => (
                                        <button key={act.id} onClick={() => setSelectedActividad(act)} className="w-full p-4 hover:bg-gray-50 text-left">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-800 truncate">{act.titulo}</p>
                                                    <p className="text-sm text-gray-500 truncate">{act.materia} · {act.profesor}</p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <span className="inline-block bg-[#293577]/10 text-[#293577] px-2.5 py-1 rounded-full text-xs font-semibold">{act.fecha}</span>
                                                    {act.hora && <p className="text-xs text-gray-500 mt-1">{act.hora}</p>}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {selectedActividad && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg border border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                            <h2 className="text-lg font-bold text-[#181b49]">{selectedActividad.titulo}</h2>
                            <button onClick={() => setSelectedActividad(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="space-y-2 text-sm">
                            <p><span className="text-gray-500">Materia:</span> <span className="text-gray-800 font-medium">{selectedActividad.materia}</span></p>
                            <p><span className="text-gray-500">Responsable:</span> <span className="text-gray-800 font-medium">{selectedActividad.profesor}</span></p>
                            <p><span className="text-gray-500">Fecha:</span> <span className="text-gray-800 font-medium">{selectedActividad.fecha}{selectedActividad.hora ? ` ${selectedActividad.hora}` : ''}</span></p>
                            {selectedActividad.descripcion && <p className="mt-2 text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedActividad.descripcion}</p>}
                        </div>
                        <button onClick={() => setSelectedActividad(null)} className="mt-5 w-full px-4 py-2 bg-[#293577] text-white rounded-lg">Cerrar</button>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
