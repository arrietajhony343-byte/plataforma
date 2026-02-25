import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { padreMenuItems } from '@/Config/padreMenu';

interface Actividad {
    id: number;
    titulo: string;
    materia: string;
    profesor: string;
    fecha: string;
    hora?: string;
    tipo: 'examen' | 'tarea' | 'exposicion' | 'laboratorio' | 'evento' | 'reunion';
    descripcion: string;
    entregada?: boolean;
}

export default function Calendario() {
    const [mesActual, setMesActual] = useState(1); // Febrero (0-indexed)
    const [vistaActual, setVistaActual] = useState<'calendario' | 'lista'>('calendario');
    const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null);

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    const actividades: Actividad[] = [
        { id: 1, titulo: 'Examen parcial - Álgebra', materia: 'Matemáticas', profesor: 'María García', fecha: '2026-02-18', hora: '8:00 AM', tipo: 'examen', descripcion: 'Examen sobre ecuaciones de primer y segundo grado. Traer calculadora científica.', entregada: undefined },
        { id: 2, titulo: 'Entrega ensayo literario', materia: 'Español', profesor: 'Juan Pérez', fecha: '2026-02-20', hora: '11:00 AM', tipo: 'tarea', descripcion: 'Ensayo de mínimo 3 páginas sobre "Cien Años de Soledad". Formato APA.', entregada: false },
        { id: 3, titulo: 'Laboratorio - Reacción química', materia: 'Ciencias', profesor: 'Ana Martínez', fecha: '2026-02-22', hora: '2:00 PM', tipo: 'laboratorio', descripcion: 'Práctica de laboratorio sobre reacciones exotérmicas y endotérmicas. Llevar bata.', entregada: undefined },
        { id: 4, titulo: 'Exposición: Revolución Industrial', materia: 'Historia', profesor: 'Carlos Mendoza', fecha: '2026-02-25', hora: '9:00 AM', tipo: 'exposicion', descripcion: 'Exposición en grupo (3 personas) sobre la Revolución Industrial y su impacto.', entregada: undefined },
        { id: 5, titulo: 'Quiz de vocabulario Unit 5', materia: 'Inglés', profesor: 'Laura Stevens', fecha: '2026-02-14', hora: '10:00 AM', tipo: 'examen', descripcion: 'Quiz de vocabulario y gramática de la Unidad 5.', entregada: true },
        { id: 6, titulo: 'Día de la ciencia', materia: 'Institucional', profesor: 'Dirección', fecha: '2026-02-27', hora: '7:00 AM', tipo: 'evento', descripcion: 'Feria de ciencias institucional. Los estudiantes presentan sus proyectos.', entregada: undefined },
        { id: 7, titulo: 'Reunión de padres', materia: 'Institucional', profesor: 'Coordinación', fecha: '2026-02-28', hora: '5:00 PM', tipo: 'reunion', descripcion: 'Reunión general de padres de familia. Entrega de informes del primer periodo.', entregada: undefined },
        { id: 8, titulo: 'Taller de ecuaciones', materia: 'Matemáticas', profesor: 'María García', fecha: '2026-02-10', hora: '8:00 AM', tipo: 'tarea', descripcion: 'Taller práctico de 20 ejercicios sobre ecuaciones lineales.', entregada: false },
    ];

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'examen': return 'bg-red-100 text-red-800 border-red-300';
            case 'tarea': return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'exposicion': return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'laboratorio': return 'bg-green-100 text-green-800 border-green-300';
            case 'evento': return 'bg-orange-100 text-orange-800 border-orange-300';
            case 'reunion': return 'bg-pink-100 text-pink-800 border-pink-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getTipoIcon = (tipo: string) => {
        switch (tipo) {
            case 'examen': return 'E';
            case 'tarea': return 'T';
            case 'exposicion': return 'X';
            case 'laboratorio': return 'L';
            case 'evento': return 'V';
            case 'reunion': return 'R';
            default: return '•';
        }
    };

    // Generar días del mes actual (Febrero 2026)
    const diasEnMes = 28;
    const primerDiaSemana = 6; // Febrero 2026 empieza en domingo(0), pero queremos Lunes como 1er día => 6 (desplazamiento)
    const dias = Array.from({ length: diasEnMes }, (_, i) => i + 1);

    const getActividadesDelDia = (dia: number) => {
        const fecha = `2026-02-${dia.toString().padStart(2, '0')}`;
        return actividades.filter(a => a.fecha === fecha);
    };

    const proximasActividades = actividades
        .filter(a => new Date(a.fecha) >= new Date('2026-02-13'))
        .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    return (
        <SidebarLayout menuItems={padreMenuItems} title="Calendario de Actividades">
            <Head title="Calendario" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Calendario de Actividades</h1>
                        <p className="text-gray-600">Actividades asignadas por los profesores · Actualización automática</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setVistaActual('calendario')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                vistaActual === 'calendario' ? 'bg-[#293577] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Calendario
                        </button>
                        <button
                            onClick={() => setVistaActual('lista')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                vistaActual === 'lista' ? 'bg-[#293577] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Lista
                        </button>
                    </div>
                </div>

                {/* Alerta de no entregadas */}
                {actividades.filter(a => a.entregada === false).length > 0 && (
                    <div className="bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-red-600">!</span>
                            <div>
                                <p className="font-medium text-red-800">
                                    {actividades.filter(a => a.entregada === false).length} actividades sin entregar
                                </p>
                                <div className="mt-1 space-y-1">
                                    {actividades.filter(a => a.entregada === false).map(a => (
                                        <p key={a.id} className="text-sm text-red-700">• {a.titulo} ({a.materia}) - {a.fecha}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Leyenda */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex flex-wrap gap-3">
                        {['examen', 'tarea', 'exposicion', 'laboratorio', 'evento', 'reunion'].map(tipo => (
                            <span key={tipo} className={`px-3 py-1 rounded-full text-xs font-medium border ${getTipoColor(tipo)}`}>
                                {getTipoIcon(tipo)} {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                            </span>
                        ))}
                    </div>
                </div>

                {vistaActual === 'calendario' ? (
                    <>
                        {/* Controles del mes */}
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <div className="flex justify-between items-center mb-4">
                                <button
                                    onClick={() => setMesActual(Math.max(0, mesActual - 1))}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    ← Anterior
                                </button>
                                <h2 className="text-xl font-bold text-gray-800">{meses[mesActual]} 2026</h2>
                                <button
                                    onClick={() => setMesActual(Math.min(11, mesActual + 1))}
                                    className="p-2 hover:bg-gray-100 rounded-lg"
                                >
                                    Siguiente →
                                </button>
                            </div>

                            {/* Grilla del calendario - Desktop */}
                            <div className="hidden md:block">
                                <div className="grid grid-cols-7 gap-1">
                                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(dia => (
                                        <div key={dia} className="text-center text-xs font-medium text-gray-500 py-2">{dia}</div>
                                    ))}
                                    {/* Espacios vacíos antes del primer día */}
                                    {Array.from({ length: primerDiaSemana }).map((_, i) => (
                                        <div key={`empty-${i}`} className="p-2 min-h-[80px]" />
                                    ))}
                                    {dias.map(dia => {
                                        const acts = getActividadesDelDia(dia);
                                        const isHoy = dia === 13;
                                        return (
                                            <div key={dia} className={`p-1 min-h-[80px] border rounded-lg ${isHoy ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}>
                                                <p className={`text-sm font-medium mb-1 ${isHoy ? 'text-blue-600' : 'text-gray-700'}`}>{dia}</p>
                                                {acts.map(act => (
                                                    <button
                                                        key={act.id}
                                                        onClick={() => setSelectedActividad(act)}
                                                        className={`w-full text-left text-[10px] px-1 py-0.5 rounded mb-0.5 truncate border ${getTipoColor(act.tipo)} hover:opacity-80`}
                                                    >
                                                        {getTipoIcon(act.tipo)} {act.titulo}
                                                    </button>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Vista simplificada en móvil */}
                            <div className="md:hidden space-y-2">
                                {dias.map(dia => {
                                    const acts = getActividadesDelDia(dia);
                                    const isHoy = dia === 13;
                                    if (acts.length === 0 && !isHoy) return null;
                                    return (
                                        <div key={dia} className={`flex items-start gap-3 p-3 rounded-lg ${isHoy ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${isHoy ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
                                                {dia}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                {isHoy && acts.length === 0 && <p className="text-sm text-blue-600 font-medium">Hoy</p>}
                                                {acts.map(act => (
                                                    <button
                                                        key={act.id}
                                                        onClick={() => setSelectedActividad(act)}
                                                        className={`w-full text-left text-xs px-2 py-1.5 rounded-lg border ${getTipoColor(act.tipo)} hover:opacity-80`}
                                                    >
                                                        {getTipoIcon(act.tipo)} <strong>{act.titulo}</strong> · {act.materia}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Vista lista */
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b bg-gray-50">
                            <h3 className="font-semibold text-gray-700">Próximas Actividades</h3>
                        </div>
                        <div className="divide-y">
                            {proximasActividades.map(act => (
                                <div
                                    key={act.id}
                                    className="p-4 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => setSelectedActividad(act)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${getTipoColor(act.tipo).split(' ')[0]}`}>
                                                {getTipoIcon(act.tipo)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800">{act.titulo}</p>
                                                <p className="text-sm text-gray-500">{act.materia} · Prof. {act.profesor}</p>
                                                <p className="text-xs text-gray-400 mt-1">{act.descripcion.substring(0, 80)}...</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                                                {new Date(act.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                                            </span>
                                            {act.hora && <p className="text-xs text-gray-500 mt-1">{act.hora}</p>}
                                            {act.entregada === false && (
                                                <span className="inline-block mt-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-medium">
                                                    No entregada
                                                </span>
                                            )}
                                            {act.entregada === true && (
                                                <span className="inline-block mt-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-medium">
                                                    Entregada
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal detalle actividad */}
            {selectedActividad && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${getTipoColor(selectedActividad.tipo).split(' ')[0]}`}>
                                    {getTipoIcon(selectedActividad.tipo)}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">{selectedActividad.titulo}</h2>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTipoColor(selectedActividad.tipo)}`}>
                                        {selectedActividad.tipo}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setSelectedActividad(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 w-20">Materia:</span>
                                <span className="font-medium text-gray-800">{selectedActividad.materia}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 w-20">Profesor:</span>
                                <span className="font-medium text-gray-800">{selectedActividad.profesor}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-500 w-20">Fecha:</span>
                                <span className="font-medium text-gray-800">
                                    {new Date(selectedActividad.fecha).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            {selectedActividad.hora && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-500 w-20">Hora:</span>
                                    <span className="font-medium text-gray-800">{selectedActividad.hora}</span>
                                </div>
                            )}
                            <div className="text-sm">
                                <span className="text-gray-500">Descripción:</span>
                                <p className="mt-1 text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedActividad.descripcion}</p>
                            </div>
                            {selectedActividad.entregada !== undefined && (
                                <div className={`p-3 rounded-lg ${selectedActividad.entregada ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                    <p className={`text-sm font-medium ${selectedActividad.entregada ? 'text-green-800' : 'text-red-800'}`}>
                                        {selectedActividad.entregada ? 'Actividad entregada por el estudiante' : 'El estudiante NO ha entregado esta actividad'}
                                    </p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedActividad(null)}
                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
