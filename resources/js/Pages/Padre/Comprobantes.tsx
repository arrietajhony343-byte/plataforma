import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { padreMenuItems } from '@/Config/padreMenu';

interface Comprobante {
    id: number;
    referencia: string;
    concepto: string;
    monto: number;
    fecha_pago: string;
    metodo_pago: string;
    estado: 'confirmado' | 'procesando' | 'rechazado';
    detalle: {
        estudiante: string;
        grado: string;
        periodo: string;
        factura?: string;
    };
}

export default function Comprobantes() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterYear, setFilterYear] = useState('2026');
    const [selectedComprobante, setSelectedComprobante] = useState<Comprobante | null>(null);

    const comprobantes: Comprobante[] = [
        {
            id: 1, referencia: 'PAG-2026-0001', concepto: 'Matrícula 2026', monto: 500000,
            fecha_pago: '2026-01-08', metodo_pago: 'Tarjeta de crédito', estado: 'confirmado',
            detalle: { estudiante: 'Carlos López', grado: '7° Secundaria A', periodo: 'Año 2026', factura: 'FAC-001-2026' },
        },
        {
            id: 2, referencia: 'PAG-2026-0012', concepto: 'Mensualidad Enero 2026', monto: 250000,
            fecha_pago: '2026-01-25', metodo_pago: 'PSE - Bancolombia', estado: 'confirmado',
            detalle: { estudiante: 'Carlos López', grado: '7° Secundaria A', periodo: 'Enero 2026', factura: 'FAC-012-2026' },
        },
        {
            id: 3, referencia: 'PAG-2025-0120', concepto: 'Mensualidad Diciembre 2025', monto: 230000,
            fecha_pago: '2025-12-10', metodo_pago: 'Nequi', estado: 'confirmado',
            detalle: { estudiante: 'Carlos López', grado: '6° Primaria A', periodo: 'Diciembre 2025', factura: 'FAC-120-2025' },
        },
        {
            id: 4, referencia: 'PAG-2025-0108', concepto: 'Mensualidad Noviembre 2025', monto: 230000,
            fecha_pago: '2025-11-14', metodo_pago: 'Tarjeta débito', estado: 'confirmado',
            detalle: { estudiante: 'Carlos López', grado: '6° Primaria A', periodo: 'Noviembre 2025', factura: 'FAC-108-2025' },
        },
        {
            id: 5, referencia: 'PAG-2025-0095', concepto: 'Mensualidad Octubre 2025', monto: 230000,
            fecha_pago: '2025-10-13', metodo_pago: 'Efecty', estado: 'confirmado',
            detalle: { estudiante: 'Carlos López', grado: '6° Primaria A', periodo: 'Octubre 2025', factura: 'FAC-095-2025' },
        },
    ];

    const formatMonto = (monto: number) => {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(monto);
    };

    const filteredComprobantes = comprobantes.filter(c => {
        const matchesSearch = c.referencia.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              c.concepto.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesYear = c.fecha_pago.startsWith(filterYear);
        return matchesSearch && matchesYear;
    });

    const totalPagadoYear = filteredComprobantes
        .filter(c => c.estado === 'confirmado')
        .reduce((s, c) => s + c.monto, 0);

    return (
        <SidebarLayout menuItems={padreMenuItems} title="Comprobantes de Pago">
            <Head title="Comprobantes" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Comprobantes de Pago</h1>
                        <p className="text-gray-600">Historial y descarga de comprobantes</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm px-4 py-2">
                        <p className="text-xs text-gray-500">Total pagado en {filterYear}</p>
                        <p className="text-xl font-bold text-green-600">{formatMonto(totalPagadoYear)}</p>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Buscar por referencia o concepto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent text-sm"
                            />
                        </div>
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent text-sm"
                        >
                            <option value="2026">2026</option>
                            <option value="2025">2025</option>
                            <option value="2024">2024</option>
                        </select>
                    </div>
                </div>

                {/* Lista de comprobantes - Desktop */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden lg:block">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Monto</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Fecha</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Método</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredComprobantes.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-sm text-blue-600 font-medium">{c.referencia}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-800">{c.concepto}</td>
                                        <td className="px-4 py-3 text-center font-medium text-gray-800">{formatMonto(c.monto)}</td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-600">{c.fecha_pago}</td>
                                        <td className="px-4 py-3 text-center text-sm text-gray-600">{c.metodo_pago}</td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                c.estado === 'confirmado' ? 'bg-green-100 text-green-800' :
                                                c.estado === 'procesando' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {c.estado === 'confirmado' ? '✓ Confirmado' :
                                                 c.estado === 'procesando' ? '⏳ Procesando' : '✗ Rechazado'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => setSelectedComprobante(c)}
                                                    className="text-[#293577] hover:text-[#181b49] text-sm"
                                                >
                                                    👁 Ver
                                                </button>
                                                <button className="text-green-600 hover:text-green-700 text-sm">
                                                    📥 PDF
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cards - Móvil */}
                <div className="lg:hidden space-y-3">
                    {filteredComprobantes.map(c => (
                        <div key={c.id} className="bg-white rounded-xl shadow-sm p-4">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="font-mono text-sm text-blue-600 font-medium">{c.referencia}</span>
                                    <p className="font-medium text-gray-800 mt-1">{c.concepto}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    c.estado === 'confirmado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {c.estado === 'confirmado' ? '✓' : '⏳'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm mb-3">
                                <span className="text-gray-500">{c.fecha_pago} · {c.metodo_pago}</span>
                                <span className="font-bold text-gray-800">{formatMonto(c.monto)}</span>
                            </div>
                            <div className="flex gap-2 pt-3 border-t">
                                <button
                                    onClick={() => setSelectedComprobante(c)}
                                    className="flex-1 text-[#293577] bg-blue-50 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100"
                                >
                                    👁 Ver detalle
                                </button>
                                <button className="flex-1 text-green-700 bg-green-50 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100">
                                    📥 Descargar PDF
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredComprobantes.length === 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <span className="text-4xl">🧾</span>
                        <p className="text-gray-500 mt-2">No se encontraron comprobantes</p>
                    </div>
                )}
            </div>

            {/* Modal detalle comprobante */}
            {selectedComprobante && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md overflow-hidden">
                        {/* Cabecera tipo recibo */}
                        <div className="text-white p-6 text-center" style={{ background: 'linear-gradient(90deg, #181b49 0%, #293577 50%, #181b49 100%)' }}>
                            <img src="/storage/logo.png" alt="Logo" className="w-12 h-12 object-contain mx-auto mb-2" />
                            <h2 className="text-lg font-bold">Comprobante de Pago</h2>
                            <p className="text-blue-200 text-sm">I.P. Emprendedores del Saber</p>
                            <p className="text-3xl font-bold mt-3">{formatMonto(selectedComprobante.monto)}</p>
                            <span className="inline-block mt-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                                ✓ {selectedComprobante.estado.toUpperCase()}
                            </span>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Detalles */}
                            <div className="space-y-3">
                                {[
                                    { label: 'Referencia', value: selectedComprobante.referencia },
                                    { label: 'Concepto', value: selectedComprobante.concepto },
                                    { label: 'Fecha de pago', value: new Date(selectedComprobante.fecha_pago).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) },
                                    { label: 'Método de pago', value: selectedComprobante.metodo_pago },
                                    { label: 'Estudiante', value: selectedComprobante.detalle.estudiante },
                                    { label: 'Grado', value: selectedComprobante.detalle.grado },
                                    { label: 'Periodo', value: selectedComprobante.detalle.periodo },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between items-center py-1 border-b border-gray-100">
                                        <span className="text-sm text-gray-500">{item.label}</span>
                                        <span className="text-sm font-medium text-gray-800">{item.value}</span>
                                    </div>
                                ))}
                                {selectedComprobante.detalle.factura && (
                                    <div className="flex justify-between items-center py-1 border-b border-gray-100">
                                        <span className="text-sm text-gray-500">N° Factura</span>
                                        <span className="text-sm font-mono font-medium text-blue-600">{selectedComprobante.detalle.factura}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium">
                                    📥 Descargar PDF
                                </button>
                                <button
                                    onClick={() => setSelectedComprobante(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
