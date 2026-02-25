import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { profesorMenuItems } from '@/Config/profesorMenu';

interface EstudianteBack {
    id: number;
    nombre: string;
    curso: string;
}

interface ObservacionBack {
    id: number;
    estudiante: string;
    curso: string;
    materia: string;
    tipo: string;
    descripcion: string;
    fecha: string;
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
    cursos: Array<{ id: number; nombre: string }>;
    estudiantes: EstudianteBack[];
    observaciones: ObservacionBack[];
    cursoMaterias: CursoMateriaMap[];
}

type TipoObservacion = 'positiva' | 'negativa' | 'neutral';

interface Etiqueta {
    id: string;
    nombre: string;
    tipo: TipoObservacion;
}

export default function Observador({ profesor, cursos, estudiantes, observaciones, cursoMaterias }: Props) {
    const [busqueda, setBusqueda] = useState('');
    const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoObservacion>('positiva');
    const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<string[]>([]);
    const [descripcion, setDescripcion] = useState('');
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState('');
    const [cursoFiltro, setCursoFiltro] = useState('');
    const [tab, setTab] = useState<'nuevo' | 'historial'>('nuevo');

    const fechaActual = new Date().toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const etiquetasPredefinidas: Etiqueta[] = [
        { id: 'llegada_tarde', nombre: 'Llegada Tarde', tipo: 'negativa' },
        { id: 'sin_tarea', nombre: 'Sin Tarea', tipo: 'negativa' },
        { id: 'excelente_participacion', nombre: 'Excelente Participación', tipo: 'positiva' },
        { id: 'falta_respeto', nombre: 'Falta de Respeto', tipo: 'negativa' },
        { id: 'trabajo_grupo', nombre: 'Buen Trabajo en Grupo', tipo: 'positiva' },
        { id: 'mejora_academica', nombre: 'Mejora Académica', tipo: 'positiva' },
        { id: 'inasistencia', nombre: 'Inasistencia', tipo: 'neutral' },
        { id: 'citacion_padres', nombre: 'Citación a Padres', tipo: 'neutral' },
    ];

    const [etiquetasPersonalizadas, setEtiquetasPersonalizadas] = useState<Etiqueta[]>([]);
    const [mostrarModalEtiqueta, setMostrarModalEtiqueta] = useState(false);
    const [nuevaEtiqueta, setNuevaEtiqueta] = useState({ nombre: '', tipo: 'positiva' as TipoObservacion });

    const todasLasEtiquetas = [...etiquetasPredefinidas, ...etiquetasPersonalizadas];

    const toggleEtiqueta = (id: string) => {
        setEtiquetasSeleccionadas(prev => 
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const agregarEtiquetaPersonalizada = () => {
        if (nuevaEtiqueta.nombre.trim()) {
            const id = nuevaEtiqueta.nombre.toLowerCase().replace(/\s/g, '_');
            setEtiquetasPersonalizadas([...etiquetasPersonalizadas, { 
                id, 
                nombre: nuevaEtiqueta.nombre, 
                tipo: nuevaEtiqueta.tipo 
            }]);
            setNuevaEtiqueta({ nombre: '', tipo: 'positiva' });
            setMostrarModalEtiqueta(false);
        }
    };

    const getTipoColor = (tipo: TipoObservacion) => {
        switch (tipo) {
            case 'positiva': return 'bg-green-100 text-green-700 border-green-300';
            case 'negativa': return 'bg-red-100 text-red-700 border-red-300';
            case 'neutral': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        }
    };

    const getTipoIcon = (tipo: TipoObservacion) => {
        switch (tipo) {
            case 'positiva': return '✓';
            case 'negativa': return '✕';
            case 'neutral': return '●';
        }
    };

    // Filtrar estudiantes por búsqueda y curso
    const estudiantesFiltrados = estudiantes.filter(e => {
        const matchBusqueda = !busqueda || e.nombre.toLowerCase().includes(busqueda.toLowerCase());
        const matchCurso = !cursoFiltro || e.curso === cursos.find(c => c.id === Number(cursoFiltro))?.nombre;
        return matchBusqueda && matchCurso;
    });

    const registrarObservacion = () => {
        if (!estudianteSeleccionado || !descripcion.trim()) return;
        const est = estudiantes.find(e => e.id === Number(estudianteSeleccionado));
        if (!est) return;
        // Find a curso_materia_id for this student's curso
        const cursoObj = cursos.find(c => c.nombre === est.curso);
        const cm = cursoMaterias.find(cma => cma.curso_id === cursoObj?.id);
        if (!cm) return;

        const etiquetasTexto = etiquetasSeleccionadas.map(id => {
            const et = [...etiquetasPredefinidas, ...etiquetasPersonalizadas].find(e => e.id === id);
            return et?.nombre;
        }).filter(Boolean).join(', ');

        router.post('/profesor/observador', {
            estudiante_id: Number(estudianteSeleccionado),
            curso_materia_id: cm.id,
            tipo: tipoSeleccionado,
            descripcion: etiquetasTexto ? `[${etiquetasTexto}] ${descripcion}` : descripcion,
        }, {
            onSuccess: () => {
                setDescripcion('');
                setEtiquetasSeleccionadas([]);
                setEstudianteSeleccionado('');
            },
        });
    };

    return (
        <SidebarLayout 
            menuItems={profesorMenuItems}
            userInfo={{ name: profesor?.nombre || 'Profesor', role: 'Profesor' }}
        >
            <Head title="Observador Académico" />

            <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Observador Académico
            </h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button onClick={() => setTab('nuevo')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'nuevo' ? 'bg-[#293577] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    Nuevo Registro
                </button>
                <button onClick={() => setTab('historial')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'historial' ? 'bg-[#293577] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    Historial ({observaciones.length})
                </button>
            </div>

            {tab === 'nuevo' ? (
            <div className="bg-white rounded-xl shadow p-6">
                {/* Selección de estudiante */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Estudiante</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <select value={cursoFiltro} onChange={(e) => setCursoFiltro(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Todos los cursos</option>
                            {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar estudiante..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <select value={estudianteSeleccionado} onChange={(e) => setEstudianteSeleccionado(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500">
                        <option value="">Seleccionar estudiante...</option>
                        {estudiantesFiltrados.map(e => (
                            <option key={e.id} value={e.id}>{e.nombre} - {e.curso}</option>
                        ))}
                    </select>
                </div>

                {/* Info de fecha y profesor */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-6 text-sm">
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                        <span className="text-gray-600">Fecha: </span>
                        <span className="font-semibold">{fechaActual}</span>
                    </div>
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                        <span className="text-gray-600">Profesor: </span>
                        <span className="font-semibold">{profesor?.nombre || 'Carlos Díaz'}</span>
                    </div>
                </div>

                {/* Tipo de observación */}
                <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
                    <button
                        onClick={() => setTipoSeleccionado('positiva')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border-2 transition-all text-sm sm:text-base ${
                            tipoSeleccionado === 'positiva' 
                                ? 'bg-green-500 text-white border-green-500' 
                                : 'bg-white text-green-600 border-green-300 hover:bg-green-50'
                        }`}
                    >
                        <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-green-700 text-sm">✓</span>
                        <span className="hidden sm:inline">Académica/</span>Positiva
                    </button>
                    <button
                        onClick={() => setTipoSeleccionado('negativa')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border-2 transition-all text-sm sm:text-base ${
                            tipoSeleccionado === 'negativa' 
                                ? 'bg-red-500 text-white border-red-500' 
                                : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
                        }`}
                    >
                        <span className="w-5 h-5 rounded-full bg-red-200 flex items-center justify-center text-red-700 text-sm">✕</span>
                        <span className="hidden sm:inline">Disciplinaria/</span>Negativa
                    </button>
                    <button
                        onClick={() => setTipoSeleccionado('neutral')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border-2 transition-all text-sm sm:text-base ${
                            tipoSeleccionado === 'neutral' 
                                ? 'bg-yellow-500 text-white border-yellow-500' 
                                : 'bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50'
                        }`}
                    >
                        <span className="w-5 h-5 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-700 text-sm">●</span>
                        <span className="hidden sm:inline">Comportamiento/</span>Neutral
                    </button>
                </div>

                {/* Etiquetas rápidas */}
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {todasLasEtiquetas
                            .filter(et => et.tipo === tipoSeleccionado || etiquetasSeleccionadas.includes(et.id))
                            .map(etiqueta => (
                            <button
                                key={etiqueta.id}
                                onClick={() => toggleEtiqueta(etiqueta.id)}
                                className={`px-3 py-1 rounded border text-sm transition-all ${
                                    etiquetasSeleccionadas.includes(etiqueta.id)
                                        ? getTipoColor(etiqueta.tipo) + ' ring-2 ring-offset-1 ring-gray-400'
                                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                }`}
                            >
                                [{etiqueta.nombre}]
                            </button>
                        ))}
                        <button
                            onClick={() => setMostrarModalEtiqueta(true)}
                            className="px-3 py-1 rounded border border-dashed border-gray-400 text-gray-500 text-sm hover:bg-gray-50"
                        >
                            + Nueva Etiqueta
                        </button>
                    </div>
                </div>

                {/* Descripción */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción Detallada
                    </label>
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Describe la observación con detalle..."
                    />
                </div>

                {/* Botón de registro */}
                <button onClick={registrarObservacion} disabled={!estudianteSeleccionado || !descripcion.trim()} className="bg-[#293577] text-white px-6 py-3 rounded-lg hover:bg-[#181b49] transition-colors font-semibold disabled:opacity-50">
                    Registrar Observación
                </button>
            </div>
            ) : (
            /* Historial de observaciones */
            <div className="bg-white rounded-xl shadow overflow-hidden">
                {observaciones.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No hay observaciones registradas</div>
                ) : (
                <div className="divide-y divide-gray-100">
                    {observaciones.map(obs => (
                        <div key={obs.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start gap-3">
                                <span className={`mt-1 px-2 py-0.5 rounded text-xs font-semibold ${
                                    obs.tipo === 'positiva' ? 'bg-green-100 text-green-700' :
                                    obs.tipo === 'negativa' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>{obs.tipo}</span>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{obs.estudiante}</p>
                                    <p className="text-sm text-gray-500">{obs.curso} • {obs.materia} • {obs.fecha}</p>
                                    <p className="text-sm text-gray-600 mt-1">{obs.descripcion}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                )}
            </div>
            )}

            {/* Modal para nueva etiqueta */}
            {mostrarModalEtiqueta && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Crear Nueva Etiqueta</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de la etiqueta
                                </label>
                                <input
                                    type="text"
                                    value={nuevaEtiqueta.nombre}
                                    onChange={(e) => setNuevaEtiqueta({ ...nuevaEtiqueta, nombre: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="Ej: Buen Comportamiento"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo
                                </label>
                                <select
                                    value={nuevaEtiqueta.tipo}
                                    onChange={(e) => setNuevaEtiqueta({ ...nuevaEtiqueta, tipo: e.target.value as TipoObservacion })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                >
                                    <option value="positiva">Positiva</option>
                                    <option value="negativa">Negativa</option>
                                    <option value="neutral">Neutral</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setMostrarModalEtiqueta(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={agregarEtiquetaPersonalizada}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Crear
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
