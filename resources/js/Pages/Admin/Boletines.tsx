import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/* ═══════════════════════════ TYPES ═══════════════════════════ */
interface Periodo { id: number; nombre: string; anio: number; activo: boolean; }
interface Curso   { id: number; nombre: string; nivel: string; sede_id: number | null; }
interface Sede    { id: number; nombre: string; }

interface NotaBoletin {
    materia: string;
    ih: number;
    indicadores: string[];
    definitiva: number | null;
    p1?: number | null;
    p2?: number | null;
    p3?: number | null;
    p4?: number | null;
}

interface Boletin {
    id: number;
    estudiante_id: number;
    estudiante: string;
    periodo_id: number;
    periodo: string;
    periodo_numero: number;
    curso_id: number;
    curso: string;
    nivel: string;
    grado: string;
    jornada: string;
    anio: number;
    total_periodos: number;
    director_grupo: string;
    promedio: number;
    puesto: number | null;
    observacion: string | null;
    estado: 'borrador' | 'generado' | 'entregado';
    fecha_generacion: string;
    padres: { id: number; name: string }[];
    notas: NotaBoletin[];
    completitud?: {
        estado: 'completo' | 'incompleto';
        notas_completas: boolean;
        materias_total: number;
        materias_con_nota: number;
        tiene_observacion_director: boolean;
        comentarios_docentes_count: number;
        comentarios_asistencia_count: number;
        mensajes: string[];
    };
}

interface MateriaDetalle {
    materia: string;
    promedio: number;
    aprobados: number;
    reprobados: number;
    total: number;
}

interface EstudianteDetalle {
    nombre: string;
    promedio: number;
    aprobadas: number;
    reprobadas: number;
    total: number;
}

interface ResumenNotas {
    curso_id: number; nivel: string; curso: string;
    totalEstudiantes: number; promedio: number;
    aprobados: number; reprobados: number;
    mejorMateria: string; peorMateria: string;
    materias: MateriaDetalle[];
    estudiantes: EstudianteDetalle[];
}

interface Props {
    boletines: Boletin[];
    resumenNotas: ResumenNotas[];
    periodos: Periodo[];
    cursos: Curso[];
    niveles: string[];
    sedes: Sede[];
    periodoActivo: { id: number; nombre: string } | null;
}

/* ═══════════════════════════ HELPERS ═══════════════════════════ */
const nivelesConfig: Record<string, { label: string; color: string; chipActive: string }> = {
    prejardin:    { label: 'Pre-Jardín',   color: 'bg-pink-100 text-pink-700',   chipActive: 'bg-pink-500' },
    primaria:     { label: 'Primaria',     color: 'bg-blue-100 text-blue-700',       chipActive: 'bg-blue-500' },
    bachillerato: { label: 'Bachillerato', color: 'bg-emerald-100 text-emerald-700', chipActive: 'bg-emerald-500' },
};

const estadosConfig: Record<string, { label: string; color: string }> = {
    borrador:  { label: 'Borrador',  color: 'bg-yellow-100 text-yellow-700' },
    generado:  { label: 'Generado',  color: 'bg-green-100 text-green-700'   },
    entregado: { label: 'Entregado', color: 'bg-blue-100 text-blue-700'     },
};

function EstadoIcon({ estado, className = 'w-3.5 h-3.5 flex-shrink-0' }: { estado: string; className?: string }) {
    if (estado === 'borrador')
        return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
    if (estado === 'generado')
        return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    if (estado === 'entregado')
        return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    return null;
}

const getNivelBadge      = (n: string) => nivelesConfig[n]?.color    ?? 'bg-gray-100 text-gray-700';
const getNivelLabel      = (n: string) => nivelesConfig[n]?.label     ?? n;
const getNivelChipActive = (n: string) => nivelesConfig[n]?.chipActive ?? 'bg-gray-500';
const promedioColor      = (p: number) => p >= 4 ? 'text-green-600' : p >= 3 ? 'text-yellow-600' : 'text-red-500';

/* ═══════════════════════════ INSTITUTION CONSTANTS ═══════════════════════════ */
const LOGO_CANDIDATES_BOL = [
    '/logo-certificados.png', '/logo-certificados.jpg', '/logo-certificados.jpeg',
    '/images/logo-certificados.png', '/images/logo-certificados.jpg',
    '/img/logo-certificados.png', '/certificados-logo.png',
];

const cargarImagenBoletin = async (src: string, opacidad = 1, maxPx = 400): Promise<string | null> => {
    const url = src.startsWith('http') ? src : window.location.origin + src;
    try {
        const resp = await fetch(url, { credentials: 'same-origin' });
        if (!resp.ok) return null;
        const blob = await resp.blob();
        const base64: string = await new Promise((res, rej) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result as string);
            reader.onerror   = () => rej(new Error('err'));
            reader.readAsDataURL(blob);
        });
        return new Promise((res) => {
            const img = new Image();
            img.onload = () => {
                const origW = img.naturalWidth || img.width || maxPx;
                const origH = img.naturalHeight || img.height || maxPx;
                const scale = Math.min(1, maxPx / Math.max(origW, origH));
                const cW = Math.round(origW * scale), cH = Math.round(origH * scale);
                const canvas = document.createElement('canvas');
                canvas.width = cW; canvas.height = cH;
                const ctx = canvas.getContext('2d');
                if (!ctx) { res(null); return; }
                if (opacidad >= 1) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, cW, cH);
                }
                ctx.globalAlpha = opacidad;
                ctx.drawImage(img, 0, 0, cW, cH);
                res(opacidad >= 1 ? canvas.toDataURL('image/jpeg', 0.92) : canvas.toDataURL('image/png'));
            };
            img.onerror = () => res(null);
            img.src = base64;
        });
    } catch { return null; }
};

const cargarLogoBoletin = async (opacidad = 1, maxPx = 400): Promise<string | null> => {
    for (const c of LOGO_CANDIDATES_BOL) {
        const r = await cargarImagenBoletin(c, opacidad, maxPx);
        if (r) return r;
    }
    return null;
};

/* ═══════════════════════════ PDF HELPERS ═══════════════════════════ */
const getDescriptor = (nota: number | null): string => {
    if (nota === null) return '';
    if (nota >= 4.5) return 'SUPERIOR';
    if (nota >= 4.0) return 'ALTO';
    if (nota >= 3.0) return 'BÁSICO';
    return 'BAJO';
};

