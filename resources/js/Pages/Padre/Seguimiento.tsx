import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { padreMenuItems } from '@/Config/padreMenu';

interface MateriaRendimiento {
    materia: string;
    profesor: string;
    promedioActual: number;
    tendencia: 'subiendo' | 'bajando' | 'estable';
    notas: { nombre: string; nota: number; fecha: string; peso: number }[];
    observaciones: number;
    asistencia: number;
}

export default function Seguimiento() {
    const [selectedMateria, setSelectedMateria] = useState<MateriaRendimiento | null>(null);

    const hijo = {
        nombre: 'Carlos López',
        grado: '7° Secundaria',
        seccion: 'A',
    };

    const materias: MateriaRendimiento[] = [
        {
            materia: 'Matemáticas', profesor: 'María García', promedioActual: 3.9, tendencia: 'subiendo',
            notas: [
                { nombre: 'Quiz Ecuaciones', nota: 3.5, fecha: '2026-01-20', peso: 15 },
                { nombre: 'Taller Álgebra', nota: 4.0, fecha: '2026-01-28', peso: 20 },
                { nombre: 'Parcial 1', nota: 3.8, fecha: '2026-02-05', peso: 30 },
                { nombre: 'Participación', nota: 4.2, fecha: '2026-02-10', peso: 10 },
            ],
            observaciones: 1, asistencia: 92,
        },
        {
            materia: 'Español', profesor: 'Juan Pérez', promedioActual: 4.6, tendencia: 'estable',
            notas: [
                { nombre: 'Lectura comprensiva', nota: 4.5, fecha: '2026-01-22', peso: 20 },
                { nombre: 'Ensayo argumentativo', nota: 4.8, fecha: '2026-02-01', peso: 25 },
                { nombre: 'Exposición oral', nota: 4.7, fecha: '2026-02-08', peso: 25 },
            ],
            observaciones: 0, asistencia: 100,
        },
        {
            materia: 'Ciencias Naturales', profesor: 'Ana Martínez', promedioActual: 4.3, tendencia: 'subiendo',
            notas: [
                { nombre: 'Laboratorio 1', nota: 4.5, fecha: '2026-01-25', peso: 20 },
                { nombre: 'Quiz ecosistemas', nota: 4.5, fecha: '2026-02-06', peso: 15 },
                { nombre: 'Informe Lab', nota: 4.0, fecha: '2026-02-10', peso: 20 },
            ],
            observaciones: 0, asistencia: 96,
        },
        {
            materia: 'Historia', profesor: 'Carlos Mendoza', promedioActual: 4.1, tendencia: 'estable',
            notas: [
                { nombre: 'Línea de tiempo', nota: 4.0, fecha: '2026-01-30', peso: 15 },
                { nombre: 'Quiz Colonia', nota: 4.2, fecha: '2026-02-07', peso: 20 },
            ],
            observaciones: 0, asistencia: 100,
        },
        {
            materia: 'Inglés', profesor: 'Laura Stevens', promedioActual: 3.6, tendencia: 'bajando',
            notas: [
                { nombre: 'Listening test', nota: 3.2, fecha: '2026-01-24', peso: 20 },
                { nombre: 'Writing essay', nota: 3.8, fecha: '2026-02-03', peso: 25 },
                { nombre: 'Vocabulary quiz', nota: 3.5, fecha: '2026-02-12', peso: 15 },
            ],
            observaciones: 2, asistencia: 88,
        },
        {
            materia: 'Educación Física', profesor: 'Pedro Sánchez', promedioActual: 4.9, tendencia: 'estable',
            notas: [
                { nombre: 'Test físico', nota: 5.0, fecha: '2026-01-23', peso: 30 },
                { nombre: 'Deportes equipo', nota: 4.8, fecha: '2026-02-06', peso: 30 },
            ],
            observaciones: 0, asistencia: 100,
        },
        {
            materia: 'Artes', profesor: 'Diana Castro', promedioActual: 4.2, tendencia: 'subiendo',
            notas: [
                { nombre: 'Proyecto acuarela', nota: 4.0, fecha: '2026-02-01', peso: 30 },
                { nombre: 'Análisis obra', nota: 4.3, fecha: '2026-02-11', peso: 20 },
            ],
            observaciones: 0, asistencia: 96,
        },
    ];

    const promedioGeneral = (materias.reduce((sum, m) => sum + m.promedioActual, 0) / materias.length).toFixed(1);
    const asistenciaGeneral = Math.round(materias.reduce((sum, m) => sum + m.asistencia, 0) / materias.length);
    const totalObservaciones = materias.reduce((sum, m) => sum + m.observaciones, 0);
    const materiasEnRiesgo = materias.filter(m => m.promedioActual < 3.5).length;

    const getTendenciaIcon = (t: string) => {
        if (t === 'subiendo') return { icon: '↑', color: 'text-green-600', label: 'Mejorando' };
        if (t === 'bajando') return { icon: '↓', color: 'text-red-600', label: 'Bajando' };
        return { icon: '→', color: 'text-blue-600', label: 'Estable' };
    };

    const getBarColor = (nota: number) => {
        if (nota >= 4.0) return 'bg-green-500';
        if (nota >= 3.0) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <SidebarLayout menuItems={padreMenuItems} title="Seguimiento Académico">
            <Head title="Seguimiento Académico" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Seguimiento Académico</h1>
                    <p className="text-gray-600">{hijo.nombre} · {hijo.grado} {hijo.seccion} · Periodo Actual</p>
                </div>

                {/* Resumen general */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <div className={`text-3xl font-bold ${parseFloat(promedioGeneral) >= 3.5 ? 'text-green-600' : 'text-red-600'}`}>{promedioGeneral}</div>
                        <p className="text-gray-600 text-sm mt-1">Promedio General</p>
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                            <div className={`h-1.5 rounded-full ${getBarColor(parseFloat(promedioGeneral))}`} style={{ width: `${(parseFloat(promedioGeneral) / 5) * 100}%` }} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <div className="text-3xl font-bold text-blue-600">{asistenciaGeneral}%</div>
                        <p className="text-gray-600 text-sm mt-1">Asistencia</p>
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full">
                            <div className="h-1.5 bg-blue-500 rounded-full" style={{ width: `${asistenciaGeneral}%` }} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <div className={`text-3xl font-bold ${totalObservaciones > 0 ? 'text-orange-600' : 'text-green-600'}`}>{totalObservaciones}</div>
                        <p className="text-gray-600 text-sm mt-1">Observaciones</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <div className={`text-3xl font-bold ${materiasEnRiesgo > 0 ? 'text-red-600' : 'text-green-600'}`}>{materiasEnRiesgo}</div>
                        <p className="text-gray-600 text-sm mt-1">Materias en Riesgo</p>
                    </div>
                </div>

                {/* Alerta de materias en riesgo */}
                {materias.filter(m => m.promedioActual < 3.5 || m.tendencia === 'bajando').length > 0 && (
                    <div className="bg-orange-50 border-l-4 border-orange-400 rounded-r-xl p-4">
                        <h3 className="font-bold text-orange-800 mb-2">Atención Requerida</h3>
                        {materias.filter(m => m.promedioActual < 3.5 || m.tendencia === 'bajando').map(m => (
                            <div key={m.materia} className="flex items-center gap-2 text-sm text-orange-700 mt-1">
                                <span>{m.promedioActual < 3.5 ? '●' : '○'}</span>
                                <strong>{m.materia}</strong> — Promedio: {m.promedioActual} · 
                                {getTendenciaIcon(m.tendencia).icon} {getTendenciaIcon(m.tendencia).label}
                                {m.observaciones > 0 && ` · ${m.observaciones} observación(es)`}
                            </div>
                        ))}
                    </div>
                )}

                {/* Gráfico de barras visual */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <h3 className="font-semibold text-gray-700 mb-4">Rendimiento por Materia</h3>
                    <div className="space-y-3">
                        {materias.sort((a, b) => b.promedioActual - a.promedioActual).map(m => {
                            const tendencia = getTendenciaIcon(m.tendencia);
                            return (
                                <button
                                    key={m.materia}
                                    onClick={() => setSelectedMateria(m)}
                                    className="w-full text-left hover:bg-gray-50 rounded-lg p-2 transition-colors"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-800 text-sm">{m.materia}</span>
                                            <span className={`text-xs ${tendencia.color}`}>{tendencia.icon}</span>
                                        </div>
                                        <span className={`font-bold text-sm ${m.promedioActual >= 4.0 ? 'text-green-600' : m.promedioActual >= 3.0 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {m.promedioActual}
                                        </span>
                                    </div>
                                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-500 ${getBarColor(m.promedioActual)}`}
                                            style={{ width: `${(m.promedioActual / 5) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-xs text-gray-500">Prof. {m.profesor}</span>
                                        <span className="text-xs text-gray-500">Asistencia: {m.asistencia}%</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Observaciones del observador */}
                {totalObservaciones > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-4">
                        <h3 className="font-semibold text-gray-700 mb-4">Observaciones Recientes</h3>
                        <div className="space-y-3">
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-gray-800">Inglés - Prof. Laura Stevens</p>
                                        <p className="text-sm text-gray-600 mt-1">El estudiante necesita reforzar la comprensión auditiva. Se recomienda práctica extra con audiolibros.</p>
                                    </div>
                                    <span className="text-xs text-gray-400">8 Feb 2026</span>
                                </div>
                            </div>
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-gray-800">Inglés - Prof. Laura Stevens</p>
                                        <p className="text-sm text-gray-600 mt-1">Falta de participación en clase durante la semana. Por favor motivar la participación activa.</p>
                                    </div>
                                    <span className="text-xs text-gray-400">1 Feb 2026</span>
                                </div>
                            </div>
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-medium text-gray-800">Matemáticas - Prof. María García</p>
                                        <p className="text-sm text-gray-600 mt-1">Excelente progreso en la última semana. Ha mejorado notablemente en resolución de ecuaciones.</p>
                                    </div>
                                    <span className="text-xs text-gray-400">10 Feb 2026</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal detalle materia */}
            {selectedMateria && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">{selectedMateria.materia}</h2>
                                <p className="text-sm text-gray-500">Prof. {selectedMateria.profesor}</p>
                            </div>
                            <button onClick={() => setSelectedMateria(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="text-center bg-gray-50 rounded-lg p-3">
                                <p className={`text-2xl font-bold ${selectedMateria.promedioActual >= 3.5 ? 'text-green-600' : 'text-red-600'}`}>{selectedMateria.promedioActual}</p>
                                <p className="text-xs text-gray-500">Promedio</p>
                            </div>
                            <div className="text-center bg-gray-50 rounded-lg p-3">
                                <p className="text-2xl font-bold text-blue-600">{selectedMateria.asistencia}%</p>
                                <p className="text-xs text-gray-500">Asistencia</p>
                            </div>
                            <div className="text-center bg-gray-50 rounded-lg p-3">
                                <p className={`text-2xl font-bold ${getTendenciaIcon(selectedMateria.tendencia).color}`}>
                                    {getTendenciaIcon(selectedMateria.tendencia).icon}
                                </p>
                                <p className="text-xs text-gray-500">{getTendenciaIcon(selectedMateria.tendencia).label}</p>
                            </div>
                        </div>

                        <h3 className="font-semibold text-gray-700 mb-3">Desglose de Notas</h3>
                        <div className="space-y-2 mb-4">
                            {selectedMateria.notas.map((nota, i) => (
                                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                    <div>
                                        <p className="font-medium text-sm text-gray-800">{nota.nombre}</p>
                                        <p className="text-xs text-gray-500">{nota.fecha} · Peso: {nota.peso}%</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-lg font-bold text-sm ${
                                        nota.nota >= 4.0 ? 'bg-green-100 text-green-700' :
                                        nota.nota >= 3.0 ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {nota.nota}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setSelectedMateria(null)}
                            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
