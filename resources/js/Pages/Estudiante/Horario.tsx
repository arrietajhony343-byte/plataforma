import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { estudianteMenuItems } from '@/Config/estudianteMenu';

interface HoraItem {
    inicio: string;
    fin: string;
}

interface BloqueItem {
    dia: string;
    hora_inicio: string;
    hora_fin: string;
    materia: string;
    profesor: string;
    salon: string;
    color: string;
}

interface Props {
    estudiante: {
        nombre: string;
    };
    disponible: boolean;
    curso: {
        nombre: string;
        jornada: string | null;
        anio: number;
    } | null;
    dias: string[];
    horas: HoraItem[];
    bloques: BloqueItem[];
}

export default function Horario({ estudiante, disponible, curso, dias, horas, bloques }: Props) {
    const nombre = estudiante?.nombre || 'Estudiante';
    const diaMap = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    const hoy = new Date();
    const diaHoy = diaMap[hoy.getDay()] || '';

    const buscarBloque = (dia: string, inicio: string) =>
        bloques.find((b) => b.dia === dia && b.hora_inicio === inicio) ?? null;

    const leyenda = Array.from(new Map(bloques.map((b) => [b.materia, b.color])).entries()).map(([n, c]) => ({ n, c }));

    return (
        <SidebarLayout menuItems={estudianteMenuItems} userInfo={{ name: nombre, role: 'Estudiante' }}>
            <Head title="Mi Horario" />

            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>Mi Horario</h1>
                <p className="text-gray-500 mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                    {curso
                        ? `${curso.nombre} - Jornada ${curso.jornada || 'No definida'} - ${curso.anio}`
                        : 'Horario academico del estudiante'}
                </p>
            </div>

            {!disponible ? (
                <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                    <p className="text-gray-700 font-semibold">Tu horario aun no ha sido generado.</p>
                    <p className="text-gray-400 text-sm mt-1">Cuando administracion publique los bloques de clase de tu curso, aparecera aqui.</p>
                </div>
            ) : (
                <>

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
                                <tr key={idx} className="hover:bg-gray-50/50">
                                    <td className="px-3 py-2 text-xs text-gray-500 font-mono border-r border-gray-100">
                                        {h.inicio}<br /><span className="text-[10px] text-gray-400">{h.fin}</span>
                                    </td>
                                    {dias.map(d => {
                                        const clase = buscarBloque(d, h.inicio);
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
                                    })}
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
                    {leyenda.map(m => (
                        <span key={m.n} className={`text-xs font-semibold px-3 py-1 rounded-full ${m.c}`}>{m.n}</span>
                    ))}
                </div>
            </div>
                </>
            )}
        </SidebarLayout>
    );
}
