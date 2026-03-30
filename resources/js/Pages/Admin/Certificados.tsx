import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminMenuItems } from '@/Config/adminMenu';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    estudiante_documento: string | null;
    estudiante_tipo_documento: string | null;
    nivel: string;
    curso_id: number | null;
    curso: string;
    descripcion: string | null;
    archivo: string | null;
    fecha_solicitud: string;
    fecha_entrega: string | null;
    estado: 'solicitado' | 'en_proceso' | 'listo' | 'entregado';
    pago_estado: 'pendiente' | 'pagado' | 'vencido' | 'anulado' | null;
    pago_confirmado: boolean;
    requiere_pago: boolean;
    padres: { id: number; name: string }[];
    notas: { materia: string; ih: number; definitiva: number; escala: string }[];
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
    listo:      { label: 'Generado y Enviado', color: 'bg-green-100 text-green-800' },
    entregado:  { label: 'Entregado',        color: 'bg-gray-100 text-gray-600' },
};

const getNivelBadge = (nivel: string) => nivelesConfig[nivel]?.color ?? 'bg-gray-100 text-gray-700';
const getNivelLabel = (nivel: string) => nivelesConfig[nivel]?.label ?? nivel;
const getNivelChipActive = (nivel: string) => nivelesConfig[nivel]?.chipActive ?? 'bg-gray-500';
const getEstadoBadge = (estado: string) => estadosConfig[estado]?.color ?? 'bg-gray-100 text-gray-700';
const getEstadoLabel = (estado: string) => estadosConfig[estado]?.label ?? estado;

const formatPrecio = (precio: number) => '$' + precio.toLocaleString('es-CO');

const LOGO_CANDIDATES = [
    '/logo-certificados.png',
    '/logo-certificados.jpg',
    '/logo-certificados.jpeg',
    '/images/logo-certificados.png',
    '/images/logo-certificados.jpg',
    '/img/logo-certificados.png',
    '/certificados-logo.png',
    '/images/certificados-logo.png',
];

const INSTITUCION = {
    nombre1: 'INSTITUTO PEDAGOGICO',
    nombre2: 'EMPRENDEDORES DEL SABER',
    lema: 'Ser, saber y emprender',
    legal: 'Aprobado por Resolución No 3769 del 23 - 05 - 2023',
    daneNit: 'DANE 313001800093  -  NIT 73143410 -6',
    firma: 'COORDINADORA',
    sede: 'Villas de la candelaria Mz. 44 Lt. 11 CEL: 3005257812 - 3006529540',
    correo: 'CORREO: emprendedores.sersaber2023@gmail.com',
    ciudad: 'Cartagena de Indias - Colombia',
};

const getEscalaValorativa = (nota: number) => {
    if (nota >= 4.6) return 'SUPERIOR';
    if (nota >= 4.0) return 'ALTO';
    if (nota >= 3.0) return 'BASICO';
    return 'BAJO';
};

const getNivelAcademico = (nivel: string) => {
    const key = (nivel || '').toLowerCase();
    if (key === 'prejardin' || key === 'preescolar' || key === 'transicion') return 'EDUCACION PREESCOLAR';
    if (key === 'primaria') return 'EDUCACION BASICA PRIMARIA';
    if (key === 'secundaria') return 'EDUCACION BASICA SECUNDARIA';
    if (key === 'media' || key === 'bachillerato') return 'EDUCACION MEDIA';
    return 'EDUCACION BASICA';
};

