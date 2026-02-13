import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

interface Certificado {
    id: number;
    tipo: string;
    estudiante: string;
    grado: string;
    fecha_solicitud: string;
    fecha_entrega: string | null;
    estado: 'pendiente' | 'en_proceso' | 'listo' | 'entregado';
}

export default function Certificados() {
    const [showModal, setShowModal] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [busqueda, setBusqueda] = useState('');

    const certificados: Certificado[] = [
        { id: 1, tipo: 'Constancia de Estudios', estudiante: 'Juan Pérez', grado: '6° A', fecha_solicitud: '2026-02-01', fecha_entrega: null, estado: 'pendiente' },
        { id: 2, tipo: 'Certificado de Notas', estudiante: 'María García', grado: '7° B', fecha_solicitud: '2026-01-28', fecha_entrega: '2026-02-02', estado: 'entregado' },
        { id: 3, tipo: 'Constancia de Matrícula', estudiante: 'Carlos López', grado: '8° A', fecha_solicitud: '2026-02-03', fecha_entrega: null, estado: 'en_proceso' },
        { id: 4, tipo: 'Certificado de Conducta', estudiante: 'Ana Martínez', grado: '6° B', fecha_solicitud: '2026-02-04', fecha_entrega: null, estado: 'listo' },
        { id: 5, tipo: 'Constancia de Estudios', estudiante: 'Pedro Sánchez', grado: '9° A', fecha_solicitud: '2026-02-04', fecha_entrega: null, estado: 'pendiente' },
    ];

    const tiposCertificado = [
        { id: 'constancia_estudios', nombre: 'Constancia de Estudios', precio: 15000 },
        { id: 'certificado_notas', nombre: 'Certificado de Notas', precio: 20000 },
        { id: 'constancia_matricula', nombre: 'Constancia de Matrícula', precio: 10000 },
        { id: 'certificado_conducta', nombre: 'Certificado de Conducta', precio: 15000 },
        { id: 'paz_y_salvo', nombre: 'Paz y Salvo', precio: 5000 },
    ];

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'en_proceso': return 'bg-blue-100 text-blue-800';
            case 'listo': return 'bg-green-100 text-green-800';
            case 'entregado': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getEstadoTexto = (estado: string) => {
        switch (estado) {
            case 'pendiente': return 'Pendiente';
            case 'en_proceso': return 'En Proceso';
            case 'listo': return 'Listo para Entrega';
            case 'entregado': return 'Entregado';
            default: return estado;
        }
    };

    const filteredCertificados = certificados.filter(cert => {
        const matchesEstado = filtroEstado === 'todos' || cert.estado === filtroEstado;
        const matchesBusqueda = cert.estudiante.toLowerCase().includes(busqueda.toLowerCase()) ||
                                cert.tipo.toLowerCase().includes(busqueda.toLowerCase());
        return matchesEstado && matchesBusqueda;
    });

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Certificados">
            <Head title="Certificados" />

            <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">📜 Gestión de Certificados</h1>
                        <p className="text-gray-600 text-sm sm:text-base">Genera y administra certificados y constancias</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-[#293577] text-white px-4 py-2 rounded-lg hover:bg-[#181b49] text-sm sm:text-base"
                    >
                        <span>+</span> Nueva Solicitud
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{certificados.filter(c => c.estado === 'pendiente').length}</p>
                        <p className="text-xs sm:text-sm text-yellow-700">Pendientes</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600">{certificados.filter(c => c.estado === 'en_proceso').length}</p>
                        <p className="text-xs sm:text-sm text-blue-700">En Proceso</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-green-600">{certificados.filter(c => c.estado === 'listo').length}</p>
                        <p className="text-xs sm:text-sm text-green-700">Listos</p>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 sm:p-4 text-center">
                        <p className="text-2xl sm:text-3xl font-bold text-gray-600">{certificados.filter(c => c.estado === 'entregado').length}</p>
                        <p className="text-xs sm:text-sm text-gray-700">Entregados</p>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar estudiante o tipo de certificado..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm"
                        />
                    </div>
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm"
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="listo">Listos</option>
                        <option value="entregado">Entregados</option>
                    </select>
                </div>

                {/* Tabla Desktop */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden sm:block">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitud</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredCertificados.map((cert) => (
                                    <tr key={cert.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">📄</span>
                                                <span className="text-sm font-medium text-gray-800">{cert.tipo}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{cert.estudiante}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{cert.grado}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{cert.fecha_solicitud}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(cert.estado)}`}>
                                                {getEstadoTexto(cert.estado)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {cert.estado === 'listo' && (
                                                    <button className="text-green-600 hover:text-green-800 text-sm">📥 Descargar</button>
                                                )}
                                                {cert.estado !== 'entregado' && (
                                                    <button className="text-[#293577] hover:text-[#181b49] text-sm">✏️ Gestionar</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cards Mobile */}
                <div className="sm:hidden space-y-3">
                    {filteredCertificados.map((cert) => (
                        <div key={cert.id} className="bg-white rounded-xl shadow-sm p-4">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">📄</span>
                                    <div>
                                        <p className="font-medium text-gray-800 text-sm">{cert.tipo}</p>
                                        <p className="text-xs text-gray-500">{cert.fecha_solicitud}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(cert.estado)}`}>
                                    {getEstadoTexto(cert.estado)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t">
                                <div>
                                    <p className="text-sm text-gray-800">{cert.estudiante}</p>
                                    <p className="text-xs text-gray-500">{cert.grado}</p>
                                </div>
                                <div className="flex gap-2">
                                    {cert.estado === 'listo' && (
                                        <button className="text-green-600 text-xs">📥</button>
                                    )}
                                    <button className="text-[#293577] text-xs">✏️</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tipos de certificado disponibles */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <h2 className="font-bold text-gray-800 mb-4">📋 Tipos de Certificados Disponibles</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tiposCertificado.map((tipo) => (
                            <div key={tipo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm text-gray-700">{tipo.nombre}</span>
                                <span className="text-sm font-medium text-green-600">${tipo.precio.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal Nueva Solicitud */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Nueva Solicitud de Certificado</h2>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante</label>
                                <input
                                    type="text"
                                    placeholder="Buscar estudiante..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Certificado</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm">
                                    {tiposCertificado.map((tipo) => (
                                        <option key={tipo.id} value={tipo.id}>{tipo.nombre} - ${tipo.precio.toLocaleString()}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm resize-none"
                                    placeholder="Notas adicionales..."
                                />
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
                                    Crear Solicitud
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
