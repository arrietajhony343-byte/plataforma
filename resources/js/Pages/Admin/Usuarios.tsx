import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    status: 'activo' | 'inactivo';
    created_at: string;
}

const menuItems = [
    { icon: '📊', label: 'Dashboard', href: '/admin/dashboard' },
    { icon: '👥', label: 'Usuarios (Altas/Bajas)', href: '/admin/usuarios', active: true },
    { icon: '📚', label: 'Cursos & Materias', href: '/admin/cursos' },
    { icon: '⚙️', label: 'Configuración de Periodos', href: '/admin/periodos' },
    { icon: '📈', label: 'Reportes Globales', href: '/admin/reportes' },
];

export default function Usuarios() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('todos');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Datos de ejemplo
    const [users] = useState<User[]>([
        { id: 1, name: 'Juan Pérez', email: 'juan@colegio.com', role: 'profesor', status: 'activo', created_at: '2026-01-15' },
        { id: 2, name: 'María García', email: 'maria@colegio.com', role: 'profesor', status: 'activo', created_at: '2026-01-10' },
        { id: 3, name: 'Carlos López', email: 'carlos@colegio.com', role: 'estudiante', status: 'activo', created_at: '2026-01-05' },
        { id: 4, name: 'Ana Martínez', email: 'ana@colegio.com', role: 'estudiante', status: 'inactivo', created_at: '2025-12-20' },
        { id: 5, name: 'Pedro Sánchez', email: 'pedro@colegio.com', role: 'padre', status: 'activo', created_at: '2026-01-01' },
    ]);

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = filterRole === 'todos' || user.role === filterRole;
        return matchesSearch && matchesRole;
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

    return (
        <SidebarLayout menuItems={menuItems} title="Gestión de Usuarios">
            <Head title="Usuarios" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
                        <p className="text-gray-600">Administra las altas, bajas y modificaciones de usuarios</p>
                    </div>
                    <button
                        onClick={() => { setEditingUser(null); setShowModal(true); }}
                        className="flex items-center gap-2 bg-[#2196F3] text-white px-4 py-2 rounded-lg hover:bg-[#1976D2] transition-colors"
                    >
                        <span className="text-xl">+</span>
                        Nuevo Usuario
                    </button>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2196F3] focus:border-transparent"
                        />
                    </div>
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2196F3] focus:border-transparent"
                    >
                        <option value="todos">Todos los roles</option>
                        <option value="admin">Administradores</option>
                        <option value="profesor">Profesores</option>
                        <option value="estudiante">Estudiantes</option>
                        <option value="padre">Padres</option>
                    </select>
                </div>

                {/* Tabla de usuarios - Desktop */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden hidden sm:block">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Registro</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-[#1e3a5f] rounded-full flex items-center justify-center text-white font-semibold">
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div className="ml-3">
                                                    <p className="font-medium text-gray-900">{user.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user.role)}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-600">{user.created_at}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => { setEditingUser(user); setShowModal(true); }}
                                                className="text-[#2196F3] hover:text-[#1976D2] mr-3"
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button className="text-red-500 hover:text-red-700">
                                                🗑️ Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Vista de cards para móvil */}
                <div className="sm:hidden space-y-3">
                    {filteredUsers.map((user) => (
                        <div key={user.id} className="bg-white rounded-xl shadow-sm p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-[#1e3a5f] rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                    {user.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">{user.name}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(user.role)}`}>
                                    {user.role}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${user.status === 'activo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {user.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t">
                                <span className="text-xs text-gray-500">Registro: {user.created_at}</span>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => { setEditingUser(user); setShowModal(true); }}
                                        className="text-[#2196F3] text-sm"
                                    >
                                        ✏️ Editar
                                    </button>
                                    <button className="text-red-500 text-sm">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <p className="text-2xl font-bold text-[#1e3a5f]">{users.filter(u => u.role === 'profesor').length}</p>
                        <p className="text-gray-600 text-sm">Profesores</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <p className="text-2xl font-bold text-[#1e3a5f]">{users.filter(u => u.role === 'estudiante').length}</p>
                        <p className="text-gray-600 text-sm">Estudiantes</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <p className="text-2xl font-bold text-[#1e3a5f]">{users.filter(u => u.role === 'padre').length}</p>
                        <p className="text-gray-600 text-sm">Padres</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{users.filter(u => u.status === 'activo').length}</p>
                        <p className="text-gray-600 text-sm">Activos</p>
                    </div>
                </div>
            </div>

            {/* Modal de creación/edición */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </h2>
                        <form className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                                <input
                                    type="text"
                                    defaultValue={editingUser?.name || ''}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2196F3]"
                                    placeholder="Nombre del usuario"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    defaultValue={editingUser?.email || ''}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2196F3]"
                                    placeholder="email@colegio.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <select
                                    defaultValue={editingUser?.role || 'estudiante'}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2196F3]"
                                >
                                    <option value="admin">Administrador</option>
                                    <option value="profesor">Profesor</option>
                                    <option value="estudiante">Estudiante</option>
                                    <option value="padre">Padre de familia</option>
                                </select>
                            </div>
                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2196F3]"
                                        placeholder="Contraseña temporal"
                                    />
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
                                    className="flex-1 bg-[#2196F3] text-white px-4 py-2 rounded-lg hover:bg-[#1976D2]"
                                >
                                    {editingUser ? 'Guardar cambios' : 'Crear usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
