import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router, Link } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { profesorMenuItems } from '@/Config/profesorMenu';

// ── Types ──
interface CursoMateria {
    id: number;
    curso: string;
    cursoId: number;
    materia: string;
    nivel: string;
    pesoUsado: number;
}

interface OpcionForm {
    texto: string;
    es_correcta: boolean;
    _key: string;
}

interface PreguntaForm {
    enunciado: string;
    tipo: 'seleccion_multiple' | 'verdadero_falso' | 'abierta';
    puntos: string;
    imagenFile: File | null;
    imagenPreview: string | null;
    imagenExistente: string | null;
    opciones: OpcionForm[];
    _key: string;
}

interface ActividadEdit {
    id: number;
    cursoMateriaId: number;
    titulo: string;
    descripcion: string | null;
    archivoInstrucciones: string | null;
    tipo: string;
    fechaEntrega: string;
    porcentaje: number;
    activa: boolean;
    permiteEntregaTardia: boolean;
    maxIntentos: number | null;
    cerradaManualmente: boolean;
    tienePreguntas: boolean;
    preguntas: {
        id: number;
        enunciado: string;
        imagen: string | null;
        tipo: string;
        puntos: number;
        orden: number;
        opciones: { id: number; texto: string; imagen: string | null; es_correcta: boolean; orden: number }[];
    }[];
}

interface Props {
    profesor: { nombre: string };
    cursoMaterias: CursoMateria[];
    actividad: ActividadEdit | null;
}

// ── Constants ──
const tipos = [
    { value: 'tarea',    label: 'Tarea',    desc: 'Trabajo para hacer en casa o clase', icon: '📝', color: 'border-blue-400 bg-blue-50' },
    { value: 'quiz',     label: 'Quiz',     desc: 'Evaluación corta con preguntas',     icon: '❓', color: 'border-purple-400 bg-purple-50' },
    { value: 'examen',   label: 'Examen',   desc: 'Evaluación formal del periodo',      icon: '📋', color: 'border-red-400 bg-red-50' },
    { value: 'proyecto', label: 'Proyecto',  desc: 'Trabajo extendido investigativo',    icon: '🚀', color: 'border-emerald-400 bg-emerald-50' },
    { value: 'taller',   label: 'Taller',   desc: 'Ejercicios prácticos guiados',       icon: '🔧', color: 'border-amber-400 bg-amber-50' },
];

const tipoPreguntaOpts = [
    { value: 'seleccion_multiple', label: 'Selección Múltiple', icon: '○' },
    { value: 'verdadero_falso',    label: 'Verdadero / Falso',  icon: '✓✗' },
    { value: 'abierta',           label: 'Respuesta Abierta',   icon: '✎' },
];

let keyCounter = 0;
const genKey = () => `k_${++keyCounter}_${Date.now()}`;

const defaultOpcion = (): OpcionForm => ({ texto: '', es_correcta: false, _key: genKey() });
const defaultPregunta = (): PreguntaForm => ({
    enunciado: '', tipo: 'seleccion_multiple', puntos: '1', imagenFile: null,
    imagenPreview: null, imagenExistente: null, opciones: [
        { ...defaultOpcion(), texto: '' }, { ...defaultOpcion(), texto: '' },
        { ...defaultOpcion(), texto: '' }, { ...defaultOpcion(), texto: '' },
    ], _key: genKey(),
});

