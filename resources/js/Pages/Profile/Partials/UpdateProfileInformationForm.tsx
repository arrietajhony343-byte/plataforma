import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useMemo } from 'react';

const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] outline-none transition-colors bg-white";
const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    userData,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    userData: {
        nombre: string;
        email: string;
        foto?: string | null;
        tipo_documento?: string | null;
        documento?: string | null;
        telefono?: string | null;
        direccion?: string | null;
        fecha_nacimiento?: string | null;
        lugar_nacimiento?: string | null;
        genero?: string | null;
        grupo_sanguineo?: string | null;
        eps?: string | null;
        acudiente_nombre?: string | null;
        acudiente_telefono?: string | null;
    };
    className?: string;
}) {
    const user = usePage().props.auth.user as { name: string; email: string; email_verified_at?: string | null };

    const { data, setData, post, errors, processing, recentlySuccessful } = useForm({
        _method: 'PATCH',
        name: userData.nombre || user.name,
        email: userData.email || user.email,
        tipo_documento: userData.tipo_documento || 'CC',
        documento: userData.documento || '',
        telefono: userData.telefono || '',
        direccion: userData.direccion || '',
        fecha_nacimiento: userData.fecha_nacimiento || '',
        lugar_nacimiento: userData.lugar_nacimiento || '',
        genero: userData.genero || '',
        grupo_sanguineo: userData.grupo_sanguineo || '',
        eps: userData.eps || '',
        foto: null as File | null,
    });

    const fotoPreview = useMemo(() => {
        if (data.foto) {
            return URL.createObjectURL(data.foto);
        }

        return userData.foto || null;
    }, [data.foto, userData.foto]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('profile.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <section>
            <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">Información personal</h2>
                <p className="mt-1 text-sm text-gray-500">Actualiza tu foto, tus datos principales y la información de contacto.</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-[120px_1fr] gap-4 items-center p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[#293577]/10 border border-[#293577]/20 flex items-center justify-center">
                        {fotoPreview ? (
                            <img src={fotoPreview} alt="Foto de perfil" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[#293577] font-bold">Sin foto</span>
                        )}
                    </div>
                    <div>
                        <label htmlFor="foto" className={labelClass}>Foto de perfil</label>
                        <input
                            id="foto"
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={(e) => setData('foto', e.target.files?.[0] || null)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white"
                        />
                        <p className="mt-1 text-xs text-gray-400">JPG, PNG o WEBP (máx. 2MB)</p>
                        <InputError className="mt-1.5" message={errors.foto} />
                    </div>
                </div>

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="tipo_documento" className={labelClass}>Tipo documento</label>
                        <select id="tipo_documento" value={data.tipo_documento} onChange={(e) => setData('tipo_documento', e.target.value)} className={inputClass}>
                            <option value="CC">CC</option>
                            <option value="TI">TI</option>
                            <option value="CE">CE</option>
                            <option value="RC">RC</option>
                            <option value="PP">PP</option>
                        </select>
                        <InputError className="mt-1.5" message={errors.tipo_documento} />
                    </div>
                    <div>
                        <label htmlFor="documento" className={labelClass}>Documento</label>
                        <input id="documento" type="text" value={data.documento} onChange={(e) => setData('documento', e.target.value)} className={inputClass} />
                        <InputError className="mt-1.5" message={errors.documento} />
                    </div>
                    <div>
                        <label htmlFor="telefono" className={labelClass}>Teléfono</label>
                        <input id="telefono" type="text" value={data.telefono} onChange={(e) => setData('telefono', e.target.value)} className={inputClass} />
                        <InputError className="mt-1.5" message={errors.telefono} />
                    </div>
                    <div>
                        <label htmlFor="fecha_nacimiento" className={labelClass}>Fecha de nacimiento</label>
                        <input id="fecha_nacimiento" type="date" value={data.fecha_nacimiento} onChange={(e) => setData('fecha_nacimiento', e.target.value)} className={inputClass} />
                        <InputError className="mt-1.5" message={errors.fecha_nacimiento} />
                    </div>
                    <div>
                        <label htmlFor="lugar_nacimiento" className={labelClass}>Lugar de nacimiento</label>
                        <input id="lugar_nacimiento" type="text" value={data.lugar_nacimiento} onChange={(e) => setData('lugar_nacimiento', e.target.value)} className={inputClass} />
                        <InputError className="mt-1.5" message={errors.lugar_nacimiento} />
                    </div>
                    <div>
                        <label htmlFor="genero" className={labelClass}>Género</label>
                        <select id="genero" value={data.genero} onChange={(e) => setData('genero', e.target.value)} className={inputClass}>
                            <option value="">Sin especificar</option>
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                            <option value="otro">Otro</option>
                        </select>
                        <InputError className="mt-1.5" message={errors.genero} />
                    </div>
                    <div>
                        <label htmlFor="grupo_sanguineo" className={labelClass}>Grupo sanguíneo</label>
                        <input id="grupo_sanguineo" type="text" maxLength={5} value={data.grupo_sanguineo} onChange={(e) => setData('grupo_sanguineo', e.target.value)} className={inputClass} />
                        <InputError className="mt-1.5" message={errors.grupo_sanguineo} />
                    </div>
                    <div>
                        <label htmlFor="eps" className={labelClass}>EPS</label>
                        <input id="eps" type="text" value={data.eps} onChange={(e) => setData('eps', e.target.value)} className={inputClass} />
                        <InputError className="mt-1.5" message={errors.eps} />
                    </div>
                </div>

                <div>
                    <label htmlFor="direccion" className={labelClass}>Dirección</label>
                    <input id="direccion" type="text" value={data.direccion} onChange={(e) => setData('direccion', e.target.value)} className={inputClass} />
                    <InputError className="mt-1.5" message={errors.direccion} />
                </div>

                {(userData.acudiente_nombre || userData.acudiente_telefono) && (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Acudiente registrado</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <p className="text-gray-600"><span className="font-semibold text-gray-800">Nombre:</span> {userData.acudiente_nombre || '—'}</p>
                            <p className="text-gray-600"><span className="font-semibold text-gray-800">Teléfono:</span> {userData.acudiente_telefono || '—'}</p>
                        </div>
                    </div>
                )}

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
