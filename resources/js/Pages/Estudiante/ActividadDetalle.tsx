import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { estudianteMenuItems } from '@/Config/estudianteMenu';
import { useState, useRef } from 'react';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface OpcionData {
    id: number;
    texto: string;
    imagen: string | null;
}

interface PreguntaData {
    id: number;
    enunciado: string;
    imagen: string | null;
    tipo: 'seleccion_multiple' | 'verdadero_falso' | 'abierta';
    puntos: number;
    opciones: OpcionData[];
}

interface ActividadDetalle {
    id: number;
    titulo: string;
    descripcion: string | null;
    tipo: string;
    materia: string;
    curso: string;
    profesor: string;
    fechaAsignacion: string;
    fechaEntrega: string;
    fechaEntregaISO: string;
    fechaLimiteIndividual: string | null;
    fechaLimiteIndividualISO: string | null;
    peso: number;
    estado: 'pendiente' | 'vencida' | 'entregada' | 'devuelta' | 'calificada';
    puedeEntregar: boolean;
    permiteEntregaTardia: boolean;
    maxIntentos: number | null;
    intentosUsados: number;
    intentosDisponibles: number | null;
    tienePreguntas: boolean;
    // Entrega actual
    entregaId: number;
    entregaContenido: string | null;
    entregaArchivo: string | null;
    entregaFecha: string | null;
    calificacion: number | null;
    retroalimentacion: string | null;
    notaDevolucion: string | null;
    // Quiz
    preguntas?: PreguntaData[];
    respuestasGuardadas?: Record<number, number | string> | null;
}

interface Props {
    actividad: ActividadDetalle;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_LABEL: Record<string, string> = {
    tarea: 'Tarea', quiz: 'Quiz', examen: 'Examen',
    proyecto: 'Proyecto', taller: 'Taller',
};

const TIPO_COLOR: Record<string, string> = {
    tarea: 'bg-indigo-100 text-indigo-700',
    quiz: 'bg-rose-100 text-rose-700',
    examen: 'bg-red-100 text-red-700',
    proyecto: 'bg-purple-100 text-purple-700',
    taller: 'bg-blue-100 text-blue-700',
};

const ESTADO_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    pendiente: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '⏳' },
    vencida:   { label: 'Vencida',   color: 'bg-red-100 text-red-700 border-red-200',       icon: '⌛' },
    entregada: { label: 'Entregada', color: 'bg-blue-100 text-blue-700 border-blue-200',    icon: '✅' },
    devuelta:  { label: 'Devuelta',  color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '↩️' },
    calificada:{ label: 'Calificada',color: 'bg-green-100 text-green-700 border-green-200', icon: '🏆' },
};

