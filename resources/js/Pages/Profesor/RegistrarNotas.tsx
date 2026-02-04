import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';

interface Estudiante {
    id: number;
    nombre: string;
    notas: {
        [key: string]: number;
    };
    promedio: number;
}

interface Evaluacion {
    id: string;
    nombre: string;
    porcentaje: number;
}

interface Props {
    profesor: {
        nombre: string;
    };
    cursos: Array<{
        id: number;
        nombre: string;
    }>;
    materias: Array<{
        id: number;
        nombre: string;
    }>;
    periodos: Array<{
        id: number;
        nombre: string;
    }>;
}

export default function RegistrarNotas({ profesor, cursos, materias, periodos }: Props) {
    // Datos mock para demostración
    const [cursoSeleccionado, setCursoSeleccionado] = useState('6A');
    const [materiaSeleccionada, setMateriaSeleccionada] = useState('Matemáticas');
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('1° Trimestre');

    // Evaluaciones dinámicas
    const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([
        { id: 'quiz1', nombre: 'Quiz 1', porcentaje: 30 },
        { id: 'examen', nombre: 'Examen Parcial', porcentaje: 30 },
        { id: 'final', nombre: 'Trabajo Final', porcentaje: 40 },
    ]);

    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([
        { id: 1, nombre: 'Pérez, Juan', notas: { quiz1: 85, examen: 90, final: 85 }, promedio: 86.5 },
        { id: 2, nombre: 'García, Ana', notas: { quiz1: 90, examen: 90, final: 90 }, promedio: 90.0 },
        { id: 3, nombre: 'López, Carlos', notas: { quiz1: 78, examen: 78, final: 78 }, promedio: 78.0 },
        { id: 4, nombre: 'Rodríguez, Sofía', notas: { quiz1: 92, examen: 92, final: 92 }, promedio: 92.0 },
        { id: 5, nombre: 'Martínez, Luis', notas: { quiz1: 88, examen: 88, final: 88 }, promedio: 88.0 },
    ]);

    const [mostrarModalEvaluacion, setMostrarModalEvaluacion] = useState(false);
    const [nuevaEvaluacion, setNuevaEvaluacion] = useState({ nombre: '', porcentaje: 0 });

    const calcularPromedio = (notas: { [key: string]: number }) => {
        let total = 0;
        evaluaciones.forEach(ev => {
            total += (notas[ev.id] || 0) * (ev.porcentaje / 100);
        });
        return total.toFixed(1);
    };

    const actualizarNota = (estudianteId: number, evaluacionId: string, valor: number) => {
        setEstudiantes(prev => prev.map(est => {
            if (est.id === estudianteId) {
                const nuevasNotas = { ...est.notas, [evaluacionId]: valor };
                return {
                    ...est,
                    notas: nuevasNotas,
                    promedio: parseFloat(calcularPromedio(nuevasNotas))
                };
            }
            return est;
        }));
    };

    const agregarEvaluacion = () => {
        if (nuevaEvaluacion.nombre && nuevaEvaluacion.porcentaje > 0) {
            const id = nuevaEvaluacion.nombre.toLowerCase().replace(/\s/g, '_');
            setEvaluaciones([...evaluaciones, { ...nuevaEvaluacion, id }]);
            setEstudiantes(prev => prev.map(est => ({
                ...est,
                notas: { ...est.notas, [id]: 0 }
            })));
            setNuevaEvaluacion({ nombre: '', porcentaje: 0 });
            setMostrarModalEvaluacion(false);
        }
    };

    const eliminarEvaluacion = (id: string) => {
        setEvaluaciones(prev => prev.filter(ev => ev.id !== id));
    };

    const menuItems = [
        {
            name: 'Mis Cursos',
            href: '/profesor/dashboard',
            icon: <svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/></svg>,
        },
        {
            name: 'Registrar Notas',
            href: '/profesor/notas',
            icon: <svg fill="currentColor" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>,
            active: true,
        },
        {
            name: 'Observador Académico',
            href: '/profesor/observador',
            icon: <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>,
        },
        {
            name: 'Mi Calendario',
            href: '/profesor/calendario',
            icon: <svg fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/></svg>,
        },
    ];

    return (
        <SidebarLayout 
            menuItems={menuItems}
            userInfo={{ name: profesor?.nombre || 'Profesor', role: 'Profesor' }}
        >
            <Head title="Registrar Notas" />

            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                <span className="hidden sm:inline">Registro de Notas - </span>
                <span className="sm:hidden">Notas: </span>
                {materiaSeleccionada} - {cursoSeleccionado}
            </h1>

            {/* Filtros */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:flex-wrap gap-3 sm:gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-gray-600">Curso:</span>
                    <select 
                        value={cursoSeleccionado}
                        onChange={(e) => setCursoSeleccionado(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                    >
                        <option value="6A">6A</option>
                        <option value="6B">6B</option>
                        <option value="10A">10A</option>
                        <option value="10B">10B</option>
                    </select>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-gray-600">Materia:</span>
                    <select 
                        value={materiaSeleccionada}
                        onChange={(e) => setMateriaSeleccionada(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                    >
                        <option value="Matemáticas">Matemáticas</option>
                        <option value="Física">Física</option>
                        <option value="Español">Español</option>
                    </select>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-gray-600">Periodo:</span>
                    <select 
                        value={periodoSeleccionado}
                        onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                    >
                        <option value="1° Trimestre">1° Trimestre</option>
                        <option value="2° Trimestre">2° Trimestre</option>
                        <option value="3° Trimestre">3° Trimestre</option>
                    </select>
                </div>
                <button
                    onClick={() => setMostrarModalEvaluacion(true)}
                    className="bg-blue-100 text-blue-700 px-3 sm:px-4 py-2 rounded-lg text-sm hover:bg-blue-200 transition-colors col-span-2 sm:col-span-1"
                >
                    + Evaluación
                </button>
                <button className="col-span-2 sm:col-span-1 lg:ml-auto bg-green-600 text-white px-4 sm:px-6 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm2 16H5V5h11.17L19 7.83V19zm-7-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM6 6h9v4H6z"/>
                    </svg>
                    <span className="hidden sm:inline">Guardar Cambios</span>
                    <span className="sm:hidden">Guardar</span>
                </button>
            </div>

            {/* Tabla de notas */}
            <div className="bg-white rounded-xl shadow overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full min-w-[500px]">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">
                                Estudiante <span className="text-xs text-gray-500">(Apellido, Nombre)</span>
                            </th>
                            {evaluaciones.map(ev => (
                                <th key={ev.id} className="text-center px-4 py-3 font-semibold text-gray-700 border-b">
                                    <div className="flex items-center justify-center gap-1">
                                        [{ev.nombre} ({ev.porcentaje}%)]
                                        <button
                                            onClick={() => eliminarEvaluacion(ev.id)}
                                            className="text-red-400 hover:text-red-600 ml-1"
                                            title="Eliminar evaluación"
                                        >
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </th>
                            ))}
                            <th className="text-center px-4 py-3 font-semibold text-gray-700 border-b">
                                [Promedio Actual]
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {estudiantes.map((estudiante, idx) => (
                            <tr key={estudiante.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 font-medium text-gray-800 border-b">
                                    {estudiante.nombre}
                                </td>
                                {evaluaciones.map(ev => (
                                    <td key={ev.id} className="px-4 py-3 text-center border-b">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={estudiante.notas[ev.id] || ''}
                                            onChange={(e) => actualizarNota(estudiante.id, ev.id, parseFloat(e.target.value) || 0)}
                                            className="w-16 text-center border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-center border-b">
                                    <span className={`font-bold text-lg ${
                                        estudiante.promedio >= 90 ? 'text-green-600' :
                                        estudiante.promedio >= 70 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                        {estudiante.promedio.toFixed(1)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal para agregar evaluación */}
            {mostrarModalEvaluacion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Agregar Nueva Evaluación</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de la evaluación
                                </label>
                                <input
                                    type="text"
                                    value={nuevaEvaluacion.nombre}
                                    onChange={(e) => setNuevaEvaluacion({ ...nuevaEvaluacion, nombre: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="Ej: Quiz 2, Taller, Exposición"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Porcentaje (%)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={nuevaEvaluacion.porcentaje}
                                    onChange={(e) => setNuevaEvaluacion({ ...nuevaEvaluacion, porcentaje: parseInt(e.target.value) || 0 })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="0-100"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setMostrarModalEvaluacion(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={agregarEvaluacion}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
