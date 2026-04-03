import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { padreMenuItems } from '@/Config/padreMenu';

interface HijoOption {
    id: number;
    nombre: string;
}

interface HijoData {
    id: number;
    nombre: string;
    documento: string | null;
    grado: string;
    seccion: string;
    curso: string | null;
    director_grupo: string | null;
    fecha_nacimiento: string | null;
    lugar_nacimiento: string | null;
    direccion: string | null;
    telefono: string | null;
    grupo_sanguineo: string | null;
    eps: string | null;
    dificultad_aprendizaje: boolean | null;
    dificultad_aprendizaje_desc: string | null;
    diagnostico_salud: boolean | null;
    diagnostico_salud_desc: string | null;
    alergias: boolean | null;
    alergias_desc: string | null;
    nombre_madre: string | null;
    telefono_madre: string | null;
    ocupacion_madre: string | null;
    nombre_padre: string | null;
    telefono_padre: string | null;
    ocupacion_padre: string | null;
    convive_con: string | null;
    numero_hermanos: number | null;
    lugar_que_ocupa_familia: string | null;
    acudiente: string | null;
    telefono_acudiente: string | null;
    foto_url: string | null;
}

interface PeriodoItem {
    id: number;
    nombre: string;
    numero: number;
    anio: number;
    estado: string;
}

interface ObservadorItem {
    id: number;
    curso: string | null;
    periodo: string | null;
    director: string | null;
    fecha_realizacion: string | null;
    resumen_general: string | null;
    fortalezas: string | null;
    dificultades: string | null;
    compromisos: string | null;
    ficha?: {
        social_afectivo?: string;
        comunicacion_norma?: string;
        conductual_academico?: string;
        afinidad_plan_mejora?: string;
        compromiso_detalle?: string;
    } | null;
    estado: 'borrador' | 'completo';
    updated_at: string | null;
}

interface ComentarioItem {
    id: number;
    fecha: string | null;
    materia: string;
    profesor: string;
    tipo: 'positiva' | 'negativa' | string;
    categoria: string | null;
    descripcion: string;
}

interface HistorialItem {
    id: number;
    periodo_id: number;
    periodo: string | null;
    anio: number | null;
    curso: string | null;
    director: string | null;
    estado: 'borrador' | 'completo';
    fecha_realizacion: string | null;
    updated_at: string | null;
}

interface Props {
    padre: {
        nombre: string;
    };
    hijos: HijoOption[];
    hijo: HijoData | null;
    periodos: PeriodoItem[];
    periodoSeleccionadoId: number | null;
    stats: {
        total: number;
        positivas: number;
        negativas: number;
    };
    observador: ObservadorItem | null;
    boletinObservacion: string | null;
    comentarios: ComentarioItem[];
    historial: HistorialItem[];
}

const safeText = (value?: string | number | null) => {
    if (value === null || value === undefined) return 'No registrado';
    const s = String(value).trim();
    return s === '' ? 'No registrado' : s;
};

const boolToLabel = (value?: boolean | null) => {
    if (value === null || value === undefined) return 'No registrado';
    return value ? 'Si' : 'No';
};

const toDate = (value?: string | null) => {
    if (!value) return 'No registrado';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('es-CO');
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
    doc.setFontSize(16);
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
    doc.text('OBSERVADOR ACADEMICO INTEGRAL', TEXT_CX, 54.6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.3);
    doc.text(`${rightTop}  ·  ${rightBottom}`, TEXT_CX, 58.2, { align: 'center' });

    doc.setTextColor(30, 41, 59);
};

