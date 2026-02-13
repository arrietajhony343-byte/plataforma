import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
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
    return (
        <SidebarLayout menuItems={adminMenuItems} header="Panel de Administración - Resumen del Periodo 1">
            <Head title="Dashboard Admin" />

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#dbeafe' }}>
                        <svg className="w-8 h-8" style={{ color: '#073f65' }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Total Estudiantes</p>
                        <p className="text-3xl font-bold" style={{ color: '#073f65' }}>{stats.totalEstudiantes}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#fef3c7' }}>
                        <svg className="w-8 h-8" style={{ color: '#d97706' }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Total Profesores</p>
                        <p className="text-3xl font-bold" style={{ color: '#d97706' }}>{stats.totalProfesores}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#dcfce7' }}>
                        <svg className="w-8 h-8" style={{ color: '#185929' }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3z"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Cursos Activos</p>
                        <p className="text-3xl font-bold" style={{ color: '#185929' }}>{stats.cursosActivos}</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#fce7f3' }}>
                        <svg className="w-8 h-8" style={{ color: '#891248' }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
                        </svg>
                    </div>
                    <div>
                        <p className="text-gray-500 text-sm">Días Restantes del Periodo</p>
                        <p className="text-3xl font-bold" style={{ color: '#891248' }}>{stats.diasRestantes}</p>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
                <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    <span className="hidden xs:inline">Crear Nuevo</span> Usuario
                </button>
                <button className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 sm:px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                    <span className="hidden xs:inline">Crear Nuevo</span> Curso
                </button>
            </div>

            {/* Activity Table */}
            <div className="bg-white rounded-xl shadow-sm">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Actividad Reciente</h2>
                </div>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {actividadReciente.map((item, index) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </SidebarLayout>
    );
}
