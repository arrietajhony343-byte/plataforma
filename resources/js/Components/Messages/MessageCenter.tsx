import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import axios from 'axios';
import { ChangeEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';

interface MenuItem {
    name?: string;
    label?: string;
    href: string;
    icon: ReactNode;
    active?: boolean;
}

export interface MessageAttachment {
    url: string;
    nombre: string;
    tipo: string;
    tamano: number | null;
}

export interface MessageItem {
    id: number;
    texto: string;
    asunto?: string | null;
    fecha: string;
    hora: string;
    propio: boolean;
    leido: boolean;
    archivo?: MessageAttachment | null;
}

export interface MessageContactChild {
    id: number;
    nombre: string;
    documento?: string | null;
    curso?: string | null;
}

export interface MessageContactGuardian {
    id: number;
    nombre: string;
    documento?: string | null;
    telefono?: string | null;
}

export interface MessageContactProfile {
    documento?: string | null;
    email?: string | null;
    telefono?: string | null;
    direccion?: string | null;
    sede?: string | null;
    curso_actual?: string | null;
    hijos?: MessageContactChild[];
    materias?: string[];
    cursos_direccion?: string[];
    acudientes?: MessageContactGuardian[];
}

export interface MessageContact {
    id: number;
    nombre: string;
    rol: string;
    avatar: string;
    subtitle: string;
    perfil?: MessageContactProfile;
    ultimoMensaje?: string | null;
    ultimoMensajeFecha?: string | null;
    noLeidos: number;
    online: boolean;
    mensajes: MessageItem[];
}

export interface MessageOption {
    id: number;
    nombre: string;
    rol: string;
    avatar: string;
    subtitle: string;
    perfil?: MessageContactProfile;
}

export interface MessagePageProps {
    currentUser: {
        id: number;
        nombre: string;
        rol: string;
    };
    contactos: MessageContact[];
    disponibles: MessageOption[];
}

interface MessageCenterProps extends MessagePageProps {
    basePath: string;
    menuItems: MenuItem[];
    pageTitle: string;
    headerTitle: string;
    headerDescription: string;
}

const SearchIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

const MessageIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
);

const roleTone: Record<string, string> = {
    'Administración': 'bg-amber-50 text-amber-700 border-amber-200',
    'Docente': 'bg-blue-50 text-blue-700 border-blue-200',
    'Padre de familia': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Estudiante': 'bg-purple-50 text-purple-700 border-purple-200',
};

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(tipo: string): string {
    if (tipo.startsWith('image/')) return '🖼️';
    if (tipo === 'application/pdf') return '📄';
    if (tipo.includes('word') || tipo.includes('document')) return '📝';
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return '📊';
    if (tipo.includes('powerpoint') || tipo.includes('presentation')) return '📋';
    if (tipo.includes('zip') || tipo.includes('rar')) return '🗜️';
    return '📎';
}

function renderTextWithLinks(text: string, isOwn: boolean) {
    if (!text) return null;
    const urlRegex = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
    const parts = text.split(urlRegex);
    return parts.map((part, i) => {
        if (/^(https?:\/\/|www\.)/i.test(part)) {
            const href = part.startsWith('http') ? part : `https://${part}`;
            return (
                <a key={i} href={href} target="_blank" rel="noopener noreferrer"
                    className={`underline break-all hover:opacity-80 ${isOwn ? 'text-blue-200' : 'text-blue-600'}`}>
                    {part}
                </a>
            );
        }
        return <span key={i}>{part}</span>;
    });
}

