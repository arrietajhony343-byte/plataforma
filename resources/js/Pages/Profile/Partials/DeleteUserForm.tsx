import InputError from '@/Components/InputError';
import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

export default function DeleteUserForm({ className = '' }: { className?: string }) {
    const [confirming, setConfirming] = useState(false);
    const { data, setData, delete: destroy, processing, reset, errors } = useForm({ password: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => { reset(); setConfirming(false); },
            onError: () => {},
        });
    };

    return (
        <section className={className}>
            <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">Eliminar cuenta</h2>
                <p className="mt-1 text-sm text-gray-500">
                    Una vez eliminada, todos los datos de tu cuenta serán borrados permanentemente.
                </p>
            </div>

            {!confirming ? (
                <div className="p-5 rounded-xl border border-red-200 bg-red-50">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-red-800">Esta acción no se puede deshacer</p>
                            <p className="text-sm text-red-600 mt-1">
                                Se eliminarán permanentemente tu cuenta, todos tus mensajes, actividades registradas y demás datos asociados.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => setConfirming(true)}
                        className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
                    >
                        Eliminar mi cuenta
                    </button>
                </div>
            ) : (
                <form onSubmit={submit} className="p-5 rounded-xl border border-red-300 bg-red-50 space-y-4">
                    <p className="text-sm font-bold text-red-800">
                        ¿Estás seguro? Ingresa tu contraseña para confirmar.
                    </p>
                    <div>
                        <label htmlFor="delete_password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                            Contraseña actual
                        </label>
                        <input
                            id="delete_password"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Ingresa tu contraseña"
                            className="w-full px-4 py-3 border border-red-200 rounded-xl text-sm focus:ring-2 focus:ring-red-300 focus:border-red-400 outline-none bg-white"
                        />
                        <InputError message={errors.password} className="mt-1.5" />
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => { setConfirming(false); reset(); }}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors bg-white"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60"
                        >
                            {processing ? 'Eliminando...' : 'Confirmar eliminación'}
                        </button>
                    </div>
                </form>
            )}
        </section>
    );
}