function NotaCircle({ nota }: { nota: number }) {
    const color = nota >= 4 ? '#16a34a' : nota >= 3 ? '#d97706' : '#dc2626';
    const r = 44, circ = 2 * Math.PI * r;
    const pct = Math.min(nota / 5, 1);
    return (
        <div className="flex flex-col items-center gap-1">
            <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
                <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10"
                    strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
                    strokeLinecap="round" transform="rotate(-90 55 55)" />
                <text x="55" y="60" textAnchor="middle" fill={color} fontSize="22" fontWeight="bold">{nota.toFixed(1)}</text>
            </svg>
            <span className="text-xs text-gray-400">/5.0</span>
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ActividadDetalle({ actividad }: Props) {
    const { props: pageProps } = usePage<any>();
    const flash = (pageProps as any).flash as { success?: string; error?: string } | undefined;

    // Paso: 'detalle' | 'entregar' | 'quiz'
    const [paso, setPaso] = useState<'detalle' | 'entregar' | 'quiz'>('detalle');

    // Entrega de archivo/texto
    const [contenido, setContenido] = useState(actividad.entregaContenido ?? '');
    const [archivo, setArchivo] = useState<File | null>(null);
    const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Quiz: respuestas {[preguntaId]: opcionId | string}
    const [respuestas, setRespuestas] = useState<Record<number, number | string>>(
        actividad.respuestasGuardadas ?? {}
    );
    const [enviando, setEnviando] = useState(false);

    const estadoConf = ESTADO_CONFIG[actividad.estado] ?? ESTADO_CONFIG.pendiente;
    const esQuiz = actividad.tienePreguntas && ['quiz', 'examen'].includes(actividad.tipo);
    const isEntregado = ['entregada', 'calificada'].includes(actividad.estado);

    // Determinar qué fecha límite mostrar
    const fechaLimite = actividad.fechaLimiteIndividual ?? actividad.fechaEntrega;

    // Calcular días restantes
    const diasRestantes = (() => {
        const fechaISO = actividad.fechaLimiteIndividualISO ?? actividad.fechaEntregaISO;
        if (!fechaISO) return null;
        const diff = new Date(fechaISO).getTime() - Date.now();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days;
    })();

    // ── Submit entrega ────────────────────────────────────────────

    const handleEntregar = (e: React.FormEvent) => {
        e.preventDefault();
        if (enviando) return;
        setEnviando(true);
        const formData = new FormData();
        if (contenido.trim()) formData.append('contenido', contenido);
        if (archivo) formData.append('archivo', archivo);
        router.post(route('estudiante.actividades.entregar', actividad.id), formData as any, {
            forceFormData: true,
            onFinish: () => setEnviando(false),
        });
    };

    // ── Submit quiz ───────────────────────────────────────────────

    const handleQuiz = (e: React.FormEvent) => {
        e.preventDefault();
        if (enviando) return;
        setEnviando(true);
        router.post(route('estudiante.actividades.quiz', actividad.id), { respuestas }, {
            onFinish: () => setEnviando(false),
        });
    };

    // ── Cancelar entrega ──────────────────────────────────────────

    const handleCancelar = () => {
        if (!confirm('¿Seguro que deseas retirar tu entrega?')) return;
        router.delete(route('estudiante.actividades.cancelar', actividad.id));
    };

    // ── Render ────────────────────────────────────────────────────

    return (
        <SidebarLayout menuItems={estudianteMenuItems} userInfo={{ name: '', role: 'Estudiante' }}>
            <Head title={actividad.titulo} />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Link href={route('estudiante.actividades')} className="hover:text-[#293577] transition-colors">
                    Actividades
                </Link>
                <span>›</span>
                <span className="text-gray-800 font-medium truncate max-w-xs">{actividad.titulo}</span>
            </div>

            {/* Flash */}
            {flash?.success && (
                <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{flash.success}</span>
                </div>
            )}
            {flash?.error && (
                <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{flash.error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── Panel izquierdo: DETALLES ──────────────────────────── */}
                <div className="lg:col-span-2 space-y-4">

                    {/* Encabezado de la actividad */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Banda de color por tipo */}
                        <div className={`h-1.5 w-full ${TIPO_COLOR[actividad.tipo]?.replace('text-', 'bg-').replace(/bg-\S+\s/,'').replace('bg-','') ?? 'bg-[#293577]'}`}
                            style={{ background: 'linear-gradient(90deg, #293577, #4f5fb5)' }} />
                        <div className="p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                                <div className="flex flex-wrap gap-2">
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${estadoConf.color}`}>
                                        {estadoConf.icon} {estadoConf.label}
                                    </span>
                                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${TIPO_COLOR[actividad.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                                        {TIPO_LABEL[actividad.tipo] ?? actividad.tipo}
                                    </span>
                                    {actividad.permiteEntregaTardia && (
                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                                            Permite entrega tardía
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm font-bold text-[#293577]">{actividad.peso}% de la nota</span>
                            </div>

                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-1">{actividad.titulo}</h1>
                            <p className="text-sm text-gray-500">
                                {actividad.materia} · Prof. {actividad.profesor} · {actividad.curso}
                            </p>

                            {actividad.descripcion && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                    {actividad.descripcion}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Nota devuelta */}
                    {actividad.estado === 'devuelta' && actividad.notaDevolucion && (
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-orange-800 mb-1">El profesor devolvió tu entrega</p>
                                    <p className="text-sm text-orange-700 italic">"{actividad.notaDevolucion}"</p>
                                    {actividad.fechaLimiteIndividual && (
                                        <p className="text-xs text-orange-600 mt-1">
                                            Nuevo plazo: <strong>{actividad.fechaLimiteIndividual}</strong>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Retroalimentación (si calificada) */}
                    {actividad.estado === 'calificada' && actividad.retroalimentacion && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-blue-800 mb-1">Retroalimentación del profesor:</p>
                                    <p className="text-sm text-blue-700 italic">"{actividad.retroalimentacion}"</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── ZONA DE ENTREGA / QUIZ ─────────────────────────── */}

                    {paso === 'detalle' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-base font-bold text-gray-900 mb-4">Estado de tu entrega</h2>

                            {isEntregado ? (
                                /* Ya entregó */
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200">
                                        <svg className="w-5 h-5 text-green-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-sm text-green-700 font-medium">
                                            Entregado el {actividad.entregaFecha}
                                        </span>
                                    </div>
                                    {actividad.entregaContenido && (
                                        <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-600 whitespace-pre-line">
                                            {actividad.entregaContenido}
                                        </div>
                                    )}
                                    {actividad.entregaArchivo && (
                                        <a href={`/storage/${actividad.entregaArchivo}`} target="_blank" rel="noreferrer"
                                            className="flex items-center gap-2 text-sm text-[#293577] hover:underline">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                            Ver archivo adjunto
                                        </a>
                                    )}
                                    {/* Cancelar entrega si aún puede */}
                                    {actividad.puedeEntregar && actividad.estado === 'entregada' && (
                                        <button onClick={handleCancelar}
                                            className="text-xs text-red-600 hover:text-red-700 underline mt-1">
                                            Retirar entrega
                                        </button>
                                    )}
                                </div>
                            ) : actividad.estado === 'vencida' ? (
                                /* Vencida sin entrega */
                                <div className="text-center py-6">
                                    <div className="text-4xl mb-2">⌛</div>
                                    <p className="text-sm font-semibold text-red-700">El plazo ha vencido</p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {actividad.permiteEntregaTardia
                                            ? 'Esta actividad permite entregas tardías. Puedes enviar tu trabajo.'
                                            : 'No se admiten entregas después del plazo. Contacta a tu profesor.'}
                                    </p>
                                    {actividad.puedeEntregar && (
                                        <button onClick={() => setPaso(esQuiz ? 'quiz' : 'entregar')}
                                            className="mt-4 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition-colors">
                                            Entregar tardíamente
                                        </button>
                                    )}
                                </div>
                            ) : actividad.estado === 'devuelta' ? (
                                /* Devuelta para re-enviar */
                                <div className="text-center py-4">
                                    <p className="text-sm text-gray-600 mb-3">Tu entrega fue devuelta. Corrígela y vuelve a enviarla.</p>
                                    <button onClick={() => setPaso(esQuiz ? 'quiz' : 'entregar')}
                                        className="px-6 py-2.5 bg-[#293577] hover:bg-[#1e2760] text-white text-sm font-semibold rounded-xl transition-colors">
                                        Corregir y re-enviar
                                    </button>
                                </div>
                            ) : (
                                /* Pendiente */
                                <div className="text-center py-6">
                                    <p className="text-sm text-gray-500 mb-4">Aún no has enviado nada.</p>
                                    {actividad.puedeEntregar && (
                                        <button onClick={() => setPaso(esQuiz ? 'quiz' : 'entregar')}
                                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#293577] hover:bg-[#1e2760] text-white text-sm font-bold rounded-xl transition-colors shadow-sm">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                            {esQuiz ? 'Iniciar Quiz' : 'Iniciar Entrega'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Formulario de entrega (archivo / texto) ─────────── */}
                    {paso === 'entregar' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-base font-bold text-gray-900">Enviar entrega</h2>
                                <button onClick={() => setPaso('detalle')} className="text-sm text-gray-400 hover:text-gray-700">
                                    ← Volver
                                </button>
                            </div>
                            <form onSubmit={handleEntregar} className="space-y-4">
                                {/* Texto/comentario */}
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Comentario / respuesta</label>
                                    <textarea
                                        value={contenido}
                                        onChange={e => setContenido(e.target.value)}
                                        rows={6}
                                        placeholder="Escribe tu respuesta, comentarios o notas adicionales…"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] resize-none"
                                    />
                                </div>

                                {/* Archivo */}
                                <div>
                                    <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Archivo adjunto</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-[#293577]/40 hover:bg-gray-50 transition-colors"
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                                            onChange={e => {
                                                const f = e.target.files?.[0] ?? null;
                                                setArchivo(f);
                                                setArchivoNombre(f?.name ?? null);
                                            }}
                                        />
                                        {archivoNombre ? (
                                            <p className="text-sm font-medium text-[#293577]">📎 {archivoNombre}</p>
                                        ) : (
                                            <>
                                                <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                                                </svg>
                                                <p className="text-xs text-gray-400">PDF, Word, Excel, Imágenes, ZIP (máx 20MB)</p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {(!contenido.trim() && !archivo) && (
                                    <p className="text-xs text-amber-600">Debes agregar un comentario o un archivo.</p>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={() => setPaso('detalle')}
                                        className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors">
                                        Cancelar
                                    </button>
                                    <button type="submit"
                                        disabled={enviando || (!contenido.trim() && !archivo)}
                                        className="flex-1 py-2.5 bg-[#293577] hover:bg-[#1e2760] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                                        {enviando ? (
                                            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/></svg> Enviando…</>
                                        ) : (
                                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg> Enviar entrega</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ── Quiz ─────────────────────────────────────────────── */}
                    {paso === 'quiz' && actividad.preguntas && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-base font-bold text-gray-900">
                                    {TIPO_LABEL[actividad.tipo] ?? 'Quiz'}
                                </h2>
                                <button onClick={() => setPaso('detalle')} className="text-sm text-gray-400 hover:text-gray-700">
                                    ← Volver
                                </button>
                            </div>

                            {/* Info intentos */}
                            {actividad.maxIntentos !== null && (
                                <div className="mb-4 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Intentos usados: <strong>{actividad.intentosUsados}</strong> de <strong>{actividad.maxIntentos}</strong>
                                    {actividad.intentosDisponibles !== null && actividad.intentosDisponibles <= 1 && (
                                        <span className="ml-1 text-red-600 font-semibold">
                                            — Último intento
                                        </span>
                                    )}
                                </div>
                            )}

                            <form onSubmit={handleQuiz} className="space-y-6 mt-4">
                                {actividad.preguntas.map((pregunta, idx) => (
                                    <div key={pregunta.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50/50">
                                        <div className="flex items-start gap-3 mb-3">
                                            <span className="w-7 h-7 rounded-full bg-[#293577] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                {idx + 1}
                                            </span>
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-gray-800">{pregunta.enunciado}</p>
                                                {pregunta.imagen && (
                                                    <img src={pregunta.imagen} alt="Imagen de la pregunta"
                                                        className="mt-2 max-h-40 rounded-lg object-contain" />
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-400 shrink-0">{pregunta.puntos} pt{pregunta.puntos !== 1 ? 's' : ''}</span>
                                        </div>

                                        {pregunta.tipo === 'abierta' ? (
                                            <textarea
                                                value={(respuestas[pregunta.id] as string) ?? ''}
                                                onChange={e => setRespuestas(r => ({ ...r, [pregunta.id]: e.target.value }))}
                                                rows={3}
                                                placeholder="Escribe tu respuesta…"
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] resize-none"
                                            />
                                        ) : (
                                            <div className="space-y-2 pl-10">
                                                {pregunta.opciones.map(opcion => (
                                                    <label key={opcion.id}
                                                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                                                            respuestas[pregunta.id] === opcion.id
                                                                ? 'bg-[#293577]/5 border-[#293577]/30'
                                                                : 'bg-white border-gray-200 hover:bg-gray-50'
                                                        }`}>
                                                        <input
                                                            type="radio"
                                                            name={`pregunta_${pregunta.id}`}
                                                            value={opcion.id}
                                                            checked={respuestas[pregunta.id] === opcion.id}
                                                            onChange={() => setRespuestas(r => ({ ...r, [pregunta.id]: opcion.id }))}
                                                            className="w-4 h-4 text-[#293577] border-gray-300"
                                                        />
                                                        <span className="text-sm text-gray-700">{opcion.texto}</span>
                                                        {opcion.imagen && (
                                                            <img src={opcion.imagen} alt="" className="h-10 rounded object-contain" />
                                                        )}
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div className="flex gap-3 pt-2 border-t border-gray-100">
                                    <button type="button" onClick={() => setPaso('detalle')}
                                        className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors">
                                        Cancelar
                                    </button>
                                    <button type="submit" disabled={enviando}
                                        className="flex-1 py-2.5 bg-[#293577] hover:bg-[#1e2760] disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                                        {enviando ? (
                                            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/><path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8H4z"/></svg> Enviando…</>
                                        ) : (
                                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg> Enviar respuestas</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* ── Panel derecho: INFO + CALIFICACIÓN ────────────────────── */}
                <div className="space-y-4">

                    {/* Calificación */}
                    {actividad.calificacion !== null && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col items-center text-center">
                            <h3 className="text-sm font-bold text-gray-700 mb-3">Calificación</h3>
                            <NotaCircle nota={actividad.calificacion} />
                            <p className={`mt-2 text-xs font-semibold ${
                                actividad.calificacion >= 4 ? 'text-green-600' :
                                actividad.calificacion >= 3 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                                {actividad.calificacion >= 4 ? 'Aprobado' :
                                 actividad.calificacion >= 3 ? 'En proceso' : 'Reprobado'}
                            </p>
                        </div>
                    )}

                    {/* Resumen de info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
                        <h3 className="text-sm font-bold text-gray-700">Detalles</h3>

                        <InfoRow label="Asignada" value={actividad.fechaAsignacion} icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        } />

                        <InfoRow
                            label={actividad.fechaLimiteIndividual ? 'Plazo extendido' : 'Fecha límite'}
                            value={fechaLimite}
                            highlight={actividad.fechaLimiteIndividual !== null}
                            icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            }
                        />

                        {diasRestantes !== null && actividad.estado === 'pendiente' && (
                            <div className={`text-xs font-semibold px-3 py-1.5 rounded-lg text-center ${
                                diasRestantes <= 0 ? 'bg-red-50 text-red-700' :
                                diasRestantes <= 2 ? 'bg-amber-50 text-amber-700' :
                                'bg-green-50 text-green-700'
                            }`}>
                                {diasRestantes <= 0 ? 'Vence hoy' :
                                 diasRestantes === 1 ? 'Mañana es el último día' :
                                 `${diasRestantes} días restantes`}
                            </div>
                        )}

                        <InfoRow label="Peso en la nota" value={`${actividad.peso}%`} icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                        } />

                        <InfoRow label="Profesor" value={actividad.profesor} icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                        } />

                        {actividad.maxIntentos !== null && (
                            <InfoRow label="Intentos máx." value={`${actividad.intentosUsados}/${actividad.maxIntentos} usados`} icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                            } />
                        )}
                    </div>

                    {/* Botón de acción rápida si aún no inició */}
                    {paso === 'detalle' && actividad.puedeEntregar && !isEntregado && actividad.estado !== 'vencida' && (
                        <button onClick={() => setPaso(esQuiz ? 'quiz' : 'entregar')}
                            className="w-full py-3 bg-[#293577] hover:bg-[#1e2760] text-white text-sm font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d={esQuiz
                                    ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    : "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"} />
                            </svg>
                            {esQuiz ? `Iniciar ${TIPO_LABEL[actividad.tipo]}` : 'Iniciar Entrega'}
                        </button>
                    )}

                    {/* Volver a lista */}
                    <Link href={route('estudiante.actividades')}
                        className="block text-center text-sm text-gray-400 hover:text-[#293577] transition-colors py-2">
                        ← Ver todas las actividades
                    </Link>
                </div>
            </div>
        </SidebarLayout>
    );
}

// ── Sub-componente InfoRow ────────────────────────────────────────────────────

function InfoRow({ label, value, icon, highlight = false }: {
    label: string; value: string | null | undefined; icon: React.ReactNode; highlight?: boolean;
}) {
    if (!value) return null;
    return (
        <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${highlight ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                {icon}
            </div>
            <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className={`text-sm font-semibold ${highlight ? 'text-amber-700' : 'text-gray-800'}`}>{value}</p>
            </div>
        </div>
    );
}
