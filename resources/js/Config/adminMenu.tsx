import { ReactNode } from 'react';

interface MenuItem {
    name?: string;
    label?: string;
    icon: ReactNode | string;
    href: string;
    active?: boolean;
}

// Iconos como emojis para simplicidad y consistencia
export const adminMenuItems: MenuItem[] = [
    { icon: '📊', label: 'Dashboard', href: '/admin/dashboard' },
    { icon: '👥', label: 'Usuarios', href: '/admin/usuarios' },
    { icon: '🎓', label: 'Buscar Estudiantes', href: '/admin/estudiantes' },
    { icon: '📚', label: 'Cursos & Materias', href: '/admin/cursos' },
    { icon: '⚙️', label: 'Config. Periodos', href: '/admin/periodos' },
    { icon: '📅', label: 'Horarios Profesores', href: '/admin/horarios' },
    { icon: '📈', label: 'Reportes Globales', href: '/admin/reportes' },
    { icon: '📜', label: 'Certificados', href: '/admin/certificados' },
    { icon: '📋', label: 'Boletines & Notas', href: '/admin/boletines' },
    { icon: '💰', label: 'Control de Pagos', href: '/admin/pagos' },
    { icon: '📒', label: 'Contabilidad', href: '/admin/contabilidad' },
];

export default adminMenuItems;
