import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

interface Pago {
    id: number;
    estudiante: string;
    grado: string;
    concepto: string;
    monto: number;
    fecha_vencimiento: string;
    fecha_pago: string | null;
    estado: 'pagado' | 'pendiente' | 'vencido' | 'parcial';
    monto_pagado: number;
}

export default function Pagos() {
    const [filtroEstado, setFiltroEstado] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    const [showModal, setShowModal] = useState(false);

    const pagos: Pago[] = [
        { id: 1, estudiante: 'Juan Pérez', grado: '6° A', concepto: 'Mensualidad Febrero', monto: 350000, fecha_vencimiento: '2026-02-05', fecha_pago: '2026-02-03', estado: 'pagado', monto_pagado: 350000 },
        { id: 2, estudiante: 'María García', grado: '7° B', concepto: 'Mensualidad Febrero', monto: 350000, fecha_vencimiento: '2026-02-05', fecha_pago: null, estado: 'pendiente', monto_pagado: 0 },
        { id: 3, estudiante: 'Carlos López', grado: '8° A', concepto: 'Mensualidad Enero', monto: 350000, fecha_vencimiento: '2026-01-05', fecha_pago: null, estado: 'vencido', monto_pagado: 0 },
        { id: 4, estudiante: 'Ana Martínez', grado: '6° B', concepto: 'Mensualidad Febrero', monto: 350000, fecha_vencimiento: '2026-02-05', fecha_pago: '2026-02-04', estado: 'parcial', monto_pagado: 200000 },
        { id: 5, estudiante: 'Pedro Sánchez', grado: '9° A', concepto: 'Matrícula 2026', monto: 500000, fecha_vencimiento: '2026-01-15', fecha_pago: null, estado: 'vencido', monto_pagado: 0 },
        { id: 6, estudiante: 'Sofía Rodríguez', grado: '6° A', concepto: 'Mensualidad Febrero', monto: 350000, fecha_vencimiento: '2026-02-05', fecha_pago: '2026-02-01', estado: 'pagado', monto_pagado: 350000 },
    ];

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'pagado': return 'bg-green-100 text-green-800';
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'vencido': return 'bg-red-100 text-red-800';
            case 'parcial': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getEstadoTexto = (estado: string) => {
        switch (estado) {
            case 'pagado': return 'Al Día';
            case 'pendiente': return 'Pendiente';
            case 'vencido': return 'Vencido';
            case 'parcial': return 'Pago Parcial';
            default: return estado;
        }
    };

    const filteredPagos = pagos.filter(pago => {
        const matchesEstado = filtroEstado === 'todos' || pago.estado === filtroEstado;
        const matchesBusqueda = pago.estudiante.toLowerCase().includes(busqueda.toLowerCase());
        return matchesEstado && matchesBusqueda;
    });

    const totalRecaudado = pagos.reduce((acc, p) => acc + p.monto_pagado, 0);
    const totalPendiente = pagos.reduce((acc, p) => acc + (p.monto - p.monto_pagado), 0);
    const totalVencido = pagos.filter(p => p.estado === 'vencido').reduce((acc, p) => acc + p.monto, 0);

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Control de Pagos">
            <Head title="Control de Pagos" />

            <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">💰 Control de Pagos</h1>
                        <p className="text-gray-600 text-sm sm:text-base">Gestiona pagos de mensualidades y matrículas</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                            📥 Exportar
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 bg-[#293577] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#181b49] text-sm"
                        >
                            + Registrar Pago
                        </button>
                    </div>
                </div>

                {/* Stats financieros */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">✅</span>
                            <span className="text-xs sm:text-sm text-green-700">Recaudado</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-green-600">${totalRecaudado.toLocaleString()}</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">⏳</span>
                            <span className="text-xs sm:text-sm text-yellow-700">Pendiente</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-yellow-600">${totalPendiente.toLocaleString()}</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">⚠️</span>
                            <span className="text-xs sm:text-sm text-red-700">Vencido</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-red-600">${totalVencido.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">👥</span>
                            <span className="text-xs sm:text-sm text-blue-700">Morosos</span>
                        </div>
                        <p className="text-lg sm:text-2xl font-bold text-blue-600">{pagos.filter(p => p.estado === 'vencido').length}</p>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar estudiante..."
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
                        <option value="todos">Todos</option>
                        <option value="pagado">Al Día</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="vencido">Vencidos</option>
                        <option value="parcial">Pago Parcial</option>
                    </select>
                </div>

                {/* Tabla Desktop */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden sm:block">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pagado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredPagos.map((pago) => (
                                    <tr key={pago.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{pago.estudiante}</p>
                                                <p className="text-xs text-gray-500">{pago.grado}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{pago.concepto}</td>
                                        <td className="px-4 py-3 text-sm text-gray-800 text-right font-medium">${pago.monto.toLocaleString()}</td>
                                        <td className="px-4 py-3 text-sm text-right">
                                            <span className={pago.monto_pagado === pago.monto ? 'text-green-600 font-medium' : 'text-orange-600'}>
                                                ${pago.monto_pagado.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{pago.fecha_vencimiento}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoBadge(pago.estado)}`}>
                                                {getEstadoTexto(pago.estado)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                {pago.estado !== 'pagado' && (
                                                    <button className="text-green-600 hover:text-green-800 text-sm">💵 Pagar</button>
                                                )}
                                                <button className="text-[#293577] hover:text-[#181b49] text-sm">📋 Detalle</button>
                                                {pago.estado === 'vencido' && (
                                                    <button className="text-red-600 hover:text-red-800 text-sm">📧 Notificar</button>
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
                    {filteredPagos.map((pago) => (
                        <div key={pago.id} className="bg-white rounded-xl shadow-sm p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="font-medium text-gray-800">{pago.estudiante}</p>
                                    <p className="text-xs text-gray-500">{pago.grado} • {pago.concepto}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadge(pago.estado)}`}>
                                    {getEstadoTexto(pago.estado)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t">
                                <div>
                                    <p className="text-lg font-bold text-gray-800">${pago.monto.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Vence: {pago.fecha_vencimiento}</p>
                                </div>
                                <div className="flex gap-2">
                                    {pago.estado !== 'pagado' && (
                                        <button className="bg-green-100 text-green-700 px-3 py-1 rounded text-xs">💵 Pagar</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Alertas de morosos */}
                {pagos.filter(p => p.estado === 'vencido').length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <h3 className="font-bold text-red-800 mb-3">⚠️ Estudiantes con Pagos Vencidos</h3>
                        <div className="space-y-2">
                            {pagos.filter(p => p.estado === 'vencido').map((pago) => (
                                <div key={pago.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{pago.estudiante} - {pago.grado}</p>
                                        <p className="text-xs text-gray-500">{pago.concepto} - Vencido: {pago.fecha_vencimiento}</p>
                                    </div>
                                    <p className="text-red-600 font-bold">${pago.monto.toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                        <button className="mt-3 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm">
                            📧 Enviar Notificación Masiva
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Registrar Pago */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">💵 Registrar Pago</h2>
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm">
                                    <option>Mensualidad Febrero 2026</option>
                                    <option>Matrícula 2026</option>
                                    <option>Materiales</option>
                                    <option>Uniforme</option>
                                    <option>Transporte</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                                    <input
                                        type="number"
                                        placeholder="350000"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Método</label>
                                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] text-sm">
                                        <option>Efectivo</option>
                                        <option>Transferencia</option>
                                        <option>Tarjeta</option>
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
                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
                                >
                                    Registrar Pago
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
