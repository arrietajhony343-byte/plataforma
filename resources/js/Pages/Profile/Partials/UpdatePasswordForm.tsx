import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useRef, useState } from 'react';

const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] outline-none transition-colors bg-white";
const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

function PasswordInput({ id, value, onChange, placeholder, autoComplete, inputRef }: {
    id: string; value: string; onChange: (v: string) => void;
    placeholder?: string; autoComplete?: string;
    inputRef?: React.RefObject<HTMLInputElement>;
}) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input
                id={id}
                ref={inputRef}
                type={show ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                autoComplete={autoComplete}
                placeholder={placeholder}
                className={inputClass + ' pr-11'}
            />
            <button
                type="button"
                onClick={() => setShow(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
                {show ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                )}
            </button>
        </div>
    );
}

export default function UpdatePasswordForm({ className = '' }: { className?: string }) {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errs) => {
                if (errs.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }
                if (errs.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <section className={className}>
            <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">Cambiar contraseña</h2>
                <p className="mt-1 text-sm text-gray-500">Usa una contraseña segura y única para proteger tu cuenta.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="current_password" className={labelClass}>Contraseña actual</label>
                    <PasswordInput
                        id="current_password"
                        value={data.current_password}
                        onChange={(v) => setData('current_password', v)}
                        inputRef={currentPasswordInput}
                        autoComplete="current-password"
                        placeholder="Tu contraseña actual"
                    />
                    <InputError message={errors.current_password} className="mt-1.5" />
                </div>

                <div>
                    <label htmlFor="password" className={labelClass}>Nueva contraseña</label>
                    <PasswordInput
                        id="password"
                        value={data.password}
                        onChange={(v) => setData('password', v)}
                        inputRef={passwordInput}
                        autoComplete="new-password"
                        placeholder="Mínimo 8 caracteres"
                    />
                    <InputError message={errors.password} className="mt-1.5" />
                </div>

                <div>
                    <label htmlFor="password_confirmation" className={labelClass}>Confirmar contraseña</label>
                    <PasswordInput
                        id="password_confirmation"
                        value={data.password_confirmation}
                        onChange={(v) => setData('password_confirmation', v)}
                        autoComplete="new-password"
                        placeholder="Repite la nueva contraseña"
                    />
                    <InputError message={errors.password_confirmation} className="mt-1.5" />
                </div>

                <div className="flex items-center gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={processing}
                        className="px-6 py-2.5 rounded-xl bg-[#293577] text-white text-sm font-semibold hover:bg-[#181b49] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {processing ? 'Actualizando...' : 'Actualizar contraseña'}
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
                            Actualizada
                        </span>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
