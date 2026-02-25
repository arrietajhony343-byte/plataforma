import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import { profesorMenuItems } from '@/Config/profesorMenu';

interface NotaBackend {
    id: number;
    tipo: string;
    valor: number;
    peso: number;
    descripcion: string | null;
}

interface EstudianteBackend {
    id: number;
    nombre: string;
    notas: NotaBackend[];
    promedio: number | null;
}

interface Evaluacion {
    id: string;
    nombre: string;
    porcentaje: number;
    tipo: string;
}

interface CursoMateriaMap {
    id: number;
    curso_id: number;
    materia_id: number;
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
    cursoMaterias: CursoMateriaMap[];
}

export default function RegistrarNotas({ profesor, cursos, materias, periodos, cursoMaterias }: Props) {
    const [cursoSeleccionado, setCursoSeleccionado] = useState(cursos[0]?.id?.toString() || '');
    const [materiaSeleccionada, setMateriaSeleccionada] = useState(materias[0]?.id?.toString() || '');
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState(periodos[0]?.id?.toString() || '');

    const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([
        { id: 'quiz', nombre: 'Quiz', porcentaje: 30, tipo: 'quiz' },
        { id: 'examen', nombre: 'Examen', porcentaje: 30, tipo: 'examen' },
        { id: 'tarea', nombre: 'Tarea', porcentaje: 40, tipo: 'tarea' },
    ]);

    const [estudiantes, setEstudiantes] = useState<EstudianteBackend[]>([]);
    const [notasLocales, setNotasLocales] = useState<Record<number, Record<string, number>>>({});
    const [loading, setLoading] = useState(false);
    const [guardando, setGuardando] = useState(false);

    // Encontrar el curso_materia_id correspondiente
    const cursoMateriaId = cursoMaterias.find(
        cm => cm.curso_id === Number(cursoSeleccionado) && cm.materia_id === Number(materiaSeleccionada)
    )?.id;

    // Cargar estudiantes cuando cambian los filtros
    const cargarEstudiantes = useCallback(() => {
        if (!cursoMateriaId || !periodoSeleccionado) return;
        setLoading(true);
        fetch(`/profesor/notas/estudiantes?curso_materia_id=${cursoMateriaId}&periodo_id=${periodoSeleccionado}`)
            .then(res => res.json())
            .then((data: EstudianteBackend[]) => {
                setEstudiantes(data);
                // Inicializar notas locales desde backend
                const locales: Record<number, Record<string, number>> = {};
                data.forEach(est => {
                    locales[est.id] = {};
                    est.notas.forEach(n => {
                        locales[est.id][n.tipo] = n.valor;
                    });
                });
                setNotasLocales(locales);
            })
            .finally(() => setLoading(false));
    }, [cursoMateriaId, periodoSeleccionado]);

    useEffect(() => { cargarEstudiantes(); }, [cargarEstudiantes]);

    const [mostrarModalEvaluacion, setMostrarModalEvaluacion] = useState(false);
    const [nuevaEvaluacion, setNuevaEvaluacion] = useState({ nombre: '', porcentaje: 0, tipo: 'tarea' });

    const calcularPromedio = (notas: Record<string, number>) => {
        let total = 0;
        let pesoTotal = 0;
        evaluaciones.forEach(ev => {
            if (notas[ev.tipo] !== undefined) {
                total += (notas[ev.tipo] || 0) * (ev.porcentaje / 100);
                pesoTotal += ev.porcentaje;
            }
        });
        return pesoTotal > 0 ? (total / (pesoTotal / 100) * (100 / 100)).toFixed(1) : '0.0';
    };

    const actualizarNota = (estudianteId: number, tipo: string, valor: number) => {
        setNotasLocales(prev => ({
            ...prev,
            [estudianteId]: { ...prev[estudianteId], [tipo]: valor }
        }));
    };

    const guardarNotas = () => {
        if (!cursoMateriaId || !periodoSeleccionado) return;
        setGuardando(true);
        const notasArr: Array<{estudiante_id: number; curso_materia_id: number; periodo_id: number; tipo: string; valor: number; peso: number; descripcion: string | null}> = [];
        Object.entries(notasLocales).forEach(([estId, notas]) => {
            Object.entries(notas).forEach(([tipo, valor]) => {
                const ev = evaluaciones.find(e => e.tipo === tipo);
                notasArr.push({
                    estudiante_id: Number(estId),
                    curso_materia_id: cursoMateriaId!,
                    periodo_id: Number(periodoSeleccionado),
                    tipo,
                    valor: Math.min(5, Math.max(0, valor)),
                    peso: ev?.porcentaje || 0,
                    descripcion: ev?.nombre || null,
                });
            });
        });
        router.post('/profesor/notas', { notas: notasArr }, {
            onSuccess: () => setGuardando(false),
            onError: () => setGuardando(false),
        });
    };

    const agregarEvaluacion = () => {
        if (nuevaEvaluacion.nombre && nuevaEvaluacion.porcentaje > 0) {
            const id = nuevaEvaluacion.nombre.toLowerCase().replace(/\s/g, '_');
            setEvaluaciones([...evaluaciones, { ...nuevaEvaluacion, id, tipo: nuevaEvaluacion.tipo }]);
            setNuevaEvaluacion({ nombre: '', porcentaje: 0, tipo: 'tarea' });
            setMostrarModalEvaluacion(false);
        }
    };

    const eliminarEvaluacion = (id: string) => {
        setEvaluaciones(prev => prev.filter(ev => ev.id !== id));
    };

    // Materias filtradas según curso seleccionado
    const materiasDisponibles = materias.filter(m =>
        cursoMaterias.some(cm => cm.curso_id === Number(cursoSeleccionado) && cm.materia_id === m.id)
    );

    return (
        <SidebarLayout 
            menuItems={profesorMenuItems}
            userInfo={{ name: profesor?.nombre || 'Profesor', role: 'Profesor' }}
        >
            <Head title="Registrar Notas" />

            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">
                <span className="hidden sm:inline">Registro de Notas - </span>
                <span className="sm:hidden">Notas: </span>
                {materias.find(m => m.id === Number(materiaSeleccionada))?.nombre || 'Materia'} - {cursos.find(c => c.id === Number(cursoSeleccionado))?.nombre || 'Curso'}
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
                        {cursos.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-gray-600">Materia:</span>
                    <select 
                        value={materiaSeleccionada}
                        onChange={(e) => setMateriaSeleccionada(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                    >
                        {materiasDisponibles.map(m => (
                            <option key={m.id} value={m.id}>{m.nombre}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-gray-600">Periodo:</span>
                    <select 
                        value={periodoSeleccionado}
                        onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 sm:px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
                    >
                        {periodos.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={() => setMostrarModalEvaluacion(true)}
                    className="bg-blue-100 text-blue-700 px-3 sm:px-4 py-2 rounded-lg text-sm hover:bg-blue-200 transition-colors col-span-2 sm:col-span-1"
                >
                    + Evaluación
                </button>
                <button className="col-span-2 sm:col-span-1 lg:ml-auto bg-green-600 text-white px-4 sm:px-6 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50" onClick={guardarNotas} disabled={guardando || !cursoMateriaId}>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm2 16H5V5h11.17L19 7.83V19zm-7-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM6 6h9v4H6z"/>
                    </svg>
                    <span className="hidden sm:inline">Guardar Cambios</span>
                    <span className="sm:hidden">Guardar</span>
                </button>
            </div>

            {/* Tabla de notas */}
            <div className="bg-white rounded-xl shadow overflow-x-auto -mx-4 sm:mx-0">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando estudiantes...</div>
                ) : !cursoMateriaId ? (
                    <div className="p-8 text-center text-gray-500">Selecciona una combinación curso-materia válida</div>
                ) : estudiantes.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No hay estudiantes matriculados</div>
                ) : (
                <table className="w-full min-w-[500px]">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="text-left px-4 py-3 font-semibold text-gray-700 border-b">
                                Estudiante
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
                        {estudiantes.map((estudiante, idx) => {
                            const notas = notasLocales[estudiante.id] || {};
                            const promedio = parseFloat(calcularPromedio(notas));
                            return (
                            <tr key={estudiante.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 font-medium text-gray-800 border-b">
                                    {estudiante.nombre}
                                </td>
                                {evaluaciones.map(ev => (
                                    <td key={ev.id} className="px-4 py-3 text-center border-b">
                                        <input
                                            type="number"
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            value={notas[ev.tipo] ?? ''}
                                            onChange={(e) => actualizarNota(estudiante.id, ev.tipo, parseFloat(e.target.value) || 0)}
                                            className="w-16 text-center border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </td>
                                ))}
                                <td className="px-4 py-3 text-center border-b">
                                    <span className={`font-bold text-lg ${
                                        promedio >= 4 ? 'text-green-600' :
                                        promedio >= 3 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                        {promedio.toFixed(1)}
                                    </span>
                                </td>
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
                )}
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