/* ─── PDF builder for one boletin page ─── */
async function dibujarBoletinPagina(doc: jsPDF, b: Boletin, logoHeader: string | null, logoWatermark: string | null) {
    const W = 210;
    const LOGO_X = 7.5, LOGO_Y = 2.5, LOGO_W = 38, LOGO_H = 41;
    const TRIANG_MAX = 50;
    const TRIANG_MID = 33;
    const TRIANG_MIN = 16;
    const TEXT_RIGHT = W - TRIANG_MAX - 3;
    const TEXT_CX = W / 2;

    // ── Fondo blanco ──
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, 297, 'F');

    // ── Triángulos apilados (idénticos a Certificados) ──
    doc.setFillColor(188, 214, 242);
    doc.triangle(W - TRIANG_MAX, 0, W, 0, W, TRIANG_MAX, 'F');
    doc.setFillColor(80, 130, 205);
    doc.triangle(W - TRIANG_MID, 0, W, 0, W, TRIANG_MID, 'F');
    doc.setFillColor(22, 55, 148);
    doc.triangle(W - TRIANG_MIN, 0, W, 0, W, TRIANG_MIN, 'F');

    // ── Logo ──
    if (logoHeader) {
        doc.addImage(logoHeader, 'JPEG', LOGO_X, LOGO_Y, LOGO_W, LOGO_H);
    } else {
        const cx = LOGO_X + LOGO_W / 2, cy = LOGO_Y + LOGO_H / 2 - 2, r = LOGO_W / 2 - 1;
        doc.setDrawColor(10, 35, 90); doc.setLineWidth(1.2);
        doc.circle(cx, cy, r, 'S');
        doc.setLineWidth(0.6); doc.circle(cx, cy, r - 3, 'S');
        doc.setFont('times', 'bold'); doc.setFontSize(14);
        doc.setTextColor(10, 35, 90);
        doc.text('I.P', cx, cy + 2, { align: 'center' });
    }

    // ── Nombre institución ──
    doc.setTextColor(10, 35, 90);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(19);
    doc.text('INSTITUTO PEDAGÓGICO', TEXT_CX, 13, { align: 'center' });
    doc.setFontSize(17);
    doc.text('EMPRENDEDORES DEL SABER', TEXT_CX, 23, { align: 'center' });
    doc.setTextColor(25, 25, 25);
    doc.setFont('times', 'italic'); doc.setFontSize(9);
    doc.text('Ser, Saber y Emprender', TEXT_CX, 30, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
    doc.text('Aprobado por Resolución No 3769 del 23 - 05 - 2023', TEXT_CX, 36, { align: 'center' });
    doc.text('DANE 313001800093  –  NIT 73143410 - 6', TEXT_CX, 41, { align: 'center' });

    // ── Barra divisora navy ──
    const barX = LOGO_X + LOGO_W + 7;
    const barW = Math.max(86, TEXT_RIGHT - barX - 1);
    doc.setFillColor(10, 35, 90);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.35);
    doc.rect(barX, 46, barW, 2.1, 'FD');

    // ── Título del informe ──
    doc.setTextColor(10, 35, 90);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('INFORME ACADEMICO Y DISCIPLINARIO', W / 2, 57, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`AÑO LECTIVO ${b.anio}`, W / 2, 65, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.text(b.periodo, W / 2, 72, { align: 'center' });

    // ── Fila estudiante / grado / jornada ──
    const tableX = 8;
    const tableW = 194;
    const infoRowH = 8;
    const fY = 76;
    doc.setFillColor(10, 35, 90);
    doc.setDrawColor(10, 35, 90);
    doc.setLineWidth(0.35);
    doc.rect(tableX, fY, tableW, infoRowH, 'FD');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text(`ESTUDIANTE: ${b.estudiante.toUpperCase()}`, 11, fY + 5.3);
    doc.text(`GRADO: ${b.grado.toUpperCase()}`, 126, fY + 5.3);
    doc.text(`JORNADA: ${b.jornada.toUpperCase()}`, 170, fY + 5.3);

    // ── Fila valoración ──
    const vY = fY + infoRowH;
    const valorRowH = 6.5;
    doc.setFillColor(31, 58, 131);
    doc.setDrawColor(10, 35, 90);
    doc.setLineWidth(0.35);
    doc.rect(tableX, vY, tableW, valorRowH, 'FD');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
    doc.text('<VALORACION: LOGROS/DIFICULTADES>', W / 2, vY + 4.5, { align: 'center' });

    // ── Tabla de notas ──
    const totalPer = Math.min(b.total_periodos, 4);
    const perCols = Array.from({ length: totalPer }, (_, i) => `${i + 1}P`);

    // Los anchos de columna están ajustados al espacio disponible (194mm total)
    // AREA=30, INDICADORES=55, períodos=11 c/u, NOTA FINAL=14, DESCRIPTORES=30
    const notaW = 11;
    const areaW = 30;
    const finalW = 15;
    const descW  = 31;
    const indicW = 194 - areaW - (notaW * totalPer) - finalW - descW;

    const head = [
        [
            { content: 'AREA', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const, fontStyle: 'bold' as const } },
            { content: 'INDICADORES DE DESEMPEÑOS', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const, fontStyle: 'bold' as const } },
            { content: 'NOTA', colSpan: totalPer + 1, styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
            { content: 'DESCRIPTORES DE DESEMPEÑO', rowSpan: 2, styles: { valign: 'middle' as const, halign: 'center' as const, fontStyle: 'bold' as const } },
        ],
        perCols.map(p => ({ content: p, styles: { halign: 'center' as const, fontStyle: 'bold' as const } })).concat([
            { content: 'NOTA FINAL', styles: { halign: 'center' as const, fontStyle: 'bold' as const } },
        ]) as never[],
    ];

    // Watermark detrás de la tabla
    if (logoWatermark) {
        doc.addImage(logoWatermark, 'PNG', 47, 110, 116, 116);
    }

    const body = b.notas.map(n => {
        const areaText = `${n.materia.toUpperCase()}${n.ih ? `\n${n.ih} hora${n.ih !== 1 ? 's' : ''}` : ''}`;
        const indicText = n.indicadores.length > 0
            ? n.indicadores.map((ind, idx) => `${idx + 1}. ${ind}`).join('\n')
            : '-';
        const notasP = Array.from({ length: totalPer }, (_, i) => {
            const val = (n as unknown as Record<string, unknown>)[`p${i + 1}`] as number | null | undefined;
            return (val !== null && val !== undefined) ? String(val.toFixed(1)) : '-';
        });
        const definitiva = n.definitiva !== null ? String(n.definitiva.toFixed(1)) : '-';
        const descriptor = getDescriptor(n.definitiva);
        return [areaText, indicText, ...notasP, definitiva, descriptor];
    });

    if (body.length === 0) {
        body.push(['Sin materias', 'Sin indicadores registrados', ...Array(totalPer).fill('-'), '-', '-']);
    }

    const tableStartY = vY + valorRowH;

    autoTable(doc, {
        startY: tableStartY,
        margin: { left: tableX, right: tableX },
        head,
        body,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 7.5,
            cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
            textColor: [15, 15, 15],
            lineColor: [10, 35, 90],
            lineWidth: 0.35,
            valign: 'middle',
            overflow: 'linebreak',
        },
        headStyles: {
            fillColor: [10, 35, 90],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 7.5,
            halign: 'center',
        },
        alternateRowStyles: { fillColor: [243, 246, 255] },
        columnStyles: {
            0: { cellWidth: areaW, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: indicW, halign: 'left', fontSize: 6.8 },
            ...Object.fromEntries(
                Array.from({ length: totalPer }, (_, i) => [i + 2, { cellWidth: notaW, halign: 'center' as const, fontStyle: 'bold' as const }])
            ),
            [totalPer + 2]: { cellWidth: finalW, halign: 'center', fontStyle: 'bold', fontSize: 8.5 },
            [totalPer + 3]: { cellWidth: descW, halign: 'center', fontStyle: 'bold', fontSize: 7.5 },
        },
        didParseCell: (data) => {
            if (data.section === 'body') {
                const descIdx = totalPer + 3;
                const finalIdx = totalPer + 2;
                if (data.column.index === descIdx) {
                    const v = data.cell.raw as string;
                    if (v === 'SUPERIOR')      { data.cell.styles.textColor = [6, 115, 6]; data.cell.styles.fillColor = [220, 248, 220]; }
                    else if (v === 'ALTO')     { data.cell.styles.textColor = [0, 48, 163]; data.cell.styles.fillColor = [218, 230, 255]; }
                    else if (v === 'BÁSICO')   { data.cell.styles.textColor = [140, 90, 0]; data.cell.styles.fillColor = [255, 244, 210]; }
                    else if (v === 'BAJO')     { data.cell.styles.textColor = [160, 0, 0]; data.cell.styles.fillColor = [255, 224, 224]; }
                }
                if (data.column.index === finalIdx) {
                    const v = parseFloat(data.cell.raw as string);
                    if (!isNaN(v)) {
                        if (v >= 4.5)      { data.cell.styles.textColor = [6, 115, 6]; data.cell.styles.fillColor = [220, 248, 220]; }
                        else if (v >= 4.0) { data.cell.styles.textColor = [0, 48, 163]; data.cell.styles.fillColor = [218, 230, 255]; }
                        else if (v >= 3.0) { data.cell.styles.textColor = [140, 90, 0]; data.cell.styles.fillColor = [255, 244, 210]; }
                        else               { data.cell.styles.textColor = [160, 0, 0]; data.cell.styles.fillColor = [255, 224, 224]; }
                    }
                }
                // Columna de período actual → negrita + fondo suave
                const perActualIdx = (b.periodo_numero <= totalPer) ? (b.periodo_numero + 1) : -1;
                if (data.column.index === perActualIdx) {
                    data.cell.styles.fillColor = [235, 240, 255];
                    data.cell.styles.fontStyle = 'bold';
                }
            }
            // Cabecera: subrayar la columna NOTA FINAL
            if (data.section === 'head' && data.column.index === totalPer + 2 && data.row.index === 1) {
                data.cell.styles.fillColor = [22, 55, 148];
            }
        },
    });

    const lastY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 210;
    let curY = lastY + 5;

    // ── Descriptores de desempeño ──
    if (curY + 32 > 285) { doc.addPage(); curY = 10; }

    const descItems = [
        { nivel: 'SUPERIOR (4.5 A 5.0):', color: [6, 115, 6] as [number,number,number], bg: [220, 248, 220] as [number,number,number], text: 'Participa activamente en el desempeño, manejando adecuadamente los conceptos aprendidos y los relaciona con experiencias vividas, adoptando una posición crítica y de aplicación para mejorar su vida y su entorno.' },
        { nivel: 'ALTO (4.0 A 4.4):', color: [0, 48, 163] as [number,number,number], bg: [218, 230, 255] as [number,number,number], text: 'Maneja y argumenta los conceptos aprendidos en clase, participando moderadamente en el desarrollo de las actividades en el aula y aplica lo aprendido en su vida.' },
        { nivel: 'BASICO (3.0 A 3.9):', color: [140, 90, 0] as [number,number,number], bg: [255, 244, 210] as [number,number,number], text: 'Manifiesta poco interés por aclarar las dudas sobre las temáticas trabajadas, mostrando poco interés por cumplir sus actividades escolares y extraescolares.' },
        { nivel: 'BAJO (1.0 A 2.9):', color: [160, 0, 0] as [number,number,number], bg: [255, 224, 224] as [number,number,number], text: 'Registra con poca eventualidad sus consultas y el desarrollo de las temáticas, evidenciando desinterés frente a sus compromisos.' },
    ];

    // Cabecera descriptores
    doc.setFillColor(10, 35, 90);
    doc.setDrawColor(10, 35, 90);
    doc.setLineWidth(0.35);
    doc.rect(8, curY, 194, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('DESCRIPTORES DE DESEMPEÑO', W / 2, curY + 4.2, { align: 'center' });
    curY += 6;

    for (const item of descItems) {
        const labelW = 38;
        const textW = 194 - labelW - 4;
        const wrappedText = doc.setFont('helvetica', 'normal').setFontSize(6.8).splitTextToSize(item.text, textW);
        const rowH = Math.max(7, wrappedText.length * 3.6 + 3);

        // Fondo nivel
        doc.setFillColor(...item.bg);
        doc.rect(8, curY, labelW, rowH, 'F');
        doc.setFillColor(250, 251, 255);
        doc.rect(8 + labelW, curY, 194 - labelW, rowH, 'F');
        // Borde
        doc.setDrawColor(10, 35, 90);
        doc.setLineWidth(0.3);
        doc.rect(8, curY, 194, rowH, 'S');
        doc.line(8 + labelW, curY, 8 + labelW, curY + rowH);
        // Texto nivel
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
        doc.setTextColor(...item.color);
        doc.text(item.nivel, 10, curY + rowH / 2 + 1, { baseline: 'middle' });
        // Texto descripción
        doc.setFont('helvetica', 'normal'); doc.setFontSize(6.8);
        doc.setTextColor(30, 30, 30);
        doc.text(wrappedText, 8 + labelW + 2, curY + rowH / 2 - (wrappedText.length - 1) * 1.8 + 0.5);
        curY += rowH;
    }
    curY += 4;

    // ── Promedio ──
    if (curY + 12 > 285) { doc.addPage(); curY = 10; }
    const promedioColor: [number,number,number] = b.promedio >= 4.5 ? [6,115,6] : b.promedio >= 4.0 ? [0,48,163] : b.promedio >= 3.0 ? [140,90,0] : [160,0,0];
    doc.setFillColor(245, 246, 252);
    doc.setDrawColor(10, 35, 90);
    doc.setLineWidth(0.35);
    doc.rect(8, curY, 194, 9, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 20);
    doc.text('PROMEDIO:', 13, curY + 6);
    doc.setTextColor(...promedioColor);
    doc.setFontSize(10.5);
    doc.text(b.promedio.toFixed(2), 45, curY + 6.2);
    doc.setFontSize(8);
    doc.setTextColor(20, 20, 20);
    doc.text(`(${getDescriptor(b.promedio)})`, 57, curY + 6);
    curY += 13;

    // ── Observaciones ──
    const obsTexto = b.observacion?.trim() || '';
    if (obsTexto && obsTexto !== 'Boletín generado automáticamente.') {
        if (curY + 18 > 285) { doc.addPage(); curY = 10; }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        doc.setTextColor(10, 35, 90);
        doc.text('OBSERVACIONES:', 8, curY + 5);
        doc.setDrawColor(10, 35, 90);
        doc.setLineWidth(0.35);
        const obsLines = doc.setFont('helvetica', 'normal').setFontSize(7.5).splitTextToSize(obsTexto, 186);
        const obsH = Math.max(11, obsLines.length * 4 + 8);
        doc.setFillColor(254, 252, 240);
        doc.rect(8, curY + 7, 194, obsH, 'FD');
        doc.setTextColor(40, 40, 40);
        doc.text(obsLines, 11, curY + 13);
        curY += obsH + 11;
    }

    // ── Firmas ──
    const sigY = Math.max(curY + 5, 252);
    if (sigY + 20 > 290) { doc.addPage(); }
    const actualSigY = sigY > 290 ? 255 : sigY;

    doc.setDrawColor(30, 30, 30); doc.setLineWidth(0.6);
    doc.line(22, actualSigY, 92, actualSigY);
    doc.line(118, actualSigY, 188, actualSigY);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.setTextColor(10, 10, 10);
    doc.text('INDIRA CANO ROMAN', 57, actualSigY - 2, { align: 'center' });
    doc.text(b.director_grupo.toUpperCase(), 153, actualSigY - 2, { align: 'center' });

    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    doc.text('Coordinadora', 57, actualSigY + 5, { align: 'center' });
    doc.text('Director(a) de Grupo', 153, actualSigY + 5, { align: 'center' });

    // ── Pie de página ──
    doc.setFillColor(10, 35, 90);
    doc.rect(0, 284, W, 13, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(
        `Documento generado el ${new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}  ·  Instituto Pedagógico Emprendedores del Saber`,
        W / 2, 292, { align: 'center' }
    );
}

/* ═══════════════════════════ COMPONENT ═══════════════════════════ */
export default function Boletines({ boletines, resumenNotas, periodos, cursos, niveles, sedes, periodoActivo }: Props) {
    const [activeTab, setActiveTab]           = useState<'boletines' | 'resumen'>('boletines');
    const [nivelSeleccionado, setNivelSel]    = useState('todos');
    const [sedeSel, setSedeSel]              = useState('todas');
    const [cursoSeleccionado, setCursoSel]    = useState('todos');
    const [periodoSeleccionado, setPeriodoSel]= useState(periodoActivo?.id.toString() ?? 'todos');
    const [busqueda, setBusqueda]             = useState('');
    const [estadoFiltro, setEstadoFiltro]     = useState('todos');
    const [hasLoaded, setHasLoaded]           = useState(false);
    const [showModal, setShowModal]           = useState(false);
    const [processing, setProcessing]         = useState(false);
    const [sendingNotif, setSendingNotif]     = useState<number | null>(null);
    const [updatingBoletinId, setUpdatingBoletinId] = useState<number | null>(null);
    const [validacionEstricta, setValidacionEstricta] = useState(false);
    const [detalleResumen, setDetalleResumen] = useState<ResumenNotas | null>(null);
    const [detalleTab, setDetalleTab]         = useState<'materias' | 'estudiantes'>('materias');

    const cursosDisponibles = useMemo(() => {
        let lista = sedeSel !== 'todas'
            ? cursos.filter(c => c.sede_id === Number(sedeSel))
            : cursos;
        if (nivelSeleccionado === 'todos') return lista;
        if (nivelSeleccionado === 'prejardin')
            return lista.filter(c => c.nivel === 'prejardin' || c.nivel === 'transicion' || c.nivel === 'preescolar');
        return lista.filter(c => c.nivel === nivelSeleccionado);
    }, [cursos, nivelSeleccionado, sedeSel]);

    const hayFiltros = nivelSeleccionado !== 'todos' || sedeSel !== 'todas' ||
                       cursoSeleccionado !== 'todos' || periodoSeleccionado !== 'todos' ||
                       busqueda !== '' || estadoFiltro !== 'todos';

    const boletinesFiltrados = useMemo(() => {
        if (!hasLoaded && !hayFiltros) return [];
        return boletines.filter(b => {
            const matchNivel   = nivelSeleccionado === 'todos'
                || (nivelSeleccionado === 'prejardin' ? (b.nivel === 'prejardin' || b.nivel === 'transicion' || b.nivel === 'preescolar') : b.nivel === nivelSeleccionado);
            const matchSede    = sedeSel === 'todas' || (() => {
                const curso = cursos.find(c => c.id === b.curso_id);
                return curso?.sede_id === Number(sedeSel);
            })();
            const matchCurso   = cursoSeleccionado === 'todos' || b.curso_id.toString() === cursoSeleccionado;
            const matchPeriodo = periodoSeleccionado === 'todos' || b.periodo_id.toString() === periodoSeleccionado;
            const matchEstado  = estadoFiltro === 'todos' || b.estado === estadoFiltro;
            const matchSearch  = busqueda === '' || b.estudiante.toLowerCase().includes(busqueda.toLowerCase());
            return matchNivel && matchSede && matchCurso && matchPeriodo && matchEstado && matchSearch;
        });
    }, [boletines, nivelSeleccionado, sedeSel, cursoSeleccionado, periodoSeleccionado, estadoFiltro, busqueda, hasLoaded, hayFiltros, cursos]);

    const resumenFiltrado = useMemo(() => {
        let lista = sedeSel !== 'todas'
            ? resumenNotas.filter(r => {
                const curso = cursos.find(c => c.id === r.curso_id);
                return curso?.sede_id === Number(sedeSel);
            })
            : resumenNotas;
        if (nivelSeleccionado === 'todos') return lista;
        if (nivelSeleccionado === 'prejardin')
            return lista.filter(r => r.nivel === 'prejardin' || r.nivel === 'transicion' || r.nivel === 'preescolar');
        return lista.filter(r => r.nivel === nivelSeleccionado);
    }, [resumenNotas, nivelSeleccionado, sedeSel, cursos]);

    const stats = useMemo(() => {
        const src = (hasLoaded || hayFiltros) ? boletinesFiltrados : boletines;
        return {
            borrador:  src.filter(b => b.estado === 'borrador').length,
            generado:  src.filter(b => b.estado === 'generado').length,
            entregado: src.filter(b => b.estado === 'entregado').length,
        };
    }, [boletinesFiltrados, boletines, hasLoaded, hayFiltros]);

    // ── Handlers ──
    const handleNivelChange = (nivel: string) => { setNivelSel(nivel); setCursoSel('todos'); };

    const limpiarFiltros = () => {
        setNivelSel('todos'); setSedeSel('todas'); setCursoSel('todos');
        setPeriodoSel('todos'); setEstadoFiltro('todos'); setBusqueda('');
    };

    const handleGenerarMasivo = () => {
        if (periodoSeleccionado === 'todos') { alert('Selecciona un período.'); return; }
        setProcessing(true);
        router.post('/admin/boletines/generar', {
            periodo_id: parseInt(periodoSeleccionado),
            curso_id:   cursoSeleccionado !== 'todos' ? parseInt(cursoSeleccionado) : null,
            nivel:      cursoSeleccionado === 'todos' && nivelSeleccionado !== 'todos' ? nivelSeleccionado : null,
            modo_validacion: validacionEstricta ? 'bloquear' : 'advertir',
        }, { onFinish: () => setProcessing(false) });
    };

    const handleNotificar = useCallback((boletin: Boletin) => {
        if (!boletin.padres?.length) { alert('Sin acudientes registrados.'); return; }
        setSendingNotif(boletin.id);
        router.post(`/admin/boletines/${boletin.id}/notificar`, {}, { onFinish: () => setSendingNotif(null) });
    }, []);

    const handleNotificarMasivo = () => {
        if (periodoSeleccionado === 'todos') { alert('Selecciona un período.'); return; }
        if (!confirm('¿Enviar notificaciones a todos los acudientes de los boletines generados?')) return;
        setProcessing(true);
        router.post('/admin/boletines/notificar-masivo', {
            periodo_id: parseInt(periodoSeleccionado),
            curso_id:   cursoSeleccionado !== 'todos' ? parseInt(cursoSeleccionado) : null,
            nivel:      cursoSeleccionado === 'todos' && nivelSeleccionado !== 'todos' ? nivelSeleccionado : null,
        }, { onFinish: () => setProcessing(false) });
    };

    const handleActualizarBoletin = useCallback((boletin: Boletin) => {
        setUpdatingBoletinId(boletin.id);
        router.post(`/admin/boletines/${boletin.id}/actualizar`, {}, {
            preserveScroll: true,
            onFinish: () => setUpdatingBoletinId(null),
        });
    }, []);

    // ── PDF individual ──
    const generarPDFIndividual = useCallback(async (boletin: Boletin) => {
        const [logoHeader, logoWatermark] = await Promise.all([
            cargarLogoBoletin(1, 850),
            cargarLogoBoletin(0.08, 420),
        ]);
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        await dibujarBoletinPagina(doc, boletin, logoHeader, logoWatermark);
        doc.save(`Boletin_${boletin.estudiante.replace(/\s+/g, '_')}_${boletin.periodo.replace(/\s+/g, '_')}.pdf`);
    }, []);

    // ── PDF múltiple (un sólo archivo, una página por estudiante) ──
    const exportarTodosUnPDF = useCallback(async () => {
        const lista = boletinesFiltrados;
        if (lista.length === 0) { alert('No hay boletines para exportar.'); return; }
        const [logoHeader, logoWatermark] = await Promise.all([
            cargarLogoBoletin(1, 850),
            cargarLogoBoletin(0.08, 420),
        ]);
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        for (let idx = 0; idx < lista.length; idx++) {
            if (idx > 0) doc.addPage();
            await dibujarBoletinPagina(doc, lista[idx], logoHeader, logoWatermark);
        }
        const periodo = lista[0].periodo.replace(/\s+/g, '_');
        doc.save(`Boletines_${periodo}_${new Date().toLocaleDateString('es-CO').replace(/\//g, '-')}.pdf`);
        setShowModal(false);
    }, [boletinesFiltrados]);

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Boletines">
            <Head title="Boletines & Notas" />

            <div className="space-y-4 sm:space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>

                {/* ═══ Header ═══ */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>
                            Boletines & Notas
                        </h1>
                        <p className="text-gray-500 text-sm">Gestiona y exporta boletines de calificaciones</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-[#293577] hover:bg-[#181b49] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-md"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Exportar Boletines
                    </button>
                </div>

                {/* ═══ Tabs ═══ */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                    {(['boletines', 'resumen'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-[#293577] text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}
                        >
                            {tab === 'boletines' ? 'Boletines' : 'Resumen Notas'}
                        </button>
                    ))}
                </div>

                {/* ═══ Filtros ═══ */}
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-4 border border-gray-100">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nivel Educativo</label>
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap">
                            <button
                                onClick={() => handleNivelChange('todos')}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${nivelSeleccionado === 'todos' ? 'bg-[#293577] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Todos los niveles
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

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {sedes.length > 1 && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sede</label>
                                <select value={sedeSel} onChange={e => { setSedeSel(e.target.value); setCursoSel('todos'); }}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                    <option value="todas">Todas las sedes</option>
                                    {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Curso</label>
                            <select value={cursoSeleccionado} onChange={e => setCursoSel(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                <option value="todos">Todos los cursos</option>
                                {cursosDisponibles.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Período</label>
                            <select value={periodoSeleccionado} onChange={e => setPeriodoSel(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                <option value="todos">Todos los períodos</option>
                                {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}{p.activo ? ' (Activo)' : ''}</option>)}
                            </select>
                        </div>
                        {activeTab === 'boletines' && (
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Estado</label>
                                <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                    <option value="todos">Todos los estados</option>
                                    {Object.entries(estadosConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Buscar</label>
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input type="text" placeholder="Buscar estudiante..." value={busqueda}
                                    onChange={e => setBusqueda(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]" />
                            </div>
                        </div>
                    </div>

                    {hayFiltros && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="text-xs text-gray-500">Filtros activos:</span>
                            {sedeSel !== 'todas' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                                    {sedes.find(s => s.id.toString() === sedeSel)?.nombre}
                                    <button onClick={() => setSedeSel('todas')} className="hover:opacity-70">×</button>
                                </span>
                            )}
                            {nivelSeleccionado !== 'todos' && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getNivelBadge(nivelSeleccionado)}`}>
                                    {getNivelLabel(nivelSeleccionado)}
                                    <button onClick={() => handleNivelChange('todos')} className="hover:opacity-70">×</button>
                                </span>
                            )}
                            {periodoSeleccionado !== 'todos' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                    {periodos.find(p => p.id.toString() === periodoSeleccionado)?.nombre}
                                    <button onClick={() => setPeriodoSel('todos')} className="hover:opacity-70">×</button>
                                </span>
                            )}
                            {cursoSeleccionado !== 'todos' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                    {cursos.find(c => c.id.toString() === cursoSeleccionado)?.nombre}
                                    <button onClick={() => setCursoSel('todos')} className="hover:opacity-70">×</button>
                                </span>
                            )}
                            {estadoFiltro !== 'todos' && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${estadosConfig[estadoFiltro]?.color}`}>
                                    {estadosConfig[estadoFiltro]?.label}
                                    <button onClick={() => setEstadoFiltro('todos')} className="hover:opacity-70">×</button>
                                </span>
                            )}
                            {busqueda && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                    "{busqueda}" <button onClick={() => setBusqueda('')} className="hover:opacity-70">×</button>
                                </span>
                            )}
                            <button onClick={limpiarFiltros} className="text-xs text-red-500 hover:text-red-700 font-medium ml-1">Limpiar todo</button>
                        </div>
                    )}
                </div>

                {/* ═══ TAB BOLETINES ═══ */}
                {activeTab === 'boletines' && (
                    <>
                        {/* Stats clickables */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-4">
                            {[
                                { key: 'borrador',  label: 'Borradores', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600' },
                                { key: 'generado',  label: 'Generados',  bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-600'  },
                                { key: 'entregado', label: 'Entregados', bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-600'   },
                            ].map(stat => (
                                <button
                                    key={stat.key}
                                    onClick={() => {
                                        if (!hasLoaded) setHasLoaded(true);
                                        setEstadoFiltro(estadoFiltro === stat.key ? 'todos' : stat.key);
                                    }}
                                    className={`${stat.bg} border ${stat.border} rounded-xl p-4 text-center transition-all ${estadoFiltro === stat.key ? 'ring-2 ring-offset-1 ring-[#293577]' : 'hover:shadow-md'}`}
                                >
                                    <p className={`text-2xl sm:text-3xl font-bold ${stat.text}`}>{stats[stat.key as keyof typeof stats]}</p>
                                    <p className={`text-xs sm:text-sm ${stat.text} mt-0.5`}>{stat.label}</p>
                                </button>
                            ))}
                        </div>

                        {/* Lazy load */}
                        {!hasLoaded && !hayFiltros ? (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#293577] to-[#181b49] rounded-2xl flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mb-2">Ver Boletines</h3>
                                <p className="text-gray-500 text-sm mb-5">{boletines.length} boletines registrados</p>
                                <p className="text-gray-400 text-xs mb-5">También puedes usar los filtros de arriba para cargar sólo lo que necesitas</p>
                                <button
                                    onClick={() => setHasLoaded(true)}
                                    className="bg-[#293577] hover:bg-[#181b49] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                                >
                                    Cargar todos los boletines ({boletines.length})
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Action bar */}
                                <div className="flex items-center justify-between gap-3 flex-wrap">
                                    <p className="text-sm text-gray-500">
                                        Mostrando <span className="font-semibold text-gray-800">{boletinesFiltrados.length}</span> de {boletines.length} boletines
                                    </p>
                                    {boletinesFiltrados.filter(b => b.estado === 'generado').length > 0 && (
                                        <button
                                            onClick={handleNotificarMasivo}
                                            disabled={processing}
                                            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                            </svg>
                                            Notificar a acudientes ({boletinesFiltrados.filter(b => b.estado === 'generado').length})
                                        </button>
                                    )}
                                </div>

                                {/* Tabla Desktop */}
                                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hidden sm:block">
                                    {boletinesFiltrados.length === 0 ? (
                                        <div className="p-12 text-center">
                                            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-gray-500 font-medium">No se encontraron boletines</p>
                                            <p className="text-gray-400 text-sm mt-1">Ajusta los filtros o genera nuevos boletines</p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full min-w-[750px]">
                                                <thead>
                                                    <tr className="bg-gray-50 border-b border-gray-100">
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estudiante</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nivel</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Curso</th>
                                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Prom.</th>
                                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {boletinesFiltrados.map(b => (
                                                        <tr key={b.id} className="hover:bg-gray-50/70 transition-colors group">
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#293577] to-[#181b49] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                                        {b.estudiante.charAt(0)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-gray-800">{b.estudiante}</p>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <p className="text-xs text-gray-400">{b.periodo}</p>
                                                                            {b.completitud?.estado === 'incompleto' && (
                                                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                                                                    Incompleto
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getNivelBadge(b.nivel)}`}>
                                                                    {getNivelLabel(b.nivel)}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-sm text-gray-600">{b.curso}</td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`text-base font-bold ${promedioColor(b.promedio)}`}>
                                                                    {b.promedio.toFixed(1)}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estadosConfig[b.estado]?.color}`}>
                                                                    <EstadoIcon estado={b.estado} />
                                                                    {estadosConfig[b.estado]?.label}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex justify-end items-center gap-1.5">
                                                                    <button
                                                                        onClick={() => handleActualizarBoletin(b)}
                                                                        disabled={updatingBoletinId === b.id}
                                                                        className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 text-xs font-semibold"
                                                                        title="Actualizar boletín"
                                                                    >
                                                                        {updatingBoletinId === b.id
                                                                            ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                            : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                                        }
                                                                        <span className="hidden lg:inline">Actualizar boletín</span>
                                                                    </button>
                                                                    {/* PDF individual */}
                                                                    <button
                                                                        onClick={() => generarPDFIndividual(b)}
                                                                        className="p-2 rounded-lg bg-[#293577]/10 text-[#293577] hover:bg-[#293577] hover:text-white transition-all"
                                                                        title="Descargar PDF"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                        </svg>
                                                                    </button>
                                                                    {/* Notificar */}
                                                                    {b.estado === 'generado' && (
                                                                        <button
                                                                            onClick={() => handleNotificar(b)}
                                                                            disabled={sendingNotif === b.id}
                                                                            className="p-2 rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50"
                                                                            title="Notificar acudiente"
                                                                        >
                                                                            {sendingNotif === b.id
                                                                                ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                                                            }
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>

                                {/* Cards Mobile */}
                                <div className="sm:hidden space-y-3">
                                    {boletinesFiltrados.length === 0 ? (
                                        <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                                            <p className="text-gray-500 text-sm">No se encontraron boletines</p>
                                        </div>
                                    ) : boletinesFiltrados.map(b => (
                                        <div key={b.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#293577] to-[#181b49] flex items-center justify-center text-white font-bold">
                                                        {b.estudiante.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800 text-sm">{b.estudiante}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${getNivelBadge(b.nivel)}`}>{getNivelLabel(b.nivel)}</span>
                                                            <span className="text-xs text-gray-500">{b.curso}</span>
                                                            {b.completitud?.estado === 'incompleto' && (
                                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-700">Incompleto</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estadosConfig[b.estado]?.color}`}>
                                                    <EstadoIcon estado={b.estado} className="w-3 h-3" />
                                                    {estadosConfig[b.estado]?.label}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                <span className={`text-xl font-bold ${promedioColor(b.promedio)}`}>{b.promedio.toFixed(1)}</span>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleActualizarBoletin(b)}
                                                        disabled={updatingBoletinId === b.id}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all text-xs font-semibold disabled:opacity-50"
                                                    >
                                                        {updatingBoletinId === b.id
                                                            ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                            : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                                        }
                                                        Actualizar
                                                    </button>
                                                    <button
                                                        onClick={() => generarPDFIndividual(b)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#293577]/10 text-[#293577] hover:bg-[#293577] hover:text-white transition-all text-xs font-semibold"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                        PDF
                                                    </button>
                                                    {b.estado === 'generado' && (
                                                        <button
                                                            onClick={() => handleNotificar(b)}
                                                            disabled={sendingNotif === b.id}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white transition-all text-xs font-semibold disabled:opacity-50"
                                                        >
                                                            {sendingNotif === b.id
                                                                ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                                            }
                                                            Notificar
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* ═══ TAB RESUMEN NOTAS ═══ */}
                {activeTab === 'resumen' && (
                    <div className="space-y-4">
                        {resumenFiltrado.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                                <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <p className="text-gray-500 font-medium">No hay datos de notas disponibles</p>
                                <p className="text-gray-400 text-sm mt-1">Verifica que haya notas definitivas registradas</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {resumenFiltrado.map(r => (
                                    <div key={r.curso_id} onClick={() => { setDetalleResumen(r); setDetalleTab('materias'); }} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 hover:shadow-md hover:border-[#293577]/30 transition-all cursor-pointer group">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="font-bold text-gray-800 group-hover:text-[#293577] transition-colors">{r.curso}</h3>
                                                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${getNivelBadge(r.nivel)}`}>
                                                    {getNivelLabel(r.nivel)}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-2xl font-bold ${promedioColor(r.promedio)}`}>{r.promedio.toFixed(1)}</p>
                                                <p className="text-xs text-gray-400">Promedio</p>
                                            </div>
                                        </div>

                                        {/* Barra aprobados / reprobados */}
                                        {r.totalEstudiantes > 0 && (
                                            <div className="mb-4">
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span>{r.aprobados} aprobados</span>
                                                    <span>{r.reprobados} reprobados</span>
                                                </div>
                                                <div className="h-2 bg-red-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-green-500 rounded-full transition-all"
                                                        style={{ width: `${(r.aprobados / r.totalEstudiantes) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-3 gap-2 mb-4">
                                            {[
                                                { label: 'Total', value: r.totalEstudiantes, bg: 'bg-gray-50', text: 'text-gray-700' },
                                                { label: 'Aprob.', value: r.aprobados, bg: 'bg-green-50', text: 'text-green-600' },
                                                { label: 'Reprob.', value: r.reprobados, bg: 'bg-red-50', text: 'text-red-500' },
                                            ].map(s => (
                                                <div key={s.label} className={`${s.bg} rounded-lg p-2 text-center`}>
                                                    <p className={`text-lg font-bold ${s.text}`}>{s.value}</p>
                                                    <p className="text-[10px] text-gray-500 uppercase">{s.label}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="space-y-2 pt-3 border-t border-gray-100">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-400 flex items-center gap-1">
                                                    <span className="text-green-500">↑</span> Mejor materia
                                                </span>
                                                <span className="font-medium text-green-700 text-xs">{r.mejorMateria}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-400 flex items-center gap-1">
                                                    <span className="text-red-400">↓</span> Requiere atención
                                                </span>
                                                <span className="font-medium text-red-600 text-xs">{r.peorMateria}</span>
                                            </div>
                                        </div>
                                        {/* Hint ver detalle */}
                                        <div className="pt-3 mt-2 border-t border-gray-100 flex items-center justify-center gap-1 text-[11px] text-[#293577]/60 group-hover:text-[#293577] transition-colors">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                            Ver detalle completo
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ═══════════════════════════ MODAL DETALLE RESUMEN ═══════════════════════════ */}
            {detalleResumen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setDetalleResumen(null)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-br from-[#293577] to-[#181b49] p-5 text-white flex-shrink-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${getNivelBadge(detalleResumen.nivel)} opacity-90`}>
                                            {getNivelLabel(detalleResumen.nivel)}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-extrabold">{detalleResumen.curso}</h2>
                                    <p className="text-white/60 text-sm mt-0.5">Período activo · Notas definitivas</p>
                                </div>
                                <div className="text-center">
                                    <div className={`text-3xl font-extrabold ${detalleResumen.promedio >= 4 ? 'text-green-300' : detalleResumen.promedio >= 3 ? 'text-yellow-300' : 'text-red-300'}`}>
                                        {detalleResumen.promedio.toFixed(1)}
                                    </div>
                                    <div className="text-white/60 text-xs uppercase tracking-wide">Promedio</div>
                                </div>
                            </div>

                            {/* Stats rápidas */}
                            <div className="grid grid-cols-4 gap-2 mt-4">
                                {[
                                    { label: 'Matriculados', value: detalleResumen.totalEstudiantes, color: 'bg-white/10' },
                                    { label: 'Con notas',    value: detalleResumen.estudiantes.length, color: 'bg-white/10' },
                                    { label: 'Aprobados',   value: detalleResumen.aprobados, color: 'bg-green-500/30' },
                                    { label: 'Reprobados',  value: detalleResumen.reprobados, color: 'bg-red-500/30' },
                                ].map(s => (
                                    <div key={s.label} className={`${s.color} rounded-xl p-2 text-center`}>
                                        <p className="text-xl font-bold">{s.value}</p>
                                        <p className="text-[10px] text-white/70 uppercase">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Barra aprobación global */}
                            {(detalleResumen.aprobados + detalleResumen.reprobados) > 0 && (
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-white/60 mb-1">
                                        <span>{Math.round((detalleResumen.aprobados / (detalleResumen.aprobados + detalleResumen.reprobados)) * 100)}% aprobación</span>
                                        <span>{detalleResumen.aprobados} / {detalleResumen.aprobados + detalleResumen.reprobados} notas</span>
                                    </div>
                                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-400 rounded-full transition-all"
                                            style={{ width: `${(detalleResumen.aprobados / (detalleResumen.aprobados + detalleResumen.reprobados)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Cerrar */}
                            <button
                                onClick={() => setDetalleResumen(null)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 p-3 bg-gray-50 border-b flex-shrink-0">
                            {([
                                { key: 'materias' as const,
                                  label: `Materias (${detalleResumen.materias.length})`,
                                  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
                                { key: 'estudiantes' as const,
                                  label: `Estudiantes (${detalleResumen.estudiantes.length})`,
                                  icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
                            ]).map(t => (
                                <button
                                    key={t.key}
                                    onClick={() => setDetalleTab(t.key)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${detalleTab === t.key ? 'bg-[#293577] text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Body scrollable */}
                        <div className="overflow-y-auto flex-1 p-5">

                            {/* === MATERIAS === */}
                            {detalleTab === 'materias' && (
                                <div className="space-y-3">
                                    {detalleResumen.materias.length === 0 ? (
                                        <p className="text-center text-gray-400 text-sm py-8">Sin notas definitivas registradas</p>
                                    ) : detalleResumen.materias.map((m, i) => {
                                        const pct = Math.min((m.promedio / 5) * 100, 100);
                                        const aprPct = m.total > 0 ? Math.round((m.aprobados / m.total) * 100) : 0;
                                        const barColor = m.promedio >= 4 ? 'bg-green-500' : m.promedio >= 3 ? 'bg-yellow-400' : 'bg-red-400';
                                        const textColor = m.promedio >= 4 ? 'text-green-600' : m.promedio >= 3 ? 'text-yellow-600' : 'text-red-500';
                                        return (
                                            <div key={m.materia} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 rounded-full bg-[#293577]/10 text-[#293577] text-xs font-bold flex items-center justify-center flex-shrink-0">
                                                            {i + 1}
                                                        </span>
                                                        <span className="font-semibold text-gray-800 text-sm">{m.materia}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs text-gray-400">{m.total} alum.</span>
                                                        <span className={`text-lg font-extrabold ${textColor}`}>
                                                            {m.promedio.toFixed(1)}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* Barra promedio */}
                                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                                                    <div
                                                        className={`h-full ${barColor} rounded-full transition-all`}
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                {/* Aprobados / reprobados */}
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex items-center gap-1">
                                                            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                                                            {m.aprobados} aprobados ({aprPct}%)
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                                                            {m.reprobados} reprobados
                                                        </span>
                                                    </div>
                                                    <span className="text-gray-400">{(m.promedio / 5 * 100).toFixed(0)}% de 5.0</span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Rankings destaque */}
                                    {detalleResumen.materias.length >= 2 && (
                                        <div className="grid grid-cols-2 gap-3 mt-2">
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-green-100 border border-green-300 flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Mejor materia</p>
                                                    <p className="font-bold text-green-800 text-sm">{detalleResumen.mejorMateria}</p>
                                                </div>
                                            </div>
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-red-100 border border-red-300 flex items-center justify-center flex-shrink-0">
                                                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-red-500 font-semibold uppercase tracking-wide">Requiere atención</p>
                                                    <p className="font-bold text-red-700 text-sm">{detalleResumen.peorMateria}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* === ESTUDIANTES === */}
                            {detalleTab === 'estudiantes' && (
                                <div className="space-y-2">
                                    {detalleResumen.estudiantes.length === 0 ? (
                                        <p className="text-center text-gray-400 text-sm py-8">Sin estudiantes con notas</p>
                                    ) : detalleResumen.estudiantes.map((e, i) => {
                                        const aprPct = e.total > 0 ? Math.round((e.aprobadas / e.total) * 100) : 0;
                                        const textColor = e.promedio >= 4 ? 'text-green-600' : e.promedio >= 3 ? 'text-yellow-600' : 'text-red-500';
                                        const bgColor   = e.promedio >= 4 ? 'bg-green-50 border-green-100' : e.promedio >= 3 ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100';
                                        const medalBg = i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-orange-400 text-white' : 'bg-gray-100 text-gray-500';
                                        return (
                                            <div key={e.nombre} className={`flex items-center gap-3 ${bgColor} border rounded-xl p-3 transition-colors`}>
                                                {/* Puesto */}
                                                <div className={`flex-shrink-0 w-7 h-7 rounded-full ${medalBg} flex items-center justify-center text-xs font-bold`}>
                                                    {i + 1}
                                                </div>
                                                {/* Avatar */}
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#293577] to-[#181b49] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                    {e.nombre.charAt(0)}
                                                </div>
                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-800 text-sm truncate">{e.nombre}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-xs text-gray-400">{e.aprobadas}/{e.total} mat. aprobadas</span>
                                                        <span className="text-xs font-medium text-gray-500">({aprPct}%)</span>
                                                    </div>
                                                </div>
                                                {/* Promedio */}
                                                <div className={`text-right flex-shrink-0`}>
                                                    <span className={`text-2xl font-extrabold ${textColor}`}>{e.promedio.toFixed(1)}</span>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Leyenda */}
                                    <div className="flex items-center justify-center gap-4 pt-3 text-xs text-gray-400">
                                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block" /> ≥ 4.0</span>
                                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200 inline-block" /> 3.0 – 3.9</span>
                                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-100 border border-red-200 inline-block" /> &lt; 3.0</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════ MODAL EXPORTAR / GENERAR ═══════════════════════════ */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-br from-[#293577] to-[#181b49] p-5 text-white">
                            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                            <h2 className="text-lg font-bold">Exportar Boletines</h2>
                            <p className="text-white/70 text-sm mt-1">Configura los filtros y exporta o genera boletines masivamente</p>
                        </div>

                        {/* Body */}
                        <div className="overflow-y-auto p-5 space-y-4">
                            {/* Filtros en modal */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Período *</label>
                                    <select value={periodoSeleccionado} onChange={e => setPeriodoSel(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                        <option value="todos">Todos los períodos</option>
                                        {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}{p.activo ? ' ✓' : ''}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nivel</label>
                                    <select value={nivelSeleccionado} onChange={e => handleNivelChange(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                        <option value="todos">Todos los niveles</option>
                                        {niveles.map(n => <option key={n} value={n}>{getNivelLabel(n)}</option>)}
                                    </select>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Curso</label>
                                    <select value={cursoSeleccionado} onChange={e => setCursoSel(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                        <option value="todos">Todos los cursos</option>
                                        {cursosDisponibles.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Resumen de lo que se exportará */}
                            <div className="bg-[#293577]/5 border border-[#293577]/20 rounded-xl p-4">
                                <p className="text-sm font-semibold text-[#293577] mb-2">Resumen de exportación</p>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Boletines a exportar:</span>
                                        <span className="ml-2 font-bold text-[#293577]">
                                            {boletinesFiltrados.length || boletines.filter(b => {
                                                const mp = periodoSeleccionado === 'todos' || b.periodo_id.toString() === periodoSeleccionado;
                                                const mn = nivelSeleccionado === 'todos' || b.nivel === nivelSeleccionado;
                                                const mc = cursoSeleccionado === 'todos' || b.curso_id.toString() === cursoSeleccionado;
                                                return mp && mn && mc;
                                            }).length}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Generados:</span>
                                        <span className="ml-2 font-bold text-green-600">
                                            {(boletinesFiltrados.length > 0 ? boletinesFiltrados : boletines.filter(b => {
                                                const mp = periodoSeleccionado === 'todos' || b.periodo_id.toString() === periodoSeleccionado;
                                                const mn = nivelSeleccionado === 'todos' || b.nivel === nivelSeleccionado;
                                                const mc = cursoSeleccionado === 'todos' || b.curso_id.toString() === cursoSeleccionado;
                                                return mp && mn && mc;
                                            })).filter(b => b.estado === 'generado').length}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Aviso si faltan boletines */}
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                                <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5Zm0 9a1 1 0 100-2 1 1 0 000 2Z" clipRule="evenodd" />
                                </svg>
                                <p className="text-xs text-amber-700">
                                    Si no existen boletines aún, primero usa <strong>"Generar boletines"</strong> para crearlos. Los existentes serán actualizados con las notas definitivas más recientes.
                                </p>
                            </div>

                            <label className="flex items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                                <input
                                    type="checkbox"
                                    checked={validacionEstricta}
                                    onChange={e => setValidacionEstricta(e.target.checked)}
                                    className="mt-0.5"
                                />
                                <span className="text-xs text-gray-600">
                                    <strong>Modo estricto:</strong> si falta información (notas completas o observación del director), no se generan esos boletines.
                                    Si está desactivado, se generan en <strong>borrador</strong> y quedan marcados como incompletos.
                                </span>
                            </label>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 border-t space-y-2">
                            {/* Exportar PDF (un solo archivo) */}
                            <button
                                onClick={exportarTodosUnPDF}
                                className="w-full flex items-center justify-center gap-2 bg-[#293577] hover:bg-[#181b49] text-white py-3 rounded-xl text-sm font-semibold transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Exportar PDF (un solo archivo)
                            </button>
                            {/* Generar boletines -> actualiza/crea en DB */}
                            <button
                                onClick={handleGenerarMasivo}
                                disabled={processing || periodoSeleccionado === 'todos'}
                                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium transition-colors"
                            >
                                {processing
                                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generando...</>
                                    : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> Generar / Actualizar boletines</>
                                }
                            </button>
                            <button onClick={() => setShowModal(false)}
                                className="w-full py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
