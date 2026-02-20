import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { padreMenuItems } from '@/Config/padreMenu';

interface Nota {
    materia: string;
    profesor: string;
    nota1: number | null;
    nota2: number | null;
    nota3: number | null;
    nota4: number | null;
    notaFinal: number | null;
    estado: 'aprobado' | 'reprobado' | 'en_curso';
}

interface Boletin {
    periodo: string;
    estado: 'disponible' | 'generando' | 'pendiente';
    fecha_generacion: string | null;
    promedio: number | null;
}

export default function Boletin() {
    const [selectedPeriodo, setSelectedPeriodo] = useState('2');

    const hijo = {
        nombre: 'Carlos López',
        grado: '7° Secundaria',
        seccion: 'A',
        codigo: 'EST-2026-0034',
    };

    const boletines: Boletin[] = [
        { periodo: 'Periodo 1', estado: 'disponible', fecha_generacion: '2026-04-16', promedio: 4.1 },
        { periodo: 'Periodo 2', estado: 'generando', fecha_generacion: null, promedio: null },
        { periodo: 'Periodo 3', estado: 'pendiente', fecha_generacion: null, promedio: null },
        { periodo: 'Periodo 4', estado: 'pendiente', fecha_generacion: null, promedio: null },
    ];

    const notas: Nota[] = [
        { materia: 'Matemáticas', profesor: 'María García', nota1: 3.8, nota2: 4.0, nota3: null, nota4: null, notaFinal: null, estado: 'en_curso' },
        { materia: 'Español', profesor: 'Juan Pérez', nota1: 4.5, nota2: 4.7, nota3: null, nota4: null, notaFinal: null, estado: 'en_curso' },
        { materia: 'Ciencias Naturales', profesor: 'Ana Martínez', nota1: 4.2, nota2: 4.5, nota3: null, nota4: null, notaFinal: null, estado: 'en_curso' },
        { materia: 'Historia', profesor: 'Carlos Mendoza', nota1: 4.0, nota2: 4.2, nota3: null, nota4: null, notaFinal: null, estado: 'en_curso' },
        { materia: 'Inglés', profesor: 'Laura Stevens', nota1: 3.5, nota2: 3.8, nota3: null, nota4: null, notaFinal: null, estado: 'en_curso' },
        { materia: 'Educación Física', profesor: 'Pedro Sánchez', nota1: 4.8, nota2: 5.0, nota3: null, nota4: null, notaFinal: null, estado: 'en_curso' },
        { materia: 'Artes', profesor: 'Diana Castro', nota1: 4.3, nota2: 4.1, nota3: null, nota4: null, notaFinal: null, estado: 'en_curso' },
    ];

    const notasPeriodo1: Nota[] = [
        { materia: 'Matemáticas', profesor: 'María García', nota1: 3.8, nota2: 4.0, nota3: 3.9, nota4: 4.2, notaFinal: 4.0, estado: 'aprobado' },
        { materia: 'Español', profesor: 'Juan Pérez', nota1: 4.5, nota2: 4.7, nota3: 4.6, nota4: 4.8, notaFinal: 4.7, estado: 'aprobado' },
        { materia: 'Ciencias Naturales', profesor: 'Ana Martínez', nota1: 4.2, nota2: 4.5, nota3: 4.0, nota4: 4.3, notaFinal: 4.3, estado: 'aprobado' },
        { materia: 'Historia', profesor: 'Carlos Mendoza', nota1: 4.0, nota2: 4.2, nota3: 3.8, nota4: 4.0, notaFinal: 4.0, estado: 'aprobado' },
        { materia: 'Inglés', profesor: 'Laura Stevens', nota1: 3.5, nota2: 3.8, nota3: 3.2, nota4: 3.5, notaFinal: 3.5, estado: 'aprobado' },
        { materia: 'Educación Física', profesor: 'Pedro Sánchez', nota1: 4.8, nota2: 5.0, nota3: 4.9, nota4: 5.0, notaFinal: 4.9, estado: 'aprobado' },
        { materia: 'Artes', profesor: 'Diana Castro', nota1: 4.3, nota2: 4.1, nota3: 4.5, nota4: 4.2, notaFinal: 4.3, estado: 'aprobado' },
    ];

    const currentNotas = selectedPeriodo === '1' ? notasPeriodo1 : notas;

    const getNotaColor = (nota: number | null) => {
        if (nota === null) return 'text-gray-400';
        if (nota >= 4.0) return 'text-green-600 bg-green-50';
        if (nota >= 3.0) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const promedioActual = () => {
        const notasValidas = currentNotas.filter(n => {
            if (selectedPeriodo === '1') return n.notaFinal !== null;
            return n.nota2 !== null;
        });
        if (notasValidas.length === 0) return 0;
        const sum = notasValidas.reduce((acc, n) => {
            if (selectedPeriodo === '1') return acc + (n.notaFinal || 0);
            return acc + ((n.nota1! + n.nota2!) / 2);
        }, 0);
        return (sum / notasValidas.length).toFixed(1);
    };

    return (
        <SidebarLayout menuItems={padreMenuItems} title="Boletín & Notas">
            <Head title="Boletín & Notas" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Boletín & Notas</h1>
                        <p className="text-gray-600">{hijo.nombre} · {hijo.grado} {hijo.seccion} · Código: {hijo.codigo}</p>
                    </div>
                    <select
                        value={selectedPeriodo}
                        onChange={(e) => setSelectedPeriodo(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent"
                    >
                        <option value="1">Periodo 1</option>
                        <option value="2">Periodo 2 (Actual)</option>
                        <option value="3">Periodo 3</option>
                        <option value="4">Periodo 4</option>
                    </select>
                </div>

                {/* Info del boletín */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center text-3xl">
                                📋
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-800">Boletín {boletines[parseInt(selectedPeriodo) - 1].periodo}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        boletines[parseInt(selectedPeriodo) - 1].estado === 'disponible' ? 'bg-green-100 text-green-800' :
                                        boletines[parseInt(selectedPeriodo) - 1].estado === 'generando' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                    }`}>
                                        {boletines[parseInt(selectedPeriodo) - 1].estado === 'disponible' ? '✓ Disponible' :
                                         boletines[parseInt(selectedPeriodo) - 1].estado === 'generando' ? '⏳ Generándose automáticamente' :
                                         '⏸ Pendiente'}
                                    </span>
                                </div>
                                {boletines[parseInt(selectedPeriodo) - 1].estado === 'generando' && (
                                    <p className="text-xs text-yellow-600 mt-1">
                                        El boletín se genera automáticamente cuando el docente registra las notas finales del periodo
                                    </p>
                                )}
                            </div>
                        </div>
                        {boletines[parseInt(selectedPeriodo) - 1].estado === 'disponible' && (
                            <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                📥 Descargar Boletín PDF
                            </button>
                        )}
                    </div>
                </div>

                {/* Promedio general */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <p className="text-sm text-gray-500">Promedio del Periodo</p>
                        <p className={`text-3xl font-bold mt-1 ${parseFloat(promedioActual() as string) >= 3.5 ? 'text-green-600' : 'text-red-600'}`}>{promedioActual()}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <p className="text-sm text-gray-500">Materias en Curso</p>
                        <p className="text-3xl font-bold mt-1 text-blue-600">{currentNotas.length}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <p className="text-sm text-gray-500">Puesto (estimado)</p>
                        <p className="text-3xl font-bold mt-1 text-purple-600">5°/32</p>
                    </div>
                </div>

                {/* Tabla de notas - Desktop */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden lg:block">
                    <div className="px-4 py-3 border-b bg-gray-50">
                        <h3 className="font-semibold text-gray-700">Notas por Materia - {boletines[parseInt(selectedPeriodo) - 1].periodo}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Materia</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profesor</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Corte 1</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Corte 2</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Corte 3</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Corte 4</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Final</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {currentNotas.map((nota, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-800">{nota.materia}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{nota.profesor}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded text-sm font-medium ${getNotaColor(nota.nota1)}`}>
                                                {nota.nota1 ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded text-sm font-medium ${getNotaColor(nota.nota2)}`}>
                                                {nota.nota2 ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded text-sm font-medium ${getNotaColor(nota.nota3)}`}>
                                                {nota.nota3 ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded text-sm font-medium ${getNotaColor(nota.nota4)}`}>
                                                {nota.nota4 ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-3 py-1 rounded-lg text-sm font-bold ${getNotaColor(nota.notaFinal)}`}>
                                                {nota.notaFinal ?? '—'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                nota.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                                                nota.estado === 'reprobado' ? 'bg-red-100 text-red-800' :
                                                'bg-blue-100 text-blue-800'
                                            }`}>
                                                {nota.estado === 'aprobado' ? '✓ Aprobado' :
                                                 nota.estado === 'reprobado' ? '✗ Reprobado' : '⏳ En curso'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cards de notas - Móvil */}
                <div className="lg:hidden space-y-3">
                    <h3 className="font-semibold text-gray-700">Notas por Materia</h3>
                    {currentNotas.map((nota, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-4">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="font-medium text-gray-800">{nota.materia}</p>
                                    <p className="text-xs text-gray-500">Prof. {nota.profesor}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    nota.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                                    nota.estado === 'reprobado' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                    {nota.estado === 'aprobado' ? '✓' : nota.estado === 'reprobado' ? '✗' : '⏳'}
                                </span>
                            </div>
                            <div className="grid grid-cols-5 gap-2 text-center">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase">C1</p>
                                    <p className={`text-sm font-medium rounded px-1 py-0.5 ${getNotaColor(nota.nota1)}`}>
                                        {nota.nota1 ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase">C2</p>
                                    <p className={`text-sm font-medium rounded px-1 py-0.5 ${getNotaColor(nota.nota2)}`}>
                                        {nota.nota2 ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase">C3</p>
                                    <p className={`text-sm font-medium rounded px-1 py-0.5 ${getNotaColor(nota.nota3)}`}>
                                        {nota.nota3 ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase">C4</p>
                                    <p className={`text-sm font-medium rounded px-1 py-0.5 ${getNotaColor(nota.nota4)}`}>
                                        {nota.nota4 ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Final</p>
                                    <p className={`text-sm font-bold rounded px-1 py-0.5 ${getNotaColor(nota.notaFinal)}`}>
                                        {nota.notaFinal ?? '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Histórico de boletines */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <h3 className="font-semibold text-gray-700 mb-4">📄 Boletines Disponibles para Descarga</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {boletines.map((bol, i) => (
                            <div key={i} className={`border rounded-xl p-4 text-center ${
                                bol.estado === 'disponible' ? 'border-green-200 bg-green-50' :
                                bol.estado === 'generando' ? 'border-yellow-200 bg-yellow-50' :
                                'border-gray-200 bg-gray-50'
                            }`}>
                                <p className="font-medium text-gray-800">{bol.periodo}</p>
                                {bol.promedio && (
                                    <p className="text-2xl font-bold text-green-600 mt-1">{bol.promedio}</p>
                                )}
                                <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                                    bol.estado === 'disponible' ? 'bg-green-200 text-green-800' :
                                    bol.estado === 'generando' ? 'bg-yellow-200 text-yellow-800' :
                                    'bg-gray-200 text-gray-600'
                                }`}>
                                    {bol.estado === 'disponible' ? '✓ Disponible' :
                                     bol.estado === 'generando' ? '⏳ Generándose' : '⏸ Pendiente'}
                                </span>
                                {bol.estado === 'disponible' && (
                                    <button className="mt-3 w-full bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
                                        📥 Descargar PDF
                                    </button>
                                )}
                                {bol.estado === 'generando' && (
                                    <p className="mt-2 text-xs text-yellow-700">
                                        Se genera al registrar las notas finales
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
