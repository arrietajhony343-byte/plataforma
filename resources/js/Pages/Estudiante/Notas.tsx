import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { estudianteMenuItems } from '@/Config/estudianteMenu';

export default function Notas() {
    const nombre = 'Andrés Felipe Muñoz';
    const [periodoActivo, setPeriodoActivo] = useState('1');

    const materias = [
        {
            nombre: 'Matemáticas', icono: 'Ma', profesor: 'María García',
            notas: {
                '1': [{ actividad: 'Tarea: Funciones lineales', tipo: 'Tarea', peso: 10, nota: 4.8 }, { actividad: 'Examen parcial - Álgebra', tipo: 'Examen', peso: 30, nota: 4.2 }, { actividad: 'Taller ecuaciones', tipo: 'Taller', peso: 15, nota: null }, { actividad: 'Quiz factorización', tipo: 'Quiz', peso: 20, nota: null }],
            },
            promedio: 4.5, promedioFinal: null
        },
        {
            nombre: 'Español', icono: 'Es', profesor: 'Juan Pérez',
            notas: {
                '1': [{ actividad: 'Control lectura Cap. 1-5', tipo: 'Evaluación', peso: 15, nota: 3.5 }, { actividad: 'Ensayo: Cien Años', tipo: 'Ensayo', peso: 20, nota: null }, { actividad: 'Exposición poesía', tipo: 'Exposición', peso: 15, nota: null }],
            },
            promedio: 3.8, promedioFinal: null
        },
        {
            nombre: 'Ciencias Naturales', icono: 'CN', profesor: 'Pedro Sánchez',
            notas: {
                '1': [{ actividad: 'Maqueta sistema digestivo', tipo: 'Proyecto', peso: 20, nota: 4.5 }, { actividad: 'Informe lab. #3', tipo: 'Informe', peso: 15, nota: null }],
            },
            promedio: 4.2, promedioFinal: null
        },
        {
            nombre: 'Historia', icono: 'Hi', profesor: 'Carlos López',
            notas: {
                '1': [{ actividad: 'Línea de tiempo', tipo: 'Proyecto', peso: 15, nota: null }, { actividad: 'Ensayo: Constitución', tipo: 'Ensayo', peso: 20, nota: null }],
            },
            promedio: 3.5, promedioFinal: null
        },
        {
            nombre: 'Inglés', icono: 'In', profesor: 'Ana Martínez',
            notas: {
                '1': [{ actividad: 'Speaking Test', tipo: 'Evaluación', peso: 25, nota: 4.9 }, { actividad: 'Present Perfect WS', tipo: 'Tarea', peso: 10, nota: null }, { actividad: 'Reading: Short Story', tipo: 'Tarea', peso: 10, nota: null }],
            },
            promedio: 4.7, promedioFinal: null
        },
        {
            nombre: 'Química', icono: 'Qu', profesor: 'Roberto Gómez',
            notas: {
                '1': [{ actividad: 'Taller balanceo', tipo: 'Taller', peso: 15, nota: 2.8 }, { actividad: 'Práctica reacciones', tipo: 'Lab', peso: 20, nota: null }],
            },
            promedio: 3.2, promedioFinal: null
        },
        {
            nombre: 'Ed. Física', icono: 'EF', profesor: 'Pedro Sánchez',
            notas: {
                '1': [{ actividad: 'Test de resistencia', tipo: 'Evaluación', peso: 25, nota: 5.0 }],
            },
            promedio: 4.8, promedioFinal: null
        },
        {
            nombre: 'Artes', icono: 'Ar', profesor: 'Sandra Vega',
            notas: {
                '1': [{ actividad: 'Bocetos semanales', tipo: 'Tarea', peso: 10, nota: 4.5 }, { actividad: 'Proyecto autorretrato', tipo: 'Proyecto', peso: 30, nota: null }],
            },
            promedio: 4.6, promedioFinal: null
        },
    ];

    const promedioGeneral = (materias.reduce((a, m) => a + m.promedio, 0) / materias.length).toFixed(1);

    const getNotaColor = (n: number | null) => {
        if (n === null) return 'text-gray-300';
        if (n >= 4.0) return 'text-green-600';
        if (n >= 3.0) return 'text-amber-600';
        return 'text-red-600';
    };

    const getNotaBg = (n: number | null) => {
        if (n === null) return 'bg-gray-50';
        if (n >= 4.0) return 'bg-green-50';
        if (n >= 3.0) return 'bg-amber-50';
        return 'bg-red-50';
    };

    return (
        <SidebarLayout menuItems={estudianteMenuItems} userInfo={{ name: nombre, role: 'Estudiante' }}>
            <Head title="Mis Notas" />

            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>Mis Notas</h1>
                <p className="text-gray-500 mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Seguimiento detallado de calificaciones</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-xs text-gray-400">Promedio General</p>
                    <p className={`text-3xl font-extrabold ${getNotaColor(Number(promedioGeneral))}`}>{promedioGeneral}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-xs text-gray-400">Mejor Materia</p>
                    <p className="text-sm font-bold text-green-600">Ed. Física (4.8)</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-xs text-gray-400">Necesita Mejorar</p>
                    <p className="text-sm font-bold text-red-600">Química (3.2)</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-xs text-gray-400">Periodo Actual</p>
                    <p className="text-lg font-bold text-gray-800">1er Periodo</p>
                </div>
            </div>

            {/* Periodo selector */}
            <div className="flex gap-2 mb-5">
                {['1', '2', '3'].map(p => (
                    <button key={p} onClick={() => setPeriodoActivo(p)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${periodoActivo === p ? 'bg-[#293577] text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        {p}er Periodo {p === '1' ? '(Actual)' : ''}
                    </button>
                ))}
            </div>

            {/* Tabla de notas por materia */}
            <div className="space-y-4">
                {materias.map((m, idx) => (
                    <div key={idx} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">{m.icono}</span>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">{m.nombre}</h3>
                                    <p className="text-[11px] text-gray-400">{m.profesor}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-xl font-extrabold ${getNotaColor(m.promedio)}`}>{m.promedio}</p>
                                <p className="text-[10px] text-gray-400">Acumulado</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Actividad</th>
                                        <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 w-20">Tipo</th>
                                        <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 w-16">Peso</th>
                                        <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 w-16">Nota</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {(m.notas as any)['1']?.map((n: any, i: number) => (
                                        <tr key={i} className={`${getNotaBg(n.nota)} hover:bg-gray-50 transition-colors`}>
                                            <td className="px-4 py-2 text-gray-700">{n.actividad}</td>
                                            <td className="text-center px-2 py-2">
                                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{n.tipo}</span>
                                            </td>
                                            <td className="text-center px-2 py-2 text-gray-500">{n.peso}%</td>
                                            <td className="text-center px-2 py-2">
                                                <span className={`font-extrabold ${getNotaColor(n.nota)}`}>
                                                    {n.nota !== null ? n.nota : '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </SidebarLayout>
    );
}
