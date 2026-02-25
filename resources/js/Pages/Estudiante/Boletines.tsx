import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { estudianteMenuItems } from '@/Config/estudianteMenu';

export default function Boletines() {
    const nombre = 'Andrés Felipe Muñoz';

    const periodos = [
        {
            periodo: '1er Periodo',
            estado: 'En curso',
            fechaInicio: '20 Ene 2026',
            fechaFin: '15 Abr 2026',
            promedio: 4.1,
            disponible: false,
        },
    ];

    const boletinesAnteriores = [
        { año: '2025', periodo: '3er Periodo', promedio: 4.3, puesto: 5, observacion: 'Excelente desempeño general. Mantener el ritmo.', descargable: true },
        { año: '2025', periodo: '2do Periodo', promedio: 3.9, puesto: 8, observacion: 'Buen rendimiento. Mejorar en ciencias exactas.', descargable: true },
        { año: '2025', periodo: '1er Periodo', promedio: 4.0, puesto: 7, observacion: 'Buen inicio de año. Participación activa.', descargable: true },
    ];

    const getNotaColor = (n: number) => {
        if (n >= 4.0) return 'text-green-600';
        if (n >= 3.0) return 'text-amber-600';
        return 'text-red-600';
    };

    return (
        <SidebarLayout menuItems={estudianteMenuItems} userInfo={{ name: nombre, role: 'Estudiante' }}>
            <Head title="Mis Boletines" />

            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>Mis Boletines</h1>
                <p className="text-gray-500 mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Descarga tus boletines de calificaciones</p>
            </div>

            {/* Periodo actual */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900">Periodo Actual</h3>
                    <span className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-full font-semibold">En curso</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-gray-400">Periodo</p>
                        <p className="text-sm font-bold text-gray-800">1er Periodo 2026</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Fecha Inicio</p>
                        <p className="text-sm font-bold text-gray-800">20 Ene 2026</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Fecha Fin</p>
                        <p className="text-sm font-bold text-gray-800">15 Abr 2026</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Promedio Parcial</p>
                        <p className={`text-xl font-extrabold ${getNotaColor(4.1)}`}>4.1</p>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 italic">El boletín estará disponible al finalizar el periodo.</p>
            </div>

            {/* Boletines anteriores */}
            <h3 className="font-bold text-gray-900 mb-3">Boletines Anteriores</h3>
            <div className="space-y-3">
                {boletinesAnteriores.map((b, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#181b49] to-[#293577] flex items-center justify-center text-white flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm">{b.periodo} — {b.año}</h4>
                            <p className="text-xs text-gray-400">Puesto: #{b.puesto} • {b.observacion}</p>
                        </div>
                        <div className="text-center flex-shrink-0">
                            <p className={`text-xl font-extrabold ${getNotaColor(b.promedio)}`}>{b.promedio}</p>
                            <p className="text-[10px] text-gray-400">Promedio</p>
                        </div>
                        <button className="flex-shrink-0 px-4 py-2 bg-[#293577] text-white rounded-lg text-xs font-semibold hover:bg-[#181b49] transition flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            PDF
                        </button>
                    </div>
                ))}
            </div>
        </SidebarLayout>
    );
}