const normalizarCodigoCertificado = (codigo: string) =>
    (codigo || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

const fechaLiteral = (fecha = new Date()) => {
    const dia = fecha.getDate();
    const mes = fecha.toLocaleString('es-CO', { month: 'long' });
    const anio = fecha.getFullYear();
    return { dia, mes, anio };
};

/**
 * Carga una imagen, la redimensiona al tamaño máximo indicado (en px a 96dpi)
 * y aplica opacidad opcional. Devuelve base64 JPEG (opacidad=1) o PNG (opacidad<1).
 * Usar maxPx pequeño reduce drásticamente el peso del PDF.
 */
const cargarImagenConOpacidad = async (src: string, opacidad = 1, maxPx = 400): Promise<string | null> => {
    const url = src.startsWith('http') ? src : window.location.origin + src;
    try {
        const resp = await fetch(url, { credentials: 'same-origin' });
        if (!resp.ok) return null;
        const blob = await resp.blob();
        const base64: string = await new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result as string);
            reader.onerror   = () => rej(new Error('FileReader error'));
            reader.readAsDataURL(blob);
        });
        // Redimensionar + aplicar opacidad siempre vía canvas
        return new Promise((res) => {
            const img = new Image();
            img.onload = () => {
                const origW = img.naturalWidth  || img.width  || maxPx;
                const origH = img.naturalHeight || img.height || maxPx;
                const scale = Math.min(1, maxPx / Math.max(origW, origH));
                const cW = Math.round(origW * scale);
                const cH = Math.round(origH * scale);
                const canvas = document.createElement('canvas');
                canvas.width  = cW;
                canvas.height = cH;
                const ctx = canvas.getContext('2d');
                if (!ctx) { res(null); return; }
                ctx.clearRect(0, 0, cW, cH);
                ctx.globalAlpha = opacidad;
                ctx.drawImage(img, 0, 0, cW, cH);
                // PNG siempre (preserva transparencia del logo); JPEG solo si opacidad=1 Y no es PNG con alpha
                // Para simplificar: siempre PNG con fondo blanco cuando opacidad=1
                if (opacidad >= 1) {
                    // Redibujar sobre fondo blanco para evitar fondo negro en JPEG
                    const canvas2 = document.createElement('canvas');
                    canvas2.width  = cW;
                    canvas2.height = cH;
                    const ctx2 = canvas2.getContext('2d');
                    if (!ctx2) { res(null); return; }
                    ctx2.fillStyle = '#ffffff';
                    ctx2.fillRect(0, 0, cW, cH);
                    ctx2.drawImage(img, 0, 0, cW, cH);
                    res(canvas2.toDataURL('image/jpeg', 0.85));
                } else {
                    res(canvas.toDataURL('image/png'));
                }
            };
            img.onerror = () => res(null);
            img.src = base64;
        });
    } catch {
        return null;
    }
};

const cargarPrimerLogoDisponible = async (opacidad = 1, maxPx = 400): Promise<string | null> => {
    for (const candidate of LOGO_CANDIDATES) {
        const result = await cargarImagenConOpacidad(candidate, opacidad, maxPx);
        if (result) return result;
    }
    return null;
};

/* ═══════════════════════════ RICH-TEXT HELPER ═══════════════════════════ */
type RichSeg = { text: string; bold?: boolean };

/**
 * Renders a sequence of normal/bold segments as a wrapped paragraph in jsPDF.
 * Returns the Y coordinate after the last rendered line.
 */