function FileDisplay({ archivo, isOwn }: { archivo: MessageAttachment; isOwn: boolean }) {
    const [preview, setPreview] = useState(false);
    const isPdf = archivo.tipo === 'application/pdf';
    const isImage = archivo.tipo.startsWith('image/');

    return (
        <>
            {isImage ? (
                <button onClick={() => setPreview(true)} className="block mt-2 text-left">
                    <img
                        src={archivo.url}
                        alt={archivo.nombre}
                        className="max-h-52 max-w-full rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity border border-white/20"
                    />
                </button>
            ) : (
                <button
                    onClick={() => setPreview(true)}
                    className={`flex items-center gap-2.5 mt-2 p-2.5 rounded-xl transition-opacity hover:opacity-80 w-full text-left ${isOwn ? 'bg-white/10' : 'bg-gray-100 border border-gray-200'}`}>
                    <span className="text-2xl flex-shrink-0">{getFileIcon(archivo.tipo)}</span>
                    <div className="min-w-0 flex-1">
                        <p className={`text-xs font-semibold truncate ${isOwn ? 'text-white' : 'text-gray-700'}`}>{archivo.nombre}</p>
                        {archivo.tamano != null && (
                            <p className={`text-[10px] ${isOwn ? 'text-white/60' : 'text-gray-400'}`}>{formatFileSize(archivo.tamano)}</p>
                        )}
                    </div>
                    <svg className={`w-4 h-4 flex-shrink-0 ${isOwn ? 'text-white/60' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </button>
            )}

            {preview && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-[9999] p-4"
                    onClick={() => setPreview(false)}
                >
                    <div
                        className={`relative ${isImage ? 'max-w-4xl max-h-[90vh]' : 'w-full max-w-4xl h-[90vh]'} flex flex-col`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Barra superior */}
                        <div className="flex items-center justify-between bg-gray-900/90 rounded-t-xl px-4 py-2.5 gap-3">
                            <span className="text-white text-sm font-medium truncate">{archivo.nombre}</span>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <a
                                    href={archivo.url}
                                    download={archivo.nombre}
                                    className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Descargar
                                </a>
                                <button
                                    onClick={() => setPreview(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/25 text-white transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Contenido */}
                        {isImage ? (
                            <img
                                src={archivo.url}
                                alt={archivo.nombre}
                                className="max-h-[85vh] max-w-full object-contain rounded-b-xl"
                            />
                        ) : isPdf ? (
                            <iframe
                                src={archivo.url}
                                title={archivo.nombre}
                                className="flex-1 w-full rounded-b-xl bg-white"
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-gray-900/50 rounded-b-xl gap-4">
                                <span className="text-6xl">{getFileIcon(archivo.tipo)}</span>
                                <p className="text-white font-semibold text-lg">{archivo.nombre}</p>
                                {archivo.tamano != null && (
                                    <p className="text-white/50 text-sm">{formatFileSize(archivo.tamano)}</p>
                                )}
                                <a
                                    href={archivo.url}
                                    download={archivo.nombre}
                                    className="flex items-center gap-2 bg-white text-gray-800 font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-100 transition-colors text-sm"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Descargar archivo
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

function sortContacts(items: MessageContact[]): MessageContact[] {
    return [...items].sort((a, b) => {
        if (a.noLeidos !== b.noLeidos) return b.noLeidos - a.noLeidos;
        const timeA = a.mensajes.at(-1)?.id ?? 0;
        const timeB = b.mensajes.at(-1)?.id ?? 0;
        if (timeA !== timeB) return timeB - timeA;
        return a.nombre.localeCompare(b.nombre, 'es');
    });
}

export default function MessageCenter({
    currentUser,
    contactos,
    disponibles,
    basePath,
    menuItems,
    pageTitle,
    headerTitle,
    headerDescription,
}: MessageCenterProps) {
    const [contacts, setContacts] = useState<MessageContact[]>(contactos);
    const [selectedId, setSelectedId] = useState<number | null>(contactos[0]?.id ?? null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('todos');
    const [showMobileList, setShowMobileList] = useState(true);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [showProfile, setShowProfile] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const lastMsgIdRef = useRef<Record<number, number>>({});

    useEffect(() => {
        setContacts(contactos);
        setSelectedId(prev => prev && contactos.some(contact => contact.id === prev) ? prev : (contactos[0]?.id ?? null));
    }, [contactos]);

    // Scroll al fondo solo al cambiar de contacto
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'instant' });
        setShowProfile(false);
    }, [selectedId]);

    const isNearBottom = () => {
        const el = chatContainerRef.current;
        if (!el) return true;
        return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
    };

    // Sincronizar last message IDs para poll
    useEffect(() => {
        contacts.forEach(c => {
            lastMsgIdRef.current[c.id] = c.mensajes.at(-1)?.id ?? 0;
        });
    }, [contacts]);

    // Polling de mensajes nuevos cada 3s
    useEffect(() => {
        if (!selectedId) return;
        let active = true;

        const poll = async () => {
            if (!active || document.hidden) return;
            const desde = lastMsgIdRef.current[selectedId] ?? 0;
            try {
                const { data } = await axios.get<{
                    mensajes: MessageItem[];
                    noLeidos: Record<number, number>;
                }>(`${basePath}/${selectedId}/novedades`, { params: { desde } });

                if (!active) return;

                if (data.mensajes.length > 0) {
                    const shouldScroll = isNearBottom();
                    setContacts(prev =>
                        sortContacts(prev.map(c => {
                            if (c.id === selectedId) {
                                const newMsgs = data.mensajes.filter(m => !c.mensajes.some(e => e.id === m.id));
                                if (newMsgs.length === 0) return c;
                                const last = newMsgs.at(-1)!;
                                return {
                                    ...c,
                                    mensajes: [...c.mensajes, ...newMsgs],
                                    ultimoMensaje: last.texto || (last.archivo ? '📎 Archivo adjunto' : c.ultimoMensaje),
                                    ultimoMensajeFecha: 'Ahora',
                                    noLeidos: 0,
                                };
                            }
                            const unread = data.noLeidos[c.id];
                            return unread !== undefined ? { ...c, noLeidos: unread } : c;
                        })),
                    );
                    if (shouldScroll) setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
                } else {
                    setContacts(prev => prev.map(c => {
                        const unread = data.noLeidos[c.id];
                        return unread !== undefined && c.id !== selectedId ? { ...c, noLeidos: unread } : c;
                    }));
                }
            } catch {
                // Ignorar errores de red silenciosamente
            }
        };

        const intervalId = setInterval(poll, 3000);
        return () => { active = false; clearInterval(intervalId); };
    }, [selectedId, basePath]);

    const roleOptions = useMemo(() => {
        return ['todos', ...new Set(contacts.map(contact => contact.rol))];
    }, [contacts]);

    const filteredContacts = useMemo(() => {
        const needle = searchTerm.trim().toLowerCase();

        return contacts.filter(contact => {
            const matchesSearch = !needle
                || contact.nombre.toLowerCase().includes(needle)
                || contact.subtitle.toLowerCase().includes(needle)
                || contact.rol.toLowerCase().includes(needle);
            const matchesRole = roleFilter === 'todos' || contact.rol === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [contacts, roleFilter, searchTerm]);

    const selectedContact = useMemo(
        () => contacts.find(contact => contact.id === selectedId) ?? null,
        [contacts, selectedId],
    );

    const totalUnread = useMemo(
        () => contacts.reduce((acc, contact) => acc + contact.noLeidos, 0),
        [contacts],
    );

    const availableMap = useMemo(
        () => new Map(disponibles.map(contact => [contact.id, contact])),
        [disponibles],
    );

    const markAsRead = async (contactId: number) => {
        const contact = contacts.find(item => item.id === contactId);
        if (!contact || contact.noLeidos === 0) return;

        setContacts(prev => prev.map(item => {
            if (item.id !== contactId) return item;
            return {
                ...item,
                noLeidos: 0,
                mensajes: item.mensajes.map(message => message.propio ? message : { ...message, leido: true }),
            };
        }));

        try {
            await axios.post(`${basePath}/${contactId}/leer`);
        } catch {
            // Silencioso: el próximo refresh sincroniza el estado.
        }
    };

    const handleSelectContact = (contactId: number) => {
        setSelectedId(contactId);
        setShowMobileList(false);
        setShowProfile(false);
        void markAsRead(contactId);
    };

    const upsertMessage = (contactId: number, message: MessageItem) => {
        setContacts(prev => {
            const existing = prev.find(contact => contact.id === contactId);
            if (!existing) {
                const option = availableMap.get(contactId);
                if (!option) return prev;
                return sortContacts([
                    {
                        id: option.id,
                        nombre: option.nombre,
                        rol: option.rol,
                        avatar: option.avatar,
                        subtitle: option.subtitle,
                        perfil: option.perfil,
                        ultimoMensaje: message.texto || (message.archivo ? '📎 Archivo adjunto' : null),
                        ultimoMensajeFecha: 'Ahora',
                        noLeidos: 0,
                        online: false,
                        mensajes: [message],
                    },
                    ...prev,
                ]);
            }

            return sortContacts(prev.map(contact => {
                if (contact.id !== contactId) return contact;
                return {
                    ...contact,
                    ultimoMensaje: message.texto || (message.archivo ? '📎 Archivo adjunto' : null),
                    ultimoMensajeFecha: 'Ahora',
                    noLeidos: 0,
                    mensajes: [...contact.mensajes, message],
                };
            }));
        });
    };

    const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setAttachedFile(file);
        if (file?.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => setFilePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const clearFile = () => {
        setAttachedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const sendMessage = async (recipientId: number, content: string, subject?: string | null, file?: File | null) => {
        const trimmed = content.trim();
        if (!trimmed && !file) return;

        let responseData: { mensaje: MessageItem };
        if (file) {
            const formData = new FormData();
            formData.append('destinatario_id', String(recipientId));
            if (trimmed) formData.append('contenido', trimmed);
            if (subject?.trim()) formData.append('asunto', subject.trim());
            formData.append('archivo', file);
            const response = await axios.post<{ mensaje: MessageItem }>(basePath, formData);
            responseData = response.data;
        } else {
            const response = await axios.post<{ mensaje: MessageItem }>(basePath, {
                destinatario_id: recipientId,
                contenido: trimmed,
                asunto: subject?.trim() || null,
            });
            responseData = response.data;
        }

        upsertMessage(recipientId, responseData.mensaje);
        setSelectedId(recipientId);
        setShowMobileList(false);
    };

    const handleSendCurrent = async () => {
        if (!selectedContact || (!draft.trim() && !attachedFile) || sending) return;
        setSending(true);
        setError(null);

        try {
            await sendMessage(selectedContact.id, draft, null, attachedFile);
            setDraft('');
            setAttachedFile(null);
            setFilePreview(null);
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30);
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr?.response?.data?.message || 'No se pudo enviar el mensaje.');
        } finally {
            setSending(false);
        }
    };

    return (
        <SidebarLayout
            menuItems={menuItems}
            title={pageTitle}
            userInfo={{ name: currentUser.nombre, role: currentUser.rol }}
        >
            <Head title={pageTitle} />

            <div className="space-y-4" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>{headerTitle}</h1>
                        <p className="text-sm text-gray-500">{headerDescription}</p>
                    </div>
                    {totalUnread > 0 && (
                        <span className="px-3 py-1 rounded-full bg-red-500 text-white text-xs font-semibold self-start sm:self-auto">
                            {totalUnread} sin leer
                        </span>
                    )}
                </div>

                {error && (
                    <div className="px-4 py-3 rounded-xl border border-red-200 bg-red-50 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: 'calc(100vh - 210px)', minHeight: '520px' }}>
                    <div className="flex h-full">
                        <aside className={`${selectedContact && !showMobileList ? 'hidden lg:flex' : 'flex'} w-full lg:w-[360px] border-r border-gray-100 flex-col bg-white`}>
                            <div className="p-4 border-b border-gray-100 space-y-3">
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800"><SearchIcon /></span>
                                    <input
                                        value={searchTerm}
                                        onChange={event => setSearchTerm(event.target.value)}
                                        placeholder="Buscar por nombre, rol o contexto..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {roleOptions.map(role => (
                                        <button
                                            key={role}
                                            onClick={() => setRoleFilter(role)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${roleFilter === role ? 'bg-[#293577] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            {role === 'todos' ? 'Todos' : role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto">
                                {filteredContacts.length === 0 ? (
                                    <div className="p-6 text-center text-gray-400">
                                        <MessageIcon className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm font-semibold text-gray-500">No hay contactos visibles</p>
                                        <p className="text-xs mt-1">Ajusta el filtro o inicia una conversación nueva.</p>
                                    </div>
                                ) : (
                                    filteredContacts.map(contact => {
                                        const tone = roleTone[contact.rol] ?? 'bg-gray-50 text-gray-700 border-gray-200';
                                        return (
                                            <button
                                                key={contact.id}
                                                onClick={() => handleSelectContact(contact.id)}
                                                className={`w-full px-4 py-3 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${selectedContact?.id === contact.id ? 'bg-blue-50/60' : 'bg-white'}`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className="relative flex-shrink-0">
                                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#293577] to-[#181b49] text-white flex items-center justify-center text-sm font-bold shadow-sm">
                                                            {contact.avatar}
                                                        </div>
                                                        {contact.online && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-green-500" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className={`text-sm truncate ${contact.noLeidos > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>{contact.nombre}</p>
                                                            <span className="text-[11px] text-gray-400 whitespace-nowrap">{contact.ultimoMensajeFecha || 'Sin mensajes'}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${tone}`}>{contact.rol}</span>
                                                            <p className="text-[11px] text-gray-500 truncate">{contact.subtitle}</p>
                                                        </div>
                                                        <div className="mt-1.5 flex items-start justify-between gap-2">
                                                            <p className={`text-xs truncate ${contact.noLeidos > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                                                                {contact.ultimoMensaje || 'Sin conversación aún'}
                                                            </p>
                                                            {contact.noLeidos > 0 && (
                                                                <span className="w-5 h-5 rounded-full bg-[#293577] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                                                    {contact.noLeidos}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </aside>

                        <section className={`${!selectedContact || showMobileList ? 'hidden lg:flex' : 'flex'} flex-1 flex-col min-w-0`}>
                            {selectedContact ? (
                                <>
                                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/70 flex items-center gap-3">
                                        <button
                                            onClick={() => setShowMobileList(true)}
                                            className="lg:hidden p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                            </svg>
                                        </button>
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#293577] to-[#181b49] text-white flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0">
                                            {selectedContact.avatar}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowProfile(true)}
                                                    className="text-sm font-bold text-gray-800 truncate hover:text-[#293577] hover:underline text-left"
                                                    title="Ver perfil del contacto"
                                                >
                                                    {selectedContact.nombre}
                                                </button>
                                                <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold ${roleTone[selectedContact.rol] ?? 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                                    {selectedContact.rol}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs text-gray-500 truncate">{selectedContact.subtitle}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowProfile(true)}
                                                    className="text-[11px] font-semibold text-[#293577] hover:text-[#181b49] whitespace-nowrap"
                                                >
                                                    Ver perfil
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-gray-50/50 px-4 py-4 space-y-3">
                                        <div className="text-center">
                                            <span className="inline-flex px-3 py-1 rounded-full border border-gray-200 bg-white text-[11px] text-gray-400 font-medium">
                                                Comunicación institucional supervisada
                                            </span>
                                        </div>

                                        {selectedContact.mensajes.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 px-6 py-10">
                                                <MessageIcon className="w-10 h-10 text-gray-300 mb-3" />
                                                <p className="text-sm font-semibold text-gray-500">Sin mensajes todavía</p>
                                                <p className="text-xs mt-1">Puedes iniciar la conversación desde este chat.</p>
                                            </div>
                                        ) : (
                                            selectedContact.mensajes.map(message => (
                                                <div key={message.id} className={`flex ${message.propio ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[88%] sm:max-w-[72%] px-4 py-3 rounded-2xl shadow-sm ${message.propio ? 'bg-gradient-to-r from-[#293577] to-[#181b49] text-white rounded-br-md' : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'}`}>
                                                        {message.asunto && (
                                                            <p className={`text-[11px] font-bold mb-1 uppercase tracking-wide ${message.propio ? 'text-white/70' : 'text-[#293577]'}`}>
                                                                {message.asunto}
                                                            </p>
                                                        )}
                                                        {message.texto && (
                                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                                {renderTextWithLinks(message.texto, message.propio)}
                                                            </p>
                                                        )}
                                                        {message.archivo && (
                                                            <FileDisplay archivo={message.archivo} isOwn={message.propio} />
                                                        )}
                                                        <p className={`text-[11px] mt-2 ${message.propio ? 'text-white/65' : 'text-gray-400'}`}>
                                                            {message.hora}{message.propio ? ` · ${message.leido ? 'Leído' : 'Enviado'}` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>

                                    <div className="border-t border-gray-100 bg-white">
                                        {attachedFile && (
                                            <div className="px-3 pt-2.5 flex items-center gap-2">
                                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs border ${attachedFile.type.startsWith('image/') ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                                                    <span>{getFileIcon(attachedFile.type)}</span>
                                                    <span className="font-medium truncate max-w-[160px]">{attachedFile.name}</span>
                                                    <span className="text-gray-400 text-[10px]">({formatFileSize(attachedFile.size)})</span>
                                                </div>
                                                {filePreview && (
                                                    <img src={filePreview} alt="preview" className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                                                )}
                                                <button onClick={clearFile} className="ml-auto p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0" title="Quitar archivo">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                        <div className="p-3 flex items-end gap-2">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                className="hidden"
                                                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                                                onChange={handleFileSelect}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className={`flex-shrink-0 h-[46px] w-[46px] flex items-center justify-center rounded-2xl border transition-colors ${attachedFile ? 'border-[#293577] text-[#293577] bg-[#293577]/5' : 'border-gray-200 text-gray-400 hover:text-[#293577] hover:border-[#293577]'}`}
                                                title="Adjuntar archivo"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                                </svg>
                                            </button>
                                            <textarea
                                                rows={1}
                                                value={draft}
                                                onChange={event => setDraft(event.target.value)}
                                                onKeyDown={event => {
                                                    if (event.key === 'Enter' && !event.shiftKey) {
                                                        event.preventDefault();
                                                        void handleSendCurrent();
                                                    }
                                                }}
                                                placeholder={`Escribe un mensaje a ${selectedContact.nombre.split(' ')[0]}...`}
                                                className="flex-1 min-h-[46px] max-h-32 px-4 py-3 border border-gray-200 rounded-2xl text-sm resize-none focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]"
                                            />
                                            <button
                                                onClick={() => void handleSendCurrent()}
                                                disabled={(!draft.trim() && !attachedFile) || sending}
                                                className="flex-shrink-0 h-[46px] px-4 rounded-2xl bg-[#293577] text-white text-sm font-semibold hover:bg-[#181b49] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {sending ? (
                                                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                ) : 'Enviar'}
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-gray-400 pb-2 text-center">Enter para enviar · Shift + Enter para salto de línea</p>
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 px-6">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                                        <MessageIcon className="w-8 h-8 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-600">Selecciona una conversación</h3>
                                    <p className="text-sm mt-1 max-w-md">Administra conversaciones institucionales con una vista responsive y segura desde cualquier dispositivo.</p>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>

            {showProfile && selectedContact && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
                    onClick={() => setShowProfile(false)}
                >
                    <div
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100 shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#293577] to-[#181b49] text-white flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0">
                                    {selectedContact.avatar}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold text-gray-800 truncate">{selectedContact.nombre}</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">{selectedContact.rol}</p>
                                    <p className="text-xs text-gray-500 truncate">{selectedContact.subtitle}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowProfile(false)}
                                className="w-8 h-8 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 flex items-center justify-center"
                                title="Cerrar"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Documento</p>
                                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedContact.perfil?.documento || 'No registrado'}</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Telefono</p>
                                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedContact.perfil?.telefono || 'No registrado'}</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 sm:col-span-2">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Correo</p>
                                    <p className="text-sm font-medium text-gray-800 mt-1 break-all">{selectedContact.perfil?.email || 'No registrado'}</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Sede</p>
                                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedContact.perfil?.sede || 'No registrada'}</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Curso actual</p>
                                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedContact.perfil?.curso_actual || 'No aplica'}</p>
                                </div>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 sm:col-span-2">
                                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Direccion</p>
                                    <p className="text-sm font-medium text-gray-800 mt-1">{selectedContact.perfil?.direccion || 'No registrada'}</p>
                                </div>
                            </div>

                            {(selectedContact.perfil?.hijos?.length ?? 0) > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 mb-2">Hijos vinculados</h4>
                                    <div className="space-y-2">
                                        {selectedContact.perfil?.hijos?.map(hijo => (
                                            <div key={hijo.id} className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-emerald-800 truncate">{hijo.nombre}</p>
                                                    <p className="text-xs text-emerald-700">{hijo.documento || 'Sin documento'}</p>
                                                </div>
                                                <span className="text-xs font-medium text-emerald-800 bg-white/80 border border-emerald-200 px-2 py-1 rounded-full">
                                                    {hijo.curso || 'Sin curso activo'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(selectedContact.perfil?.acudientes?.length ?? 0) > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 mb-2">Acudientes</h4>
                                    <div className="space-y-2">
                                        {selectedContact.perfil?.acudientes?.map(acudiente => (
                                            <div key={acudiente.id} className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                                                <p className="text-sm font-semibold text-blue-800">{acudiente.nombre}</p>
                                                <p className="text-xs text-blue-700 mt-0.5">
                                                    {acudiente.documento || 'Sin documento'}
                                                    {acudiente.telefono ? ` · ${acudiente.telefono}` : ''}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(selectedContact.perfil?.materias?.length ?? 0) > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 mb-2">Materias</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedContact.perfil?.materias?.map(materia => (
                                            <span key={materia} className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                {materia}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(selectedContact.perfil?.cursos_direccion?.length ?? 0) > 0 && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-800 mb-2">Direcciones de grupo</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedContact.perfil?.cursos_direccion?.map(curso => (
                                            <span key={curso} className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                                {curso}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </SidebarLayout>
    );
}
