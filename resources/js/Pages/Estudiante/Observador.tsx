import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { estudianteMenuItems } from '@/Config/estudianteMenu';

export default function Observador() {
    const nombre = 'Andrés Felipe Muñoz';
    const [filtroTipo, setFiltroTipo] = useState('todos');

    const observaciones = [
        { id: 1, fecha: '20 Feb 2026', materia: 'Matemáticas', profesor: 'María García', tipo: 'positiva', descripcion: 'Excelente participación en clase. Resolvió el ejercicio de ecuaciones de manera creativa y ayudó a sus compañeros.', categoria: 'Participación' },
        { id: 2, fecha: '18 Feb 2026', materia: 'Español', profesor: 'Juan Pérez', tipo: 'positiva', descripcion: 'Buen trabajo en la presentación oral sobre poesía colombiana. Mostró dominio del tema.', categoria: 'Desempeño Académico' },
        { id: 3, fecha: '15 Feb 2026', materia: 'Historia', profesor: 'Carlos López', tipo: 'negativa', descripcion: 'No entregó la línea de tiempo asignada en la fecha acordada.', categoria: 'Incumplimiento' },
        { id: 4, fecha: '12 Feb 2026', materia: 'Inglés', profesor: 'Ana Martínez', tipo: 'positiva', descripcion: 'Outstanding performance in the speaking test. Best pronunciation in the class.', categoria: 'Desempeño Académico' },
        { id: 5, fecha: '10 Feb 2026', materia: 'Ciencias', profesor: 'Pedro Sánchez', tipo: 'positiva', descripcion: 'Excelente trabajo en el proyecto de la maqueta. Creatividad y precisión en los detalles.', categoria: 'Creatividad' },
        { id: 6, fecha: '08 Feb 2026', materia: 'Química', profesor: 'Roberto Gómez', tipo: 'negativa', descripcion: 'Bajo rendimiento en el taller de balanceo de ecuaciones. Requiere refuerzo adicional.', categoria: 'Desempeño Académico' },
        { id: 7, fecha: '05 Feb 2026', materia: 'Ed. Física', profesor: 'Pedro Sánchez', tipo: 'positiva', descripcion: 'Mejor tiempo de la clase en la prueba de resistencia. Gran actitud deportiva.', categoria: 'Desempeño Físico' },
        { id: 8, fecha: '03 Feb 2026', materia: 'General', profesor: 'Coordinación', tipo: 'positiva', descripcion: 'Reconocimiento por buen comportamiento y compañerismo durante el periodo.', categoria: 'Convivencia' },
    ];

    const filtradas = filtroTipo === 'todos' ? observaciones : observaciones.filter(o => o.tipo === filtroTipo);

    const positivas = observaciones.filter(o => o.tipo === 'positiva').length;
    const negativas = observaciones.filter(o => o.tipo === 'negativa').length;

    return (
        <SidebarLayout menuItems={estudianteMenuItems} userInfo={{ name: nombre, role: 'Estudiante' }}>
            <Head title="Mi Observador" />

            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>Mi Observador</h1>
                <p className="text-gray-500 mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Registro de observaciones académicas y de convivencia</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-2xl font-extrabold text-gray-800">{observaciones.length}</p>
                    <p className="text-xs text-gray-400">Total</p>
                </div>
                <div className="bg-white rounded-xl border border-green-100 p-4 text-center">
                    <p className="text-2xl font-extrabold text-green-600">{positivas}</p>
                    <p className="text-xs text-gray-400">Positivas</p>
                </div>
                <div className="bg-white rounded-xl border border-red-100 p-4 text-center">
                    <p className="text-2xl font-extrabold text-red-600">{negativas}</p>
                    <p className="text-xs text-gray-400">Negativas</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-2 mb-5">
                {[{ key: 'todos', label: 'Todas' }, { key: 'positiva', label: 'Positivas' }, { key: 'negativa', label: 'Negativas' }].map(f => (
                    <button key={f.key} onClick={() => setFiltroTipo(f.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${filtroTipo === f.key ? 'bg-[#293577] text-white shadow' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Lista */}
            <div className="space-y-3">
                {filtradas.map(obs => (
                    <div key={obs.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${obs.tipo === 'positiva' ? 'border-green-100' : 'border-red-100'}`}>
                        <div className={`px-4 py-3 flex items-start gap-3 ${obs.tipo === 'positiva' ? 'bg-green-50/30' : 'bg-red-50/30'}`}>
                            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5 ${obs.tipo === 'positiva' ? 'bg-green-500' : 'bg-red-500'}`}>
                                {obs.tipo === 'positiva' ? '✓' : '!'}
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="text-sm font-bold text-gray-900">{obs.materia}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${obs.tipo === 'positiva' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {obs.tipo}
                                    </span>
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{obs.categoria}</span>
                                </div>
                                <p className="text-sm text-gray-600 italic">"{obs.descripcion}"</p>
                                <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                                    <span>{obs.profesor}</span>
                                    <span>{obs.fecha}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </SidebarLayout>
    );
}
