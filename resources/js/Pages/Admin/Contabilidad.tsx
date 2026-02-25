import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

interface Props {
    resumen: {
        totalRecaudado: number;
        totalPendiente: number;
        totalVencido: number;
        totalGeneral: number;
    };
    ingresosMensuales: { mes: string; total: number }[];
    ingresosPorConcepto: { concepto: string; pagado: number; pendiente: number; vencido: number; total: number }[];
    morosos: { id: number; nombre: string; curso: string; pagosVencidos: number; deudaTotal: number }[];
    ultimosPagos: { id: number; estudiante: string; concepto: string; monto: number; fecha: string; metodo: string; referencia: string }[];
}

export default function Contabilidad({ resumen, ingresosMensuales, ingresosPorConcepto, morosos, ultimosPagos }: Props) {
    const [vistaActiva, setVistaActiva] = useState<'movimientos' | 'conceptos' | 'resumen' | 'morosos'>('resumen');

    const maxMensual = useMemo(() => Math.max(...ingresosMensuales.map(m => m.total), 1), [ingresosMensuales]);

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Contabilidad">
            <Head title="Contabilidad" />

            <div className="space-y-4 sm:space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Contabilidad</h1>
                        <p className="text-gray-600 text-sm sm:text-base">Rubricas de pago y control contable</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm p-1 inline-flex flex-wrap">
                    <button
                        onClick={() => setVistaActiva('resumen')}
                        className={`px-3 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm ${vistaActiva === 'resumen' ? 'bg-[#293577] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Resumen
                    </button>
                    <button
                        onClick={() => setVistaActiva('conceptos')}
                        className={`px-3 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm ${vistaActiva === 'conceptos' ? 'bg-[#293577] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Por Concepto
                    </button>
                    <button
                        onClick={() => setVistaActiva('movimientos')}
                        className={`px-3 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm ${vistaActiva === 'movimientos' ? 'bg-[#293577] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Últimos Pagos
                    </button>
                    <button
                        onClick={() => setVistaActiva('morosos')}
                        className={`px-3 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm ${vistaActiva === 'morosos' ? 'bg-[#293577] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        Morosos
                    </button>
                </div>

                {vistaActiva === 'resumen' && (
                    <>
                        {/* Stats principales */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl"></span>
                                    <span className="text-sm text-green-700">Total Recaudado</span>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-green-600">${resumen.totalRecaudado.toLocaleString()}</p>
                                <p className="text-xs text-green-600 mt-1">Pagos realizados</p>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 sm:p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl"></span>
                                    <span className="text-sm text-yellow-700">Pendiente</span>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-yellow-600">${resumen.totalPendiente.toLocaleString()}</p>
                                <p className="text-xs text-yellow-600 mt-1">Por cobrar</p>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 sm:p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl"></span>
                                    <span className="text-sm text-red-700">Vencido</span>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-red-600">${resumen.totalVencido.toLocaleString()}</p>
                                <p className="text-xs text-red-600 mt-1">Pagos atrasados</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl"></span>
                                    <span className="text-sm text-blue-700">Total General</span>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-blue-600">${resumen.totalGeneral.toLocaleString()}</p>
                                <p className="text-xs text-blue-600 mt-1">Facturado este año</p>
                            </div>
                        </div>

                        {/* Gráfico ingresos mensuales */}
                        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                            <h3 className="font-bold text-gray-800 mb-4">Ingresos Mensuales</h3>
                            <div className="flex items-end gap-2 h-48">
                                {ingresosMensuales.map((m, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <span className="text-[10px] text-gray-500 font-medium">${(m.total / 1000).toFixed(0)}k</span>
                                        <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: '140px' }}>
                                            <div
                                                className="absolute bottom-0 w-full bg-gradient-to-t from-[#293577] to-[#4a5cb5] rounded-t-lg transition-all"
                                                style={{ height: `${maxMensual > 0 ? (m.total / maxMensual) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-gray-500">{m.mes}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {vistaActiva === 'conceptos' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pagado</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pendiente</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Vencido</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {ingresosPorConcepto.map((c, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-800">{c.concepto}</td>
                                            <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">${c.pagado.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-right text-yellow-600 font-medium">${c.pendiente.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">${c.vencido.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-right font-bold text-gray-800">${c.total.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {ultimosPagos.map((pago) => (
                                        <tr key={pago.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{pago.fecha}</td>
                                            <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{pago.referencia ?? '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-800 truncate">{pago.estudiante}</td>
                                            <td className="px-4 py-3">
                                                <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                                    {pago.concepto}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                                                +${pago.monto.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {vistaActiva === 'morosos' && (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        {morosos.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-lg font-bold text-gray-400">Sin morosos</p>
                                <p className="text-sm text-gray-400 mt-1">No hay estudiantes con pagos vencidos</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[500px]">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Pagos Vencidos</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deuda Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {morosos.map((m) => (
                                            <tr key={m.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-800">{m.nombre}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{m.curso}</td>
                                                <td className="px-4 py-3 text-sm text-center">
                                                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">{m.pagosVencidos}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-red-600">${m.deudaTotal.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Botones de exportación */}
                <div className="flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm">
                        Exportar PDF
                    </button>
                    <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                        Exportar Excel
                    </button>
                    <button className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm">
                        Imprimir Informe
                    </button>
                </div>
            </div>
        </SidebarLayout>
    );
}
