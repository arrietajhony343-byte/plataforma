import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';
import * as XLSX from 'xlsx';

/* ═══════════════════════════ TYPES ═══════════════════════════ */
interface Sede { id: number; nombre: string; }
interface Periodo { id: number; nombre: string; anio: number; activo: boolean; }
interface Estudiante { id: number; name: string; curso: string; }
interface ConceptoPago {
    id: number; nombre: string; descripcion: string | null;
    monto: number; periodicidad: 'unico' | 'mensual' | 'anual';
    activo: boolean; pagos_count: number;
    tipo_certificado_id: number | null;
    tipo_certificado_nombre: string | null;
    es_certificado: boolean;
}
interface Pago {
    id: number; estudiante_id: number; estudiante: string;
    curso: string; curso_id: number | null; nivel: string; sede_id: number | null;
    concepto_pago_id: number; concepto: string;
    periodo_id: number | null; periodo: string;
    monto: number; estado: 'pendiente' | 'pagado' | 'vencido' | 'anulado';
    metodo_pago: string | null; referencia: string | null;
    fecha_vencimiento: string; fecha_pago: string | null;
    notas: string | null; comprobantes: number;
}

interface Props {
    pagos: Pago[];
    conceptos: ConceptoPago[];
    estudiantes: Estudiante[];
    periodos: Periodo[];
    sedes: Sede[];
    periodoActivo: { id: number; nombre: string } | null;
}

/* ═══════════════════════════ HELPERS ═══════════════════════════ */
const estadosConfig: Record<string, { label: string; color: string; dot: string }> = {
    pendiente: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-500' },
    pagado:    { label: 'Pagado',    color: 'bg-green-100 text-green-700',   dot: 'bg-green-500' },
    vencido:   { label: 'Vencido',   color: 'bg-red-100 text-red-700',       dot: 'bg-red-500' },
    anulado:   { label: 'Anulado',   color: 'bg-gray-100 text-gray-500',     dot: 'bg-gray-400' },
};

const periodicidadLabel: Record<string, string> = {
    unico: 'Único', mensual: 'Mensual', anual: 'Anual',
};

const metodos = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'PSE', 'Tarjeta', 'Otro'];

const fmt = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);
const fechaVencimientoVisible = (pago: Pago) => pago.estado === 'pagado' ? '—' : pago.fecha_vencimiento;

const fmtFechaHora = () => new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'short',
    timeStyle: 'short',
}).format(new Date());

const normalizeNivel = (nivel?: string | null) => {
    if (!nivel) return 'sin_nivel';
    return (nivel === 'preescolar' || nivel === 'transicion') ? 'prejardin' : nivel;
};

const nivelLabel = (nivel?: string | null) => {
    const n = normalizeNivel(nivel);
    if (n === 'prejardin') return 'Pre-Jardín';
    if (n === 'primaria') return 'Primaria';
    if (n === 'bachillerato') return 'Bachillerato';
    return 'Sin nivel';
};

const nivelBadge = (nivel?: string | null) => {
    const n = normalizeNivel(nivel);
    if (n === 'prejardin') return 'bg-pink-100 text-pink-700';
    if (n === 'primaria') return 'bg-blue-100 text-blue-700';
    if (n === 'bachillerato') return 'bg-emerald-100 text-emerald-700';
    return 'bg-gray-100 text-gray-600';
};

