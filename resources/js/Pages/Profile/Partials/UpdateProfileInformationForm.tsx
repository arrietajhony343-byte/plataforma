import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] outline-none transition-colors bg-white";
const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    className?: string;
}) {
    const user = usePage().props.auth.user as { name: string; email: string; email_verified_at?: string | null };

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <section>
            <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">Información personal</h2>
                <p className="mt-1 text-sm text-gray-500">Actualiza tu nombre y dirección de correo electrónico.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="name" className={labelClass}>Nombre completo</label>
                    <input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        autoFocus
                        autoComplete="name"
                        className={inputClass}
                        placeholder="Tu nombre completo"
                    />
                    <InputError className="mt-1.5" message={errors.name} />
                </div>

                <div>
                    <label htmlFor="email" className={labelClass}>Correo electrónico</label>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                        className={inputClass}
                        placeholder="tu@correo.com"
                    />
                    <InputError className="mt-1.5" message={errors.email} />
                </div>

                {mustVerifyEmail && !user.email_verified_at && (
                    <div className="px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                        <p className="text-sm text-amber-700">
                            Tu correo no está verificado.{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="font-semibold underline hover:text-amber-900"
                            >
                                Reenviar verificación
                            </Link>
                        </p>
                        {status === 'verification-link-sent' && (
                            <p className="mt-1 text-sm font-medium text-green-600">
                                Se envió un nuevo enlace de verificación a tu correo.
                            </p>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-6 py-2.5 rounded-xl bg-[#293577] text-white text-sm font-semibold hover:bg-[#181b49] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {processing ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <span className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Guardado
                        </span>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
