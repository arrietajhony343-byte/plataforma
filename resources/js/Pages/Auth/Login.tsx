import InputError from '@/Components/InputError';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Iniciar Sesión" />

            <div 
                className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url("https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")',
                }}
            >
                <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md mx-4">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <img 
                            src="/logo.png" 
                            alt="I.P. Emprendedores del Saber" 
                            className="w-32 h-32 object-contain"
                        />
                    </div>

                    {status && (
                        <div className="mb-4 text-sm font-medium text-green-600 text-center">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit}>
                        <div className="mb-4">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Usuario / Correo Institucional
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={data.email}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent outline-none transition-all"
                                placeholder="Usuario / Correo Institucional"
                                autoComplete="username"
                                autoFocus
                                onChange={(e) => setData('email', e.target.value)}
                            />
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        <div className="mb-6">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={data.password}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#293577] focus:border-transparent outline-none transition-all"
                                placeholder="Contraseña"
                                autoComplete="current-password"
                                onChange={(e) => setData('password', e.target.value)}
                            />
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        <div className="flex items-center mb-6">
                            <input
                                type="checkbox"
                                id="remember"
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="h-4 w-4 text-[#293577] focus:ring-[#293577] border-gray-300 rounded"
                            />
                            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">
                                Recordarme
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-[#293577] text-white py-3 px-4 rounded-lg hover:bg-[#181b49] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? 'Ingresando...' : 'Ingresar a la Plataforma'}
                        </button>

                        <div className="mt-6 text-center space-y-2">
                            {canResetPassword && (
                                <a
                                    href="/forgot-password"
                                    className="text-sm text-[#293577] hover:underline block"
                                >
                                    ¿Olvidaste tu contraseña?
                                </a>
                            )}
                            <a href="#" className="text-sm text-[#293577] hover:underline block">
                                Soporte Técnico
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
