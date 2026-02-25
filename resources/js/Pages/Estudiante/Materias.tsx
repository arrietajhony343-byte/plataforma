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
    titulo: string;
    descripcion: string;
    tipo: string;
    fechaAsignada: string;
    fechaEntrega: string;
    estado: 'pendiente' | 'entregada' | 'calificada' | 'vencida';
    nota?: number;
    peso: number;
    archivos?: string[];
    retroalimentacion?: string;
}

interface Materia {
    id: number;
    nombre: string;
    profesor: string;
    icono: string;
    color: string;
    colorBg: string;
    colorText: string;
    colorBorder: string;
    promedio: number;
    horasSemanales: number;
    salon: string;
    descripcion: string;
    actividades: Actividad[];
    promedioCortes: { corte: string; nota: number }[];
}

export default function Materias() {
    const nombre = 'Andrés Felipe Muñoz';
    const [materiaActiva, setMateriaActiva] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroActividad, setFiltroActividad] = useState('todas');
    const [showEntregarModal, setShowEntregarModal] = useState(false);
    const [actividadSeleccionada, setActividadSeleccionada] = useState<Actividad | null>(null);

    const materias: Materia[] = [
        {
            id: 1, nombre: 'Matemáticas', profesor: 'María García', icono: 'Ma',
            color: 'from-blue-500 to-blue-600', colorBg: 'bg-blue-50', colorText: 'text-blue-700', colorBorder: 'border-blue-200',
            promedio: 4.5, horasSemanales: 5, salon: 'Aula 301',
            descripcion: 'Álgebra, geometría analítica y trigonometría para grado 8°.',
            promedioCortes: [{ corte: '1er Corte (30%)', nota: 4.5 }, { corte: '2do Corte (30%)', nota: 0 }, { corte: '3er Corte (40%)', nota: 0 }],
            actividades: [
                { id: 1, titulo: 'Taller de ecuaciones cuadráticas', descripcion: 'Resolver los 20 ejercicios del capítulo 5. Mostrar procedimiento completo.', tipo: 'Taller', fechaAsignada: '20 Feb 2026', fechaEntrega: '26 Feb 2026', estado: 'pendiente', peso: 15 },
                { id: 2, titulo: 'Quiz factorización', descripcion: 'Evaluación presencial sobre factorización de polinomios.', tipo: 'Evaluación', fechaAsignada: '22 Feb 2026', fechaEntrega: '02 Mar 2026', estado: 'pendiente', peso: 20 },
                { id: 3, titulo: 'Tarea: Funciones lineales', descripcion: 'Graficar 10 funciones lineales e identificar pendiente e intercepto.', tipo: 'Tarea', fechaAsignada: '10 Feb 2026', fechaEntrega: '17 Feb 2026', estado: 'calificada', nota: 4.8, peso: 10, retroalimentacion: 'Excelente trabajo, gráficas muy precisas.' },
                { id: 4, titulo: 'Examen parcial - Álgebra', descripcion: 'Examen del primer corte cubriendo todos los temas vistos.', tipo: 'Examen', fechaAsignada: '05 Feb 2026', fechaEntrega: '05 Feb 2026', estado: 'calificada', nota: 4.2, peso: 30, retroalimentacion: 'Buen desempeño. Mejorar en factorización de trinomios.' },
            ]
        },
        {
            id: 2, nombre: 'Español', profesor: 'Juan Pérez', icono: 'Es',
            color: 'from-amber-500 to-amber-600', colorBg: 'bg-amber-50', colorText: 'text-amber-700', colorBorder: 'border-amber-200',
            promedio: 3.8, horasSemanales: 5, salon: 'Aula 301',
            descripcion: 'Comprensión lectora, literatura colombiana y producción textual.',
            promedioCortes: [{ corte: '1er Corte (30%)', nota: 3.8 }, { corte: '2do Corte (30%)', nota: 0 }, { corte: '3er Corte (40%)', nota: 0 }],
            actividades: [
                { id: 5, titulo: 'Ensayo: Cien Años de Soledad', descripcion: 'Escribir un ensayo argumentativo de 3 páginas sobre el realismo mágico en la obra.', tipo: 'Ensayo', fechaAsignada: '18 Feb 2026', fechaEntrega: '27 Feb 2026', estado: 'pendiente', peso: 20 },
                { id: 6, titulo: 'Exposición: Poesía colombiana', descripcion: 'Preparar presentación de 10 min sobre un poeta colombiano.', tipo: 'Exposición', fechaAsignada: '22 Feb 2026', fechaEntrega: '05 Mar 2026', estado: 'pendiente', peso: 15 },
                { id: 7, titulo: 'Control de lectura Cap. 1-5', descripcion: 'Cuestionario sobre los primeros 5 capítulos.', tipo: 'Evaluación', fechaAsignada: '08 Feb 2026', fechaEntrega: '08 Feb 2026', estado: 'calificada', nota: 3.5, peso: 15, retroalimentacion: 'Faltó profundidad en las respuestas de análisis.' },
            ]
        },
        {
            id: 3, nombre: 'Ciencias Naturales', profesor: 'Pedro Sánchez', icono: 'CN',
            color: 'from-green-500 to-green-600', colorBg: 'bg-green-50', colorText: 'text-green-700', colorBorder: 'border-green-200',
            promedio: 4.2, horasSemanales: 4, salon: 'Lab. 1',
            descripcion: 'Biología celular, ecosistemas y método científico.',
            promedioCortes: [{ corte: '1er Corte (30%)', nota: 4.2 }, { corte: '2do Corte (30%)', nota: 0 }, { corte: '3er Corte (40%)', nota: 0 }],
            actividades: [
                { id: 8, titulo: 'Informe de laboratorio #3', descripcion: 'Redactar informe sobre el experimento de osmosis en células vegetales.', tipo: 'Informe', fechaAsignada: '19 Feb 2026', fechaEntrega: '01 Mar 2026', estado: 'pendiente', peso: 15 },
                { id: 9, titulo: 'Maqueta del sistema digestivo', descripcion: 'Construir maqueta a escala con materiales reciclables.', tipo: 'Proyecto', fechaAsignada: '10 Feb 2026', fechaEntrega: '15 Feb 2026', estado: 'calificada', nota: 4.5, peso: 20, retroalimentacion: 'Muy creativo y bien explicado.' },
            ]
        },
        {
            id: 4, nombre: 'Historia', profesor: 'Carlos López', icono: 'Hi',
            color: 'from-purple-500 to-purple-600', colorBg: 'bg-purple-50', colorText: 'text-purple-700', colorBorder: 'border-purple-200',
            promedio: 3.5, horasSemanales: 3, salon: 'Aula 301',
            descripcion: 'Historia de Colombia desde la independencia hasta la actualidad.',
            promedioCortes: [{ corte: '1er Corte (30%)', nota: 3.5 }, { corte: '2do Corte (30%)', nota: 0 }, { corte: '3er Corte (40%)', nota: 0 }],
            actividades: [
                { id: 10, titulo: 'Línea de tiempo: Independencia', descripcion: 'Crear línea de tiempo ilustrada del proceso de independencia 1810-1819.', tipo: 'Proyecto', fechaAsignada: '12 Feb 2026', fechaEntrega: '20 Feb 2026', estado: 'vencida', peso: 15 },
                { id: 11, titulo: 'Ensayo: Constitución de 1991', descripcion: 'Analizar los cambios más importantes de la constitución.', tipo: 'Ensayo', fechaAsignada: '22 Feb 2026', fechaEntrega: '08 Mar 2026', estado: 'pendiente', peso: 20 },
            ]
        },
        {
            id: 5, nombre: 'Inglés', profesor: 'Ana Martínez', icono: 'In',
            color: 'from-indigo-500 to-indigo-600', colorBg: 'bg-indigo-50', colorText: 'text-indigo-700', colorBorder: 'border-indigo-200',
            promedio: 4.7, horasSemanales: 4, salon: 'Aula 305',
            descripcion: 'English B1 level: grammar, reading comprehension, and speaking.',
            promedioCortes: [{ corte: '1er Corte (30%)', nota: 4.7 }, { corte: '2do Corte (30%)', nota: 0 }, { corte: '3er Corte (40%)', nota: 0 }],
            actividades: [
                { id: 12, titulo: 'Present Perfect Worksheet', descripcion: 'Complete exercises 1-20 from the workbook, page 45-47.', tipo: 'Tarea', fechaAsignada: '19 Feb 2026', fechaEntrega: '28 Feb 2026', estado: 'pendiente', peso: 10 },
                { id: 13, titulo: 'Reading: Short Story', descripcion: 'Read "The Gift of the Magi" and answer comprehension questions.', tipo: 'Tarea', fechaAsignada: '21 Feb 2026', fechaEntrega: '03 Mar 2026', estado: 'pendiente', peso: 10 },
                { id: 14, titulo: 'Speaking Test', descripcion: 'Oral presentation about environmental issues (3 min).', tipo: 'Evaluación', fechaAsignada: '05 Feb 2026', fechaEntrega: '05 Feb 2026', estado: 'calificada', nota: 4.9, peso: 25, retroalimentacion: 'Excellent pronunciation and fluency!' },
            ]
        },
        {
            id: 6, nombre: 'Química', profesor: 'Roberto Gómez', icono: 'Qu',
            color: 'from-cyan-500 to-cyan-600', colorBg: 'bg-cyan-50', colorText: 'text-cyan-700', colorBorder: 'border-cyan-200',
            promedio: 3.2, horasSemanales: 4, salon: 'Lab. 2',
            descripcion: 'Tabla periódica, enlaces químicos y estequiometría básica.',
            promedioCortes: [{ corte: '1er Corte (30%)', nota: 3.2 }, { corte: '2do Corte (30%)', nota: 0 }, { corte: '3er Corte (40%)', nota: 0 }],
            actividades: [
                { id: 15, titulo: 'Práctica: Reacciones químicas', descripcion: 'Realizar 5 reacciones en laboratorio y documentar resultados.', tipo: 'Laboratorio', fechaAsignada: '20 Feb 2026', fechaEntrega: '27 Feb 2026', estado: 'pendiente', peso: 20 },
                { id: 16, titulo: 'Taller: Balanceo de ecuaciones', descripcion: 'Balancear 15 ecuaciones químicas por método de tanteo.', tipo: 'Taller', fechaAsignada: '05 Feb 2026', fechaEntrega: '12 Feb 2026', estado: 'calificada', nota: 2.8, peso: 15, retroalimentacion: 'Muchos errores en el balanceo. Necesita refuerzo.' },
            ]
        },
        {
            id: 7, nombre: 'Ed. Física', profesor: 'Pedro Sánchez', icono: 'EF',
            color: 'from-orange-500 to-orange-600', colorBg: 'bg-orange-50', colorText: 'text-orange-700', colorBorder: 'border-orange-200',
            promedio: 4.8, horasSemanales: 2, salon: 'Cancha Principal',
            descripcion: 'Desarrollo de habilidades motrices, deportes y acondicionamiento.',
            promedioCortes: [{ corte: '1er Corte (30%)', nota: 4.8 }, { corte: '2do Corte (30%)', nota: 0 }, { corte: '3er Corte (40%)', nota: 0 }],
            actividades: [
                { id: 17, titulo: 'Test de resistencia', descripcion: 'Prueba de resistencia física: carrera de 1km.', tipo: 'Evaluación', fechaAsignada: '18 Feb 2026', fechaEntrega: '18 Feb 2026', estado: 'calificada', nota: 5.0, peso: 25, retroalimentacion: 'Excelente estado físico. Mejor tiempo de la clase.' },
            ]
        },
        {
            id: 8, nombre: 'Artes', profesor: 'Sandra Vega', icono: 'Ar',
            color: 'from-pink-500 to-pink-600', colorBg: 'bg-pink-50', colorText: 'text-pink-700', colorBorder: 'border-pink-200',
            promedio: 4.6, horasSemanales: 2, salon: 'Taller de Artes',
            descripcion: 'Dibujo, pintura y expresión artística. Técnicas mixtas.',
            promedioCortes: [{ corte: '1er Corte (30%)', nota: 4.6 }, { corte: '2do Corte (30%)', nota: 0 }, { corte: '3er Corte (40%)', nota: 0 }],
            actividades: [
                { id: 18, titulo: 'Proyecto: Autorretrato', descripcion: 'Crear un autorretrato usando técnica de acuarela.', tipo: 'Proyecto', fechaAsignada: '17 Feb 2026', fechaEntrega: '03 Mar 2026', estado: 'pendiente', peso: 30 },
                { id: 19, titulo: 'Bocetos semanales', descripcion: '5 bocetos de objetos cotidianos con grafito.', tipo: 'Tarea', fechaAsignada: '10 Feb 2026', fechaEntrega: '14 Feb 2026', estado: 'calificada', nota: 4.5, peso: 10, retroalimentacion: 'Buenos trazos, buen manejo de sombras.' },
            ]
        },
    ];

    const materiaDetalle = materias.find(m => m.id === materiaActiva);

    const actividadesFiltradas = useMemo(() => {
        if (!materiaDetalle) return [];
        let acts = materiaDetalle.actividades;
        if (filtroActividad !== 'todas') {
            acts = acts.filter(a => a.estado === filtroActividad);
        }
        return acts;
    }, [materiaDetalle, filtroActividad]);

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

    const materiasFiltradas = useMemo(() => {
        if (!searchTerm) return materias;
        return materias.filter(m =>
            m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.profesor.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm]);

    return (
        <SidebarLayout
            menuItems={estudianteMenuItems}
            userInfo={{ name: nombre, role: 'Estudiante' }}
        >
            <Head title="Mis Materias" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
                        Mis Materias
                    </h1>
                    <p className="text-gray-500 mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                        {materiaActiva ? `${materiaDetalle?.nombre} — ${materiaDetalle?.profesor}` : 'Selecciona una materia para ver detalles y actividades'}
                    </p>
                </div>
                {materiaActiva && (
                    <button
                        onClick={() => { setMateriaActiva(null); setFiltroActividad('todas'); }}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Volver a materias
                    </button>
                )}
            </div>

            {!materiaActiva ? (
                <>
                    {/* Buscador */}
                    <div className="mb-5">
                        <div className="relative max-w-md">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800">
                                <SearchIcon className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Buscar materia..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all"
                            />
                        </div>
                    </div>

                    {/* Grid de materias */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {materiasFiltradas.map(m => {
                            const pendientes = m.actividades.filter(a => a.estado === 'pendiente' || a.estado === 'vencida').length;
                            return (
                                <button
                                    key={m.id}
                                    onClick={() => setMateriaActiva(m.id)}
                                    className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition-all text-left"
                                >
                                    {/* Header con gradiente */}
                                    <div className={`h-24 sm:h-28 bg-gradient-to-br ${m.color} flex items-center justify-center relative`}>
                                        <span className="text-4xl sm:text-5xl drop-shadow-lg group-hover:scale-110 transition-transform">{m.icono}</span>
                                        {pendientes > 0 && (
                                            <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg animate-pulse">
                                                {pendientes}
                                            </span>
                                        )}
                                    </div>
                                    {/* Content */}
                                    <div className="p-3">
                                        <h3 className="font-bold text-gray-900 text-sm truncate">{m.nombre}</h3>
                                        <p className="text-[11px] text-gray-400 truncate mt-0.5">{m.profesor}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-1">
                                                <div className="w-14 bg-gray-100 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${m.promedio >= 4.0 ? 'bg-green-500' : m.promedio >= 3.0 ? 'bg-amber-500' : 'bg-red-500'}`}
                                                        style={{ width: `${(m.promedio / 5) * 100}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-extrabold ${getNotaColor(m.promedio)}`}>{m.promedio}</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </>
            ) : materiaDetalle ? (
                <div className="space-y-5">
                    {/* Info de la materia */}
                    <div className={`rounded-2xl overflow-hidden border ${materiaDetalle.colorBorder}`}>
                        <div className={`bg-gradient-to-r ${materiaDetalle.color} p-5 text-white`}>
                            <div className="flex items-center gap-4">
                                <span className="text-4xl drop-shadow-lg">{materiaDetalle.icono}</span>
                                <div>
                                    <h2 className="text-xl font-extrabold">{materiaDetalle.nombre}</h2>
                                    <p className="text-white/80 text-sm">{materiaDetalle.descripcion}</p>
                                </div>
                            </div>
                        </div>
                        <div className={`${materiaDetalle.colorBg} p-4 grid grid-cols-2 sm:grid-cols-4 gap-3`}>
                            <div className="text-center">
                                <p className="text-xs text-gray-400">Profesor</p>
                                <p className="text-sm font-bold text-gray-800">{materiaDetalle.profesor}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-400">Horas/Sem</p>
                                <p className="text-sm font-bold text-gray-800">{materiaDetalle.horasSemanales}h</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-400">Salón</p>
                                <p className="text-sm font-bold text-gray-800">{materiaDetalle.salon}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-gray-400">Promedio</p>
                                <p className={`text-lg font-extrabold ${getNotaColor(materiaDetalle.promedio)}`}>{materiaDetalle.promedio}</p>
                            </div>
                        </div>
                    </div>

                    {/* Cortes */}
                    <div className="grid grid-cols-3 gap-3">
                        {materiaDetalle.promedioCortes.map((c, i) => (
                            <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 text-center shadow-sm">
                                <p className="text-[11px] text-gray-400 font-medium">{c.corte}</p>
                                <p className={`text-xl font-extrabold mt-1 ${c.nota > 0 ? getNotaColor(c.nota) : 'text-gray-300'}`}>
                                    {c.nota > 0 ? c.nota.toFixed(1) : '—'}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Filtros de actividades */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-gray-700">Actividades:</span>
                        {[
                            { key: 'todas', label: 'Todas', count: materiaDetalle.actividades.length },
                            { key: 'pendiente', label: 'Pendientes', count: materiaDetalle.actividades.filter(a => a.estado === 'pendiente').length },
                            { key: 'calificada', label: 'Calificadas', count: materiaDetalle.actividades.filter(a => a.estado === 'calificada').length },
                            { key: 'vencida', label: 'Vencidas', count: materiaDetalle.actividades.filter(a => a.estado === 'vencida').length },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFiltroActividad(f.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    filtroActividad === f.key
                                        ? 'bg-[#293577] text-white shadow-md'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {f.label} ({f.count})
                            </button>
                        ))}
                    </div>

                    {/* Lista de actividades */}
                    <div className="space-y-3">
                        {actividadesFiltradas.length === 0 ? (
                            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                                <p className="text-gray-400 text-sm">No hay actividades en esta categoría</p>
                            </div>
                        ) : (
                            actividadesFiltradas.map(act => (
                                <div key={act.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className="text-sm">{getEstadoIcon(act.estado)}</span>
                                                    <h4 className="font-bold text-gray-900 text-sm">{act.titulo}</h4>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getEstadoBadge(act.estado)}`}>
                                                        {act.estado}
                                                    </span>
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{act.tipo}</span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{act.descripcion}</p>
                                                <div className="flex items-center gap-4 mt-2 text-[11px] text-gray-400">
                                                    <span>Asignada: {act.fechaAsignada}</span>
                                                    <span>Entrega: {act.fechaEntrega}</span>
                                                    <span>Peso: {act.peso}%</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {act.nota !== undefined && (
                                                    <div className="text-center">
                                                        <p className={`text-2xl font-extrabold ${getNotaColor(act.nota)}`}>{act.nota}</p>
                                                        <p className="text-[10px] text-gray-400">/5.0</p>
                                                    </div>
                                                )}
                                                {act.estado === 'pendiente' && (
                                                    <button
                                                        onClick={() => { setActividadSeleccionada(act); setShowEntregarModal(true); }}
                                                        className="px-3 py-1.5 bg-[#293577] text-white rounded-lg text-xs font-semibold hover:bg-[#181b49] transition-colors"
                                                    >
                                                        Entregar
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {act.retroalimentacion && (
                                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <p className="text-xs font-semibold text-blue-700 mb-0.5">Retroalimentación del profesor:</p>
                                                <p className="text-xs text-blue-600 italic">"{act.retroalimentacion}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            ) : null}

            {/* Modal Entregar Actividad */}
            {showEntregarModal && actividadSeleccionada && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-5 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">📤 Entregar Actividad</h3>
                                <button onClick={() => setShowEntregarModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">{actividadSeleccionada.titulo}</p>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Comentario (opcional)</label>
                                <textarea
                                    rows={3}
                                    placeholder="Escribe un comentario para tu profesor..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm resize-none"
                                ></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adjuntar archivo</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[#293577]/30 transition-colors cursor-pointer">
                                    <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                                    </svg>
                                    <p className="text-xs text-gray-400">Arrastra un archivo o haz clic para seleccionar</p>
                                    <p className="text-[10px] text-gray-300 mt-1">PDF, DOC, JPG, PNG (máx. 10MB)</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowEntregarModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        alert('Actividad entregada correctamente');
                                        setShowEntregarModal(false);
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-[#293577] text-white rounded-lg text-sm font-semibold hover:bg-[#181b49] transition-colors"
                                >
                                    Enviar Entrega
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
