import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

interface Clase {
    id: number;
    materia: string;
    curso: string;
    profesor: string;
    aula: string;
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
    curso: string;
    curso_id: number;
    materia: string;
    profesor: string;
    dia: string;
    hora: string;
    horaFin: string;
    salon: string;
}

type DiaKey = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes';

interface HorarioSlot {
    hora: string;
    horaFin: string;
    esDescanso?: boolean;
    clases: Partial<Record<DiaKey, Clase>>;
}

// Color palette for professors
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

interface Props {
    profesores: ProfesorBackend[];
    horarios: HorarioBackend[];
    cursos: { id: number; nombre: string }[];
    materias: { id: number; nombre: string }[];
}

// Standard time slots
const timeSlots = [
    { hora: '7:00', horaFin: '7:50' },
    { hora: '7:50', horaFin: '8:40' },
    { hora: '8:40', horaFin: '9:30' },
    { hora: '9:30', horaFin: '10:00', esDescanso: true },
    { hora: '10:00', horaFin: '10:50' },
    { hora: '10:50', horaFin: '11:40' },
    { hora: '11:40', horaFin: '12:00', esDescanso: true },
    { hora: '12:00', horaFin: '12:50' },
    { hora: '12:50', horaFin: '1:40' },
];

export default function Horarios({ profesores: profesoresRaw, horarios, cursos, materias }: Props) {
    const [vistaActiva, setVistaActiva] = useState<'general' | 'profesor' | 'curso'>('general');
    const [profesorSeleccionado, setProfesorSeleccionado] = useState('');
    const [cursoSeleccionado, setCursoSeleccionado] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [searchProfesor, setSearchProfesor] = useState('');
    const [claseDetalle, setClaseDetalle] = useState<Clase | null>(null);
    const [profesorDetalle, setProfesorDetalle] = useState<Profesor | null>(null);

    // Enrich profesores with colors and initials
    const profesores: Profesor[] = useMemo(() => profesoresRaw.map((p, i) => {
        const c = profesorColors[i % profesorColors.length];
        const initials = p.nombre.split(' ').map(n => n[0]).join('').slice(0, 2);
        return { ...p, foto: initials, ...c };
    }), [profesoresRaw]);

    const profesorColorMap: Record<string, { bg: string; border: string; text: string }> = {};
    profesores.forEach(p => {
        profesorColorMap[p.nombre] = { bg: p.colorBg, border: p.colorBorder, text: p.colorText };
    });

    const dias: { key: DiaKey; label: string }[] = [
        { key: 'lunes', label: 'Lunes' },
        { key: 'martes', label: 'Martes' },
        { key: 'miercoles', label: 'Miércoles' },
        { key: 'jueves', label: 'Jueves' },
        { key: 'viernes', label: 'Viernes' },
    ];

    // Build HorarioSlot grid from flat horarios
    const horarioData: HorarioSlot[] = useMemo(() => {
        return timeSlots.map(slot => {
            if (slot.esDescanso) return { ...slot, clases: {} };
            const clases: Partial<Record<DiaKey, Clase>> = {};
            horarios.forEach(h => {
                if (h.hora === slot.hora && dias.some(d => d.key === h.dia)) {
                    clases[h.dia as DiaKey] = { id: h.id, materia: h.materia, curso: h.curso, profesor: h.profesor, aula: h.salon ?? '' };
                }
            });
            return { hora: slot.hora, horaFin: slot.horaFin, clases };
        });
    }, [horarios]);

    const allClases = useMemo(() => {
        const list: Clase[] = [];
        horarioData.forEach(slot => {
            dias.forEach(d => {
                const c = slot.clases[d.key];
                if (c) list.push(c);
            });
        });
        return list;
    }, []);

    const stats = useMemo(() => ({
        totalClases: allClases.length,
        totalProfesores: profesores.length,
        horasTotales: profesores.reduce((a, p) => a + p.horasSemanales, 0),
        disponibilidad: Math.round((1 - allClases.length / (horarioData.filter(s => !s.esDescanso).length * 5)) * 100),
        cursosActivos: [...new Set(allClases.map(c => c.curso))].length,
    }), [allClases]);

    const filteredProfesores = useMemo(() => {
        if (!searchProfesor) return profesores;
        const s = searchProfesor.toLowerCase();
        return profesores.filter(p => p.nombre.toLowerCase().includes(s) || p.especialidad.toLowerCase().includes(s) || p.materias.some(m => m.toLowerCase().includes(s)));
    }, [searchProfesor]);

    const getHorarioProfesor = (nombre: string) => {
        return horarioData.map(slot => ({
            ...slot,
            clases: Object.fromEntries(
                dias.map(d => [d.key, slot.clases[d.key]?.profesor === nombre ? slot.clases[d.key] : undefined])
                    .filter(([, v]) => v !== undefined)
            ) as Partial<Record<DiaKey, Clase>>,
        }));
    };

    const getHorarioCurso = (curso: string) => {
        return horarioData.map(slot => ({
            ...slot,
            clases: Object.fromEntries(
                dias.map(d => [d.key, slot.clases[d.key]?.curso === curso ? slot.clases[d.key] : undefined])
                    .filter(([, v]) => v !== undefined)
            ) as Partial<Record<DiaKey, Clase>>,
        }));
    };

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
                                                    <div onClick={() => setShowModal(true)} className="p-2 h-[52px] border border-dashed border-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all group">
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

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Horarios Profesores">
            <Head title="Horarios Profesores" />

            <div className="space-y-5" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Horarios de Profesores</h1>
                        <p className="text-gray-500 text-sm">Administra y visualiza los horarios de clases del colegio</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
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
                        { label: 'Cursos Activos', value: stats.cursosActivos, icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" /></svg>), color: 'from-amber-500 to-amber-600' },
                        { label: 'Slots Libres', value: `${stats.disponibilidad}%`, icon: (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>), color: 'from-purple-500 to-purple-600' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`bg-gradient-to-br ${stat.color} text-white p-1.5 rounded-lg`}>{stat.icon}</span>
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
                                onClick={() => { setVistaActiva(tab.key); setProfesorSeleccionado(''); setCursoSeleccionado(''); }}
                                className={`px-4 py-2 rounded-lg font-medium transition-all text-sm flex items-center gap-2 ${vistaActiva === tab.key ? 'bg-gradient-to-r from-[#293577] to-[#181b49] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M9.75 8.25h.008v.008H9.75V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                            Imprimir
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-100 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
                            Exportar
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
                        {renderHorarioGrid(horarioData)}

                        {/* Leyenda profesores */}
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Leyenda de Profesores</h3>
                            <div className="flex flex-wrap gap-2">
                                {profesores.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => { setVistaActiva('profesor'); setProfesorSeleccionado(p.nombre); }}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${p.colorBg} ${p.colorBorder} border text-xs font-medium ${p.colorText} hover:shadow-sm transition-all`}
                                    >
                                        <div className={`w-2.5 h-2.5 rounded-full bg-${p.color}-400`} />
                                        {p.nombre}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ===== Por Profesor ===== */}
                {vistaActiva === 'profesor' && (
                    <>
                        {/* Búsqueda y selección */}
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800"><SearchIcon className="w-4 h-4" /></span>
                                    <input
                                        type="text"
                                        placeholder="Buscar profesor por nombre, especialidad o materia..."
                                        value={searchProfesor}
                                        onChange={(e) => setSearchProfesor(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all"
                                    />
                                </div>
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
                                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-${p.color}-400 to-${p.color}-600 flex items-center justify-center text-white text-xs font-bold`}>
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
                                {/* Ficha del profesor */}
                                {(() => {
                                    const prof = profesores.find(p => p.nombre === profesorSeleccionado);
                                    if (!prof) return null;
                                    const carga = getCargaLabel(prof.horasSemanales, prof.maxHoras);
                                    return (
                                        <div className={`${prof.colorBg} ${prof.colorBorder} border rounded-xl p-5`}>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br from-${prof.color}-400 to-${prof.color}-600 flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
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
                                                    <div className={`h-2 rounded-full ${carga.bg} transition-all`} style={{ width: `${(prof.horasSemanales / prof.maxHoras) * 100}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                                {renderHorarioGrid(getHorarioProfesor(profesorSeleccionado))}
                            </>
                        ) : (
                            /* Tarjetas de todos los profesores */
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredProfesores.map(profesor => {
                                    const carga = getCargaLabel(profesor.horasSemanales, profesor.maxHoras);
                                    const clasesProfesor = allClases.filter(c => c.profesor === profesor.nombre);
                                    return (
                                        <div key={profesor.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-all overflow-hidden`}>
                                            <div className={`h-1.5 bg-gradient-to-r from-${profesor.color}-400 to-${profesor.color}-600`} />
                                            <div className="p-5">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${profesor.color}-400 to-${profesor.color}-600 flex items-center justify-center text-white font-bold shadow-sm`}>
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
                                                        <div className={`h-1.5 rounded-full ${carga.bg} transition-all`} style={{ width: `${(profesor.horasSemanales / profesor.maxHoras) * 100}%` }} />
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
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 space-y-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Seleccionar curso para ver su horario</p>
                            <div className="flex flex-wrap gap-2">
                                {cursos.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => setCursoSeleccionado(cursoSeleccionado === c.nombre ? '' : c.nombre)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                                            cursoSeleccionado === c.nombre
                                                ? 'bg-gradient-to-r from-[#293577] to-[#181b49] text-white border-transparent shadow-sm'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        {c.nombre}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {cursoSeleccionado ? (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#293577] to-[#181b49] flex items-center justify-center text-white font-bold text-sm">
                                        {cursoSeleccionado.split(' ')[0]}
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold text-gray-700">Horario del curso {cursoSeleccionado}</h2>
                                        <p className="text-xs text-gray-400">
                                            {allClases.filter(c => c.curso === cursoSeleccionado).length} clases programadas ·
                                            {' '}{[...new Set(allClases.filter(c => c.curso === cursoSeleccionado).map(c => c.profesor))].length} profesores
                                        </p>
                                    </div>
                                    <div className="flex-1 h-px bg-gray-200" />
                                </div>
                                {renderHorarioGrid(getHorarioCurso(cursoSeleccionado))}
                            </>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" /></svg>
                                <h3 className="text-lg font-bold text-gray-700 mb-1">Selecciona un curso</h3>
                                <p className="text-sm text-gray-500">Elige un curso de la lista para ver su horario semanal</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Detalle Clase */}
            {claseDetalle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setClaseDetalle(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className={`${getClaseColor(claseDetalle.profesor)} rounded-t-2xl px-6 py-5`}>
                            <h2 className="text-lg font-bold text-gray-800">{claseDetalle.materia}</h2>
                            <p className="text-sm text-gray-600">{claseDetalle.curso}</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                <div className="w-10 h-10 rounded-lg bg-[#293577] text-white flex items-center justify-center font-bold text-sm">
                                    {claseDetalle.profesor.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">{claseDetalle.profesor}</p>
                                    <p className="text-xs text-gray-500">Profesor(a)</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 rounded-xl text-center">
                                    <svg className="w-5 h-5 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 0h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" /></svg>
                                    <p className="text-sm font-bold text-gray-800">{claseDetalle.aula}</p>
                                    <p className="text-[10px] text-gray-500">Aula</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-xl text-center">
                                    <svg className="w-5 h-5 mx-auto text-gray-400 mb-1" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347" /></svg>
                                    <p className="text-sm font-bold text-gray-800">{claseDetalle.curso}</p>
                                    <p className="text-[10px] text-gray-500">Curso</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setClaseDetalle(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                    Cerrar
                                </button>
                                <button className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#293577] to-[#181b49] text-white rounded-xl hover:shadow-lg text-sm font-medium flex items-center justify-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" /></svg>
                                    Editar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detalle Profesor */}
            {profesorDetalle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setProfesorDetalle(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className={`${profesorDetalle.colorBg} ${profesorDetalle.colorBorder} border-b rounded-t-2xl px-6 py-5`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br from-${profesorDetalle.color}-400 to-${profesorDetalle.color}-600 flex items-center justify-center text-white font-bold text-xl shadow-md`}>
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
                                    <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" /></svg>
                                        <span className="text-sm text-gray-600">{profesorDetalle.telefono}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Cursos asignados</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {profesorDetalle.cursos.map((c, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-gray-100 rounded-lg text-xs text-gray-700 font-medium">{c}</span>
                                    ))}
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
                                    <div className={`h-3 rounded-full ${getCargaLabel(profesorDetalle.horasSemanales, profesorDetalle.maxHoras).bg} transition-all`} style={{ width: `${(profesorDetalle.horasSemanales / profesorDetalle.maxHoras) * 100}%` }} />
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

            {/* Modal Asignar Clase */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#181b49] to-[#293577] rounded-t-2xl px-6 py-4">
                            <h2 className="text-lg font-bold text-white">Asignar Clase</h2>
                            <p className="text-blue-200 text-xs">Programa una nueva clase en el horario</p>
                        </div>
                        <form className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Profesor</label>
                                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]">
                                    <option value="">Seleccionar profesor...</option>
                                    {profesores.map(p => (
                                        <option key={p.id} value={p.nombre}>{p.nombre} — {p.especialidad}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
                                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]">
                                    <option value="">Seleccionar materia...</option>
                                    {[...new Set(profesores.flatMap(p => p.materias))].sort().map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]">
                                    <option value="">Seleccionar curso...</option>
                                    {cursos.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Día</label>
                                    <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]">
                                        {dias.map(d => (
                                            <option key={d.key} value={d.key}>{d.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                                    <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]">
                                        {timeSlots.filter(s => !s.esDescanso).map(s => (
                                            <option key={s.hora} value={s.hora}>{s.hora} - {s.horaFin}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Aula</label>
                                <select className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]">
                                    <option value="">Seleccionar aula...</option>
                                    {['A-105', 'A-106', 'A-201', 'A-203', 'A-301', 'A-302', 'A-303', 'A-401', 'A-402', 'B-101', 'Lab-1', 'Lab-2', 'Cancha', 'Auditorio'].map(a => (
                                        <option key={a} value={a}>{a}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                    Cancelar
                                </button>
                                <button type="submit" className="flex-1 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-4 py-2.5 rounded-xl hover:shadow-lg text-sm font-medium">
                                    Asignar Clase
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