export default function CrearActividad({ profesor, cursoMaterias, actividad }: Props) {
    const isEditing = actividad !== null;

    // ── Step state ──
    const [step, setStep] = useState(1);
    const totalSteps = 3;

    // ── Form state ──
    const [cursoMateriaId, setCursoMateriaId] = useState(actividad?.cursoMateriaId?.toString() ?? '');
    const [titulo, setTitulo] = useState(actividad?.titulo ?? '');
    const [descripcion, setDescripcion] = useState(actividad?.descripcion ?? '');
    const [tipo, setTipo] = useState(actividad?.tipo ?? '');
    const [fechaEntrega, setFechaEntrega] = useState(actividad?.fechaEntrega ?? '');
    const [porcentaje, setPorcentaje] = useState(actividad?.porcentaje?.toString() ?? '');
    const [activa, setActiva] = useState(actividad?.activa ?? true);
    const [permiteEntregaTardia, setPermiteEntregaTardia] = useState(actividad?.permiteEntregaTardia ?? false);
    const [maxIntentos, setMaxIntentos] = useState(actividad?.maxIntentos?.toString() ?? '');
    const [cerradaManualmente, setCerradaManualmente] = useState(actividad?.cerradaManualmente ?? false);
    const [archivoFile, setArchivoFile] = useState<File | null>(null);
    const [archivoExistente] = useState(actividad?.archivoInstrucciones ?? null);
    const [archivoDrag, setArchivoDrag] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // ── Image picker modal ──
    const [imagenModalOpen, setImagenModalOpen] = useState(false);
    const [imagenPickerFor, setImagenPickerFor] = useState<number | null>(null);
    const [imagenModalTab, setImagenModalTab] = useState<'archivo' | 'url'>('archivo');
    const [imagenUrlInput, setImagenUrlInput] = useState('');
    const [imagenModalDrag, setImagenModalDrag] = useState(false);

    const openImagenModal = (pIdx: number) => {
        setImagenPickerFor(pIdx);
        setImagenModalTab('archivo');
        setImagenUrlInput('');
        setImagenModalOpen(true);
    };

    const handleImagenFromFile = (file: File) => {
        if (imagenPickerFor === null) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreguntas(prev => {
                const cpy = [...prev];
                cpy[imagenPickerFor!] = {
                    ...cpy[imagenPickerFor!],
                    imagenFile: file,
                    imagenPreview: e.target?.result as string,
                    imagenExistente: null,
                };
                return cpy;
            });
            setImagenModalOpen(false);
        };
        reader.readAsDataURL(file);
    };

    const handleImagenFromUrl = () => {
        if (imagenPickerFor === null || !imagenUrlInput.trim()) return;
        setPreguntas(prev => {
            const cpy = [...prev];
            cpy[imagenPickerFor!] = {
                ...cpy[imagenPickerFor!],
                imagenFile: null,
                imagenPreview: imagenUrlInput.trim(),
                imagenExistente: null,
            };
            return cpy;
        });
        setImagenModalOpen(false);
    };

    const handleArchivoFile = (file: File | null) => setArchivoFile(file);

    const onArchivoDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setArchivoDrag(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleArchivoFile(file);
    };
    const [processing, setProcessing] = useState(false);

    // ── Preguntas ──
    const [preguntas, setPreguntas] = useState<PreguntaForm[]>(() => {
        if (actividad?.preguntas?.length) {
            return actividad.preguntas.map(p => ({
                enunciado: p.enunciado,
                tipo: p.tipo as PreguntaForm['tipo'],
                puntos: p.puntos.toString(),
                imagenFile: null,
                imagenPreview: null,
                imagenExistente: p.imagen,
                opciones: p.opciones.length > 0
                    ? p.opciones.map(o => ({ texto: o.texto, es_correcta: o.es_correcta, _key: genKey() }))
                    : [defaultOpcion(), defaultOpcion()],
                _key: genKey(),
            }));
        }
        return [defaultPregunta()];
    });

    const esQuizExamen = tipo === 'quiz' || tipo === 'examen';
    const cursoMateriaSeleccionado = useMemo(
        () => cursoMaterias.find(cm => cm.id.toString() === cursoMateriaId),
        [cursoMaterias, cursoMateriaId]
    );

    // Peso disponible para el curso/materia seleccionado
    const pesoUsado = cursoMateriaSeleccionado?.pesoUsado ?? 0;
    const pesoDisponible = Math.max(0, 100 - pesoUsado);
    const porcentajeNum = parseFloat(porcentaje) || 0;

    // ── Step 1 validation ──
    const step1Valid = cursoMateriaId && titulo.trim() && tipo;
    const step2Valid = fechaEntrega && porcentaje;

    // ── Pregunta helpers ──
    const updatePregunta = useCallback((idx: number, field: string, value: any) => {
        setPreguntas(prev => {
            const cpy = [...prev];
            cpy[idx] = { ...cpy[idx], [field]: value };
            // If changing to verdadero_falso, set 2 fixed options
            if (field === 'tipo' && value === 'verdadero_falso') {
                cpy[idx].opciones = [
                    { texto: 'Verdadero', es_correcta: true, _key: genKey() },
                    { texto: 'Falso', es_correcta: false, _key: genKey() },
                ];
            }
            // If changing to abierta, clear options
            if (field === 'tipo' && value === 'abierta') {
                cpy[idx].opciones = [];
            }
            // If changing to seleccion_multiple from abierta, add default options
            if (field === 'tipo' && value === 'seleccion_multiple' && cpy[idx].opciones.length < 2) {
                cpy[idx].opciones = [defaultOpcion(), defaultOpcion(), defaultOpcion(), defaultOpcion()];
            }
            return cpy;
        });
    }, []);

    const updateOpcion = useCallback((pIdx: number, oIdx: number, field: string, value: any) => {
        setPreguntas(prev => {
            const cpy = [...prev];
            const opts = [...cpy[pIdx].opciones];
            opts[oIdx] = { ...opts[oIdx], [field]: value };
            // For single correct: uncheck others
            if (field === 'es_correcta' && value === true) {
                opts.forEach((o, i) => { if (i !== oIdx) opts[i] = { ...o, es_correcta: false }; });
            }
            cpy[pIdx] = { ...cpy[pIdx], opciones: opts };
            return cpy;
        });
    }, []);

    const addOpcion = useCallback((pIdx: number) => {
        setPreguntas(prev => {
            const cpy = [...prev];
            cpy[pIdx] = { ...cpy[pIdx], opciones: [...cpy[pIdx].opciones, defaultOpcion()] };
            return cpy;
        });
    }, []);

    const removeOpcion = useCallback((pIdx: number, oIdx: number) => {
        setPreguntas(prev => {
            const cpy = [...prev];
            cpy[pIdx] = { ...cpy[pIdx], opciones: cpy[pIdx].opciones.filter((_, i) => i !== oIdx) };
            return cpy;
        });
    }, []);

    const addPregunta = () => setPreguntas(prev => [...prev, defaultPregunta()]);

    const removePregunta = (idx: number) => {
        setPreguntas(prev => prev.filter((_, i) => i !== idx));
    };

    const duplicatePregunta = (idx: number) => {
        setPreguntas(prev => {
            const cpy = [...prev];
            const orig = cpy[idx];
            const dup: PreguntaForm = {
                ...orig,
                _key: genKey(),
                imagenFile: null,
                imagenPreview: null,
                imagenExistente: null,
                opciones: orig.opciones.map(o => ({ ...o, _key: genKey() })),
            };
            cpy.splice(idx + 1, 0, dup);
            return cpy;
        });
    };

    const movePregunta = (idx: number, dir: -1 | 1) => {
        setPreguntas(prev => {
            const cpy = [...prev];
            const newIdx = idx + dir;
            if (newIdx < 0 || newIdx >= cpy.length) return prev;
            [cpy[idx], cpy[newIdx]] = [cpy[newIdx], cpy[idx]];
            return cpy;
        });
    };

    const handlePreguntaImagen = (idx: number, file: File | null) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            updatePregunta(idx, 'imagenFile', file);
            updatePregunta(idx, 'imagenPreview', e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    // ── Submit ──
    const handleSubmit = () => {
        if (!step1Valid || !step2Valid) return;
        setProcessing(true);
        setSubmitError(null);

        const formData = new FormData();
        formData.append('curso_materia_id', cursoMateriaId);
        formData.append('titulo', titulo);
        formData.append('descripcion', descripcion);
        formData.append('tipo', tipo);
        formData.append('fecha_entrega', fechaEntrega);
        formData.append('porcentaje', porcentaje);
        formData.append('activa', activa ? '1' : '0');
        formData.append('permite_entrega_tardia', permiteEntregaTardia ? '1' : '0');
        formData.append('cerrada_manualmente', cerradaManualmente ? '1' : '0');
        if (maxIntentos) formData.append('max_intentos', maxIntentos);

        if (archivoFile) {
            formData.append('archivo_instrucciones', archivoFile);
        }

        // Questions for quiz/examen
        if (esQuizExamen && preguntas.length > 0) {
            preguntas.forEach((p, idx) => {
                formData.append(`preguntas[${idx}][enunciado]`, p.enunciado);
                formData.append(`preguntas[${idx}][tipo]`, p.tipo);
                formData.append(`preguntas[${idx}][puntos]`, p.puntos);
                if (p.imagenFile) {
                    formData.append(`preguntas[${idx}][imagen]`, p.imagenFile);
                }
                p.opciones.forEach((o, oidx) => {
                    formData.append(`preguntas[${idx}][opciones][${oidx}][texto]`, o.texto);
                    formData.append(`preguntas[${idx}][opciones][${oidx}][es_correcta]`, o.es_correcta ? '1' : '0');
                });
            });
        }

        const errorHandler = (errors: Record<string, string>) => {
            const msgs = Object.values(errors);
            setSubmitError(msgs.length > 0 ? msgs.join(' · ') : 'Error al guardar. Revisa los campos.');
            setProcessing(false);
        };

        if (isEditing) {
            router.put(`/profesor/actividades/${actividad!.id}`, formData as any, {
                forceFormData: true,
                onError: errorHandler,
                onFinish: () => setProcessing(false),
            });
        } else {
            router.post('/profesor/actividades', formData, {
                forceFormData: true,
                onError: errorHandler,
                onFinish: () => setProcessing(false),
            });
        }
    };

    // ── Total puntos ──
    const totalPuntos = preguntas.reduce((s, p) => s + (parseFloat(p.puntos) || 0), 0);

    return (
        <>
        <SidebarLayout menuItems={profesorMenuItems} userInfo={{ name: profesor.nombre, role: 'Profesor' }}>
            <Head title={isEditing ? 'Editar Actividad' : 'Nueva Actividad'} />

            <div className="max-w-4xl mx-auto space-y-6">

                {/* ── Breadcrumb ── */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Link href="/profesor/actividades" className="hover:text-[#293577] transition-colors">Actividades</Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    <span className="text-gray-800 font-medium">{isEditing ? 'Editar' : 'Nueva'}</span>
                </div>

                {/* ── Header ── */}
                <div className="bg-gradient-to-br from-[#293577] to-[#181b49] rounded-2xl p-5 sm:p-7 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 flex items-center justify-between">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold">
                                {isEditing ? 'Editar Actividad' : 'Nueva Actividad'}
                            </h1>
                            <p className="text-white/60 text-sm mt-1">
                                {isEditing ? 'Modifica los detalles de la actividad' : 'Configura todos los detalles de la actividad'}
                            </p>
                        </div>
                        {cursoMateriaSeleccionado && (
                            <div className="hidden sm:block bg-white/15 rounded-xl px-4 py-2 text-right">
                                <p className="text-xs text-white/60">Asignada a</p>
                                <p className="font-bold text-sm">{cursoMateriaSeleccionado.materia}</p>
                                <p className="text-xs text-white/80">{cursoMateriaSeleccionado.curso}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Step indicator ── */}
                <div className="flex items-center gap-2">
                    {[
                        { n: 1, label: 'Información' },
                        { n: 2, label: 'Configuración' },
                        { n: 3, label: esQuizExamen ? 'Preguntas' : 'Revisión' },
                    ].map((s, i) => (
                        <button
                            key={s.n}
                            onClick={() => setStep(s.n)}
                            className="flex items-center gap-2 flex-1"
                        >
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                step === s.n ? 'bg-[#293577] text-white shadow-lg shadow-[#293577]/30' :
                                step > s.n ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                                {step > s.n ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                ) : s.n}
                            </div>
                            <span className={`text-xs sm:text-sm font-medium hidden sm:inline ${step === s.n ? 'text-gray-800' : 'text-gray-400'}`}>{s.label}</span>
                            {i < 2 && <div className={`flex-1 h-0.5 ${step > s.n ? 'bg-emerald-400' : 'bg-gray-200'}`} />}
                        </button>
                    ))}
                </div>

                {/* ══════════ STEP 1: Información ══════════ */}
                {step === 1 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-5 sm:p-7 space-y-6">

                            {/* Curso y Materia */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Curso y Materia *</label>
                                <select
                                    value={cursoMateriaId}
                                    onChange={e => setCursoMateriaId(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                >
                                    <option value="">Seleccionar...</option>
                                    {cursoMaterias.map(cm => (
                                        <option key={cm.id} value={cm.id}>{cm.materia} — {cm.curso}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Título */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Título *</label>
                                <input
                                    type="text"
                                    value={titulo}
                                    onChange={e => setTitulo(e.target.value)}
                                    placeholder="Ej: Taller de ecuaciones cuadráticas"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                />
                            </div>

                            {/* Instrucciones */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Instrucciones / Descripción</label>
                                <textarea
                                    value={descripcion}
                                    onChange={e => setDescripcion(e.target.value)}
                                    rows={5}
                                    placeholder="Escribe las instrucciones detalladas para tus estudiantes..."
                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                />
                                <p className="text-xs text-gray-400 mt-1">{descripcion.length}/5000 caracteres</p>
                            </div>

                            {/* Archivo de instrucciones */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Archivo Adjunto (opcional)</label>
                                <div
                                    onDragOver={e => { e.preventDefault(); setArchivoDrag(true); }}
                                    onDragLeave={() => setArchivoDrag(false)}
                                    onDrop={onArchivoDrop}
                                    className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                                        archivoDrag
                                            ? 'border-[#293577] bg-[#293577]/5'
                                            : 'border-gray-300 hover:border-[#293577]/50'
                                    }`}
                                >
                                    {archivoFile ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <svg className="w-8 h-8 text-[#293577]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                                            <div className="text-left">
                                                <p className="text-sm font-semibold text-gray-800">{archivoFile.name}</p>
                                                <p className="text-xs text-gray-400">{(archivoFile.size / 1024).toFixed(1)} KB</p>
                                            </div>
                                            <button onClick={() => setArchivoFile(null)} className="ml-3 text-red-400 hover:text-red-600">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                        </div>
                                    ) : archivoExistente ? (
                                        <div className="flex items-center justify-center gap-3">
                                            <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <div className="text-left">
                                                <p className="text-sm font-medium text-gray-700">Archivo guardado</p>
                                                <p className="text-xs text-gray-400">{archivoExistente.split('/').pop()}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <svg className={`w-10 h-10 mx-auto mb-2 transition-colors ${archivoDrag ? 'text-[#293577]' : 'text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                            <p className={`text-sm transition-colors ${archivoDrag ? 'text-[#293577] font-medium' : 'text-gray-500'}`}>
                                                {archivoDrag ? 'Suelta el archivo aquí' : 'Arrastra un archivo o haz clic para seleccionar'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">PDF, imagen, Word, Excel, PPT · Max 10MB</p>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.ppt,.pptx,.xls,.xlsx"
                                        onChange={e => handleArchivoFile(e.target.files?.[0] ?? null)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* Tipo de actividad */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Tipo de Actividad *</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {tipos.map(t => {
                                        const isActive = tipo === t.value;
                                        return (
                                            <button
                                                key={t.value}
                                                type="button"
                                                onClick={() => setTipo(t.value)}
                                                className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                                                    isActive
                                                        ? `${t.color} shadow-sm`
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                            >
                                                <span className="text-2xl">{t.icon}</span>
                                                <div>
                                                    <p className={`text-sm font-bold ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>{t.label}</p>
                                                    <p className="text-[11px] text-gray-400 mt-0.5">{t.desc}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {esQuizExamen && (
                                    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                                        <p className="text-xs text-indigo-700 font-medium flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            En el paso 3 podrás crear las preguntas con opciones e imágenes
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="px-5 sm:px-7 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
                            <Link href="/profesor/actividades" className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                                Cancelar
                            </Link>
                            <button
                                onClick={() => setStep(2)}
                                disabled={!step1Valid}
                                className="px-6 py-2.5 bg-[#293577] text-white rounded-xl text-sm font-semibold hover:bg-[#181b49] disabled:opacity-40 transition-colors flex items-center gap-2"
                            >
                                Siguiente
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* ══════════ STEP 2: Configuración ══════════ */}
                {step === 2 && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-5 sm:p-7 space-y-6">

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                {/* Fecha entrega */}
                            <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha y Hora Máxima de Entrega *</label>
                                    <input
                                        type="datetime-local"
                                        value={fechaEntrega}
                                        onChange={e => setFechaEntrega(e.target.value)}
                                        min={new Date().toISOString().slice(0, 16)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                    />
                                </div>

                                {/* Peso % */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Peso en la nota (%) *
                                        {cursoMateriaSeleccionado && (
                                            <span className="ml-2 text-xs font-normal text-gray-400">
                                                {pesoUsado.toFixed(0)}% usado · {pesoDisponible.toFixed(0)}% disponible
                                            </span>
                                        )}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={porcentaje}
                                            onChange={e => setPorcentaje(e.target.value)}
                                            min="0" max={pesoDisponible} step="1"
                                            placeholder="0"
                                            className={`w-full px-4 py-3 border rounded-xl text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577] pr-10 ${
                                                porcentajeNum > pesoDisponible ? 'border-red-400 bg-red-50' : 'border-gray-300'
                                            }`}
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">%</span>
                                    </div>
                                    {cursoMateriaSeleccionado && (
                                        <div className="mt-2">
                                            <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(100, pesoUsado + porcentajeNum)}%`,
                                                        backgroundColor: (pesoUsado + porcentajeNum) > 100 ? '#ef4444' : '#293577',
                                                    }}
                                                />
                                            </div>
                                            {porcentajeNum > pesoDisponible && (
                                                <p className="text-xs text-red-500 mt-1">⚠ Supera el 100% del peso total para este curso/materia</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Publicar al guardar */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Publicar al guardar</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Si está desactivado, se guardará como borrador</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setActiva(!activa)}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${activa ? 'bg-[#293577]' : 'bg-gray-300'}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${activa ? 'right-0.5' : 'left-0.5'}`} />
                                </button>
                            </div>

                            {/* ── Opciones de entrega ── */}
                            <div className="space-y-3">
                                <p className="text-sm font-semibold text-gray-700">Opciones de entrega</p>

                                {/* Permitir entrega tardía */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Permitir entrega tardía</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Los estudiantes podrán entregar después de la fecha límite</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPermiteEntregaTardia(!permiteEntregaTardia)}
                                        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${permiteEntregaTardia ? 'bg-amber-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${permiteEntregaTardia ? 'right-0.5' : 'left-0.5'}`} />
                                    </button>
                                </div>

                                {/* Máximo de intentos (solo quiz/examen) */}
                                {esQuizExamen && (
                                    <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">Máximo de intentos</p>
                                                <p className="text-xs text-gray-400 mt-0.5">Déjalo vacío para intentos ilimitados</p>
                                            </div>
                                            <input
                                                type="number"
                                                value={maxIntentos}
                                                onChange={e => setMaxIntentos(e.target.value)}
                                                min="1"
                                                max="20"
                                                placeholder="∞"
                                                className="w-20 px-3 py-2 border border-gray-300 rounded-xl text-sm text-center focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Cerrar manualmente */}
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Cerrar actividad manualmente</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Nadie podrá entregar hasta que la reactives, sin importar la fecha</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setCerradaManualmente(!cerradaManualmente)}
                                        className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${cerradaManualmente ? 'bg-red-500' : 'bg-gray-300'}`}
                                    >
                                        <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${cerradaManualmente ? 'right-0.5' : 'left-0.5'}`} />
                                    </button>
                                </div>
                            </div>

                            {/* Resumen */}
                            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
                                <p className="text-sm font-bold text-gray-800">Resumen</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                    <div>
                                        <p className="text-lg font-extrabold text-[#293577]">{tipos.find(t => t.value === tipo)?.icon ?? '📋'}</p>
                                        <p className="text-xs text-gray-500">{tipos.find(t => t.value === tipo)?.label ?? 'Tipo'}</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-extrabold text-[#293577]">{porcentaje || '0'}%</p>
                                        <p className="text-xs text-gray-500">Peso</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-extrabold text-[#293577]">{fechaEntrega ? new Date(fechaEntrega.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }) : '—'}</p>
                                        <p className="text-xs text-gray-500">Entrega</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-extrabold text-[#293577]">{activa ? 'Sí' : 'No'}</p>
                                        <p className="text-xs text-gray-500">Publicar</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-5 sm:px-7 py-4 bg-gray-50 border-t border-gray-100 flex justify-between">
                            <button onClick={() => setStep(1)} className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                Anterior
                            </button>
                            <button
                                onClick={() => setStep(3)}
                                disabled={!step2Valid}
                                className="px-6 py-2.5 bg-[#293577] text-white rounded-xl text-sm font-semibold hover:bg-[#181b49] disabled:opacity-40 transition-colors flex items-center gap-2"
                            >
                                {esQuizExamen ? 'Crear Preguntas' : 'Revisar y Crear'}
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* ══════════ STEP 3: Preguntas (quiz/examen) O Revisión ══════════ */}
                {step === 3 && (
                    <>
                        {esQuizExamen ? (
                            /* ── Constructor de preguntas ── */
                            <div className="space-y-4">
                                {/* Pregunta stats bar */}
                                <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-bold text-gray-800">{preguntas.length} pregunta{preguntas.length !== 1 && 's'}</span>
                                        <span className="text-sm text-gray-400">|</span>
                                        <span className="text-sm text-gray-600">{totalPuntos.toFixed(1)} puntos totales</span>
                                    </div>
                                    <button
                                        onClick={addPregunta}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#293577] text-white rounded-lg text-sm font-semibold hover:bg-[#181b49] transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                        Agregar Pregunta
                                    </button>
                                </div>

                                {/* Preguntas list */}
                                {preguntas.map((pregunta, pIdx) => (
                                    <div key={pregunta._key} className="bg-white rounded-2xl border border-gray-200 shadow-sm">
                                        {/* Pregunta header */}
                                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 rounded-t-2xl flex flex-wrap items-center gap-2">
                                            <span className="w-7 h-7 rounded-full bg-[#293577] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{pIdx + 1}</span>
                                            <div className="relative flex-shrink-0">
                                                <select
                                                    value={pregunta.tipo}
                                                    onChange={e => updatePregunta(pIdx, 'tipo', e.target.value)}
                                                    className="appearance-none bg-white border border-gray-300 rounded-lg pl-3 pr-7 py-1.5 text-xs font-medium text-gray-700 focus:ring-2 focus:ring-[#293577] focus:border-[#293577] cursor-pointer"
                                                >
                                                    {tipoPreguntaOpts.map(tp => (
                                                        <option key={tp.value} value={tp.value}>{tp.label}</option>
                                                    ))}
                                                </select>
                                                </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={pregunta.puntos}
                                                        onChange={e => updatePregunta(pIdx, 'puntos', e.target.value)}
                                                        min="0" step="0.5"
                                                        className="w-16 text-xs border border-gray-300 rounded-lg px-2 py-1.5 text-center focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                                    />
                                                </div>
                                                <span className="text-xs text-gray-400 font-medium">pts</span>
                                            </div>
                                            <div className="ml-auto flex items-center gap-0.5">
                                                <button onClick={() => movePregunta(pIdx, -1)} disabled={pIdx === 0} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded" title="Mover arriba">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                                </button>
                                                <button onClick={() => movePregunta(pIdx, 1)} disabled={pIdx === preguntas.length - 1} className="p-1.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 rounded" title="Mover abajo">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                </button>
                                                <button onClick={() => duplicatePregunta(pIdx)} className="p-1.5 text-gray-400 hover:text-blue-500 rounded" title="Duplicar">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                                </button>
                                                {preguntas.length > 1 && (
                                                    <button onClick={() => removePregunta(pIdx)} className="p-1.5 text-gray-400 hover:text-red-500 rounded" title="Eliminar">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Pregunta body */}
                                        <div className="p-4 sm:p-5 space-y-4">
                                            {/* Enunciado */}
                                            <textarea
                                                value={pregunta.enunciado}
                                                onChange={e => updatePregunta(pIdx, 'enunciado', e.target.value)}
                                                placeholder="Escribe el enunciado de la pregunta..."
                                                rows={2}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                            />

                                            {/* Imagen de la pregunta */}
                                            <div className="flex items-center gap-3 flex-wrap">
                                                {(pregunta.imagenPreview || pregunta.imagenExistente) && (
                                                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
                                                        <img
                                                            src={pregunta.imagenPreview || `/storage/${pregunta.imagenExistente}`}
                                                            alt="Imagen pregunta"
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <button
                                                            onClick={() => { updatePregunta(pIdx, 'imagenFile', null); updatePregunta(pIdx, 'imagenPreview', null); updatePregunta(pIdx, 'imagenExistente', null); }}
                                                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                )}
                                                <label className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 cursor-pointer transition-colors"
                                                    onClick={e => { e.preventDefault(); openImagenModal(pIdx); }}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    Agregar imagen
                                                </label>
                                            </div>

                                            {/* Opciones */}
                                            {pregunta.tipo !== 'abierta' && (
                                                <div className="space-y-2">
                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                        {pregunta.tipo === 'verdadero_falso' ? 'Respuesta correcta' : 'Opciones (marca la correcta)'}
                                                    </p>
                                                    {pregunta.opciones.map((opc, oIdx) => (
                                                        <div key={opc._key} className="flex items-center gap-2 group">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateOpcion(pIdx, oIdx, 'es_correcta', !opc.es_correcta)}
                                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                                    opc.es_correcta
                                                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                                                        : 'border-gray-300 hover:border-gray-400'
                                                                }`}
                                                            >
                                                                {opc.es_correcta && (
                                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                                )}
                                                            </button>
                                                            <input
                                                                type="text"
                                                                value={opc.texto}
                                                                onChange={e => updateOpcion(pIdx, oIdx, 'texto', e.target.value)}
                                                                placeholder={`Opción ${String.fromCharCode(65 + oIdx)}`}
                                                                disabled={pregunta.tipo === 'verdadero_falso'}
                                                                className={`flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-[#293577] ${
                                                                    opc.es_correcta ? 'border-emerald-300 bg-emerald-50' : 'border-gray-300'
                                                                } ${pregunta.tipo === 'verdadero_falso' ? 'bg-gray-50' : ''}`}
                                                            />
                                                            {pregunta.tipo === 'seleccion_multiple' && pregunta.opciones.length > 2 && (
                                                                <button
                                                                    onClick={() => removeOpcion(pIdx, oIdx)}
                                                                    className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {pregunta.tipo === 'seleccion_multiple' && pregunta.opciones.length < 6 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => addOpcion(pIdx)}
                                                            className="text-xs text-[#293577] font-medium flex items-center gap-1 mt-1 hover:underline"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                                            Agregar opción
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {pregunta.tipo === 'abierta' && (
                                                <div className="bg-gray-50 rounded-xl p-4 border border-dashed border-gray-300">
                                                    <p className="text-xs text-gray-400 italic">El estudiante escribirá su respuesta en un campo de texto libre. La calificación será manual.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Add pregunta button at bottom */}
                                <button
                                    onClick={addPregunta}
                                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-sm font-medium text-gray-500 hover:border-[#293577] hover:text-[#293577] transition-all flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                    Agregar otra pregunta
                                </button>
                            </div>
                        ) : (
                            /* ── Revisión final (tarea/proyecto/taller) ── */
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <div className="p-5 sm:p-7 space-y-4">
                                    <h3 className="text-base font-bold text-gray-800">Resumen de la Actividad</h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <ReviewField label="Materia" value={cursoMateriaSeleccionado ? `${cursoMateriaSeleccionado.materia} — ${cursoMateriaSeleccionado.curso}` : ''} />
                                        <ReviewField label="Tipo" value={tipos.find(t => t.value === tipo)?.label ?? tipo} />
                                        <ReviewField label="Título" value={titulo} />
                                        <ReviewField label="Fecha de entrega" value={fechaEntrega ? new Date(fechaEntrega.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
                                        <ReviewField label="Peso" value={`${porcentaje}%`} />
                                        <ReviewField label="Estado" value={activa ? 'Publicada' : 'Borrador'} />
                                    </div>

                                    {descripcion && (
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Instrucciones</p>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-4">{descripcion}</p>
                                        </div>
                                    )}
                                    {archivoFile && (
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <svg className="w-4 h-4 text-[#293577]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                            {archivoFile.name}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Error message */}
                        {submitError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>{submitError}</span>
                            </div>
                        )}

                        {/* Footer for step 3 */}
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex justify-between items-center sticky bottom-4">
                            <button onClick={() => setStep(2)} className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                Anterior
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={processing || !step1Valid || !step2Valid}
                                className="px-8 py-2.5 bg-[#293577] text-white rounded-xl text-sm font-bold hover:bg-[#181b49] disabled:opacity-40 transition-colors flex items-center gap-2"
                            >
                                {processing ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Guardando...</>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        {isEditing ? 'Guardar Cambios' : 'Crear Actividad'}
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </SidebarLayout>

        {/* ── Image Picker Modal ── */}
        {imagenModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-bold text-gray-800">Insertar imagen</h3>
                        <button onClick={() => setImagenModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-100">
                        {(['archivo', 'url'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setImagenModalTab(tab)}
                                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                                    imagenModalTab === tab
                                        ? 'border-b-2 border-[#293577] text-[#293577]'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {tab === 'archivo' ? '\uD83D\uDCC2 Subir archivo' : '\uD83D\uDD17 Desde URL'}
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div className="p-5">
                        {imagenModalTab === 'archivo' ? (
                            <div
                                onDragOver={e => { e.preventDefault(); setImagenModalDrag(true); }}
                                onDragLeave={() => setImagenModalDrag(false)}
                                onDrop={e => {
                                    e.preventDefault();
                                    setImagenModalDrag(false);
                                    const file = e.dataTransfer.files?.[0];
                                    if (file && file.type.startsWith('image/')) handleImagenFromFile(file);
                                }}
                                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                                    imagenModalDrag ? 'border-[#293577] bg-[#293577]/5' : 'border-gray-300 hover:border-[#293577]/50'
                                }`}
                            >
                                <svg className="w-10 h-10 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                <p className="text-sm text-gray-600 mb-1">Arrastra una imagen aquí</p>
                                <p className="text-xs text-gray-400 mb-4">o haz clic para seleccionar</p>
                                <label className="inline-flex items-center gap-2 px-4 py-2 bg-[#293577] text-white rounded-lg text-sm font-medium cursor-pointer hover:bg-[#181b49] transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
                                    Seleccionar imagen
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImagenFromFile(f); }}
                                    />
                                </label>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">URL de la imagen</label>
                                    <input
                                        type="url"
                                        value={imagenUrlInput}
                                        onChange={e => setImagenUrlInput(e.target.value)}
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                    />
                                </div>
                                {imagenUrlInput && (
                                    <div className="rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-50 flex items-center justify-center">
                                        <img
                                            src={imagenUrlInput}
                                            alt="Preview"
                                            className="max-h-40 max-w-full object-contain"
                                            onError={e => (e.currentTarget.style.display = 'none')}
                                        />
                                    </div>
                                )}
                                <button
                                    onClick={handleImagenFromUrl}
                                    disabled={!imagenUrlInput.trim()}
                                    className="w-full py-2.5 bg-[#293577] text-white rounded-xl text-sm font-semibold hover:bg-[#181b49] disabled:opacity-40 transition-colors"
                                >
                                    Usar esta imagen
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

function ReviewField({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-medium text-gray-800 mt-0.5">{value || '—'}</p>
        </div>
    );
}
