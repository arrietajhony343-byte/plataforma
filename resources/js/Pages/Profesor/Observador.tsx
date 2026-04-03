import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import { profesorMenuItems } from '@/Config/profesorMenu';

interface EstudianteBack {
    id: number;
    nombre: string;
    curso: string;
}

interface ObservacionBack {
    id: number;
    estudiante: string;
    curso?: string;
    materia: string;
    tipo: string;
    categoria?: string;
    descripcion: string;
    fecha: string;
}

interface CursoMateriaMap {
    id: number;
    curso_id: number;
    materia_id: number;
}

interface PeriodoItem {
    id: number;
    nombre: string;
    numero: number;
    fecha_inicio: string;
    fecha_fin: string;
    estado: string;
}

interface DirectorCursoItem {
    id: number;
    nombre: string;
}

interface DirectorEstudianteItem {
    estudiante_id: number;
    estudiante: string;
    documento?: string;
    fecha_nacimiento?: string;
    direccion?: string;
    telefono?: string;
    foto?: string | null;
    acudiente?: string;
    telefono_acudiente?: string;
    curso_id: number;
    curso: string;
    grado?: string;
    grupo?: string;
    director_grupo?: string;
    periodo_id: number;
    periodo: string;
}

interface ObservadorDirectorItem {
    id: number;
    estudiante_id: number;
    estudiante: string;
    curso_id: number;
    curso: string;
    periodo_id: number;
    periodo: string;
    fecha_realizacion: string;
    fortalezas: string;
    dificultades: string;
    compromisos: string;
    resumen_general: string;
    ficha?: {
        social_afectivo?: string;
        comunicacion_norma?: string;
        conductual_academico?: string;
        afinidad_plan_mejora?: string;
        compromiso_detalle?: string;
    } | null;
    estado: 'borrador' | 'completo';
    updated_at: string;
}

interface BoletinObservacionItem {
    id: number;
    estudiante_id: number;
    curso_id: number;
    periodo_id: number;
    observacion: string | null;
}

interface Props {
    profesor: {
        nombre: string;
    };
    cursos: Array<{ id: number; nombre: string }>;
    estudiantes: EstudianteBack[];
    observaciones: ObservacionBack[];
    cursoMaterias: CursoMateriaMap[];
    periodos: PeriodoItem[];
    directorCursos: DirectorCursoItem[];
    directorEstudiantes: DirectorEstudianteItem[];
    observadorDirector: ObservadorDirectorItem[];
    boletinObservaciones: BoletinObservacionItem[];
}

type ComentarioConsolidadoItem = {
    id: string;
    origen: string;
    tipo: string;
    categoria: string;
    descripcion: string;
    fecha: string;
};

type TipoObservacion = 'positiva' | 'negativa';

interface Etiqueta {
    id: string;
    nombre: string;
    tipo: TipoObservacion;
}

