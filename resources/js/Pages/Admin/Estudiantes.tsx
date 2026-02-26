import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';
import * as XLSX from 'xlsx';

/* ─── Interfaces ─── */
interface Estudiante {
    id: number;
    nombre: string;
    identificacion: string;
    tipo_documento: string;
    nivel: string;
    curso_id?: number;
    curso_nombre: string;
    grado: string;
    seccion: string;
    acudiente: string;
    acudiente_id?: number;
    telefono: string;
    email: string;
    direccion: string;
    fecha_nacimiento: string;
    genero: string;
    estado: 'activo' | 'inactivo';
    promedio: number;
    pagos: 'al_dia' | 'pendiente' | 'moroso';
    observaciones: number;
}

interface Curso { id: number; nombre: string; nivel: string; grado: number | null; grupo: string; }
interface Padre { id: number; name: string; documento?: string; }
interface NotaItem { id: number; materia: string; periodo: string; tipo: string; valor: number; desc?: string; }
interface ObsItem { id: number; tipo: string; categoria: string; desc: string; fecha: string; profesor: string; }
interface PagoItem { id: number; concepto: string; monto: number; estado: string; metodo?: string; vence: string; pagado?: string; ref?: string; }

interface Props {
    estudiantes: Estudiante[];
    cursos: Curso[];
    padres: Padre[];
}

const NIVELES: Record<string, { label: string; color: string; activeBg: string; chipBg: string; chipText: string }> = {
    preescolar:   { label: 'Pre-escolar', color: 'bg-pink-500',    activeBg: 'bg-pink-500 text-white shadow-md',     chipBg: 'bg-pink-100',    chipText: 'text-pink-700' },
    transicion:   { label: 'Transición',  color: 'bg-purple-500',  activeBg: 'bg-purple-500 text-white shadow-md',   chipBg: 'bg-purple-100',  chipText: 'text-purple-700' },
    primaria:     { label: 'Primaria',    color: 'bg-blue-500',    activeBg: 'bg-blue-500 text-white shadow-md',     chipBg: 'bg-blue-100',    chipText: 'text-blue-700' },
    bachillerato: { label: 'Bachillerato',color: 'bg-emerald-500', activeBg: 'bg-emerald-500 text-white shadow-md',  chipBg: 'bg-emerald-100', chipText: 'text-emerald-700' },
};

const NIVEL_KEYS = Object.keys(NIVELES);
const onlyNumbers = (v: string) => v.replace(/[^0-9]/g, '');

