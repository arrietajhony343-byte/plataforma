import { Link, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState, useEffect, useRef, useCallback } from 'react';
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

interface Notif {
    id: number;
    tipo: string;
    titulo: string;
    mensaje: string;
    leida: boolean;
    created_at: string;
}

export default function SidebarLayout({
    children,
    menuItems,
    header,
    userInfo,
}: PropsWithChildren<SidebarLayoutProps>) {
    const [sidebarOpen, setSidebarOpen]       = useState(false);
    const [showUserMenu, setShowUserMenu]     = useState(false);
    const [showNotifs, setShowNotifs]         = useState(false);
    const [notifs, setNotifs]                 = useState<Notif[]>([]);
    const [noLeidas, setNoLeidas]             = useState(0);
    const [loadingNotifs, setLoadingNotifs]   = useState(false);

    const userMenuRef  = useRef<HTMLDivElement>(null);
    const notifsRef    = useRef<HTMLDivElement>(null);

    const page = usePage();
    const { url } = page;
    const user = page.props.auth.user;

    // ── Cerrar ambos dropdowns al hacer clic fuera ──
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
                setShowUserMenu(false);
            }
            if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Fetch de notificaciones ──
    const fetchNotifs = useCallback(async () => {
        setLoadingNotifs(true);
        try {
            const res = await axios.get('/api/notificaciones');
            setNotifs(res.data.notificaciones);
            setNoLeidas(res.data.noLeidas);
        } catch (_) { /* silencioso */ }
        setLoadingNotifs(false);
    }, []);

    // Cargar al montar
    useEffect(() => { fetchNotifs(); }, [fetchNotifs]);

    const toggleNotifs = () => {
        setShowUserMenu(false);
        if (!showNotifs) fetchNotifs();
        setShowNotifs(v => !v);
    };

    const toggleUserMenu = () => {
        setShowNotifs(false);
        setShowUserMenu(v => !v);
    };

    const marcarLeida = async (id: number) => {
        setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
        setNoLeidas(prev => Math.max(0, prev - 1));
        await axios.post(`/api/notificaciones/${id}/marcar-leida`);
    };

    const marcarTodas = async () => {
        setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
        setNoLeidas(0);
        await axios.post('/api/notificaciones/marcar-todas-leidas');
    };

    const tipoIcon: Record<string, string> = {
        info:    '💬',
        success: '✅',
        warning: '⚠️',
        error:   '🔴',
        pago:    '💰',
        nota:    '📝',
        boletin: '📋',
        mensaje: '✉️',
    };

    // Detecta la página activa comparando la URL actual con el href del item
    const isActivePage = (href: string) =>
        url === href || (href.length > 1 && url.startsWith(href));

    const handleLogout = async () => {
        try {
            await axios.post('/logout', {}, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                withCredentials: true,
            });
            window.location.href = '/';
        } catch (_) {
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
                style={{ background: 'linear-gradient(90deg, #181b49 0%, #293577 50%, #181b49 100%)' }}
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
                                style={{ fontFamily: "'Roboto Condensed', sans-serif" }}
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
                {/* Top bar - STICKY */}
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

                        {/* Title */}
                        <h1
                            className="text-white font-bold text-base sm:text-xl md:text-2xl tracking-wide italic flex-1 text-center"
                            style={{ fontFamily: "'Bitter', serif", textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}
                        >
                            EMPRENDEDORES DEL SABER
                        </h1>

                        {/* Right side */}
                        <div className="flex items-center gap-2">

                            {/* ── Notificaciones ── */}
                            <div className="relative" ref={notifsRef}>
                                <button
                                    onClick={toggleNotifs}
                                    className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                    aria-label="Notificaciones"
                                >
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                                    </svg>
                                    {noLeidas > 0 && (
                                        <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border border-white/20">
                                            {noLeidas > 99 ? '99+' : noLeidas}
                                        </span>
                                    )}
                                </button>

                                {showNotifs && (
                                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl z-50 border border-gray-200 overflow-hidden">
                                        {/* Header */}
                                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                                            <span className="font-bold text-gray-800 text-sm">Notificaciones</span>
                                            {noLeidas > 0 && (
                                                <button
                                                    onClick={marcarTodas}
                                                    className="text-xs text-[#293577] hover:underline font-medium"
                                                >
                                                    Marcar todas como leídas
                                                </button>
                                            )}
                                        </div>

                                        {/* Lista */}
                                        <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                                            {loadingNotifs ? (
                                                <div className="p-6 text-center">
                                                    <svg className="w-6 h-6 animate-spin mx-auto text-[#293577]" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                                    </svg>
                                                </div>
                                            ) : notifs.length === 0 ? (
                                                <div className="p-8 text-center">
                                                    <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                                                    </svg>
                                                    <p className="text-gray-400 text-sm">Sin notificaciones</p>
                                                </div>
                                            ) : (
                                                notifs.map(n => (
                                                    <div
                                                        key={n.id}
                                                        onClick={() => !n.leida && marcarLeida(n.id)}
                                                        className={`flex gap-3 px-4 py-3 transition-colors cursor-pointer ${
                                                            n.leida
                                                                ? 'bg-white hover:bg-gray-50'
                                                                : 'bg-indigo-50/60 hover:bg-indigo-50'
                                                        }`}
                                                    >
                                                        <span className="text-xl flex-shrink-0 mt-0.5">
                                                            {tipoIcon[n.tipo] ?? '🔔'}
                                                        </span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-semibold truncate ${n.leida ? 'text-gray-600' : 'text-gray-800'}`}>
                                                                {n.titulo}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.mensaje}</p>
                                                            <p className="text-[11px] text-gray-400 mt-1">{n.created_at}</p>
                                                        </div>
                                                        {!n.leida && (
                                                            <span className="w-2 h-2 rounded-full bg-[#293577] flex-shrink-0 mt-1.5" />
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Footer */}
                                        {notifs.length > 0 && (
                                            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 text-center">
                                                <button
                                                    onClick={() => { setShowNotifs(false); fetchNotifs(); }}
                                                    className="text-xs text-[#293577] hover:underline font-medium"
                                                >
                                                    Actualizar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── User dropdown ── */}
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={toggleUserMenu}
                                    className="flex items-center gap-2 hover:bg-white/10 p-2 rounded-lg transition-colors"
                                >
                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                    </div>
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl py-1 z-50 border border-gray-200 overflow-hidden">
                                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                                            <p className="text-sm font-bold text-gray-800 truncate">{user.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                        </div>
                                        <Link
                                            href="/profile"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Mi Perfil
                                        </Link>
                                        <div className="border-t border-gray-100" />
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
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
