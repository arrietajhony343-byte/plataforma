import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function ForceChangePassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/force-change-password', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Cambiar Contraseña" />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#181b49] via-[#293577] to-[#3a4a9f] p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="p-6 text-center" style={{ background: 'linear-gradient(135deg, #181b49 0%, #293577 100%)' }}>
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h1 className="text-xl font-bold text-white">Cambio de Contraseña Obligatorio</h1>
                            <p className="text-white/60 text-sm mt-1">
                                Tu cuenta tiene una contraseña temporal. Por seguridad, debes crear una nueva contraseña antes de continuar.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={submit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Nueva contraseña
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all"
                                    placeholder="Mínimo 8 caracteres"
                                    required
                                    minLength={8}
                                    autoFocus
                                />
                                {errors.password && (
                                    <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                                    Confirmar contraseña
                                </label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] text-sm transition-all"
                                    placeholder="Repite la nueva contraseña"
                                    required
                                    minLength={8}
                                />
                                {errors.password_confirmation && (
                                    <p className="text-xs text-red-500 mt-1">{errors.password_confirmation}</p>
                                )}
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="text-xs text-blue-700">
                                        <p className="font-medium">Requisitos de la contraseña:</p>
                                        <ul className="mt-1 space-y-0.5 list-disc list-inside text-blue-600">
                                            <li>Mínimo 8 caracteres</li>
                                            <li>No puede ser igual a la temporal</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full text-white py-3 rounded-lg text-sm font-semibold transition-all shadow-md disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #181b49 0%, #293577 100%)' }}
                            >
                                {processing ? 'Actualizando...' : 'Actualizar Contraseña'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
