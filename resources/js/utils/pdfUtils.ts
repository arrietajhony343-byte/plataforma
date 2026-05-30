export const PDF_LOGO_CANDIDATES = [
    '/logo-certificados.png',
    '/logo-certificados.jpg',
    '/logo-certificados.jpeg',
    '/images/logo-certificados.png',
    '/images/logo-certificados.jpg',
    '/img/logo-certificados.png',
    '/certificados-logo.png',
    '/images/certificados-logo.png',
];

export const PDF_INSTITUCION = {
    nombre1: 'INSTITUTO PEDAGOGICO',
    nombre2: 'EMPRENDEDORES DEL SABER',
    lema: 'Ser, saber y emprender',
    legal: 'Aprobado por Resolución No 9385 del 10 - 11 - 2025',
    daneNit: 'DANE 313001800093  –  NIT 73143410 -6',
    firmaNombre: 'INDIRA CANO ROMAN',
    firmaRol: 'COORDINADORA',
    sede: 'Villas de la candelaria Mz. 44 Lt. 11  CEL: 3005257812 - 3006529540',
    correo: 'emprendedores.sersaber2023@gmail.com',
    ciudad: 'Cartagena de Indias - Colombia',
};

/**
 * Loads an image from a URL, scales it to maxPx, and returns a base64 data URL.
 * opacidad >= 1 → JPEG with white background (smaller file).
 * opacidad < 1  → PNG with true alpha (for watermarks).
 */
export const cargarImagenPDF = async (src: string, opacidad = 1, maxPx = 400): Promise<string | null> => {
    const url = src.startsWith('http') ? src : window.location.origin + src;
    try {
        const resp = await fetch(url, { credentials: 'same-origin' });
        if (!resp.ok) return null;
        const blob = await resp.blob();
        const base64 = await new Promise<string>((res, rej) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result as string);
            reader.onerror = () => rej(new Error('FileReader error'));
            reader.readAsDataURL(blob);
        });
        return new Promise<string | null>((res) => {
            const img = new Image();
            img.onload = () => {
                const origW = img.naturalWidth || img.width || maxPx;
                const origH = img.naturalHeight || img.height || maxPx;
                const scale = Math.min(1, maxPx / Math.max(origW, origH));
                const cW = Math.round(origW * scale);
                const cH = Math.round(origH * scale);
                const canvas = document.createElement('canvas');
                canvas.width = cW;
                canvas.height = cH;
                const ctx = canvas.getContext('2d');
                if (!ctx) { res(null); return; }
                if (opacidad >= 1) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, cW, cH);
                    ctx.drawImage(img, 0, 0, cW, cH);
                    res(canvas.toDataURL('image/jpeg', 0.85));
                } else {
                    ctx.clearRect(0, 0, cW, cH);
                    ctx.globalAlpha = opacidad;
                    ctx.drawImage(img, 0, 0, cW, cH);
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

export const cargarPrimerLogoDisponible = async (opacidad = 1, maxPx = 400): Promise<string | null> => {
    for (const candidate of PDF_LOGO_CANDIDATES) {
        const result = await cargarImagenPDF(candidate, opacidad, maxPx);
        if (result) return result;
    }
    return null;
};

/** Consistent grading scale for all PDF documents. SUPERIOR starts at 4.5. */
export const getEscalaValorativa = (nota: number): string => {
    if (nota >= 4.5) return 'SUPERIOR';
    if (nota >= 4.0) return 'ALTO';
    if (nota >= 3.0) return 'BÁSICO';
    return 'BAJO';
};
