import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/admin/dashboard' },
    { icon: '👥', label: 'Usuarios (Altas/Bajas)', href: '/admin/usuarios' },
    { icon: '📚', label: 'Cursos & Materias', href: '/admin/cursos' },
    { icon: '⚙️', label: 'Configuración de Periodos', href: '/admin/periodos' },
    { icon: '📈', label: 'Reportes Globales', href: '/admin/reportes', active: true },
];

export default function Reportes() {
    const [selectedReport, setSelectedReport] = useState('rendimiento');
    const [selectedPeriodo, setSelectedPeriodo] = useState('2');
    const [selectedCurso, setSelectedCurso] = useState('todos');

    const reportTypes = [
        { id: 'rendimiento', name: 'Rendimiento Académico', icon: '📊', description: 'Promedios y estadísticas por curso' },
        { id: 'asistencia', name: 'Asistencia', icon: '📋', description: 'Control de asistencia por periodo' },
        { id: 'observador', name: 'Observador', icon: '📝', description: 'Resumen de observaciones' },
        { id: 'boletines', name: 'Boletines', icon: '📄', description: 'Generación masiva de boletines' },
    ];

    const rendimientoData = [
        { curso: '6° A', promedio: 4.2, aprobados: 30, reprobados: 2, mejorMateria: 'Ciencias', peorMateria: 'Matemáticas' },
        { curso: '6° B', promedio: 3.9, aprobados: 27, reprobados: 3, mejorMateria: 'Historia', peorMateria: 'Inglés' },
        { curso: '7° A', promedio: 4.0, aprobados: 26, reprobados: 2, mejorMateria: 'Español', peorMateria: 'Física' },
        { curso: '8° A', promedio: 3.8, aprobados: 32, reprobados: 3, mejorMateria: 'Biología', peorMateria: 'Química' },
    ];

    return (
        <SidebarLayout menuItems={menuItems} title="Reportes Globales">
            <Head title="Reportes" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Reportes Globales</h1>
                        <p className="text-gray-600">Genera y descarga reportes institucionales</p>
                    </div>
                    <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                        📥 Exportar a Excel
                    </button>
                </div>

                {/* Tipos de reporte */}
                <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {reportTypes.map((report) => (
                        <button
                            key={report.id}
                            onClick={() => setSelectedReport(report.id)}
                            className={`p-3 sm:p-4 rounded-xl text-left transition-all ${
                                selectedReport === report.id
                                    ? 'bg-[#2196F3] text-white shadow-lg'
                                    : 'bg-white text-gray-800 shadow-sm hover:shadow-md'
                            }`}
                        >
                            <span className="text-xl sm:text-2xl">{report.icon}</span>
                            <h3 className="font-bold mt-2 text-sm sm:text-base">{report.name}</h3>
                            <p className={`text-xs sm:text-sm mt-1 ${selectedReport === report.id ? 'text-blue-100' : 'text-gray-500'}`}>
                                {report.description}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Periodo</label>
                        <select
                            value={selectedPeriodo}
                            onChange={(e) => setSelectedPeriodo(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="1">Primer Periodo</option>
                            <option value="2">Segundo Periodo (Actual)</option>
                            <option value="3">Tercer Periodo</option>
                            <option value="4">Cuarto Periodo</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                        <select
                            value={selectedCurso}
                            onChange={(e) => setSelectedCurso(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="todos">Todos los cursos</option>
                            <option value="6a">6° A</option>
                            <option value="6b">6° B</option>
                            <option value="7a">7° A</option>
                            <option value="8a">8° A</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button className="bg-[#2196F3] text-white px-6 py-2 rounded-lg hover:bg-[#1976D2]">
                            🔍 Generar Reporte
                        </button>
                    </div>
                </div>

                {/* Contenido del reporte */}
                {selectedReport === 'rendimiento' && (
                    <div className="space-y-6">
                        {/* Estadísticas generales */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <p className="text-3xl font-bold text-[#1e3a5f]">4.0</p>
                                <p className="text-gray-600 text-sm">Promedio General</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <p className="text-3xl font-bold text-green-600">92%</p>
                                <p className="text-gray-600 text-sm">Tasa de Aprobación</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <p className="text-3xl font-bold text-[#2196F3]">125</p>
                                <p className="text-gray-600 text-sm">Estudiantes Evaluados</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <p className="text-3xl font-bold text-purple-600">4</p>
                                <p className="text-gray-600 text-sm">Cursos Activos</p>
                            </div>
                        </div>

                        {/* Tabla de rendimiento */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="p-4 border-b">
                                <h2 className="font-bold text-gray-800 text-sm sm:text-base">📊 Rendimiento por Curso - Segundo Periodo</h2>
                            </div>
                            <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Promedio</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aprobados</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Reprobados</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mejor Materia</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atención Requerida</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {rendimientoData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-gray-800">{row.curso}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                    row.promedio >= 4.0 ? 'bg-green-100 text-green-800' :
                                                    row.promedio >= 3.5 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {row.promedio.toFixed(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center text-green-600 font-medium">{row.aprobados}</td>
                                            <td className="px-6 py-4 text-center text-red-600 font-medium">{row.reprobados}</td>
                                            <td className="px-6 py-4">
                                                <span className="text-green-600">✓ {row.mejorMateria}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-orange-600">⚠️ {row.peorMateria}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            </div>
                        </div>

                        {/* Acciones de reporte */}
                        <div className="flex flex-wrap gap-4">
                            <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                                📄 Exportar PDF
                            </button>
                            <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                                📊 Exportar Excel
                            </button>
                            <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                                🖨️ Imprimir
                            </button>
                            <button className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                                📧 Enviar por Email
                            </button>
                        </div>
                    </div>
                )}

                {selectedReport === 'boletines' && (
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="font-bold text-gray-800 mb-4">📄 Generación Masiva de Boletines</h2>
                        <div className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <p className="text-blue-800">
                                    <strong>Nota:</strong> Se generarán boletines para todos los estudiantes del periodo y curso seleccionados.
                                </p>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Formato</label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                        <option>PDF Individual</option>
                                        <option>PDF Consolidado</option>
                                        <option>Excel</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Incluir</label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" defaultChecked className="rounded" /> Notas por materia
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" defaultChecked className="rounded" /> Observaciones
                                        </label>
                                        <label className="flex items-center gap-2">
                                            <input type="checkbox" className="rounded" /> Gráficos de progreso
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <button className="w-full bg-[#2196F3] text-white py-3 rounded-lg hover:bg-[#1976D2] font-medium">
                                🚀 Generar 125 Boletines
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </SidebarLayout>
    );
}