const renderRichParagraph = (
    doc: jsPDF,
    segments: RichSeg[],
    x: number,
    y: number,
    maxWidth: number,
    fontSize: number,
    fontFamily: string,
    lineH: number,
    color: [number, number, number] = [18, 18, 18],
): number => {
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(fontSize);
    const spW = doc.getTextWidth(' ');

    type Token = { word: string; bold: boolean };
    const tokens: Token[] = [];
    for (const seg of segments) {
        for (const p of seg.text.split(' ')) {
            tokens.push({ word: p, bold: seg.bold ?? false });
        }
    }

    const getW = (word: string, bold: boolean): number => {
        doc.setFont(fontFamily, bold ? 'bold' : 'normal');
        doc.setFontSize(fontSize);
        return doc.getTextWidth(word);
    };

    type LineToken = { word: string; bold: boolean; xOff: number };
    const lines: LineToken[][] = [];
    let line: LineToken[] = [];
    let lineW = 0;

    for (const { word, bold } of tokens) {
        if (word === '') continue;
        const wW  = getW(word, bold);
        const gap = line.length > 0 ? spW : 0;
        if (lineW + gap + wW > maxWidth && line.length > 0) {
            lines.push(line);
            line  = [{ word, bold, xOff: 0 }];
            lineW = wW;
        } else {
            line.push({ word, bold, xOff: lineW + gap });
            lineW = lineW + gap + wW;
        }
    }
    if (line.length > 0) lines.push(line);

    doc.setTextColor(color[0], color[1], color[2]);
    for (const ln of lines) {
        for (const t of ln) {
            doc.setFont(fontFamily, t.bold ? 'bold' : 'normal');
            doc.setFontSize(fontSize);
            doc.text(t.word, x + t.xOff, y);
        }
        y += lineH;
    }
    return y;
};

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
    const [generatingCertId, setGeneratingCertId] = useState<number | null>(null);

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
    const generarPDF = useCallback(async (cert: Certificado, descargar = true) => {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const W   = 210;
        const codigo = normalizarCodigoCertificado(cert.tipo_codigo);
        const { dia, mes, anio } = fechaLiteral();
        const logoHeader    = await cargarPrimerLogoDisponible(1,    300);
        const logoWatermark = await cargarPrimerLogoDisponible(0.08, 260);

        const nombreEstudiante = cert.estudiante.toUpperCase();
        const tipoDoc  = cert.estudiante_tipo_documento || 'T.I.';
        const documento = cert.estudiante_documento
            ? `${tipoDoc} N\u00b0${cert.estudiante_documento}`
            : 'documento registrado en la instituci\u00f3n';
        const curso          = (cert.curso || '\u2014').toUpperCase();
        const nivelAcademico = getNivelAcademico(cert.nivel);
        const detalleAdicional = cert.descripcion?.trim();

        /* ─── Header ─── */
        // Logo zone: x=8, w=34  |  Triangles max-left at W-38=172mm  |  Text zone: 42..168mm → center=105mm
        const LOGO_X = 8, LOGO_Y = 4, LOGO_W = 34, LOGO_H = 38;
        const TRIANG_MAX = 38; // outermost band left-edge distance from right: W - TRIANG_MAX = 172mm
        const TEXT_RIGHT = W - TRIANG_MAX - 4; // 168mm — derecha del bloque de texto
        const TEXT_CX  = (LOGO_X + LOGO_W + TEXT_RIGHT) / 2; // ~105mm
        const drawHeader = () => {
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, W, 297, 'F');

            // ── 3 stacked triangles from top-right corner (largest pale → smallest dark navy) ──
            // All share apex at (W, 0); each drawn on top of the previous one
            doc.setFillColor(188, 214, 242);          // pale blue — largest
            doc.triangle(W - 58, 0,  W, 0,  W, 58, 'F');
            doc.setFillColor(80, 128, 200);            // medium blue
            doc.triangle(W - 38, 0,  W, 0,  W, 38, 'F');
            doc.setFillColor(22, 55, 148);             // dark navy — smallest
            doc.triangle(W - 18, 0,  W, 0,  W, 18, 'F');

            // ── Logo ──
            if (logoHeader) {
                doc.addImage(logoHeader, 'PNG', LOGO_X, LOGO_Y, LOGO_W, LOGO_H);
            } else {
                const cx = LOGO_X + LOGO_W / 2;
                const cy = LOGO_Y + LOGO_H / 2 - 2;
                const r  = LOGO_W / 2 - 1;
                doc.setDrawColor(10, 35, 90);
                doc.setLineWidth(1.2);
                doc.circle(cx, cy, r, 'S');
                doc.setLineWidth(0.6);
                doc.circle(cx, cy, r - 3, 'S');
                doc.setFont('times', 'bold');
                doc.setFontSize(14);
                doc.setTextColor(10, 35, 90);
                doc.text('I.P', cx, cy + 2, { align: 'center' });
                doc.setFont('times', 'italic');
                doc.setFontSize(4);
                doc.text('Emprendedores del Saber', cx, cy + r + 3.5, { align: 'center' });
            }

            // ── Institution name (bold, navy) ──
            doc.setTextColor(10, 35, 90);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(19);
            doc.text('INSTITUTO PEDAGOGICO', TEXT_CX, 14, { align: 'center' });
            doc.setFontSize(17);
            doc.text('EMPRENDEDORES DEL SABER', TEXT_CX, 24, { align: 'center' });

            // ── Sub-lines ──
            doc.setTextColor(25, 25, 25);
            doc.setFont('times', 'italic');
            doc.setFontSize(9);
            doc.text('Ser, saber y emprender', TEXT_CX, 31, { align: 'center' });
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.text('Aprobado por Resoluci\u00f3n No 3769 del 23 - 05 - 2023', TEXT_CX, 36, { align: 'center' });
            doc.text('DANE 313001800093  \u2013  NIT 73143410 - 6', TEXT_CX, 41, { align: 'center' });

            // ── Navy divider bar under text block (filled + black border) ──
            const barX = LOGO_X + LOGO_W + 2; // starts just after logo
            const barW = TEXT_RIGHT - barX;    // ends at text right limit
            doc.setFillColor(10, 35, 90);
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.4);
            doc.rect(barX, 46, barW, 2.5, 'FD');
        };

        /* ─── Watermark ─── */
        const drawWatermark = () => {
            if (logoWatermark) {
                doc.addImage(logoWatermark, 'PNG', 47, 118, 116, 116);
            } else {
                doc.setTextColor(228, 230, 238);
                doc.setFont('times', 'bold');
                doc.setFontSize(92);
                doc.text('I.P', W / 2, 185, { align: 'center' });
            }
        };

        /* ─── Footer ─── */
        const drawFooter = () => {
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.25);
            doc.line(25, 280, 185, 280);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6.5);
            doc.setTextColor(35, 35, 35);
            doc.text('Villas de la candelaria Mz. 44 Lt. 11  CEL: 3005257812 - 3006529540', W / 2, 284, { align: 'center' });
            doc.setTextColor(0, 56, 168);
            doc.text('EMAIL: emprendedores.sersaber2023@gmail.com', W / 2, 288.5, { align: 'center' });
            doc.setTextColor(35, 35, 35);
            doc.text('Cartagena de Indias - Colombia', W / 2, 293, { align: 'center' });
        };

        /* ─── Firma ─── */
        const drawFirma = (yLine: number) => {
            doc.setDrawColor(30, 30, 30);
            doc.setLineWidth(0.3);
            doc.line(75, yLine, 135, yLine);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.setTextColor(20, 20, 20);
            doc.text('COORDINADORA', W / 2, yLine + 6, { align: 'center' });
        };

        /* ─── "Certifica" heading ─── */
        const drawTituloCertifica = () => {
            doc.setTextColor(20, 20, 20);
            doc.setFont('times', 'bold');
            doc.setFontSize(10.5);
            doc.text('LA SUSCRITA COORDINADORA DEL', W / 2, 60, { align: 'center' });
            doc.text('INSTITUTO PEDAG\u00d3GICO EMPRENDEDORES DEL SABER', W / 2, 68, { align: 'center' });
            doc.setFontSize(13);
            doc.text('CERTIFICA:', W / 2, 84, { align: 'center' });
        };

        /* ─── Assemble page ─── */
        drawHeader();
        drawWatermark();
        drawTituloCertifica();

        const marX  = 22;
        const bodyW = W - marX * 2;
        const fSize = 10.8;
        const lH    = 6.5;

        if (codigo.includes('nota') || codigo.includes('calific')) {
            // ── Certificado de Notas ──
            const segs: RichSeg[] = [
                { text: 'Que el estudiante ' },
                { text: nombreEstudiante, bold: true },
                { text: ' identificado con ' },
                { text: documento, bold: true },
                { text: ' curs\u00f3 y aprob\u00f3 en nuestro instituto durante el a\u00f1o lectivo ' },
                { text: String(anio), bold: true },
                { text: ', las \u00e1reas correspondientes a ' },
                { text: curso, bold: true },
                { text: ' de ' },
                { text: nivelAcademico, bold: true },
                { text: '.' },
            ];
            let y = renderRichParagraph(doc, segs, marX, 94, bodyW, fSize, 'times', lH);

            const notas = cert.notas?.length > 0
                ? cert.notas.map(n => [
                    n.materia.toUpperCase(),
                    String(n.ih || 0),
                    n.definitiva.toFixed(1),
                    getEscalaValorativa(n.definitiva),
                ])
                : [['SIN REGISTROS ACAD\u00c9MICOS', '-', '-', '-']];

            autoTable(doc, {
                startY: y + 4,
                margin: { left: marX, right: marX },
                head: [['\u00c1REAS / ASIGNATURAS', 'I.H.', 'NOTA DEFINITIVA', 'ESCALA VALORATIVA']],
                body: notas,
                theme: 'grid',
                styles: {
                    font: 'times',
                    fontSize: 7.8,
                    cellPadding: 1.9,
                    textColor: [10, 10, 10],
                    lineColor: [40, 40, 40],
                    lineWidth: 0.2,
                },
                headStyles: {
                    fillColor: [215, 215, 215],
                    textColor: [10, 10, 10],
                    fontStyle: 'bold',
                    halign: 'center',
                    fontSize: 7.8,
                },
                columnStyles: {
                    0: { cellWidth: 74 },
                    1: { cellWidth: 14, halign: 'center' },
                    2: { cellWidth: 36, halign: 'center' },
                    3: { cellWidth: 42, halign: 'center' },
                },
            });

            const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 202;
            const cierreSegs: RichSeg[] = [
                { text: `El presente certificado se expide en Cartagena de Indias D. T. y C. a los ${dia} d\u00edas del mes de ${mes} del a\u00f1o ${anio}.` },
            ];
            const cY = renderRichParagraph(doc, cierreSegs, marX, finalY + 10, bodyW, fSize, 'times', lH);
            drawFirma(Math.min(Math.max(cY + 6, 200), 256));
            drawFooter();
        } else {
            // ── Paz y Salvo / Estudio / Matrícula ──
            let segs: RichSeg[] = [];

            if (codigo.includes('paz')) {
                segs = [
                    { text: 'Que el estudiante ' },
                    { text: nombreEstudiante, bold: true },
                    { text: ' identificado con ' },
                    { text: documento, bold: true },
                    { text: ' cursa en nuestro instituto ' },
                    { text: curso, bold: true },
                    { text: ' de educaci\u00f3n ' },
                    { text: nivelAcademico, bold: true },
                    { text: ', se encuentra a ' },
                    { text: 'PAZ Y SALVO', bold: true },
                    { text: ` por todo concepto hasta el mes de ${mes} del a\u00f1o ${anio}.` },
                ];
            } else if (codigo.includes('mat') || codigo.includes('estudio') || codigo.includes('constancia')) {
                segs = [
                    { text: 'Que el estudiante ' },
                    { text: nombreEstudiante, bold: true },
                    { text: ' identificado con ' },
                    { text: documento, bold: true },
                    { text: ' cursa en nuestro instituto ' },
                    { text: curso, bold: true },
                    { text: ' de ' },
                    { text: nivelAcademico, bold: true },
                    { text: ` en el a\u00f1o lectivo ` },
                    { text: String(anio), bold: true },
                    { text: '.' },
                ];
            } else {
                segs = [
                    { text: 'Que el estudiante ' },
                    { text: nombreEstudiante, bold: true },
                    { text: ' identificado con ' },
                    { text: documento, bold: true },
                    { text: ' pertenece activamente a nuestro instituto y cursa ' },
                    { text: curso, bold: true },
                    { text: ' de ' },
                    { text: nivelAcademico, bold: true },
                    { text: ` durante el a\u00f1o lectivo ` },
                    { text: String(anio), bold: true },
                    { text: '.' },
                ];
            }

            let y = renderRichParagraph(doc, segs, marX, 94, bodyW, fSize, 'times', lH);

            const cierreBase = detalleAdicional && !codigo.includes('paz')
                ? `El presente certificado se expide a solicitud del interesado en Cartagena de Indias D. T. y C. ${detalleAdicional}, a los ${dia} d\u00edas del mes de ${mes} del a\u00f1o ${anio}.`
                : `El presente certificado se expide a solicitud del interesado en Cartagena de Indias D. T. y C. a los ${dia} d\u00edas del mes de ${mes} del a\u00f1o ${anio}.`;

            const cierreSegs: RichSeg[] = [{ text: cierreBase }];
            const cY = renderRichParagraph(doc, cierreSegs, marX, y + 8, bodyW, fSize, 'times', lH);
            drawFirma(Math.min(Math.max(cY + 6, 200), 256));
            drawFooter();
        }

        const fileName = `${cert.tipo_nombre.replace(/\s+/g, '_')}_${cert.estudiante.replace(/\s+/g, '_')}.pdf`;
        const blob = doc.output('blob');
        if (descargar) {
            doc.save(fileName);
        }

        return { blob, fileName };
    }, []);

    const handleGenerarCertificado = useCallback(async (cert: Certificado) => {
        if (cert.requiere_pago && !cert.pago_confirmado) {
            alert('No se puede generar el certificado hasta confirmar el pago.');
            return;
        }

        setGeneratingCertId(cert.id);

        try {
            const { blob, fileName } = await generarPDF(cert, true);
            const pdf = new File([blob], fileName, { type: 'application/pdf' });

            router.post(
                `/admin/certificados/${cert.id}/generar`,
                { archivo: pdf },
                {
                    forceFormData: true,
                    preserveScroll: true,
                    onSuccess: () => setShowModalGestionar(null),
                    onFinish: () => setGeneratingCertId(null),
                },
            );
        } catch {
            setGeneratingCertId(null);
            alert('No fue posible generar el PDF del certificado.');
        }
    }, [generarPDF]);

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
                        {sedes.length > 1 && (
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
                                                    {cert.archivo && (cert.estado === 'listo' || cert.estado === 'entregado') && (
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
                                        {showModalGestionar.requiere_pago && (
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${showModalGestionar.pago_confirmado ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {showModalGestionar.pago_confirmado ? 'Pago confirmado' : 'Pago pendiente'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Status progress bar */}
                            <div className="mt-4 flex items-center gap-1">
                                {(['solicitado', 'en_proceso', 'listo', 'entregado'] as const).map((s, i, arr) => {
                                    const estados = ['solicitado', 'en_proceso', 'listo', 'entregado'];
                                    const currentIdx = estados.indexOf(showModalGestionar.estado);
                                    const isDone = i <= currentIdx;
                                    const labels = ['Solicitado', 'En proceso', 'Generado', 'Entregado'];
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
                                        const bloqueadoPorPago = !showModalGestionar.pago_confirmado && showModalGestionar.requiere_pago && (key === 'listo' || key === 'entregado');
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
                                                disabled={isCurrent || bloqueadoPorPago}
                                                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                                    isCurrent
                                                        ? 'bg-[#293577] text-white cursor-default shadow-md'
                                                        : bloqueadoPorPago
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                                {!showModalGestionar.pago_confirmado && showModalGestionar.requiere_pago && (
                                    <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5">
                                        Debes confirmar el pago para habilitar generación y cierre del certificado.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* ── Footer actions ── */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-2">
                            {/* PDF + Notify row */}
                            <div className="flex gap-2">
                                {showModalGestionar.archivo && (showModalGestionar.estado === 'listo' || showModalGestionar.estado === 'entregado') ? (
                                    <a
                                        href={`/admin/certificados/${showModalGestionar.id}/download`}
                                        className="flex-1 flex items-center justify-center gap-2 bg-[#293577] hover:bg-[#181b49] text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Descargar certificado
                                    </a>
                                ) : (
                                    <button
                                        onClick={() => handleGenerarCertificado(showModalGestionar)}
                                        disabled={(showModalGestionar.requiere_pago && !showModalGestionar.pago_confirmado) || generatingCertId === showModalGestionar.id}
                                        className="flex-1 flex items-center justify-center gap-2 bg-[#293577] hover:bg-[#181b49] disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                    >
                                        {generatingCertId === showModalGestionar.id ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        )}
                                        Generar y enviar
                                    </button>
                                )}
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
