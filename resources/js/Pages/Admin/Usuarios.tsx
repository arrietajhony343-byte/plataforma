import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

interface Sede { id: number; nombre: string; ciudad: string; }

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: 'activo' | 'bloqueado' | 'pendiente';
    created_at: string;
    last_login: string | null;
    login_attempts: number;
    phone?: string;
    documento?: string;
    tipo_documento: string;
    direccion?: string;
    fecha_nacimiento?: string;
    genero?: string;
    must_change_password: boolean;
    // Datos académicos (estudiantes)
    curso_id?: number;
    nivel_educativo?: string;
    acudiente_id?: number;
    acudiente_name?: string;
    sede_id?: number;
    sede_nombre?: string;
}

interface Curso {
    id: number;
    nombre: string;
    nivel: string;
    grado: number | null;
    grupo: string;
}

interface Padre {
    id: number;
    name: string;
    documento?: string;
}

interface ActionLog {
    id: number;
    user_id: number;
    user_name: string;
    action: 'activar' | 'bloquear' | 'crear' | 'editar' | 'eliminar';
    reason?: string;
    performed_by: string;
    timestamp: string;
}

interface Props {
    users: User[];
    actionLogs: ActionLog[];
    cursos: Curso[];
    padres: Padre[];
    sedes: Sede[];
}

const EMPTY_FORM = {
    name: '', email: '', phone: '', role: 'estudiante', password: '', status: 'activo',
    documento: '', tipo_documento: 'CC', direccion: '', fecha_nacimiento: '', genero: '',
    nivel_educativo: '', curso_id: '', acudiente_id: '', sede_id: '',
};

