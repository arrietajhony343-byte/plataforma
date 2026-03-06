import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminMenuItems } from '@/Config/adminMenu';
import jsPDF from 'jspdf';

/* ═══════════════════════════ TYPES ═══════════════════════════ */
interface TipoCertificado {
    id: number;
    nombre: string;
    codigo: string;
    descripcion: string | null;
    precio: number;
    activo: boolean;
}

interface Estudiante {
    id: number;
    name: string;
    nivel: string;
    curso: string;
    curso_id: number | null;
}

interface Curso {
    id: number;
    nombre: string;
    nivel: string;
    grado: string;
    sede_id: number | null;
}

interface Sede {
    id: number;
    nombre: string;
}

interface Certificado {
    id: number;
    tipo_certificado_id: number | null;
    tipo_nombre: string;
    tipo_codigo: string;
    estudiante_id: number;
    estudiante: string;
    nivel: string;
    curso_id: number | null;
    curso: string;
    descripcion: string | null;
    archivo: string | null;
    fecha_solicitud: string;
    fecha_entrega: string | null;
    estado: 'solicitado' | 'en_proceso' | 'listo' | 'entregado';
    padres: { id: number; name: string }[];
}

interface Props {
    certificados: Certificado[];
    tiposCertificado: TipoCertificado[];
    estudiantes: Estudiante[];
    cursos: Curso[];
    niveles: string[];
    sedes: Sede[];
}

/* ═══════════════════════════ HELPERS ═══════════════════════════ */
const nivelesConfig: Record<string, { label: string; color: string; chipActive: string }> = {
    prejardin:    { label: 'Pre-Jardín',   color: 'bg-pink-100 text-pink-700',     chipActive: 'bg-pink-500' },
    primaria:     { label: 'Primaria',     color: 'bg-blue-100 text-blue-700',     chipActive: 'bg-blue-500' },
    secundaria:   { label: 'Secundaria',   color: 'bg-cyan-100 text-cyan-700',     chipActive: 'bg-cyan-500' },
    media:        { label: 'Media',        color: 'bg-amber-100 text-amber-700',   chipActive: 'bg-amber-500' },
    bachillerato: { label: 'Bachillerato', color: 'bg-emerald-100 text-emerald-700', chipActive: 'bg-emerald-500' },
};

const estadosConfig: Record<string, { label: string; color: string }> = {
    solicitado: { label: 'Solicitado',       color: 'bg-yellow-100 text-yellow-800' },
    en_proceso: { label: 'En Proceso',       color: 'bg-blue-100 text-blue-800' },
    listo:      { label: 'Listo para Entrega', color: 'bg-green-100 text-green-800' },
    entregado:  { label: 'Entregado',        color: 'bg-gray-100 text-gray-600' },
};

const getNivelBadge = (nivel: string) => nivelesConfig[nivel]?.color ?? 'bg-gray-100 text-gray-700';
const getNivelLabel = (nivel: string) => nivelesConfig[nivel]?.label ?? nivel;
const getNivelChipActive = (nivel: string) => nivelesConfig[nivel]?.chipActive ?? 'bg-gray-500';
const getEstadoBadge = (estado: string) => estadosConfig[estado]?.color ?? 'bg-gray-100 text-gray-700';
const getEstadoLabel = (estado: string) => estadosConfig[estado]?.label ?? estado;

const formatPrecio = (precio: number) => '$' + precio.toLocaleString('es-CO');

