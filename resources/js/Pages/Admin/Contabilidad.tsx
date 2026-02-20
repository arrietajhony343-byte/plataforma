import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

interface Transaccion {
    id: number;
    fecha: string;
    concepto: string;
    tipo: 'ingreso' | 'egreso';
    categoria: string;
    monto: number;
    referencia: string;
}

interface Rubrica {
    id: number;
    nombre: string;
    tipo: 'ingreso' | 'egreso';
    presupuesto: number;
    ejecutado: number;
}

export default function Contabilidad() {
    const [vistaActiva, setVistaActiva] = useState<'movimientos' | 'rubricas' | 'resumen'>('resumen');
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('febrero');
    const [showModal, setShowModal] = useState(false);

    const transacciones: Transaccion[] = [
        { id: 1, fecha: '2026-02-04', concepto: 'Pago mensualidad - Juan Pérez', tipo: 'ingreso', categoria: 'Mensualidades', monto: 350000, referencia: 'PAG-001' },
        { id: 2, fecha: '2026-02-04', concepto: 'Pago servicios públicos', tipo: 'egreso', categoria: 'Servicios', monto: 450000, referencia: 'EGR-001' },
        { id: 3, fecha: '2026-02-03', concepto: 'Pago mensualidad - María García', tipo: 'ingreso', categoria: 'Mensualidades', monto: 350000, referencia: 'PAG-002' },
        { id: 4, fecha: '2026-02-03', concepto: 'Compra materiales didácticos', tipo: 'egreso', categoria: 'Materiales', monto: 180000, referencia: 'EGR-002' },
        { id: 5, fecha: '2026-02-02', concepto: 'Pago nómina docentes', tipo: 'egreso', categoria: 'Nómina', monto: 5500000, referencia: 'NOM-001' },
        { id: 6, fecha: '2026-02-01', concepto: 'Certificado - Ana Martínez', tipo: 'ingreso', categoria: 'Certificados', monto: 20000, referencia: 'CER-001' },
    ];

    const rubricas: Rubrica[] = [
        { id: 1, nombre: 'Mensualidades', tipo: 'ingreso', presupuesto: 35000000, ejecutado: 28000000 },
        { id: 2, nombre: 'Matrículas', tipo: 'ingreso', presupuesto: 15000000, ejecutado: 14500000 },
        { id: 3, nombre: 'Certificados', tipo: 'ingreso', presupuesto: 500000, ejecutado: 320000 },
        { id: 4, nombre: 'Nómina Docentes', tipo: 'egreso', presupuesto: 20000000, ejecutado: 16500000 },
        { id: 5, nombre: 'Nómina Administrativa', tipo: 'egreso', presupuesto: 8000000, ejecutado: 6000000 },
        { id: 6, nombre: 'Servicios Públicos', tipo: 'egreso', presupuesto: 2000000, ejecutado: 1350000 },
        { id: 7, nombre: 'Materiales', tipo: 'egreso', presupuesto: 3000000, ejecutado: 1800000 },
        { id: 8, nombre: 'Mantenimiento', tipo: 'egreso', presupuesto: 1500000, ejecutado: 800000 },
    ];

    const totalIngresos = transacciones.filter(t => t.tipo === 'ingreso').reduce((acc, t) => acc + t.monto, 0);
    const totalEgresos = transacciones.filter(t => t.tipo === 'egreso').reduce((acc, t) => acc + t.monto, 0);
    const balance = totalIngresos - totalEgresos;

    const totalPresupuestoIngresos = rubricas.filter(r => r.tipo === 'ingreso').reduce((acc, r) => acc + r.presupuesto, 0);
    const totalEjecutadoIngresos = rubricas.filter(r => r.tipo === 'ingreso').reduce((acc, r) => acc + r.ejecutado, 0);
    const totalPresupuestoEgresos = rubricas.filter(r => r.tipo === 'egreso').reduce((acc, r) => acc + r.presupuesto, 0);
    const totalEjecutadoEgresos = rubricas.filter(r => r.tipo === 'egreso').reduce((acc, r) => acc + r.ejecutado, 0);

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Contabilidad">
            <Head title="Contabilidad" />

            <div className="space-y-4 sm:space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>📒 Contabilidad</h1>
                        <p className="text-gray-600 text-sm sm:text-base">Rubricas de pago y control contable</p>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={periodoSeleccionado}
                            onChange={(e) => setPeriodoSeleccionado(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                            <option value="febrero">Febrero 2026</option>
                            <option value="enero">Enero 2026</option>
                            <option value="diciembre">Diciembre 2025</option>
                        </select>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 bg-[#293577] text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-[#181b49] text-sm"
                        >
                            + Nuevo Movimiento
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm p-1 inline-flex flex-wrap">
                    <button
                        onClick={() => setVistaActiva('resumen')}
                        className={`px-3 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm ${vistaActiva === 'resumen' ? 'bg-[#293577] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        📊 Resumen
                    </button>
                    <button
                        onClick={() => setVistaActiva('rubricas')}
                        className={`px-3 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm ${vistaActiva === 'rubricas' ? 'bg-[#293577] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        📋 Rúbricas
                    </button>
                    <button
                        onClick={() => setVistaActiva('movimientos')}
                        className={`px-3 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm ${vistaActiva === 'movimientos' ? 'bg-[#293577] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        📝 Movimientos
                    </button>
                </div>

                {vistaActiva === 'resumen' && (
                    <>
                        {/* Stats principales */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">📈</span>
                                    <span className="text-sm text-green-700">Total Ingresos</span>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-green-600">${totalIngresos.toLocaleString()}</p>
                                <p className="text-xs text-green-600 mt-1">Este mes</p>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">📉</span>
                                    <span className="text-sm text-red-700">Total Egresos</span>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-red-600">${totalEgresos.toLocaleString()}</p>
                                <p className="text-xs text-red-600 mt-1">Este mes</p>
                            </div>
                            <div className={`${balance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'} border rounded-xl p-4 sm:p-6`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">💰</span>
                                    <span className={`text-sm ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Balance</span>
                                </div>
                                <p className={`text-2xl sm:text-3xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                    ${Math.abs(balance).toLocaleString()}
                                </p>
                                <p className={`text-xs mt-1 ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                    {balance >= 0 ? 'Superávit' : 'Déficit'}
                                </p>
                            </div>
                        </div>

                        {/* Gráfico de ejecución presupuestal */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                                <h3 className="font-bold text-gray-800 mb-4">📊 Ejecución Ingresos</h3>
                                <div className="space-y-3">
                                    {rubricas.filter(r => r.tipo === 'ingreso').map((rubrica) => {
                                        const porcentaje = (rubrica.ejecutado / rubrica.presupuesto) * 100;
                                        return (
                                            <div key={rubrica.id}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-700">{rubrica.nombre}</span>
                                                    <span className="text-gray-500">{porcentaje.toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-green-500 h-2 rounded-full" 
                                                        style={{ width: `${Math.min(porcentaje, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 pt-4 border-t flex justify-between">
                                    <span className="text-sm text-gray-600">Total</span>
                                    <span className="text-sm font-bold text-green-600">
                                        ${totalEjecutadoIngresos.toLocaleString()} / ${totalPresupuestoIngresos.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                                <h3 className="font-bold text-gray-800 mb-4">📊 Ejecución Egresos</h3>
                                <div className="space-y-3">
                                    {rubricas.filter(r => r.tipo === 'egreso').map((rubrica) => {
                                        const porcentaje = (rubrica.ejecutado / rubrica.presupuesto) * 100;
                                        return (
                                            <div key={rubrica.id}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-700">{rubrica.nombre}</span>
                                                    <span className="text-gray-500">{porcentaje.toFixed(0)}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className={`h-2 rounded-full ${porcentaje > 90 ? 'bg-red-500' : porcentaje > 70 ? 'bg-yellow-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${Math.min(porcentaje, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 pt-4 border-t flex justify-between">
                                    <span className="text-sm text-gray-600">Total</span>
                                    <span className="text-sm font-bold text-red-600">
                                        ${totalEjecutadoEgresos.toLocaleString()} / ${totalPresupuestoEgresos.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {vistaActiva === 'rubricas' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Rúbricas de Ingresos */}
                        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-800">📈 Rúbricas de Ingresos</h3>
                                <button className="text-[#293577] text-sm hover:underline">+ Agregar</button>
                            </div>
                            <div className="space-y-3">
                                {rubricas.filter(r => r.tipo === 'ingreso').map((rubrica) => (
                                    <div key={rubrica.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-800">{rubrica.nombre}</p>
                                            <p className="text-xs text-gray-500">
                                                Ejecutado: ${rubrica.ejecutado.toLocaleString()} de ${rubrica.presupuesto.toLocaleString()}
                                            </p>
                                        </div>
                                        <button className="text-gray-400 hover:text-gray-600">✏️</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Rúbricas de Egresos */}
                        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-800">📉 Rúbricas de Egresos</h3>
                                <button className="text-[#293577] text-sm hover:underline">+ Agregar</button>
                            </div>
                            <div className="space-y-3">
                                {rubricas.filter(r => r.tipo === 'egreso').map((rubrica) => (
                                    <div key={rubrica.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-800">{rubrica.nombre}</p>
                                            <p className="text-xs text-gray-500">
                                                Ejecutado: ${rubrica.ejecutado.toLocaleString()} de ${rubrica.presupuesto.toLocaleString()}
                                            </p>
                                        </div>
                                        <button className="text-gray-400 hover:text-gray-600">✏️</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {vistaActiva === 'movimientos' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full table-fixed min-w-[700px]">
                                <colgroup>
                                    <col className="w-[105px]" />
                                    <col className="w-[115px]" />
                                    <col />
                                    <col className="w-[130px]" />
                                    <col className="w-[130px]" />
                                </colgroup>
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {transacciones.map((trans) => (
                                        <tr key={trans.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{trans.fecha}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{trans.referencia}</td>
                                            <td className="px-4 py-3 text-sm text-gray-800 truncate">{trans.concepto}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded text-xs ${trans.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {trans.categoria}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 text-sm text-right font-medium ${trans.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'}`}>
                                                {trans.tipo === 'ingreso' ? '+' : '-'}${trans.monto.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Botones de exportación */}
                <div className="flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">
                        📄 Exportar PDF
                    </button>
                    <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                        📊 Exportar Excel
                    </button>
                    <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
                        🖨️ Imprimir Informe
                    </button>
                </div>
            </div>

            {/* Modal Nuevo Movimiento */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">📝 Nuevo Movimiento</h2>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <div className="flex gap-3">
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="tipo" value="ingreso" className="text-green-600" defaultChecked />
                                        <span className="text-sm">Ingreso</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="radio" name="tipo" value="egreso" className="text-red-600" />
                                        <span className="text-sm">Egreso</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría/Rúbrica</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm">
                                    <option>Mensualidades</option>
                                    <option>Matrículas</option>
                                    <option>Certificados</option>
                                    <option>Nómina</option>
                                    <option>Servicios</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Concepto</label>
                                <input
                                    type="text"
                                    placeholder="Descripción del movimiento"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Monto</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
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
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