export default function Usuarios({ users: initialUsers, actionLogs, cursos, padres, sedes }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('todos');
    const [filterStatus, setFilterStatus] = useState('todos');
    const [filterSede, setFilterSede] = useState('todas');
    const [showModal, setShowModal] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [showResetPwModal, setShowResetPwModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [blockReason, setBlockReason] = useState('');
    const [resetPwValue, setResetPwValue] = useState('');
    const [formData, setFormData] = useState({ ...EMPTY_FORM });
    const [processing, setProcessing] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [cursoBusq, setCursoBusq] = useState('');
    const [acudienteBusq, setAcudienteBusq] = useState('');

    const users = initialUsers;

    const filteredUsers = useMemo(() => users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (user.documento ?? '').includes(searchTerm);
        const matchesRole = filterRole === 'todos' || user.role === filterRole;
        const matchesStatus = filterStatus === 'todos' || user.status === filterStatus;
        const matchesSede = filterSede === 'todas' || String(user.sede_id ?? '') === filterSede;
        return matchesSearch && matchesRole && matchesStatus && matchesSede;
    }), [users, searchTerm, filterRole, filterStatus, filterSede]);

    /* ─── Helpers visuales ─── */
    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return { bg: 'bg-purple-50 text-purple-700 ring-purple-200', dot: 'bg-purple-500', label: 'Administrador' };
            case 'profesor': return { bg: 'bg-sky-50 text-sky-700 ring-sky-200', dot: 'bg-sky-500', label: 'Profesor' };
            case 'estudiante': return { bg: 'bg-emerald-50 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500', label: 'Estudiante' };
            case 'padre': return { bg: 'bg-amber-50 text-amber-700 ring-amber-200', dot: 'bg-amber-500', label: 'Padre' };
            default: return { bg: 'bg-gray-50 text-gray-700 ring-gray-200', dot: 'bg-gray-500', label: role };
        }
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'activo': return { bg: 'bg-emerald-500', label: 'Activo' };
            case 'bloqueado': return { bg: 'bg-red-500', label: 'Bloqueado' };
            case 'pendiente': return { bg: 'bg-amber-500', label: 'Pendiente' };
            default: return { bg: 'bg-gray-500', label: status };
        }
    };

    const getInitialColor = (role: string) => {
        switch (role) {
            case 'admin': return 'from-purple-600 to-purple-800';
            case 'profesor': return 'from-sky-600 to-sky-800';
            case 'estudiante': return 'from-emerald-600 to-emerald-800';
            case 'padre': return 'from-amber-600 to-amber-800';
            default: return 'from-gray-600 to-gray-800';
        }
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'activar': return 'bg-emerald-100 text-emerald-700';
            case 'bloquear': return 'bg-red-100 text-red-700';
            case 'crear': return 'bg-sky-100 text-sky-700';
            case 'editar': return 'bg-amber-100 text-amber-700';
            case 'eliminar': return 'bg-gray-100 text-gray-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const tipoDocLabel: Record<string, string> = { CC: 'C.C.', TI: 'T.I.', CE: 'C.E.', RC: 'R.C.', PP: 'Pasaporte' };

    /* ─── Validación de campos numéricos ─── */
    const onlyNumbers = (value: string) => value.replace(/[^0-9]/g, '');

    /* ─── Acciones ─── */
    const handleToggleStatus = (user: User) => {
        if (user.status === 'activo') {
            setSelectedUser(user);
            setBlockReason('');
            setShowBlockModal(true);
        } else {
            router.patch(`/admin/usuarios/${user.id}/toggle-status`, {}, { preserveScroll: true });
        }
    };

    const handleBlockUser = () => {
        if (selectedUser) {
            router.patch(`/admin/usuarios/${selectedUser.id}/toggle-status`, { reason: blockReason }, {
                preserveScroll: true,
                onSuccess: () => { setShowBlockModal(false); setSelectedUser(null); setBlockReason(''); },
            });
        }
    };

    const handleActivatePending = (user: User) => {
        router.patch(`/admin/usuarios/${user.id}/toggle-status`, {}, { preserveScroll: true });
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({ ...EMPTY_FORM });
        setFormErrors({});
        setCursoBusq('');
        setAcudienteBusq('');
        setShowModal(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name, email: user.email, phone: user.phone || '', role: user.role,
            password: '', status: user.status, documento: user.documento || '',
            tipo_documento: user.tipo_documento || 'CC', direccion: user.direccion || '',
            fecha_nacimiento: user.fecha_nacimiento || '', genero: user.genero || '',
            nivel_educativo: user.nivel_educativo || '',
            curso_id: user.curso_id?.toString() || '',
            acudiente_id: user.acudiente_id?.toString() || '',
            sede_id: user.sede_id?.toString() || '',
        });
        setFormErrors({});
        const cursoNombre = user.curso_id ? (cursos.find(c => c.id === user.curso_id)?.nombre ?? '') : '';
        const padreNombre = user.acudiente_id ? (padres.find(p => p.id === user.acudiente_id)?.name ?? '') : '';
        setCursoBusq(cursoNombre);
        setAcudienteBusq(padreNombre);
        setShowModal(true);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        if (!formData.name.trim()) errors.name = 'El nombre es obligatorio';
        if (!formData.email.trim()) errors.email = 'El email es obligatorio';
        if (formData.documento && !/^[0-9]{5,15}$/.test(formData.documento)) {
            errors.documento = 'Solo números, 5 a 15 dígitos, sin puntos ni espacios';
        }
        if (formData.phone && !/^[0-9]{7,10}$/.test(formData.phone)) {
            errors.phone = 'Solo números, 7 a 10 dígitos';
        }
        if (!editingUser && (!formData.password || formData.password.length < 8)) {
            errors.password = 'La contraseña debe tener mínimo 8 caracteres';
        }
        if (editingUser && formData.password && formData.password.length < 8) {
            errors.password = 'La contraseña debe tener mínimo 8 caracteres';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        setProcessing(true);

        const payload = { ...formData };
        // No enviar password vacío en edición
        if (editingUser && !payload.password) {
            const { password, ...rest } = payload;
            if (editingUser) {
                router.put(`/admin/usuarios/${editingUser.id}`, rest, {
                    preserveScroll: true,
                    onSuccess: () => { setShowModal(false); setProcessing(false); },
                    onError: (errors) => { setFormErrors(errors as Record<string, string>); setProcessing(false); },
                });
            }
        } else if (editingUser) {
            router.put(`/admin/usuarios/${editingUser.id}`, payload, {
                preserveScroll: true,
                onSuccess: () => { setShowModal(false); setProcessing(false); },
                onError: (errors) => { setFormErrors(errors as Record<string, string>); setProcessing(false); },
            });
        } else {
            router.post('/admin/usuarios', payload, {
                preserveScroll: true,
                onSuccess: () => { setShowModal(false); setProcessing(false); },
                onError: (errors) => { setFormErrors(errors as Record<string, string>); setProcessing(false); },
            });
        }
    };

    const handleDelete = (user: User) => {
        if (confirm(`¿Eliminar a ${user.name}? Esta acción no se puede deshacer.`)) {
            router.delete(`/admin/usuarios/${user.id}`, { preserveScroll: true });
        }
    };

    const handleResetPassword = () => {
        if (!selectedUser || !resetPwValue || resetPwValue.length < 8) return;
        setProcessing(true);
        router.patch(`/admin/usuarios/${selectedUser.id}/reset-password`, { password: resetPwValue }, {
            preserveScroll: true,
            onSuccess: () => { setShowResetPwModal(false); setSelectedUser(null); setResetPwValue(''); setProcessing(false); },
            onError: () => setProcessing(false),
        });
    };

    const pendingCount = users.filter(u => u.status === 'pendiente').length;
    const activeCount = users.filter(u => u.status === 'activo').length;
    const blockedCount = users.filter(u => u.status === 'bloqueado').length;

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Gestión de Usuarios">
            <Head title="Usuarios" />

            <div className="space-y-5" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header - limpio, integrado con top bar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Gestión de Usuarios</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Administra cuentas, activación y permisos</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowHistoryModal(true)}
                            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Historial
                        </button>
                        <button
                            onClick={openCreateModal}
                            className="flex items-center gap-2 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-all text-sm font-semibold shadow-md"
                            style={{ background: 'linear-gradient(135deg, #181b49 0%, #293577 100%)' }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            Nuevo Usuario
                        </button>
                    </div>
                </div>

                {/* Stats compactos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#e8eaf6' }}>
                            <svg className="w-5 h-5" style={{ color: '#293577' }} fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-800">{users.length}</p>
                            <p className="text-xs text-gray-400">Total</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-emerald-600">{activeCount}</p>
                            <p className="text-xs text-gray-400">Activos</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-500">{blockedCount}</p>
                            <p className="text-xs text-gray-400">Bloqueados</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
                            <p className="text-xs text-gray-400">Pendientes</p>
                        </div>
                    </div>
                </div>

                {/* Alerta pendientes */}
                {pendingCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-amber-800 text-sm">{pendingCount} usuario{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''} de activación</p>
                            <p className="text-xs text-amber-600 mt-0.5">Revisa y activa las cuentas nuevas registradas</p>
                        </div>
                    </div>
                )}

                {/* Barra de filtros */}
                <div className="bg-white rounded-xl shadow-sm p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-800" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                            <input
                                type="text"
                                placeholder="Buscar por nombre o email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={filterRole}
                                onChange={(e) => setFilterRole(e.target.value)}
                                className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm bg-white min-w-[150px]"
                            >
                                <option value="todos">Todos los roles</option>
                                <option value="admin">Administradores</option>
                                <option value="profesor">Profesores</option>
                                <option value="estudiante">Estudiantes</option>
                                <option value="padre">Padres</option>
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm bg-white min-w-[165px]"
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="activo">Activos</option>
                                <option value="bloqueado">Bloqueados</option>
                                <option value="pendiente">Pendientes</option>
                            </select>
                            {sedes.length > 0 && (
                                <select
                                    value={filterSede}
                                    onChange={(e) => setFilterSede(e.target.value)}
                                    className="px-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm bg-white min-w-[150px]"
                                >
                                    <option value="todas">Todas las sedes</option>
                                    {sedes.map(s => <option key={s.id} value={String(s.id)}>{s.nombre}</option>)}
                                </select>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-400">{filteredUsers.length} resultado{filteredUsers.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                {/* Tabla Desktop */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden lg:block">
                    <div className="overflow-x-auto">
                        <table className="w-full table-fixed">
                            <colgroup>
                                <col className="w-[220px]" />
                                <col className="w-[110px]" />
                                <col className="w-[180px]" />
                                <col className="w-[160px]" />
                                <col className="w-[130px]" />
                                <col className="w-[160px]" />
                            </colgroup>
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/60">
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Usuario</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Último Acceso</th>
                                    <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Activación</th>
                                    <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.map((user) => {
                                    const statusCfg = getStatusConfig(user.status);
                                    const roleBadge = getRoleBadge(user.role);
                                    return (
                                        <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                                            {/* Usuario */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-9 h-9 flex-shrink-0 rounded-full bg-gradient-to-br ${getInitialColor(user.role)} flex items-center justify-center text-white font-semibold text-xs shadow-sm ${user.status === 'bloqueado' ? 'opacity-50 grayscale' : ''}`}>
                                                        {user.name.charAt(0)}{user.name.split(' ')[1]?.charAt(0) || ''}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                                                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                                        {user.documento && (
                                                            <p className="text-[11px] text-gray-400">{tipoDocLabel[user.tipo_documento] || user.tipo_documento} {user.documento}</p>
                                                        )}
                                                        {user.sede_nombre && (
                                                            <span className="mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">{user.sede_nombre}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Rol */}
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${roleBadge.bg}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${roleBadge.dot}`}></span>
                                                    <span className="truncate">{roleBadge.label}</span>
                                                </span>
                                            </td>
                                            {/* Estado */}
                                            <td className="px-4 py-3.5">
                                                <div className="space-y-1">
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                                                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusCfg.bg}`}></span>
                                                        {statusCfg.label}
                                                    </span>
                                                    {user.must_change_password && user.status === 'activo' && (
                                                        <p className="text-[11px] text-blue-500 whitespace-nowrap">Debe cambiar contraseña</p>
                                                    )}
                                                    {user.login_attempts > 3 && (
                                                        <p className="text-[11px] text-amber-600 whitespace-nowrap">{user.login_attempts} intentos fallidos</p>
                                                    )}
                                                </div>
                                            </td>
                                            {/* Último Acceso */}
                                            <td className="px-4 py-3.5">
                                                {user.last_login
                                                    ? <span className="text-xs text-gray-600 whitespace-nowrap">{user.last_login}</span>
                                                    : <span className="text-xs text-gray-300 italic">Sin acceso</span>
                                                }
                                            </td>
                                            {/* Control activación */}
                                            <td className="px-4 py-3.5 text-center">
                                                {user.status === 'pendiente' ? (
                                                    <button
                                                        onClick={() => handleActivatePending(user)}
                                                        className="inline-flex items-center gap-1 bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors shadow-sm whitespace-nowrap"
                                                    >
                                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                        Activar
                                                    </button>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <button
                                                            onClick={() => handleToggleStatus(user)}
                                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                                user.status === 'activo' ? 'bg-emerald-500 focus:ring-emerald-500' : 'bg-red-400 focus:ring-red-400'
                                                            }`}
                                                            title={user.status === 'activo' ? 'Clic para bloquear' : 'Clic para activar'}
                                                        >
                                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                                                user.status === 'activo' ? 'translate-x-5' : 'translate-x-0'
                                                            }`} />
                                                        </button>
                                                        <span className={`text-[10px] font-medium ${user.status === 'activo' ? 'text-emerald-600' : 'text-red-500'}`}>
                                                            {user.status === 'activo' ? 'Activo' : 'Bloqueado'}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            {/* Acciones */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#293577] bg-[#293577]/8 hover:bg-[#293577]/15 border border-[#293577]/20 transition-colors"
                                                        title="Editar usuario"
                                                    >
                                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedUser(user); setShowHistoryModal(true); }}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                                                        title="Ver historial de acciones"
                                                    >
                                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        Log
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedUser(user); setResetPwValue(''); setShowResetPwModal(true); }}
                                                        className="p-1.5 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                                                        title="Resetear contraseña"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user)}
                                                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors"
                                                        title="Eliminar usuario"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filteredUsers.length === 0 && (
                        <div className="py-12 text-center">
                            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            <p className="text-gray-400 text-sm">No se encontraron usuarios</p>
                            <p className="text-gray-300 text-xs mt-1">Intenta con otros filtros de búsqueda</p>
                        </div>
                    )}
                </div>

                {/* Cards Móvil */}
                <div className="lg:hidden space-y-3">
                    {filteredUsers.map((user) => {
                        const statusCfg = getStatusConfig(user.status);
                        const roleBadge = getRoleBadge(user.role);
                        return (
                            <div key={user.id} className={`bg-white rounded-xl shadow-sm overflow-hidden ${user.status === 'bloqueado' ? 'ring-1 ring-red-200' : ''}`}>
                                <div className="p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${getInitialColor(user.role)} flex items-center justify-center text-white font-semibold text-sm shadow-sm ${user.status === 'bloqueado' ? 'opacity-50 grayscale' : ''}`}>
                                            {user.name.charAt(0)}{user.name.split(' ')[1]?.charAt(0) || ''}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm truncate">{user.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                            {user.sede_nombre && <span className="mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">{user.sede_nombre}</span>}
                                        </div>
                                        {user.status !== 'pendiente' && (
                                            <button
                                                onClick={() => handleToggleStatus(user)}
                                                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                    user.status === 'activo' ? 'bg-emerald-500' : 'bg-red-400'
                                                }`}
                                            >
                                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                                    user.status === 'activo' ? 'translate-x-5' : 'translate-x-0'
                                                }`} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-2 mb-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${roleBadge.bg}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${roleBadge.dot}`}></span>
                                            {roleBadge.label}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600">
                                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.bg}`}></span>
                                            {statusCfg.label}
                                        </span>
                                        {user.documento && (
                                            <span className="text-xs text-gray-400">{tipoDocLabel[user.tipo_documento]} {user.documento}</span>
                                        )}
                                    </div>

                                    {user.must_change_password && user.status === 'activo' && (
                                        <div className="bg-blue-50 rounded-lg px-3 py-2 mb-3 text-xs text-blue-600 border border-blue-100">
                                            Pendiente: cambio de contraseña obligatorio
                                        </div>
                                    )}

                                    {user.status === 'pendiente' && (
                                        <button
                                            onClick={() => handleActivatePending(user)}
                                            className="w-full mb-3 bg-emerald-500 text-white px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            Activar esta cuenta
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                                    <div className="text-xs text-gray-400 truncate mr-2">
                                        {user.last_login ? `Último: ${user.last_login}` : 'Sin acceso'}
                                    </div>
                                    <div className="flex gap-1.5 flex-shrink-0">
                                        <button
                                            onClick={() => openEditModal(user)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#293577] bg-[#293577]/8 hover:bg-[#293577]/15 border border-[#293577]/20 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => { setSelectedUser(user); setShowHistoryModal(true); }}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                                        >
                                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Log
                                        </button>
                                        <button onClick={() => handleDelete(user)} className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors" title="Eliminar">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {filteredUsers.length === 0 && (
                        <div className="bg-white rounded-xl shadow-sm py-12 text-center">
                            <p className="text-gray-400 text-sm">No se encontraron usuarios</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal crear/editar */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl">
                        <div className="p-5 sm:p-6" style={{ background: 'linear-gradient(135deg, #181b49 0%, #293577 100%)' }}>
                            <h2 className="text-lg font-bold text-white">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h2>
                            <p className="text-white/60 text-sm mt-0.5">
                                {editingUser ? 'Modifica la información del usuario' : 'Registra un nuevo usuario en la plataforma'}
                            </p>
                        </div>
                        <div className="p-5 sm:p-6 overflow-y-auto max-h-[calc(90vh-160px)]">
                            <form onSubmit={handleSubmit} id="user-form" className="space-y-4">
                                {/* Nombre */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nombre completo <span className="text-red-400">*</span></label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all ${formErrors.name ? 'border-red-300' : 'border-gray-200'}`}
                                        placeholder="Ej: Juan Carlos Pérez López"
                                        required
                                    />
                                    {formErrors.name && <p className="text-xs text-red-500 mt-1">{formErrors.name}</p>}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email <span className="text-red-400">*</span></label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all ${formErrors.email ? 'border-red-300' : 'border-gray-200'}`}
                                        placeholder="email@colegio.com"
                                        required
                                    />
                                    {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                                </div>

                                {/* Tipo documento + Número documento */}
                                <div className="grid grid-cols-5 gap-3">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tipo Doc.</label>
                                        <select
                                            value={formData.tipo_documento}
                                            onChange={(e) => setFormData(f => ({ ...f, tipo_documento: e.target.value }))}
                                            className="w-full pl-3 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm bg-white transition-all appearance-none"
                                        >
                                            <option value="CC">CC - Cédula de Ciudadanía</option>
                                            <option value="TI">TI - Tarjeta de Identidad</option>
                                            <option value="CE">CE - Cédula de Extranjería</option>
                                            <option value="RC">RC - Registro Civil</option>
                                            <option value="PP">PP - Pasaporte</option>
                                        </select>
                                    </div>
                                    <div className="col-span-3">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">N° Documento</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formData.documento}
                                            onChange={(e) => setFormData(f => ({ ...f, documento: onlyNumbers(e.target.value) }))}
                                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all ${formErrors.documento ? 'border-red-300' : 'border-gray-200'}`}
                                            placeholder="Solo números, sin puntos"
                                            maxLength={15}
                                        />
                                        {formErrors.documento && <p className="text-xs text-red-500 mt-1">{formErrors.documento}</p>}
                                    </div>
                                </div>

                                {/* Teléfono + Género */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Teléfono</label>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            value={formData.phone}
                                            onChange={(e) => setFormData(f => ({ ...f, phone: onlyNumbers(e.target.value) }))}
                                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all ${formErrors.phone ? 'border-red-300' : 'border-gray-200'}`}
                                            placeholder="Ej: 3001234567"
                                            maxLength={10}
                                        />
                                        {formErrors.phone && <p className="text-xs text-red-500 mt-1">{formErrors.phone}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Género</label>
                                        <select
                                            value={formData.genero}
                                            onChange={(e) => setFormData(f => ({ ...f, genero: e.target.value }))}
                                            className="w-full pl-4 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm bg-white transition-all appearance-none"
                                        >
                                            <option value="">Sin especificar</option>
                                            <option value="M">Masculino</option>
                                            <option value="F">Femenino</option>
                                            <option value="otro">Otro</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Fecha nacimiento + Dirección */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fecha Nacimiento</label>
                                        <input
                                            type="date"
                                            value={formData.fecha_nacimiento}
                                            onChange={(e) => setFormData(f => ({ ...f, fecha_nacimiento: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all"
                                            max={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Dirección</label>
                                        <input
                                            type="text"
                                            value={formData.direccion}
                                            onChange={(e) => setFormData(f => ({ ...f, direccion: e.target.value }))}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all"
                                            placeholder="Calle, barrio, ciudad"
                                        />
                                    </div>
                                </div>

                                {/* Rol */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Rol <span className="text-red-400">*</span></label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData(f => ({ ...f, role: e.target.value, nivel_educativo: '', curso_id: '', acudiente_id: '' }))}
                                        className="w-full pl-4 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm bg-white transition-all appearance-none"
                                    >
                                        <option value="admin">Administrador</option>
                                        <option value="profesor">Profesor</option>
                                        <option value="estudiante">Estudiante</option>
                                        <option value="padre">Padre de familia</option>
                                    </select>
                                </div>

                                {/* Estado (solo en edición) */}
                                {editingUser && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Estado</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData(f => ({ ...f, status: e.target.value }))}
                                            className="w-full pl-4 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm bg-white transition-all appearance-none"
                                        >
                                            <option value="activo">Activo</option>
                                            <option value="bloqueado">Bloqueado</option>
                                        </select>
                                    </div>
                                )}

                                {/* ─── Datos académicos (solo Estudiante) ─── */}
                                {formData.role === 'estudiante' && (
                                    <div className="space-y-4 pt-2 border-t border-gray-100">
                                        <p className="text-xs font-bold text-[#293577] uppercase tracking-widest flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                            Datos Académicos
                                        </p>

                                        {/* Nivel educativo */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nivel Educativo</label>
                                            <select
                                                value={formData.nivel_educativo}
                                                onChange={(e) => setFormData(f => ({ ...f, nivel_educativo: e.target.value, curso_id: '' }))}
                                                className="w-full pl-4 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm bg-white transition-all appearance-none"
                                            >
                                                <option value="">— Sin asignar —</option>
                                                <option value="prejardin">Pre-Jardín</option>
                                                <option value="primaria">Primaria</option>
                                                <option value="bachillerato">Bachillerato</option>
                                            </select>
                                        </div>

                                        {/* Curso (filtrado por nivel) */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Grado y Sección</label>
                                            <input
                                                type="text"
                                                placeholder="Buscar curso..."
                                                value={cursoBusq}
                                                onChange={e => { setCursoBusq(e.target.value); setFormData(f => ({ ...f, curso_id: '' })); }}
                                                className="w-full pl-4 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm bg-white transition-all mb-1"
                                            />
                                            <select
                                                value={formData.curso_id}
                                                onChange={(e) => { setFormData(f => ({ ...f, curso_id: e.target.value })); const opt = e.target.options[e.target.selectedIndex]; setCursoBusq(opt.text === '— Sin asignar —' ? '' : opt.text); }}
                                                className="w-full pl-4 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm bg-white transition-all appearance-none"
                                                size={4}
                                            >
                                                <option value="">— Sin asignar —</option>
                                                {(formData.nivel_educativo
                                                    ? cursos.filter(c => {
                                                        const nv = (c.nivel === 'preescolar' || c.nivel === 'transicion') ? 'prejardin' : c.nivel;
                                                        return nv === formData.nivel_educativo;
                                                    })
                                                    : cursos
                                                ).filter(c => !cursoBusq || c.nombre.toLowerCase().includes(cursoBusq.toLowerCase()))
                                                .map(c => (
                                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                                ))}
                                            </select>
                                            {cursos.length === 0 && (
                                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                                                    No hay cursos registrados aún
                                                </p>
                                            )}
                                        </div>

                                        {/* Acudiente */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Acudiente</label>
                                            <input
                                                type="text"
                                                placeholder="Buscar acudiente por nombre o documento..."
                                                value={acudienteBusq}
                                                onChange={e => { setAcudienteBusq(e.target.value); setFormData(f => ({ ...f, acudiente_id: '' })); }}
                                                className="w-full pl-4 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm bg-white transition-all mb-1"
                                            />
                                            <select
                                                value={formData.acudiente_id}
                                                onChange={(e) => { setFormData(f => ({ ...f, acudiente_id: e.target.value })); const opt = e.target.options[e.target.selectedIndex]; setAcudienteBusq(opt.value ? opt.text : ''); }}
                                                className="w-full pl-4 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm bg-white transition-all appearance-none"
                                                size={4}
                                            >
                                                <option value="">— Sin asignar —</option>
                                                {padres
                                                    .filter(p => !acudienteBusq ||
                                                        p.name.toLowerCase().includes(acudienteBusq.toLowerCase()) ||
                                                        (p.documento ?? '').includes(acudienteBusq)
                                                    )
                                                    .map(p => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name}{p.documento ? ` — ${p.documento}` : ''}
                                                        </option>
                                                    ))}
                                            </select>
                                            {padres.length === 0 && (
                                                <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                                                    No hay padres/acudientes registrados aún
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Sede — visible para cualquier rol si hay sedes */}
                                {sedes.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Sede</label>
                                        <select
                                            value={formData.sede_id}
                                            onChange={(e) => setFormData(f => ({ ...f, sede_id: e.target.value }))}
                                            className="w-full pl-4 pr-8 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm bg-white transition-all appearance-none"
                                        >
                                            <option value="">— Sin asignar —</option>
                                            {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}{s.ciudad ? ` — ${s.ciudad}` : ''}</option>)}
                                        </select>
                                    </div>
                                )}

                                {/* Contraseña */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                        {editingUser ? 'Nueva contraseña (opcional)' : 'Contraseña temporal'} {!editingUser && <span className="text-red-400">*</span>}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))}
                                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all ${formErrors.password ? 'border-red-300' : 'border-gray-200'}`}
                                        placeholder={editingUser ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'}
                                        required={!editingUser}
                                        minLength={8}
                                    />
                                    {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-2 flex items-start gap-2">
                                        <svg className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <p className="text-[11px] text-blue-600">
                                            {editingUser
                                                ? 'Si asignas nueva contraseña, el usuario deberá cambiarla en su próximo inicio de sesión.'
                                                : 'El usuario deberá cambiar esta contraseña en su primer inicio de sesión.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Info del usuario (solo en edición) */}
                                {editingUser && (
                                    <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                                        <p className="text-xs text-gray-500"><span className="font-medium text-gray-600">Registrado:</span> {editingUser.created_at}</p>
                                        <p className="text-xs text-gray-500"><span className="font-medium text-gray-600">Último acceso:</span> {editingUser.last_login || 'Nunca'}</p>
                                        {editingUser.must_change_password && (
                                            <p className="text-xs text-blue-600"><span className="font-medium">Pendiente:</span> Cambio de contraseña obligatorio</p>
                                        )}
                                        {editingUser.login_attempts > 0 && (
                                            <p className="text-xs text-amber-600"><span className="font-medium">Intentos fallidos:</span> {editingUser.login_attempts}</p>
                                        )}
                                    </div>
                                )}
                            </form>
                        </div>
                        <div className="flex gap-3 p-5 sm:p-6 pt-0">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                form="user-form"
                                disabled={processing}
                                className="flex-1 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #181b49 0%, #293577 100%)' }}
                            >
                                {processing ? 'Guardando...' : editingUser ? 'Guardar cambios' : 'Crear usuario'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal bloquear */}
            {showBlockModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="bg-red-500 p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Bloquear Usuario</h2>
                                    <p className="text-sm text-red-100">{selectedUser.name}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-5 sm:p-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                                <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                                <p className="text-xs text-amber-700">El usuario perderá acceso a la plataforma mientras esté bloqueado.</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Razón del bloqueo <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={blockReason}
                                    onChange={(e) => setBlockReason(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-300 focus:border-red-400 text-sm transition-all resize-none"
                                    placeholder="Ej: Solicitud del usuario, comportamiento inadecuado..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowBlockModal(false); setSelectedUser(null); setBlockReason(''); }}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleBlockUser}
                                    disabled={!blockReason.trim()}
                                    className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg hover:bg-red-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
                                >
                                    Confirmar Bloqueo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal historial */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-5 sm:p-6 flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #181b49 0%, #293577 100%)' }}>
                            <div>
                                <h2 className="text-lg font-bold text-white">Historial de Acciones</h2>
                                {selectedUser && <p className="text-sm text-white/60 mt-0.5">{selectedUser.name}</p>}
                            </div>
                            <button
                                onClick={() => { setShowHistoryModal(false); setSelectedUser(null); }}
                                className="text-white/60 hover:text-white p-1 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 p-5 sm:p-6">
                            <div className="space-y-3">
                                {actionLogs
                                    .filter(log => !selectedUser || log.user_id === selectedUser.id)
                                    .map((log) => (
                                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100/80 transition-colors">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                                                log.action === 'activar' ? 'bg-emerald-500' :
                                                log.action === 'bloquear' ? 'bg-red-500' :
                                                log.action === 'crear' ? 'bg-sky-500' :
                                                'bg-gray-400'
                                            }`}>
                                                {log.action === 'activar' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                {log.action === 'bloquear' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                                                {log.action === 'crear' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}
                                                {!['activar', 'bloquear', 'crear'].includes(log.action) && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${getActionBadge(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                    <span className="font-medium text-sm text-gray-800">{log.user_name}</span>
                                                </div>
                                                {log.reason && <p className="text-xs text-gray-500 mt-1">Razón: {log.reason}</p>}
                                                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-gray-400">
                                                    <span>Por: {log.performed_by}</span>
                                                    <span>{log.timestamp}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                {actionLogs.filter(log => !selectedUser || log.user_id === selectedUser.id).length === 0 && (
                                    <div className="py-8 text-center text-gray-400 text-sm">No hay registros</div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-gray-100">
                            <button
                                onClick={() => { setShowHistoryModal(false); setSelectedUser(null); }}
                                className="w-full px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal resetear contraseña */}
            {showResetPwModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        <div className="p-5" style={{ background: 'linear-gradient(135deg, #181b49 0%, #293577 100%)' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Resetear Contraseña</h2>
                                    <p className="text-sm text-white/60">{selectedUser.name}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-5 sm:p-6">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                                <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                                <p className="text-xs text-amber-700">El usuario deberá cambiar esta contraseña en su próximo inicio de sesión.</p>
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nueva contraseña temporal <span className="text-red-400">*</span></label>
                                <input
                                    type="password"
                                    value={resetPwValue}
                                    onChange={(e) => setResetPwValue(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all"
                                    placeholder="Mínimo 8 caracteres"
                                    minLength={8}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowResetPwModal(false); setSelectedUser(null); setResetPwValue(''); }}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600 font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleResetPassword}
                                    disabled={!resetPwValue || resetPwValue.length < 8 || processing}
                                    className="flex-1 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
                                    style={{ background: 'linear-gradient(135deg, #181b49 0%, #293577 100%)' }}
                                >
                                    {processing ? 'Reseteando...' : 'Resetear Contraseña'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