export default function Estudiantes({ estudiantes, cursos, padres }: Props) {
    /* ─── Carga diferida ─── */
    const [hasLoaded, setHasLoaded] = useState(false);

    /* ─── Filtros ─── */
    const [busqueda, setBusqueda] = useState('');
    const [nivelSel, setNivelSel] = useState('todos');
    const [cursoSel, setCursoSel] = useState('todos');
    const [estadoSel, setEstadoSel] = useState('todos');
    const [pagosSel, setPagosSel] = useState('todos');

    /* ─── Detail modal ─── */
    const [selected, setSelected] = useState<Estudiante | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'notas' | 'observador' | 'pagos'>('info');

    /* ─── Sub-data loaded on-demand ─── */
    const [notasData, setNotasData] = useState<NotaItem[]>([]);
    const [obsData, setObsData] = useState<ObsItem[]>([]);
    const [pagosData, setPagosData] = useState<PagoItem[]>([]);
    const [loadingTab, setLoadingTab] = useState(false);

    /* ─── Edit modal ─── */
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', documento: '', tipo_documento: 'TI', direccion: '', fecha_nacimiento: '', genero: '', nivel_educativo: '', curso_id: '', acudiente_id: '' });
    const [editErrors, setEditErrors] = useState<Record<string, string>>({});
    const [editProcessing, setEditProcessing] = useState(false);

    /* ─── Message modal ─── */
    const [showMsgModal, setShowMsgModal] = useState(false);
    const [msgForm, setMsgForm] = useState({ asunto: '', contenido: '' });
    const [msgProcessing, setMsgProcessing] = useState(false);

    /* ─── Block modal ─── */
    const [showBlockModal, setShowBlockModal] = useState(false);

    /* ─── Notas accordion (open materias) ─── */
    const [openMaterias, setOpenMaterias] = useState<Set<string>>(new Set());
    const toggleMateria = (m: string) => setOpenMaterias(prev => { const s = new Set(prev); s.has(m) ? s.delete(m) : s.add(m); return s; });

    /* ─── Cursos disponibles filtrados por nivel ─── */
    const cursosDisponibles = useMemo(() => {
        if (nivelSel === 'todos') return cursos;
        return cursos.filter(c => c.nivel === nivelSel);
    }, [cursos, nivelSel]);

    /* ─── Cursos únicos para filtro dropdown ─── */
    const cursosParaFiltro = useMemo(() => {
        const base = nivelSel === 'todos' ? cursos : cursos.filter(c => c.nivel === nivelSel);
        return base;
    }, [cursos, nivelSel]);

    /* ─── Filtering ─── */
    const filtered = useMemo(() => estudiantes.filter(e => {
        const sb = busqueda.toLowerCase();
        const matchSearch = !busqueda || e.nombre.toLowerCase().includes(sb) || e.identificacion.includes(busqueda);
        const matchNivel = nivelSel === 'todos' || e.nivel === nivelSel;
        const matchCurso = cursoSel === 'todos' || e.curso_nombre === cursoSel;
        const matchEstado = estadoSel === 'todos' || e.estado === estadoSel;
        const matchPagos = pagosSel === 'todos' || e.pagos === pagosSel;
        return matchSearch && matchNivel && matchCurso && matchEstado && matchPagos;
    }), [estudiantes, busqueda, nivelSel, cursoSel, estadoSel, pagosSel]);

    /* ─── Helpers ─── */
    const nivelBadge = (n: string) => `${NIVELES[n]?.chipBg ?? 'bg-gray-100'} ${NIVELES[n]?.chipText ?? 'text-gray-700'}`;
    const nivelLabel = (n: string) => NIVELES[n]?.label ?? (n || 'Sin nivel');
    const estadoBadge = (s: string) => s === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
    const pagoBadge = (p: string) => p === 'al_dia' ? 'bg-green-100 text-green-800' : p === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800';
    const pagoLabel = (p: string) => p === 'al_dia' ? 'Al día' : p === 'pendiente' ? 'Pendiente' : 'Moroso';
    const promedioColor = (v: number) => v >= 4 ? 'text-green-600' : v >= 3 ? 'text-yellow-600' : 'text-red-600';

    const hayFiltros = nivelSel !== 'todos' || cursoSel !== 'todos' || estadoSel !== 'todos' || pagosSel !== 'todos' || busqueda !== '';

    // Si el usuario aplica algún filtro, cargar automáticamente
    useEffect(() => {
        if (hayFiltros) setHasLoaded(true);
    }, [hayFiltros]);

    const limpiarFiltros = () => { setNivelSel('todos'); setCursoSel('todos'); setEstadoSel('todos'); setPagosSel('todos'); setBusqueda(''); };

    /* ─── Select student ─── */
    const selectStudent = (est: Estudiante) => {
        setSelected(est);
        setActiveTab('info');
        setNotasData([]);
        setObsData([]);
        setPagosData([]);
        setOpenMaterias(new Set());
    };

    /* ─── Load tab data ─── */
    const loadTab = useCallback(async (tab: 'notas' | 'observador' | 'pagos', estId: number) => {
        setActiveTab(tab);
        setLoadingTab(true);
        try {
            const endpoint = tab === 'notas' ? 'notas' : tab === 'observador' ? 'observaciones' : 'pagos';
            const res = await fetch(`/admin/estudiantes/${estId}/${endpoint}`);
            const data = await res.json();
            if (tab === 'notas') setNotasData(data);
            else if (tab === 'observador') setObsData(data);
            else setPagosData(data);
        } catch { /* silently fail */ }
        setLoadingTab(false);
    }, []);

    /* ─── Open edit modal ─── */
    const openEdit = (est: Estudiante) => {
        setEditForm({
            name: est.nombre, email: est.email, phone: est.telefono || '',
            documento: est.identificacion || '', tipo_documento: est.tipo_documento || 'TI',
            direccion: est.direccion || '', fecha_nacimiento: est.fecha_nacimiento || '',
            genero: est.genero || '', nivel_educativo: est.nivel || '',
            curso_id: est.curso_id?.toString() || '', acudiente_id: est.acudiente_id?.toString() || '',
        });
        setEditErrors({});
        setShowEditModal(true);
    };

    const submitEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) return;
        setEditProcessing(true);
        router.put(`/admin/estudiantes/${selected.id}`, editForm, {
            preserveScroll: true,
            onSuccess: () => { setShowEditModal(false); setEditProcessing(false); setSelected(null); },
            onError: (errs) => { setEditErrors(errs as Record<string, string>); setEditProcessing(false); },
        });
    };

    /* ─── Send message ─── */
    const openMsg = () => { setMsgForm({ asunto: '', contenido: '' }); setShowMsgModal(true); };
    const submitMsg = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) return;
        setMsgProcessing(true);
        router.post(`/admin/estudiantes/${selected.id}/mensaje`, msgForm, {
            preserveScroll: true,
            onSuccess: () => { setShowMsgModal(false); setMsgProcessing(false); },
            onError: () => setMsgProcessing(false),
        });
    };

    /* ─── Toggle status ─── */
    const confirmToggle = () => {
        if (!selected) return;
        router.patch(`/admin/estudiantes/${selected.id}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => { setShowBlockModal(false); setSelected(null); },
        });
    };

    /* ─── Export Excel (SheetJS) ─── */
    const handleExport = () => {
        const wb = XLSX.utils.book_new();
        const nivelLabels: Record<string, string> = { preescolar: 'Pre-escolar', transicion: 'Transición', primaria: 'Primaria', bachillerato: 'Bachillerato' };
        const nivelOrder = ['preescolar', 'transicion', 'primaria', 'bachillerato'];

        // Group filtered students by nivel
        const byNivel: Record<string, Estudiante[]> = {};
        filtered.forEach(est => {
            const niv = est.nivel || 'sin_nivel';
            if (!byNivel[niv]) byNivel[niv] = [];
            byNivel[niv].push(est);
        });

        const sortedNiveles = Object.keys(byNivel).sort((a, b) => {
            const ia = nivelOrder.indexOf(a);
            const ib = nivelOrder.indexOf(b);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });

        if (sortedNiveles.length === 0) {
            // Empty sheet if no students
            const ws = XLSX.utils.aoa_to_sheet([['No se encontraron estudiantes con los filtros seleccionados']]);
            XLSX.utils.book_append_sheet(wb, ws, 'Sin datos');
        } else {
            sortedNiveles.forEach(niv => {
                const students = byNivel[niv];
                const label = nivelLabels[niv] || (niv === 'sin_nivel' ? 'Sin nivel' : niv);

                // Group by curso within nivel
                const byCurso: Record<string, Estudiante[]> = {};
                students.forEach(e => {
                    const cn = e.curso_nombre || 'Sin asignar';
                    if (!byCurso[cn]) byCurso[cn] = [];
                    byCurso[cn].push(e);
                });

                const rows: (string | number)[][] = [];

                Object.entries(byCurso).sort(([a], [b]) => a.localeCompare(b)).forEach(([curso, ests], idx) => {
                    if (idx > 0) rows.push([]); // blank separator
                    rows.push([`Curso: ${curso}`]);
                    rows.push(['N°', 'Nombre Completo', 'Tipo Doc.', 'Documento', 'Curso', 'Acudiente', 'Teléfono', 'Email', 'Dirección', 'Fecha Nacimiento', 'Género', 'Estado', 'Promedio', 'Estado Pagos', 'Observaciones']);

                    ests.sort((a, b) => a.nombre.localeCompare(b.nombre)).forEach((est, i) => {
                        rows.push([
                            i + 1,
                            est.nombre,
                            est.tipo_documento,
                            est.identificacion,
                            est.curso_nombre,
                            est.acudiente,
                            est.telefono,
                            est.email,
                            est.direccion || '',
                            est.fecha_nacimiento || '',
                            est.genero === 'M' ? 'Masculino' : est.genero === 'F' ? 'Femenino' : est.genero || 'N/A',
                            est.estado === 'activo' ? 'Activo' : 'Inactivo',
                            est.promedio,
                            est.pagos === 'al_dia' ? 'Al día' : est.pagos === 'pendiente' ? 'Pendiente' : 'Moroso',
                            est.observaciones,
                        ]);
                    });
                });

                const ws = XLSX.utils.aoa_to_sheet(rows);
                // Set column widths
                ws['!cols'] = [{ wch: 5 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 14 }, { wch: 28 }, { wch: 25 }, { wch: 14 }, { wch: 12 }, { wch: 10 }, { wch: 9 }, { wch: 12 }, { wch: 14 }];
                const sheetName = label.substring(0, 31); // Excel max 31 chars
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            });
        }

        XLSX.writeFile(wb, `estudiantes_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    /* ─── Cursos filtrados para edit form ─── */
    const editCursosFiltrados = useMemo(() => {
        if (!editForm.nivel_educativo) return cursos;
        return cursos.filter(c => c.nivel === editForm.nivel_educativo);
    }, [cursos, editForm.nivel_educativo]);

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Buscar Estudiantes">
            <Head title="Buscar Estudiantes" />

            <div className="space-y-4 sm:space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800 flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                            Buscar Estudiantes
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">Encuentra y gestiona información de estudiantes</p>
                    </div>
                    <button onClick={handleExport} className="flex items-center gap-2 text-white px-4 py-2.5 rounded-lg hover:opacity-90 text-sm font-semibold shadow-md" style={{ background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Exportar Excel
                    </button>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-4">
                    {/* Búsqueda */}
                    <div className="relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-800" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                        <input
                            type="text"
                            placeholder="Buscar por nombre o número de identificación..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm"
                        />
                    </div>

                    {/* Nivel chips */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Nivel Educativo</label>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => { setNivelSel('todos'); setCursoSel('todos'); }} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${nivelSel === 'todos' ? 'bg-[#293577] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Todos</button>
                            {NIVEL_KEYS.map(k => (
                                <button key={k} onClick={() => { setNivelSel(k); setCursoSel('todos'); }} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${nivelSel === k ? NIVELES[k].activeBg : `${NIVELES[k].chipBg} ${NIVELES[k].chipText} hover:opacity-80`}`}>
                                    {NIVELES[k].label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filtros secundarios */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Curso</label>
                            <select value={cursoSel} onChange={e => setCursoSel(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] appearance-none bg-white">
                                <option value="todos">Todos los cursos</option>
                                {cursosParaFiltro.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Estado</label>
                            <select value={estadoSel} onChange={e => setEstadoSel(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] appearance-none bg-white">
                                <option value="todos">Todos los estados</option>
                                <option value="activo">Activos</option>
                                <option value="inactivo">Inactivos</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Pagos</label>
                            <select value={pagosSel} onChange={e => setPagosSel(e.target.value)} className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] appearance-none bg-white">
                                <option value="todos">Todos</option>
                                <option value="al_dia">Al día</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="moroso">Moroso</option>
                            </select>
                        </div>
                    </div>

                    {/* Tags activos */}
                    {hayFiltros && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                            <span className="text-xs text-gray-500">Filtros:</span>
                            {nivelSel !== 'todos' && <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${nivelBadge(nivelSel)}`}>{nivelLabel(nivelSel)} <button onClick={() => { setNivelSel('todos'); setCursoSel('todos'); }} className="hover:opacity-70">×</button></span>}
                            {cursoSel !== 'todos' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">{cursoSel} <button onClick={() => setCursoSel('todos')} className="hover:opacity-70">×</button></span>}
                            {estadoSel !== 'todos' && <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${estadoBadge(estadoSel)}`}>{estadoSel} <button onClick={() => setEstadoSel('todos')} className="hover:opacity-70">×</button></span>}
                            {pagosSel !== 'todos' && <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${pagoBadge(pagosSel)}`}>{pagoLabel(pagosSel)} <button onClick={() => setPagosSel('todos')} className="hover:opacity-70">×</button></span>}
                            {busqueda && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">"{busqueda}" <button onClick={() => setBusqueda('')} className="hover:opacity-70">×</button></span>}
                            <button onClick={limpiarFiltros} className="text-xs text-red-500 hover:text-red-700 font-medium ml-1">Limpiar todo</button>
                        </div>
                    )}

                    {hasLoaded
                        ? <p className="text-sm text-gray-500">{filtered.length} de {estudiantes.length} estudiante(s) encontrado(s)</p>
                        : <p className="text-sm text-gray-400">Haz clic en "Cargar estudiantes" para ver los resultados</p>
                    }
                </div>

                {/* Lista */}
                {!hasLoaded ? (
                    /* Placeholder: aún no se ha cargado */
                    <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-dashed border-gray-200">
                        <svg className="w-14 h-14 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                        </svg>
                        <h3 className="text-gray-600 font-semibold text-base mb-1">Lista de estudiantes lista para cargar</h3>
                        <p className="text-gray-400 text-sm mb-5">Presiona el botón para mostrar todos los estudiantes o usa los filtros para búsquedas específicas</p>
                        <button
                            onClick={() => setHasLoaded(true)}
                            className="inline-flex items-center gap-2 bg-[#293577] text-white px-6 py-2.5 rounded-lg hover:bg-[#181b49] text-sm font-semibold transition-all shadow-md"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
                            Cargar estudiantes ({estudiantes.length})
                        </button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm p-8 text-center">
                        <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                        <p className="text-gray-600 font-medium">No se encontraron estudiantes</p>
                        <p className="text-gray-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filtered.map(est => (
                            <div key={est.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => selectStudent(est)}>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-[#181b49] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">{est.nombre.charAt(0)}</div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-800">{est.nombre}</h3>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm text-gray-500">ID: {est.identificacion}</p>
                                                <span className="text-gray-300">•</span>
                                                {est.nivel && <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${nivelBadge(est.nivel)}`}>{nivelLabel(est.nivel)}</span>}
                                                <span className="text-sm text-gray-500">{est.curso_nombre}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${estadoBadge(est.estado)}`}>{est.estado}</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${pagoBadge(est.pagos)}`}>{pagoLabel(est.pagos)}</span>
                                        <span className={`px-3 py-1 bg-gray-100 rounded-full text-xs font-bold ${promedioColor(est.promedio)}`}>Prom: {est.promedio.toFixed(1)}</span>
                                        {est.observaciones > 0 && <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">{est.observaciones} obs.</span>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ══════════════════ MODAL DETALLE ══════════════════ */}
            {selected && !showEditModal && !showMsgModal && !showBlockModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        {/* Header */}
                        <div className="p-5 sm:p-6 pb-0">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-[#181b49] to-[#293577] rounded-full flex items-center justify-center text-white font-bold text-xl">{selected.nombre.charAt(0)}</div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800">{selected.nombre}</h2>
                                        <p className="text-sm text-gray-500">ID: {selected.identificacion}</p>
                                    </div>
                                </div>
                                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
                            </div>

                            {/* Tabs */}
                            <div className="flex gap-1 mt-4 border-b border-gray-100">
                                {(['info', 'notas', 'observador', 'pagos'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => tab === 'info' ? setActiveTab('info') : loadTab(tab, selected.id)}
                                        className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${activeTab === tab ? 'border-[#293577] text-[#293577]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {tab === 'info' ? 'Información' : tab === 'notas' ? 'Notas' : tab === 'observador' ? 'Observador' : 'Pagos'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                            {/* ── TAB INFO ── */}
                            {activeTab === 'info' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <InfoCard label="Nivel Educativo" badge={selected.nivel ? { text: nivelLabel(selected.nivel), cls: nivelBadge(selected.nivel) } : undefined} value={!selected.nivel ? 'Sin asignar' : undefined} />
                                        <InfoCard label="Acudiente" value={selected.acudiente} />
                                        <InfoCard label="Curso" value={selected.curso_nombre} />
                                        <InfoCard label="Teléfono" value={selected.telefono || 'No registrado'} />
                                        <InfoCard label="Estado" badge={{ text: selected.estado, cls: estadoBadge(selected.estado) }} />
                                        <InfoCard label="Email" value={selected.email} small />
                                        <InfoCard label="Dirección" value={selected.direccion || 'No registrada'} />
                                        <InfoCard label="Fecha Nacimiento" value={selected.fecha_nacimiento || 'No registrada'} />
                                        <InfoCard label="Documento" value={`${selected.tipo_documento} ${selected.identificacion}`} />
                                        <InfoCard label="Género" value={selected.genero === 'M' ? 'Masculino' : selected.genero === 'F' ? 'Femenino' : selected.genero || 'No especificado'} />
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg">
                                        <p className="text-xs text-gray-500">Promedio Actual</p>
                                        <p className={`text-2xl font-bold ${promedioColor(selected.promedio)}`}>{selected.promedio.toFixed(1)}</p>
                                    </div>
                                    {/* Pago status */}
                                    <div className={`p-4 rounded-lg ${selected.pagos === 'al_dia' ? 'bg-green-50' : selected.pagos === 'pendiente' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-800">Estado de Pagos</p>
                                                <p className="text-sm text-gray-600">{selected.pagos === 'al_dia' ? 'Todos los pagos al día' : selected.pagos === 'pendiente' ? 'Tiene pagos pendientes' : 'Estudiante en mora'}</p>
                                            </div>
                                            <span className={`px-4 py-2 rounded-lg text-sm font-medium ${pagoBadge(selected.pagos)}`}>{pagoLabel(selected.pagos)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── TAB NOTAS ── */}
                            {activeTab === 'notas' && (
                                <div>
                                    {loadingTab ? <Spinner /> : notasData.length === 0 ? <EmptyState text="No hay notas registradas" /> : (() => {
                                        const definitivas = notasData.filter(n => n.tipo === 'definitiva');
                                        const promedioGen = definitivas.length > 0 ? definitivas.reduce((s, n) => s + Number(n.valor), 0) / definitivas.length : 0;
                                        // Group by materia
                                        const byMateria: Record<string, NotaItem[]> = {};
                                        notasData.forEach(n => { const m = n.materia || 'Sin materia'; if (!byMateria[m]) byMateria[m] = []; byMateria[m].push(n); });
                                        const tipoLabel: Record<string, string> = { definitiva: 'Def.', examen: 'Exam.', parcial: 'Parc.', quiz: 'Quiz' };
                                        return (
                                            <div className="space-y-3">
                                                {/* Barra resumen discreta */}
                                                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
                                                    <span className="text-xs text-gray-500">{notasData.length} nota(s) en {Object.keys(byMateria).length} materia(s)</span>
                                                    <span className={`text-sm font-bold ${ promedioGen >= 4 ? 'text-green-700' : promedioGen >= 3 ? 'text-yellow-700' : 'text-red-600' }`}>
                                                        Prom. {promedioGen.toFixed(1)}
                                                    </span>
                                                </div>
                                                {/* Accordion por materia */}
                                                <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                                                    {Object.entries(byMateria).sort(([a], [b]) => a.localeCompare(b)).map(([materia, notas]) => {
                                                        const defNota = notas.find(n => n.tipo === 'definitiva');
                                                        const isOpen = openMaterias.has(materia);
                                                        return (
                                                            <div key={materia}>
                                                                <button
                                                                    onClick={() => toggleMateria(materia)}
                                                                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                                                                >
                                                                    <div className="flex items-center gap-3 min-w-0">
                                                                        <svg className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                                                                        <span className="text-sm font-medium text-gray-800 truncate">{materia}</span>
                                                                        <span className="text-xs text-gray-400 flex-shrink-0">{notas.length} nota(s)</span>
                                                                    </div>
                                                                    {defNota && (
                                                                        <span className={`text-sm font-bold flex-shrink-0 ml-2 ${ Number(defNota.valor) >= 4 ? 'text-green-700' : Number(defNota.valor) >= 3 ? 'text-yellow-700' : 'text-red-600' }`}>
                                                                            {Number(defNota.valor).toFixed(1)}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                                {isOpen && (
                                                                    <div className="bg-gray-50 border-t border-gray-100">
                                                                        {notas.sort((a, b) => (a.periodo || '').localeCompare(b.periodo || '')).map((n, i) => (
                                                                            <div key={n.id} className={`flex items-center justify-between px-4 py-2.5 ${ i > 0 ? 'border-t border-gray-100' : '' }`}>
                                                                                <div className="flex items-center gap-3">
                                                                                    <span className="text-xs text-gray-400 w-20 truncate">{n.periodo || '—'}</span>
                                                                                    <span className="text-xs px-2 py-0.5 rounded bg-white border border-gray-200 text-gray-500 capitalize">{tipoLabel[n.tipo] || n.tipo}</span>
                                                                                </div>
                                                                                <span className={`text-sm font-bold ${ Number(n.valor) >= 4 ? 'text-green-700' : Number(n.valor) >= 3 ? 'text-yellow-700' : 'text-red-600' }`}>{Number(n.valor).toFixed(1)}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* ── TAB OBSERVADOR ── */}
                            {activeTab === 'observador' && (
                                <div>
                                    {loadingTab ? <Spinner /> : obsData.length === 0 ? <EmptyState text="No hay observaciones registradas" /> : (() => {
                                        const positivas = obsData.filter(o => o.tipo === 'positiva').length;
                                        const negativas = obsData.filter(o => o.tipo === 'negativa').length;
                                        return (
                                            <div className="space-y-4">
                                                {/* Resumen discreto */}
                                                <div className="flex items-center gap-4 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-500">
                                                    <span>{obsData.length} total</span>
                                                    <span className="text-green-700 font-medium">{positivas} positiva(s)</span>
                                                    <span className="text-red-600 font-medium">{negativas} negativa(s)</span>
                                                    <div className="flex-1 flex rounded-full overflow-hidden h-1.5 ml-2">
                                                        {positivas > 0 && <div className="bg-green-400" style={{ width: `${(positivas / obsData.length) * 100}%` }} />}
                                                        {negativas > 0 && <div className="bg-red-400" style={{ width: `${(negativas / obsData.length) * 100}%` }} />}
                                                    </div>
                                                </div>
                                                {/* Timeline */}
                                                <div className="relative">
                                                    <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gray-200" />
                                                    <div className="space-y-3">
                                                        {obsData.map(o => (
                                                            <div key={o.id} className="flex gap-3 relative">
                                                                <div className={`w-[31px] h-[31px] rounded-full flex items-center justify-center flex-shrink-0 z-10 ${o.tipo === 'positiva' ? 'bg-green-500' : 'bg-red-500'}`}>
                                                                    {o.tipo === 'positiva'
                                                                        ? <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                                        : <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                                                                    }
                                                                </div>
                                                                <div className={`flex-1 rounded-xl p-3 ${o.tipo === 'positiva' ? 'bg-green-50 border border-green-100' : 'bg-red-50 border border-red-100'}`}>
                                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                                        <div className="flex items-center gap-2 flex-wrap">
                                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${o.tipo === 'positiva' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>{o.tipo === 'positiva' ? 'Positiva' : 'Negativa'}</span>
                                                                            <span className="text-[10px] font-medium text-gray-500 bg-white px-2 py-0.5 rounded-full">{o.categoria}</span>
                                                                        </div>
                                                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{o.fecha}</span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-700 leading-relaxed">{o.desc}</p>
                                                                    <div className="flex items-center gap-1.5 mt-2">
                                                                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                                        <span className="text-[11px] text-gray-500">{o.profesor}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* ── TAB PAGOS ── */}
                            {activeTab === 'pagos' && (
                                <div>
                                    {loadingTab ? <Spinner /> : pagosData.length === 0 ? <EmptyState text="No hay pagos registrados" /> : (() => {
                                        const totalMonto = pagosData.reduce((s, p) => s + Number(p.monto), 0);
                                        const pagados = pagosData.filter(p => p.estado === 'pagado');
                                        const pendientes = pagosData.filter(p => p.estado === 'pendiente');
                                        const vencidos = pagosData.filter(p => p.estado === 'vencido');
                                        const totalPagado = pagados.reduce((s, p) => s + Number(p.monto), 0);
                                        const totalPendiente = pendientes.reduce((s, p) => s + Number(p.monto), 0);
                                        const totalVencido = vencidos.reduce((s, p) => s + Number(p.monto), 0);
                                        const estadoColors: Record<string, { bg: string; icon: string; border: string }> = {
                                            pagado: { bg: 'bg-white', icon: 'text-green-600', border: 'border-gray-200' },
                                            pendiente: { bg: 'bg-white', icon: 'text-yellow-500', border: 'border-gray-200' },
                                            vencido: { bg: 'bg-white', icon: 'text-red-500', border: 'border-gray-200' },
                                        };
                                        return (
                                            <div className="space-y-3">
                                                {/* Resumen discreto */}
                                                <div className="grid grid-cols-4 gap-2">
                                                    {[{ label: 'Total', val: `$${totalMonto.toLocaleString()}`, sub: `${pagosData.length} pago(s)`, cls: 'text-gray-700' },
                                                      { label: 'Pagado', val: `$${totalPagado.toLocaleString()}`, sub: `${pagados.length} pago(s)`, cls: 'text-green-700' },
                                                      { label: 'Pendiente', val: `$${totalPendiente.toLocaleString()}`, sub: `${pendientes.length} pago(s)`, cls: 'text-yellow-700' },
                                                      { label: 'Vencido', val: `$${totalVencido.toLocaleString()}`, sub: `${vencidos.length} pago(s)`, cls: 'text-red-600' },
                                                    ].map(item => (
                                                        <div key={item.label} className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-center">
                                                            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">{item.label}</p>
                                                            <p className={`text-sm font-bold ${item.cls}`}>{item.val}</p>
                                                            <p className="text-[9px] text-gray-400">{item.sub}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Progress bar delgada */}
                                                {totalMonto > 0 && (
                                                    <div className="flex rounded-full overflow-hidden h-1.5">
                                                        {totalPagado > 0 && <div className="bg-green-400" style={{ width: `${(totalPagado / totalMonto) * 100}%` }} />}
                                                        {totalPendiente > 0 && <div className="bg-yellow-400" style={{ width: `${(totalPendiente / totalMonto) * 100}%` }} />}
                                                        {totalVencido > 0 && <div className="bg-red-400" style={{ width: `${(totalVencido / totalMonto) * 100}%` }} />}
                                                    </div>
                                                )}
                                                {/* Payment list */}
                                                <div className="space-y-2">
                                                    {pagosData.map(p => {
                                                        const colors = estadoColors[p.estado] || { bg: 'bg-gray-50', icon: 'text-gray-500', border: 'border-gray-200' };
                                                        return (
                                                                <div key={p.id} className={`${colors.bg} border ${colors.border} rounded-lg p-3 flex items-start gap-3`}>
                                                                <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 bg-gray-100`}>
                                                                    {p.estado === 'pagado' ? (
                                                                        <svg className={`w-4 h-4 ${colors.icon}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                    ) : p.estado === 'pendiente' ? (
                                                                        <svg className={`w-4 h-4 ${colors.icon}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                    ) : (
                                                                        <svg className={`w-4 h-4 ${colors.icon}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <p className="font-semibold text-gray-800 text-sm">{p.concepto}</p>
                                                                        <p className="text-base font-extrabold text-gray-800 whitespace-nowrap">${Number(p.monto).toLocaleString()}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${p.estado === 'pagado' ? 'bg-green-200 text-green-800' : p.estado === 'pendiente' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>{p.estado}</span>
                                                                        <span className="text-[11px] text-gray-400">Vence: {p.vence}</span>
                                                                        {p.pagado && <span className="text-[11px] text-green-600">Pagado: {p.pagado}</span>}
                                                                        {p.metodo && <span className="text-[11px] text-gray-400">· {p.metodo}</span>}
                                                                        {p.ref && <span className="text-[10px] text-gray-400 font-mono">Ref: {p.ref}</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>

                        {/* Footer actions */}
                        <div className="p-5 sm:p-6 pt-0 flex flex-wrap gap-2 border-t border-gray-100 mt-2 pt-4">
                            <button onClick={() => openEdit(selected)} className="flex-1 text-white py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all" style={{ background: 'linear-gradient(135deg, #181b49, #293577)' }}>Editar Información</button>
                            <button onClick={openMsg} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">Enviar Mensaje</button>
                            <button onClick={() => setShowBlockModal(true)} className={`px-4 py-2.5 border rounded-lg text-sm font-medium ${selected.estado === 'activo' ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}>
                                {selected.estado === 'activo' ? 'Bloquear' : 'Activar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════ MODAL EDITAR ══════════════════ */}
            {showEditModal && selected && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-5 sm:p-6 pb-3" style={{ background: 'linear-gradient(135deg, #181b49, #293577)' }}>
                            <h2 className="text-lg font-bold text-white">Editar Estudiante</h2>
                            <p className="text-sm text-white/70">{selected.nombre}</p>
                        </div>
                        <form id="edit-form" onSubmit={submitEdit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
                            {Object.keys(editErrors).length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-700 font-medium">Corrige los siguientes errores:</p>
                                    {Object.values(editErrors).map((err, i) => <p key={i} className="text-xs text-red-600 mt-1">• {err}</p>)}
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nombre completo <span className="text-red-400">*</span></label>
                                <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className={`w-full px-4 py-2.5 border rounded-lg text-sm ${editErrors.name ? 'border-red-300' : 'border-gray-200'}`} required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email <span className="text-red-400">*</span></label>
                                <input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} className={`w-full px-4 py-2.5 border rounded-lg text-sm ${editErrors.email ? 'border-red-300' : 'border-gray-200'}`} required />
                            </div>
                            <div className="grid grid-cols-5 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tipo Doc.</label>
                                    <select value={editForm.tipo_documento} onChange={e => setEditForm(f => ({ ...f, tipo_documento: e.target.value }))} className="w-full pl-3 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white appearance-none">
                                        <option value="CC">CC - Cédula</option>
                                        <option value="TI">TI - Tarjeta Identidad</option>
                                        <option value="CE">CE - Cédula Extranjería</option>
                                        <option value="RC">RC - Registro Civil</option>
                                        <option value="PP">PP - Pasaporte</option>
                                    </select>
                                </div>
                                <div className="col-span-3">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">N° Documento</label>
                                    <input type="text" inputMode="numeric" value={editForm.documento} onChange={e => setEditForm(f => ({ ...f, documento: onlyNumbers(e.target.value) }))} className={`w-full px-4 py-2.5 border rounded-lg text-sm ${editErrors.documento ? 'border-red-300' : 'border-gray-200'}`} maxLength={15} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Teléfono</label>
                                    <input type="tel" inputMode="numeric" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: onlyNumbers(e.target.value) }))} className={`w-full px-4 py-2.5 border rounded-lg text-sm ${editErrors.phone ? 'border-red-300' : 'border-gray-200'}`} maxLength={10} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Género</label>
                                    <select value={editForm.genero} onChange={e => setEditForm(f => ({ ...f, genero: e.target.value }))} className="w-full pl-4 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white appearance-none">
                                        <option value="">Sin especificar</option>
                                        <option value="M">Masculino</option>
                                        <option value="F">Femenino</option>
                                        <option value="otro">Otro</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fecha Nacimiento</label>
                                    <input type="date" value={editForm.fecha_nacimiento} onChange={e => setEditForm(f => ({ ...f, fecha_nacimiento: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" max={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Dirección</label>
                                    <input type="text" value={editForm.direccion} onChange={e => setEditForm(f => ({ ...f, direccion: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" />
                                </div>
                            </div>

                            {/* Académicos */}
                            <div className="space-y-4 pt-2 border-t border-gray-100">
                                <p className="text-xs font-bold text-[#293577] uppercase tracking-widest flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                    Datos Académicos
                                </p>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nivel Educativo</label>
                                    <select value={editForm.nivel_educativo} onChange={e => setEditForm(f => ({ ...f, nivel_educativo: e.target.value, curso_id: '' }))} className="w-full pl-4 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white appearance-none">
                                        <option value="">— Sin asignar —</option>
                                        <option value="preescolar">Preescolar</option>
                                        <option value="transicion">Transición</option>
                                        <option value="primaria">Primaria</option>
                                        <option value="bachillerato">Bachillerato</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Curso</label>
                                    <select value={editForm.curso_id} onChange={e => setEditForm(f => ({ ...f, curso_id: e.target.value }))} className="w-full pl-4 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white appearance-none">
                                        <option value="">— Sin asignar —</option>
                                        {editCursosFiltrados.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Acudiente</label>
                                    <select value={editForm.acudiente_id} onChange={e => setEditForm(f => ({ ...f, acudiente_id: e.target.value }))} className="w-full pl-4 pr-8 py-2.5 border border-gray-200 rounded-lg text-sm bg-white appearance-none">
                                        <option value="">— Sin asignar —</option>
                                        {padres.map(p => <option key={p.id} value={p.id}>{p.name}{p.documento ? ` — ${p.documento}` : ''}</option>)}
                                    </select>
                                </div>
                            </div>
                        </form>
                        <div className="flex gap-3 p-5 sm:p-6 pt-0">
                            <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium hover:bg-gray-50">Cancelar</button>
                            <button type="submit" form="edit-form" disabled={editProcessing} className="flex-1 text-white px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #181b49, #293577)' }}>{editProcessing ? 'Guardando...' : 'Guardar cambios'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════ MODAL MENSAJE ══════════════════ */}
            {showMsgModal && selected && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-5" style={{ background: 'linear-gradient(135deg, #0284c7, #0369a1)' }}>
                            <h2 className="text-lg font-bold text-white">Enviar Mensaje</h2>
                            <p className="text-sm text-white/70">Para: {selected.nombre}</p>
                        </div>
                        <form onSubmit={submitMsg} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Asunto <span className="text-red-400">*</span></label>
                                <input type="text" value={msgForm.asunto} onChange={e => setMsgForm(f => ({ ...f, asunto: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm" required />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mensaje <span className="text-red-400">*</span></label>
                                <textarea value={msgForm.contenido} onChange={e => setMsgForm(f => ({ ...f, contenido: e.target.value }))} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm resize-none" rows={4} required />
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowMsgModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium hover:bg-gray-50">Cancelar</button>
                                <button type="submit" disabled={msgProcessing || !msgForm.asunto.trim() || !msgForm.contenido.trim()} className="flex-1 bg-sky-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-sky-700 disabled:opacity-50">{msgProcessing ? 'Enviando...' : 'Enviar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════ MODAL BLOQUEAR/ACTIVAR ══════════════════ */}
            {showBlockModal && selected && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
                        <div className={`p-5 ${selected.estado === 'activo' ? 'bg-red-500' : 'bg-green-600'}`}>
                            <h2 className="text-lg font-bold text-white">{selected.estado === 'activo' ? 'Bloquear' : 'Activar'} Estudiante</h2>
                            <p className="text-sm text-white/80">{selected.nombre}</p>
                        </div>
                        <div className="p-5">
                            <p className="text-sm text-gray-600 mb-4">
                                {selected.estado === 'activo'
                                    ? '¿Estás seguro de bloquear a este estudiante? Perderá acceso a la plataforma.'
                                    : '¿Deseas volver a activar a este estudiante?'}
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setShowBlockModal(false)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium hover:bg-gray-50">Cancelar</button>
                                <button onClick={confirmToggle} className={`flex-1 text-white px-4 py-2.5 rounded-lg text-sm font-semibold ${selected.estado === 'activo' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}>
                                    {selected.estado === 'activo' ? 'Confirmar Bloqueo' : 'Activar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}

/* ─── Sub-components ─── */
function InfoCard({ label, value, badge, small }: { label: string; value?: string; badge?: { text: string; cls: string }; small?: boolean }) {
    return (
        <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            {badge ? <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${badge.cls}`}>{badge.text}</span>
                    : <p className={`font-medium text-gray-800 ${small ? 'text-sm' : ''}`}>{value}</p>}
        </div>
    );
}

function Spinner() {
    return <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#293577] rounded-full animate-spin" /></div>;
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="text-center py-8">
            <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            <p className="text-gray-500 text-sm">{text}</p>
        </div>
    );
}