export default function Observador({ profesor, cursos, estudiantes, observaciones, cursoMaterias, periodos, directorCursos, directorEstudiantes, observadorDirector, boletinObservaciones }: Props) {
    const [busqueda, setBusqueda] = useState('');
    const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoObservacion>('positiva');
    const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState<string[]>([]);
    const [descripcion, setDescripcion] = useState('');
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState('');
    const [cursoFiltro, setCursoFiltro] = useState('');
    const [tab, setTab] = useState<'nuevo' | 'director' | 'historial'>('nuevo');

    const [directorCursoId, setDirectorCursoId] = useState<string>('');
    const [directorPeriodoId, setDirectorPeriodoId] = useState<string>('');
    const [directorEstudianteId, setDirectorEstudianteId] = useState<string>('');
    const [resumenDirector, setResumenDirector] = useState('');
    const [observacionBoletin, setObservacionBoletin] = useState('');
    const [fortalezas, setFortalezas] = useState('');
    const [dificultades, setDificultades] = useState('');
    const [compromisos, setCompromisos] = useState('');
    const [ficha, setFicha] = useState({
        social_afectivo: '',
        comunicacion_norma: '',
        conductual_academico: '',
        afinidad_plan_mejora: '',
        compromiso_detalle: '',
    });
    const [comentariosConsolidados, setComentariosConsolidados] = useState<ComentarioConsolidadoItem[]>([]);
    const [cargandoConsolidados, setCargandoConsolidados] = useState(false);
    const [guardandoBoletin, setGuardandoBoletin] = useState(false);
    const [guardandoObservador, setGuardandoObservador] = useState(false);
    const [feedbackDirector, setFeedbackDirector] = useState<{ tipo: 'success' | 'error' | 'info'; mensaje: string } | null>(null);
    const [boletinGuardado, setBoletinGuardado] = useState('');
    const [directorGuardado, setDirectorGuardado] = useState({
        resumen: '',
        fortalezas: '',
        dificultades: '',
        compromisos: '',
        ficha: '',
    });
    const cambiosSinGuardarRef = useRef(false);
    const omitirGuardNavegacionRef = useRef(false);

    const fechaActual = new Date().toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    const etiquetasPredefinidas: Etiqueta[] = [
        { id: 'llegada_tarde', nombre: 'Llegada Tarde', tipo: 'negativa' },
        { id: 'sin_tarea', nombre: 'Sin Tarea', tipo: 'negativa' },
        { id: 'excelente_participacion', nombre: 'Excelente Participación', tipo: 'positiva' },
        { id: 'falta_respeto', nombre: 'Falta de Respeto', tipo: 'negativa' },
        { id: 'trabajo_grupo', nombre: 'Buen Trabajo en Grupo', tipo: 'positiva' },
        { id: 'mejora_academica', nombre: 'Mejora Académica', tipo: 'positiva' },
        { id: 'inasistencia', nombre: 'Inasistencia', tipo: 'negativa' },
        { id: 'citacion_padres', nombre: 'Citación a Padres', tipo: 'negativa' },
    ];

    const [etiquetasPersonalizadas, setEtiquetasPersonalizadas] = useState<Etiqueta[]>([]);
    const [mostrarModalEtiqueta, setMostrarModalEtiqueta] = useState(false);
    const [nuevaEtiqueta, setNuevaEtiqueta] = useState({ nombre: '', tipo: 'positiva' as TipoObservacion });

    const todasLasEtiquetas = [...etiquetasPredefinidas, ...etiquetasPersonalizadas];

    const toggleEtiqueta = (id: string) => {
        setEtiquetasSeleccionadas(prev => 
            prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
        );
    };

    const agregarEtiquetaPersonalizada = () => {
        if (nuevaEtiqueta.nombre.trim()) {
            const id = nuevaEtiqueta.nombre.toLowerCase().replace(/\s/g, '_');
            setEtiquetasPersonalizadas([...etiquetasPersonalizadas, { 
                id, 
                nombre: nuevaEtiqueta.nombre, 
                tipo: nuevaEtiqueta.tipo 
            }]);
            setNuevaEtiqueta({ nombre: '', tipo: 'positiva' });
            setMostrarModalEtiqueta(false);
        }
    };

    const getTipoColor = (tipo: TipoObservacion) => {
        switch (tipo) {
            case 'positiva': return 'bg-green-100 text-green-700 border-green-300';
            case 'negativa': return 'bg-red-100 text-red-700 border-red-300';
            default: return 'bg-yellow-100 text-yellow-700 border-yellow-300';
        }
    };

    const getTipoIcon = (tipo: TipoObservacion) => {
        switch (tipo) {
            case 'positiva': return '✓';
            case 'negativa': return '✕';
            default: return '•';
        }
    };

    const directorEstudiantesFiltrados = useMemo(() => {
        return directorEstudiantes.filter((item) => {
            const matchCurso = !directorCursoId || item.curso_id === Number(directorCursoId);
            const matchPeriodo = !directorPeriodoId || item.periodo_id === Number(directorPeriodoId);
            return matchCurso && matchPeriodo;
        });
    }, [directorCursoId, directorPeriodoId, directorEstudiantes]);

    const registroDirectorActual = useMemo(() => {
        if (!directorCursoId || !directorPeriodoId || !directorEstudianteId) return null;
        return observadorDirector.find((r) =>
            r.curso_id === Number(directorCursoId)
            && r.periodo_id === Number(directorPeriodoId)
            && r.estudiante_id === Number(directorEstudianteId)
        ) ?? null;
    }, [directorCursoId, directorPeriodoId, directorEstudianteId, observadorDirector]);

    const registroBoletinActual = useMemo(() => {
        if (!directorCursoId || !directorPeriodoId || !directorEstudianteId) return null;
        return boletinObservaciones.find((r) =>
            r.curso_id === Number(directorCursoId)
            && r.periodo_id === Number(directorPeriodoId)
            && r.estudiante_id === Number(directorEstudianteId)
        ) ?? null;
    }, [directorCursoId, directorPeriodoId, directorEstudianteId, boletinObservaciones]);

    const estudianteDirectorActual = useMemo(() => {
        if (!directorCursoId || !directorPeriodoId || !directorEstudianteId) return null;
        return directorEstudiantes.find((r) =>
            r.curso_id === Number(directorCursoId)
            && r.periodo_id === Number(directorPeriodoId)
            && r.estudiante_id === Number(directorEstudianteId)
        ) ?? null;
    }, [directorCursoId, directorPeriodoId, directorEstudianteId, directorEstudiantes]);

    const serializeFicha = (value: typeof ficha) => JSON.stringify({
        social_afectivo: (value.social_afectivo ?? '').trim(),
        comunicacion_norma: (value.comunicacion_norma ?? '').trim(),
        conductual_academico: (value.conductual_academico ?? '').trim(),
        afinidad_plan_mejora: (value.afinidad_plan_mejora ?? '').trim(),
        compromiso_detalle: (value.compromiso_detalle ?? '').trim(),
    });

    const boletinDirty = !!directorEstudianteId && observacionBoletin.trim() !== boletinGuardado;
    const directorDirty = !!directorEstudianteId && (
        resumenDirector.trim() !== directorGuardado.resumen
        || fortalezas.trim() !== directorGuardado.fortalezas
        || dificultades.trim() !== directorGuardado.dificultades
        || compromisos.trim() !== directorGuardado.compromisos
        || serializeFicha(ficha) !== directorGuardado.ficha
    );
    const hasUnsavedChanges = tab === 'director' && (boletinDirty || directorDirty);

    useEffect(() => {
        cambiosSinGuardarRef.current = hasUnsavedChanges;
    }, [hasUnsavedChanges]);

    useEffect(() => {
        const handler = (e: BeforeUnloadEvent) => {
            if (!cambiosSinGuardarRef.current) return;
            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, []);

    useEffect(() => {
        const unsubscribe = router.on('before', () => {
            if (omitirGuardNavegacionRef.current) return;
            if (!cambiosSinGuardarRef.current) return;
            return window.confirm('Tienes cambios sin guardar en el observador/boletín. ¿Seguro que quieres salir?');
        });

        return () => unsubscribe();
    }, []);

    const confirmarDescartar = (contexto: string): boolean => {
        if (!hasUnsavedChanges) return true;
        return window.confirm(`Tienes cambios sin guardar. ¿Deseas descartarlos para ${contexto}?`);
    };

    const cambiarConGuard = (contexto: string, action: () => void) => {
        if (!confirmarDescartar(contexto)) return;
        setFeedbackDirector(null);
        action();
    };

    const cambiarTab = (next: 'nuevo' | 'director' | 'historial') => {
        if (next === tab) return;
        cambiarConGuard(`ir a la pestaña ${next}`, () => setTab(next));
    };

    useEffect(() => {
        if (registroDirectorActual) {
            setResumenDirector(registroDirectorActual.resumen_general ?? '');
            setFortalezas(registroDirectorActual.fortalezas ?? '');
            setDificultades(registroDirectorActual.dificultades ?? '');
            setCompromisos(registroDirectorActual.compromisos ?? '');
            setFicha({
                social_afectivo: registroDirectorActual.ficha?.social_afectivo ?? '',
                comunicacion_norma: registroDirectorActual.ficha?.comunicacion_norma ?? '',
                conductual_academico: registroDirectorActual.ficha?.conductual_academico ?? '',
                afinidad_plan_mejora: registroDirectorActual.ficha?.afinidad_plan_mejora ?? '',
                compromiso_detalle: registroDirectorActual.ficha?.compromiso_detalle ?? '',
            });
            setDirectorGuardado({
                resumen: (registroDirectorActual.resumen_general ?? '').trim(),
                fortalezas: (registroDirectorActual.fortalezas ?? '').trim(),
                dificultades: (registroDirectorActual.dificultades ?? '').trim(),
                compromisos: (registroDirectorActual.compromisos ?? '').trim(),
                ficha: serializeFicha({
                    social_afectivo: registroDirectorActual.ficha?.social_afectivo ?? '',
                    comunicacion_norma: registroDirectorActual.ficha?.comunicacion_norma ?? '',
                    conductual_academico: registroDirectorActual.ficha?.conductual_academico ?? '',
                    afinidad_plan_mejora: registroDirectorActual.ficha?.afinidad_plan_mejora ?? '',
                    compromiso_detalle: registroDirectorActual.ficha?.compromiso_detalle ?? '',
                }),
            });
            return;
        }

        setResumenDirector('');
        setFortalezas('');
        setDificultades('');
        setCompromisos('');
        setFicha({
            social_afectivo: '',
            comunicacion_norma: '',
            conductual_academico: '',
            afinidad_plan_mejora: '',
            compromiso_detalle: '',
        });
        setDirectorGuardado({
            resumen: '',
            fortalezas: '',
            dificultades: '',
            compromisos: '',
            ficha: serializeFicha({
                social_afectivo: '',
                comunicacion_norma: '',
                conductual_academico: '',
                afinidad_plan_mejora: '',
                compromiso_detalle: '',
            }),
        });
    }, [registroDirectorActual]);

    useEffect(() => {
        const texto = (registroBoletinActual?.observacion ?? '').trim();
        setObservacionBoletin(texto);
        setBoletinGuardado(texto);
    }, [registroBoletinActual]);

    const fetchComentariosConsolidados = async (): Promise<ComentarioConsolidadoItem[]> => {
        if (!directorEstudianteId || !directorCursoId || !directorPeriodoId) return [];

        try {
            const r = await fetch(`/profesor/observador/comentarios-consolidados?estudiante_id=${directorEstudianteId}&curso_id=${directorCursoId}&periodo_id=${directorPeriodoId}`);
            const data = await r.json();
            const docentes = (data.comentarios_docentes ?? []) as ComentarioConsolidadoItem[];
            const asistencia = (data.comentarios_asistencia ?? []) as ComentarioConsolidadoItem[];
            return [...docentes, ...asistencia].sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
        } catch {
            return [];
        }
    };

    const cargarComentariosConsolidados = async () => {
        if (!directorEstudianteId || !directorCursoId || !directorPeriodoId) return;
        setCargandoConsolidados(true);
        try {
            const merged = await fetchComentariosConsolidados();
            setComentariosConsolidados(merged);
        } finally {
            setCargandoConsolidados(false);
        }
    };

    // Filtrar estudiantes por búsqueda y curso
    const estudiantesFiltrados = estudiantes.filter(e => {
        const matchBusqueda = !busqueda || e.nombre.toLowerCase().includes(busqueda.toLowerCase());
        const matchCurso = !cursoFiltro || e.curso === cursos.find(c => c.id === Number(cursoFiltro))?.nombre;
        return matchBusqueda && matchCurso;
    });

    const registrarObservacion = () => {
        if (!estudianteSeleccionado || !descripcion.trim()) return;
        const est = estudiantes.find(e => e.id === Number(estudianteSeleccionado));
        if (!est) return;
        // Find a curso_materia_id for this student's curso
        const cursoObj = cursos.find(c => c.nombre === est.curso);
        const cm = cursoMaterias.find(cma => cma.curso_id === cursoObj?.id);
        if (!cm) return;

        const etiquetasTexto = etiquetasSeleccionadas.map(id => {
            const et = [...etiquetasPredefinidas, ...etiquetasPersonalizadas].find(e => e.id === id);
            return et?.nombre;
        }).filter(Boolean).join(', ');

        router.post('/profesor/observador', {
            estudiante_id: Number(estudianteSeleccionado),
            curso_materia_id: cm.id,
            tipo: tipoSeleccionado,
            categoria: etiquetasTexto || 'General',
            descripcion: etiquetasTexto ? `[${etiquetasTexto}] ${descripcion}` : descripcion,
        }, {
            onSuccess: () => {
                setDescripcion('');
                setEtiquetasSeleccionadas([]);
                setEstudianteSeleccionado('');
            },
        });
    };

    const guardarObservadorDirector = () => {
        if (!directorCursoId || !directorPeriodoId || !directorEstudianteId) return;
        if (!directorDirty) {
            setFeedbackDirector({ tipo: 'info', mensaje: 'No hay cambios por guardar en el observador general.' });
            return;
        }

        omitirGuardNavegacionRef.current = true;
        setGuardandoObservador(true);
        setFeedbackDirector(null);

        router.post('/profesor/observador/director-reporte', {
            curso_id: Number(directorCursoId),
            periodo_id: Number(directorPeriodoId),
            estudiante_id: Number(directorEstudianteId),
            resumen_general: resumenDirector,
            fortalezas,
            dificultades,
            compromisos,
            ficha,
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setDirectorGuardado({
                    resumen: resumenDirector.trim(),
                    fortalezas: fortalezas.trim(),
                    dificultades: dificultades.trim(),
                    compromisos: compromisos.trim(),
                    ficha: serializeFicha(ficha),
                });
                setFeedbackDirector({ tipo: 'success', mensaje: 'Observador general guardado correctamente.' });
                router.reload({ only: ['observadorDirector'] });
            },
            onError: () => {
                setFeedbackDirector({ tipo: 'error', mensaje: 'No se pudo guardar el observador general. Revisa los datos e inténtalo de nuevo.' });
            },
            onFinish: () => {
                setGuardandoObservador(false);
                omitirGuardNavegacionRef.current = false;
            },
        });
    };

    const guardarObservacionBoletin = () => {
        if (!directorCursoId || !directorPeriodoId || !directorEstudianteId) return;
        if (observacionBoletin.trim().length < 8) {
            alert('La observación del boletín debe tener al menos 8 caracteres.');
            return;
        }

        if (!boletinDirty) {
            setFeedbackDirector({ tipo: 'info', mensaje: 'No hay cambios por guardar en la observación del boletín.' });
            return;
        }

        omitirGuardNavegacionRef.current = true;
        setGuardandoBoletin(true);
        setFeedbackDirector(null);

        router.post('/profesor/observador/boletin-observacion', {
            curso_id: Number(directorCursoId),
            periodo_id: Number(directorPeriodoId),
            estudiante_id: Number(directorEstudianteId),
            observacion_general: observacionBoletin.trim(),
        }, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                const limpio = observacionBoletin.trim();
                setObservacionBoletin(limpio);
                setBoletinGuardado(limpio);
                setFeedbackDirector({ tipo: 'success', mensaje: 'Observación del boletín guardada correctamente.' });
                router.reload({ only: ['boletinObservaciones'] });
            },
            onError: () => {
                setFeedbackDirector({ tipo: 'error', mensaje: 'No se pudo guardar la observación del boletín. Revisa los datos e inténtalo de nuevo.' });
            },
            onFinish: () => {
                setGuardandoBoletin(false);
                omitirGuardNavegacionRef.current = false;
            },
        });
    };

    const cargarImagen = async (src?: string | null): Promise<string | null> => {
        if (!src) return null;
        try {
            const r = await fetch(src);
            if (!r.ok) return null;
            const blob = await r.blob();
            return await new Promise((resolve) => {
                const fr = new FileReader();
                fr.onloadend = () => resolve(typeof fr.result === 'string' ? fr.result : null);
                fr.onerror = () => resolve(null);
                fr.readAsDataURL(blob);
            });
        } catch {
            return null;
        }
    };

    const LOGO_CANDIDATES_OBSERVADOR = [
        '/storage/logo-certificados.png',
        '/storage/logo-certificados.jpg',
        '/storage/logo.png',
        '/logo-certificados.png',
        '/logo-certificados.jpg',
        '/logo-certificados.jpeg',
        '/images/logo-certificados.png',
        '/images/logo-certificados.jpg',
        '/images/logo.png',
        '/img/logo.png',
        '/logo.png',
    ];

    const cargarLogoObservador = async (): Promise<string | null> => {
        for (const candidate of LOGO_CANDIDATES_OBSERVADOR) {
            const logo = await cargarImagen(candidate);
            if (logo) return logo;
        }
        return null;
    };

    const dibujarEncabezadoObservador = (
        doc: jsPDF,
        logoHeader: string | null,
        rightTop: string,
        rightBottom: string,
        titulo: string,
    ) => {
        const W = 210;
        const LOGO_X = 7.5;
        const LOGO_Y = 2.5;
        const LOGO_W = 38;
        const LOGO_H = 41;
        const TRIANG_MAX = 50;
        const TRIANG_MID = 33;
        const TRIANG_MIN = 16;
        const TEXT_LEFT = LOGO_X + LOGO_W + 6;
        const TEXT_RIGHT = W - TRIANG_MAX - 3;
        const TEXT_CX = (TEXT_LEFT + TEXT_RIGHT) / 2;

        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, W, 60, 'F');

        doc.setFillColor(188, 214, 242);
        doc.triangle(W - TRIANG_MAX, 0, W, 0, W, TRIANG_MAX, 'F');
        doc.setFillColor(80, 130, 205);
        doc.triangle(W - TRIANG_MID, 0, W, 0, W, TRIANG_MID, 'F');
        doc.setFillColor(22, 55, 148);
        doc.triangle(W - TRIANG_MIN, 0, W, 0, W, TRIANG_MIN, 'F');

        if (logoHeader) {
            const tipo = logoHeader.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.addImage(logoHeader, tipo, LOGO_X, LOGO_Y, LOGO_W, LOGO_H);
        }

        doc.setTextColor(10, 35, 90);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('INSTITUTO PEDAGOGICO', TEXT_CX, 13, { align: 'center' });
        doc.text('EMPRENDEDORES DEL SABER', TEXT_CX, 22.5, { align: 'center' });
        doc.setTextColor(25, 25, 25);
        doc.setFont('times', 'italic');
        doc.setFontSize(8.5);
        doc.text('Ser, Saber y Emprender', TEXT_CX, 29.5, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.text('Aprobado por Resolucion No 9385 del 10 - 11 - 2025', TEXT_CX, 35.5, { align: 'center' });
        doc.text('DANE 313001800093  -  NIT 73143410 - 6', TEXT_CX, 40.2, { align: 'center' });

        doc.setFillColor(10, 35, 90);
        doc.rect(TEXT_LEFT, 46, Math.max(70, TEXT_RIGHT - TEXT_LEFT), 2.1, 'F');

        doc.setFillColor(24, 31, 84);
        doc.rect(0, 50, W, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text(titulo, TEXT_CX, 54.6, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.3);
        doc.text(`${rightTop}  ·  ${rightBottom}`, TEXT_CX, 58.2, { align: 'center' });

        doc.setTextColor(30, 41, 59);
    };

    const exportarObservadorPdf = async () => {
        if (!estudianteDirectorActual || !directorPeriodoId) {
            alert('Selecciona curso, período y estudiante para generar el observador.');
            return;
        }

        let comentariosPdf = comentariosConsolidados;
        if (comentariosPdf.length === 0) {
            comentariosPdf = await fetchComentariosConsolidados();
        }

        if (comentariosPdf.length > 0 && comentariosConsolidados.length === 0) {
            setComentariosConsolidados(comentariosPdf);
        }

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const foto = await cargarImagen(estudianteDirectorActual.foto);

        const logoHeader = await cargarLogoObservador();
        const periodoNombre = periodos.find(p => p.id === Number(directorPeriodoId))?.nombre || 'PERIODO';
        const generadoEn = new Date().toLocaleString('es-CO');

        const drawHeader = (titulo: string, rightBottom: string) => {
            dibujarEncabezadoObservador(
                doc,
                logoHeader,
                `Generado: ${generadoEn}`,
                rightBottom,
                titulo,
            );
        };

        drawHeader('OBSERVADOR ACADEMICO INTEGRAL', `Periodo: ${periodoNombre}`);

        doc.setFont('times', 'bold');
        doc.setFontSize(11.5);
        doc.text('INFORMACION DEL ESTUDIANTE', 12, 66);
        doc.text(`ANO LECTIVO - ${new Date().getFullYear()}`, 198, 66, { align: 'right' });

        if (foto) {
            const tipoFoto = foto.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.addImage(foto, tipoFoto, 12, 70, 32, 36);
        } else {
            doc.rect(12, 70, 32, 36);
            doc.setFontSize(8);
            doc.text('Sin foto', 22, 89);
        }

        doc.setFont('times', 'normal');
        doc.setFontSize(9.5);
        let y = 112;
        const fila = (label: string, value?: string | null) => {
            doc.setFont('times', 'bold');
            doc.text(`${label}:`, 12, y);
            doc.setFont('times', 'normal');
            doc.text(value && value.trim() !== '' ? value : '____________________', 58, y);
            y += 6.2;
        };

        fila('NOMBRE Y APELLIDOS', estudianteDirectorActual.estudiante);
        fila('FECHA DE NACIMIENTO', estudianteDirectorActual.fecha_nacimiento);
        fila('DOCUMENTO', estudianteDirectorActual.documento);
        fila('DIRECCIÓN', estudianteDirectorActual.direccion);
        fila('TELÉFONO', estudianteDirectorActual.telefono);
        fila('ACUDIENTE', estudianteDirectorActual.acudiente);
        fila('TELÉFONO ACUDIENTE', estudianteDirectorActual.telefono_acudiente);
        fila('GRADO EN CURSO', `${estudianteDirectorActual.grado ?? ''} ${estudianteDirectorActual.grupo ?? ''}`.trim());
        fila('DIRECTOR DE GRUPO', estudianteDirectorActual.director_grupo);

        y += 2;
        doc.setFont('times', 'bold');
        doc.setFontSize(11);
        doc.text('VALORACION INTEGRAL DEL ESTUDIANTE', 12, y);
        y += 4;

        const drawBox = (titulo: string, contenido: string, h = 18) => {
            doc.rect(12, y, 186, h);
            doc.setFont('times', 'bold');
            doc.setFontSize(9);
            doc.text(titulo, 14, y + 5);
            doc.setFont('times', 'normal');
            const lines = doc.splitTextToSize(contenido || '-', 180);
            doc.text(lines, 14, y + 10);
            y += h + 2;
        };

        drawBox('Social y Afectivo', ficha.social_afectivo, 18);
        drawBox('Comunicacion y Seguimiento a la norma', ficha.comunicacion_norma, 18);
        drawBox('Conductual y Academico', ficha.conductual_academico, 18);
        drawBox('Asignaturas con Afinidad y Plan de mejora', ficha.afinidad_plan_mejora, 18);
        drawBox('Compromiso', ficha.compromiso_detalle, 16);

        doc.addPage();
        drawHeader(`${periodoNombre} ACADEMICO`, `Periodo: ${periodoNombre}`);
        doc.setFont('times', 'bold');
        doc.setFontSize(12.5);
        doc.text(`${periodoNombre} ACADEMICO`, 105, 66, { align: 'center' });

        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.text(`Nombre completo del estudiante: ${estudianteDirectorActual.estudiante}`, 12, 76);
        doc.text(`Director de grupo: ${estudianteDirectorActual.director_grupo ?? ''}`, 12, 82);
        doc.text(`Fecha de realizacion: ${new Date().toLocaleDateString('es-CO')}`, 12, 88);
        doc.text(`Grado: ${(estudianteDirectorActual.grado ?? '') + ' ' + (estudianteDirectorActual.grupo ?? '')}`, 12, 94);

        doc.setFont('times', 'bold');
        doc.rect(12, 100, 62, 8); doc.text('FORTALEZAS', 43, 105, { align: 'center' });
        doc.rect(74, 100, 62, 8); doc.text('DIFICULTADES', 105, 105, { align: 'center' });
        doc.rect(136, 100, 62, 8); doc.text('COMPROMISOS', 167, 105, { align: 'center' });

        const linesF = doc.splitTextToSize(fortalezas || '-', 58);
        const linesD = doc.splitTextToSize(dificultades || '-', 58);
        const linesC = doc.splitTextToSize(compromisos || '-', 58);
        const maxLines = Math.max(linesF.length, linesD.length, linesC.length, 8);
        const boxH = Math.max(70, maxLines * 4 + 10);

        doc.rect(12, 108, 62, boxH);
        doc.rect(74, 108, 62, boxH);
        doc.rect(136, 108, 62, boxH);
        doc.setFont('times', 'normal');
        doc.text(linesF, 14, 114);
        doc.text(linesD, 76, 114);
        doc.text(linesC, 138, 114);

        if (comentariosPdf.length > 0) {
            doc.addPage();
            drawHeader('COMENTARIOS CONSOLIDADOS DEL PERIODO', `Periodo: ${periodoNombre}`);
            doc.setFont('times', 'bold');
            doc.setFontSize(13);
            doc.text('COMENTARIOS CONSOLIDADOS DEL PERIODO', 105, 66, { align: 'center' });

            doc.setFont('times', 'normal');
            doc.setFontSize(10);
            doc.text(`Estudiante: ${estudianteDirectorActual.estudiante}`, 12, 78);
            doc.text(`Periodo: ${periodoNombre || 'N/A'}`, 12, 84);
            doc.text(`Total de comentarios: ${comentariosPdf.length}`, 12, 90);

            let yComentarios = 98;
            comentariosPdf.forEach((item, index) => {
                const encabezado = `${index + 1}. ${item.fecha || 'N/A'} · ${item.origen.toUpperCase()} · ${item.categoria || 'General'} (${item.tipo || 'N/A'})`;
                const cuerpo = doc.splitTextToSize(item.descripcion || '-', 180);
                const lineas = 1 + cuerpo.length;
                const altoBloque = Math.max(10, lineas * 4 + 3);

                if (yComentarios + altoBloque > 280) {
                    doc.addPage();
                    drawHeader('COMENTARIOS CONSOLIDADOS (continuacion)', `Periodo: ${periodoNombre}`);
                    doc.setFont('times', 'bold');
                    doc.setFontSize(11);
                    doc.text('COMENTARIOS CONSOLIDADOS (continuacion)', 105, 66, { align: 'center' });
                    yComentarios = 74;
                }

                doc.setDrawColor(120, 120, 120);
                doc.rect(12, yComentarios, 186, altoBloque);
                doc.setFont('times', 'bold');
                doc.setFontSize(8.8);
                doc.text(encabezado, 14, yComentarios + 4.5);
                doc.setFont('times', 'normal');
                doc.setFontSize(9);
                doc.text(cuerpo, 14, yComentarios + 9);

                yComentarios += altoBloque + 2;
            });
        }

        doc.save(`Observador_${estudianteDirectorActual.estudiante.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <SidebarLayout 
            menuItems={profesorMenuItems}
            userInfo={{ name: profesor?.nombre || 'Profesor', role: 'Profesor' }}
        >
            <Head title="Observador Académico" />

            <h1 className="text-2xl font-bold text-gray-800 mb-4">
                Observador Académico
            </h1>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button onClick={() => cambiarTab('nuevo')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'nuevo' ? 'bg-[#293577] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    Nuevo comentario
                </button>
                <button onClick={() => cambiarTab('director')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'director' ? 'bg-[#293577] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    Director de Grupo ({observadorDirector.length})
                </button>
                <button onClick={() => cambiarTab('historial')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'historial' ? 'bg-[#293577] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    Historial ({observaciones.length})
                </button>
            </div>

            {tab === 'nuevo' ? (
            <div className="bg-white rounded-xl shadow p-6">
                {/* Selección de estudiante */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Estudiante</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        <select value={cursoFiltro} onChange={(e) => setCursoFiltro(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Todos los cursos</option>
                            {cursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar estudiante..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <select value={estudianteSeleccionado} onChange={(e) => setEstudianteSeleccionado(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500">
                        <option value="">Seleccionar estudiante...</option>
                        {estudiantesFiltrados.map(e => (
                            <option key={e.id} value={e.id}>{e.nombre} - {e.curso}</option>
                        ))}
                    </select>
                </div>

                {/* Info de fecha y profesor */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 mb-6 text-sm">
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                        <span className="text-gray-600">Fecha: </span>
                        <span className="font-semibold">{fechaActual}</span>
                    </div>
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                        <span className="text-gray-600">Profesor: </span>
                        <span className="font-semibold">{profesor?.nombre || 'Carlos Díaz'}</span>
                    </div>
                </div>

                {/* Tipo de observación */}
                <div className="flex flex-wrap gap-2 sm:gap-4 mb-6">
                    <button
                        onClick={() => setTipoSeleccionado('positiva')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border-2 transition-all text-sm sm:text-base ${
                            tipoSeleccionado === 'positiva' 
                                ? 'bg-green-500 text-white border-green-500' 
                                : 'bg-white text-green-600 border-green-300 hover:bg-green-50'
                        }`}
                    >
                        <span className="w-5 h-5 rounded-full bg-green-200 flex items-center justify-center text-green-700 text-sm">✓</span>
                        <span className="hidden sm:inline">Académica/</span>Positiva
                    </button>
                    <button
                        onClick={() => setTipoSeleccionado('negativa')}
                        className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full border-2 transition-all text-sm sm:text-base ${
                            tipoSeleccionado === 'negativa' 
                                ? 'bg-red-500 text-white border-red-500' 
                                : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
                        }`}
                    >
                        <span className="w-5 h-5 rounded-full bg-red-200 flex items-center justify-center text-red-700 text-sm">✕</span>
                        <span className="hidden sm:inline">Disciplinaria/</span>Negativa
                    </button>
                </div>

                {/* Etiquetas rápidas */}
                <div className="mb-6">
                    <div className="flex flex-wrap gap-2 mb-3">
                        {todasLasEtiquetas
                            .filter(et => et.tipo === tipoSeleccionado || etiquetasSeleccionadas.includes(et.id))
                            .map(etiqueta => (
                            <button
                                key={etiqueta.id}
                                onClick={() => toggleEtiqueta(etiqueta.id)}
                                className={`px-3 py-1 rounded border text-sm transition-all ${
                                    etiquetasSeleccionadas.includes(etiqueta.id)
                                        ? getTipoColor(etiqueta.tipo) + ' ring-2 ring-offset-1 ring-gray-400'
                                        : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                                }`}
                            >
                                [{etiqueta.nombre}]
                            </button>
                        ))}
                        <button
                            onClick={() => setMostrarModalEtiqueta(true)}
                            className="px-3 py-1 rounded border border-dashed border-gray-400 text-gray-500 text-sm hover:bg-gray-50"
                        >
                            + Nueva Etiqueta
                        </button>
                    </div>
                </div>

                {/* Descripción */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción Detallada
                    </label>
                    <textarea
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Describe la observación con detalle..."
                    />
                </div>

                {/* Botón de registro */}
                <button onClick={registrarObservacion} disabled={!estudianteSeleccionado || !descripcion.trim()} className="bg-[#293577] text-white px-6 py-3 rounded-lg hover:bg-[#181b49] transition-colors font-semibold disabled:opacity-50">
                    Registrar comentario
                </button>
            </div>
            ) : tab === 'director' ? (
            <div className="space-y-5">
                {directorCursos.length === 0 && (
                    <div className="bg-white rounded-xl border border-amber-200 p-5">
                        <h3 className="text-sm font-bold text-amber-800">No tienes cursos como director de grupo</h3>
                        <p className="text-sm text-amber-700 mt-1">Este panel es exclusivo para profesores que son directores de grupo en el año lectivo actual.</p>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Observador general por período</h2>
                            <p className="text-sm text-gray-500 mt-1">Módulo del profesor director: completa fortalezas, dificultades y compromisos del estudiante por período.</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-[#293577]/10 px-3 py-1 text-xs font-semibold text-[#293577]">
                            Comentarios docentes y asistencia unificados
                        </span>
                    </div>

                    {feedbackDirector && (
                        <div className={`mt-4 rounded-lg border px-3 py-2 text-sm ${feedbackDirector.tipo === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : feedbackDirector.tipo === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
                            {feedbackDirector.mensaje}
                        </div>
                    )}

                    {hasUnsavedChanges && (
                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                            Tienes cambios sin guardar. Guarda antes de cambiar estudiante, período o salir del módulo.
                        </div>
                    )}

                    {registroDirectorActual && (
                        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                            Estás editando un observador ya registrado. Última actualización: {registroDirectorActual.updated_at}.
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
                        <select value={directorCursoId} onChange={(e) => cambiarConGuard('cambiar de curso', () => { setDirectorCursoId(e.target.value); setDirectorEstudianteId(''); })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Selecciona curso (director)</option>
                            {directorCursos.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                        <select value={directorPeriodoId} onChange={(e) => cambiarConGuard('cambiar de período', () => { setDirectorPeriodoId(e.target.value); setDirectorEstudianteId(''); })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Selecciona período</option>
                            {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                        <select value={directorEstudianteId} onChange={(e) => cambiarConGuard('cambiar de estudiante', () => setDirectorEstudianteId(e.target.value))} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Selecciona estudiante</option>
                            {directorEstudiantesFiltrados.map(e => (
                                <option key={`${e.estudiante_id}-${e.periodo_id}`} value={e.estudiante_id}>{e.estudiante}</option>
                            ))}
                        </select>
                    </div>

                    <div className="mt-4 rounded-xl border border-[#293577]/20 bg-[#293577]/5 p-4">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div>
                                <h3 className="text-sm font-bold text-[#293577]">Observación del boletín (separada)</h3>
                                <p className="text-xs text-gray-600 mt-0.5">Este texto es el que aparece en el boletín del período y lo diligencia el director de grupo.</p>
                            </div>
                            {registroBoletinActual ? (
                                <span className="text-[11px] rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">Boletín con observación</span>
                            ) : (
                                <span className="text-[11px] rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">Sin observación en boletín</span>
                            )}
                        </div>
                        <textarea
                            value={observacionBoletin}
                            onChange={(e) => setObservacionBoletin(e.target.value)}
                            rows={4}
                            className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Escribe aquí la observación del director para el boletín..."
                        />
                        <button
                            onClick={guardarObservacionBoletin}
                            disabled={!directorCursoId || !directorPeriodoId || !directorEstudianteId || guardandoBoletin || !boletinDirty}
                            className="mt-3 rounded-lg bg-[#293577] px-4 py-2 text-sm font-semibold text-white hover:bg-[#181b49] disabled:opacity-40"
                        >
                            {guardandoBoletin ? 'Guardando observación...' : boletinDirty ? 'Guardar observación de boletín' : 'Sin cambios por guardar'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Resumen general</label>
                            <textarea value={resumenDirector} onChange={(e) => setResumenDirector(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Síntesis integral del período..." />
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-gray-700">Comentarios consolidados</p>
                                <button onClick={cargarComentariosConsolidados} disabled={!directorEstudianteId || !directorCursoId || !directorPeriodoId || cargandoConsolidados} className="text-xs px-2.5 py-1 rounded bg-[#293577] text-white disabled:opacity-40">
                                    {cargandoConsolidados ? 'Cargando...' : 'Actualizar'}
                                </button>
                            </div>
                            <div className="max-h-40 overflow-auto space-y-2 pr-1">
                                {comentariosConsolidados.length === 0 ? (
                                    <p className="text-xs text-gray-400">Sin comentarios cargados para la selección actual.</p>
                                ) : comentariosConsolidados.map(item => (
                                    <div key={item.id} className="rounded border border-gray-200 bg-white p-2">
                                        <p className="text-[11px] font-semibold text-gray-600 uppercase">{item.origen} · {item.fecha}</p>
                                        <p className="text-xs text-gray-700 mt-0.5">{item.descripcion}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <h3 className="text-sm font-bold text-gray-800">Ficha del observador general (formato integral)</h3>
                        <p className="text-xs text-gray-500 mt-1">Este bloque corresponde al observador PDF (distinto al boletín).</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Social y Afectivo</label>
                                <textarea value={ficha.social_afectivo} onChange={(e) => setFicha({ ...ficha, social_afectivo: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Comunicación y norma</label>
                                <textarea value={ficha.comunicacion_norma} onChange={(e) => setFicha({ ...ficha, comunicacion_norma: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Conductual y Académico</label>
                                <textarea value={ficha.conductual_academico} onChange={(e) => setFicha({ ...ficha, conductual_academico: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Afinidad y plan de mejora</label>
                                <textarea value={ficha.afinidad_plan_mejora} onChange={(e) => setFicha({ ...ficha, afinidad_plan_mejora: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">Compromiso (detalle)</label>
                                <textarea value={ficha.compromiso_detalle} onChange={(e) => setFicha({ ...ficha, compromiso_detalle: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Fortalezas</label>
                            <textarea value={fortalezas} onChange={(e) => setFortalezas(e.target.value)} rows={5} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Logros y avances observados" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Dificultades</label>
                            <textarea value={dificultades} onChange={(e) => setDificultades(e.target.value)} rows={5} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Aspectos a mejorar" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Compromisos</label>
                            <textarea value={compromisos} onChange={(e) => setCompromisos(e.target.value)} rows={5} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Compromisos del estudiante y familia" />
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button onClick={guardarObservadorDirector} disabled={!directorCursoId || !directorPeriodoId || !directorEstudianteId || directorCursos.length === 0 || guardandoObservador || !directorDirty} className="bg-[#293577] text-white px-6 py-2.5 rounded-lg hover:bg-[#181b49] transition-colors font-semibold disabled:opacity-40">
                            {guardandoObservador ? 'Guardando observador...' : directorDirty ? 'Guardar observador general' : 'Observador sin cambios'}
                        </button>
                        <button onClick={exportarObservadorPdf} disabled={!directorCursoId || !directorPeriodoId || !directorEstudianteId} className="bg-white border border-[#293577] text-[#293577] px-5 py-2.5 rounded-lg hover:bg-[#293577]/5 transition-colors font-semibold disabled:opacity-40">
                            Generar PDF del observador
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">Historial del director</h3>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-80 overflow-auto">
                        {observadorDirector.length === 0 ? (
                            <div className="p-6 text-sm text-gray-500">No hay registros de observador por período.</div>
                        ) : observadorDirector.map(reg => (
                            <div key={reg.id} className="p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-semibold text-gray-800">{reg.estudiante} · {reg.curso} · {reg.periodo}</p>
                                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${reg.estado === 'completo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{reg.estado}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Actualizado: {reg.updated_at}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            ) : (
            /* Historial de observaciones */
            <div className="bg-white rounded-xl shadow overflow-hidden">
                {observaciones.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No hay observaciones registradas</div>
                ) : (
                <div className="divide-y divide-gray-100">
                    {observaciones.map(obs => (
                        <div key={obs.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start gap-3">
                                <span className={`mt-1 px-2 py-0.5 rounded text-xs font-semibold ${
                                    obs.tipo === 'positiva' ? 'bg-green-100 text-green-700' :
                                    obs.tipo === 'negativa' ? 'bg-red-100 text-red-700' :
                                    'bg-yellow-100 text-yellow-700'
                                }`}>{obs.tipo}</span>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-800">{obs.estudiante}</p>
                                    <p className="text-sm text-gray-500">{obs.curso} • {obs.materia} • {obs.fecha}</p>
                                    <p className="text-sm text-gray-600 mt-1">{obs.descripcion}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                )}
            </div>
            )}

            {/* Modal para nueva etiqueta */}
            {mostrarModalEtiqueta && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Crear Nueva Etiqueta</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de la etiqueta
                                </label>
                                <input
                                    type="text"
                                    value={nuevaEtiqueta.nombre}
                                    onChange={(e) => setNuevaEtiqueta({ ...nuevaEtiqueta, nombre: e.target.value })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="Ej: Buen Comportamiento"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo
                                </label>
                                <select
                                    value={nuevaEtiqueta.tipo}
                                    onChange={(e) => setNuevaEtiqueta({ ...nuevaEtiqueta, tipo: e.target.value as TipoObservacion })}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                >
                                    <option value="positiva">Positiva</option>
                                    <option value="negativa">Negativa</option>
                                    <option value="neutral">Neutral</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setMostrarModalEtiqueta(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={agregarEtiquetaPersonalizada}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Crear
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
