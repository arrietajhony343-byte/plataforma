import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

interface Sede {
    id: number;
    nombre: string;
    ciudad: string | null;
    direccion: string | null;
    telefono: string | null;
    activa: boolean;
    total_usuarios: number;
    total_cursos: number;
    created_at: string;
}

interface Props {
    sedes: Sede[];
}

const EMPTY_FORM = {
    nombre: '',
    ciudad: '',
    direccion: '',
    telefono: '',
    activa: true,
};

export default function Sedes({ sedes: initialSedes }: Props) {
    const [sedes, setSedes] = useState<Sede[]>(initialSedes);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterActiva, setFilterActiva] = useState('todas');
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingSede, setEditingSede] = useState<Sede | null>(null);
    const [deleteSede, setDeleteSede] = useState<Sede | null>(null);
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [processing, setProcessing] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const filtered = useMemo(() => {
        return sedes.filter(s => {
            const matchSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (s.ciudad || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchActiva = filterActiva === 'todas' || (filterActiva === 'activa' ? s.activa : !s.activa);
            return matchSearch && matchActiva;
        });
    }, [sedes, searchTerm, filterActiva]);

    const openCreate = () => {
        setEditingSede(null);
        setFormData({ ...EMPTY_FORM });
        setFormErrors({});
        setShowModal(true);
    };

    const openEdit = (sede: Sede) => {
        setEditingSede(sede);
        setFormData({
            nombre: sede.nombre,
            ciudad: sede.ciudad ?? '',
            direccion: sede.direccion ?? '',
            telefono: sede.telefono ?? '',
            activa: sede.activa,
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleSubmit = () => {
        const errors: Record<string, string> = {};
        if (!formData.nombre.trim()) errors.nombre = 'El nombre es requerido.';
        if (Object.keys(errors).length) { setFormErrors(errors); return; }

        setProcessing(true);
        const payload = { ...formData };

        if (editingSede) {
            router.put(`/admin/sedes/${editingSede.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => {
                    setSedes(prev => prev.map(s =>
                        s.id === editingSede.id
                            ? { ...s, ...payload, nombre: payload.nombre, ciudad: payload.ciudad || null, direccion: payload.direccion || null, telefono: payload.telefono || null }
                            : s
                    ));
                    setShowModal(false);
                    setProcessing(false);
                },
                onError: (errs) => { setFormErrors(errs); setProcessing(false); },
            });
        } else {
            router.post('/admin/sedes', payload, {
                preserveScroll: true,
                onSuccess: () => { router.reload({ only: ['sedes'] }); setShowModal(false); setProcessing(false); },
                onError: (errs) => { setFormErrors(errs); setProcessing(false); },
            });
        }
    };

    const confirmDelete = (sede: Sede) => {
        setDeleteSede(sede);
        setShowDeleteModal(true);
    };

    const handleDelete = () => {
        if (!deleteSede) return;
        setProcessing(true);
        router.delete(`/admin/sedes/${deleteSede.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setSedes(prev => prev.filter(s => s.id !== deleteSede.id));
                setShowDeleteModal(false);
                setProcessing(false);
            },
            onError: () => setProcessing(false),
        });
    };

    const totalActivas = sedes.filter(s => s.activa).length;
    const totalUsuarios = sedes.reduce((acc, s) => acc + s.total_usuarios, 0);
    const totalCursos = sedes.reduce((acc, s) => acc + s.total_cursos, 0);

    return (
        <SidebarLayout menuItems={adminMenuItems}>
            <Head title="Sedes" />
            <div className="p-6 max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Sedes</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Administra las sedes o campus de la institución</p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium transition"
                        style={{ backgroundColor: '#293577' }}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Nueva Sede
                    </button>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                        { label: 'Sedes activas', value: totalActivas, color: '#293577' },
                        { label: 'Total usuarios', value: totalUsuarios, color: '#16a34a' },
                        { label: 'Total cursos', value: totalCursos, color: '#ca8a04' },
                    ].map(m => (
                        <div key={m.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{m.label}</p>
                            <p className="text-3xl font-bold mt-1" style={{ color: m.color }}>{m.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-3 items-center">
                    <input
                        type="text"
                        placeholder="Buscar sede o ciudad..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 w-64"
                        style={{ '--tw-ring-color': '#293577' } as React.CSSProperties}
                    />
                    <select
                        value={filterActiva}
                        onChange={e => setFilterActiva(e.target.value)}
                        className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                        style={{ '--tw-ring-color': '#293577' } as React.CSSProperties}
                    >
                        <option value="todas">Todas</option>
                        <option value="activa">Activas</option>
                        <option value="inactiva">Inactivas</option>
                    </select>
                    <span className="text-sm text-gray-400 ml-auto">{filtered.length} sede{filtered.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Tabla */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {filtered.length === 0 ? (
                        <div className="py-16 text-center text-gray-400 text-sm">
                            No se encontraron sedes
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Nombre</th>
                                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Ciudad</th>
                                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Dirección</th>
                                    <th className="px-5 py-3 text-left font-semibold text-gray-600">Teléfono</th>
                                    <th className="px-5 py-3 text-center font-semibold text-gray-600">Usuarios</th>
                                    <th className="px-5 py-3 text-center font-semibold text-gray-600">Cursos</th>
                                    <th className="px-5 py-3 text-center font-semibold text-gray-600">Estado</th>
                                    <th className="px-5 py-3 text-center font-semibold text-gray-600">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(sede => (
                                    <tr key={sede.id} className="hover:bg-gray-50 transition">
                                        <td className="px-5 py-3 font-medium text-gray-900">{sede.nombre}</td>
                                        <td className="px-5 py-3 text-gray-600">{sede.ciudad || '—'}</td>
                                        <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{sede.direccion || '—'}</td>
                                        <td className="px-5 py-3 text-gray-500">{sede.telefono || '—'}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                {sede.total_usuarios}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                                                {sede.total_cursos}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sede.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                {sede.activa ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => openEdit(sede)}
                                                    title="Editar"
                                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => confirmDelete(sede)}
                                                    title="Eliminar"
                                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* ====== Modal Crear / Editar ====== */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingSede ? 'Editar Sede' : 'Nueva Sede'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Nombre */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={e => setFormData(p => ({ ...p, nombre: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                                    style={{ '--tw-ring-color': '#293577' } as React.CSSProperties}
                                    placeholder="Ej: Sede Bogotá"
                                />
                                {formErrors.nombre && <p className="text-red-500 text-xs mt-1">{formErrors.nombre}</p>}
                            </div>

                            {/* Ciudad */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Ciudad</label>
                                <input
                                    type="text"
                                    value={formData.ciudad}
                                    onChange={e => setFormData(p => ({ ...p, ciudad: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                                    style={{ '--tw-ring-color': '#293577' } as React.CSSProperties}
                                    placeholder="Ej: Bogotá"
                                />
                            </div>

                            {/* Dirección */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Dirección</label>
                                <input
                                    type="text"
                                    value={formData.direccion}
                                    onChange={e => setFormData(p => ({ ...p, direccion: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                                    style={{ '--tw-ring-color': '#293577' } as React.CSSProperties}
                                    placeholder="Ej: Calle 100 # 50 - 20"
                                />
                            </div>

                            {/* Teléfono */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono</label>
                                <input
                                    type="text"
                                    value={formData.telefono}
                                    onChange={e => setFormData(p => ({ ...p, telefono: e.target.value }))}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2"
                                    style={{ '--tw-ring-color': '#293577' } as React.CSSProperties}
                                    placeholder="Ej: 601 234 5678"
                                />
                            </div>

                            {/* Activa */}
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setFormData(p => ({ ...p, activa: !p.activa }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.activa ? '' : 'bg-gray-300'}`}
                                    style={formData.activa ? { backgroundColor: '#293577' } : {}}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.activa ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <span className="text-sm text-gray-700">{formData.activa ? 'Sede activa' : 'Sede inactiva'}</span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={processing}
                                className="px-5 py-2 rounded-xl text-white text-sm font-medium transition disabled:opacity-60"
                                style={{ backgroundColor: '#293577' }}
                            >
                                {processing ? 'Guardando...' : editingSede ? 'Guardar cambios' : 'Crear sede'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ====== Modal Confirmar Eliminación ====== */}
            {showDeleteModal && deleteSede && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-full bg-red-100">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                            </div>
                            <h2 className="text-base font-bold text-gray-900">Eliminar sede</h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                            ¿Deseas eliminar la sede <span className="font-semibold">"{deleteSede.nombre}"</span>?
                        </p>
                        {(deleteSede.total_usuarios > 0 || deleteSede.total_cursos > 0) && (
                            <p className="text-xs text-red-500 mt-2">
                                Esta sede tiene {deleteSede.total_usuarios} usuario(s) y {deleteSede.total_cursos} curso(s) asignados. Debes reasignarlos antes de eliminarla.
                            </p>
                        )}
                        <div className="flex justify-end gap-3 mt-5">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={processing || deleteSede.total_usuarios > 0 || deleteSede.total_cursos > 0}
                                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition disabled:opacity-60"
                            >
                                {processing ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
