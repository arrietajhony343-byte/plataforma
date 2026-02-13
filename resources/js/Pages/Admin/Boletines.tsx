import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

interface Boletin {
    id: number;
    estudiante: string;
    grado: string;
    periodo: string;
    promedio: number;
    estado: 'generado' | 'pendiente' | 'enviado';
    fecha_generacion: string | null;
}

export default function Boletines() {
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('2');
    const [cursoSeleccionado, setCursoSeleccionado] = useState('todos');
    const [vistaActiva, setVistaActiva] = useState<'boletines' | 'notas'>('boletines');

    const boletines: Boletin[] = [
        { id: 1, estudiante: 'Juan Pérez', grado: '6° A', periodo: '2do', promedio: 4.2, estado: 'generado', fecha_generacion: '2026-02-01' },
        { id: 2, estudiante: 'María García', grado: '6° A', periodo: '2do', promedio: 4.5, estado: 'enviado', fecha_generacion: '2026-02-01' },
        { id: 3, estudiante: 'Carlos López', grado: '6° A', periodo: '2do', promedio: 3.8, estado: 'pendiente', fecha_generacion: null },
        { id: 4, estudiante: 'Ana Martínez', grado: '7° B', periodo: '2do', promedio: 4.0, estado: 'generado', fecha_generacion: '2026-02-02' },
        { id: 5, estudiante: 'Pedro Sánchez', grado: '7° B', periodo: '2do', promedio: 3.5, estado: 'pendiente', fecha_generacion: null },
    ];

    const resumenNotas = [
        { curso: '6° A', promedio: 4.1, aprobados: 28, reprobados: 2, mejorMateria: 'Ciencias', peorMateria: 'Matemáticas' },
        { curso: '6° B', promedio: 3.9, aprobados: 26, reprobados: 4, mejorMateria: 'Historia', peorMateria: 'Inglés' },
        { curso: '7° A', promedio: 4.0, aprobados: 25, reprobados: 3, mejorMateria: 'Español', peorMateria: 'Física' },
        { curso: '7° B', promedio: 3.7, aprobados: 24, reprobados: 4, mejorMateria: 'Biología', peorMateria: 'Química' },
    ];

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'generado': return 'bg-green-100 text-green-800';
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'enviado': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPromedioColor = (promedio: number) => {
        if (promedio >= 4.0) return 'text-green-600';
        if (promedio >= 3.0) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Boletines & Notas">
            <Head title="Boletines & Notas" />

            <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">📋 Boletines & Notas</h1>
                        <p className="text-gray-600 text-sm sm:text-base">Gestiona boletines y visualiza información de notas</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                            📥 Exportar Todo
                        </button>
                        <button className="flex items-center gap-2 bg-[#293577] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#181b49] text-sm">
                            🔄 Generar Masivo
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm p-1 inline-flex">
                    <button
                        onClick={() => setVistaActiva('boletines')}
                        className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm ${vistaActiva === 'boletines' ? 'bg-[#293577] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        📄 Boletines
                    </button>
                    <button
                        onClick={() => setVistaActiva('notas')}
                        className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm ${vistaActiva === 'notas' ? 'bg-[#293577] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        📊 Resumen Notas
                    </button>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 flex flex-col sm:flex-row gap-3">
                        <select
                            value={periodoSeleccionado}
                            onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="1">1er Periodo</option>
                            <option value="2">2do Periodo</option>
                            <option value="3">3er Periodo</option>
                            <option value="4">4to Periodo</option>
                        </select>
                        <select
                            value={cursoSeleccionado}
                            onChange={(e) => setCursoSeleccionado(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="todos">Todos los cursos</option>
                            <option value="6a">6° A</option>
                            <option value="6b">6° B</option>
                            <option value="7a">7° A</option>
                            <option value="7b">7° B</option>
                        </select>
                    </div>
                </div>

                {vistaActiva === 'boletines' ? (
                    <>
                        {/* Stats de boletines */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4 text-center">
                                <p className="text-xl sm:text-2xl font-bold text-yellow-600">{boletines.filter(b => b.estado === 'pendiente').length}</p>
                                <p className="text-xs sm:text-sm text-yellow-700">Pendientes</p>
                            </div>
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
                                <p className="text-xl sm:text-2xl font-bold text-green-600">{boletines.filter(b => b.estado === 'generado').length}</p>
                                <p className="text-xs sm:text-sm text-green-700">Generados</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 text-center">
                                <p className="text-xl sm:text-2xl font-bold text-blue-600">{boletines.filter(b => b.estado === 'enviado').length}</p>
                                <p className="text-xs sm:text-sm text-blue-700">Enviados</p>
                            </div>
                        </div>

                        {/* Lista de boletines */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grado</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Promedio</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {boletines.map((boletin) => (
                                            <tr key={boletin.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-[#181b49] rounded-full flex items-center justify-center text-white text-sm">
                                                            {boletin.estudiante.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-800">{boletin.estudiante}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{boletin.grado}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`text-lg font-bold ${getPromedioColor(boletin.promedio)}`}>
                                                        {boletin.promedio.toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getEstadoBadge(boletin.estado)}`}>
                                                        {boletin.estado}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        {boletin.estado === 'pendiente' && (
                                                            <button className="text-[#293577] hover:text-[#181b49] text-sm">🔄 Generar</button>
                                                        )}
                                                        {boletin.estado === 'generado' && (
                                                            <>
                                                                <button className="text-green-600 hover:text-green-800 text-sm">📥 PDF</button>
                                                                <button className="text-blue-600 hover:text-blue-800 text-sm">📧 Enviar</button>
                                                            </>
                                                        )}
                                                        {boletin.estado === 'enviado' && (
                                                            <button className="text-gray-600 hover:text-gray-800 text-sm">👁️ Ver</button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Resumen de notas por curso */}
                        <div className="grid gap-4">
                            {resumenNotas.map((curso, idx) => (
                                <div key={idx} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-[#181b49] rounded-xl flex items-center justify-center text-white font-bold">
                                                {curso.curso}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800">Curso {curso.curso}</h3>
                                                <p className="text-sm text-gray-500">{curso.aprobados + curso.reprobados} estudiantes</p>
                                            </div>
                                        </div>
                                        <div className={`text-3xl font-bold ${getPromedioColor(curso.promedio)}`}>
                                            {curso.promedio.toFixed(1)}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="bg-green-50 rounded-lg p-3 text-center">
                                            <p className="text-lg font-bold text-green-600">{curso.aprobados}</p>
                                            <p className="text-xs text-green-700">Aprobados</p>
                                        </div>
                                        <div className="bg-red-50 rounded-lg p-3 text-center">
                                            <p className="text-lg font-bold text-red-600">{curso.reprobados}</p>
                                            <p className="text-xs text-red-700">Reprobados</p>
                                        </div>
                                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                                            <p className="text-sm font-medium text-blue-600">✓ {curso.mejorMateria}</p>
                                            <p className="text-xs text-blue-700">Mejor Materia</p>
                                        </div>
                                        <div className="bg-orange-50 rounded-lg p-3 text-center">
                                            <p className="text-sm font-medium text-orange-600">⚠️ {curso.peorMateria}</p>
                                            <p className="text-xs text-orange-700">Necesita Atención</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </SidebarLayout>
    );
}
