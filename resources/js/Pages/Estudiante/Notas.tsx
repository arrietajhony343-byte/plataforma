import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { estudianteMenuItems } from '@/Config/estudianteMenu';

interface Periodo {
    id: number;
    nombre: string;
    numero: number;
    estado: 'pendiente' | 'activo' | 'cerrado' | string;
}

interface NotaItem {
    id: number;
    concepto: string;
    tipo: string;
    peso: number | null;
    valor: number;
    fecha: string | null;
}

interface MateriaItem {
    id: number;
    nombre: string;
    profesor: string | null;
    promedio: number;
    notas: NotaItem[];
}

interface ResumenPeriodo {
    periodo_id: number;
    periodo_nombre: string;
    promedio_general: number | null;
    total_materias: number;
    total_notas: number;
    mejor_materia: { nombre: string; promedio: number } | null;
    materia_alerta: { nombre: string; promedio: number } | null;
    materias: MateriaItem[];
}

interface Props {
    estudiante: {
        nombre: string;
    };
    periodos: Periodo[];
    periodoActualId: number | null;
    notasPorPeriodo: ResumenPeriodo[];
}

export default function Notas({ estudiante, periodos, periodoActualId, notasPorPeriodo }: Props) {
    const nombre = estudiante?.nombre || 'Estudiante';
    const periodoInicial = periodoActualId ?? periodos[0]?.id ?? null;
    const [periodoActivo, setPeriodoActivo] = useState<number | null>(periodoInicial);

    const resumenActivo = useMemo(
        () => notasPorPeriodo.find((p) => p.periodo_id === periodoActivo) ?? null,
        [notasPorPeriodo, periodoActivo],
    );

    const materias = resumenActivo?.materias ?? [];

    const getNotaColor = (n: number | null) => {
        if (n === null) return 'text-gray-300';
        if (n >= 4.0) return 'text-green-600';
        if (n >= 3.0) return 'text-amber-600';
        return 'text-red-600';
    };

    const getNotaBg = (n: number) => {
        if (n >= 4.0) return 'bg-green-50';
        if (n >= 3.0) return 'bg-amber-50';
        return 'bg-red-50';
    };

    const periodoLabel = periodos.find((p) => p.id === periodoActivo)?.nombre ?? 'Sin periodo';

    return (
        <SidebarLayout menuItems={estudianteMenuItems} userInfo={{ name: nombre, role: 'Estudiante' }}>
            <Head title="Mis Notas" />

            <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>Mis Notas</h1>
                <p className="text-gray-500 mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Seguimiento detallado de calificaciones</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-xs text-gray-400">Promedio General</p>
                    <p className={`text-3xl font-extrabold ${getNotaColor(resumenActivo?.promedio_general ?? null)}`}>
                        {resumenActivo?.promedio_general !== null && resumenActivo?.promedio_general !== undefined
                            ? resumenActivo.promedio_general.toFixed(1)
                            : '—'}
                    </p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-xs text-gray-400">Mejor Materia</p>
                    {resumenActivo?.mejor_materia ? (
                        <p className="text-sm font-bold text-green-600">
                            {resumenActivo.mejor_materia.nombre} ({resumenActivo.mejor_materia.promedio.toFixed(1)})
                        </p>
                    ) : (
                        <p className="text-sm font-bold text-gray-400">Sin registros</p>
                    )}
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-xs text-gray-400">Materia en Riesgo</p>
                    {resumenActivo?.materia_alerta ? (
                        <p className="text-sm font-bold text-red-600">
                            {resumenActivo.materia_alerta.nombre} ({resumenActivo.materia_alerta.promedio.toFixed(1)})
                        </p>
                    ) : (
                        <p className="text-sm font-bold text-green-600">Sin alertas</p>
                    )}
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                    <p className="text-xs text-gray-400">Periodo Actual</p>
                    <p className="text-lg font-bold text-gray-800">{periodoLabel}</p>
                </div>
            </div>

            {/* Periodo selector */}
            <div className="flex gap-2 mb-5">
                {periodos.map((p) => (
                    <button key={p.id} onClick={() => setPeriodoActivo(p.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${periodoActivo === p.id ? 'bg-[#293577] text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                    >
                        {p.nombre} {p.estado === 'activo' ? '(Actual)' : ''}
                    </button>
                ))}
            </div>

            {/* Tabla de notas por materia */}
            {periodos.length === 0 || !resumenActivo ? (
                <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                    <p className="text-gray-600 font-semibold">Aun no tienes notas registradas.</p>
                    <p className="text-gray-400 text-sm mt-1">Cuando tus profesores publiquen calificaciones las veras aqui por periodo y materia.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {materias.map((m) => (
                        <div key={m.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
                            <div className="flex items-center gap-2">
                                <span className="text-xl bg-[#e5e7eb] text-[#181b49] w-9 h-9 rounded-lg flex items-center justify-center font-bold">
                                    {m.nombre.slice(0, 2).toUpperCase()}
                                </span>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">{m.nombre}</h3>
                                    <p className="text-[11px] text-gray-400">{m.profesor || 'Profesor no asignado'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-xl font-extrabold ${getNotaColor(m.promedio)}`}>{m.promedio}</p>
                                <p className="text-[10px] text-gray-400">Acumulado</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">Actividad</th>
                                        <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 w-20">Tipo</th>
                                        <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 w-16">Peso</th>
                                        <th className="text-center px-2 py-2 text-xs font-semibold text-gray-500 w-16">Nota</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {m.notas.map((n, i) => (
                                        <tr key={i} className={`${getNotaBg(n.valor)} hover:bg-gray-50 transition-colors`}>
                                            <td className="px-4 py-2 text-gray-700">{n.concepto}</td>
                                            <td className="text-center px-2 py-2">
                                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{n.tipo}</span>
                                            </td>
                                            <td className="text-center px-2 py-2 text-gray-500">{n.peso !== null ? `${n.peso}%` : '—'}</td>
                                            <td className="text-center px-2 py-2">
                                                <span className={`font-extrabold ${getNotaColor(n.valor)}`}>
                                                    {n.valor.toFixed(1)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        </div>
                    ))}
                </div>
            )}
        </SidebarLayout>
    );
}
