import SidebarLayout from '@/Layouts/SidebarLayout';
import { adminMenuItems } from '@/Config/adminMenu';
import { profesorMenuItems } from '@/Config/profesorMenu';
import { estudianteMenuItems } from '@/Config/estudianteMenu';
import { padreMenuItems } from '@/Config/padreMenu';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import DeleteUserForm from './Partials/DeleteUserForm';

interface UserData {
    id: number;
    nombre: string;
    email: string;
    rol: string;
    rolLabel: string;
    iniciales: string;
    miembroDesde: string;
    verificado: boolean;
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
}

interface HijoProfileData {
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
}

function getMenuItems(rol: string) {
    if (rol === 'admin')      return adminMenuItems;
    if (rol === 'profesor')   return profesorMenuItems;
    if (rol === 'estudiante') return estudianteMenuItems;
    if (rol === 'padre')      return padreMenuItems;
    return profesorMenuItems;
}

type Tab = 'info' | 'seguridad' | 'cuenta';

export default function Edit({
    mustVerifyEmail,
    status,
    userData,
    canEditProfile,
    hijosProfile,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    userData: UserData;
    canEditProfile: boolean;
    hijosProfile: HijoProfileData[];
}) {
    const { auth } = usePage().props as { auth: { user: { rol?: string } } };
    const rol = (auth?.user?.rol ?? userData.rol ?? '');
    const menuItems = getMenuItems(rol);
    const [activeTab, setActiveTab] = useState<Tab>('info');

    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        {
            key: 'info',
            label: 'Información personal',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
            ),
        },
        {
            key: 'seguridad',
            label: 'Contraseña',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
            ),
        },
        {
            key: 'cuenta',
            label: 'Cuenta',
            icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
        },
    ];

    return (
        <SidebarLayout
            menuItems={menuItems}
            title="Mi Perfil"
            userInfo={{ name: userData.nombre, role: userData.rolLabel }}
        >
            <Head title="Mi Perfil" />

            <div className="space-y-6" style={{ fontFamily: "'Inter', sans-serif" }}>
                {/* Hero card */}
                <div className="relative bg-gradient-to-br from-[#293577] to-[#181b49] rounded-2xl overflow-hidden shadow-lg">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
                        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-white/5" />
                    </div>

                    <div className="relative px-6 py-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <div className="w-24 h-24 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center shadow-xl overflow-hidden">
                                {userData.foto ? (
                                    <img src={userData.foto} alt={userData.nombre} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-black text-white tracking-tight">{userData.iniciales}</span>
                                )}
                            </div>
                        </div>

                        {/* Datos */}
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                <h1 className="text-2xl font-black text-white truncate">{userData.nombre}</h1>
                                {userData.verificado && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-400/40 text-green-300 text-[10px] font-bold self-center">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
                                        Verificado
                                    </span>
                                )}
                            </div>
                            <p className="text-blue-200 text-sm mb-4">{userData.email}</p>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 text-white text-xs font-semibold">
                                    <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                    </svg>
                                    {userData.rolLabel}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 text-white text-xs font-semibold">
                                    <svg className="w-3.5 h-3.5 opacity-70" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                                    </svg>
                                    Miembro desde {userData.miembroDesde}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs + contenido */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Tab bar */}
                    <div className="flex border-b border-gray-100 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                                    activeTab === tab.key
                                        ? 'border-[#293577] text-[#293577] bg-blue-50/40'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Contenido del tab */}
                    <div className="p-6 sm:p-8 max-w-2xl">
                        {activeTab === 'info' && (
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                userData={userData}
                                canEditProfile={canEditProfile}
                                hijosProfile={hijosProfile}
                            />
                        )}
                        {activeTab === 'seguridad' && <UpdatePasswordForm />}
                        {activeTab === 'cuenta' && <DeleteUserForm />}
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
