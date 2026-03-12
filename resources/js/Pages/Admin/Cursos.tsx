import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminMenuItems } from '@/Config/adminMenu';

/* ─── SVG Icons ─── */
const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);
const PlusIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const EditIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" /></svg>;
const TrashIcon = ({ className = "w-4 h-4" }: { className?: string }) => <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
const EyeIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>;
const GridIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" /></svg>;
const ListIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>;

interface Sede {
    id: number;
    nombre: string;
    ciudad: string;
}

interface Profesor {
    id: number;
    name: string;
    sede_id?: number | null;
}

/* ─── Interfaces ─── */
interface CursoMateria {
    id: number;
    nombre: string;
    profesor: string | null;
    profesor_id: number | null;
}

interface Curso {
    id: number;
    nombre: string;
    nivel: string;
    grado: string;
    seccion: string;
    jornada: string;
    cupo_maximo: number | null;
    director_grupo_id: number | null;
    materias: CursoMateria[];
    materias_nombres: string[];
    profesor_guia: string;
    estudiantes: number;
    estudiantes_lista: { id: number; name: string }[];
    activo: boolean;
    sede_id?: number;
    sede_nombre?: string;
}

interface Materia {
    id: number;
    nombre: string;
    area: string;
    codigo: string;
    cursos: number;
    profesores: Profesor[];
    horasSemanales: number;
    activa: boolean;
}

interface MateriaAsignada {
    materia_id: number;
    profesor_id: number | null;
}

interface Props {
    cursos: Curso[];
    materias: Materia[];
    profesores: Profesor[];
    materiasProfesores: Record<number, { id: number; name: string }[]>;
    totalEstudiantes: number;
    anio: number;
    sedes: Sede[];
}