export default function Observador({ padre, hijos, hijo, periodos, periodoSeleccionadoId, stats, observador, boletinObservacion, comentarios, historial }: Props) {
    const [filtroTipo, setFiltroTipo] = useState<'todos' | 'positiva' | 'negativa'>('todos');
    const [busqueda, setBusqueda] = useState('');

    const periodoSel = useMemo(
        () => periodos.find((p) => p.id === periodoSeleccionadoId) ?? null,
        [periodos, periodoSeleccionadoId],
    );

    const comentariosFiltrados = useMemo(() => {
        return comentarios.filter((item) => {
            const matchTipo = filtroTipo === 'todos' || item.tipo === filtroTipo;
            const q = busqueda.trim().toLowerCase();
            const matchBusqueda =
                q === '' ||
                item.materia.toLowerCase().includes(q) ||
                item.profesor.toLowerCase().includes(q) ||
                (item.categoria ?? '').toLowerCase().includes(q) ||
                item.descripcion.toLowerCase().includes(q);
            return matchTipo && matchBusqueda;
        });
    }, [comentarios, filtroTipo, busqueda]);

    const onFiltersChange = (nextHijoId?: number, nextPeriodoId?: number) => {
        if (!hijo) return;
        router.get(
            '/padre/observador',
            {
                hijo_id: nextHijoId ?? hijo.id,
                periodo_id: nextPeriodoId ?? periodoSeleccionadoId,
            },
            { preserveState: true, replace: true },
        );
    };

    const exportarPdf = useCallback(async () => {
        if (!hijo) return;

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const W = 210;
        const H = 297;
        const M = 12;
        const logoHeader = await cargarLogoObservador();
        const generadoEn = new Date().toLocaleString('es-CO');
        const commentsForPdf = comentarios.length > 0 ? comentarios : comentariosFiltrados;

        let y = 66;

        const drawHeader = () => {
            dibujarEncabezadoObservador(
                doc,
                logoHeader,
                `Generado: ${generadoEn}`,
                `Periodo: ${periodoSel?.nombre ?? 'No definido'}`,
            );
            y = 66;
        };

        const ensureSpace = (needed: number) => {
            if (y + needed > H - 16) {
                doc.addPage();
                drawHeader();
            }
        };

        drawHeader();

        const foto = await cargarImagen(hijo.foto_url);
        if (foto) {
            const format = foto.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.addImage(foto, format, W - 46, y, 32, 38);
        } else {
            doc.setDrawColor(203, 213, 225);
            doc.rect(W - 46, y, 32, 38);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text('Sin foto', W - 30, y + 20, { align: 'center' });
            doc.setTextColor(30, 41, 59);
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('Informacion del estudiante', M, y + 4);

        autoTable(doc, {
            startY: y + 7,
            margin: { left: M, right: 50 },
            theme: 'grid',
            head: [['Campo', 'Valor']],
            body: [
                ['Nombre completo', safeText(hijo.nombre)],
                ['Documento', safeText(hijo.documento)],
                ['Fecha de nacimiento', toDate(hijo.fecha_nacimiento)],
                ['Lugar de nacimiento', safeText(hijo.lugar_nacimiento)],
                ['Direccion', safeText(hijo.direccion)],
                ['Telefono', safeText(hijo.telefono)],
                ['Curso actual', `${safeText(hijo.grado)} ${safeText(hijo.seccion)}`],
                ['Director de grupo', safeText(hijo.director_grupo)],
                ['Acudiente', safeText(hijo.acudiente)],
                ['Telefono acudiente', safeText(hijo.telefono_acudiente)],
                ['Grupo sanguineo', safeText(hijo.grupo_sanguineo)],
                ['EPS', safeText(hijo.eps)],
                ['Dificultad de aprendizaje', boolToLabel(hijo.dificultad_aprendizaje)],
                ['Detalle dificultad', safeText(hijo.dificultad_aprendizaje_desc)],
                ['Diagnostico de salud', boolToLabel(hijo.diagnostico_salud)],
                ['Detalle diagnostico', safeText(hijo.diagnostico_salud_desc)],
                ['Alergias', boolToLabel(hijo.alergias)],
                ['Detalle alergias', safeText(hijo.alergias_desc)],
                ['Nombre madre', safeText(hijo.nombre_madre)],
                ['Telefono madre', safeText(hijo.telefono_madre)],
                ['Ocupacion madre', safeText(hijo.ocupacion_madre)],
                ['Nombre padre', safeText(hijo.nombre_padre)],
                ['Telefono padre', safeText(hijo.telefono_padre)],
                ['Ocupacion padre', safeText(hijo.ocupacion_padre)],
                ['Convive con', safeText(hijo.convive_con)],
                ['Numero de hermanos', safeText(hijo.numero_hermanos)],
                ['Lugar en la familia', safeText(hijo.lugar_que_ocupa_familia)],
            ],
            styles: {
                fontSize: 8,
                cellPadding: 1.8,
                textColor: [30, 41, 59],
            },
            headStyles: {
                fillColor: [41, 53, 119],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            columnStyles: {
                0: { cellWidth: 46, fontStyle: 'bold' },
                1: { cellWidth: 102 },
            },
        });

        y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? (y + 10)) + 6;

        ensureSpace(22);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('Observador integral del periodo', M, y);
        y += 4;

        if (observador) {
            autoTable(doc, {
                startY: y,
                margin: { left: M, right: M },
                theme: 'grid',
                head: [['Estado', 'Curso', 'Director', 'Fecha de realizacion']],
                body: [[
                    observador.estado === 'completo' ? 'Completo' : 'Borrador',
                    safeText(observador.curso),
                    safeText(observador.director),
                    toDate(observador.fecha_realizacion),
                ]],
                styles: { fontSize: 8, cellPadding: 2, textColor: [30, 41, 59] },
                headStyles: { fillColor: [41, 53, 119], textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 24 },
                    1: { cellWidth: 48 },
                    2: { cellWidth: 62 },
                    3: { cellWidth: 44 },
                },
            });

            y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 4;

            autoTable(doc, {
                startY: y,
                margin: { left: M, right: M },
                theme: 'grid',
                head: [['Social y afectivo', 'Comunicacion y norma']],
                body: [[
                    safeText(observador.ficha?.social_afectivo),
                    safeText(observador.ficha?.comunicacion_norma),
                ]],
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 93 },
                    1: { cellWidth: 93 },
                },
            });

            y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 3;

            autoTable(doc, {
                startY: y,
                margin: { left: M, right: M },
                theme: 'grid',
                head: [['Conductual y academico', 'Afinidad y plan de mejora', 'Compromiso']],
                body: [[
                    safeText(observador.ficha?.conductual_academico),
                    safeText(observador.ficha?.afinidad_plan_mejora),
                    safeText(observador.ficha?.compromiso_detalle),
                ]],
                styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
                headStyles: { fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 62 },
                    1: { cellWidth: 62 },
                    2: { cellWidth: 62 },
                },
            });

            y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 3;

            autoTable(doc, {
                startY: y,
                margin: { left: M, right: M },
                theme: 'grid',
                head: [['Fortalezas', 'Dificultades', 'Compromisos']],
                body: [[
                    safeText(observador.fortalezas),
                    safeText(observador.dificultades),
                    safeText(observador.compromisos),
                ]],
                styles: { fontSize: 8.2, cellPadding: 2, overflow: 'linebreak', minCellHeight: 24 },
                headStyles: { fillColor: [22, 55, 148], textColor: [255, 255, 255], fontStyle: 'bold' },
                columnStyles: {
                    0: { cellWidth: 62 },
                    1: { cellWidth: 62 },
                    2: { cellWidth: 62 },
                },
            });

            y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 5;

            if (observador.resumen_general && observador.resumen_general.trim() !== '') {
                ensureSpace(22);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9.5);
                doc.text('Resumen general', M, y);
                y += 4;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.5);
                const resumenLines = doc.splitTextToSize(observador.resumen_general, W - M * 2);
                const altoResumen = Math.max(12, resumenLines.length * 4 + 4);
                doc.setDrawColor(203, 213, 225);
                doc.rect(M, y - 1.5, W - M * 2, altoResumen);
                doc.text(resumenLines, M + 2, y + 3);
                y += altoResumen + 3;
            }
        } else {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text('No hay observador integral diligenciado para este periodo.', M, y + 4);
            y += 10;
        }

        if (boletinObservacion && boletinObservacion.trim() !== '') {
            ensureSpace(20);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9.5);
            doc.text('Observacion del boletin', M, y);
            y += 4;
            const boletinLines = doc.splitTextToSize(boletinObservacion, W - M * 2 - 4);
            const hBoletin = Math.max(12, boletinLines.length * 4 + 4);
            doc.setDrawColor(203, 213, 225);
            doc.rect(M, y - 1.5, W - M * 2, hBoletin);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.text(boletinLines, M + 2, y + 3);
            y += hBoletin + 4;
        }

        ensureSpace(20);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('Comentarios docentes del periodo', M, y);
        y += 3;

        autoTable(doc, {
            startY: y,
            margin: { left: M, right: M },
            theme: 'grid',
            head: [['Fecha', 'Materia', 'Profesor', 'Tipo', 'Categoria', 'Comentario']],
            body: commentsForPdf.length > 0
                ? commentsForPdf.map((c) => [
                    safeText(c.fecha),
                    safeText(c.materia),
                    safeText(c.profesor),
                    safeText(c.tipo),
                    safeText(c.categoria),
                    safeText(c.descripcion),
                ])
                : [['Sin registros', '-', '-', '-', '-', 'No hay comentarios para este periodo.']],
            styles: {
                fontSize: 7.6,
                cellPadding: 1.8,
                overflow: 'linebreak',
                textColor: [30, 41, 59],
            },
            headStyles: {
                fillColor: [41, 53, 119],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            columnStyles: {
                0: { cellWidth: 16 },
                1: { cellWidth: 26 },
                2: { cellWidth: 30 },
                3: { cellWidth: 14 },
                4: { cellWidth: 24 },
                5: { cellWidth: 78 },
             },
         });

        const pages = doc.getNumberOfPages();
        for (let i = 1; i <= pages; i += 1) {
            doc.setPage(i);
            doc.setDrawColor(226, 232, 240);
            doc.line(M, H - 9.5, W - M, H - 9.5);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(`Pagina ${i} de ${pages}`, W - M, H - 5.5, { align: 'right' });
            doc.text('Documento de seguimiento academico para acudientes', M, H - 5.5);
        }

        const periodoNombre = (periodoSel?.nombre ?? 'periodo').replace(/\s+/g, '_');
        const estudianteNombre = hijo.nombre.replace(/\s+/g, '_');
        doc.save(`Observador_${estudianteNombre}_${periodoNombre}.pdf`);
    }, [hijo, comentarios, comentariosFiltrados, observador, boletinObservacion, periodoSel]);

    return (
        <SidebarLayout menuItems={padreMenuItems} userInfo={{ name: padre.nombre, role: 'Padre' }}>
            <Head title="Observador" />

            <div className="space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {!hijo ? (
                    <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
                        <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Observador Academico</h1>
                        <p className="text-gray-500 mt-2">No hay hijos vinculados a este acudiente.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Observador Academico</h1>
                                <p className="text-gray-600">
                                    {hijo.nombre} · {hijo.grado} Seccion {hijo.seccion}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2">
                                {hijos.length > 1 && (
                                    <div>
                                        <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Cambiar de hijo/a</p>
                                        <select
                                            value={hijo.id}
                                            onChange={(e) => onFiltersChange(Number(e.target.value), undefined)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg min-w-[220px] focus:ring-2 focus:ring-[#293577] focus:border-transparent"
                                        >
                                            {hijos.map((h) => <option key={h.id} value={h.id}>{h.nombre}</option>)}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-1">Periodo</p>
                                    <select
                                        value={periodoSeleccionadoId ?? ''}
                                        onChange={(e) => onFiltersChange(undefined, Number(e.target.value))}
                                        className="px-4 py-2 border border-gray-300 rounded-lg min-w-[220px] focus:ring-2 focus:ring-[#293577] focus:border-transparent"
                                    >
                                        {periodos.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.nombre}{p.estado === 'activo' ? ' (Actual)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Comentarios</p>
                                <p className="text-2xl font-extrabold text-[#293577] mt-1">{stats.total}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-green-100 p-4 text-center">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Positivas</p>
                                <p className="text-2xl font-extrabold text-green-600 mt-1">{stats.positivas}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-red-100 p-4 text-center">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Negativas</p>
                                <p className="text-2xl font-extrabold text-red-600 mt-1">{stats.negativas}</p>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Estado observador</p>
                                <p className={`text-sm font-extrabold mt-2 ${observador?.estado === 'completo' ? 'text-green-600' : 'text-amber-600'}`}>
                                    {observador ? (observador.estado === 'completo' ? 'Completo' : 'Borrador') : 'Sin registro'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-extrabold text-gray-800">Observador integral del periodo</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Incluye ficha integral, fortalezas, dificultades, compromisos y comentarios docentes.
                                    </p>
                                </div>
                                <button
                                    onClick={exportarPdf}
                                    className="px-4 py-2 rounded-lg bg-[#293577] text-white text-sm font-semibold hover:bg-[#181b49] transition-colors w-fit"
                                >
                                    Generar PDF para acudiente
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Estudiante</p>
                                    <p className="text-sm font-semibold text-gray-800 mt-1">{hijo.nombre}</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Director de grupo</p>
                                    <p className="text-sm font-semibold text-gray-800 mt-1">{safeText(hijo.director_grupo)}</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Curso</p>
                                    <p className="text-sm font-semibold text-gray-800 mt-1">{safeText(hijo.curso)}</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Fecha de realizacion</p>
                                    <p className="text-sm font-semibold text-gray-800 mt-1">{toDate(observador?.fecha_realizacion)}</p>
                                </div>
                            </div>

                            {!observador ? (
                                <div className="rounded-lg border border-dashed border-gray-300 p-5 text-sm text-gray-500">
                                    Para este periodo aun no hay observador integral diligenciado por direccion de grupo. Los comentarios docentes si aparecen abajo.
                                </div>
                            ) : (
                                <>
                                    {(observador.resumen_general ?? '').trim() !== '' && (
                                        <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
                                            <p className="text-xs uppercase tracking-wide text-blue-700 font-semibold">Resumen general</p>
                                            <p className="text-sm text-blue-900 mt-1 whitespace-pre-wrap">{observador.resumen_general}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                        <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4">
                                            <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Fortalezas</p>
                                            <p className="text-sm text-emerald-900 mt-1 whitespace-pre-wrap">{safeText(observador.fortalezas)}</p>
                                        </div>
                                        <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4">
                                            <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">Dificultades</p>
                                            <p className="text-sm text-amber-900 mt-1 whitespace-pre-wrap">{safeText(observador.dificultades)}</p>
                                        </div>
                                        <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
                                            <p className="text-xs uppercase tracking-wide text-indigo-700 font-semibold">Compromisos</p>
                                            <p className="text-sm text-indigo-900 mt-1 whitespace-pre-wrap">{safeText(observador.compromisos)}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <p className="text-xs text-gray-500 font-semibold">Social y afectivo</p>
                                            <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{safeText(observador.ficha?.social_afectivo)}</p>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <p className="text-xs text-gray-500 font-semibold">Comunicacion y norma</p>
                                            <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{safeText(observador.ficha?.comunicacion_norma)}</p>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <p className="text-xs text-gray-500 font-semibold">Conductual y academico</p>
                                            <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{safeText(observador.ficha?.conductual_academico)}</p>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                                            <p className="text-xs text-gray-500 font-semibold">Afinidad y plan de mejora</p>
                                            <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{safeText(observador.ficha?.afinidad_plan_mejora)}</p>
                                        </div>
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 md:col-span-2">
                                            <p className="text-xs text-gray-500 font-semibold">Compromiso (detalle)</p>
                                            <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{safeText(observador.ficha?.compromiso_detalle)}</p>
                                        </div>
                                    </div>
                                </>
                            )}

                            {(boletinObservacion ?? '').trim() !== '' && (
                                <div className="rounded-lg border border-purple-100 bg-purple-50/60 p-4">
                                    <p className="text-xs uppercase tracking-wide text-purple-700 font-semibold">Observacion del boletin</p>
                                    <p className="text-sm text-purple-900 mt-1 whitespace-pre-wrap">{boletinObservacion}</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <h3 className="font-semibold text-gray-800">Comentarios docentes del periodo</h3>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { key: 'todos', label: 'Todos' },
                                        { key: 'positiva', label: 'Positivas' },
                                        { key: 'negativa', label: 'Negativas' },
                                    ].map((opt) => (
                                        <button
                                            key={opt.key}
                                            onClick={() => setFiltroTipo(opt.key as 'todos' | 'positiva' | 'negativa')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                                                filtroTipo === opt.key
                                                    ? 'bg-[#293577] text-white'
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 border-b border-gray-100">
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    placeholder="Buscar por materia, profesor, categoria o comentario..."
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-[#293577]"
                                />
                            </div>

                            {comentariosFiltrados.length === 0 ? (
                                <div className="p-8 text-center text-sm text-gray-500">No hay comentarios para los filtros seleccionados.</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {comentariosFiltrados.map((item) => (
                                        <div key={item.id} className="p-4 hover:bg-gray-50">
                                            <div className="flex items-start gap-3">
                                                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                                    item.tipo === 'positiva' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {item.tipo === 'positiva' ? '✓' : '!'}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="text-sm font-semibold text-gray-800">{item.materia}</p>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                            item.tipo === 'positiva' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                            {item.tipo}
                                                        </span>
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                                                            {safeText(item.categoria)}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{item.descripcion}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{item.profesor} · {toDate(item.fecha)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                <h3 className="font-semibold text-gray-800">Historial de observadores generados</h3>
                            </div>
                            {historial.length === 0 ? (
                                <div className="p-6 text-sm text-gray-500">Aun no hay observadores de periodo registrados.</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {historial.map((item) => (
                                        <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {safeText(item.periodo)} {item.anio ? `· ${item.anio}` : ''}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    Curso: {safeText(item.curso)} · Director: {safeText(item.director)}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    Fecha realizacion: {toDate(item.fecha_realizacion)} · Actualizado: {safeText(item.updated_at)}
                                                </p>
                                            </div>
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                                item.estado === 'completo'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {item.estado === 'completo' ? 'Completo' : 'Borrador'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </SidebarLayout>
    );
}
