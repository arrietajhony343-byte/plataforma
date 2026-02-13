import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';
import axios from 'axios';

interface MenuItem {
    name?: string;
    label?: string;
    href: string;
    icon: ReactNode;
    active?: boolean;
}

interface SidebarLayoutProps {
    menuItems: MenuItem[];
    header?: ReactNode;
    title?: string;
    userInfo?: {
        name: string;
        avatar?: string;
        role?: string;
    };
}

export default function SidebarLayout({
    children,
    menuItems,
    header,
    userInfo,
}: PropsWithChildren<SidebarLayoutProps>) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const user = usePage().props.auth.user;

    const handleLogout = async () => {
        try {
            await axios.post('/logout', {}, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                },
                withCredentials: true,
            });
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/';
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex overflow-x-hidden">
            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 text-white transform transition-transform duration-300 ease-in-out
                lg:translate-x-0 lg:static lg:inset-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}
                style={{
                    background: 'linear-gradient(90deg, #181b49 0%, #293577 50%, #181b49 100%)',
                }}
            >
                {/* Logo */}
                <div className="flex flex-col items-center px-6 py-6 border-b border-white/10">
                    <img 
                        src="/storage/logo.png" 
                        alt="I.P. Emprendedores del Saber" 
                        className="w-32 h-32 object-contain drop-shadow-lg"
                    />
                </div>

                {/* User Info (si existe) */}
                {userInfo && (
                    <div className="px-6 py-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            {userInfo.avatar ? (
                                <img src={userInfo.avatar} alt={userInfo.name} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white font-bold">
                                    {userInfo.name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <p className="font-medium text-sm text-white/70">{userInfo.role || 'Usuario'}</p>
                                <p className="text-white font-semibold">{userInfo.name}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="mt-4 px-3 flex-1 overflow-y-auto">
                    {menuItems.map((item, index) => (
                        <Link
                            key={index}
                            href={item.href}
                            className={`
                                flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors
                                ${item.active 
                                    ? 'bg-white/20 text-white shadow-lg' 
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'}
                            `}
                        >
                            <span className="w-5 h-5">{item.icon}</span>
                            <span className="font-medium">{item.label || item.name}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Overlay para móvil */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
                {/* Top bar */}
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        <div className="flex-1" />

                        {/* Right side */}
                        <div className="flex items-center gap-4">
                            {/* Notifications */}
                            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    3
                                </span>
                            </button>

                            {/* User dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                    </div>
                                    <svg className={`w-4 h-4 text-gray-600 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                
                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                        <Link 
                                            href="/profile" 
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Mi Perfil
                                        </Link>
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                        >
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6 overflow-x-hidden">
                    {header && (
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">{header}</h1>
                    )}
                    {children}
                </main>
            </div>
        </div>
    );
}
