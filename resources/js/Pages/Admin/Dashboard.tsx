import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, Link } from '@inertiajs/react';
import { adminMenuItems } from '@/Config/adminMenu';

interface Stats {
    totalEstudiantes: number;
    totalProfesores: number;
    cursosActivos: number;
    diasRestantes: number;
}

interface Actividad {
    name: string;
    description: string;
    time: string;
}

interface Props {
    stats: Stats;
    actividadReciente: Actividad[];
}

export default function Dashboard({ stats, actividadReciente }: Props) {
    const statCards = [
        {
            label: 'Total Estudiantes',
            value: stats.totalEstudiantes,
            image: '/storage/total-estudiantes.png',
            href: '/admin/estudiantes',
        },
        {
            label: 'Cursos Activos',
            value: stats.cursosActivos,
            image: '/storage/cursos-activos.png',
            href: '/admin/cursos',
        },
        {
            label: 'Profesores',
            value: stats.totalProfesores,
            image: '/storage/profesores.png',
            href: '/admin/usuarios',
        },
        {
            label: 'Calendario',
            value: `${stats.diasRestantes} días`,
            image: '/storage/calendario.png',
            href: '/admin/periodos',
        },
    ];

    return (
        <SidebarLayout menuItems={adminMenuItems}>
            <Head title="Dashboard Admin" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Banner Header con gradiente */}
                <div
                    className="rounded-xl p-5 sm:p-6 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #181b49 0%, #293577 50%, #171f54 100%)' }}
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}>
                                Panel Administrativo
                            </h1>
                            <p className="text-blue-200 text-sm mt-1">Resumen general del periodo académico</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 bg-white bg-opacity-15 hover:bg-opacity-25 text-white border border-white border-opacity-30 px-4 py-2 rounded-lg transition-all text-sm font-medium backdrop-blur-sm">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                </svg>
                                Usuario
                            </button>
                            <button className="flex items-center gap-2 bg-white bg-opacity-15 hover:bg-opacity-25 text-white border border-white border-opacity-30 px-4 py-2 rounded-lg transition-all text-sm font-medium backdrop-blur-sm">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                                </svg>
                                Curso
                            </button>
                        </div>
                    </div>
                </div>

                {/* Shield Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {statCards.map((card, index) => (
                        <Link
                            key={index}
                            href={card.href}
                            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 p-4 sm:p-6 flex flex-col items-center text-center border border-gray-100 hover:border-opacity-0 hover:-translate-y-1"
                        >
                            {/* Shield image */}
                            <div className="w-20 h-20 sm:w-28 sm:h-28 mb-3 sm:mb-4 transition-transform duration-300 group-hover:scale-110">
                                <img
                                    src={card.image}
                                    alt={card.label}
                                    className="w-full h-full object-contain drop-shadow-lg"
                                />
                            </div>
                            {/* Value */}
                            <p className="text-2xl sm:text-3xl font-extrabold text-gray-800 leading-none" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800 }}>
                                {card.value}
                            </p>
                            {/* Label */}
                            <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1 uppercase tracking-wider">
                                {card.label}
                            </p>
                        </Link>
                    ))}
                </div>

                {/* Activity Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div
                        className="px-5 sm:px-6 py-4"
                        style={{ background: 'linear-gradient(90deg, #181b49 0%, #293577 50%, #171f54 100%)' }}
                    >
                        <h2 className="text-base sm:text-lg font-bold text-white tracking-wide" style={{ fontFamily: "'Inter', sans-serif" }}>Actividad Reciente</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200" style={{ backgroundColor: '#f0f1f8' }}>
                                    <th className="px-5 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#181b49' }}>Nombre</th>
                                    <th className="px-5 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#181b49' }}>Descripción</th>
                                    <th className="px-5 sm:px-6 py-3 text-left text-xs font-bold uppercase tracking-wider" style={{ color: '#181b49' }}>Hora</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {actividadReciente.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-5 sm:px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                                        <td className="px-5 sm:px-6 py-4 text-sm text-gray-600">{item.description}</td>
                                        <td className="px-5 sm:px-6 py-4 text-sm text-gray-500 font-mono">{item.time}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