/* ═══════════════════════════ COMPONENT ═══════════════════════════ */
export default function Certificados({ certificados, tiposCertificado, estudiantes, cursos, niveles, sedes }: Props) {
    // ── Filter State ──
    const [nivelSeleccionado, setNivelSeleccionado] = useState('todos');
    const [cursoSeleccionado, setCursoSeleccionado] = useState('todos');
    const [tipoSeleccionado, setTipoSeleccionado] = useState('todos');
    const [estadoSeleccionado, setEstadoSeleccionado] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    const [sedeSel, setSedeSel] = useState<string>('todas');

    // ── Modal State ──
    const [showModalSolicitud, setShowModalSolicitud] = useState(false);
    const [showModalTipo, setShowModalTipo] = useState(false);
    const [showModalGestionar, setShowModalGestionar] = useState<Certificado | null>(null);
    const [editingTipo, setEditingTipo] = useState<TipoCertificado | null>(null);

    // ── Form State ──
    const [formSolicitud, setFormSolicitud] = useState({
        estudiante_id: '',
        tipo_certificado_id: '',
        descripcion: '',
    });
    const [formTipo, setFormTipo] = useState({
        nombre: '',
        codigo: '',
        descripcion: '',
        precio: 0,
        activo: true,
    });
    // si el usuario no ha tocado el campo código, se auto-genera desde el nombre
    const [codigoManual, setCodigoManual] = useState(false);

    const handleNombreTipo = (nombre: string) => {
        const auto = nombre.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s_]/g, '').trim().replace(/\s+/g, '_');
        setFormTipo(f => ({ ...f, nombre, ...(!codigoManual ? { codigo: auto } : {}) }));
    };
    const [processing, setProcessing] = useState(false);
    const [sendingNotif, setSendingNotif] = useState(false);

    // ── Buscador de estudiante en modal solicitud ──
    const [busquedaEst, setBusquedaEst] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const dropdownPanelRef = useRef<HTMLDivElement>(null);
    const inputBusquedaRef = useRef<HTMLInputElement>(null);

    const estudianteSeleccionado = useMemo(
        () => estudiantes.find(e => e.id.toString() === formSolicitud.estudiante_id) ?? null,
        [estudiantes, formSolicitud.estudiante_id]
    );

    const estudiantesSugeridos = useMemo(() => {
        if (!busquedaEst.trim()) return estudiantes.slice(0, 50);
        const q = busquedaEst.toLowerCase();
        return estudiantes.filter(e =>
            e.name.toLowerCase().includes(q) ||
            (e.curso && e.curso.toLowerCase().includes(q))
        ).slice(0, 50);
    }, [estudiantes, busquedaEst]);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;
            if (dropdownRef.current && !dropdownRef.current.contains(t) &&
                dropdownPanelRef.current && !dropdownPanelRef.current.contains(t)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── PDF Generation ──
    const generarPDF = useCallback((cert: Certificado) => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const W = 210;

        // Top blue header bar
        doc.setFillColor(41, 53, 119);
        doc.rect(0, 0, W, 38, 'F');
        // Gold accent line
        doc.setFillColor(234, 179, 8);
        doc.rect(0, 38, W, 3, 'F');

        // School name in header
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('INSTITUCIÓN EDUCATIVA', W / 2, 16, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Sistema de Gestión Académica', W / 2, 26, { align: 'center' });
        doc.setFontSize(9);
        doc.text(`NIT: 000.000.000-0  •  Tel: (000) 000-0000`, W / 2, 34, { align: 'center' });

        // Emblem circle
        doc.setFillColor(248, 249, 252);
        doc.setDrawColor(234, 179, 8);
        doc.setLineWidth(2);
        doc.circle(W / 2, 54, 16, 'FD');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(41, 53, 119);
        doc.text('I.E', W / 2, 52, { align: 'center' });
        doc.text('2026', W / 2, 58, { align: 'center' });

        // Certificate title
        doc.setTextColor(41, 53, 119);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(cert.tipo_nombre.toUpperCase(), W / 2, 80, { align: 'center' });

        // Separator with ornament
        doc.setDrawColor(41, 53, 119);
        doc.setLineWidth(0.6);
        doc.line(35, 85, 85, 85);
        doc.line(125, 85, 175, 85);
        doc.setFontSize(12);
        doc.setTextColor(234, 179, 8);
        doc.text('✦', W / 2, 87, { align: 'center' });

        // Body text
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(11.5);
        doc.setFont('helvetica', 'normal');

        const codigo = (cert.tipo_codigo ?? '').toLowerCase();
        let cuerpo = '';
        if (codigo.includes('paz')) {
            cuerpo = `La Institución Educativa certifica que el/la estudiante ${cert.estudiante.toUpperCase()}, quien cursa actualmente el grado ${cert.curso || '—'}, NO PRESENTA NINGUNA DEUDA pendiente con la institución al día de hoy y se encuentra a PAZ Y SALVO con todas sus obligaciones académicas y financieras.`;
        } else if (codigo.includes('mat') || codigo.includes('constancia')) {
            cuerpo = `La Institución Educativa certifica que el/la estudiante ${cert.estudiante.toUpperCase()} se encuentra debidamente matriculado(a) en el grado ${cert.curso || '—'} del año escolar en curso, habiendo cumplido con todos los requisitos de matrícula establecidos por la institución.`;
        } else if (codigo.includes('nota') || codigo.includes('calific')) {
            cuerpo = `La Institución Educativa certifica que el/la estudiante ${cert.estudiante.toUpperCase()}, perteneciente al grado ${cert.curso || '—'}, ha aprobado satisfactoriamente las áreas del período académico correspondiente, según los registros académicos oficiales de la institución.`;
        } else {
            cuerpo = `La Institución Educativa certifica que el/la estudiante ${cert.estudiante.toUpperCase()}, identificado(a) con el documento correspondiente, pertenece activamente a esta institución y cursa el grado ${cert.curso || '—'}, cumpliendo con todos los lineamientos académicos establecidos.`;
        }

        const mesActual = new Date().toLocaleString('es-CO', { month: 'long' });
        const dia = new Date().getDate();
        const anio = new Date().getFullYear();

        const bodyLines = doc.splitTextToSize(cuerpo, 152);
        doc.text(bodyLines, 29, 97);

        const expedidoY = 97 + bodyLines.length * 6.5 + 10;
        const expedidoTxt = `La presente ${cert.tipo_nombre.toLowerCase()} se expide a solicitud del interesado, a los ${dia} días del mes de ${mesActual} del año ${anio}.`;
        const expLines = doc.splitTextToSize(expedidoTxt, 152);
        doc.text(expLines, 29, expedidoY);

        // Signature block
        const sigY = 215;
        doc.setDrawColor(41, 53, 119);
        doc.setLineWidth(0.8);
        doc.line(50, sigY, 150, sigY);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(41, 53, 119);
        doc.text('RECTOR(A) / SECRETARIA ACADÉMICA', W / 2, sigY + 6, { align: 'center' });
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Firma y sello de la institución', W / 2, sigY + 12, { align: 'center' });

        // Stamp ring
        doc.setDrawColor(41, 53, 119);
        doc.setLineWidth(1);
        doc.setFillColor(248, 249, 252);
        doc.circle(160, sigY - 12, 16, 'FD');
        doc.circle(160, sigY - 12, 12, 'S');
        doc.setFontSize(7);
        doc.setTextColor(41, 53, 119);
        doc.setFont('helvetica', 'bold');
        doc.text('SELLO', 160, sigY - 10, { align: 'center' });
        doc.text('OFICIAL', 160, sigY - 7, { align: 'center' });

        // Footer
        doc.setFillColor(234, 179, 8);
        doc.rect(0, 264, W, 3, 'F');
        doc.setFillColor(41, 53, 119);
        doc.rect(0, 267, W, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Solicitud N° ${cert.id}  •  Expedido: ${new Date().toLocaleDateString('es-CO')}  •  Estado: ${getEstadoLabel(cert.estado)}`, W / 2, 278, { align: 'center' });
        doc.text('Documento generado por el Sistema de Gestión Académica — Válido con sello y firma original', W / 2, 286, { align: 'center' });

        doc.save(`${cert.tipo_nombre.replace(/\s+/g, '_')}_${cert.estudiante.replace(/\s+/g, '_')}.pdf`);
    }, []);

    // ── Notificar Padre ──
    const handleNotificarPadre = useCallback((cert: Certificado) => {
        if (!cert.padres || cert.padres.length === 0) {
            alert('Este estudiante no tiene acudientes registrados.');
            return;
        }
        setSendingNotif(true);
        router.post(`/admin/certificados/${cert.id}/notificar`, {}, {
            onSuccess: () => setShowModalGestionar(prev => prev ? { ...prev, estado: 'listo' } : null),
            onFinish: () => setSendingNotif(false),
        });
    }, []);

    // ── Computed ──
    const tiposActivos = useMemo(() => tiposCertificado.filter(t => t.activo), [tiposCertificado]);

    const tipoSeleccionadoObj = useMemo(
        () => tiposActivos.find(t => t.id.toString() === formSolicitud.tipo_certificado_id) ?? null,
        [tiposActivos, formSolicitud.tipo_certificado_id]
    );

    const cursosDisponibles = useMemo(() => {
        let lista = sedeSel !== 'todas'
            ? cursos.filter(c => c.sede_id === Number(sedeSel))
            : cursos;
        if (nivelSeleccionado === 'todos') return lista;
        if (nivelSeleccionado === 'prejardin') {
            return lista.filter(c => c.nivel === 'prejardin' || c.nivel === 'transicion' || c.nivel === 'preescolar');
        }
        return lista.filter(c => c.nivel === nivelSeleccionado);
    }, [cursos, nivelSeleccionado, sedeSel]);

    const estudiantesFiltrados = useMemo(() => {
        let lista = estudiantes;
        if (sedeSel !== 'todas') {
            const cursosSede = new Set(cursos.filter(c => c.sede_id === Number(sedeSel)).map(c => c.id));
            lista = lista.filter(e => e.curso_id !== null && cursosSede.has(e.curso_id));
        }
        if (nivelSeleccionado !== 'todos') {
            const niveles = nivelSeleccionado === 'prejardin' ? ['prejardin', 'transicion', 'preescolar'] : [nivelSeleccionado];
            lista = lista.filter(e => niveles.includes(e.nivel));
        }
        if (cursoSeleccionado !== 'todos') {
            lista = lista.filter(e => e.curso_id?.toString() === cursoSeleccionado);
        }
        return lista;
    }, [estudiantes, cursos, nivelSeleccionado, cursoSeleccionado, sedeSel]);

    const certificadosFiltrados = useMemo(() => {
        return certificados.filter(cert => {
            const matchSede = sedeSel === 'todas' || (() => {
                const curso = cursos.find(c => c.id === cert.curso_id);
                return curso?.sede_id === Number(sedeSel);
            })();
            const nivelMatch = nivelSeleccionado === 'prejardin'
                ? cert.nivel === 'prejardin' || cert.nivel === 'transicion' || cert.nivel === 'preescolar'
                : nivelSeleccionado === 'todos' || cert.nivel === nivelSeleccionado;
            const matchCurso = cursoSeleccionado === 'todos' || cert.curso_id?.toString() === cursoSeleccionado;
            const tipoMatch = tiposCertificado.find(t => t.id.toString() === tipoSeleccionado);
            const matchTipo = tipoSeleccionado === 'todos' ||
                cert.tipo_certificado_id?.toString() === tipoSeleccionado ||
                (cert.tipo_certificado_id === null && tipoMatch && tipoMatch.codigo === cert.tipo_codigo);
            const matchEstado = estadoSeleccionado === 'todos' || cert.estado === estadoSeleccionado;
            const matchBusqueda = busqueda === '' ||
                cert.estudiante.toLowerCase().includes(busqueda.toLowerCase()) ||
                cert.tipo_nombre.toLowerCase().includes(busqueda.toLowerCase());
            return matchSede && nivelMatch && matchCurso && matchTipo && matchEstado && matchBusqueda;
        });
    }, [certificados, cursos, nivelSeleccionado, cursoSeleccionado, tipoSeleccionado, estadoSeleccionado, busqueda, sedeSel]);

    const stats = useMemo(() => ({
        solicitado: certificadosFiltrados.filter(c => c.estado === 'solicitado').length,
        en_proceso: certificadosFiltrados.filter(c => c.estado === 'en_proceso').length,
        listo: certificadosFiltrados.filter(c => c.estado === 'listo').length,
        entregado: certificadosFiltrados.filter(c => c.estado === 'entregado').length,
    }), [certificadosFiltrados]);

    const hayFiltrosActivos = sedeSel !== 'todas' || nivelSeleccionado !== 'todos' || cursoSeleccionado !== 'todos' || tipoSeleccionado !== 'todos' || estadoSeleccionado !== 'todos' || busqueda !== '';

    // ── Handlers ──
    const handleNivelChange = (nivel: string) => {
        setNivelSeleccionado(nivel);
        setCursoSeleccionado('todos');
    };

    const limpiarFiltros = () => {
        setNivelSeleccionado('todos');
        setCursoSeleccionado('todos');
        setTipoSeleccionado('todos');
        setEstadoSeleccionado('todos');
        setBusqueda('');
        setSedeSel('todas');
    };

    const openModalTipo = (tipo?: TipoCertificado) => {
        if (tipo) {
            setEditingTipo(tipo);
            setFormTipo({
                nombre: tipo.nombre,
                codigo: tipo.codigo,
                descripcion: tipo.descripcion ?? '',
                precio: tipo.precio,
                activo: tipo.activo,
            });
            setCodigoManual(true); // al editar, el código ya existe, no se auto-sobreescribe
        } else {
            setEditingTipo(null);
            setFormTipo({ nombre: '', codigo: '', descripcion: '', precio: 0, activo: true });
            setCodigoManual(false); // al crear nuevo, el código se genera automáticamente
        }
        setShowModalTipo(true);
    };

    const closeModalTipo = () => {
        setShowModalTipo(false);
        setEditingTipo(null);
        setFormTipo({ nombre: '', codigo: '', descripcion: '', precio: 0, activo: true });
        setCodigoManual(false);
    };

    const openModalSolicitud = () => {
        setFormSolicitud({ estudiante_id: '', tipo_certificado_id: tiposActivos[0]?.id.toString() ?? '', descripcion: '' });
        setBusquedaEst('');
        setDropdownOpen(false);
        setShowModalSolicitud(true);
    };

    const closeModalSolicitud = () => {
        setShowModalSolicitud(false);
        setFormSolicitud({ estudiante_id: '', tipo_certificado_id: '', descripcion: '' });
        setBusquedaEst('');
        setDropdownOpen(false);
    };

    // ── Submit Handlers ──
    const handleSubmitSolicitud = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formSolicitud.estudiante_id || !formSolicitud.tipo_certificado_id) return;
        setProcessing(true);
        router.post('/admin/certificados', {
            estudiante_id: parseInt(formSolicitud.estudiante_id),
            tipo_certificado_id: parseInt(formSolicitud.tipo_certificado_id),
            descripcion: formSolicitud.descripcion || null,
        }, {
            onSuccess: () => closeModalSolicitud(),
            onFinish: () => setProcessing(false),
        });
    };

    const handleSubmitTipo = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTipo.nombre || !formTipo.codigo) return;
        setProcessing(true);
        const url = editingTipo
            ? `/admin/certificados/tipos/${editingTipo.id}`
            : '/admin/certificados/tipos';
        const method = editingTipo ? 'put' : 'post';
        router[method](url, formTipo, {
            onSuccess: () => closeModalTipo(),
            onFinish: () => setProcessing(false),
        });
    };

    const handleDeleteTipo = (tipo: TipoCertificado) => {
        if (!confirm(`¿Eliminar el tipo "${tipo.nombre}"? Esta acción no se puede deshacer.`)) return;
        router.delete(`/admin/certificados/tipos/${tipo.id}`);
    };

    const handleUpdateEstado = (cert: Certificado, nuevoEstado: string) => {
        router.put(`/admin/certificados/${cert.id}`, { estado: nuevoEstado }, {
            onSuccess: () => setShowModalGestionar(null),
        });
    };

    const handleDeleteCertificado = (cert: Certificado) => {
        if (!confirm(`¿Eliminar la solicitud de ${cert.estudiante}?`)) return;
        router.delete(`/admin/certificados/${cert.id}`);
    };

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Certificados">
            <Head title="Certificados" />

            <div className="space-y-4 sm:space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* ═══ Header ═══ */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>
                            Gestión de Certificados
                        </h1>
                        <p className="text-gray-600 text-sm">Genera y administra certificados y constancias</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => openModalTipo()}
                            className="flex items-center gap-2 bg-white border border-[#293577] text-[#293577] px-4 py-2 rounded-lg hover:bg-[#293577]/5 text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                            </svg>
                            Gestionar Tipos
                        </button>
                        <button
                            onClick={openModalSolicitud}
                            className="flex items-center gap-2 bg-[#293577] text-white px-4 py-2 rounded-lg hover:bg-[#181b49] text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Nueva Solicitud
                        </button>
                    </div>
                </div>

                {/* ═══ Tipos de Certificado ═══ */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-5 border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-gray-800 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
                            Tipos de Certificados Disponibles
                        </h2>
                        
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {tiposCertificado.map((tipo) => (
                            <div
                                key={tipo.id}
                                className={`flex items-center justify-between p-3 rounded-lg border ${tipo.activo ? 'bg-gray-50 border-gray-200' : 'bg-gray-100 border-gray-300 opacity-60'}`}
                            >
                                <div className="min-w-0 flex-1">
                                    <span className="text-sm text-gray-800 font-medium truncate block">{tipo.nombre}</span>
                                    {tipo.descripcion && (
                                        <span className="text-xs text-gray-500 truncate block">{tipo.descripcion}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                    <span className="text-sm font-bold text-green-600">{formatPrecio(tipo.precio)}</span>
                                    <button
                                        onClick={() => openModalTipo(tipo)}
                                        className="p-1 text-gray-400 hover:text-[#293577]"
                                        title="Editar"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ═══ Stats ═══ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {[
                        { key: 'solicitado', label: 'Pendientes', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', subtext: 'text-yellow-700' },
                        { key: 'en_proceso', label: 'En Proceso', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', subtext: 'text-blue-700' },
                        { key: 'listo', label: 'Listos', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', subtext: 'text-green-700' },
                        { key: 'entregado', label: 'Entregados', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', subtext: 'text-gray-700' },
                    ].map(stat => (
                        <button
                            key={stat.key}
                            onClick={() => setEstadoSeleccionado(estadoSeleccionado === stat.key ? 'todos' : stat.key)}
                            className={`${stat.bg} border ${stat.border} rounded-xl p-3 sm:p-4 text-center transition-all ${estadoSeleccionado === stat.key ? 'ring-2 ring-offset-1 ring-[#293577]' : 'hover:shadow-md'}`}
                        >
                            <p className={`text-2xl sm:text-3xl font-bold ${stat.text}`}>{stats[stat.key as keyof typeof stats]}</p>
                            <p className={`text-xs sm:text-sm ${stat.subtext}`}>{stat.label}</p>
                        </button>
                    ))}
                </div>

                {/* ═══ Filtros ═══ */}
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-4 border border-gray-100">
                    {/* Nivel educativo chips */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nivel Educativo</label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleNivelChange('todos')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${nivelSeleccionado === 'todos' ? 'bg-[#293577] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Todos
                            </button>
                            {niveles.map(nivel => (
                                <button
                                    key={nivel}
                                    onClick={() => handleNivelChange(nivel)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${nivelSeleccionado === nivel ? `${getNivelChipActive(nivel)} text-white shadow-md` : `${getNivelBadge(nivel)} hover:opacity-80`}`}
                                >
                                    {getNivelLabel(nivel)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sede (si hay más de una), Curso, Tipo, Estado, Búsqueda */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {sedes.length > 0 && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sede</label>
                                <select
                                    value={sedeSel}
                                    onChange={(e) => { setSedeSel(e.target.value); setCursoSeleccionado('todos'); }}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                >
                                    <option value="todas">Todas las sedes</option>
                                    {sedes.map(s => (
                                        <option key={s.id} value={s.id}>{s.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Curso</label>
                            <select
                                value={cursoSeleccionado}
                                onChange={(e) => setCursoSeleccionado(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="todos">Todos los cursos</option>
                                {cursosDisponibles.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tipo de Certificado</label>
                            <select
                                value={tipoSeleccionado}
                                onChange={(e) => setTipoSeleccionado(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="todos">Todos los tipos</option>
                                {tiposCertificado.map(t => (
                                    <option key={t.id} value={t.id}>{t.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Estado</label>
                            <select
                                value={estadoSeleccionado}
                                onChange={(e) => setEstadoSeleccionado(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                            >
                                <option value="todos">Todos los estados</option>
                                {Object.entries(estadosConfig).map(([key, cfg]) => (
                                    <option key={key} value={key}>{cfg.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Buscar</label>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Estudiante o tipo..."
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Filtros activos */}
                    {hayFiltrosActivos && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="text-xs text-gray-500">Filtros activos:</span>
                            {sedeSel !== 'todas' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                                    {sedes.find(s => s.id.toString() === sedeSel)?.nombre}
                                    <button onClick={() => { setSedeSel('todas'); setCursoSeleccionado('todos'); }} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {nivelSeleccionado !== 'todos' && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getNivelBadge(nivelSeleccionado)}`}>
                                    {getNivelLabel(nivelSeleccionado)}
                                    <button onClick={() => handleNivelChange('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {cursoSeleccionado !== 'todos' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                    {cursos.find(c => c.id.toString() === cursoSeleccionado)?.nombre}
                                    <button onClick={() => setCursoSeleccionado('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {tipoSeleccionado !== 'todos' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                    {tiposCertificado.find(t => t.id.toString() === tipoSeleccionado)?.nombre}
                                    <button onClick={() => setTipoSeleccionado('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {estadoSeleccionado !== 'todos' && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoBadge(estadoSeleccionado)}`}>
                                    {getEstadoLabel(estadoSeleccionado)}
                                    <button onClick={() => setEstadoSeleccionado('todos')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            {busqueda && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                    "{busqueda}"
                                    <button onClick={() => setBusqueda('')} className="ml-0.5 hover:opacity-70">×</button>
                                </span>
                            )}
                            <button onClick={limpiarFiltros} className="text-xs text-red-500 hover:text-red-700 font-medium ml-1">
                                Limpiar todo
                            </button>
                        </div>
                    )}
                </div>

                {/* ═══ Tabla Desktop ═══ */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hidden sm:block">
                    {certificadosFiltrados.length === 0 ? (
                        <div className="p-12 text-center">
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                            <p className="text-gray-500 font-medium">No se encontraron certificados</p>
                            <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px]">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nivel</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Curso</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Solicitud</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {certificadosFiltrados.map((cert) => (
                                        <tr key={cert.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-medium text-gray-800">{cert.tipo_nombre}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{cert.estudiante}</td>
                                            <td className="px-4 py-3">
                                                {cert.nivel ? (
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getNivelBadge(cert.nivel)}`}>
                                                        {getNivelLabel(cert.nivel)}
                                                    </span>
                                                ) : <span className="text-gray-400">-</span>}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{cert.curso || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{cert.fecha_solicitud}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getEstadoBadge(cert.estado)}`}>
                                                    {getEstadoLabel(cert.estado)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {cert.estado === 'listo' && cert.archivo && (
                                                        <a
                                                            href={`/admin/certificados/${cert.id}/download`}
                                                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                        >
                                                            Descargar
                                                        </a>
                                                    )}
                                                    {cert.estado !== 'entregado' && (
                                                        <button
                                                            onClick={() => setShowModalGestionar(cert)}
                                                            className="text-[#293577] hover:text-[#181b49] text-sm font-medium"
                                                        >
                                                            Gestionar
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteCertificado(cert)}
                                                        className="text-red-500 hover:text-red-700 text-sm font-medium"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ═══ Cards Mobile ═══ */}
                <div className="sm:hidden space-y-3">
                    {certificadosFiltrados.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>
                            <p className="text-gray-500 text-sm">No se encontraron certificados</p>
                        </div>
                    ) : (
                        certificadosFiltrados.map((cert) => (
                            <div key={cert.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-800 text-sm">{cert.tipo_nombre}</p>
                                        <p className="text-xs text-gray-500">{cert.fecha_solicitud}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getEstadoBadge(cert.estado)}`}>
                                        {getEstadoLabel(cert.estado)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <div className="min-w-0">
                                        <p className="text-sm text-gray-800">{cert.estudiante}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {cert.nivel && (
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getNivelBadge(cert.nivel)}`}>
                                                    {getNivelLabel(cert.nivel)}
                                                </span>
                                            )}
                                            <span className="text-xs text-gray-500">{cert.curso}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        {cert.estado !== 'entregado' && (
                                            <button
                                                onClick={() => setShowModalGestionar(cert)}
                                                className="text-[#293577] text-xs font-medium"
                                            >
                                                Gestionar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Contador */}
                <div className="text-center">
                    <p className="text-xs text-gray-400">
                        Mostrando {certificadosFiltrados.length} de {certificados.length} certificados
                    </p>
                </div>
            </div>

            {/* ═══════════════════════════ MODAL NUEVA SOLICITUD ═══════════════════════════ */}
            {showModalSolicitud && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={closeModalSolicitud}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-br from-[#293577] to-[#181b49] p-5 text-white flex-shrink-0">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold leading-tight">Nueva Solicitud</h2>
                                        <p className="text-white/60 text-xs mt-0.5">Certificado o constancia</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModalSolicitud}
                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors flex-shrink-0"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Resumen tipo seleccionado */}
                            {tipoSeleccionadoObj && (
                                <div className="mt-4 bg-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
                                    <span className="text-sm font-medium text-white/90">{tipoSeleccionadoObj.nombre}</span>
                                    <span className="text-base font-extrabold text-yellow-300">{formatPrecio(tipoSeleccionadoObj.precio)}</span>
                                </div>
                            )}
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto p-5 space-y-5">
                            <form id="form-solicitud" onSubmit={handleSubmitSolicitud} className="space-y-5">

                                {/* ── Buscador de estudiante ── */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                        Estudiante *
                                    </label>
                                    <div ref={dropdownRef} className="relative">
                                        {/* Input de búsqueda / trigger */}
                                        <div
                                            className={`flex items-center gap-2 w-full px-3 py-2.5 border rounded-xl text-sm cursor-text transition-all ${
                                                dropdownOpen
                                                    ? 'border-[#293577] ring-2 ring-[#293577]/20'
                                                    : estudianteSeleccionado
                                                    ? 'border-gray-300 bg-gray-50'
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                            onClick={() => {
                                                if (dropdownRef.current) {
                                                    const r = dropdownRef.current.getBoundingClientRect();
                                                    setDropdownPos({ top: r.bottom + 4, left: r.left, width: r.width });
                                                }
                                                setDropdownOpen(true);
                                                setTimeout(() => inputBusquedaRef.current?.focus(), 50);
                                            }}
                                        >
                                            {estudianteSeleccionado && !dropdownOpen ? (
                                                /* Estudiante seleccionado - modo display */
                                                <>
                                                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#293577] to-[#181b49] flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
                                                        {estudianteSeleccionado.name.charAt(0)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-gray-800 truncate">{estudianteSeleccionado.name}</p>
                                                        {estudianteSeleccionado.curso && (
                                                            <p className="text-xs text-gray-400 truncate">{estudianteSeleccionado.curso}</p>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={e => { e.stopPropagation(); setFormSolicitud(f => ({ ...f, estudiante_id: '' })); setBusquedaEst(''); }}
                                                        className="w-5 h-5 rounded-full bg-gray-200 hover:bg-red-100 hover:text-red-500 flex items-center justify-center text-gray-400 transition-colors flex-shrink-0"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </>
                                            ) : (
                                                /* Modo búsqueda */
                                                <>
                                                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                    <input
                                                        ref={inputBusquedaRef}
                                                        type="text"
                                                        value={busquedaEst}
                                                        onChange={e => { setBusquedaEst(e.target.value); setDropdownOpen(true); }}
                                                        onFocus={() => setDropdownOpen(true)}
                                                        placeholder="Buscar por nombre o curso..."
                                                        className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                                                    />
                                                    {busquedaEst && (
                                                        <button type="button" onClick={() => setBusquedaEst('')} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Dropdown lista - portal para evitar recorte por overflow */}
                                        {dropdownOpen && dropdownPos && createPortal(
                                            <div ref={dropdownPanelRef} className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto" style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}>
                                                {estudiantesSugeridos.length === 0 ? (
                                                    <div className="px-4 py-6 text-center">
                                                        <svg className="w-8 h-8 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                        <p className="text-sm text-gray-400">Sin resultados para <strong>{busquedaEst}</strong></p>
                                                    </div>
                                                ) : (
                                                    estudiantesSugeridos.map(est => {
                                                        const isSelected = est.id.toString() === formSolicitud.estudiante_id;
                                                        const q = busquedaEst.toLowerCase();
                                                        const nameParts = busquedaEst
                                                            ? est.name.replace(new RegExp(`(${busquedaEst.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '|||$1|||').split('|||')
                                                            : [est.name];
                                                        return (
                                                            <button
                                                                key={est.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setFormSolicitud(f => ({ ...f, estudiante_id: est.id.toString() }));
                                                                    setBusquedaEst('');
                                                                    setDropdownOpen(false);
                                                                }}
                                                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#293577]/5 transition-colors ${
                                                                    isSelected ? 'bg-[#293577]/8' : ''
                                                                }`}
                                                            >
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                                                                    isSelected ? 'bg-[#293577]' : 'bg-gradient-to-br from-[#293577]/70 to-[#181b49]/70'
                                                                }`}>
                                                                    {est.name.charAt(0)}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-sm font-medium text-gray-800 truncate">
                                                                        {nameParts.map((part, i) =>
                                                                            part.toLowerCase() === q
                                                                                ? <mark key={i} className="bg-yellow-200 text-gray-800 rounded px-0.5">{part}</mark>
                                                                                : <span key={i}>{part}</span>
                                                                        )}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400 truncate">
                                                                        {[est.nivel && getNivelLabel(est.nivel), est.curso].filter(Boolean).join(' · ')}
                                                                    </p>
                                                                </div>
                                                                {isSelected && (
                                                                    <svg className="w-4 h-4 text-[#293577] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                                                                )}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>,
                                            document.body
                                        )}
                                    </div>
                                    {/* Hidden input para validación nativa */}
                                    <input type="hidden" value={formSolicitud.estudiante_id} required />
                                </div>

                                {/* ── Tipo de certificado ── */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo de Certificado *</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {tiposActivos.map(t => {
                                            const isActive = formSolicitud.tipo_certificado_id === t.id.toString();
                                            return (
                                                <button
                                                    key={t.id}
                                                    type="button"
                                                    onClick={() => setFormSolicitud(f => ({ ...f, tipo_certificado_id: t.id.toString() }))}
                                                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition-all ${
                                                        isActive
                                                            ? 'border-[#293577] bg-[#293577]/5 shadow-sm'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                                            isActive ? 'border-[#293577] bg-[#293577]' : 'border-gray-300'
                                                        }`}>
                                                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                        </div>
                                                        <div>
                                                            <p className={`text-sm font-semibold ${ isActive ? 'text-[#293577]' : 'text-gray-700' }`}>{t.nombre}</p>
                                                            {t.descripcion && <p className="text-xs text-gray-400 mt-0.5">{t.descripcion}</p>}
                                                        </div>
                                                    </div>
                                                    <span className={`text-sm font-bold flex-shrink-0 ml-3 ${ isActive ? 'text-[#293577]' : 'text-gray-500' }`}>
                                                        {formatPrecio(t.precio)}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                        {tiposActivos.length === 0 && (
                                            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-xl p-3">
                                                No hay tipos de certificado activos. Crea uno en "Gestionar Tipos".
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* ── Observaciones ── */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Observaciones</label>
                                    <textarea
                                        value={formSolicitud.descripcion}
                                        onChange={(e) => setFormSolicitud({ ...formSolicitud, descripcion: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm resize-none focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                        placeholder="Notas adicionales sobre la solicitud..."
                                    />
                                </div>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-3 flex-shrink-0">
                            <button
                                type="button"
                                onClick={closeModalSolicitud}
                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="form-solicitud"
                                disabled={processing || !formSolicitud.estudiante_id || !formSolicitud.tipo_certificado_id}
                                className="flex-1 flex items-center justify-center gap-2 bg-[#293577] text-white px-4 py-2.5 rounded-xl hover:bg-[#181b49] text-sm font-semibold disabled:opacity-50 transition-colors"
                            >
                                {processing ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creando...</>
                                ) : (
                                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5v15m7.5-7.5h-15" /></svg> Crear Solicitud</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════ MODAL GESTIONAR TIPO ═══════════════════════════ */}
            {showModalTipo && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-5 sm:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>
                                {editingTipo ? 'Editar Tipo de Certificado' : 'Nuevo Tipo de Certificado'}
                            </h2>
                            <button onClick={closeModalTipo} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmitTipo} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                    <input
                                        type="text"
                                        value={formTipo.nombre}
                                        onChange={(e) => handleNombreTipo(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                                        placeholder="Ej: Constancia de Estudios"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Código *
                                        {!codigoManual && formTipo.codigo && (
                                            <span className="ml-1.5 text-[10px] font-normal text-[#293577]/70 bg-[#293577]/8 px-1.5 py-0.5 rounded">auto</span>
                                        )}
                                    </label>
                                    <input
                                        type="text"
                                        value={formTipo.codigo}
                                        onChange={(e) => { setCodigoManual(true); setFormTipo({ ...formTipo, codigo: e.target.value.toLowerCase().replace(/\s+/g, '_') }); }}
                                        onFocus={() => { if (!editingTipo) setCodigoManual(true); }}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] font-mono"
                                        placeholder="Ej: constancia_estudios"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    value={formTipo.descripcion}
                                    onChange={(e) => setFormTipo({ ...formTipo, descripcion: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#293577]"
                                    placeholder="Descripción del certificado..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Precio *</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
                                        value={formTipo.precio}
                                        onChange={(e) => setFormTipo({ ...formTipo, precio: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                                        required
                                    />
                                </div>
                                <div className="flex items-end pb-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formTipo.activo}
                                            onChange={(e) => setFormTipo({ ...formTipo, activo: e.target.checked })}
                                            className="w-4 h-4 text-[#293577] border-gray-300 rounded focus:ring-[#293577]"
                                        />
                                        <span className="text-sm text-gray-700">Activo</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                {editingTipo && (
                                    <button
                                        type="button"
                                        onClick={() => { handleDeleteTipo(editingTipo); closeModalTipo(); }}
                                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium"
                                    >
                                        Eliminar
                                    </button>
                                )}
                                <div className="flex-1 flex gap-3 justify-end">
                                    <button
                                        type="button"
                                        onClick={closeModalTipo}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || !formTipo.nombre || !formTipo.codigo}
                                        className="bg-[#293577] text-white px-6 py-2 rounded-lg hover:bg-[#181b49] text-sm font-medium disabled:opacity-50"
                                    >
                                        {processing ? 'Guardando...' : editingTipo ? 'Actualizar' : 'Crear'}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {/* Lista de tipos existentes */}
                        {!editingTipo && tiposCertificado.length > 0 && (
                            <div className="mt-6 pt-4 border-t">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3">Tipos existentes</h3>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {tiposCertificado.map(t => (
                                        <div
                                            key={t.id}
                                            className={`flex items-center justify-between p-2 rounded-lg ${t.activo ? 'bg-gray-50' : 'bg-gray-100 opacity-60'}`}
                                        >
                                            <div className="min-w-0">
                                                <span className="text-sm font-medium text-gray-800">{t.nombre}</span>
                                                <span className="text-xs text-gray-500 ml-2">{formatPrecio(t.precio)}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => openModalTipo(t)}
                                                className="text-xs text-[#293577] hover:text-[#181b49] font-medium"
                                            >
                                                Editar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════ MODAL GESTIONAR CERTIFICADO ═══════════════════════════ */}
            {showModalGestionar && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowModalGestionar(null)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* ── Header gradient ── */}
                        <div className="relative bg-gradient-to-br from-[#293577] to-[#181b49] p-5 text-white">
                            <button
                                onClick={() => setShowModalGestionar(null)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>

                            <div className="flex items-start gap-3 pr-10">
                                {/* Doc icon */}
                                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold leading-tight">{showModalGestionar.tipo_nombre}</h2>
                                    <p className="text-white/70 text-sm mt-0.5">{showModalGestionar.estudiante}</p>
                                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                        {showModalGestionar.nivel && (
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white`}>
                                                {getNivelLabel(showModalGestionar.nivel)}
                                            </span>
                                        )}
                                        {showModalGestionar.curso && (
                                            <span className="px-2 py-0.5 rounded-full text-xs bg-white/15 text-white/80">{showModalGestionar.curso}</span>
                                        )}
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getEstadoBadge(showModalGestionar.estado)}`}>
                                            {getEstadoLabel(showModalGestionar.estado)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Status progress bar */}
                            <div className="mt-4 flex items-center gap-1">
                                {(['solicitado', 'en_proceso', 'listo', 'entregado'] as const).map((s, i, arr) => {
                                    const estados = ['solicitado', 'en_proceso', 'listo', 'entregado'];
                                    const currentIdx = estados.indexOf(showModalGestionar.estado);
                                    const isDone = i <= currentIdx;
                                    const labels = ['Solicitado', 'En proceso', 'Listo', 'Entregado'];
                                    return (
                                        <div key={s} className="flex items-center flex-1 min-w-0">
                                            <div className="flex flex-col items-center flex-1 min-w-0">
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isDone ? 'bg-white text-[#293577]' : 'bg-white/20 text-white/50'}`}>
                                                    {isDone
                                                        ? <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                                        : <span className="text-[9px] font-bold">{i + 1}</span>
                                                    }
                                                </div>
                                                <span className={`text-[9px] mt-0.5 text-center truncate w-full ${isDone ? 'text-white' : 'text-white/40'}`}>{labels[i]}</span>
                                            </div>
                                            {i < arr.length - 1 && (
                                                <div className={`h-0.5 flex-1 mx-0.5 mb-3 rounded-full transition-all ${i < currentIdx ? 'bg-white' : 'bg-white/20'}`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* ── Body ── */}
                        <div className="overflow-y-auto flex-1 p-5 space-y-4">
                            {/* Info grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Solicitud</p>
                                    <p className="text-sm font-semibold text-gray-800">{showModalGestionar.fecha_solicitud}</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">Entrega</p>
                                    <p className="text-sm font-semibold text-gray-800">{showModalGestionar.fecha_entrega ?? '—'}</p>
                                </div>
                            </div>

                            {/* Padres info */}
                            {showModalGestionar.padres && showModalGestionar.padres.length > 0 && (
                                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                                    <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        Acudientes
                                    </p>
                                    <div className="space-y-1">
                                        {showModalGestionar.padres.map(p => (
                                            <p key={p.id} className="text-sm text-blue-800 font-medium">{p.name}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {showModalGestionar.padres?.length === 0 && (
                                <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5Zm0 9a1 1 0 100-2 1 1 0 000 2Z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-xs text-yellow-700">Sin acudientes registrados — no se puede enviar notificación.</p>
                                </div>
                            )}

                            {/* Observaciones */}
                            {showModalGestionar.descripcion && (
                                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1">Observaciones</p>
                                    <p className="text-sm text-gray-700 leading-relaxed">{showModalGestionar.descripcion}</p>
                                </div>
                            )}

                            {/* Status change */}
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cambiar estado</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {(Object.entries(estadosConfig) as [string, { label: string; color: string }][]).map(([key, cfg]) => {
                                        const isCurrent = showModalGestionar.estado === key;
                                        const estadoIcons: Record<string, JSX.Element> = {
                                            solicitado: <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                                            en_proceso: <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                                            listo:      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
                                            entregado:  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
                                        };
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => handleUpdateEstado(showModalGestionar, key)}
                                                disabled={isCurrent}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                    isCurrent
                                                        ? 'bg-[#293577] text-white cursor-default shadow-md'
                                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:shadow-sm'
                                                }`}
                                            >
                                                {estadoIcons[key]}
                                                {cfg.label}
                                                {isCurrent && <svg className="w-3.5 h-3.5 ml-auto" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ── Footer actions ── */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-2">
                            {/* PDF + Notify row */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => generarPDF(showModalGestionar)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-[#293577] hover:bg-[#181b49] text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Generar PDF
                                </button>
                                <button
                                    onClick={() => handleNotificarPadre(showModalGestionar)}
                                    disabled={sendingNotif || !showModalGestionar.padres?.length}
                                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                    title={!showModalGestionar.padres?.length ? 'Sin acudientes registrados' : 'Enviar mensaje y notificación al acudiente'}
                                >
                                    {sendingNotif ? (
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    )}
                                    Notificar acudiente
                                </button>
                            </div>
                            {/* Delete + Close */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { handleDeleteCertificado(showModalGestionar); setShowModalGestionar(null); }}
                                    className="px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 text-sm font-medium transition-colors"
                                >
                                    Eliminar
                                </button>
                                <button
                                    onClick={() => setShowModalGestionar(null)}
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-100 text-gray-600 text-sm font-medium transition-colors"
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
