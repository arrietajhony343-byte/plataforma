import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState, useMemo, useCallback } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';
import * as XLSX from 'xlsx';

interface Sede {
    id: number;
    nombre: string;
}

interface Deudor {
    id: number;
    nombre: string;
    documento?: string | null;
    email?: string | null;
    telefono?: string | null;
    acudiente?: string | null;
    acudiente_doc?: string | null;
    acudiente_tel?: string | null;
    curso: string;
    nivel?: string | null;
    sede_id?: number | null;
    sede?: string | null;
    pagosVencidos: number;
    deudaTotal: number;
}

interface Movimiento {
    id: number;
    estudiante_id?: number | null;
    estudiante: string;
    documento?: string | null;
    telefono?: string | null;
    email?: string | null;
    concepto: string;
    monto: number;
    fecha: string;
    metodo: string;
    referencia: string;
    curso?: string | null;
    nivel?: string | null;
    sede_id?: number | null;
    sede?: string | null;
}

interface Props {
    resumen: {
        totalRecaudado: number;
        totalPendiente: number;
        totalVencido: number;
        totalGeneral: number;
    };
    sedes: Sede[];
    periodoActivo: { id: number; nombre: string } | null;
    ingresosMensuales: { mes: string; total: number }[];
    ingresosPorConcepto: { concepto: string; pagado: number; pendiente: number; vencido: number; total: number }[];
    deudores: Deudor[];
    ultimosPagos: Movimiento[];
}

const fmt = (n: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
}).format(n || 0);

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

