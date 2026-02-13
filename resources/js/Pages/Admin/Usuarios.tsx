import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: 'activo' | 'bloqueado' | 'pendiente';
    created_at: string;
    last_login: string | null;
    login_attempts: number;
    blocked_reason?: string;
    phone?: string;
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

export default function Usuarios() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('todos');
    const [filterStatus, setFilterStatus] = useState('todos');
    const [showModal, setShowModal] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [blockReason, setBlockReason] = useState('');

    // Datos de ejemplo ampliados
    const [users, setUsers] = useState<User[]>([
        { id: 1, name: 'Juan Pérez', email: 'juan@colegio.com', role: 'profesor', status: 'activo', created_at: '2026-01-15', last_login: '2026-01-20 08:30', login_attempts: 0, phone: '555-1234' },
        { id: 2, name: 'María García', email: 'maria@colegio.com', role: 'profesor', status: 'activo', created_at: '2026-01-10', last_login: '2026-01-19 14:15', login_attempts: 0, phone: '555-5678' },
        { id: 3, name: 'Carlos López', email: 'carlos@colegio.com', role: 'estudiante', status: 'activo', created_at: '2026-01-05', last_login: '2026-01-20 07:45', login_attempts: 0 },
        { id: 4, name: 'Ana Martínez', email: 'ana@colegio.com', role: 'estudiante', status: 'bloqueado', created_at: '2025-12-20', last_login: '2026-01-10 09:00', login_attempts: 5, blocked_reason: 'Múltiples intentos fallidos de inicio de sesión' },
        { id: 5, name: 'Pedro Sánchez', email: 'pedro@colegio.com', role: 'padre', status: 'activo', created_at: '2026-01-01', last_login: '2026-01-18 20:30', login_attempts: 0, phone: '555-9012' },
        { id: 6, name: 'Laura Rodríguez', email: 'laura@colegio.com', role: 'estudiante', status: 'pendiente', created_at: '2026-01-19', last_login: null, login_attempts: 0 },
        { id: 7, name: 'Diego Hernández', email: 'diego@colegio.com', role: 'profesor', status: 'bloqueado', created_at: '2025-11-15', last_login: '2025-12-01 10:00', login_attempts: 0, blocked_reason: 'Solicitud del usuario - Licencia temporal' },
        { id: 8, name: 'Sofía Castro', email: 'sofia@colegio.com', role: 'estudiante', status: 'pendiente', created_at: '2026-01-20', last_login: null, login_attempts: 0 },
    ]);

    const [actionLogs] = useState<ActionLog[]>([
        { id: 1, user_id: 4, user_name: 'Ana Martínez', action: 'bloquear', reason: 'Múltiples intentos fallidos', performed_by: 'Admin Sistema', timestamp: '2026-01-15 10:30' },
        { id: 2, user_id: 7, user_name: 'Diego Hernández', action: 'bloquear', reason: 'Licencia temporal', performed_by: 'Admin Principal', timestamp: '2025-12-01 09:00' },
        { id: 3, user_id: 3, user_name: 'Carlos López', action: 'activar', performed_by: 'Admin Sistema', timestamp: '2026-01-05 08:00' },
        { id: 4, user_id: 6, user_name: 'Laura Rodríguez', action: 'crear', performed_by: 'Admin Principal', timestamp: '2026-01-19 11:30' },
    ]);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'todos' || user.role === filterRole;
        const matchesStatus = filterStatus === 'todos' || user.status === filterStatus;
        return matchesSearch && matchesRole && matchesStatus;
    });

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800';
            case 'profesor': return 'bg-blue-100 text-blue-800';
            case 'estudiante': return 'bg-green-100 text-green-800';
            case 'padre': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'activo': return { bg: 'bg-green-100 text-green-800', icon: '✓', label: 'Activo' };
            case 'bloqueado': return { bg: 'bg-red-100 text-red-800', icon: '🔒', label: 'Bloqueado' };
            case 'pendiente': return { bg: 'bg-yellow-100 text-yellow-800', icon: '⏳', label: 'Pendiente' };
            default: return { bg: 'bg-gray-100 text-gray-800', icon: '', label: status };
        }
    };

    const handleToggleStatus = (user: User) => {
        if (user.status === 'activo') {
            setSelectedUser(user);
            setBlockReason('');
            setShowBlockModal(true);
        } else {
            // Activar directamente
            setUsers(prev => prev.map(u => 
                u.id === user.id ? { ...u, status: 'activo' as const, blocked_reason: undefined, login_attempts: 0 } : u
            ));
        }
    };

    const handleBlockUser = () => {
        if (selectedUser && blockReason.trim()) {
            setUsers(prev => prev.map(u => 
                u.id === selectedUser.id ? { ...u, status: 'bloqueado' as const, blocked_reason: blockReason } : u
            ));
            setShowBlockModal(false);
            setSelectedUser(null);
            setBlockReason('');
        }
    };

    const handleActivatePending = (user: User) => {
        setUsers(prev => prev.map(u => 
            u.id === user.id ? { ...u, status: 'activo' as const } : u
        ));
    };

    const getActionBadge = (action: string) => {
        switch (action) {
            case 'activar': return 'bg-green-100 text-green-800';
            case 'bloquear': return 'bg-red-100 text-red-800';
            case 'crear': return 'bg-blue-100 text-blue-800';
            case 'editar': return 'bg-yellow-100 text-yellow-800';
            case 'eliminar': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Gestión de Usuarios">
            <Head title="Usuarios" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
                        <p className="text-gray-600">Administra usuarios, activación y bloqueo de cuentas</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowHistoryModal(true)}
                            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            📋 Historial
                        </button>
                        <button
                            onClick={() => { setEditingUser(null); setShowModal(true); }}
                            className="flex items-center gap-2 bg-[#293577] text-white px-4 py-2 rounded-lg hover:bg-[#181b49] transition-colors"
                        >
                            <span className="text-xl">+</span>
                            Nuevo Usuario
                        </button>
                    </div>
                </div>

                {/* Alertas de usuarios pendientes */}
                {users.filter(u => u.status === 'pendiente').length > 0 && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
                        <div className="flex items-center gap-2">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <p className="font-medium text-yellow-800">
                                    {users.filter(u => u.status === 'pendiente').length} usuarios pendientes de activación
                                </p>
                                <p className="text-sm text-yellow-700">Revisa y activa las cuentas nuevas</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filtros mejorados */}
                <div className="bg-white rounded-xl shadow-sm p-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Buscar por nombre o email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent"
                            />
                        </div>
                        <select
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent"
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
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="activo">✓ Activos</option>
                            <option value="bloqueado">🔒 Bloqueados</option>
                            <option value="pendiente">⏳ Pendientes</option>
                        </select>
                    </div>
                </div>

                {/* Tabla de usuarios - Desktop */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden lg:block">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acceso</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Activar/Bloquear</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.map((user) => {
                                    const statusBadge = getStatusBadge(user.status);
                                    return (
                                        <tr key={user.id} className={`hover:bg-gray-50 ${user.status === 'bloqueado' ? 'bg-red-50' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${user.status === 'bloqueado' ? 'bg-gray-400' : 'bg-[#181b49]'}`}>
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div className="ml-3">
                                                        <p className="font-medium text-gray-900">{user.name}</p>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 w-fit ${statusBadge.bg}`}>
                                                        {statusBadge.icon} {statusBadge.label}
                                                    </span>
                                                    {user.blocked_reason && (
                                                        <span className="text-xs text-red-600" title={user.blocked_reason}>
                                                            Razón: {user.blocked_reason.substring(0, 30)}...
                                                        </span>
                                                    )}
                                                    {user.login_attempts > 3 && (
                                                        <span className="text-xs text-orange-600">
                                                            ⚠️ {user.login_attempts} intentos fallidos
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                                                {user.last_login || <span className="text-gray-400 italic">Nunca</span>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                {user.status === 'pendiente' ? (
                                                    <button
                                                        onClick={() => handleActivatePending(user)}
                                                        className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors"
                                                    >
                                                        ✓ Activar cuenta
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleToggleStatus(user)}
                                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                            user.status === 'activo' ? 'bg-green-500' : 'bg-red-500'
                                                        }`}
                                                        title={user.status === 'activo' ? 'Clic para bloquear' : 'Clic para activar'}
                                                    >
                                                        <span
                                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                user.status === 'activo' ? 'translate-x-5' : 'translate-x-0'
                                                            }`}
                                                        />
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => { setEditingUser(user); setShowModal(true); }}
                                                        className="text-[#293577] hover:text-[#181b49]"
                                                        title="Editar"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedUser(user); setShowHistoryModal(true); }}
                                                        className="text-gray-500 hover:text-gray-700"
                                                        title="Ver historial"
                                                    >
                                                        📋
                                                    </button>
                                                    <button className="text-red-500 hover:text-red-700" title="Eliminar">
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Vista de cards para móvil/tablet */}
                <div className="lg:hidden space-y-3">
                    {filteredUsers.map((user) => {
                        const statusBadge = getStatusBadge(user.status);
                        return (
                            <div key={user.id} className={`bg-white rounded-xl shadow-sm p-4 ${user.status === 'bloqueado' ? 'border-l-4 border-red-500' : ''}`}>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg ${user.status === 'bloqueado' ? 'bg-gray-400' : 'bg-[#181b49]'}`}>
                                        {user.name.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                    </div>
                                    {/* Toggle móvil */}
                                    {user.status !== 'pendiente' && (
                                        <button
                                            onClick={() => handleToggleStatus(user)}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                user.status === 'activo' ? 'bg-green-500' : 'bg-red-500'
                                            }`}
                                        >
                                            <span
                                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                    user.status === 'activo' ? 'translate-x-5' : 'translate-x-0'
                                                }`}
                                            />
                                        </button>
                                    )}
                                </div>
                                
                                <div className="flex flex-wrap gap-2 mb-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user.role)}`}>
                                        {user.role}
                                    </span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${statusBadge.bg}`}>
                                        {statusBadge.icon} {statusBadge.label}
                                    </span>
                                </div>

                                {user.blocked_reason && (
                                    <div className="bg-red-50 rounded-lg p-2 mb-3 text-xs text-red-600">
                                        <strong>Razón de bloqueo:</strong> {user.blocked_reason}
                                    </div>
                                )}

                                {user.status === 'pendiente' && (
                                    <button
                                        onClick={() => handleActivatePending(user)}
                                        className="w-full mb-3 bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 transition-colors"
                                    >
                                        ✓ Activar esta cuenta
                                    </button>
                                )}

                                <div className="flex justify-between items-center pt-3 border-t text-sm">
                                    <div className="text-gray-500">
                                        <p>Último acceso: {user.last_login || 'Nunca'}</p>
                                        <p className="text-xs">Registro: {user.created_at}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => { setEditingUser(user); setShowModal(true); }}
                                            className="text-[#293577]"
                                        >
                                            ✏️
                                        </button>
                                        <button className="text-red-500">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Stats mejoradas */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <p className="text-2xl font-bold text-[#181b49]">{users.length}</p>
                        <p className="text-gray-600 text-sm">Total Usuarios</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-green-500">
                        <p className="text-2xl font-bold text-green-600">{users.filter(u => u.status === 'activo').length}</p>
                        <p className="text-gray-600 text-sm">Activos</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-red-500">
                        <p className="text-2xl font-bold text-red-600">{users.filter(u => u.status === 'bloqueado').length}</p>
                        <p className="text-gray-600 text-sm">Bloqueados</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-yellow-500">
                        <p className="text-2xl font-bold text-yellow-600">{users.filter(u => u.status === 'pendiente').length}</p>
                        <p className="text-gray-600 text-sm">Pendientes</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center col-span-2 lg:col-span-1">
                        <p className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'profesor').length}</p>
                        <p className="text-gray-600 text-sm">Profesores</p>
                    </div>
                </div>
            </div>

            {/* Modal de creación/edición mejorado */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </h2>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                                <input
                                    type="text"
                                    defaultValue={editingUser?.name || ''}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577]"
                                    placeholder="Nombre del usuario"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    defaultValue={editingUser?.email || ''}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577]"
                                    placeholder="email@colegio.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono (opcional)</label>
                                <input
                                    type="tel"
                                    defaultValue={editingUser?.phone || ''}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577]"
                                    placeholder="555-1234"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <select
                                    defaultValue={editingUser?.role || 'estudiante'}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577]"
                                >
                                    <option value="admin">Administrador</option>
                                    <option value="profesor">Profesor</option>
                                    <option value="estudiante">Estudiante</option>
                                    <option value="padre">Padre de familia</option>
                                </select>
                            </div>
                            {editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado de la cuenta</label>
                                    <select
                                        defaultValue={editingUser?.status || 'activo'}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577]"
                                    >
                                        <option value="activo">✓ Activo</option>
                                        <option value="bloqueado">🔒 Bloqueado</option>
                                        <option value="pendiente">⏳ Pendiente</option>
                                    </select>
                                </div>
                            )}
                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577]"
                                        placeholder="Contraseña temporal"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">El usuario deberá cambiarla en su primer inicio de sesión</p>
                                </div>
                            )}
                            {editingUser && (
                                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                                    <p className="text-gray-600"><strong>Registrado:</strong> {editingUser.created_at}</p>
                                    <p className="text-gray-600"><strong>Último acceso:</strong> {editingUser.last_login || 'Nunca'}</p>
                                    {editingUser.login_attempts > 0 && (
                                        <p className="text-orange-600"><strong>Intentos fallidos:</strong> {editingUser.login_attempts}</p>
                                    )}
                                </div>
                            )}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-[#293577] text-white px-4 py-2 rounded-lg hover:bg-[#181b49]"
                                >
                                    {editingUser ? 'Guardar cambios' : 'Crear usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de bloqueo con razón */}
            {showBlockModal && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl">🔒</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">Bloquear Usuario</h2>
                                <p className="text-sm text-gray-500">{selectedUser.name}</p>
                            </div>
                        </div>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-yellow-800">
                                ⚠️ El usuario no podrá acceder a la plataforma mientras esté bloqueado.
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Razón del bloqueo <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                placeholder="Ej: Solicitud del usuario, Comportamiento inadecuado, etc."
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setShowBlockModal(false); setSelectedUser(null); setBlockReason(''); }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleBlockUser}
                                disabled={!blockReason.trim()}
                                className="flex-1 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                🔒 Confirmar Bloqueo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de historial de acciones */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">
                                📋 Historial de Acciones
                                {selectedUser && <span className="text-sm font-normal text-gray-500 ml-2">- {selectedUser.name}</span>}
                            </h2>
                            <button
                                onClick={() => { setShowHistoryModal(false); setSelectedUser(null); }}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1">
                            <div className="space-y-3">
                                {actionLogs
                                    .filter(log => !selectedUser || log.user_id === selectedUser.id)
                                    .map((log) => (
                                        <div key={log.id} className="bg-gray-50 rounded-lg p-4 flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                                                log.action === 'activar' ? 'bg-green-500' :
                                                log.action === 'bloquear' ? 'bg-red-500' :
                                                log.action === 'crear' ? 'bg-blue-500' :
                                                'bg-gray-500'
                                            }`}>
                                                {log.action === 'activar' ? '✓' :
                                                 log.action === 'bloquear' ? '🔒' :
                                                 log.action === 'crear' ? '+' : '✏️'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getActionBadge(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                    <span className="font-medium text-gray-800">{log.user_name}</span>
                                                </div>
                                                {log.reason && (
                                                    <p className="text-sm text-gray-600 mt-1">Razón: {log.reason}</p>
                                                )}
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                    <span>Por: {log.performed_by}</span>
                                                    <span>{log.timestamp}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t">
                            <button
                                onClick={() => { setShowHistoryModal(false); setSelectedUser(null); }}
                                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
