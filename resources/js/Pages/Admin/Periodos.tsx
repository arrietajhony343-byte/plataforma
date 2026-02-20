import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

interface Periodo {
    id: number;
    nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    estado: 'activo' | 'cerrado' | 'pendiente';
    porcentaje: number;
}

export default function Periodos() {
    const [showModal, setShowModal] = useState(false);
    const [selectedYear, setSelectedYear] = useState('2026');

    const periodos: Periodo[] = [
        { id: 1, nombre: 'Primer Periodo', fecha_inicio: '2026-01-15', fecha_fin: '2026-04-15', estado: 'cerrado', porcentaje: 25 },
        { id: 2, nombre: 'Segundo Periodo', fecha_inicio: '2026-04-16', fecha_fin: '2026-07-15', estado: 'activo', porcentaje: 25 },
        { id: 3, nombre: 'Tercer Periodo', fecha_inicio: '2026-07-16', fecha_fin: '2026-10-15', estado: 'pendiente', porcentaje: 25 },
        { id: 4, nombre: 'Cuarto Periodo', fecha_inicio: '2026-10-16', fecha_fin: '2026-12-15', estado: 'pendiente', porcentaje: 25 },
    ];

    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'activo': return 'bg-green-100 text-green-800';
            case 'cerrado': return 'bg-gray-100 text-gray-800';
            case 'pendiente': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Configuración de Periodos">
            <Head title="Periodos" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Configuración de Periodos</h1>
                        <p className="text-gray-600">Gestiona los periodos académicos y fechas importantes</p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577]"
                        >
                            <option value="2026">Año 2026</option>
                            <option value="2025">Año 2025</option>
                            <option value="2024">Año 2024</option>
                        </select>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 bg-[#293577] text-white px-4 py-2 rounded-lg hover:bg-[#181b49]"
                        >
                            <span>+</span> Nuevo Periodo
                        </button>
                    </div>
                </div>

                {/* Timeline de periodos */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                    <h2 className="font-bold text-gray-800 mb-4 sm:mb-6">📅 Año Académico {selectedYear}</h2>
                    <div className="relative">
                        {/* Línea de tiempo */}
                        <div className="absolute left-5 sm:left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                        
                        <div className="space-y-4 sm:space-y-6">
                            {periodos.map((periodo, idx) => (
                                <div key={periodo.id} className="relative flex items-start gap-3 sm:gap-6">
                                    {/* Círculo indicador */}
                                    <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center z-10 flex-shrink-0 ${
                                        periodo.estado === 'activo' ? 'bg-green-500 text-white' :
                                        periodo.estado === 'cerrado' ? 'bg-gray-400 text-white' :
                                        'bg-yellow-400 text-white'
                                    }`}>
                                        <span className="text-sm sm:text-xl font-bold">{idx + 1}</span>
                                    </div>
                                    
                                    {/* Card del periodo */}
                                    <div className={`flex-1 bg-gray-50 rounded-xl p-3 sm:p-4 border-2 ${
                                        periodo.estado === 'activo' ? 'border-green-500' : 'border-transparent'
                                    }`}>
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-bold text-gray-800">{periodo.nombre}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getEstadoBadge(periodo.estado)}`}>
                                                        {periodo.estado}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-sm">
                                                    📆 {periodo.fecha_inicio} → {periodo.fecha_fin}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-xl font-bold text-[#293577]">{periodo.porcentaje}%</p>
                                                    <p className="text-xs text-gray-500">del año</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="p-2 text-[#293577] hover:bg-blue-50 rounded-lg">✏️</button>
                                                    {periodo.estado === 'pendiente' && (
                                                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">▶️</button>
                                                    )}
                                                    {periodo.estado === 'activo' && (
                                                        <button className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg">⏸️</button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Configuración general */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="font-bold text-gray-800 mb-4">⚙️ Configuración General</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número de periodos por año</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                    <option value="4">4 Periodos (Trimestral)</option>
                                    <option value="2">2 Periodos (Semestral)</option>
                                    <option value="3">3 Periodos</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nota mínima de aprobación</label>
                                <input type="number" value="3.0" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nota máxima</label>
                                <input type="number" value="5.0" className="w-full px-4 py-2 border border-gray-300 rounded-lg" />
                            </div>
                            <button className="w-full bg-[#293577] text-white py-2 rounded-lg hover:bg-[#181b49]">
                                Guardar Configuración
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="font-bold text-gray-800 mb-4">📊 Resumen del Año</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Periodos completados</span>
                                <span className="font-bold text-[#181b49]">1 de 4</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Periodo actual</span>
                                <span className="font-bold text-green-600">Segundo Periodo</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Días restantes del periodo</span>
                                <span className="font-bold text-[#293577]">45 días</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-gray-600">Progreso del año</span>
                                <span className="font-bold text-purple-600">35%</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div className="bg-[#293577] h-3 rounded-full" style={{ width: '35%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
