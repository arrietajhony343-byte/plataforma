import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { padreMenuItems } from '@/Config/padreMenu';

interface Mensualidad {
    id: number;
    concepto: string;
    mes: string;
    monto: number;
    vencimiento: string;
    estado: 'pagado' | 'pendiente' | 'vencido';
    fecha_pago?: string;
    referencia?: string;
}

export default function Pagos() {
    const [showPayModal, setShowPayModal] = useState(false);
    const [selectedPago, setSelectedPago] = useState<Mensualidad | null>(null);
    const [metodoPago, setMetodoPago] = useState('tarjeta');
    const [showConfirmacion, setShowConfirmacion] = useState(false);

    const mensualidades: Mensualidad[] = [
        { id: 1, concepto: 'Matrícula 2026', mes: 'Matrícula', monto: 500000, vencimiento: '2026-01-10', estado: 'pagado', fecha_pago: '2026-01-08', referencia: 'PAG-2026-0001' },
        { id: 2, concepto: 'Mensualidad Enero', mes: 'Enero', monto: 250000, vencimiento: '2026-01-31', estado: 'pagado', fecha_pago: '2026-01-25', referencia: 'PAG-2026-0012' },
        { id: 3, concepto: 'Mensualidad Febrero', mes: 'Febrero', monto: 250000, vencimiento: '2026-02-15', estado: 'pendiente' },
        { id: 4, concepto: 'Mensualidad Marzo', mes: 'Marzo', monto: 250000, vencimiento: '2026-03-15', estado: 'pendiente' },
        { id: 5, concepto: 'Mensualidad Abril', mes: 'Abril', monto: 250000, vencimiento: '2026-04-15', estado: 'pendiente' },
        { id: 6, concepto: 'Mensualidad Mayo', mes: 'Mayo', monto: 250000, vencimiento: '2026-05-15', estado: 'pendiente' },
        { id: 7, concepto: 'Mensualidad Junio', mes: 'Junio', monto: 250000, vencimiento: '2026-06-15', estado: 'pendiente' },
    ];

    const formatMonto = (monto: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(monto);
    };

    const totalPagado = mensualidades.filter(m => m.estado === 'pagado').reduce((s, m) => s + m.monto, 0);
    const totalPendiente = mensualidades.filter(m => m.estado !== 'pagado').reduce((s, m) => s + m.monto, 0);
    const totalGeneral = mensualidades.reduce((s, m) => s + m.monto, 0);
    const proximoPago = mensualidades.find(m => m.estado !== 'pagado');

    const handlePagar = (pago: Mensualidad) => {
        setSelectedPago(pago);
        setShowPayModal(true);
    };

    const procesarPago = () => {
        setShowPayModal(false);
        setShowConfirmacion(true);
        setTimeout(() => setShowConfirmacion(false), 5000);
    };

    return (
        <SidebarLayout menuItems={padreMenuItems} title="Pagos">
            <Head title="Pagos" />

            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Pagos</h1>
                    <p className="text-gray-600">Realiza pagos y consulta tu estado de cuenta</p>
                </div>

                {/* Confirmación de pago exitoso */}
                {showConfirmacion && (
                    <div className="bg-green-50 border-l-4 border-green-500 rounded-r-xl p-4 animate-pulse">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">✅</span>
                            <div>
                                <p className="font-bold text-green-800">¡Pago procesado exitosamente!</p>
                                <p className="text-sm text-green-700">Se ha generado un comprobante. Puede verlo en la sección de Comprobantes.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Resumen financiero */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
                        <p className="text-sm text-gray-500">Total Pagado</p>
                        <p className="text-2xl font-bold text-green-600">{formatMonto(totalPagado)}</p>
                        <p className="text-xs text-gray-400 mt-1">{mensualidades.filter(m => m.estado === 'pagado').length} pagos realizados</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-yellow-500">
                        <p className="text-sm text-gray-500">Total Pendiente</p>
                        <p className="text-2xl font-bold text-yellow-600">{formatMonto(totalPendiente)}</p>
                        <p className="text-xs text-gray-400 mt-1">{mensualidades.filter(m => m.estado !== 'pagado').length} pagos pendientes</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
                        <p className="text-sm text-gray-500">Total Año Escolar</p>
                        <p className="text-2xl font-bold text-blue-600">{formatMonto(totalGeneral)}</p>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full">
                            <div className="h-2 bg-green-500 rounded-full" style={{ width: `${(totalPagado / totalGeneral) * 100}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{Math.round((totalPagado / totalGeneral) * 100)}% completado</p>
                    </div>
                </div>

                {/* Próximo pago destacado */}
                {proximoPago && (
                    <div className={`rounded-xl shadow-sm p-5 ${
                        new Date(proximoPago.vencimiento) < new Date() ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200'
                    }`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${
                                    new Date(proximoPago.vencimiento) < new Date() ? 'bg-red-100' : 'bg-blue-100'
                                }`}>
                                    💳
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{proximoPago.concepto}</h3>
                                    <p className="text-sm text-gray-600">Vencimiento: {new Date(proximoPago.vencimiento).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    <p className="text-2xl font-bold text-gray-800 mt-1">{formatMonto(proximoPago.monto)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handlePagar(proximoPago)}
                                className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium text-lg shadow-sm"
                            >
                                💳 Pagar ahora
                            </button>
                        </div>
                    </div>
                )}

                {/* Lista de mensualidades */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b bg-gray-50">
                        <h3 className="font-semibold text-gray-700">Estado de Mensualidades</h3>
                    </div>

                    {/* Desktop */}
                    <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Monto</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fecha Pago</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {mensualidades.map(m => (
                                    <tr key={m.id} className={`hover:bg-gray-50 ${m.estado === 'vencido' ? 'bg-red-50' : ''}`}>
                                        <td className="px-4 py-3 font-medium text-gray-800">{m.concepto}</td>
                                        <td className="px-4 py-3 text-center font-medium text-gray-800">{formatMonto(m.monto)}</td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-600">{m.vencimiento}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                m.estado === 'pagado' ? 'bg-green-100 text-green-800' :
                                                m.estado === 'vencido' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {m.estado === 'pagado' ? '✓ Pagado' : m.estado === 'vencido' ? '⚠ Vencido' : '⏳ Pendiente'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-600">{m.fecha_pago || '—'}</td>
                                        <td className="px-4 py-3 text-right">
                                            {m.estado === 'pagado' ? (
                                                <a href="/padre/comprobantes" className="text-[#293577] hover:underline text-sm">Ver comprobante</a>
                                            ) : (
                                                <button
                                                    onClick={() => handlePagar(m)}
                                                    className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700 transition-colors"
                                                >
                                                    Pagar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Móvil */}
                    <div className="lg:hidden divide-y">
                        {mensualidades.map(m => (
                            <div key={m.id} className={`p-4 ${m.estado === 'vencido' ? 'bg-red-50' : ''}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="font-medium text-gray-800">{m.concepto}</p>
                                        <p className="text-xs text-gray-500">Vence: {m.vencimiento}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        m.estado === 'pagado' ? 'bg-green-100 text-green-800' :
                                        m.estado === 'vencido' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {m.estado === 'pagado' ? '✓' : m.estado === 'vencido' ? '⚠' : '⏳'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-lg font-bold text-gray-800">{formatMonto(m.monto)}</p>
                                    {m.estado === 'pagado' ? (
                                        <a href="/padre/comprobantes" className="text-[#293577] text-sm">Comprobante →</a>
                                    ) : (
                                        <button
                                            onClick={() => handlePagar(m)}
                                            className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-green-700"
                                        >
                                            💳 Pagar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal de pago */}
            {showPayModal && selectedPago && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Realizar Pago</h2>
                            <button onClick={() => setShowPayModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>

                        {/* Resumen */}
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <p className="text-sm text-gray-500">Concepto</p>
                            <p className="font-medium text-gray-800">{selectedPago.concepto}</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">{formatMonto(selectedPago.monto)}</p>
                            <p className="text-xs text-gray-500 mt-1">Vencimiento: {selectedPago.vencimiento}</p>
                        </div>

                        {/* Métodos de pago */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Método de pago</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'tarjeta', label: '💳 Tarjeta', desc: 'Débito/Crédito' },
                                    { id: 'pse', label: '🏦 PSE', desc: 'Transferencia' },
                                    { id: 'nequi', label: '📱 Nequi', desc: 'Billetera digital' },
                                    { id: 'efecty', label: '🏪 Efecty', desc: 'Punto de pago' },
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMetodoPago(m.id)}
                                        className={`p-3 border-2 rounded-xl text-center transition-colors ${
                                            metodoPago === m.id ? 'border-[#293577] bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <p className="font-medium text-sm">{m.label}</p>
                                        <p className="text-xs text-gray-500">{m.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Formulario según método */}
                        {metodoPago === 'tarjeta' && (
                            <div className="space-y-3 mb-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Número de tarjeta</label>
                                    <input type="text" placeholder="1234 5678 9012 3456" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]" />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Vencimiento</label>
                                        <input type="text" placeholder="MM/AA" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">CVV</label>
                                        <input type="text" placeholder="123" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del titular</label>
                                    <input type="text" placeholder="Como aparece en la tarjeta" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]" />
                                </div>
                            </div>
                        )}

                        {metodoPago === 'pse' && (
                            <div className="space-y-3 mb-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Banco</label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                        <option>Seleccione su banco</option>
                                        <option>Bancolombia</option>
                                        <option>Davivienda</option>
                                        <option>BBVA</option>
                                        <option>Banco de Bogotá</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de persona</label>
                                    <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                        <option>Natural</option>
                                        <option>Jurídica</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {metodoPago === 'nequi' && (
                            <div className="space-y-3 mb-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Número de celular Nequi</label>
                                    <input type="tel" placeholder="300 123 4567" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]" />
                                </div>
                                <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                                    Se enviará una notificación push a tu app Nequi para confirmar el pago.
                                </p>
                            </div>
                        )}

                        {metodoPago === 'efecty' && (
                            <div className="mb-4">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                                    <p className="font-medium mb-2">Instrucciones de pago en Efecty:</p>
                                    <ol className="list-decimal list-inside space-y-1 text-xs">
                                        <li>Se generará un código de pago único</li>
                                        <li>Acérquese a cualquier punto Efecty</li>
                                        <li>Indique el código y el monto</li>
                                        <li>El pago se reflejará en 24 horas</li>
                                    </ol>
                                </div>
                            </div>
                        )}

                        <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-500">
                            🔒 Pago seguro. Sus datos están protegidos con encriptación SSL.
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowPayModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={procesarPago}
                                className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 font-medium"
                            >
                                💳 Pagar {formatMonto(selectedPago.monto)}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