export default function Contabilidad({
    resumen,
    sedes,
    periodoActivo,
    ingresosMensuales,
    ingresosPorConcepto,
    deudores,
    ultimosPagos,
}: Props) {
    const [vistaActiva, setVistaActiva] = useState<'movimientos' | 'conceptos' | 'resumen' | 'deudores'>('resumen');

    const [sedeSel, setSedeSel] = useState('todas');
    const [nivelSel, setNivelSel] = useState('todos');
    const [cursoSel, setCursoSel] = useState('todos');
    const [metodoSel, setMetodoSel] = useState('todos');
    const [conceptoSel, setConceptoSel] = useState('todos');
    const [deudaMin, setDeudaMin] = useState('');
    const [vencidosMin, setVencidosMin] = useState('');
    const [busqueda, setBusqueda] = useState('');

    const [detalleMovimiento, setDetalleMovimiento] = useState<Movimiento | null>(null);
    const [detalleDeudor, setDetalleDeudor] = useState<Deudor | null>(null);

    const maxMensual = useMemo(() => Math.max(...ingresosMensuales.map(m => m.total), 1), [ingresosMensuales]);

    const nivelesDisponibles = useMemo(() => {
        const bag = new Set<string>();
        ultimosPagos.forEach(p => bag.add(normalizeNivel(p.nivel)));
        deudores.forEach(m => bag.add(normalizeNivel(m.nivel)));
        bag.delete('sin_nivel');
        return [...bag];
    }, [ultimosPagos, deudores]);

    const cursosDisponibles = useMemo(() => {
        const bag = new Set<string>();
        ultimosPagos.forEach(p => { if (p.curso?.trim()) bag.add(p.curso); });
        deudores.forEach(m => { if (m.curso?.trim()) bag.add(m.curso); });
        return [...bag].sort();
    }, [ultimosPagos, deudores]);

    const metodosDisponibles = useMemo(() => {
        const bag = new Set<string>();
        ultimosPagos.forEach(p => {
            if (p.metodo?.trim()) bag.add(p.metodo);
        });
        return [...bag].sort((a, b) => a.localeCompare(b));
    }, [ultimosPagos]);

    const conceptosDisponibles = useMemo(() => {
        const bag = new Set<string>();
        ingresosPorConcepto.forEach(c => bag.add(c.concepto));
        return [...bag].sort((a, b) => a.localeCompare(b));
    }, [ingresosPorConcepto]);

    const conceptosFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        const base = [...ingresosPorConcepto].sort((a, b) => b.total - a.total);
        return base.filter(c => {
            if (conceptoSel !== 'todos' && c.concepto !== conceptoSel) return false;
            if (!q) return true;
            return c.concepto.toLowerCase().includes(q);
        });
    }, [ingresosPorConcepto, conceptoSel, busqueda]);

    const ultimosPagosFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return ultimosPagos.filter(p => {
            if (sedeSel !== 'todas' && p.sede_id?.toString() !== sedeSel) return false;
            if (nivelSel !== 'todos' && normalizeNivel(p.nivel) !== nivelSel) return false;
            if (cursoSel !== 'todos' && p.curso !== cursoSel) return false;
            if (metodoSel !== 'todos' && p.metodo !== metodoSel) return false;
            if (conceptoSel !== 'todos' && p.concepto !== conceptoSel) return false;

            if (!q) return true;
            return [p.estudiante, p.concepto, p.referencia, p.metodo, p.curso, p.sede, p.documento]
                .filter(Boolean)
                .some(v => String(v).toLowerCase().includes(q));
        });
    }, [ultimosPagos, sedeSel, nivelSel, cursoSel, metodoSel, conceptoSel, busqueda]);

    const deudoresFiltrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        const deuda = Number(deudaMin || 0);
        const vencidos = Number(vencidosMin || 0);

        return deudores.filter(m => {
            if (sedeSel !== 'todas' && m.sede_id?.toString() !== sedeSel) return false;
            if (nivelSel !== 'todos' && normalizeNivel(m.nivel) !== nivelSel) return false;
            if (cursoSel !== 'todos' && m.curso !== cursoSel) return false;
            if (deuda > 0 && m.deudaTotal < deuda) return false;
            if (vencidos > 0 && m.pagosVencidos < vencidos) return false;

            if (!q) return true;
            return [m.nombre, m.curso, m.sede, m.documento, m.acudiente]
                .filter(Boolean)
                .some(v => String(v).toLowerCase().includes(q));
        });
    }, [deudores, sedeSel, nivelSel, cursoSel, deudaMin, vencidosMin, busqueda]);

    const totalConceptos = useMemo(() => conceptosFiltrados.reduce((sum, c) => sum + c.total, 0), [conceptosFiltrados]);

    const cumplimiento = useMemo(() => {
        if (resumen.totalGeneral <= 0) return 0;
        return Math.round((resumen.totalRecaudado / resumen.totalGeneral) * 100);
    }, [resumen]);

    const exportarVistaActiva = useCallback(() => {
        let rows: Record<string, string | number>[] = [];
        let sheetName = 'Resumen';

        if (vistaActiva === 'movimientos') {
            sheetName = 'Movimientos';
            rows = ultimosPagosFiltrados.map(p => ({
                Fecha: p.fecha ?? '',
                Estudiante: p.estudiante,
                Documento: p.documento ?? '',
                Sede: p.sede ?? 'N/A',
                Curso: p.curso ?? 'N/A',
                Nivel: nivelLabel(p.nivel),
                Concepto: p.concepto,
                Metodo: p.metodo ?? '',
                Referencia: p.referencia ?? '',
                Monto: p.monto,
            }));
        }

        if (vistaActiva === 'deudores') {
            sheetName = 'Deudores';
            rows = deudoresFiltrados.map(m => ({
                Estudiante: m.nombre,
                Documento: m.documento ?? '',
                Sede: m.sede ?? 'N/A',
                Curso: m.curso,
                Nivel: nivelLabel(m.nivel),
                Acudiente: m.acudiente ?? '',
                'Pagos vencidos': m.pagosVencidos,
                'Deuda total': m.deudaTotal,
            }));
        }

        if (vistaActiva === 'conceptos') {
            sheetName = 'Conceptos';
            rows = conceptosFiltrados.map(c => ({
                Concepto: c.concepto,
                Pagado: c.pagado,
                Pendiente: c.pendiente,
                Vencido: c.vencido,
                Total: c.total,
            }));
        }

        if (vistaActiva === 'resumen') {
            rows = [{
                'Total recaudado': resumen.totalRecaudado,
                'Total pendiente': resumen.totalPendiente,
                'Total vencido': resumen.totalVencido,
                'Total general': resumen.totalGeneral,
                Cumplimiento: `${cumplimiento}%`,
            }];
        }

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, `Contabilidad_${sheetName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }, [vistaActiva, ultimosPagosFiltrados, deudoresFiltrados, conceptosFiltrados, resumen, cumplimiento]);

    const hayFiltros = (
        sedeSel !== 'todas' ||
        nivelSel !== 'todos' ||
        cursoSel !== 'todos' ||
        metodoSel !== 'todos' ||
        conceptoSel !== 'todos' ||
        deudaMin !== '' ||
        vencidosMin !== '' ||
        busqueda.trim() !== ''
    );

    const limpiarFiltros = () => {
        setSedeSel('todas');
        setNivelSel('todos');
        setCursoSel('todos');
        setMetodoSel('todos');
        setConceptoSel('todos');
        setDeudaMin('');
        setVencidosMin('');
        setBusqueda('');
    };

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Contabilidad">
            <Head title="Contabilidad" />

            <div className="space-y-5 sm:space-y-6" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                <div className="rounded-2xl bg-gradient-to-r from-[#293577] to-[#181b49] text-white p-5 sm:p-6 shadow-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold" style={{ fontFamily: "'Inter', sans-serif" }}>Contabilidad</h1>
                            <p className="text-sm text-blue-100 mt-1">Vista ejecutiva de recaudo, cartera y movimientos</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={exportarVistaActiva}
                                className="px-4 py-2 rounded-xl text-sm font-semibold bg-white text-[#1f2b64] hover:bg-blue-50 transition-colors"
                            >
                                Exportar Excel
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-100/25 text-white hover:bg-blue-100/35 transition-colors"
                            >
                                Imprimir
                            </button>
                        </div>
                    </div>
                    <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-300" style={{ width: `${Math.min(cumplimiento, 100)}%` }} />
                    </div>
                    <p className="text-xs text-blue-100 mt-1">Cumplimiento de recaudo: {cumplimiento}%</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
                    <div className="flex flex-wrap gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                        {([
                            { key: 'resumen', label: 'Resumen' },
                            { key: 'conceptos', label: 'Por Concepto' },
                            { key: 'movimientos', label: 'Movimientos' },
                            { key: 'deudores', label: 'Deudores' },
                        ] as const).map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setVistaActiva(tab.key)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${vistaActiva === tab.key ? 'bg-[#293577] text-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Sede</label>
                            <select
                                value={sedeSel}
                                onChange={e => setSedeSel(e.target.value)}
                                className="appearance-none w-full pl-4 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                            >
                                <option value="todas">Todas las sedes</option>
                                {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                            </select>
                            <svg className="pointer-events-none absolute right-2.5 bottom-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg>
                        </div>

                        <div className="relative">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Nivel</label>
                            <select
                                value={nivelSel}
                                onChange={e => { setNivelSel(e.target.value); setCursoSel('todos'); }}
                                className="appearance-none w-full pl-4 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                            >
                                <option value="todos">Todos los niveles</option>
                                {nivelesDisponibles.map(n => <option key={n} value={n}>{nivelLabel(n)}</option>)}
                            </select>
                            <svg className="pointer-events-none absolute right-2.5 bottom-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg>
                        </div>

                        {(vistaActiva === 'movimientos' || vistaActiva === 'deudores') && (
                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Curso</label>
                                <select
                                    value={cursoSel}
                                    onChange={e => setCursoSel(e.target.value)}
                                    className="appearance-none w-full pl-4 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                                >
                                    <option value="todos">Todos los cursos</option>
                                    {cursosDisponibles
                                        .filter(c => nivelSel === 'todos' || normalizeNivel(
                                            (ultimosPagos.find(p => p.curso === c) ?? deudores.find(d => d.curso === c))?.nivel
                                        ) === nivelSel)
                                        .map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <svg className="pointer-events-none absolute right-2.5 bottom-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg>
                            </div>
                        )}

                        {vistaActiva === 'movimientos' && (
                            <>
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Metodo</label>
                                    <select
                                        value={metodoSel}
                                        onChange={e => setMetodoSel(e.target.value)}
                                        className="appearance-none w-full pl-4 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                                    >
                                        <option value="todos">Todos</option>
                                        {metodosDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                                    </select>
                                    <svg className="pointer-events-none absolute right-2.5 bottom-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg>
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Concepto</label>
                                    <select
                                        value={conceptoSel}
                                        onChange={e => setConceptoSel(e.target.value)}
                                        className="appearance-none w-full pl-4 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                                    >
                                        <option value="todos">Todos</option>
                                        {conceptosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <svg className="pointer-events-none absolute right-2.5 bottom-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg>
                                </div>
                            </>
                        )}

                        {vistaActiva === 'conceptos' && (
                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Concepto</label>
                                <select
                                    value={conceptoSel}
                                    onChange={e => setConceptoSel(e.target.value)}
                                    className="appearance-none w-full pl-4 pr-9 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                                >
                                    <option value="todos">Todos</option>
                                    {conceptosDisponibles.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <svg className="pointer-events-none absolute right-2.5 bottom-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" /></svg>
                            </div>
                        )}

                        {vistaActiva === 'deudores' && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Deuda minima</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={deudaMin}
                                        onChange={e => setDeudaMin(e.target.value)}
                                        placeholder="Ej: 100000"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Vencidos minimos</label>
                                    <input
                                        type="number"
                                        min={0}
                                        value={vencidosMin}
                                        onChange={e => setVencidosMin(e.target.value)}
                                        placeholder="Ej: 2"
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Buscar</label>
                        <input
                            type="text"
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            placeholder={
                                vistaActiva === 'deudores'
                                    ? 'Buscar por estudiante, documento, acudiente o curso...'
                                    : vistaActiva === 'conceptos'
                                        ? 'Buscar por concepto...'
                                        : 'Buscar por estudiante, documento, concepto, referencia o curso...'
                            }
                            className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]"
                        />
                    </div>

                    {hayFiltros && (
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs text-gray-500">Filtros activos:</span>
                            {sedeSel !== 'todas' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-700">
                                    {sedes.find(s => s.id.toString() === sedeSel)?.nombre}
                                    <button onClick={() => setSedeSel('todas')} className="hover:opacity-70">x</button>
                                </span>
                            )}
                            {nivelSel !== 'todos' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                                    {nivelLabel(nivelSel)}
                                    <button onClick={() => { setNivelSel('todos'); setCursoSel('todos'); }} className="hover:opacity-70">x</button>
                                </span>
                            )}
                            {cursoSel !== 'todos' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                    {cursoSel}
                                    <button onClick={() => setCursoSel('todos')} className="hover:opacity-70">x</button>
                                </span>
                            )}
                            {metodoSel !== 'todos' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-cyan-100 text-cyan-700">
                                    {metodoSel}
                                    <button onClick={() => setMetodoSel('todos')} className="hover:opacity-70">x</button>
                                </span>
                            )}
                            {conceptoSel !== 'todos' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
                                    {conceptoSel}
                                    <button onClick={() => setConceptoSel('todos')} className="hover:opacity-70">x</button>
                                </span>
                            )}
                            {deudaMin !== '' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                                    Deuda {'>='} {fmt(Number(deudaMin || 0))}
                                    <button onClick={() => setDeudaMin('')} className="hover:opacity-70">x</button>
                                </span>
                            )}
                            {vencidosMin !== '' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                    Vencidos {'>='} {vencidosMin}
                                    <button onClick={() => setVencidosMin('')} className="hover:opacity-70">x</button>
                                </span>
                            )}
                            {busqueda.trim() !== '' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700">
                                    "{busqueda}" <button onClick={() => setBusqueda('')} className="hover:opacity-70">x</button>
                                </span>
                            )}
                            <button onClick={limpiarFiltros} className="text-xs text-red-500 hover:text-red-700 font-medium">Limpiar todo</button>
                        </div>
                    )}
                </div>

                {vistaActiva === 'resumen' && (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                <p className="text-xs uppercase tracking-wide text-emerald-700">Recaudado</p>
                                <p className="text-2xl font-bold text-emerald-700 mt-1">{fmt(resumen.totalRecaudado)}</p>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                                <p className="text-xs uppercase tracking-wide text-amber-700">Pendiente</p>
                                <p className="text-2xl font-bold text-amber-700 mt-1">{fmt(resumen.totalPendiente)}</p>
                            </div>
                            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                                <p className="text-xs uppercase tracking-wide text-rose-700">Vencido</p>
                                <p className="text-2xl font-bold text-rose-700 mt-1">{fmt(resumen.totalVencido)}</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <p className="text-xs uppercase tracking-wide text-blue-700">Total General</p>
                                <p className="text-2xl font-bold text-blue-700 mt-1">{fmt(resumen.totalGeneral)}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-800">Ingresos Mensuales</h3>
                                <span className="text-xs text-gray-500">Periodo activo: {periodoActivo?.nombre ?? 'No definido'}</span>
                            </div>
                            <div className="flex items-end gap-2 h-52">
                                {ingresosMensuales.map((m, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                                        <span className="text-[10px] text-gray-500">{m.total > 0 ? `${Math.round(m.total / 1000)}k` : '0'}</span>
                                        <div className="w-full h-40 bg-gray-100 rounded-t-lg relative overflow-hidden">
                                            <div
                                                className="absolute bottom-0 w-full bg-gradient-to-t from-[#293577] to-[#4d66de] rounded-t-lg"
                                                style={{ height: `${maxMensual > 0 ? (m.total / maxMensual) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-gray-500">{m.mes}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {vistaActiva === 'conceptos' && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-semibold text-gray-800">Consolidado por Concepto</h3>
                            <span className="text-xs text-gray-500">Total: {fmt(totalConceptos)}</span>
                        </div>
                        {conceptosFiltrados.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 text-sm">No hay conceptos para estos filtros</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[720px]">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Concepto</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Pagado</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Pendiente</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Vencido</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {conceptosFiltrados.map((c, i) => (
                                            <tr key={`${c.concepto}-${i}`} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-800">{c.concepto}</td>
                                                <td className="px-4 py-3 text-sm text-right text-emerald-700 font-semibold">{fmt(c.pagado)}</td>
                                                <td className="px-4 py-3 text-sm text-right text-amber-700 font-semibold">{fmt(c.pendiente)}</td>
                                                <td className="px-4 py-3 text-sm text-right text-rose-700 font-semibold">{fmt(c.vencido)}</td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">{fmt(c.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {vistaActiva === 'movimientos' && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <h3 className="font-semibold text-gray-800">Ultimos Pagos ({ultimosPagosFiltrados.length})</h3>
                        </div>
                        {ultimosPagosFiltrados.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 text-sm">No hay movimientos para estos filtros</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[980px]">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Fecha</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sede</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Curso</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Concepto</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Metodo</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Monto</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {ultimosPagosFiltrados.map(p => (
                                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm text-gray-600">{p.fecha ?? 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{p.estudiante}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{p.sede ?? 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-700">{p.curso ?? 'N/A'}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${nivelBadge(p.nivel)}`}>{nivelLabel(p.nivel)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700">{p.concepto}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{p.metodo ?? '-'}</td>
                                                <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-700">{fmt(p.monto)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => setDetalleMovimiento(p)}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                                                    >
                                                        Ver
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {vistaActiva === 'deudores' && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        {deudoresFiltrados.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="text-lg font-bold text-gray-500">Sin deudores para este filtro</p>
                                <p className="text-sm text-gray-400 mt-1">Prueba con otra sede o limpia la búsqueda</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[900px]">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estudiante</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sede</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Curso</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Vencidos</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Deuda</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Detalle</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {deudoresFiltrados.map(m => (
                                            <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.nombre}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{m.sede ?? 'N/A'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <span>{m.curso}</span>
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${nivelBadge(m.nivel)}`}>{nivelLabel(m.nivel)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">{m.pagosVencidos}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-rose-700">{fmt(m.deudaTotal)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => setDetalleDeudor(m)}
                                                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition"
                                                    >
                                                        Ver
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {(detalleMovimiento || detalleDeudor) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 bg-gradient-to-r from-[#293577] to-[#181b49] text-white flex items-center justify-between">
                            <h3 className="font-bold text-lg">{detalleMovimiento ? 'Detalle del movimiento' : 'Detalle del deudor'}</h3>
                            <button
                                onClick={() => { setDetalleMovimiento(null); setDetalleDeudor(null); }}
                                className="text-white/80 hover:text-white"
                            >
                                X
                            </button>
                        </div>

                        {detalleMovimiento && (
                            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-gray-500">Estudiante</p>
                                    <p className="font-semibold text-gray-900">{detalleMovimiento.estudiante}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Documento</p>
                                    <p className="font-semibold text-gray-900">{detalleMovimiento.documento ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Correo</p>
                                    <p className="font-semibold text-gray-900 break-all">{detalleMovimiento.email ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Teléfono</p>
                                    <p className="font-semibold text-gray-900">{detalleMovimiento.telefono ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Sede</p>
                                    <p className="font-semibold text-gray-900">{detalleMovimiento.sede ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Curso / Nivel</p>
                                    <p className="font-semibold text-gray-900">{detalleMovimiento.curso ?? 'N/A'} · {nivelLabel(detalleMovimiento.nivel)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Concepto</p>
                                    <p className="font-semibold text-gray-900">{detalleMovimiento.concepto}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Metodo</p>
                                    <p className="font-semibold text-gray-900">{detalleMovimiento.metodo || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Referencia</p>
                                    <p className="font-semibold text-gray-900">{detalleMovimiento.referencia || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Fecha</p>
                                    <p className="font-semibold text-gray-900">{detalleMovimiento.fecha || 'N/A'}</p>
                                </div>
                                <div className="sm:col-span-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                    <p className="text-xs text-emerald-700">Monto pagado</p>
                                    <p className="text-xl font-bold text-emerald-700">{fmt(detalleMovimiento.monto)}</p>
                                </div>
                            </div>
                        )}

                        {detalleDeudor && (
                            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-xs text-gray-500">Estudiante</p>
                                    <p className="font-semibold text-gray-900">{detalleDeudor.nombre}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Documento</p>
                                    <p className="font-semibold text-gray-900">{detalleDeudor.documento ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Correo</p>
                                    <p className="font-semibold text-gray-900 break-all">{detalleDeudor.email ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Teléfono</p>
                                    <p className="font-semibold text-gray-900">{detalleDeudor.telefono ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Sede</p>
                                    <p className="font-semibold text-gray-900">{detalleDeudor.sede ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Curso / Nivel</p>
                                    <p className="font-semibold text-gray-900">{detalleDeudor.curso} · {nivelLabel(detalleDeudor.nivel)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Acudiente</p>
                                    <p className="font-semibold text-gray-900">{detalleDeudor.acudiente ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Contacto acudiente</p>
                                    <p className="font-semibold text-gray-900">{detalleDeudor.acudiente_doc ?? 'N/A'} {detalleDeudor.acudiente_tel ? `· ${detalleDeudor.acudiente_tel}` : ''}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                                    <p className="text-xs text-rose-700">Pagos vencidos</p>
                                    <p className="text-xl font-bold text-rose-700">{detalleDeudor.pagosVencidos}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                                    <p className="text-xs text-rose-700">Deuda total</p>
                                    <p className="text-xl font-bold text-rose-700">{fmt(detalleDeudor.deudaTotal)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
