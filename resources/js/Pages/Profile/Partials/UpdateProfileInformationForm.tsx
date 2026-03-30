import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577] outline-none transition-colors bg-white";
const labelClass = "block text-sm font-semibold text-gray-700 mb-1.5";

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    userData,
    canEditProfile,
    hijosProfile,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    userData: {
        nombre: string;
        email: string;
        rol?: string;
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
    canEditProfile: boolean;
    hijosProfile: Array<{
        id: number;
        nombre: string;
        dificultad_aprendizaje: boolean;
        dificultad_aprendizaje_desc?: string | null;
        diagnostico_salud: boolean;
        diagnostico_salud_desc?: string | null;
        alergias: boolean;
        alergias_desc?: string | null;
        nombre_madre?: string | null;
        telefono_madre?: string | null;
        ocupacion_madre?: string | null;
        nombre_padre?: string | null;
        telefono_padre?: string | null;
        ocupacion_padre?: string | null;
        convive_con?: string | null;
        numero_hermanos?: number | null;
        lugar_que_ocupa_familia?: string | null;
    }>;
    className?: string;
}) {
    const user = usePage().props.auth.user as { name: string; email: string; email_verified_at?: string | null };
    const isPadre = userData.rol === 'padre';

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

    const [selectedHijoId, setSelectedHijoId] = useState<number | null>(hijosProfile[0]?.id ?? null);

    const selectedHijo = useMemo(
        () => hijosProfile.find((hijo) => hijo.id === selectedHijoId) ?? null,
        [hijosProfile, selectedHijoId],
    );

    const {
        data: hijoData,
        setData: setHijoData,
        post: postHijo,
        errors: hijoErrors,
        processing: processingHijo,
        recentlySuccessful: hijoSaved,
    } = useForm({
        _method: 'PATCH',
        dificultad_aprendizaje: false,
        dificultad_aprendizaje_desc: '',
        diagnostico_salud: false,
        diagnostico_salud_desc: '',
        alergias: false,
        alergias_desc: '',
        nombre_madre: '',
        telefono_madre: '',
        ocupacion_madre: '',
        nombre_padre: '',
        telefono_padre: '',
        ocupacion_padre: '',
        convive_con: '',
        numero_hermanos: '',
        lugar_que_ocupa_familia: '',
    });

    useEffect(() => {
        if (!selectedHijo) {
            return;
        }

        setHijoData({
            _method: 'PATCH',
            dificultad_aprendizaje: !!selectedHijo.dificultad_aprendizaje,
            dificultad_aprendizaje_desc: selectedHijo.dificultad_aprendizaje_desc ?? '',
            diagnostico_salud: !!selectedHijo.diagnostico_salud,
            diagnostico_salud_desc: selectedHijo.diagnostico_salud_desc ?? '',
            alergias: !!selectedHijo.alergias,
            alergias_desc: selectedHijo.alergias_desc ?? '',
            nombre_madre: selectedHijo.nombre_madre ?? '',
            telefono_madre: selectedHijo.telefono_madre ?? '',
            ocupacion_madre: selectedHijo.ocupacion_madre ?? '',
            nombre_padre: selectedHijo.nombre_padre ?? '',
            telefono_padre: selectedHijo.telefono_padre ?? '',
            ocupacion_padre: selectedHijo.ocupacion_padre ?? '',
            convive_con: selectedHijo.convive_con ?? '',
            numero_hermanos: selectedHijo.numero_hermanos !== null && selectedHijo.numero_hermanos !== undefined ? String(selectedHijo.numero_hermanos) : '',
            lugar_que_ocupa_familia: selectedHijo.lugar_que_ocupa_familia ?? '',
        });
    }, [selectedHijo, setHijoData]);

    const fotoPreview = useMemo(() => {
        if (data.foto) {
            return URL.createObjectURL(data.foto);
        }

        return userData.foto || null;
    }, [data.foto, userData.foto]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!canEditProfile) return;
        post(route('profile.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const submitHijo: FormEventHandler = (e) => {
        e.preventDefault();
        if (!selectedHijoId) return;

        postHijo(route('profile.hijos.update', selectedHijoId), {
            preserveScroll: true,
        });
    };

    return (
        <section>
            <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900">Información personal</h2>
                <p className="mt-1 text-sm text-gray-500">Actualiza tu foto, tus datos principales y la información de contacto.</p>
                {!canEditProfile && (
                    <p className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                        {isPadre
                            ? 'Tu perfil está en solo lectura. Desde este módulo solo puedes editar la información de tus hijos.'
                            : 'Tu perfil está en solo lectura. Si necesitas un ajuste, debe gestionarlo tu acudiente.'}
                    </p>
                )}
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
                            disabled={!canEditProfile}
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
                        disabled={!canEditProfile}
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
                        disabled={!canEditProfile}
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
                        <select id="tipo_documento" value={data.tipo_documento} onChange={(e) => setData('tipo_documento', e.target.value)} className={inputClass} disabled={!canEditProfile}>
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
                        <input id="documento" type="text" value={data.documento} onChange={(e) => setData('documento', e.target.value)} className={inputClass} disabled={!canEditProfile} />
                        <InputError className="mt-1.5" message={errors.documento} />
                    </div>
                    <div>
                        <label htmlFor="telefono" className={labelClass}>Teléfono</label>
                        <input id="telefono" type="text" value={data.telefono} onChange={(e) => setData('telefono', e.target.value)} className={inputClass} disabled={!canEditProfile} />
                        <InputError className="mt-1.5" message={errors.telefono} />
                    </div>
                    <div>
                        <label htmlFor="fecha_nacimiento" className={labelClass}>Fecha de nacimiento</label>
                        <input id="fecha_nacimiento" type="date" value={data.fecha_nacimiento} onChange={(e) => setData('fecha_nacimiento', e.target.value)} className={inputClass} disabled={!canEditProfile} />
                        <InputError className="mt-1.5" message={errors.fecha_nacimiento} />
                    </div>
                    <div>
                        <label htmlFor="lugar_nacimiento" className={labelClass}>Lugar de nacimiento</label>
                        <input id="lugar_nacimiento" type="text" value={data.lugar_nacimiento} onChange={(e) => setData('lugar_nacimiento', e.target.value)} className={inputClass} disabled={!canEditProfile} />
                        <InputError className="mt-1.5" message={errors.lugar_nacimiento} />
                    </div>
                    <div>
                        <label htmlFor="genero" className={labelClass}>Género</label>
                        <select id="genero" value={data.genero} onChange={(e) => setData('genero', e.target.value)} className={inputClass} disabled={!canEditProfile}>
                            <option value="">Sin especificar</option>
                            <option value="M">Masculino</option>
                            <option value="F">Femenino</option>
                            <option value="otro">Otro</option>
                        </select>
                        <InputError className="mt-1.5" message={errors.genero} />
                    </div>
                    <div>
                        <label htmlFor="grupo_sanguineo" className={labelClass}>Grupo sanguíneo</label>
                        <input id="grupo_sanguineo" type="text" maxLength={5} value={data.grupo_sanguineo} onChange={(e) => setData('grupo_sanguineo', e.target.value)} className={inputClass} disabled={!canEditProfile} />
                        <InputError className="mt-1.5" message={errors.grupo_sanguineo} />
                    </div>
                    <div>
                        <label htmlFor="eps" className={labelClass}>EPS</label>
                        <input id="eps" type="text" value={data.eps} onChange={(e) => setData('eps', e.target.value)} className={inputClass} disabled={!canEditProfile} />
                        <InputError className="mt-1.5" message={errors.eps} />
                    </div>
                </div>

                <div>
                    <label htmlFor="direccion" className={labelClass}>Dirección</label>
                    <input id="direccion" type="text" value={data.direccion} onChange={(e) => setData('direccion', e.target.value)} className={inputClass} disabled={!canEditProfile} />
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
                        disabled={processing || !canEditProfile}
                        className="px-6 py-2.5 rounded-xl bg-[#293577] text-white text-sm font-semibold hover:bg-[#181b49] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {!canEditProfile ? 'Solo lectura' : processing ? 'Guardando...' : 'Guardar cambios'}
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

            {isPadre && (
                <div className="mt-10 border-t border-gray-100 pt-8">
                    <div className="mb-5">
                        <h2 className="text-lg font-bold text-gray-900">Perfil de salud y aprendizaje del estudiante</h2>
                        <p className="mt-1 text-sm text-gray-500">Completa esta información para cada hijo vinculado.</p>
                    </div>

                    {hijosProfile.length === 0 ? (
                        <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                            No tienes hijos vinculados para editar desde este módulo.
                        </div>
                    ) : (
                        <form onSubmit={submitHijo} className="space-y-5">
                            <div>
                                <label htmlFor="hijo_selector" className={labelClass}>Seleccionar hijo/a</label>
                                <select
                                    id="hijo_selector"
                                    value={selectedHijoId ?? ''}
                                    onChange={(e) => setSelectedHijoId(Number(e.target.value))}
                                    className={inputClass}
                                >
                                    {hijosProfile.map((hijo) => (
                                        <option key={hijo.id} value={hijo.id}>{hijo.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs font-black tracking-[0.2em] text-[#293577] uppercase border-b border-gray-100 pb-2">Perfil de Salud y Aprendizaje</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-gray-50 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={hijoData.dificultad_aprendizaje}
                                            onChange={(e) => setHijoData('dificultad_aprendizaje', e.target.checked)}
                                        />
                                        Dificultad de aprendizaje
                                    </label>

                                    <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-gray-50 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={hijoData.diagnostico_salud}
                                            onChange={(e) => setHijoData('diagnostico_salud', e.target.checked)}
                                        />
                                        Diagnóstico de salud
                                    </label>

                                    <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 bg-gray-50 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={hijoData.alergias}
                                            onChange={(e) => setHijoData('alergias', e.target.checked)}
                                        />
                                        Presenta alergias
                                    </label>
                                </div>

                                <div>
                                    <textarea
                                        value={hijoData.dificultad_aprendizaje_desc}
                                        onChange={(e) => setHijoData('dificultad_aprendizaje_desc', e.target.value)}
                                        className={inputClass}
                                        rows={3}
                                        placeholder="Detalle de dificultad de aprendizaje"
                                        disabled={!hijoData.dificultad_aprendizaje}
                                    />
                                    <InputError className="mt-1.5" message={hijoErrors.dificultad_aprendizaje_desc} />
                                </div>

                                <div>
                                    <textarea
                                        value={hijoData.diagnostico_salud_desc}
                                        onChange={(e) => setHijoData('diagnostico_salud_desc', e.target.value)}
                                        className={inputClass}
                                        rows={3}
                                        placeholder="Detalle de diagnóstico de salud"
                                        disabled={!hijoData.diagnostico_salud}
                                    />
                                    <InputError className="mt-1.5" message={hijoErrors.diagnostico_salud_desc} />
                                </div>

                                <div>
                                    <textarea
                                        value={hijoData.alergias_desc}
                                        onChange={(e) => setHijoData('alergias_desc', e.target.value)}
                                        className={inputClass}
                                        rows={3}
                                        placeholder="Detalle de alergias"
                                        disabled={!hijoData.alergias}
                                    />
                                    <InputError className="mt-1.5" message={hijoErrors.alergias_desc} />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xs font-black tracking-[0.2em] text-[#293577] uppercase border-b border-gray-100 pb-2">Entorno Familiar</h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <div>
                                        <input value={hijoData.nombre_madre} onChange={(e) => setHijoData('nombre_madre', e.target.value)} className={inputClass} placeholder="Nombre madre" />
                                        <InputError className="mt-1.5" message={hijoErrors.nombre_madre} />
                                    </div>
                                    <div>
                                        <input value={hijoData.telefono_madre} onChange={(e) => setHijoData('telefono_madre', e.target.value)} className={inputClass} placeholder="Teléfono madre" />
                                        <InputError className="mt-1.5" message={hijoErrors.telefono_madre} />
                                    </div>
                                    <div>
                                        <input value={hijoData.ocupacion_madre} onChange={(e) => setHijoData('ocupacion_madre', e.target.value)} className={inputClass} placeholder="Ocupación madre" />
                                        <InputError className="mt-1.5" message={hijoErrors.ocupacion_madre} />
                                    </div>

                                    <div>
                                        <input value={hijoData.nombre_padre} onChange={(e) => setHijoData('nombre_padre', e.target.value)} className={inputClass} placeholder="Nombre padre" />
                                        <InputError className="mt-1.5" message={hijoErrors.nombre_padre} />
                                    </div>
                                    <div>
                                        <input value={hijoData.telefono_padre} onChange={(e) => setHijoData('telefono_padre', e.target.value)} className={inputClass} placeholder="Teléfono padre" />
                                        <InputError className="mt-1.5" message={hijoErrors.telefono_padre} />
                                    </div>
                                    <div>
                                        <input value={hijoData.ocupacion_padre} onChange={(e) => setHijoData('ocupacion_padre', e.target.value)} className={inputClass} placeholder="Ocupación padre" />
                                        <InputError className="mt-1.5" message={hijoErrors.ocupacion_padre} />
                                    </div>

                                    <div>
                                        <input value={hijoData.convive_con} onChange={(e) => setHijoData('convive_con', e.target.value)} className={inputClass} placeholder="Convive con" />
                                        <InputError className="mt-1.5" message={hijoErrors.convive_con} />
                                    </div>
                                    <div>
                                        <input value={hijoData.numero_hermanos} onChange={(e) => setHijoData('numero_hermanos', e.target.value.replace(/[^0-9]/g, ''))} className={inputClass} placeholder="Número de hermanos" />
                                        <InputError className="mt-1.5" message={hijoErrors.numero_hermanos} />
                                    </div>
                                    <div>
                                        <input value={hijoData.lugar_que_ocupa_familia} onChange={(e) => setHijoData('lugar_que_ocupa_familia', e.target.value)} className={inputClass} placeholder="Lugar que ocupa en la familia" />
                                        <InputError className="mt-1.5" message={hijoErrors.lugar_que_ocupa_familia} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <button
                                    type="submit"
                                    disabled={processingHijo}
                                    className="px-6 py-2.5 rounded-xl bg-[#293577] text-white text-sm font-semibold hover:bg-[#181b49] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {processingHijo ? 'Guardando...' : 'Guardar información del hijo'}
                                </button>

                                <Transition
                                    show={hijoSaved}
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
                    )}
                </div>
            )}
        </section>
    );
}
