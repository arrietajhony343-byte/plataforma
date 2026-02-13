import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

interface Estudiante {
    id: number;
    nombre: string;
    identificacion: string;
    grado: string;
    seccion: string;
    acudiente: string;
    telefono: string;
    email: string;
    estado: 'activo' | 'inactivo' | 'retirado';
    promedio: number;
    pagos: 'al_dia' | 'pendiente' | 'moroso';
    observaciones: number;
}

export default function Estudiantes() {
    const [busqueda, setBusqueda] = useState('');
    const [filtroGrado, setFiltroGrado] = useState('todos');
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState<Estudiante | null>(null);

    const estudiantes: Estudiante[] = [
        { id: 1, nombre: 'Juan Pérez García', identificacion: '1001234567', grado: '6°', seccion: 'A', acudiente: 'Pedro Pérez', telefono: '3001234567', email: 'padre@email.com', estado: 'activo', promedio: 4.2, pagos: 'al_dia', observaciones: 2 },
        { id: 2, nombre: 'María García López', identificacion: '1007654321', grado: '6°', seccion: 'A', acudiente: 'Ana López', telefono: '3109876543', email: 'madre@email.com', estado: 'activo', promedio: 4.5, pagos: 'al_dia', observaciones: 0 },
        { id: 3, nombre: 'Carlos López Martínez', identificacion: '1002345678', grado: '7°', seccion: 'B', acudiente: 'Luis López', telefono: '3201234567', email: 'tutor@email.com', estado: 'activo', promedio: 3.8, pagos: 'pendiente', observaciones: 3 },
        { id: 4, nombre: 'Ana Martínez Rodríguez', identificacion: '1003456789', grado: '8°', seccion: 'A', acudiente: 'María Rodríguez', telefono: '3112345678', email: 'acudiente@email.com', estado: 'inactivo', promedio: 3.5, pagos: 'moroso', observaciones: 5 },
        { id: 5, nombre: 'Pedro Sánchez Díaz', identificacion: '1004567890', grado: '6°', seccion: 'B', acudiente: 'José Sánchez', telefono: '3003456789', email: 'padre2@email.com', estado: 'activo', promedio: 4.0, pagos: 'al_dia', observaciones: 1 },
        { id: 6, nombre: 'Sofía Rodríguez Castro', identificacion: '1005678901', grado: '9°', seccion: 'A', acudiente: 'Carmen Castro', telefono: '3154567890', email: 'madre2@email.com', estado: 'activo', promedio: 4.8, pagos: 'al_dia', observaciones: 0 },
        { id: 7, nombre: 'Luis Hernández Vargas', identificacion: '1006789012', grado: '7°', seccion: 'A', acudiente: 'Fernando Hernández', telefono: '3205678901', email: 'padre3@email.com', estado: 'retirado', promedio: 3.2, pagos: 'moroso', observaciones: 8 },
    ];

    const filteredEstudiantes = estudiantes.filter(est => {
        const matchesBusqueda = est.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                                est.identificacion.includes(busqueda);
        const matchesGrado = filtroGrado === 'todos' || est.grado === filtroGrado;
        const matchesEstado = filtroEstado === 'todos' || est.estado === filtroEstado;
        return matchesBusqueda && matchesGrado && matchesEstado;
    });

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'activo': return 'bg-green-100 text-green-800';
            case 'inactivo': return 'bg-yellow-100 text-yellow-800';
            case 'retirado': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPagosBadge = (pagos: string) => {
        switch (pagos) {
            case 'al_dia': return 'bg-green-100 text-green-800';
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'moroso': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPromedioColor = (promedio: number) => {
        if (promedio >= 4.0) return 'text-green-600';
        if (promedio >= 3.0) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Buscar Estudiantes">
            <Head title="Buscar Estudiantes" />

            <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">🔍 Buscar Estudiantes</h1>
                        <p className="text-gray-600 text-sm sm:text-base">Encuentra y gestiona información de estudiantes</p>
                    </div>
                    <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                        📥 Exportar Lista
                    </button>
                </div>

                {/* Barra de búsqueda principal */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
                            <input
                                type="text"
                                placeholder="Buscar por nombre o número de identificación..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm"
                            />
                        </div>
                        <select
                            value={filtroGrado}
                            onChange={(e) => setFiltroGrado(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="todos">Todos los grados</option>
                            <option value="6°">6° Grado</option>
                            <option value="7°">7° Grado</option>
                            <option value="8°">8° Grado</option>
                            <option value="9°">9° Grado</option>
                        </select>
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            className="px-4 py-3 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="activo">Activos</option>
                            <option value="inactivo">Inactivos</option>
                            <option value="retirado">Retirados</option>
                        </select>
                    </div>
                    <p className="mt-3 text-sm text-gray-500">
                        {filteredEstudiantes.length} estudiante(s) encontrado(s)
                    </p>
                </div>

                {/* Resultados */}
                <div className="grid gap-3">
                    {filteredEstudiantes.map((estudiante) => (
                        <div 
                            key={estudiante.id} 
                            className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => setEstudianteSeleccionado(estudiante)}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-[#181b49] rounded-full flex items-center justify-center text-white font-bold text-lg">
                                        {estudiante.nombre.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{estudiante.nombre}</h3>
                                        <p className="text-sm text-gray-500">ID: {estudiante.identificacion} • {estudiante.grado} {estudiante.seccion}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getEstadoBadge(estudiante.estado)}`}>
                                        {estudiante.estado}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPagosBadge(estudiante.pagos)}`}>
                                        {estudiante.pagos === 'al_dia' ? '💰 Al día' : estudiante.pagos === 'pendiente' ? '⏳ Pendiente' : '⚠️ Moroso'}
                                    </span>
                                    <span className={`px-3 py-1 bg-gray-100 rounded-full text-xs font-bold ${getPromedioColor(estudiante.promedio)}`}>
                                        Prom: {estudiante.promedio.toFixed(1)}
                                    </span>
                                    {estudiante.observaciones > 0 && (
                                        <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                            📝 {estudiante.observaciones} obs.
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredEstudiantes.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <span className="text-4xl">🔍</span>
                        <p className="mt-4 text-gray-600">No se encontraron estudiantes con los criterios de búsqueda</p>
                    </div>
                )}
            </div>

            {/* Modal Detalle Estudiante */}
            {estudianteSeleccionado && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-[#181b49] rounded-full flex items-center justify-center text-white font-bold text-2xl">
                                    {estudianteSeleccionado.nombre.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{estudianteSeleccionado.nombre}</h2>
                                    <p className="text-gray-500">ID: {estudianteSeleccionado.identificacion}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEstudianteSeleccionado(null)}
                                className="text-gray-400 hover:text-gray-600 text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        {/* Info del estudiante */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Grado y Sección</p>
                                    <p className="font-medium text-gray-800">{estudianteSeleccionado.grado} {estudianteSeleccionado.seccion}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Estado</p>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getEstadoBadge(estudianteSeleccionado.estado)}`}>
                                        {estudianteSeleccionado.estado}
                                    </span>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Promedio Actual</p>
                                    <p className={`text-2xl font-bold ${getPromedioColor(estudianteSeleccionado.promedio)}`}>
                                        {estudianteSeleccionado.promedio.toFixed(1)}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Acudiente</p>
                                    <p className="font-medium text-gray-800">{estudianteSeleccionado.acudiente}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Teléfono</p>
                                    <p className="font-medium text-gray-800">📞 {estudianteSeleccionado.telefono}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="font-medium text-gray-800 text-sm">✉️ {estudianteSeleccionado.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Acciones rápidas */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                            <button className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 text-center">
                                📊 Ver Notas
                            </button>
                            <button className="p-3 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 text-center">
                                📄 Boletín
                            </button>
                            <button className="p-3 bg-orange-50 text-orange-700 rounded-lg text-sm hover:bg-orange-100 text-center">
                                📝 Observador
                            </button>
                            <button className="p-3 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 text-center">
                                💰 Pagos
                            </button>
                        </div>

                        {/* Estado de pagos */}
                        <div className={`p-4 rounded-lg mb-4 ${estudianteSeleccionado.pagos === 'al_dia' ? 'bg-green-50' : estudianteSeleccionado.pagos === 'pendiente' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-800">Estado de Pagos</p>
                                    <p className="text-sm text-gray-600">
                                        {estudianteSeleccionado.pagos === 'al_dia' ? '✅ Todos los pagos al día' :
                                         estudianteSeleccionado.pagos === 'pendiente' ? '⏳ Tiene pagos pendientes' :
                                         '⚠️ Estudiante en mora'}
                                    </p>
                                </div>
                                <span className={`px-4 py-2 rounded-lg text-sm font-medium ${getPagosBadge(estudianteSeleccionado.pagos)}`}>
                                    {estudianteSeleccionado.pagos === 'al_dia' ? 'Al Día' : estudianteSeleccionado.pagos === 'pendiente' ? 'Pendiente' : 'Moroso'}
                                </span>
                            </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex flex-wrap gap-2">
                            <button className="flex-1 bg-[#293577] text-white py-2 rounded-lg text-sm hover:bg-[#181b49]">
                                ✏️ Editar Información
                            </button>
                            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                                📧 Enviar Mensaje
                            </button>
                            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50">
                                🚫 Bloquear
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