/* ─── Configuración visual ─── */
const nivelesEducativos: Record<string, { label: string; color: string; bg: string; border: string }> = {
    prejardin:    { label: 'Pre-Jardín',   color: 'text-pink-700',    bg: 'bg-pink-50',    border: 'border-pink-200' },
    primaria:     { label: 'Primaria',     color: 'text-blue-700',    bg: 'bg-blue-50',    border: 'border-blue-200' },
    bachillerato: { label: 'Bachillerato', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
};
const nivelesKeys = Object.keys(nivelesEducativos);

const nivelBadgeColors: Record<string, string> = {
    prejardin:    'bg-pink-100 text-pink-700 border-pink-200',
    primaria:     'bg-blue-100 text-blue-700 border-blue-200',
    bachillerato: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const nivelCardAccent: Record<string, string> = {
    prejardin:    'from-pink-500 to-pink-600',
    primaria: 'from-blue-500 to-blue-600',
    bachillerato: 'from-emerald-500 to-emerald-600',
};

const materiaColors: Record<string, { icono: React.ReactNode; colorBg: string; colorText: string; colorBorder: string }> = {
    'Matemáticas':        { icono: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" /></svg>,        colorBg: 'bg-blue-50',   colorText: 'text-blue-600',    colorBorder: 'border-blue-200' },
    'Lengua Castellana':  { icono: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>, colorBg: 'bg-amber-50',  colorText: 'text-amber-700',   colorBorder: 'border-amber-200' },
    'Ciencias Naturales': { icono: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.169.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23-.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>, colorBg: 'bg-green-50',  colorText: 'text-green-700',   colorBorder: 'border-green-200' },
    'Ciencias Sociales':  { icono: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>, colorBg: 'bg-purple-50', colorText: 'text-purple-700',  colorBorder: 'border-purple-200' },
    'Inglés':             { icono: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" /></svg>,             colorBg: 'bg-indigo-50', colorText: 'text-indigo-700',  colorBorder: 'border-indigo-200' },
    'Educación Física':   { icono: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" /></svg>,   colorBg: 'bg-orange-50', colorText: 'text-orange-700',  colorBorder: 'border-orange-200' },
    'Artes':              { icono: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>,              colorBg: 'bg-pink-50',   colorText: 'text-pink-700',    colorBorder: 'border-pink-200' },
    'Tecnología':         { icono: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0H3" /></svg>,         colorBg: 'bg-cyan-50',   colorText: 'text-cyan-700',    colorBorder: 'border-cyan-200' },
    'Ética y Valores':    { icono: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>,    colorBg: 'bg-teal-50',   colorText: 'text-teal-700',    colorBorder: 'border-teal-200' },
    'Religión':           { icono: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>,           colorBg: 'bg-rose-50',   colorText: 'text-rose-700',    colorBorder: 'border-rose-200' },
};
const defaultMateriaColor: { icono: React.ReactNode; colorBg: string; colorText: string; colorBorder: string } = { icono: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>, colorBg: 'bg-gray-50', colorText: 'text-gray-600', colorBorder: 'border-gray-200' };
const getMateriaStyle = (nombre: string) => materiaColors[nombre] ?? defaultMateriaColor;

/* ─── ProfSearchSelect ─── */
function ProfSearchSelect({ options, value, onChange }: {
    options: { id: number; name: string }[];
    value: number | null;
    onChange: (id: number | null) => void;
}) {
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
    const ref = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const selected = options.find(o => o.id === value);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            const t = e.target as Node;
            if (!ref.current?.contains(t) && !panelRef.current?.contains(t)) { setOpen(false); setSearch(''); }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = search ? options.filter(o => o.name.toLowerCase().includes(search.toLowerCase())) : options;

    const handleOpen = () => {
        if (!open && ref.current) {
            const r = ref.current.getBoundingClientRect();
            setDropPos({ top: r.bottom + 4, left: r.left, width: r.width });
        }
        setOpen(o => !o);
        setSearch('');
    };

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                onClick={handleOpen}
                className="w-full flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-left"
            >
                <span className={`flex-1 truncate ${selected ? 'text-gray-800' : 'text-gray-400'}`}>
                    {selected ? selected.name : '— Seleccionar profesor —'}
                </span>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                </svg>
            </button>
            {open && dropPos && createPortal(
                <div ref={panelRef} className="fixed z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden" style={{ top: dropPos.top, left: dropPos.left, width: dropPos.width }}>
                    <div className="p-2 border-b border-gray-100">
                        <input
                            autoFocus
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar profesor..."
                            className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#293577]/30"
                        />
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                        <button
                            type="button"
                            onMouseDown={() => { onChange(null); setOpen(false); setSearch(''); }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50"
                        >
                            — Sin asignar —
                        </button>
                        {filtered.length === 0 && (
                            <div className="px-3 py-2 text-sm text-gray-400 italic">Sin resultados</div>
                        )}
                        {filtered.map(o => (
                            <button
                                key={o.id}
                                type="button"
                                onMouseDown={() => { onChange(o.id); setOpen(false); setSearch(''); }}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-[#293577]/5 hover:text-[#293577] transition-colors ${value === o.id ? 'bg-[#293577]/10 text-[#293577] font-medium' : 'text-gray-700'}`}
                            >
                                {o.name}
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

/* ─── Form defaults ─── */
const EMPTY_CURSO = { nombre: '', nivel: '', grado: '', grupo: '', jornada: 'Mañana', cupo_maximo: '35', director_grupo_id: '', sede_id: '' };
const EMPTY_MATERIA = { nombre: '', area: '', codigo: '', horas_semanales: '4' };

/* ═══════════════════════════════════════════════════════ */
export default function Cursos({ cursos, materias, profesores: listaProfesores, materiasProfesores, totalEstudiantes, anio, sedes }: Props) {
    // Tabs & Filters
    const [activeTab, setActiveTab] = useState<'cursos' | 'materias'>('cursos');
    const [searchTerm, setSearchTerm] = useState('');
    const [nivelActivo, setNivelActivo] = useState('');
    const [sedeSel, setSedeSel] = useState('todas');
    const [vistaGrid, setVistaGrid] = useState(true);
    const [areaFiltro, setAreaFiltro] = useState('');

    // Modals
    const [showCursoModal, setShowCursoModal] = useState(false);
    const [showMateriaModal, setShowMateriaModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showProfesoresModal, setShowProfesoresModal] = useState(false);
    const [cursoDetalle, setCursoDetalle] = useState<Curso | null>(null);
    const [detalleTab, setDetalleTab] = useState<'materias' | 'estudiantes'>('materias');

    // CRUD state
    const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
    const [editingMateria, setEditingMateria] = useState<Materia | null>(null);
    const [managingProfesoresMateria, setManagingProfesoresMateria] = useState<Materia | null>(null);
    const [deletingItem, setDeletingItem] = useState<{ type: 'curso' | 'materia'; id: number; nombre: string } | null>(null);
    const [cursoForm, setCursoForm] = useState({ ...EMPTY_CURSO });
    const [materiaForm, setMateriaForm] = useState({ ...EMPTY_MATERIA });
    const [materiasAsignadas, setMateriasAsignadas] = useState<MateriaAsignada[]>([]);
    const [profesoresSeleccionados, setProfesoresSeleccionados] = useState<number[]>([]);
    const [processing, setProcessing] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [cursoModalStep, setCursoModalStep] = useState<1 | 2>(1);

    // Derived data
    const areas = useMemo(() => [...new Set(materias.map(m => m.area).filter(Boolean))], [materias]);

    const filteredCursos = useMemo(() => {
        return cursos.filter(c => {
            const nivelNorm = (c.nivel === 'preescolar' || c.nivel === 'transicion') ? 'prejardin' : c.nivel;
            if (nivelActivo && nivelNorm !== nivelActivo) return false;
            if (sedeSel !== 'todas' && String(c.sede_id ?? '') !== sedeSel) return false;
            if (searchTerm) {
                const s = searchTerm.toLowerCase();
                return (
                    c.nombre.toLowerCase().includes(s) ||
                    c.grado.toLowerCase().includes(s) ||
                    c.profesor_guia.toLowerCase().includes(s) ||
                    c.seccion.toLowerCase().includes(s) ||
                    c.materias_nombres.some(m => m.toLowerCase().includes(s))
                );
            }
            return true;
        });
    }, [cursos, nivelActivo, searchTerm, sedeSel]);

    const filteredMaterias = useMemo(() => {
        return materias.filter(m => {
            if (areaFiltro && m.area !== areaFiltro) return false;
            if (searchTerm) {
                const s = searchTerm.toLowerCase();
                return m.nombre.toLowerCase().includes(s) || m.area.toLowerCase().includes(s) || m.profesores.some(p => p.name.toLowerCase().includes(s));
            }
            return true;
        });
    }, [materias, areaFiltro, searchTerm]);

    // Profesores filtrados por la sede del curso (o todos si no hay sede)
    const profesoresBySedeOrAll = useMemo(() => {
        if (!cursoForm.sede_id) return listaProfesores;
        return listaProfesores.filter(p => !p.sede_id || String(p.sede_id) === cursoForm.sede_id);
    }, [listaProfesores, cursoForm.sede_id]);

    const openDetalle = (curso: Curso) => { setDetalleTab('materias'); setCursoDetalle(curso); };

    const stats = useMemo(() => ({
        totalCursos: cursos.length,
        totalMaterias: materias.length,
        totalEstudiantes: totalEstudiantes,
        totalProfesores: [...new Set(cursos.map(c => c.profesor_guia).filter(p => p !== 'Sin asignar'))].length,
        promedioEstudiantes: cursos.length > 0 ? Math.round(totalEstudiantes / cursos.length) : 0,
    }), [cursos, materias, totalEstudiantes]);

    const cursosAgrupados = useMemo(() => {
        const agrupados: Record<string, Curso[]> = {};
        filteredCursos.forEach(c => {
            const grupo = (c.nivel === 'preescolar' || c.nivel === 'transicion') ? 'prejardin' : c.nivel;
            if (!agrupados[grupo]) agrupados[grupo] = [];
            agrupados[grupo].push(c);
        });
        return agrupados;
    }, [filteredCursos]);

    /* ─── Curso CRUD ─── */
    const openCreateCurso = () => {
        setEditingCurso(null);
        setCursoForm({ ...EMPTY_CURSO });
        setMateriasAsignadas([]);
        setFormErrors({});
        setCursoModalStep(1);
        setShowCursoModal(true);
    };

    const openEditCurso = (curso: Curso) => {
        setEditingCurso(curso);
        const nivelNorm = (curso.nivel === 'preescolar' || curso.nivel === 'transicion') ? 'prejardin' : curso.nivel;
        setCursoForm({
            nombre: curso.nombre,
            nivel: nivelNorm,
            grado: curso.grado,
            grupo: curso.seccion,
            jornada: curso.jornada,
            cupo_maximo: curso.cupo_maximo?.toString() || '35',
            director_grupo_id: curso.director_grupo_id?.toString() || '',
            sede_id: curso.sede_id?.toString() || '',
        });
        // Cargar materias existentes del curso con sus profesor_id reales
        setMateriasAsignadas(
            curso.materias
                .filter(m => m.id)
                .map(m => ({
                    materia_id: m.id,
                    profesor_id: m.profesor_id ?? null,
                }))
        );
        setFormErrors({});
        setCursoModalStep(1);
        setShowCursoModal(true);
    };

    const addMateriaAsignada = () => {
        setMateriasAsignadas(prev => [...prev, { materia_id: 0, profesor_id: null }]);
    };

    const removeMateriaAsignada = (index: number) => {
        setMateriasAsignadas(prev => prev.filter((_, i) => i !== index));
    };

    const updateMateriaAsignada = (index: number, field: keyof MateriaAsignada, value: number | null) => {
        setMateriasAsignadas(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
    };

    const materiasDisponiblesParaAsignar = useMemo(() => {
        const asignadasIds = materiasAsignadas.map(m => m.materia_id);
        return materias.filter(m => !asignadasIds.includes(m.id));
    }, [materias, materiasAsignadas]);

    const handleCursoSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Step 1 validation
        if (cursoModalStep === 1) {
            const errors: Record<string, string> = {};
            if (!cursoForm.nombre.trim()) errors.nombre = 'Requerido';
            if (!cursoForm.nivel) errors.nivel = 'Seleccione nivel';
            if (!cursoForm.grado.trim()) errors.grado = 'Requerido';
            if (!cursoForm.grupo.trim()) errors.grupo = 'Requerido';
            if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
            setCursoModalStep(2);
            return;
        }

        // Step 2 validation - materias
        const validMaterias = materiasAsignadas.filter(m => m.materia_id > 0 && m.profesor_id);
        const invalidMaterias = materiasAsignadas.some(m => m.materia_id > 0 && !m.profesor_id);
        if (invalidMaterias) {
            setFormErrors({ materias: 'Cada materia debe tener un profesor asignado' });
            return;
        }

        setProcessing(true);
        const payload: Record<string, any> = {
            nombre: cursoForm.nombre,
            nivel: cursoForm.nivel,
            grado: cursoForm.grado,
            grupo: cursoForm.grupo,
            jornada: cursoForm.jornada,
            cupo_maximo: cursoForm.cupo_maximo ? parseInt(cursoForm.cupo_maximo) : null,
            director_grupo_id: cursoForm.director_grupo_id ? parseInt(cursoForm.director_grupo_id) : null,
            sede_id: cursoForm.sede_id ? parseInt(cursoForm.sede_id) : null,
            materias_asignadas: validMaterias.map(m => ({ materia_id: m.materia_id, profesor_id: m.profesor_id })),
        };

        if (editingCurso) {
            router.put(`/admin/cursos/${editingCurso.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => { setShowCursoModal(false); setProcessing(false); },
                onError: (errs) => {
                    setFormErrors(errs as Record<string, string>);
                    setProcessing(false);
                    const step1Fields = ['nombre', 'nivel', 'grado', 'grupo', 'jornada', 'cupo_maximo', 'director_grupo_id', 'sede_id'];
                    if (step1Fields.some(f => (errs as Record<string, string>)[f])) setCursoModalStep(1);
                },
            });
        } else {
            router.post('/admin/cursos', payload, {
                preserveScroll: true,
                onSuccess: () => { setShowCursoModal(false); setProcessing(false); },
                onError: (errs) => {
                    setFormErrors(errs as Record<string, string>);
                    setProcessing(false);
                    const step1Fields = ['nombre', 'nivel', 'grado', 'grupo', 'jornada', 'cupo_maximo', 'director_grupo_id', 'sede_id'];
                    if (step1Fields.some(f => (errs as Record<string, string>)[f])) setCursoModalStep(1);
                },
            });
        }
    };

    /* ─── Materia CRUD ─── */
    const openCreateMateria = () => {
        setEditingMateria(null);
        setMateriaForm({ ...EMPTY_MATERIA });
        setFormErrors({});
        setShowMateriaModal(true);
    };

    const openEditMateria = (materia: Materia) => {
        setEditingMateria(materia);
        setMateriaForm({
            nombre: materia.nombre,
            area: materia.area,
            codigo: materia.codigo || '',
            horas_semanales: materia.horasSemanales?.toString() || '4',
        });
        setFormErrors({});
        setShowMateriaModal(true);
    };

    const handleMateriaSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const errors: Record<string, string> = {};
        if (!materiaForm.nombre.trim()) errors.nombre = 'Requerido';
        if (!materiaForm.area.trim()) errors.area = 'Requerido';
        if (!materiaForm.codigo.trim()) errors.codigo = 'Requerido';
        if (!materiaForm.horas_semanales) errors.horas_semanales = 'Requerido';
        if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }

        setProcessing(true);
        const payload = {
            nombre: materiaForm.nombre,
            area: materiaForm.area,
            codigo: materiaForm.codigo,
            horas_semanales: parseInt(materiaForm.horas_semanales),
        };

        if (editingMateria) {
            router.put(`/admin/materias/${editingMateria.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => { setShowMateriaModal(false); setProcessing(false); },
                onError: (errs) => { setFormErrors(errs as Record<string, string>); setProcessing(false); },
            });
        } else {
            router.post('/admin/materias', payload, {
                preserveScroll: true,
                onSuccess: () => { setShowMateriaModal(false); setProcessing(false); },
                onError: (errs) => { setFormErrors(errs as Record<string, string>); setProcessing(false); },
            });
        }
    };

    /* ─── Gestionar Profesores de Materia ─── */
    const openProfesoresModal = (materia: Materia) => {
        setManagingProfesoresMateria(materia);
        setProfesoresSeleccionados(materia.profesores.map(p => p.id));
        setShowProfesoresModal(true);
    };

    const handleProfesoresSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!managingProfesoresMateria) return;
        setProcessing(true);
        router.post(`/admin/materias/${managingProfesoresMateria.id}/profesores`, {
            profesores_ids: profesoresSeleccionados,
        }, {
            preserveScroll: true,
            onSuccess: () => { setShowProfesoresModal(false); setManagingProfesoresMateria(null); setProcessing(false); },
            onError: () => setProcessing(false),
        });
    };

    const toggleProfesorSeleccionado = (profesorId: number) => {
        setProfesoresSeleccionados(prev =>
            prev.includes(profesorId) ? prev.filter(id => id !== profesorId) : [...prev, profesorId]
        );
    };

    /* ─── Delete ─── */
    const openDeleteConfirm = (type: 'curso' | 'materia', id: number, nombre: string) => {
        setDeletingItem({ type, id, nombre });
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (!deletingItem) return;
        setProcessing(true);
        const url = deletingItem.type === 'curso' ? `/admin/cursos/${deletingItem.id}` : `/admin/materias/${deletingItem.id}`;
        router.delete(url, {
            preserveScroll: true,
            onSuccess: () => { setShowDeleteModal(false); setDeletingItem(null); setProcessing(false); },
            onError: () => setProcessing(false),
        });
    };

    /* ─── Input helper ─── */
    const inputClass = (field: string) =>
        `w-full px-4 py-2.5 border rounded-xl text-sm transition-all focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] ${formErrors[field] ? 'border-red-300 bg-red-50/50' : 'border-gray-200'}`;

    /* ═══════════════════════════ RENDER ═══════════════════════════ */
    return (
        <SidebarLayout menuItems={adminMenuItems} title="Cursos & Materias">
            <Head title="Cursos & Materias" />

            <div className="space-y-5" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>
                            Cursos & Materias
                        </h1>
                        <p className="text-gray-500 text-sm">Administra la estructura académica — Año {anio}</p>
                    </div>
                    <button
                        onClick={() => activeTab === 'cursos' ? openCreateCurso() : openCreateMateria()}
                        className="flex items-center gap-2 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-[#293577]/25 transition-all text-sm font-medium"
                    >
                        <PlusIcon />
                        {activeTab === 'cursos' ? 'Nuevo Curso' : 'Nueva Materia'}
                    </button>
                </div>

                {/* ── Stats Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {[
                        { label: 'Cursos',        value: stats.totalCursos,        color: 'from-blue-500 to-blue-600',    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" /></svg> },
                        { label: 'Materias',      value: stats.totalMaterias,      color: 'from-indigo-500 to-indigo-600', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg> },
                        { label: 'Estudiantes',   value: stats.totalEstudiantes,   color: 'from-emerald-500 to-emerald-600', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg> },
                        { label: 'Profesores',    value: stats.totalProfesores,    color: 'from-amber-500 to-amber-600',   icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg> },
                        { label: 'Prom. / Curso', value: stats.promedioEstudiantes, color: 'from-purple-500 to-purple-600', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg> },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                                <span className={`bg-gradient-to-br ${stat.color} text-white p-2 rounded-lg flex items-center justify-center`}>{stat.icon}</span>
                                <div className={`w-8 h-1 rounded-full bg-gradient-to-r ${stat.color}`} />
                            </div>
                            <p className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>{stat.value}</p>
                            <p className="text-xs text-gray-500">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* ── Tabs + Vista Toggle ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="bg-white rounded-xl shadow-sm p-1 inline-flex">
                        <button
                            onClick={() => { setActiveTab('cursos'); setSearchTerm(''); setAreaFiltro(''); }}
                            className={`px-5 py-2 rounded-lg font-medium transition-all text-sm ${activeTab === 'cursos' ? 'bg-gradient-to-r from-[#293577] to-[#181b49] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" /></svg>
                                Cursos ({cursos.length})
                            </span>
                        </button>
                        <button
                            onClick={() => { setActiveTab('materias'); setSearchTerm(''); setNivelActivo(''); }}
                            className={`px-5 py-2 rounded-lg font-medium transition-all text-sm ${activeTab === 'materias' ? 'bg-gradient-to-r from-[#293577] to-[#181b49] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
                                Materias ({materias.length})
                            </span>
                        </button>
                    </div>
                    {activeTab === 'cursos' && (
                        <div className="flex items-center gap-2">
                            <button onClick={() => setVistaGrid(true)} className={`p-2 rounded-lg transition-colors ${vistaGrid ? 'bg-[#293577] text-white' : 'bg-white text-gray-500 hover:bg-gray-100 shadow-sm'}`}><GridIcon /></button>
                            <button onClick={() => setVistaGrid(false)} className={`p-2 rounded-lg transition-colors ${!vistaGrid ? 'bg-[#293577] text-white' : 'bg-white text-gray-500 hover:bg-gray-100 shadow-sm'}`}><ListIcon /></button>
                        </div>
                    )}
                </div>

                {/* ── Search + Filters ── */}
                <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800"><SearchIcon className="w-4 h-4" /></span>
                            <input
                                type="text"
                                placeholder={activeTab === 'cursos' ? 'Buscar por nombre, grado, profesor o materia...' : 'Buscar materia, área o profesor...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all"
                            />
                        </div>
                        {activeTab === 'materias' && (
                            <div className="relative min-w-[180px]">
                                <select value={areaFiltro} onChange={(e) => setAreaFiltro(e.target.value)} className="appearance-none w-full pl-4 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]">
                                    <option value="">Todas las áreas</option>
                                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                                <svg className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg>
                            </div>
                        )}
                    </div>
                    {activeTab === 'cursos' && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <button onClick={() => setNivelActivo('')} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${!nivelActivo ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                                Todos
                            </button>
                            {nivelesKeys.map(k => (
                                <button key={k} onClick={() => setNivelActivo(nivelActivo === k ? '' : k)} className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${nivelActivo === k ? `${nivelesEducativos[k].bg} ${nivelesEducativos[k].color} ${nivelesEducativos[k].border}` : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                                    {nivelesEducativos[k].label} ({cursos.filter(c => (c.nivel === k) || (k === 'prejardin' && (c.nivel === 'transicion' || c.nivel === 'preescolar'))).length})
                                </button>
                            ))}
                            {sedes.length > 1 && (
                                <select
                                    value={sedeSel}
                                    onChange={e => setSedeSel(e.target.value)}
                                    className="ml-auto min-w-[160px] pl-3 pr-8 py-1.5 border border-gray-200 rounded-lg text-xs bg-white appearance-none focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]"
                                >
                                    <option value="todas">Todas las sedes</option>
                                    {sedes.map(s => <option key={s.id} value={String(s.id)}>{s.nombre}</option>)}
                                </select>
                            )}
                        </div>
                    )}
                </div>

                {/* ═══════ CURSOS TAB ═══════ */}
                {activeTab === 'cursos' && (
                    <>
                        {filteredCursos.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" /></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-700 mb-1">No se encontraron cursos</h3>
                                <p className="text-sm text-gray-500 mb-4">Intenta ajustar los filtros o crea un nuevo curso</p>
                                <button onClick={openCreateCurso} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-5 py-2.5 rounded-xl hover:shadow-lg text-sm font-medium">
                                    <PlusIcon /> Crear primer curso
                                </button>
                            </div>
                        ) : vistaGrid ? (
                            /* ── Grid agrupado por nivel ── */
                            <div className="space-y-6">
                                {Object.entries(cursosAgrupados).map(([nivel, cursosList]) => (
                                    <div key={nivel}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`h-0.5 flex-1 rounded-full bg-gradient-to-r ${nivelCardAccent[nivel]}`} style={{ opacity: 0.3 }} />
                                            <h2 className={`text-sm font-bold uppercase tracking-wider ${nivelesEducativos[nivel]?.color || 'text-gray-700'}`}>
                                                {nivelesEducativos[nivel]?.label || nivel} ({cursosList.length} {cursosList.length === 1 ? 'curso' : 'cursos'})
                                            </h2>
                                            <div className={`h-0.5 flex-1 rounded-full bg-gradient-to-r ${nivelCardAccent[nivel]}`} style={{ opacity: 0.3 }} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {cursosList.map(curso => (
                                                <div key={curso.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all group overflow-hidden flex flex-col">
                                                    <div className={`h-1.5 bg-gradient-to-r ${nivelCardAccent[curso.nivel] || 'from-gray-400 to-gray-500'}`} />
                                                    <div className="p-5 flex-1">
                                                        <div className="flex items-start gap-3 mb-4 cursor-pointer" onClick={() => openDetalle(curso)}>
                                                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${nivelCardAccent[curso.nivel] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0`}>
                                                                {curso.grado.replace('Transición', 'T').replace('Pre-Jardín', 'PJ').replace('Jardín', 'J').substring(0, 3)}{curso.seccion}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <h3 className="font-bold text-gray-800 text-sm group-hover:text-[#293577] transition-colors truncate">{curso.nombre || `${curso.grado} - ${curso.seccion}`}</h3>
                                                                <div className="flex flex-wrap gap-1 mt-0.5">
                                                                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${nivelBadgeColors[curso.nivel] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                                        {nivelesEducativos[curso.nivel]?.label || curso.nivel}
                                                                    </span>
                                                                    {curso.sede_nombre && <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">{curso.sede_nombre}</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                                                            <span className="truncate">Guía: <strong>{curso.profesor_guia}</strong></span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                                                                <p className="text-lg font-extrabold text-[#293577]" style={{ fontFamily: "'Inter', sans-serif" }}>{curso.estudiantes}</p>
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Estudiantes</p>
                                                            </div>
                                                            <div className="bg-gray-50 rounded-lg p-2 text-center">
                                                                <p className="text-lg font-extrabold text-emerald-600" style={{ fontFamily: "'Inter', sans-serif" }}>{curso.materias.length}</p>
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Materias</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* ── Barra de acciones siempre visible ── */}
                                                    <div className="px-4 pb-4 flex gap-2">
                                                        <button
                                                            onClick={() => openDetalle(curso)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium text-[#293577] bg-[#293577]/5 hover:bg-[#293577]/10 rounded-lg transition-colors"
                                                        >
                                                            <EyeIcon /> Ver detalle
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openEditCurso(curso); }}
                                                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                        >
                                                            <EditIcon /> Editar
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); openDeleteConfirm('curso', curso.id, curso.nombre); }}
                                                            className="flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium text-red-400 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <TrashIcon />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* ── List View ── */
                            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[700px]">
                                        <thead className="bg-gradient-to-r from-[#181b49] to-[#293577] text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Curso</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Nivel</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium uppercase">Profesor Guía</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium uppercase">Estudiantes</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium uppercase">Materias</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium uppercase">Jornada</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium uppercase">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredCursos.map(curso => (
                                                <tr key={curso.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${nivelCardAccent[curso.nivel] || 'from-gray-400 to-gray-500'} flex items-center justify-center text-white font-bold text-xs`}>
                                                                {curso.grado.substring(0, 2)}{curso.seccion}
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-gray-800 text-sm">{curso.nombre || `${curso.grado} - ${curso.seccion}`}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-xs px-2 py-1 rounded-full border font-medium ${nivelBadgeColors[curso.nivel] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                            {nivelesEducativos[curso.nivel]?.label || curso.nivel}
                                                        </span>
                                                        {curso.sede_nombre && <span className="ml-1 text-xs px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">{curso.sede_nombre}</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{curso.profesor_guia}</td>
                                                    <td className="px-4 py-3 text-center"><span className="text-sm font-bold text-[#293577]">{curso.estudiantes}</span></td>
                                                    <td className="px-4 py-3 text-center"><span className="text-sm font-bold text-emerald-600">{curso.materias.length}</span></td>
                                                    <td className="px-4 py-3 text-center"><span className="text-xs text-gray-500">{curso.jornada}</span></td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button onClick={() => openDetalle(curso)} className="p-1.5 text-[#293577] hover:bg-blue-50 rounded-lg transition-colors" title="Ver detalle">
                                                                <EyeIcon />
                                                            </button>
                                                            <button onClick={() => openEditCurso(curso)} className="p-1.5 text-gray-400 hover:text-[#293577] hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                                                <EditIcon />
                                                            </button>
                                                            <button onClick={() => openDeleteConfirm('curso', curso.id, curso.nombre)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                                                <TrashIcon />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ═══════ MATERIAS TAB ═══════ */}
                {activeTab === 'materias' && (
                    <>
                        {filteredMaterias.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-700 mb-1">No se encontraron materias</h3>
                                <p className="text-sm text-gray-500 mb-4">Intenta ajustar los filtros o crea una nueva materia</p>
                                <button onClick={openCreateMateria} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-5 py-2.5 rounded-xl hover:shadow-lg text-sm font-medium">
                                    <PlusIcon /> Crear primera materia
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredMaterias.map(materia => {
                                    const style = getMateriaStyle(materia.nombre);
                                    return (
                                        <div key={materia.id} className={`bg-white rounded-xl shadow-sm border ${style.colorBorder} hover:shadow-lg transition-all overflow-hidden flex flex-col`}>
                                            <div className={`${style.colorBg} p-4 border-b ${style.colorBorder}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className={`${style.colorText} w-9 h-9 flex items-center justify-center rounded-xl bg-white/70 shadow-sm flex-shrink-0`}>{style.icono}</span>
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className={`font-bold text-base ${style.colorText} truncate`}>{materia.nombre}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-gray-500">{materia.area}</span>
                                                            {materia.codigo && <span className="text-[10px] bg-white/60 px-1.5 py-0.5 rounded font-mono text-gray-500">{materia.codigo}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4 space-y-3 flex-1">
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <p className="text-lg font-extrabold text-[#293577]" style={{ fontFamily: "'Inter', sans-serif" }}>{materia.cursos}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase">Cursos</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <p className="text-lg font-extrabold text-emerald-600" style={{ fontFamily: "'Inter', sans-serif" }}>{materia.profesores.length}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase">Profesores</p>
                                                    </div>
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <p className="text-lg font-extrabold text-amber-600" style={{ fontFamily: "'Inter', sans-serif" }}>{materia.horasSemanales || '-'}</p>
                                                        <p className="text-[10px] text-gray-500 uppercase">Hrs/Sem</p>
                                                    </div>
                                                </div>
                                                {/* Profesores autorizados */}
                                                {materia.profesores.length > 0 ? (
                                                    <div>
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Profesores autorizados</p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {materia.profesores.map((p) => (
                                                                <div key={p.id} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full pl-1 pr-2.5 py-0.5">
                                                                    <div className={`w-5 h-5 rounded-full ${style.colorBg} ${style.colorText} flex items-center justify-center text-[9px] font-bold`}>{p.name.charAt(0)}</div>
                                                                    <span className="text-xs text-gray-700">{p.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`${style.colorBg} border border-dashed ${style.colorBorder} rounded-lg px-3 py-2`}>
                                                        <p className="text-xs text-amber-600 font-medium">⚠ Sin profesores autorizados</p>
                                                        <p className="text-[11px] text-gray-500 mt-0.5">Nadie puede dictar esta materia hasta que asignes profesores</p>
                                                    </div>
                                                )}
                                            </div>
                                            {/* ── Barra de acciones siempre visible ── */}
                                            <div className="px-4 pb-4 flex gap-2">
                                                <button
                                                    onClick={() => openProfesoresModal(materia)}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium ${style.colorText} ${style.colorBg} hover:brightness-95 border ${style.colorBorder} rounded-lg transition-colors`}
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
                                                    Asignar profesores
                                                </button>
                                                <button
                                                    onClick={() => openEditMateria(materia)}
                                                    className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                                                    title="Editar materia"
                                                >
                                                    <EditIcon className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => openDeleteConfirm('materia', materia.id, materia.nombre)}
                                                    className="flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium text-red-400 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Eliminar materia"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* ─── Modal Crear/Editar CURSO (2 pasos) ─── */}
            {showCursoModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCursoModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#181b49] to-[#293577] rounded-t-2xl px-6 py-4 flex-shrink-0">
                            <h2 className="text-lg font-bold text-white">{editingCurso ? 'Editar Curso' : 'Nuevo Curso'}</h2>
                            <p className="text-blue-200 text-xs">{editingCurso ? 'Modifica los datos y materias del curso' : 'Configura el curso y asigna sus materias'}</p>
                            {/* Steps indicator */}
                            <div className="flex items-center gap-3 mt-3">
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${cursoModalStep === 1 ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'}`}>
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${cursoModalStep === 1 ? 'bg-white text-[#293577]' : 'bg-white/20 text-white/60'}`}>1</span>
                                    Datos del curso
                                </div>
                                <div className="w-6 h-px bg-white/30" />
                                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${cursoModalStep === 2 ? 'bg-white/20 text-white' : 'bg-white/5 text-white/50'}`}>
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${cursoModalStep === 2 ? 'bg-white text-[#293577]' : 'bg-white/20 text-white/60'}`}>2</span>
                                    Asignar materias
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleCursoSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-6 space-y-4 overflow-y-auto flex-1">
                                {/* ── PASO 1: Datos del curso ── */}
                                {cursoModalStep === 1 && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del curso *</label>
                                            <input type="text" placeholder="Ej: Sexto A" value={cursoForm.nombre} onChange={e => setCursoForm({ ...cursoForm, nombre: e.target.value })} className={inputClass('nombre')} />
                                            {formErrors.nombre && <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nivel Educativo *</label>
                                            <select value={cursoForm.nivel} onChange={e => setCursoForm({ ...cursoForm, nivel: e.target.value })} className={inputClass('nivel')}>
                                                <option value="">Seleccionar nivel...</option>
                                                {nivelesKeys.map(k => <option key={k} value={k}>{nivelesEducativos[k].label}</option>)}
                                            </select>
                                            {formErrors.nivel && <p className="text-xs text-red-500 mt-1">{formErrors.nivel}</p>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Grado *</label>
                                                <input type="text" placeholder="Ej: 6°" value={cursoForm.grado} onChange={e => setCursoForm({ ...cursoForm, grado: e.target.value })} className={inputClass('grado')} />
                                                {formErrors.grado && <p className="text-xs text-red-500 mt-1">{formErrors.grado}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo *</label>
                                                <input type="text" placeholder="Ej: A" value={cursoForm.grupo} onChange={e => setCursoForm({ ...cursoForm, grupo: e.target.value })} className={inputClass('grupo')} />
                                                {formErrors.grupo && <p className="text-xs text-red-500 mt-1">{formErrors.grupo}</p>}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Jornada</label>
                                                <select value={cursoForm.jornada} onChange={e => setCursoForm({ ...cursoForm, jornada: e.target.value })} className={inputClass('jornada')}>
                                                    <option>Mañana</option>
                                                    <option>Tarde</option>
                                                    <option>Completa</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Cupo máximo</label>
                                                <input type="number" min="1" max="60" value={cursoForm.cupo_maximo} onChange={e => setCursoForm({ ...cursoForm, cupo_maximo: e.target.value })} className={inputClass('cupo_maximo')} />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Profesor Guía (Director de Grupo)</label>
                                            <select value={cursoForm.director_grupo_id} onChange={e => setCursoForm({ ...cursoForm, director_grupo_id: e.target.value })} className={inputClass('director_grupo_id')}>
                                                <option value="">Sin asignar</option>
                                                {listaProfesores.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>
                                        {sedes.length > 0 && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Sede</label>
                                                <select value={cursoForm.sede_id} onChange={e => setCursoForm({ ...cursoForm, sede_id: e.target.value })} className={inputClass('sede_id')}>
                                                    <option value="">Sin asignar</option>
                                                    {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}{s.ciudad ? ` — ${s.ciudad}` : ''}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* ── PASO 2: Asignar materias y profesores ── */}
                                {cursoModalStep === 2 && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-800">Plan de estudios</h3>
                                                <p className="text-xs text-gray-500">Asigna materias y el profesor responsable de cada una</p>
                                            </div>
                                            <span className="text-xs font-medium text-[#293577] bg-[#293577]/10 px-2.5 py-1 rounded-full">
                                                {materiasAsignadas.filter(m => m.materia_id > 0).length} materia{materiasAsignadas.filter(m => m.materia_id > 0).length !== 1 ? 's' : ''}
                                            </span>
                                        </div>

                                        {formErrors.materias && (
                                            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                                                <p className="text-xs text-red-600 font-medium">{formErrors.materias}</p>
                                            </div>
                                        )}

                                        {/* Lista de materias asignadas */}
                                        <div className="space-y-2.5">
                                            {materiasAsignadas.map((ma, idx) => {
                                                const materiaInfo = materias.find(m => m.id === ma.materia_id);
                                                const style = materiaInfo ? getMateriaStyle(materiaInfo.nombre) : defaultMateriaColor;
                                                return (
                                                    <div key={idx} className={`border rounded-xl p-3 transition-all ${ma.materia_id > 0 ? `${style.colorBorder} ${style.colorBg}` : 'border-gray-200 bg-gray-50'}`}>
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                <div>
                                                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Materia</label>
                                                                    <select
                                                                        value={ma.materia_id || ''}
                                                                        onChange={e => updateMateriaAsignada(idx, 'materia_id', parseInt(e.target.value) || 0)}
                                                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] bg-white"
                                                                    >
                                                                        <option value="">Seleccionar materia...</option>
                                                                        {/* Mostrar la materia actualmente seleccionada + las disponibles */}
                                                                        {materias
                                                                            .filter(m => m.id === ma.materia_id || !materiasAsignadas.some(a => a.materia_id === m.id && a !== ma))
                                                                            .map(m => <option key={m.id} value={m.id}>{getMateriaStyle(m.nombre).icono} {m.nombre}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-[11px] font-medium text-gray-500 mb-1">Profesor</label>
                                                                    <ProfSearchSelect
                                                                        options={
                                                                            ma.materia_id > 0 && (materiasProfesores[ma.materia_id]?.length ?? 0) > 0
                                                                                ? materiasProfesores[ma.materia_id]
                                                                                : profesoresBySedeOrAll
                                                                        }
                                                                        value={ma.profesor_id}
                                                                        onChange={v => updateMateriaAsignada(idx, 'profesor_id', v)}
                                                                    />
                                                                    {ma.materia_id > 0 && (materiasProfesores[ma.materia_id]?.length ?? 0) === 0 && (
                                                                        <p className="text-[10px] text-amber-500 mt-0.5">
                                                                            ⚠ Sin profesores asignados — {cursoForm.sede_id ? 'mostrando profesores de la sede' : 'mostrando todos'}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeMateriaAsignada(idx)}
                                                                className="mt-5 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                                                title="Quitar materia"
                                                            >
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Botón agregar materia */}
                                        {materiasDisponiblesParaAsignar.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={addMateriaAsignada}
                                                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#293577] hover:text-[#293577] hover:bg-[#293577]/5 transition-all"
                                            >
                                                <PlusIcon /> Agregar materia ({materiasDisponiblesParaAsignar.length} disponibles)
                                            </button>
                                        )}

                                        {materiasAsignadas.length === 0 && (
                                            <div className="text-center py-6">
                                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                                                    <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>
                                                </div>
                                                <p className="text-sm text-gray-500">No hay materias asignadas a este curso</p>
                                                <p className="text-xs text-gray-400 mt-1">Haz clic en "Agregar materia" para comenzar</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Footer con botones */}
                            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                                {cursoModalStep === 1 ? (
                                    <>
                                        <button type="button" onClick={() => setShowCursoModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                            Cancelar
                                        </button>
                                        <button type="submit" className="flex-1 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-[#293577]/25 text-sm font-medium flex items-center justify-center gap-2">
                                            Siguiente: Materias
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button type="button" onClick={() => { setCursoModalStep(1); setFormErrors({}); }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600 flex items-center justify-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                                            Volver
                                        </button>
                                        <button type="submit" disabled={processing} className="flex-1 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-[#293577]/25 text-sm font-medium disabled:opacity-50">
                                            {processing ? 'Guardando...' : editingCurso ? 'Guardar cambios' : 'Crear Curso'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Modal Crear/Editar MATERIA ─── */}
            {showMateriaModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowMateriaModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#181b49] to-[#293577] rounded-t-2xl px-6 py-4">
                            <h2 className="text-lg font-bold text-white">{editingMateria ? 'Editar Materia' : 'Nueva Materia'}</h2>
                            <p className="text-blue-200 text-xs">{editingMateria ? 'Modifica los datos de la materia' : 'Agregar una nueva materia al plan de estudios'}</p>
                        </div>
                        <form onSubmit={handleMateriaSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la materia *</label>
                                <input type="text" placeholder="Ej: Matemáticas" value={materiaForm.nombre} onChange={e => setMateriaForm({ ...materiaForm, nombre: e.target.value })} className={inputClass('nombre')} />
                                {formErrors.nombre && <p className="text-xs text-red-500 mt-1">{formErrors.nombre}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Área *</label>
                                <input type="text" placeholder="Ej: Ciencias Exactas" value={materiaForm.area} onChange={e => setMateriaForm({ ...materiaForm, area: e.target.value })} className={inputClass('area')} list="areas-list" />
                                <datalist id="areas-list">
                                    {areas.map(a => <option key={a} value={a} />)}
                                </datalist>
                                {formErrors.area && <p className="text-xs text-red-500 mt-1">{formErrors.area}</p>}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                                    <input type="text" placeholder="Ej: MAT" maxLength={10} value={materiaForm.codigo} onChange={e => setMateriaForm({ ...materiaForm, codigo: e.target.value.toUpperCase() })} className={inputClass('codigo')} />
                                    {formErrors.codigo && <p className="text-xs text-red-500 mt-1">{formErrors.codigo}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Horas semanales *</label>
                                    <input type="number" min="1" max="10" value={materiaForm.horas_semanales} onChange={e => setMateriaForm({ ...materiaForm, horas_semanales: e.target.value })} className={inputClass('horas_semanales')} />
                                    {formErrors.horas_semanales && <p className="text-xs text-red-500 mt-1">{formErrors.horas_semanales}</p>}
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowMateriaModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processing} className="flex-1 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-4 py-2.5 rounded-xl hover:shadow-lg text-sm font-medium disabled:opacity-50">
                                    {processing ? 'Guardando...' : editingMateria ? 'Guardar cambios' : 'Crear Materia'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Modal Detalle CURSO ─── */}
            {cursoDetalle && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setCursoDetalle(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <div className={`bg-gradient-to-r ${nivelCardAccent[cursoDetalle.nivel] || 'from-gray-500 to-gray-600'} rounded-t-2xl px-6 py-5`}>
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-white font-extrabold text-lg">
                                    {cursoDetalle.grado.substring(0, 2)}{cursoDetalle.seccion}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{cursoDetalle.nombre || `${cursoDetalle.grado} - ${cursoDetalle.seccion}`}</h2>
                                    <p className="text-white/80 text-sm">{nivelesEducativos[cursoDetalle.nivel]?.label || cursoDetalle.nivel} · Jornada {cursoDetalle.jornada}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setDetalleTab('estudiantes')}
                                    className={`text-center p-3 rounded-xl transition-colors ${detalleTab === 'estudiantes' ? 'bg-[#293577] shadow-md' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    <p className={`text-2xl font-extrabold ${detalleTab === 'estudiantes' ? 'text-white' : 'text-[#293577]'}`} style={{ fontFamily: "'Inter', sans-serif" }}>{cursoDetalle.estudiantes}</p>
                                    <p className={`text-xs ${detalleTab === 'estudiantes' ? 'text-white/80' : 'text-gray-500'}`}>Estudiantes</p>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDetalleTab('materias')}
                                    className={`text-center p-3 rounded-xl transition-colors ${detalleTab === 'materias' ? 'bg-emerald-500 shadow-md' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    <p className={`text-2xl font-extrabold ${detalleTab === 'materias' ? 'text-white' : 'text-emerald-600'}`} style={{ fontFamily: "'Inter', sans-serif" }}>{cursoDetalle.materias.length}</p>
                                    <p className={`text-xs ${detalleTab === 'materias' ? 'text-white/80' : 'text-gray-500'}`}>Materias</p>
                                </button>
                                <div className="text-center p-3 bg-gray-50 rounded-xl">
                                    <p className="text-2xl font-extrabold text-amber-600" style={{ fontFamily: "'Inter', sans-serif" }}>{cursoDetalle.cupo_maximo || '-'}</p>
                                    <p className="text-xs text-gray-500">Cupo máx.</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-2">Profesor Guía</p>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                    <div className="w-10 h-10 rounded-full bg-[#293577] text-white flex items-center justify-center font-bold">{cursoDetalle.profesor_guia.charAt(0)}</div>
                                    <div>
                                        <p className="font-medium text-gray-800">{cursoDetalle.profesor_guia}</p>
                                        <p className="text-xs text-gray-500">Director(a) de grupo</p>
                                    </div>
                                </div>
                            </div>
                            {detalleTab === 'materias' && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Plan de estudios ({cursoDetalle.materias.length} materias)</p>
                                    {cursoDetalle.materias.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2">
                                            {cursoDetalle.materias.map((m, i) => (
                                                <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{getMateriaStyle(m.nombre).icono}</span>
                                                        <span className="text-sm font-medium text-gray-700">{m.nombre}</span>
                                                    </div>
                                                    {m.profesor && <span className="text-xs text-gray-500">{m.profesor}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-amber-500 italic">No hay materias asignadas a este curso</p>
                                    )}
                                </div>
                            )}
                            {detalleTab === 'estudiantes' && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Estudiantes matriculados ({cursoDetalle.estudiantes_lista.length})</p>
                                    {cursoDetalle.estudiantes_lista.length > 0 ? (
                                        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                                            {cursoDetalle.estudiantes_lista.map((est, i) => (
                                                <div key={est.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#293577] to-[#181b49] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                        {est.name.charAt(0)}{est.name.split(' ')[1]?.charAt(0) || ''}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-800 flex-1 truncate">{est.name}</span>
                                                    <span className="text-xs text-gray-400 flex-shrink-0">#{i + 1}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
                                            <p className="text-sm text-gray-400">No hay estudiantes matriculados</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setCursoDetalle(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                    Cerrar
                                </button>
                                <button
                                    onClick={() => { setCursoDetalle(null); openEditCurso(cursoDetalle); }}
                                    className="flex-1 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-4 py-2.5 rounded-xl hover:shadow-lg text-sm font-medium"
                                >
                                    Editar Curso
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Modal Confirmación ELIMINAR ─── */}
            {showDeleteModal && deletingItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setShowDeleteModal(false); setDeletingItem(null); }}>
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar {deletingItem.type === 'curso' ? 'curso' : 'materia'}?</h3>
                            <p className="text-sm text-gray-500 mb-1">
                                Estás a punto de eliminar <strong>{deletingItem.nombre}</strong>.
                            </p>
                            <p className="text-xs text-red-500 mb-6">Esta acción no se puede deshacer.</p>
                            <div className="flex gap-3">
                                <button onClick={() => { setShowDeleteModal(false); setDeletingItem(null); }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                    Cancelar
                                </button>
                                <button onClick={handleDelete} disabled={processing} className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl hover:bg-red-600 text-sm font-medium disabled:opacity-50">
                                    {processing ? 'Eliminando...' : 'Sí, eliminar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Modal Gestionar Profesores de Materia ─── */}
            {showProfesoresModal && managingProfesoresMateria && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowProfesoresModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-[#181b49] to-[#293577] rounded-t-2xl px-6 py-4 flex-shrink-0">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    {getMateriaStyle(managingProfesoresMateria.nombre).icono}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Asignar profesores</h2>
                                    <p className="text-blue-200 text-xs mt-0.5">{managingProfesoresMateria.nombre} · {managingProfesoresMateria.area}</p>
                                </div>
                            </div>
                            <div className="mt-3 bg-white/10 rounded-xl px-3 py-2">
                                <p className="text-white/80 text-xs">
                                    Los profesores seleccionados aquí podrán ser asignados a esta materia cuando configures un curso.
                                </p>
                            </div>
                        </div>
                        <form onSubmit={handleProfesoresSubmit} className="flex flex-col flex-1 overflow-hidden">
                            <div className="p-4 overflow-y-auto flex-1">
                                <div className="mb-3 flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-700">
                                        <span className="text-[#293577]">{profesoresSeleccionados.length}</span>
                                        <span className="text-gray-400"> / {listaProfesores.length} profesores seleccionados</span>
                                    </p>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setProfesoresSeleccionados(listaProfesores.map(p => p.id))} className="text-xs text-[#293577] font-medium hover:underline">
                                            Seleccionar todos
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button type="button" onClick={() => setProfesoresSeleccionados([])} className="text-xs text-gray-500 hover:underline">
                                            Limpiar
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {listaProfesores.map(profesor => {
                                        const selected = profesoresSeleccionados.includes(profesor.id);
                                        const initials = profesor.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
                                        return (
                                            <button
                                                key={profesor.id}
                                                type="button"
                                                onClick={() => toggleProfesorSeleccionado(profesor.id)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${selected ? 'border-[#293577] bg-[#293577]/5' : 'border-gray-100 hover:border-gray-200 bg-gray-50'}`}
                                            >
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${selected ? 'bg-[#293577] text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                    {initials}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium text-sm truncate ${selected ? 'text-[#293577]' : 'text-gray-700'}`}>{profesor.name}</p>
                                                    <p className="text-[11px] text-gray-400">{selected ? '✓ Autorizado para dictar esta materia' : 'No asignado'}</p>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${selected ? 'border-[#293577] bg-[#293577]' : 'border-gray-300'}`}>
                                                    {selected && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {listaProfesores.length === 0 && (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                                            <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
                                        </div>
                                        <p className="text-sm text-gray-500">No hay profesores registrados</p>
                                    </div>
                                )}
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                                <button type="button" onClick={() => setShowProfesoresModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processing} className="flex-1 bg-gradient-to-r from-[#293577] to-[#181b49] text-white px-4 py-2.5 rounded-xl hover:shadow-lg hover:shadow-[#293577]/25 text-sm font-medium disabled:opacity-50">
                                    {processing ? 'Guardando...' : `Guardar (${profesoresSeleccionados.length} seleccionados)`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
