import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { estudianteMenuItems } from '@/Config/estudianteMenu';

interface BoletinItem {
    id: number;
    periodo: string;
    anio: number | null;
    promedio: number | null;
    puesto: number | null;
    observacion: string | null;
    estado: string;
    archivo_url: string | null;
}

interface Props {
    estudiante: {
        nombre: string;
    };
    periodoActual: {
        id: number;
        nombre: string;
        estado: string;
        fecha_inicio: string | null;
        fecha_fin: string | null;
        promedio_parcial: number | null;
        boletin_generado: boolean;
    } | null;
    boletines: BoletinItem[];
}

export default function Boletines({ estudiante, periodoActual, boletines }: Props) {
    const nombre = estudiante?.nombre || 'Estudiante';

    const formatFecha = (f: string | null | undefined) => {
        if (!f) return '—';
        const d = new Date(f.length === 10 ? f + 'T12:00:00' : f);
        if (Number.isNaN(d.getTime())) return f;
        return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
    };

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
                    <span className={`text-xs px-3 py-1 rounded-full font-semibold ${periodoActual?.boletin_generado ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {periodoActual?.boletin_generado ? 'Generado' : 'En curso'}
                    </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-gray-400">Periodo</p>
                        <p className="text-sm font-bold text-gray-800">{periodoActual?.nombre || 'Sin período activo'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Fecha Inicio</p>
                        <p className="text-sm font-bold text-gray-800">{formatFecha(periodoActual?.fecha_inicio)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Fecha Fin</p>
                        <p className="text-sm font-bold text-gray-800">{formatFecha(periodoActual?.fecha_fin)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Promedio Parcial</p>
                        <p className={`text-xl font-extrabold ${periodoActual?.promedio_parcial !== null && periodoActual?.promedio_parcial !== undefined ? getNotaColor(periodoActual.promedio_parcial) : 'text-gray-300'}`}>
                            {periodoActual?.promedio_parcial !== null && periodoActual?.promedio_parcial !== undefined ? periodoActual.promedio_parcial.toFixed(1) : '—'}
                        </p>
                    </div>
                </div>
                {!periodoActual?.boletin_generado && (
                    <p className="text-xs text-gray-400 mt-3 italic">El boletín estará disponible cuando sea generado por administración.</p>
                )}
            </div>

            {/* Boletines anteriores */}
            <h3 className="font-bold text-gray-900 mb-3">Boletines Generados</h3>
            {boletines.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                    <p className="text-gray-700 font-semibold">Aún no tienes boletines generados.</p>
                    <p className="text-gray-400 text-sm mt-1">Aparecerán aquí en cuanto se publiquen oficialmente.</p>
                </div>
            ) : (
                <div className="space-y-3">
                {boletines.map((b) => (
                    <div key={b.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#181b49] to-[#293577] flex items-center justify-center text-white flex-shrink-0">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm">{b.periodo} — {b.anio || ''}</h4>
                            <p className="text-xs text-gray-400">
                                Puesto: {b.puesto ? `#${b.puesto}` : '—'} • {b.observacion || 'Sin observación general'}
                            </p>
                        </div>
                        <div className="text-center flex-shrink-0">
                            <p className={`text-xl font-extrabold ${b.promedio !== null ? getNotaColor(b.promedio) : 'text-gray-300'}`}>
                                {b.promedio !== null ? b.promedio.toFixed(1) : '—'}
                            </p>
                            <p className="text-[10px] text-gray-400">Promedio</p>
                        </div>
                        {b.archivo_url ? (
                            <a href={b.archivo_url} target="_blank" rel="noreferrer" className="flex-shrink-0 px-4 py-2 bg-[#293577] text-white rounded-lg text-xs font-semibold hover:bg-[#181b49] transition flex items-center gap-1.5">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                </svg>
                                PDF
                            </a>
                        ) : (
                            <span className="flex-shrink-0 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg text-xs font-semibold">
                                Sin archivo
                            </span>
                        )}
                    </div>
                ))}
            </div>
            )}
        </SidebarLayout>
    );
}