/* ═══════════════════════════ COMPONENT ═══════════════════════════ */
export default function Pagos({ pagos, conceptos, estudiantes, periodos, sedes, periodoActivo }: Props) {
    /* ── State ── */
    const [activeTab, setActiveTab]        = useState<'pagos' | 'conceptos'>('pagos');
    const [estadoFiltro, setEstadoFiltro]  = useState('todos');
    const [conceptoFiltro, setConceptoFiltro] = useState('todos');
    const [sedeSel, setSedeSel]            = useState('todas');
    const [nivelSel, setNivelSel]          = useState('todos');
    const [cursoSel, setCursoSel]          = useState('todos');
    const [periodoSel, setPeriodoSel]      = useState(periodoActivo?.id.toString() ?? 'todos');
    const [busqueda, setBusqueda]          = useState('');
    const [processing, setProcessing]      = useState(false);

    // Modal registrar pago
    const [showRegistrar, setShowRegistrar] = useState(false);
    const [formPago, setFormPago] = useState({
        estudiante_id: '', concepto_pago_id: '', periodo_id: periodoActivo?.id.toString() ?? '',
        monto: '', estado: 'pendiente' as string, metodo_pago: '', referencia: '',
        fecha_vencimiento: '', fecha_pago: '', notas: '',
    });
    const [buscaEstudiante, setBuscaEstudiante] = useState('');

    // Modal confirmar pago
    const [confirmarPago, setConfirmarPago] = useState<Pago | null>(null);
    const [formConfirmar, setFormConfirmar] = useState({ metodo_pago: 'Efectivo', referencia: '' });

    // Modal detalle
    const [detallePago, setDetallePago] = useState<Pago | null>(null);

    // Modal concepto
    const [showConcepto, setShowConcepto] = useState(false);
    const [editConcepto, setEditConcepto] = useState<ConceptoPago | null>(null);
    const [formConcepto, setFormConcepto] = useState({ nombre: '', descripcion: '', monto: '', periodicidad: 'mensual' });

    const requiereVencimiento = formPago.estado !== 'pagado';
    const conceptoSeleccionado = useMemo(
        () => conceptos.find(c => c.id.toString() === formPago.concepto_pago_id) ?? null,
        [conceptos, formPago.concepto_pago_id]
    );
    const esConceptoCertificado = !!conceptoSeleccionado?.es_certificado;

    /* ── Memos ── */
    const nivelesDisponibles = useMemo(() => {
        const bag = new Set<string>();
        pagos.forEach(p => { const n = normalizeNivel(p.nivel); if (n !== 'sin_nivel') bag.add(n); });
        return [...bag].sort();
    }, [pagos]);

    const cursosDisponibles = useMemo(() => {
        const bag = new Set<string>();
        pagos.forEach(p => { if (p.curso?.trim()) bag.add(p.curso); });
        return [...bag].sort();
    }, [pagos]);

    const hayFiltros = estadoFiltro !== 'todos' || conceptoFiltro !== 'todos' ||
        sedeSel !== 'todas' || nivelSel !== 'todos' || cursoSel !== 'todos' ||
        periodoSel !== 'todos' || busqueda !== '';

    const pagosFiltrados = useMemo(() => {
        return pagos.filter(p => {
            if (estadoFiltro !== 'todos' && p.estado !== estadoFiltro) return false;
            if (conceptoFiltro !== 'todos' && p.concepto_pago_id.toString() !== conceptoFiltro) return false;
            if (sedeSel !== 'todas' && p.sede_id?.toString() !== sedeSel) return false;
            if (nivelSel !== 'todos' && normalizeNivel(p.nivel) !== nivelSel) return false;
            if (cursoSel !== 'todos' && p.curso !== cursoSel) return false;
            if (periodoSel !== 'todos' && p.periodo_id?.toString() !== periodoSel) return false;
            if (busqueda && !p.estudiante.toLowerCase().includes(busqueda.toLowerCase())) return false;
            return true;
        });
    }, [pagos, estadoFiltro, conceptoFiltro, sedeSel, nivelSel, cursoSel, periodoSel, busqueda]);

    const stats = useMemo(() => ({
        recaudado: pagosFiltrados.filter(p => p.estado === 'pagado').reduce((s, p) => s + p.monto, 0),
        pendiente: pagosFiltrados.filter(p => p.estado === 'pendiente').reduce((s, p) => s + p.monto, 0),
        vencido:   pagosFiltrados.filter(p => p.estado === 'vencido').reduce((s, p) => s + p.monto, 0),
        total:     pagosFiltrados.length,
    }), [pagosFiltrados]);

    const estudiantesFiltrados = useMemo(() => {
        if (!buscaEstudiante) return estudiantes.slice(0, 20);
        const q = buscaEstudiante.toLowerCase();
        return estudiantes.filter(e => e.name.toLowerCase().includes(q)).slice(0, 20);
    }, [estudiantes, buscaEstudiante]);

    /* ── Handlers ── */
    const limpiarFiltros = () => {
        setEstadoFiltro('todos'); setConceptoFiltro('todos');
        setSedeSel('todas'); setNivelSel('todos'); setCursoSel('todos');
        setPeriodoSel('todos'); setBusqueda('');
    };

    const handleRegistrarPago = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!formPago.estudiante_id || !formPago.concepto_pago_id || (requiereVencimiento && !formPago.fecha_vencimiento)) return;
        setProcessing(true);
        router.post('/admin/pagos', {
            estudiante_id: parseInt(formPago.estudiante_id),
            concepto_pago_id: parseInt(formPago.concepto_pago_id),
            periodo_id: formPago.periodo_id ? parseInt(formPago.periodo_id) : null,
            monto: parseFloat(formPago.monto),
            estado: formPago.estado,
            metodo_pago: formPago.metodo_pago || null,
            referencia: formPago.referencia || null,
            fecha_vencimiento: requiereVencimiento ? formPago.fecha_vencimiento : null,
            fecha_pago: formPago.fecha_pago || null,
            notas: formPago.notas || null,
            tipo_certificado_id: conceptoSeleccionado?.tipo_certificado_id ?? null,
        }, {
            onSuccess: () => { setShowRegistrar(false); resetFormPago(); },
            onFinish: () => setProcessing(false),
        });
    }, [formPago, requiereVencimiento, conceptoSeleccionado]);

    const resetFormPago = () => {
        setFormPago({
            estudiante_id: '', concepto_pago_id: '', periodo_id: periodoActivo?.id.toString() ?? '',
            monto: '', estado: 'pendiente', metodo_pago: '', referencia: '',
            fecha_vencimiento: '', fecha_pago: '', notas: '',
        });
        setBuscaEstudiante('');
    };

    const handleConfirmar = useCallback(() => {
        if (!confirmarPago) return;
        setProcessing(true);
        router.put(`/admin/pagos/${confirmarPago.id}/confirmar`, formConfirmar, {
            onSuccess: () => { setConfirmarPago(null); setFormConfirmar({ metodo_pago: 'Efectivo', referencia: '' }); },
            onFinish: () => setProcessing(false),
        });
    }, [confirmarPago, formConfirmar]);

    const handleAnular = useCallback((pago: Pago) => {
        if (!confirm(`¿Anular el pago de ${pago.estudiante} — ${pago.concepto}?`)) return;
        router.put(`/admin/pagos/${pago.id}/anular`);
    }, []);

    const handleEliminar = useCallback((pago: Pago) => {
        if (!confirm(`¿Eliminar permanentemente el pago de ${pago.estudiante}?`)) return;
        router.delete(`/admin/pagos/${pago.id}`);
    }, []);

    const handleConceptoChange = (field: string, value: string) => {
        setFormConcepto(prev => ({ ...prev, [field]: value }));
    };

    const handleGuardarConcepto = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!formConcepto.nombre || !formConcepto.monto) return;
        setProcessing(true);
        const payload = { ...formConcepto, monto: parseFloat(formConcepto.monto) };
        const url = editConcepto
            ? `/admin/pagos/conceptos/${editConcepto.id}`
            : '/admin/pagos/conceptos';
        const method = editConcepto ? 'put' : 'post';
        router[method](url, payload, {
            onSuccess: () => { setShowConcepto(false); setEditConcepto(null); setFormConcepto({ nombre: '', descripcion: '', monto: '', periodicidad: 'mensual' }); },
            onFinish: () => setProcessing(false),
        });
    }, [formConcepto, editConcepto]);

    const handleToggleConcepto = useCallback((c: ConceptoPago) => {
        router.put(`/admin/pagos/conceptos/${c.id}/toggle`);
    }, []);

    const handleEliminarConcepto = useCallback((c: ConceptoPago) => {
        if (!confirm(`¿Eliminar permanentemente el concepto "${c.nombre}"?`)) return;
        router.delete(`/admin/pagos/conceptos/${c.id}`);
    }, []);

    const abrirEditConcepto = (c: ConceptoPago) => {
        setEditConcepto(c);
        setFormConcepto({ nombre: c.nombre, descripcion: c.descripcion ?? '', monto: c.monto.toString(), periodicidad: c.periodicidad });
        setShowConcepto(true);
    };

    const abrirNuevoConcepto = () => {
        setEditConcepto(null);
        setFormConcepto({ nombre: '', descripcion: '', monto: '', periodicidad: 'mensual' });
        setShowConcepto(true);
    };

    /* ── Exportar ── */
    const handleExportar = useCallback(() => {
        const wb = XLSX.utils.book_new();
        const fechaGen = fmtFechaHora();

        const resumenSheet = XLSX.utils.aoa_to_sheet([
            ['CONTROL DE PAGOS - REPORTE'],
            ['Fecha de generacion', fechaGen],
            ['Periodo activo', periodoActivo?.nombre ?? 'No definido'],
            ['Periodo filtro', periodoSel === 'todos' ? 'Todos los periodos' : (periodos.find(p => p.id.toString() === periodoSel)?.nombre ?? periodoSel)],
            ['Sede', sedeSel === 'todas' ? 'Todas' : (sedes.find(s => s.id.toString() === sedeSel)?.nombre ?? sedeSel)],
            ['Nivel', nivelSel === 'todos' ? 'Todos' : nivelLabel(nivelSel)],
            ['Curso', cursoSel === 'todos' ? 'Todos' : cursoSel],
            ['Estado', estadoFiltro === 'todos' ? 'Todos' : (estadosConfig[estadoFiltro]?.label ?? estadoFiltro)],
            ['Concepto', conceptoFiltro === 'todos' ? 'Todos' : (conceptos.find(c => c.id.toString() === conceptoFiltro)?.nombre ?? conceptoFiltro)],
            ['Busqueda', busqueda || 'Sin busqueda'],
            [],
            ['Indicador', 'Valor'],
            ['Total registros', stats.total],
            ['Total recaudado', stats.recaudado],
            ['Total pendiente', stats.pendiente],
            ['Total vencido', stats.vencido],
        ]);
        resumenSheet['!cols'] = [{ wch: 30 }, { wch: 55 }];
        XLSX.utils.book_append_sheet(wb, resumenSheet, 'Resumen');

        const registrosSheet = XLSX.utils.json_to_sheet(
            pagosFiltrados.length > 0
                ? pagosFiltrados.map(p => ({
                    Estudiante: p.estudiante,
                    'ID estudiante': p.estudiante_id,
                    Sede: sedes.find(s => s.id === p.sede_id)?.nombre ?? 'N/A',
                    Curso: p.curso,
                    Nivel: nivelLabel(p.nivel),
                    Concepto: p.concepto,
                    Periodo: p.periodo,
                    Monto: p.monto,
                    Estado: estadosConfig[p.estado]?.label ?? p.estado,
                    'Metodo de pago': p.metodo_pago ?? '',
                    Referencia: p.referencia ?? '',
                    'Fecha vencimiento': p.estado === 'pagado' ? '' : p.fecha_vencimiento,
                    'Fecha pago': p.fecha_pago ?? '',
                    Notas: p.notas ?? '',
                }))
                : [{ Estudiante: 'Sin registros', 'ID estudiante': '', Sede: '', Curso: '', Nivel: '', Concepto: '', Periodo: '', Monto: 0, Estado: '', 'Metodo de pago': '', Referencia: '', 'Fecha vencimiento': '', 'Fecha pago': '', Notas: '' }]
        );
        registrosSheet['!cols'] = [
            { wch: 28 }, { wch: 12 }, { wch: 18 }, { wch: 16 }, { wch: 14 }, { wch: 26 },
            { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 30 },
        ];
        XLSX.utils.book_append_sheet(wb, registrosSheet, 'Registros');

        const conceptosSheet = XLSX.utils.json_to_sheet(
            conceptos.map(c => ({
                Concepto: c.nombre,
                Descripcion: c.descripcion ?? '',
                Periodicidad: periodicidadLabel[c.periodicidad] ?? c.periodicidad,
                Monto: c.monto,
                Estado: c.activo ? 'Activo' : 'Inactivo',
                'Pagos asociados': c.pagos_count,
            }))
        );
        conceptosSheet['!cols'] = [{ wch: 32 }, { wch: 42 }, { wch: 16 }, { wch: 14 }, { wch: 12 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(wb, conceptosSheet, 'Conceptos');

        const estadosSheet = XLSX.utils.json_to_sheet([
            {
                Estado: 'Pagado',
                Registros: pagosFiltrados.filter(p => p.estado === 'pagado').length,
                Monto: pagosFiltrados.filter(p => p.estado === 'pagado').reduce((s, p) => s + p.monto, 0),
            },
            {
                Estado: 'Pendiente',
                Registros: pagosFiltrados.filter(p => p.estado === 'pendiente').length,
                Monto: pagosFiltrados.filter(p => p.estado === 'pendiente').reduce((s, p) => s + p.monto, 0),
            },
            {
                Estado: 'Vencido',
                Registros: pagosFiltrados.filter(p => p.estado === 'vencido').length,
                Monto: pagosFiltrados.filter(p => p.estado === 'vencido').reduce((s, p) => s + p.monto, 0),
            },
            {
                Estado: 'Anulado',
                Registros: pagosFiltrados.filter(p => p.estado === 'anulado').length,
                Monto: pagosFiltrados.filter(p => p.estado === 'anulado').reduce((s, p) => s + p.monto, 0),
            },
        ]);
        estadosSheet['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 14 }];
        XLSX.utils.book_append_sheet(wb, estadosSheet, 'Estados');

        XLSX.writeFile(wb, `Control_Pagos_Detallado_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }, [
        pagosFiltrados,
        periodoActivo,
        periodoSel,
        periodos,
        sedeSel,
        sedes,
        nivelSel,
        cursoSel,
        estadoFiltro,
        conceptoFiltro,
        conceptos,
        busqueda,
        stats,
    ]);

    /* ── Auto-fill monto cuando se selecciona concepto ── */
    const handleConceptoSelect = (conceptoId: string) => {
        setFormPago(prev => {
            const c = conceptos.find(c => c.id.toString() === conceptoId);
            return {
                ...prev,
                concepto_pago_id: conceptoId,
                monto: c ? c.monto.toString() : prev.monto,
                periodo_id: c?.es_certificado ? '' : prev.periodo_id,
            };
        });
    };

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Control de Pagos">
            <Head title="Control de Pagos" />

            <div className="space-y-4 sm:space-y-5" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* ═══ Header ═══ */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>
                            Control de Pagos
                        </h1>
                        <p className="text-gray-500 text-sm">Gestión de pagos, conceptos y facturación</p>
                    </div>
                    <div className="flex gap-2">
                        {activeTab === 'pagos' && (
                            <>
                                <button onClick={handleExportar}
                                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Exportar
                                </button>
                                <button onClick={() => { resetFormPago(); setShowRegistrar(true); }}
                                    className="flex items-center gap-2 bg-[#293577] hover:bg-[#181b49] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-md">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Registrar Pago
                                </button>
                            </>
                        )}
                        {activeTab === 'conceptos' && (
                            <button onClick={abrirNuevoConcepto}
                                className="flex items-center gap-2 bg-[#293577] hover:bg-[#181b49] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-md">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Nuevo Concepto
                            </button>
                        )}
                    </div>
                </div>

                {/* ═══ Tabs ═══ */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                    {(['pagos', 'conceptos'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? 'bg-[#293577] text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}>
                            {tab === 'pagos' ? 'Pagos' : 'Conceptos de Pago'}
                        </button>
                    ))}
                </div>

                {/* ═══════════════════ TAB PAGOS ═══════════════════ */}
                {activeTab === 'pagos' && (
                    <>
                        {/* Stats */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { key: 'pagado',    label: 'Recaudado', value: fmt(stats.recaudado), bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', icon: '💰' },
                                { key: 'pendiente', label: 'Pendiente', value: fmt(stats.pendiente), bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-600', icon: '⏳' },
                                { key: 'vencido',   label: 'Vencido',   value: fmt(stats.vencido),   bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', icon: '⚠️' },
                                { key: 'total',     label: 'Total Registros', value: stats.total.toString(), bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', icon: '📋' },
                            ].map(s => (
                                <button key={s.key} onClick={() => s.key !== 'total' ? setEstadoFiltro(estadoFiltro === s.key ? 'todos' : s.key) : null}
                                    className={`${s.bg} border ${s.border} rounded-xl p-3 sm:p-4 text-left transition-all ${s.key !== 'total' && estadoFiltro === s.key ? 'ring-2 ring-offset-1 ring-[#293577]' : 'hover:shadow-md'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-base">{s.icon}</span>
                                        <span className={`text-xs font-semibold ${s.text} uppercase tracking-wide`}>{s.label}</span>
                                    </div>
                                    <p className={`text-lg sm:text-xl font-bold ${s.text}`}>{s.value}</p>
                                </button>
                            ))}
                        </div>

                        {/* Filtros */}
                        <div className="bg-white rounded-xl shadow-sm p-4 space-y-3 border border-gray-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {sedes.length > 0 && (
                                    <div className="relative">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sede</label>
                                        <select value={sedeSel} onChange={e => setSedeSel(e.target.value)}
                                            className="appearance-none w-full pl-3 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                            <option value="todas">Todas las sedes</option>
                                            {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                                        </select>
                                        <svg className="pointer-events-none absolute right-2.5 bottom-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg>
                                    </div>
                                )}
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nivel</label>
                                    <select value={nivelSel} onChange={e => { setNivelSel(e.target.value); setCursoSel('todos'); }}
                                        className="appearance-none w-full pl-3 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                        <option value="todos">Todos los niveles</option>
                                        {nivelesDisponibles.map(n => <option key={n} value={n}>{nivelLabel(n)}</option>)}
                                    </select>
                                    <svg className="pointer-events-none absolute right-2.5 bottom-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg>
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Curso</label>
                                    <select value={cursoSel} onChange={e => setCursoSel(e.target.value)}
                                        className="appearance-none w-full pl-3 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                        <option value="todos">Todos los cursos</option>
                                        {cursosDisponibles
                                            .filter(c => nivelSel === 'todos' || normalizeNivel(pagos.find(p => p.curso === c)?.nivel) === nivelSel)
                                            .map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <svg className="pointer-events-none absolute right-2.5 bottom-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg>
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Concepto</label>
                                    <select value={conceptoFiltro} onChange={e => setConceptoFiltro(e.target.value)}
                                        className="appearance-none w-full pl-3 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                        <option value="todos">Todos los conceptos</option>
                                        {conceptos.filter(c => c.activo).map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                    </select>
                                    <svg className="pointer-events-none absolute right-2.5 bottom-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Período</label>
                                    <select value={periodoSel} onChange={e => setPeriodoSel(e.target.value)}
                                        className="appearance-none w-full pl-3 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                        <option value="todos">Todos los períodos</option>
                                        {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}{p.activo ? ' ●' : ''}</option>)}
                                    </select>
                                    <svg className="pointer-events-none absolute right-2.5 bottom-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg>
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Estado</label>
                                    <select value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value)}
                                        className="appearance-none w-full pl-3 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                        <option value="todos">Todos los estados</option>
                                        {Object.entries(estadosConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                    <svg className="pointer-events-none absolute right-2.5 bottom-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Buscar</label>
                                    <div className="relative">
                                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input type="text" placeholder="Estudiante..." value={busqueda}
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
                                    {nivelSel !== 'todos' && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${nivelBadge(nivelSel)}`}>
                                            {nivelLabel(nivelSel)}
                                            <button onClick={() => { setNivelSel('todos'); setCursoSel('todos'); }} className="hover:opacity-70">×</button>
                                        </span>
                                    )}
                                    {cursoSel !== 'todos' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                            {cursoSel}
                                            <button onClick={() => setCursoSel('todos')} className="hover:opacity-70">×</button>
                                        </span>
                                    )}
                                    {conceptoFiltro !== 'todos' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                            {conceptos.find(c => c.id.toString() === conceptoFiltro)?.nombre}
                                            <button onClick={() => setConceptoFiltro('todos')} className="hover:opacity-70">×</button>
                                        </span>
                                    )}
                                    {periodoSel !== 'todos' && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                            {periodos.find(p => p.id.toString() === periodoSel)?.nombre}
                                            <button onClick={() => setPeriodoSel('todos')} className="hover:opacity-70">×</button>
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

                        {/* Info bar */}
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Mostrando <span className="font-semibold text-gray-800">{pagosFiltrados.length}</span> de {pagos.length} pagos
                            </p>
                        </div>

                        {/* Tabla Desktop */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hidden sm:block">
                            {pagosFiltrados.length === 0 ? (
                                <div className="p-12 text-center">
                                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-gray-500 font-medium">No se encontraron pagos</p>
                                    <p className="text-gray-400 text-sm mt-1">Ajusta los filtros o registra un nuevo pago</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[900px]">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-100">
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estudiante</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Concepto</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Vencimiento</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {pagosFiltrados.map(p => (
                                                <tr key={p.id} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#293577] to-[#181b49] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                                {p.estudiante.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-gray-800 truncate">{p.estudiante}</p>
                                                                <p className="text-xs text-gray-400 truncate">{p.curso} • {p.periodo}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{p.concepto}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-800 text-right font-semibold whitespace-nowrap">{fmt(p.monto)}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500 text-center whitespace-nowrap">{fechaVencimientoVisible(p)}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estadosConfig[p.estado]?.color}`}>
                                                            <span className={`w-1.5 h-1.5 rounded-full ${estadosConfig[p.estado]?.dot}`} />
                                                            {estadosConfig[p.estado]?.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex justify-end items-center gap-1">
                                                            <button onClick={() => setDetallePago(p)} title="Detalle"
                                                                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#293577] transition-colors">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                </svg>
                                                            </button>
                                                            {(p.estado === 'pendiente' || p.estado === 'vencido') && (
                                                                <button onClick={() => { setConfirmarPago(p); setFormConfirmar({ metodo_pago: 'Efectivo', referencia: '' }); }}
                                                                    title="Confirmar pago"
                                                                    className="p-2 rounded-lg hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                            {p.estado !== 'anulado' && (
                                                                <button onClick={() => handleAnular(p)} title="Anular"
                                                                    className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                                    </svg>
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
                            {pagosFiltrados.length === 0 ? (
                                <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
                                    <p className="text-gray-500 text-sm">No se encontraron pagos</p>
                                </div>
                            ) : pagosFiltrados.map(p => (
                                <div key={p.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#293577] to-[#181b49] flex items-center justify-center text-white font-bold flex-shrink-0">
                                                {p.estudiante.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-gray-800 text-sm truncate">{p.estudiante}</p>
                                                <p className="text-xs text-gray-400 truncate">{p.curso} • {p.concepto}</p>
                                            </div>
                                        </div>
                                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${estadosConfig[p.estado]?.color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${estadosConfig[p.estado]?.dot}`} />
                                            {estadosConfig[p.estado]?.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                        <div>
                                            <p className="text-lg font-bold text-gray-800">{fmt(p.monto)}</p>
                                            <p className="text-xs text-gray-400">Vence: {fechaVencimientoVisible(p)}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setDetallePago(p)}
                                                className="p-2 rounded-lg bg-gray-100 text-gray-600 text-xs">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                            {(p.estado === 'pendiente' || p.estado === 'vencido') && (
                                                <button onClick={() => { setConfirmarPago(p); setFormConfirmar({ metodo_pago: 'Efectivo', referencia: '' }); }}
                                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-medium">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Pagar
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* ═══════════════════ TAB CONCEPTOS ═══════════════════ */}
                {activeTab === 'conceptos' && (
                    <>
                        {/* Info */}
                        <p className="text-sm text-gray-500">
                            {conceptos.length} conceptos registrados • {conceptos.filter(c => c.activo).length} activos
                        </p>

                        {/* Desktop */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hidden sm:block">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100">
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                                            <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</th>
                                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
                                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Periodicidad</th>
                                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Pagos</th>
                                            <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {conceptos.map(c => (
                                            <tr key={c.id} className={`hover:bg-gray-50/70 transition-colors ${!c.activo ? 'opacity-50' : ''}`}>
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-semibold text-gray-800">{c.nombre}</p>
                                                        {c.es_certificado && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                                                                Certificado
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 text-sm text-gray-500 max-w-[200px] truncate">{c.descripcion || '—'}</td>
                                                <td className="px-5 py-3 text-sm font-semibold text-gray-800 text-right whitespace-nowrap">{fmt(c.monto)}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                        {periodicidadLabel[c.periodicidad]}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-sm text-gray-600 text-center">{c.pagos_count}</td>
                                                <td className="px-5 py-3 text-center">
                                                    <button
                                                        onClick={() => handleToggleConcepto(c)}
                                                        disabled={c.es_certificado}
                                                        title={c.es_certificado ? 'Gestionado desde Tipos de Certificado' : undefined}
                                                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${c.activo ? 'bg-green-500' : 'bg-gray-300'} ${c.es_certificado ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${c.activo ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                                    </button>
                                                </td>
                                                <td className="px-5 py-3">
                                                    <div className="flex justify-end gap-1">
                                                        {!c.es_certificado ? (
                                                            <>
                                                                <button onClick={() => abrirEditConcepto(c)} title="Editar"
                                                                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-[#293577] transition-colors">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                                <button onClick={() => handleEliminarConcepto(c)} title="Eliminar"
                                                                    className="p-2 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600 transition-colors">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span className="text-xs text-gray-400">Gestionado en Certificados</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Cards */}
                        <div className="sm:hidden space-y-3">
                            {conceptos.map(c => (
                                <div key={c.id} className={`bg-white rounded-xl shadow-sm p-4 border border-gray-100 ${!c.activo ? 'opacity-50' : ''}`}>
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-gray-800">{c.nombre}</p>
                                                {c.es_certificado && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 text-indigo-700">
                                                        Certificado
                                                    </span>
                                                )}
                                            </div>
                                            {c.descripcion && <p className="text-xs text-gray-400 mt-0.5">{c.descripcion}</p>}
                                        </div>
                                        <button
                                            onClick={() => handleToggleConcepto(c)}
                                            disabled={c.es_certificado}
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0 ${c.activo ? 'bg-green-500' : 'bg-gray-300'} ${c.es_certificado ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${c.activo ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <p className="text-lg font-bold text-gray-800">{fmt(c.monto)}</p>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700">
                                                {periodicidadLabel[c.periodicidad]}
                                            </span>
                                        </div>
                                        {!c.es_certificado ? (
                                            <div className="flex gap-1">
                                                <button onClick={() => abrirEditConcepto(c)}
                                                    className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-[#293577] transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button onClick={() => handleEliminarConcepto(c)}
                                                    className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">Gestionado en Certificados</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* ═══════════════════ MODAL REGISTRAR PAGO ═══════════════════ */}
            {showRegistrar && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowRegistrar(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="sticky top-0 bg-white px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800">Registrar Pago</h2>
                            <button onClick={() => setShowRegistrar(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={handleRegistrarPago} className="px-6 py-4 space-y-4">
                            {/* Estudiante */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estudiante *</label>
                                <input type="text" placeholder="Buscar estudiante..." value={buscaEstudiante}
                                    onChange={e => { setBuscaEstudiante(e.target.value); setFormPago(prev => ({ ...prev, estudiante_id: '' })); }}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]" />
                                {buscaEstudiante && !formPago.estudiante_id && (
                                    <div className="mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                                        {estudiantesFiltrados.map(e => (
                                            <button key={e.id} type="button"
                                                onClick={() => { setFormPago(prev => ({ ...prev, estudiante_id: e.id.toString() })); setBuscaEstudiante(e.name); }}
                                                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0">
                                                <span className="font-medium">{e.name}</span>
                                                <span className="text-gray-400 ml-2 text-xs">{e.curso}</span>
                                            </button>
                                        ))}
                                        {estudiantesFiltrados.length === 0 && (
                                            <p className="px-3 py-2 text-sm text-gray-400">Sin resultados</p>
                                        )}
                                    </div>
                                )}
                                {formPago.estudiante_id && (
                                    <p className="mt-1 text-xs text-green-600">✓ Estudiante seleccionado</p>
                                )}
                            </div>

                            {/* Concepto + Período */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
                                    <select value={formPago.concepto_pago_id} onChange={e => handleConceptoSelect(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                        <option value="">Seleccionar...</option>
                                        {conceptos.filter(c => c.activo).map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.es_certificado ? '[Certificado] ' : ''}{c.nombre} ({fmt(c.monto)})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                                    <select
                                        value={formPago.periodo_id}
                                        disabled={esConceptoCertificado}
                                        onChange={e => setFormPago(prev => ({ ...prev, periodo_id: e.target.value }))}
                                        className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] ${esConceptoCertificado ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}`}>
                                        <option value="">Sin período</option>
                                        {periodos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            {esConceptoCertificado && (
                                <div className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
                                    Este concepto crea automáticamente una solicitud de certificado.
                                    {conceptoSeleccionado?.tipo_certificado_nombre ? ` Tipo: ${conceptoSeleccionado.tipo_certificado_nombre}.` : ''}
                                    {' '}El monto se toma del precio configurado en Certificados.
                                </div>
                            )}

                            {/* Monto + Estado */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                                    <input type="number" step="100" min="0" placeholder="0" value={formPago.monto}
                                        readOnly={esConceptoCertificado}
                                        onChange={e => setFormPago(prev => ({ ...prev, monto: e.target.value }))}
                                        className={`w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] ${esConceptoCertificado ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <select
                                        value={formPago.estado}
                                        onChange={e => setFormPago(prev => {
                                            const estado = e.target.value;
                                            const hoy = new Date().toISOString().slice(0, 10);
                                            return {
                                                ...prev,
                                                estado,
                                                fecha_vencimiento: estado === 'pagado' ? '' : prev.fecha_vencimiento,
                                                fecha_pago: estado === 'pagado' && !prev.fecha_pago ? hoy : prev.fecha_pago,
                                            };
                                        })}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                        <option value="pendiente">Pendiente</option>
                                        <option value="pagado">Pagado</option>
                                    </select>
                                </div>
                            </div>

                            {/* Fechas */}
                            <div className={`grid gap-3 ${formPago.estado === 'pagado' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                                {formPago.estado !== 'pagado' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Vencimiento *</label>
                                        <input type="date" value={formPago.fecha_vencimiento}
                                            onChange={e => setFormPago(prev => ({ ...prev, fecha_vencimiento: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]" />
                                    </div>
                                )}
                                {formPago.estado === 'pagado' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Pago</label>
                                        <input type="date" value={formPago.fecha_pago}
                                            onChange={e => setFormPago(prev => ({ ...prev, fecha_pago: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]" />
                                    </div>
                                )}
                            </div>

                            {/* Método + Referencia (si es pagado) */}
                            {formPago.estado === 'pagado' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                                        <select value={formPago.metodo_pago} onChange={e => setFormPago(prev => ({ ...prev, metodo_pago: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                            <option value="">Seleccionar...</option>
                                            {metodos.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Referencia</label>
                                        <input type="text" placeholder="N° referencia" value={formPago.referencia}
                                            onChange={e => setFormPago(prev => ({ ...prev, referencia: e.target.value }))}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]" />
                                    </div>
                                </div>
                            )}

                            {/* Notas */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                                <textarea rows={2} placeholder="Observaciones (opcional)" value={formPago.notas}
                                    onChange={e => setFormPago(prev => ({ ...prev, notas: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] resize-none" />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setShowRegistrar(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !formPago.estudiante_id || !formPago.concepto_pago_id || !formPago.monto || (requiereVencimiento && !formPago.fecha_vencimiento)}
                                    className="flex-1 bg-[#293577] hover:bg-[#181b49] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                                    {processing ? 'Guardando...' : 'Registrar Pago'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ═══════════════════ MODAL CONFIRMAR PAGO ═══════════════════ */}
            {confirmarPago && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setConfirmarPago(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="px-6 pt-5 pb-3 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">Confirmar Pago</h2>
                            <p className="text-sm text-gray-400 mt-0.5">{confirmarPago.estudiante} — {confirmarPago.concepto}</p>
                        </div>
                        <div className="px-6 py-4 space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                                <p className="text-2xl font-bold text-green-600">{fmt(confirmarPago.monto)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago *</label>
                                <select value={formConfirmar.metodo_pago}
                                    onChange={e => setFormConfirmar(prev => ({ ...prev, metodo_pago: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                    {metodos.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">N° Referencia</label>
                                <input type="text" placeholder="Opcional" value={formConfirmar.referencia}
                                    onChange={e => setFormConfirmar(prev => ({ ...prev, referencia: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]" />
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setConfirmarPago(null)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                    Cancelar
                                </button>
                                <button type="button" onClick={handleConfirmar} disabled={processing}
                                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                                    {processing ? 'Guardando...' : 'Confirmar Pago'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════ MODAL DETALLE PAGO ═══════════════════ */}
            {detallePago && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDetallePago(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-gray-800">Detalle del Pago</h2>
                            <button onClick={() => setDetallePago(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="px-6 py-4 space-y-3">
                            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#293577] to-[#181b49] flex items-center justify-center text-white text-lg font-bold">
                                    {detallePago.estudiante.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{detallePago.estudiante}</p>
                                    <p className="text-xs text-gray-400">{detallePago.curso} • {detallePago.periodo}</p>
                                </div>
                            </div>
                            <div className="space-y-2.5 text-sm">
                                {[
                                    ['Concepto', detallePago.concepto],
                                    ['Monto', fmt(detallePago.monto)],
                                    ['Vencimiento', fechaVencimientoVisible(detallePago)],
                                    ['Fecha Pago', detallePago.fecha_pago ?? '—'],
                                    ['Método', detallePago.metodo_pago ?? '—'],
                                    ['Referencia', detallePago.referencia ?? '—'],
                                    ['Notas', detallePago.notas ?? '—'],
                                ].map(([label, value]) => (
                                    <div key={label} className="flex justify-between">
                                        <span className="text-gray-500">{label}</span>
                                        <span className="font-medium text-gray-800 text-right">{value}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Estado</span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${estadosConfig[detallePago.estado]?.color}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${estadosConfig[detallePago.estado]?.dot}`} />
                                        {estadosConfig[detallePago.estado]?.label}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-3 border-t border-gray-100">
                                {(detallePago.estado === 'pendiente' || detallePago.estado === 'vencido') && (
                                    <button onClick={() => { setDetallePago(null); setConfirmarPago(detallePago); setFormConfirmar({ metodo_pago: 'Efectivo', referencia: '' }); }}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-medium transition-colors">
                                        Confirmar Pago
                                    </button>
                                )}
                                {detallePago.estado !== 'anulado' && (
                                    <button onClick={() => { setDetallePago(null); handleAnular(detallePago); }}
                                        className="flex-1 border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-xl text-sm font-medium transition-colors">
                                        Anular
                                    </button>
                                )}
                                {detallePago.estado === 'anulado' && (
                                    <button onClick={() => { setDetallePago(null); handleEliminar(detallePago); }}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl text-sm font-medium transition-colors">
                                        Eliminar permanente
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════ MODAL CONCEPTO ═══════════════════ */}
            {showConcepto && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowConcepto(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="px-6 pt-5 pb-3 border-b border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800">
                                {editConcepto ? 'Editar Concepto' : 'Nuevo Concepto'}
                            </h2>
                        </div>
                        <form onSubmit={handleGuardarConcepto} className="px-6 py-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                <input type="text" placeholder="Ej: Pensión Marzo" value={formConcepto.nombre}
                                    onChange={e => handleConceptoChange('nombre', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <input type="text" placeholder="Opcional" value={formConcepto.descripcion}
                                    onChange={e => handleConceptoChange('descripcion', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                                    <input type="number" step="100" min="0" placeholder="0" value={formConcepto.monto}
                                        onChange={e => handleConceptoChange('monto', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Periodicidad</label>
                                    <select value={formConcepto.periodicidad}
                                        onChange={e => handleConceptoChange('periodicidad', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                        <option value="mensual">Mensual</option>
                                        <option value="unico">Único</option>
                                        <option value="anual">Anual</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={() => setShowConcepto(false)}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium text-gray-600">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={processing || !formConcepto.nombre || !formConcepto.monto}
                                    className="flex-1 bg-[#293577] hover:bg-[#181b49] disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors">
                                    {processing ? 'Guardando...' : (editConcepto ? 'Guardar Cambios' : 'Crear Concepto')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
