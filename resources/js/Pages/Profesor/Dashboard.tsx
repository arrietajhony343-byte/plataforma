import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';

interface Curso {
    id: number;
    nombre: string;
    grado: string;
    estudiantes: number;
    color: string;
}

interface Alerta {
    id: number;
    estudiante: string;
    curso: string;
    mensaje: string;
    tipo: 'warning' | 'danger';
}

interface Props {
    profesor: {
        nombre: string;
    };
    cursosAsignados: Curso[];
    alertas: Alerta[];
}

// Iconos
const CoursesIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
    </svg>
);

const GradesIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
    </svg>
);

const ObservationsIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
    </svg>
);

const CalendarIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
    </svg>
);

export default function Dashboard({ profesor, cursosAsignados, alertas }: Props) {
    const menuItems = [
        { name: 'Mis Cursos', href: '/profesor/dashboard', icon: <CoursesIcon />, active: true },
        { name: 'Registrar Notas', href: '/profesor/notas', icon: <GradesIcon /> },
        { name: 'Observador Académico', href: '/profesor/observador', icon: <ObservationsIcon /> },
        { name: 'Mi Calendario', href: '/profesor/calendario', icon: <CalendarIcon /> },
    ];

    const userInfo = {
        name: profesor.nombre,
        role: 'Profesor',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    };

    const getColorClasses = (color: string) => {
        const colors: Record<string, { bg: string; border: string; icon: string }> = {
            blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600' },
            green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-600' },
            red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-600' },
            yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-600' },
        };
        return colors[color] || colors.blue;
    };

    return (
        <SidebarLayout menuItems={menuItems} userInfo={userInfo}>
            <Head title="Dashboard Profesor" />

            {/* Greeting */}
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Hola, {profesor.nombre}.
            </h1>

            {/* Mis Cursos Asignados */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Mis Cursos Asignados</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {cursosAsignados.map((curso) => {
                        const colorClasses = getColorClasses(curso.color);
                        return (
                            <div 
                                key={curso.id} 
                                className={`bg-white rounded-xl shadow-sm border ${colorClasses.border} overflow-hidden`}
                            >
                                <div className={`${colorClasses.bg} p-4 flex items-center gap-4`}>
                                    <div className={`w-12 h-12 bg-white rounded-lg flex items-center justify-center ${colorClasses.icon}`}>
                                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{curso.nombre} - {curso.grado}</h3>
                                        <p className="text-sm text-gray-600">{curso.estudiantes} Estudiantes</p>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <button className="w-full bg-[#293577] text-white py-2 px-4 rounded-lg hover:bg-[#181b49] transition-colors font-medium">
                                        Ir al curso
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Alertas Recientes */}
            <div className="bg-white rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Alertas Recientes</h2>
                </div>
                <div className="p-4 space-y-3">
                    {alertas.map((alerta) => (
                        <div 
                            key={alerta.id}
                            className={`flex items-start gap-3 p-4 rounded-lg ${
                                alerta.tipo === 'danger' ? 'bg-red-50' : 'bg-yellow-50'
                            }`}
                        >
                            <div className={`flex-shrink-0 w-6 h-6 ${
                                alerta.tipo === 'danger' ? 'text-red-500' : 'text-yellow-500'
                            }`}>
                                <svg fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                                </svg>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-800">
                                    {alerta.estudiante} ({alerta.curso})
                                </span>
                                <span className="text-gray-600"> - {alerta.mensaje}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </SidebarLayout>
    );
}
