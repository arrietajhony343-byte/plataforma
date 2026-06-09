import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { padreMenuItems } from '@/Config/padreMenu';

interface HijoOption {
    id: number;
    nombre: string;
}

interface HijoData {
    id: number;
    nombre: string;
    grado: string;
    seccion: string;
    codigo: string;
}

interface PeriodoItem {
    id: number;
    nombre: string;
    numero: number;
    estado: string;
}

interface NotaItem {
    materia: string;
    profesor: string;
    conceptos: Record<string, number | null>;
    notaFinal: number | null;
    estado: 'aprobado' | 'reprobado' | 'en_curso';
}

interface ConceptoItem {
    key: string;
    nombre: string;
}

interface BoletinPeriodoItem {
    periodo_id: number;
    periodo: string;
    numero: number;
    estado: 'disponible' | 'generando' | 'pendiente';
    fecha_generacion: string | null;
    promedio: number | null;
    archivo_url: string | null;
}

interface Props {
    padre: {
        nombre: string;
    };
    hijos: HijoOption[];
    hijo: HijoData | null;
    periodos: PeriodoItem[];
    periodoSeleccionadoId: number | null;
    boletinActual: BoletinPeriodoItem | null;
    stats: {
        promedio: number | null;
        materias: number;
        puesto: number | null;
        total_estudiantes: number;
    };
    conceptos: ConceptoItem[];
    notas: NotaItem[];
    boletines: BoletinPeriodoItem[];
}

