import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import axios from 'axios';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Configurar axios globalmente
const baseURL = window.location.origin;
axios.defaults.baseURL = baseURL;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
(window as any).axios = axios;

// Interceptor para Inertia - forzar todas las URLs a usar baseURL completa
const originalVisit = router.visit;
router.visit = function(href: any, options: any = {}) {
    // Si href es relativa, agregar baseURL
    if (typeof href === 'string' && !href.startsWith('http')) {
        href = baseURL + (href.startsWith('/') ? href : '/' + href);
    }
    return originalVisit.call(this, href, options);
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        // Forzar que Ziggy use el origin actual del navegador
        if (typeof window !== 'undefined') {
            const win = window as unknown as { Ziggy?: { url?: string; port?: number | null } };
            if (win.Ziggy) {
                win.Ziggy.url = baseURL;
                win.Ziggy.port = null;
            }
        }

        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
