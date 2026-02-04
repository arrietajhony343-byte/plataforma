import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

interface Props {
    profesor: {
        nombre: string;
    };
}

type TipoObservacion = 'positiva' | 'negativa' | 'informativa';

interface Etiqueta {
    id: string;
    nombre: string;
    tipo: TipoObservacion;
}

export default function Observador({ profesor }: Props) {
    const [busqueda, setBusqueda] = useState('');
    const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoObservacion>('positiva');
    const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<string[]>([]);
    const [descripcion, setDescripcion] = useState('');

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
        { id: 'inasistencia', nombre: 'Inasistencia', tipo: 'informativa' },
        { id: 'citacion_padres', nombre: 'Citación a Padres', tipo: 'informativa' },
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
            case 'informativa': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        }
    };

    const getTipoIcon = (tipo: TipoObservacion) => {
        switch (tipo) {
            case 'positiva': return '✓';
            case 'negativa': return '✕';
            case 'informativa': return '●';
        }
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
        },
        {
            name: 'Observador Académico',
            href: '/profesor/observador',
            icon: <svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>,
            active: true,
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
            <Head title="Observador Académico" />

            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Nuevo Registro en el Observador
            </h1>

            <div className="bg-white rounded-xl shadow p-6">
                {/* Búsqueda de estudiante */}
                <div className="mb-6">
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Escribe el nombre del estudiante..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
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
                        onClick={() => setTipoSeleccionado('informativa')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border-2 transition-all text-sm sm:text-base ${
                            tipoSeleccionado === 'informativa' 
                                ? 'bg-yellow-500 text-white border-yellow-500' 
                                : 'bg-white text-yellow-600 border-yellow-300 hover:bg-yellow-50'
                        }`}
                    >
                        <span className="w-5 h-5 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-700 text-sm">●</span>
                        <span className="hidden sm:inline">Comportamiento/</span>Informativa
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
                <button className="bg-[#2196F3] text-white px-6 py-3 rounded-lg hover:bg-[#1976D2] transition-colors font-semibold">
                    Registrar Observación
                </button>
            </div>

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
                                    <option value="informativa">Informativa</option>
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
