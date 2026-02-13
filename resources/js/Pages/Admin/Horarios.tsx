import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

interface Clase {
    id: number;
    materia: string;
    curso: string;
    profesor: string;
    color: string;
}

interface HorarioSlot {
    hora: string;
    horaFin: string;
    lunes?: Clase;
    martes?: Clase;
    miercoles?: Clase;
    jueves?: Clase;
    viernes?: Clase;
}

export default function Horarios() {
    const [profesorSeleccionado, setProfesorSeleccionado] = useState('todos');
    const [showModal, setShowModal] = useState(false);
    const [vistaActiva, setVistaActiva] = useState<'horarios' | 'profesores'>('horarios');

    const profesores = [
        { id: 1, nombre: 'María García', materias: ['Matemáticas', 'Física'], horas: 20, color: 'blue' },
        { id: 2, nombre: 'Juan Pérez', materias: ['Español', 'Literatura'], horas: 18, color: 'green' },
        { id: 3, nombre: 'Carlos López', materias: ['Historia', 'Geografía'], horas: 16, color: 'purple' },
        { id: 4, nombre: 'Ana Martínez', materias: ['Inglés'], horas: 22, color: 'orange' },
        { id: 5, nombre: 'Pedro Sánchez', materias: ['Ciencias', 'Biología'], horas: 18, color: 'red' },
    ];

    const horarioData: HorarioSlot[] = [
        {
            hora: '7:00', horaFin: '7:50',
            lunes: { id: 1, materia: 'Matemáticas', curso: '6° A', profesor: 'María García', color: 'bg-blue-100 border-blue-300' },
            martes: { id: 2, materia: 'Español', curso: '7° A', profesor: 'Juan Pérez', color: 'bg-green-100 border-green-300' },
            miercoles: { id: 3, materia: 'Historia', curso: '8° A', profesor: 'Carlos López', color: 'bg-purple-100 border-purple-300' },
            jueves: { id: 4, materia: 'Inglés', curso: '6° B', profesor: 'Ana Martínez', color: 'bg-orange-100 border-orange-300' },
            viernes: { id: 5, materia: 'Ciencias', curso: '7° B', profesor: 'Pedro Sánchez', color: 'bg-red-100 border-red-300' },
        },
        {
            hora: '7:50', horaFin: '8:40',
            lunes: { id: 6, materia: 'Física', curso: '8° A', profesor: 'María García', color: 'bg-blue-100 border-blue-300' },
            martes: { id: 7, materia: 'Literatura', curso: '6° A', profesor: 'Juan Pérez', color: 'bg-green-100 border-green-300' },
            jueves: { id: 8, materia: 'Matemáticas', curso: '7° A', profesor: 'María García', color: 'bg-blue-100 border-blue-300' },
            viernes: { id: 9, materia: 'Geografía', curso: '6° B', profesor: 'Carlos López', color: 'bg-purple-100 border-purple-300' },
        },
        {
            hora: '8:40', horaFin: '9:30',
            lunes: { id: 10, materia: 'Inglés', curso: '7° A', profesor: 'Ana Martínez', color: 'bg-orange-100 border-orange-300' },
            miercoles: { id: 11, materia: 'Español', curso: '8° A', profesor: 'Juan Pérez', color: 'bg-green-100 border-green-300' },
            jueves: { id: 12, materia: 'Biología', curso: '6° A', profesor: 'Pedro Sánchez', color: 'bg-red-100 border-red-300' },
            viernes: { id: 13, materia: 'Matemáticas', curso: '8° B', profesor: 'María García', color: 'bg-blue-100 border-blue-300' },
        },
        {
            hora: '9:30', horaFin: '10:00',
        },
        {
            hora: '10:00', horaFin: '10:50',
            lunes: { id: 14, materia: 'Historia', curso: '6° A', profesor: 'Carlos López', color: 'bg-purple-100 border-purple-300' },
            martes: { id: 15, materia: 'Ciencias', curso: '8° A', profesor: 'Pedro Sánchez', color: 'bg-red-100 border-red-300' },
            miercoles: { id: 16, materia: 'Inglés', curso: '6° A', profesor: 'Ana Martínez', color: 'bg-orange-100 border-orange-300' },
            jueves: { id: 17, materia: 'Español', curso: '7° B', profesor: 'Juan Pérez', color: 'bg-green-100 border-green-300' },
            viernes: { id: 18, materia: 'Física', curso: '6° B', profesor: 'María García', color: 'bg-blue-100 border-blue-300' },
        },
        {
            hora: '10:50', horaFin: '11:40',
            lunes: { id: 19, materia: 'Biología', curso: '7° A', profesor: 'Pedro Sánchez', color: 'bg-red-100 border-red-300' },
            martes: { id: 20, materia: 'Matemáticas', curso: '6° B', profesor: 'María García', color: 'bg-blue-100 border-blue-300' },
            miercoles: { id: 21, materia: 'Geografía', curso: '7° A', profesor: 'Carlos López', color: 'bg-purple-100 border-purple-300' },
            viernes: { id: 22, materia: 'Inglés', curso: '8° A', profesor: 'Ana Martínez', color: 'bg-orange-100 border-orange-300' },
        },
    ];

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

    const getClaseForDay = (slot: HorarioSlot, dia: string): Clase | undefined => {
        switch (dia.toLowerCase()) {
            case 'lunes': return slot.lunes;
            case 'martes': return slot.martes;
            case 'miércoles': return slot.miercoles;
            case 'jueves': return slot.jueves;
            case 'viernes': return slot.viernes;
            default: return undefined;
        }
    };

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Horarios Profesores">
            <Head title="Horarios Profesores" />

            <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">📅 Horarios de Profesores</h1>
                        <p className="text-gray-600 text-sm sm:text-base">Establece y gestiona los horarios de clases</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-[#293577] text-white px-4 py-2 rounded-lg hover:bg-[#181b49] text-sm"
                    >
                        + Asignar Clase
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm p-1 inline-flex">
                    <button
                        onClick={() => setVistaActiva('horarios')}
                        className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm ${vistaActiva === 'horarios' ? 'bg-[#293577] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        📅 Horario General
                    </button>
                    <button
                        onClick={() => setVistaActiva('profesores')}
                        className={`px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm ${vistaActiva === 'profesores' ? 'bg-[#293577] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        👨‍🏫 Por Profesor
                    </button>
                </div>

                {vistaActiva === 'horarios' && (
                    <>
                        {/* Filtro por profesor */}
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    value={profesorSeleccionado}
                                    onChange={(e) => setProfesorSeleccionado(e.target.value)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                    <option value="todos">Todos los profesores</option>
                                    {profesores.map(p => (
                                        <option key={p.id} value={p.nombre}>{p.nombre}</option>
                                    ))}
                                </select>
                                <button className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">
                                    🖨️ Imprimir Horario
                                </button>
                            </div>
                        </div>

                        {/* Tabla de horario */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px]">
                                    <thead className="bg-[#181b49] text-white">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-medium uppercase w-24">Hora</th>
                                            {dias.map(dia => (
                                                <th key={dia} className="px-3 py-3 text-center text-xs font-medium uppercase">{dia}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {horarioData.map((slot, idx) => {
                                            const isDescanso = !slot.lunes && !slot.martes && !slot.miercoles && !slot.jueves && !slot.viernes;
                                            return (
                                                <tr key={idx} className={isDescanso ? 'bg-gray-100' : ''}>
                                                    <td className="px-3 py-2 text-xs text-gray-600 whitespace-nowrap">
                                                        <div className="font-medium">{slot.hora}</div>
                                                        <div className="text-gray-400">{slot.horaFin}</div>
                                                    </td>
                                                    {isDescanso ? (
                                                        <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500 font-medium">
                                                            ☕ DESCANSO
                                                        </td>
                                                    ) : (
                                                        dias.map(dia => {
                                                            const clase = getClaseForDay(slot, dia);
                                                            const filtroActivo = profesorSeleccionado !== 'todos';
                                                            const mostrar = !filtroActivo || (clase?.profesor === profesorSeleccionado);
                                                            
                                                            return (
                                                                <td key={dia} className="px-2 py-2">
                                                                    {clase && mostrar ? (
                                                                        <div className={`p-2 rounded-lg border ${clase.color} cursor-pointer hover:shadow-md transition-shadow`}>
                                                                            <p className="text-xs font-bold text-gray-800">{clase.materia}</p>
                                                                            <p className="text-xs text-gray-600">{clase.curso}</p>
                                                                            <p className="text-xs text-gray-500 truncate">{clase.profesor}</p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="p-2 border border-dashed border-gray-200 rounded-lg text-center cursor-pointer hover:bg-gray-50">
                                                                            <span className="text-gray-300 text-xs">+</span>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            );
                                                        })
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Leyenda */}
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Leyenda de Profesores</h3>
                            <div className="flex flex-wrap gap-3">
                                {profesores.map(p => (
                                    <div key={p.id} className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded bg-${p.color}-200 border border-${p.color}-300`}></div>
                                        <span className="text-xs text-gray-600">{p.nombre}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {vistaActiva === 'profesores' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {profesores.map(profesor => (
                            <div key={profesor.id} className="bg-white rounded-xl shadow-sm p-4 sm:p-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-[#181b49] rounded-full flex items-center justify-center text-white font-bold">
                                        {profesor.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{profesor.nombre}</h3>
                                        <p className="text-xs text-gray-500">{profesor.materias.join(', ')}</p>
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-600">Horas semanales</span>
                                        <span className="font-bold text-[#293577]">{profesor.horas}h</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-600">Materias</span>
                                        <span className="font-bold text-gray-800">{profesor.materias.length}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${profesor.horas >= 20 ? 'bg-red-500' : profesor.horas >= 16 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                            style={{ width: `${(profesor.horas / 24) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-gray-500 text-center">
                                        {profesor.horas >= 20 ? '⚠️ Carga alta' : profesor.horas >= 16 ? '📊 Carga media' : '✅ Carga baja'}
                                    </p>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button 
                                        onClick={() => setProfesorSeleccionado(profesor.nombre)}
                                        className="flex-1 bg-[#293577] text-white py-2 rounded-lg text-sm hover:bg-[#181b49]"
                                    >
                                        Ver Horario
                                    </button>
                                    <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                                        ✏️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Asignar Clase */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">📅 Asignar Clase</h2>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Profesor</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm">
                                    {profesores.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Materia</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm">
                                    <option>Matemáticas</option>
                                    <option>Español</option>
                                    <option>Ciencias</option>
                                    <option>Historia</option>
                                    <option>Inglés</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm">
                                    <option>6° A</option>
                                    <option>6° B</option>
                                    <option>7° A</option>
                                    <option>7° B</option>
                                    <option>8° A</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Día</label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm">
                                        {dias.map(d => (
                                            <option key={d} value={d}>{d}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm">
                                        <option>7:00 - 7:50</option>
                                        <option>7:50 - 8:40</option>
                                        <option>8:40 - 9:30</option>
                                        <option>10:00 - 10:50</option>
                                        <option>10:50 - 11:40</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#293577] text-white px-4 py-2 rounded-lg hover:bg-[#181b49] text-sm"
                                >
                                    Asignar Clase
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
