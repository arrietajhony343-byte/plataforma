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
    const page = usePage();
    const { url } = page;
    const user = page.props.auth.user;

    // Detecta la página activa comparando la URL actual con el href del item
    const isActivePage = (href: string) =>
        url === href || (href.length > 1 && url.startsWith(href));

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
                    {menuItems.map((item, index) => {
                        const active = item.active !== undefined ? item.active : isActivePage(item.href);
                        return (
                            <Link
                                key={index}
                                href={item.href}
                                className={`
                                    relative flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 border-l-4
                                    ${active
                                        ? 'bg-[#e5e7eb] text-[#181b49] font-bold shadow-md border-amber-400'
                                        : 'text-white/75 hover:bg-white/10 hover:text-white border-transparent'
                                    }
                                `}
                                style={active ? { fontFamily: "'Roboto Condensed', sans-serif" } : { fontFamily: "'Roboto Condensed', sans-serif" }}
                            >
                                <span className="w-5 h-5 flex-shrink-0 text-base leading-none">{item.icon}</span>
                                <span className="text-sm font-semibold tracking-wide">{item.label || item.name}</span>
                            </Link>
                        );
                    })}
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
                {/* Top bar con gradiente - STICKY */}
                <header 
                    className="shadow-md sticky top-0 z-30"
                    style={{ background: 'linear-gradient(90deg, #181b49 0%, #293577 50%, #181b49 100%)' }}
                >
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 rounded-md text-white/70 hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Title - EMPRENDEDORES DEL SABER */}
                        <h1 className="text-white font-bold text-base sm:text-xl md:text-2xl tracking-wide italic flex-1 text-center" style={{ fontFamily: "'Bitter', serif", textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
                            EMPRENDEDORES DEL SABER
                        </h1>

                        {/* Right side */}
                        <div className="flex items-center gap-2">
                            {/* Notifications */}
                            <button className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                                </svg>
                                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border border-white/20">
                                    3
                                </span>
                            </button>

                            {/* User dropdown */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-lg transition-colors"
                                >
                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                    </div>
                                </button>
                                
                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-1 z-50 border border-gray-200">
                                        <div className="px-4 py-2 border-b border-gray-100">
                                            <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                                            <p className="text-xs text-gray-400">{user.email}</p>
                                        </div>
                                        <Link 
                                            href="/profile" 
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            Mi Perfil
                                        </Link>
                                        <button 
                                            onClick={handleLogout}
                                            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
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
