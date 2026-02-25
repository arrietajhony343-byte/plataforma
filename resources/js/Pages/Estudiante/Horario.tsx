import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { estudianteMenuItems } from '@/Config/estudianteMenu';

export default function Horario() {
    const nombre = 'Andrés Felipe Muñoz';

    const horas = [
        { inicio: '7:00', fin: '7:50' },
        { inicio: '7:50', fin: '8:40' },
        { inicio: '8:40', fin: '9:30' },
        { inicio: '9:30', fin: '10:00', descanso: true },
        { inicio: '10:00', fin: '10:50' },
        { inicio: '10:50', fin: '11:40' },
    ];

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

    type ClaseData = { materia: string; profesor: string; salon: string; color: string } | null;
    const horario: Record<string, ClaseData[]> = {
        'Lunes': [
            { materia: 'Matemáticas', profesor: 'M. García', salon: '301', color: 'bg-blue-50 border-blue-200 text-blue-800' },
            { materia: 'Español', profesor: 'J. Pérez', salon: '301', color: 'bg-amber-50 border-amber-200 text-amber-800' },
            { materia: 'Inglés', profesor: 'A. Martínez', salon: '305', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
            null,
            { materia: 'Ciencias', profesor: 'P. Sánchez', salon: 'Lab 1', color: 'bg-green-50 border-green-200 text-green-800' },
            { materia: 'Historia', profesor: 'C. López', salon: '301', color: 'bg-purple-50 border-purple-200 text-purple-800' },
        ],
        'Martes': [
            { materia: 'Química', profesor: 'R. Gómez', salon: 'Lab 2', color: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
            { materia: 'Matemáticas', profesor: 'M. García', salon: '301', color: 'bg-blue-50 border-blue-200 text-blue-800' },
            { materia: 'Ed. Física', profesor: 'P. Sánchez', salon: 'Cancha', color: 'bg-orange-50 border-orange-200 text-orange-800' },
            null,
            { materia: 'Español', profesor: 'J. Pérez', salon: '301', color: 'bg-amber-50 border-amber-200 text-amber-800' },
            { materia: 'Artes', profesor: 'S. Vega', salon: 'Taller', color: 'bg-pink-50 border-pink-200 text-pink-800' },
        ],
        'Miércoles': [
            { materia: 'Inglés', profesor: 'A. Martínez', salon: '305', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
            { materia: 'Ciencias', profesor: 'P. Sánchez', salon: 'Lab 1', color: 'bg-green-50 border-green-200 text-green-800' },
            { materia: 'Matemáticas', profesor: 'M. García', salon: '301', color: 'bg-blue-50 border-blue-200 text-blue-800' },
            null,
            { materia: 'Química', profesor: 'R. Gómez', salon: 'Lab 2', color: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
            { materia: 'Historia', profesor: 'C. López', salon: '301', color: 'bg-purple-50 border-purple-200 text-purple-800' },
        ],
        'Jueves': [
            { materia: 'Español', profesor: 'J. Pérez', salon: '301', color: 'bg-amber-50 border-amber-200 text-amber-800' },
            { materia: 'Química', profesor: 'R. Gómez', salon: 'Lab 2', color: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
            { materia: 'Artes', profesor: 'S. Vega', salon: 'Taller', color: 'bg-pink-50 border-pink-200 text-pink-800' },
            null,
            { materia: 'Inglés', profesor: 'A. Martínez', salon: '305', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
            { materia: 'Matemáticas', profesor: 'M. García', salon: '301', color: 'bg-blue-50 border-blue-200 text-blue-800' },
        ],
        'Viernes': [
            { materia: 'Ciencias', profesor: 'P. Sánchez', salon: 'Lab 1', color: 'bg-green-50 border-green-200 text-green-800' },
            { materia: 'Inglés', profesor: 'A. Martínez', salon: '305', color: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
            { materia: 'Ed. Física', profesor: 'P. Sánchez', salon: 'Cancha', color: 'bg-orange-50 border-orange-200 text-orange-800' },
            null,
            { materia: 'Español', profesor: 'J. Pérez', salon: '301', color: 'bg-amber-50 border-amber-200 text-amber-800' },
            { materia: 'Matemáticas', profesor: 'M. García', salon: '301', color: 'bg-blue-50 border-blue-200 text-blue-800' },
        ],
    };

    const hoy = new Date();
    const diaHoy = dias[hoy.getDay() - 1] || '';

    return (
        <SidebarLayout menuItems={estudianteMenuItems} userInfo={{ name: nombre, role: 'Estudiante' }}>
            <Head title="Mi Horario" />

            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>Mi Horario</h1>
                <p className="text-gray-500 mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Grado 8° A — Jornada Mañana — Periodo 1, 2026</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                        <thead>
                            <tr className="bg-gradient-to-r from-[#181b49] to-[#293577] text-white">
                                <th className="px-3 py-3 text-xs font-bold text-left w-20">HORA</th>
                                {dias.map(d => (
                                    <th key={d} className={`px-3 py-3 text-xs font-bold text-center ${d === diaHoy ? 'bg-white/10' : ''}`}>
                                        {d.toUpperCase()}
                                        {d === diaHoy && <span className="block text-[9px] font-normal text-amber-300">HOY</span>}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {horas.map((h, idx) => (
                                <tr key={idx} className={h.descanso ? 'bg-amber-50/50' : 'hover:bg-gray-50/50'}>
                                    <td className="px-3 py-2 text-xs text-gray-500 font-mono border-r border-gray-100">
                                        {h.inicio}<br /><span className="text-[10px] text-gray-400">{h.fin}</span>
                                    </td>
                                    {h.descanso ? (
                                        <td colSpan={5} className="text-center py-3">
                                            <span className="text-sm font-semibold text-amber-600">☕ DESCANSO</span>
                                        </td>
                                    ) : (
                                        dias.map(d => {
                                            const clase = horario[d]?.[idx];
                                            return (
                                                <td key={d} className={`px-1.5 py-1.5 border-r border-gray-50 ${d === diaHoy ? 'bg-blue-50/20' : ''}`}>
                                                    {clase ? (
                                                        <div className={`rounded-lg border p-2 ${clase.color} transition-all hover:shadow-sm`}>
                                                            <p className="text-xs font-bold truncate">{clase.materia}</p>
                                                            <p className="text-[10px] opacity-70">{clase.salon}</p>
                                                            <p className="text-[10px] opacity-60">{clase.profesor}</p>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full min-h-[50px]"></div>
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

            {/* Leyenda */}
            <div className="mt-4 bg-white rounded-xl border border-gray-100 p-4">
                <h3 className="text-sm font-bold text-gray-800 mb-3">Leyenda de Materias</h3>
                <div className="flex flex-wrap gap-2">
                    {[
                        { n: 'Matemáticas', c: 'bg-blue-100 text-blue-700' }, { n: 'Español', c: 'bg-amber-100 text-amber-700' },
                        { n: 'Ciencias', c: 'bg-green-100 text-green-700' }, { n: 'Historia', c: 'bg-purple-100 text-purple-700' },
                        { n: 'Inglés', c: 'bg-indigo-100 text-indigo-700' }, { n: 'Química', c: 'bg-cyan-100 text-cyan-700' },
                        { n: 'Ed. Física', c: 'bg-orange-100 text-orange-700' }, { n: 'Artes', c: 'bg-pink-100 text-pink-700' },
                    ].map(m => (
                        <span key={m.n} className={`text-xs font-semibold px-3 py-1 rounded-full ${m.c}`}>{m.n}</span>
                    ))}
                </div>
            </div>
        </SidebarLayout>
    );
}