export default function Boletin({ padre, hijos, hijo, periodos, periodoSeleccionadoId, boletinActual, stats, conceptos, notas, boletines }: Props) {
    const getNotaColor = (nota: number | null) => {
        if (nota === null) return 'text-gray-400';
        if (nota >= 4.0) return 'text-green-600 bg-green-50';
        if (nota >= 3.0) return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    const onChangeFilters = (nextHijoId?: number, nextPeriodoId?: number) => {
        const hijoId = nextHijoId ?? hijo?.id;
        const periodoId = nextPeriodoId ?? periodoSeleccionadoId;
        router.get('/padre/boletin', { hijo_id: hijoId, periodo_id: periodoId }, { preserveState: true });
    };

    return (
        <SidebarLayout menuItems={padreMenuItems} userInfo={{ name: padre.nombre, role: 'Padre' }}>
            <Head title="Boletín & Notas" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {!hijo ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                        <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Boletín & Notas</h1>
                        <p className="text-gray-500 mt-2">No hay hijos vinculados a este acudiente.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Boletín & Notas</h1>
                                <p className="text-gray-600">{hijo.nombre} · {hijo.grado} {hijo.seccion} · Código: {hijo.codigo}</p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch gap-2">
                                {hijos.length > 1 && (
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Cambiar de hijo/a</p>
                                        <select
                                            value={hijo.id}
                                            onChange={(e) => onChangeFilters(Number(e.target.value), undefined)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent min-w-[220px]"
                                        >
                                            {hijos.map((h) => (
                                                <option key={h.id} value={h.id}>{h.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Periodo</p>
                                    <select
                                        value={periodoSeleccionadoId ?? ''}
                                        onChange={(e) => onChangeFilters(undefined, Number(e.target.value))}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent min-w-[230px]"
                                    >
                                        {periodos.map((p) => (
                                            <option key={p.id} value={p.id}>{p.nombre}</option>
                                        ))}
                                    </select>
                                    {periodos.some((p) => p.id === periodoSeleccionadoId && p.estado === 'activo') && (
                                        <p className="text-[11px] text-[#293577] font-semibold mt-1">Periodo actual</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {boletinActual && (
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-gray-800">Boletín {boletinActual.periodo}</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    boletinActual.estado === 'disponible' ? 'bg-green-100 text-green-800' :
                                                    boletinActual.estado === 'generando' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {boletinActual.estado === 'disponible' ? 'Disponible' : boletinActual.estado === 'generando' ? 'Generándose automáticamente' : 'Pendiente'}
                                                </span>
                                            </div>
                                            {boletinActual.estado === 'generando' && (
                                                <p className="text-xs text-yellow-700 mt-1">El boletín se genera cuando se completan notas definitivas y observaciones del período.</p>
                                            )}
                                        </div>
                                    </div>

                                    {boletinActual.estado === 'disponible' && boletinActual.archivo_url && (
                                        <a href={boletinActual.archivo_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                                            Descargar Boletín PDF
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <p className="text-sm text-gray-500">Promedio del Periodo</p>
                                <p className={`text-3xl font-bold mt-1 ${stats.promedio !== null && stats.promedio >= 3.0 ? 'text-green-600' : stats.promedio !== null ? 'text-red-600' : 'text-gray-300'}`}>
                                    {stats.promedio !== null ? stats.promedio.toFixed(1) : '—'}
                                </p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <p className="text-sm text-gray-500">Materias en Curso</p>
                                <p className="text-3xl font-bold mt-1 text-blue-600">{stats.materias}</p>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                                <p className="text-sm text-gray-500">Puesto (estimado)</p>
                                <p className="text-3xl font-bold mt-1 text-purple-600">
                                    {stats.puesto ? `${stats.puesto}°/${stats.total_estudiantes || '—'}` : '—'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden lg:block">
                            <div className="px-4 py-3 border-b bg-gray-50">
                                <h3 className="font-semibold text-gray-700">Notas por Materia - {boletinActual?.periodo || 'Periodo'}</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Materia</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profesor</th>
                                            {conceptos.map((c) => (
                                                <th key={c.key} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{c.nombre}</th>
                                            ))}
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Final</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {notas.map((nota, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-800">{nota.materia}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{nota.profesor}</td>
                                                {conceptos.map((c) => (
                                                    <td key={c.key} className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded text-sm font-medium ${getNotaColor(nota.conceptos[c.key] ?? null)}`}>{nota.conceptos[c.key] ?? '—'}</span></td>
                                                ))}
                                                <td className="px-4 py-3 text-center"><span className={`px-3 py-1 rounded-lg text-sm font-bold ${getNotaColor(nota.notaFinal)}`}>{nota.notaFinal ?? '—'}</span></td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        nota.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                                                        nota.estado === 'reprobado' ? 'bg-red-100 text-red-800' :
                                                        'bg-blue-100 text-blue-800'
                                                    }`}>
                                                        {nota.estado === 'aprobado' ? 'Aprobado' : nota.estado === 'reprobado' ? 'Reprobado' : 'En curso'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="lg:hidden space-y-3">
                            <h3 className="font-semibold text-gray-700">Notas por Materia</h3>
                            {notas.map((nota, i) => (
                                <div key={i} className="bg-white rounded-xl shadow-sm p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-medium text-gray-800">{nota.materia}</p>
                                            <p className="text-xs text-gray-500">Prof. {nota.profesor}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            nota.estado === 'aprobado' ? 'bg-green-100 text-green-800' :
                                            nota.estado === 'reprobado' ? 'bg-red-100 text-red-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {nota.estado === 'aprobado' ? '✓' : nota.estado === 'reprobado' ? '✗' : '•'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-center">
                                        {conceptos.map((c) => (
                                            <div key={c.key}><p className="text-[10px] text-gray-400 uppercase">{c.nombre}</p><p className={`text-sm font-medium rounded px-1 py-0.5 ${getNotaColor(nota.conceptos[c.key] ?? null)}`}>{nota.conceptos[c.key] ?? '—'}</p></div>
                                        ))}
                                        <div><p className="text-[10px] text-gray-400 uppercase font-bold">Final</p><p className={`text-sm font-bold rounded px-1 py-0.5 ${getNotaColor(nota.notaFinal)}`}>{nota.notaFinal ?? '—'}</p></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <h3 className="font-semibold text-gray-700 mb-4">Boletines Disponibles para Descarga</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {boletines.map((bol) => (
                                    <div key={bol.periodo_id} className={`border rounded-xl p-4 text-center ${
                                        bol.estado === 'disponible' ? 'border-green-200 bg-green-50' :
                                        bol.estado === 'generando' ? 'border-yellow-200 bg-yellow-50' :
                                        'border-gray-200 bg-gray-50'
                                    }`}>
                                        <p className="font-medium text-gray-800">{bol.periodo}</p>
                                        {bol.promedio !== null && <p className="text-2xl font-bold text-green-600 mt-1">{bol.promedio.toFixed(1)}</p>}
                                        <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
                                            bol.estado === 'disponible' ? 'bg-green-200 text-green-800' :
                                            bol.estado === 'generando' ? 'bg-yellow-200 text-yellow-800' :
                                            'bg-gray-200 text-gray-600'
                                        }`}>
                                            {bol.estado === 'disponible' ? 'Disponible' : bol.estado === 'generando' ? 'Generándose' : 'Pendiente'}
                                        </span>
                                        {bol.estado === 'disponible' && bol.archivo_url && (
                                            <a href={bol.archivo_url} target="_blank" rel="noreferrer" className="mt-3 block w-full bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
                                                Descargar PDF
                                            </a>
                                        )}
                                        {bol.estado === 'generando' && (
                                            <p className="mt-2 text-xs text-yellow-700">Se genera al registrar notas definitivas del período.</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </SidebarLayout>
    );
}
