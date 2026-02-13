import { ReactNode } from 'react';

interface MenuItem {
    name?: string;
    label?: string;
    icon: ReactNode | string;
    href: string;
    active?: boolean;
}

export const padreMenuItems: MenuItem[] = [
    { icon: '🏠', label: 'Inicio', href: '/padre/dashboard' },
    { icon: '📋', label: 'Boletín & Notas', href: '/padre/boletin' },
    { icon: '📅', label: 'Calendario', href: '/padre/calendario' },
    { icon: '📊', label: 'Seguimiento Académico', href: '/padre/seguimiento' },
    { icon: '🔔', label: 'Notificaciones', href: '/padre/notificaciones' },
    { icon: '💳', label: 'Pagos', href: '/padre/pagos' },
    { icon: '🧾', label: 'Comprobantes', href: '/padre/comprobantes' },
    { icon: '💬', label: 'Mensajes', href: '/padre/mensajes' },
];

export default padreMenuItems;
