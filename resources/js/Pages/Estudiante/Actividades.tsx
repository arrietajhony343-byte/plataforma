import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { estudianteMenuItems } from '@/Config/estudianteMenu';

const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

interface Actividad {
    id: number;
    materia: string;
    materiaIcono: string;
    materiaColor: string;
    titulo: string;
    descripcion: string;
    tipo: string;
    fechaAsignada: string;
    fechaEntrega: string;
    estado: 'pendiente' | 'entregada' | 'calificada' | 'vencida';
    nota?: number;
    peso: number;
    profesor: string;
    retroalimentacion?: string;
}

export default function Actividades() {
    const nombre = 'Andrés Felipe Muñoz';
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroEstado, setFiltroEstado] = useState('todas');
    const [filtroMateria, setFiltroMateria] = useState('');
    const [vistaLista, setVistaLista] = useState(true);

    const actividades: Actividad[] = [
        // Matemáticas
        { id: 1, materia: 'Matemáticas', materiaIcono: 'Ma', materiaColor: 'bg-blue-100 text-blue-700', titulo: 'Taller de ecuaciones cuadráticas', descripcion: 'Resolver los 20 ejercicios del capítulo 5.', tipo: 'Taller', fechaAsignada: '20 Feb 2026', fechaEntrega: '26 Feb 2026', estado: 'pendiente', peso: 15, profesor: 'María García' },
        { id: 2, materia: 'Matemáticas', materiaIcono: 'Ma', materiaColor: 'bg-blue-100 text-blue-700', titulo: 'Quiz factorización', descripcion: 'Evaluación presencial sobre factorización de polinomios.', tipo: 'Evaluación', fechaAsignada: '22 Feb 2026', fechaEntrega: '02 Mar 2026', estado: 'pendiente', peso: 20, profesor: 'María García' },
        { id: 3, materia: 'Matemáticas', materiaIcono: 'Ma', materiaColor: 'bg-blue-100 text-blue-700', titulo: 'Tarea: Funciones lineales', descripcion: 'Graficar 10 funciones lineales.', tipo: 'Tarea', fechaAsignada: '10 Feb 2026', fechaEntrega: '17 Feb 2026', estado: 'calificada', nota: 4.8, peso: 10, profesor: 'María García', retroalimentacion: 'Excelente trabajo, gráficas muy precisas.' },
        { id: 4, materia: 'Matemáticas', materiaIcono: 'Ma', materiaColor: 'bg-blue-100 text-blue-700', titulo: 'Examen parcial - Álgebra', descripcion: 'Examen del primer corte.', tipo: 'Examen', fechaAsignada: '05 Feb 2026', fechaEntrega: '05 Feb 2026', estado: 'calificada', nota: 4.2, peso: 30, profesor: 'María García', retroalimentacion: 'Buen desempeño general.' },
        // Español
        { id: 5, materia: 'Español', materiaIcono: 'Es', materiaColor: 'bg-amber-100 text-amber-700', titulo: 'Ensayo: Cien Años de Soledad', descripcion: 'Ensayo argumentativo de 3 páginas sobre el realismo mágico.', tipo: 'Ensayo', fechaAsignada: '18 Feb 2026', fechaEntrega: '27 Feb 2026', estado: 'pendiente', peso: 20, profesor: 'Juan Pérez' },
        { id: 6, materia: 'Español', materiaIcono: 'Es', materiaColor: 'bg-amber-100 text-amber-700', titulo: 'Exposición: Poesía colombiana', descripcion: 'Presentación de 10 min sobre un poeta colombiano.', tipo: 'Exposición', fechaAsignada: '22 Feb 2026', fechaEntrega: '05 Mar 2026', estado: 'pendiente', peso: 15, profesor: 'Juan Pérez' },
        { id: 7, materia: 'Español', materiaIcono: 'Es', materiaColor: 'bg-amber-100 text-amber-700', titulo: 'Control de lectura Cap. 1-5', descripcion: 'Cuestionario sobre los primeros 5 capítulos.', tipo: 'Evaluación', fechaAsignada: '08 Feb 2026', fechaEntrega: '08 Feb 2026', estado: 'calificada', nota: 3.5, peso: 15, profesor: 'Juan Pérez', retroalimentacion: 'Faltó profundidad en las respuestas.' },
        // Ciencias
        { id: 8, materia: 'Ciencias', materiaIcono: 'CN', materiaColor: 'bg-green-100 text-green-700', titulo: 'Informe de laboratorio #3', descripcion: 'Informe sobre osmosis en células vegetales.', tipo: 'Informe', fechaAsignada: '19 Feb 2026', fechaEntrega: '01 Mar 2026', estado: 'pendiente', peso: 15, profesor: 'Pedro Sánchez' },
        { id: 9, materia: 'Ciencias', materiaIcono: 'CN', materiaColor: 'bg-green-100 text-green-700', titulo: 'Maqueta del sistema digestivo', descripcion: 'Maqueta a escala con materiales reciclables.', tipo: 'Proyecto', fechaAsignada: '10 Feb 2026', fechaEntrega: '15 Feb 2026', estado: 'calificada', nota: 4.5, peso: 20, profesor: 'Pedro Sánchez', retroalimentacion: 'Muy creativo y bien explicado.' },
        // Historia
        { id: 10, materia: 'Historia', materiaIcono: 'Hi', materiaColor: 'bg-purple-100 text-purple-700', titulo: 'Línea de tiempo: Independencia', descripcion: 'Línea de tiempo ilustrada 1810-1819.', tipo: 'Proyecto', fechaAsignada: '12 Feb 2026', fechaEntrega: '20 Feb 2026', estado: 'vencida', peso: 15, profesor: 'Carlos López' },
        { id: 11, materia: 'Historia', materiaIcono: 'Hi', materiaColor: 'bg-purple-100 text-purple-700', titulo: 'Ensayo: Constitución de 1991', descripcion: 'Analizar los cambios más importantes.', tipo: 'Ensayo', fechaAsignada: '22 Feb 2026', fechaEntrega: '08 Mar 2026', estado: 'pendiente', peso: 20, profesor: 'Carlos López' },
        // Inglés
        { id: 12, materia: 'Inglés', materiaIcono: 'In', materiaColor: 'bg-indigo-100 text-indigo-700', titulo: 'Present Perfect Worksheet', descripcion: 'Exercises 1-20 from workbook.', tipo: 'Tarea', fechaAsignada: '19 Feb 2026', fechaEntrega: '28 Feb 2026', estado: 'pendiente', peso: 10, profesor: 'Ana Martínez' },
        { id: 13, materia: 'Inglés', materiaIcono: 'In', materiaColor: 'bg-indigo-100 text-indigo-700', titulo: 'Reading: Short Story', descripcion: 'Read and answer comprehension questions.', tipo: 'Tarea', fechaAsignada: '21 Feb 2026', fechaEntrega: '03 Mar 2026', estado: 'pendiente', peso: 10, profesor: 'Ana Martínez' },
        // Química
        { id: 14, materia: 'Química', materiaIcono: 'Qu', materiaColor: 'bg-cyan-100 text-cyan-700', titulo: 'Práctica: Reacciones químicas', descripcion: '5 reacciones en laboratorio.', tipo: 'Laboratorio', fechaAsignada: '20 Feb 2026', fechaEntrega: '27 Feb 2026', estado: 'pendiente', peso: 20, profesor: 'Roberto Gómez' },
        { id: 15, materia: 'Química', materiaIcono: 'Qu', materiaColor: 'bg-cyan-100 text-cyan-700', titulo: 'Taller: Balanceo de ecuaciones', descripcion: 'Balancear 15 ecuaciones químicas.', tipo: 'Taller', fechaAsignada: '05 Feb 2026', fechaEntrega: '12 Feb 2026', estado: 'calificada', nota: 2.8, peso: 15, profesor: 'Roberto Gómez', retroalimentacion: 'Muchos errores. Necesita refuerzo.' },
        // Artes
        { id: 16, materia: 'Artes', materiaIcono: 'Ar', materiaColor: 'bg-pink-100 text-pink-700', titulo: 'Proyecto: Autorretrato', descripcion: 'Autorretrato usando técnica de acuarela.', tipo: 'Proyecto', fechaAsignada: '17 Feb 2026', fechaEntrega: '03 Mar 2026', estado: 'pendiente', peso: 30, profesor: 'Sandra Vega' },
    ];

    const materiasList = [...new Set(actividades.map(a => a.materia))];

    const stats = useMemo(() => ({
        pendientes: actividades.filter(a => a.estado === 'pendiente').length,
        entregadas: actividades.filter(a => a.estado === 'entregada').length,
        calificadas: actividades.filter(a => a.estado === 'calificada').length,
        vencidas: actividades.filter(a => a.estado === 'vencida').length,
    }), []);

    const filtradas = useMemo(() => {
        let result = actividades;
        if (filtroEstado !== 'todas') {
            result = result.filter(a => a.estado === filtroEstado);
        }
        if (filtroMateria) {
            result = result.filter(a => a.materia === filtroMateria);
        }
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            result = result.filter(a => a.titulo.toLowerCase().includes(s) || a.materia.toLowerCase().includes(s) || a.tipo.toLowerCase().includes(s));
        }
        // Ordenar: pendientes primero, luego vencidas, luego entregadas, luego calificadas
        const order = { pendiente: 0, vencida: 1, entregada: 2, calificada: 3 };
        result.sort((a, b) => order[a.estado] - order[b.estado]);
        return result;
    }, [filtroEstado, filtroMateria, searchTerm]);

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'pendiente': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'entregada': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'calificada': return 'bg-green-100 text-green-700 border-green-200';
            case 'vencida': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'pendiente': return '';
            case 'entregada': return '';
            case 'calificada': return '';
            case 'vencida': return '';
            default: return '';
        }
    };

    const getNotaColor = (nota: number) => {
        if (nota >= 4.0) return 'text-green-600';
        if (nota >= 3.0) return 'text-amber-600';
        return 'text-red-600';
    };

    return (
        <SidebarLayout
            menuItems={estudianteMenuItems}
            userInfo={{ name: nombre, role: 'Estudiante' }}
        >
            <Head title="Mis Actividades" />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Mis Actividades
                </h1>
                <p className="text-gray-500 mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Gestiona tus tareas, talleres y evaluaciones</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-white rounded-xl border border-amber-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-lg">⏳</div>
                    <div>
                        <p className="text-2xl font-extrabold text-amber-600">{stats.pendientes}</p>
                        <p className="text-xs text-gray-400">Pendientes</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-blue-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg></div>
                    <div>
                        <p className="text-2xl font-extrabold text-blue-600">{stats.entregadas}</p>
                        <p className="text-xs text-gray-400">Entregadas</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-green-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center"><svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                    <div>
                        <p className="text-2xl font-extrabold text-green-600">{stats.calificadas}</p>
                        <p className="text-xs text-gray-400">Calificadas</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-red-100 p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center"><svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg></div>
                    <div>
                        <p className="text-2xl font-extrabold text-red-600">{stats.vencidas}</p>
                        <p className="text-xs text-gray-400">Vencidas</p>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5 space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800">
                            <SearchIcon className="w-4 h-4" />
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar actividad..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm"
                        />
                    </div>
                    <select
                        value={filtroMateria}
                        onChange={(e) => setFiltroMateria(e.target.value)}
                        className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]/30 min-w-[160px]"
                    >
                        <option value="">Todas las materias</option>
                        {materiasList.map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setVistaLista(true)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${vistaLista ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                        >☰ Lista</button>
                        <button
                            onClick={() => setVistaLista(false)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${!vistaLista ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                        >▤ Cards</button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {[
                        { key: 'todas', label: 'Todas' },
                        { key: 'pendiente', label: 'Pendientes' },
                        { key: 'entregada', label: 'Entregadas' },
                        { key: 'calificada', label: 'Calificadas' },
                        { key: 'vencida', label: 'Vencidas' },
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFiltroEstado(f.key)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                filtroEstado === f.key
                                    ? 'bg-[#293577] text-white shadow'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Resultados */}
            <p className="text-xs text-gray-400 mb-3">{filtradas.length} actividad(es) encontrada(s)</p>

            {filtradas.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
                    <p className="text-4xl mb-2"></p>
                    <p className="text-gray-400 text-sm">No hay actividades que coincidan con los filtros</p>
                </div>
            ) : vistaLista ? (
                <div className="space-y-3">
                    {filtradas.map(act => (
                        <div key={act.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-md ${
                            act.estado === 'vencida' ? 'border-red-200 bg-red-50/20' : 'border-gray-100'
                        }`}>
                            <div className="p-4 flex items-start gap-4">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg ${act.materiaColor}`}>
                                    {act.materiaIcono}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <h4 className="font-bold text-gray-900 text-sm">{act.titulo}</h4>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getEstadoBadge(act.estado)}`}>
                                            {getEstadoIcon(act.estado)} {act.estado}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500">{act.descripcion}</p>
                                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400 flex-wrap">
                                        <span className={`font-semibold ${act.materiaColor.split(' ')[1]}`}>{act.materia}</span>
                                        <span>• {act.tipo}</span>
                                        <span>• {act.profesor}</span>
                                        <span>• Peso: {act.peso}%</span>
                                        <span>• Entrega: {act.fechaEntrega}</span>
                                    </div>
                                    {act.retroalimentacion && (
                                        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                                            <p className="text-[11px] text-blue-600 italic">{act.retroalimentacion}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                    {act.nota !== undefined && (
                                        <div className="text-center">
                                            <p className={`text-2xl font-extrabold ${getNotaColor(act.nota)}`}>{act.nota}</p>
                                            <p className="text-[10px] text-gray-400">/5.0</p>
                                        </div>
                                    )}
                                    {act.estado === 'pendiente' && (
                                        <button className="px-3 py-1.5 bg-[#293577] text-white rounded-lg text-xs font-semibold hover:bg-[#181b49] transition-colors whitespace-nowrap">
                                            Entregar
                                        </button>
                                    )}
                                    {act.estado === 'vencida' && (
                                        <button className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors whitespace-nowrap">
                                            Entregar tarde
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtradas.map(act => (
                        <div key={act.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all ${
                            act.estado === 'vencida' ? 'border-red-200' : 'border-gray-100'
                        }`}>
                            <div className={`px-4 py-2 flex items-center gap-2 ${act.materiaColor.split(' ')[0]} border-b`}>
                                <span>{act.materiaIcono}</span>
                                <span className={`text-xs font-bold ${act.materiaColor.split(' ')[1]}`}>{act.materia}</span>
                                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border ${getEstadoBadge(act.estado)}`}>
                                    {getEstadoIcon(act.estado)} {act.estado}
                                </span>
                            </div>
                            <div className="p-4">
                                <h4 className="font-bold text-gray-900 text-sm mb-1">{act.titulo}</h4>
                                <p className="text-xs text-gray-400 line-clamp-2">{act.descripcion}</p>
                                <div className="flex items-center justify-between mt-3">
                                    <div className="text-[11px] text-gray-400">
                                        <p>{act.tipo} • Peso: {act.peso}%</p>
                                        <p>Entrega: {act.fechaEntrega}</p>
                                    </div>
                                    {act.nota !== undefined && (
                                        <p className={`text-xl font-extrabold ${getNotaColor(act.nota)}`}>{act.nota}</p>
                                    )}
                                </div>
                                {act.estado === 'pendiente' && (
                                    <button className="w-full mt-3 px-3 py-2 bg-[#293577] text-white rounded-lg text-xs font-semibold hover:bg-[#181b49] transition-colors">
                                        📤 Entregar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </SidebarLayout>
    );
}
