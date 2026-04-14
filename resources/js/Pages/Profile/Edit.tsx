import SidebarLayout from '@/Layouts/SidebarLayout';
import { adminMenuItems } from '@/Config/adminMenu';
import { profesorMenuItems } from '@/Config/profesorMenu';
import { estudianteMenuItems } from '@/Config/estudianteMenu';
import { padreMenuItems } from '@/Config/padreMenu';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';


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
    sede_nombre?: string | null;
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
                                {userData.sede_nombre && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-400/40 bg-amber-400/15 text-amber-200 text-xs font-semibold">
                                        <svg className="w-3.5 h-3.5 opacity-80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                                        </svg>
                                        Sede: {userData.sede_nombre}
                                    </span>
                                )}
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

                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
