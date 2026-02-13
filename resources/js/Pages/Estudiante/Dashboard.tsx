import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';

interface Props {
    estudiante: {
        nombre: string;
        grado?: string;
    };
    notas?: Array<{
        materia: string;
        promedio: number;
        color: string;
    }>;
    observaciones?: Array<{
        id: number;
        fecha: string;
        materia: string;
        tipo: 'positiva' | 'negativa';
        descripcion: string;
    }>;
}

export default function Dashboard({ estudiante, notas, observaciones }: Props) {
    // Datos mock
    const notasMock = notas || [
        { materia: 'Matemáticas', promedio: 4.5, color: 'green' },
        { materia: 'Español', promedio: 3.8, color: 'yellow' },
        { materia: 'Ciencias', promedio: 4.2, color: 'green' },
    ];

    const observacionesMock = observaciones || [
        { 
            id: 1, 
            fecha: '12/Oct', 
            materia: 'Matemáticas', 
            tipo: 'positiva' as const, 
            descripcion: 'Excelente trabajo en grupo hoy.' 
        },
    ];

    const menuItems = [
        { 
            name: 'Mi Resumen', 
            href: '/estudiante/dashboard', 
            icon: <svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>,
            active: true,
        },
        { 
            name: 'Boletines', 
            href: '/estudiante/boletines', 
            icon: <svg fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>,
        },
        { 
            name: 'Perfil Histórico', 
            href: '/estudiante/perfil', 
            icon: <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>,
        },
    ];

    const getPromedioColor = (promedio: number) => {
        if (promedio >= 4.0) return 'bg-green-500';
        if (promedio >= 3.0) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getPromedioWidth = (promedio: number) => {
        return `${(promedio / 5) * 100}%`;
    };

    return (
        <SidebarLayout 
            menuItems={menuItems} 
            userInfo={{ name: estudiante?.nombre || 'Estudiante', role: 'Estudiante' }}
        >
            <Head title="Panel del Estudiante" />

            <h1 className="text-2xl font-bold text-gray-800 mb-6">Panel del Estudiante</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna izquierda - Info del estudiante y notas */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Bienvenida */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            Bienvenido, {estudiante?.nombre || 'Estudiante'}
                        </h2>
                        <p className="text-gray-600">(Grado {estudiante?.grado || '6A'})</p>
                    </div>

                    {/* Resumen de Notas */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <h3 className="font-bold text-gray-800 mb-4">Resumen de Notas Actuales</h3>
                        <div className="space-y-4">
                            {notasMock.map((nota, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-gray-700">
                                            <span className={`inline-block w-2 h-2 rounded-full mr-2 ${getPromedioColor(nota.promedio)}`}></span>
                                            {nota.materia}: {nota.promedio.toFixed(1)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3">
                                        <div 
                                            className={`h-3 rounded-full ${getPromedioColor(nota.promedio)}`}
                                            style={{ width: getPromedioWidth(nota.promedio) }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Columna derecha */}
                <div className="space-y-6">
                    {/* Últimas Observaciones */}
                    <div className="bg-white rounded-xl shadow p-6">
                        <h3 className="font-bold text-gray-800 mb-4">Últimas Observaciones</h3>
                        {observacionesMock.map((obs) => (
                            <div key={obs.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                <span className={`mt-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-xs ${
                                    obs.tipo === 'positiva' ? 'bg-green-500' : 'bg-red-500'
                                }`}>
                                    {obs.tipo === 'positiva' ? '✓' : '!'}
                                </span>
                                <div>
                                    <p className="text-sm text-gray-800">
                                        <span className="font-medium">{obs.fecha}</span> - {obs.materia} ({obs.tipo === 'positiva' ? 'Positiva' : 'Negativa'}):
                                    </p>
                                    <p className="text-sm text-gray-600 italic">"{obs.descripcion}"</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Botón descargar boletín */}
                    <button className="w-full bg-[#293577] text-white py-3 px-4 rounded-lg hover:bg-[#181b49] transition-colors font-semibold flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                        </svg>
                        Descargar Boletín del Periodo Anterior (PDF)
                    </button>
                </div>
            </div>
        </SidebarLayout>
    );
}
