import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { profesorMenuItems } from '@/Config/profesorMenu';

const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

interface Mensaje {
    id: number;
    texto: string;
    de: 'yo' | 'otro';
    hora: string;
    archivo?: string;
}

interface Contacto {
    id: number;
    nombre: string;
    curso: string;
    avatar: string;
    ultimoMensaje: string;
    hora: string;
    sinLeer: number;
    online: boolean;
    mensajes: Mensaje[];
}

export default function Mensajes() {
    const nombre = 'María García';
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroCurso, setFiltroCurso] = useState('');
    const [contactoActivo, setContactoActivo] = useState<Contacto | null>(null);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [showNewChat, setShowNewChat] = useState(false);
    const chatRef = useRef<HTMLDivElement>(null);

    const contactos: Contacto[] = [
        {
            id: 1, nombre: 'Andrés F. Muñoz', curso: '8° A', avatar: 'AM', ultimoMensaje: 'Profesora, tengo duda sobre el ejercicio 5', hora: '10:30 AM', sinLeer: 2, online: true,
            mensajes: [
                { id: 1, texto: 'Buenos días profesora', de: 'otro', hora: '10:25 AM' },
                { id: 2, texto: 'Profesora, tengo duda sobre el ejercicio 5 del taller de ecuaciones', de: 'otro', hora: '10:30 AM' },
                { id: 3, texto: 'No entiendo cómo factorizar la expresión', de: 'otro', hora: '10:30 AM' },
            ],
        },
        {
            id: 2, nombre: 'Laura Rodríguez', curso: '8° A', avatar: 'LR', ultimoMensaje: 'Ya envié el taller corregido', hora: '9:15 AM', sinLeer: 0, online: true,
            mensajes: [
                { id: 1, texto: 'Profesora, noté que tenía un error en el ejercicio 3', de: 'otro', hora: '9:00 AM' },
                { id: 2, texto: 'Revísalo con calma y vuélvelo a enviar', de: 'yo', hora: '9:10 AM' },
                { id: 3, texto: 'Ya envié el taller corregido', de: 'otro', hora: '9:15 AM' },
                { id: 4, texto: 'Perfecto, lo revisaré hoy', de: 'yo', hora: '9:20 AM' },
            ],
        },
        {
            id: 3, nombre: 'Carlos Jiménez', curso: '8° A', avatar: 'CJ', ultimoMensaje: '¿Cuándo es la recuperación del examen?', hora: 'Ayer', sinLeer: 1, online: false,
            mensajes: [
                { id: 1, texto: '¿Cuándo es la recuperación del examen?', de: 'otro', hora: 'Ayer 4:30 PM' },
            ],
        },
        {
            id: 4, nombre: 'Sofía Herrera', curso: '6° A', avatar: 'SH', ultimoMensaje: 'Gracias profe 😊', hora: 'Ayer', sinLeer: 0, online: false,
            mensajes: [
                { id: 1, texto: 'Profe, ¿me podría explicar lo de fracciones?', de: 'otro', hora: 'Ayer 3:00 PM' },
                { id: 2, texto: 'Claro, mañana en clase te explico con más detalle', de: 'yo', hora: 'Ayer 3:15 PM' },
                { id: 3, texto: 'Gracias profe 😊', de: 'otro', hora: 'Ayer 3:16 PM' },
            ],
        },
        {
            id: 5, nombre: 'Miguel Ángel Torres', curso: '6° A', avatar: 'MT', ultimoMensaje: 'Sí profesora, ya lo tengo listo', hora: 'Lun', sinLeer: 0, online: false,
            mensajes: [
                { id: 1, texto: 'Miguel, recuerda traer los materiales mañana', de: 'yo', hora: 'Lun 2:00 PM' },
                { id: 2, texto: 'Sí profesora, ya lo tengo listo', de: 'otro', hora: 'Lun 2:10 PM' },
            ],
        },
        {
            id: 6, nombre: 'Valentina Pérez', curso: '7° A', avatar: 'VP', ultimoMensaje: '📎 documento_probabilidad.pdf', hora: 'Lun', sinLeer: 0, online: true,
            mensajes: [
                { id: 1, texto: 'Profe, le envío material de apoyo que encontré sobre probabilidad', de: 'otro', hora: 'Lun 11:00 AM' },
                { id: 2, texto: '📎 documento_probabilidad.pdf', de: 'otro', hora: 'Lun 11:00 AM' },
                { id: 3, texto: '¡Excelente Valentina! Me gusta tu iniciativa 👏', de: 'yo', hora: 'Lun 11:30 AM' },
            ],
        },
    ];

    const cursos = [...new Set(contactos.map(c => c.curso))];

    const filtrados = useMemo(() => {
        let result = contactos;
        if (filtroCurso) result = result.filter(c => c.curso === filtroCurso);
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            result = result.filter(c => c.nombre.toLowerCase().includes(s));
        }
        return result;
    }, [searchTerm, filtroCurso]);

    const totalSinLeer = useMemo(() => contactos.reduce((a, c) => a + c.sinLeer, 0), []);

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [contactoActivo]);

    const enviarMensaje = () => {
        if (!nuevoMensaje.trim() || !contactoActivo) return;
        alert(`Mensaje enviado a ${contactoActivo.nombre}: "${nuevoMensaje}"`);
        setNuevoMensaje('');
    };

    return (
        <SidebarLayout
            menuItems={profesorMenuItems}
            userInfo={{ name: nombre, role: 'Profesor' }}
        >
            <Head title="Mensajes" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
                        Mensajes
                    </h1>
                    <p className="text-gray-500 mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                        Comunícate con tus estudiantes • {totalSinLeer > 0 ? `${totalSinLeer} sin leer` : 'Al día'}
                    </p>
                </div>
                <button
                    onClick={() => setShowNewChat(true)}
                    className="px-5 py-2.5 bg-[#293577] text-white rounded-xl text-sm font-semibold hover:bg-[#181b49] transition-colors flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                    Nuevo mensaje
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
                <div className="flex h-full">
                    {/* Lista de contactos */}
                    <div className={`${contactoActivo ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-80 border-r border-gray-100`}>
                        <div className="p-3 border-b border-gray-100 space-y-2">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800"><SearchIcon className="w-4 h-4" /></span>
                                <input type="text" placeholder="Buscar estudiante..." value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]/30" />
                            </div>
                            <select value={filtroCurso} onChange={(e) => setFiltroCurso(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#293577]/30">
                                <option value="">Todos los cursos</option>
                                {cursos.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {filtrados.map(c => (
                                <button key={c.id} onClick={() => setContactoActivo(c)}
                                    className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-50 text-left ${contactoActivo?.id === c.id ? 'bg-blue-50/50' : ''}`}>
                                    <div className="relative flex-shrink-0">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#293577] to-[#181b49] flex items-center justify-center text-white text-xs font-bold">
                                            {c.avatar}
                                        </div>
                                        {c.online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{c.nombre}</p>
                                            <span className="text-[10px] text-gray-400">{c.hora}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-gray-400 truncate pr-2">{c.ultimoMensaje}</p>
                                            {c.sinLeer > 0 && (
                                                <span className="flex-shrink-0 w-5 h-5 bg-[#293577] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                    {c.sinLeer}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] text-blue-500">{c.curso}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chat area */}
                    <div className={`${!contactoActivo ? 'hidden sm:flex' : 'flex'} flex-col flex-1`}>
                        {contactoActivo ? (
                            <>
                                {/* Header del chat */}
                                <div className="p-3 border-b border-gray-100 flex items-center gap-3">
                                    <button onClick={() => setContactoActivo(null)} className="sm:hidden text-gray-500 hover:text-gray-700">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                                    </button>
                                    <div className="relative">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#293577] to-[#181b49] flex items-center justify-center text-white text-xs font-bold">
                                            {contactoActivo.avatar}
                                        </div>
                                        {contactoActivo.online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-gray-800">{contactoActivo.nombre}</p>
                                        <p className="text-[11px] text-gray-400">{contactoActivo.curso} • {contactoActivo.online ? 'En línea' : 'Desconectado'}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Asignar actividad">
                                            <span className="text-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg></span>
                                        </button>
                                        <button className="p-2 hover:bg-gray-100 rounded-lg transition" title="Ver perfil">
                                            <span className="text-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg></span>
                                        </button>
                                    </div>
                                </div>

                                {/* Mensajes */}
                                <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                                    <div className="text-center">
                                        <span className="text-[10px] bg-white text-gray-400 px-3 py-1 rounded-full border border-gray-100">
                                            Los mensajes son supervisados por la institución
                                        </span>
                                    </div>
                                    {contactoActivo.mensajes.map(m => (
                                        <div key={m.id} className={`flex ${m.de === 'yo' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] px-3.5 py-2 rounded-2xl ${
                                                m.de === 'yo'
                                                    ? 'bg-[#293577] text-white rounded-br-md'
                                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
                                            }`}>
                                                <p className="text-sm">{m.texto}</p>
                                                <p className={`text-[10px] mt-1 ${m.de === 'yo' ? 'text-white/60' : 'text-gray-400'}`}>{m.hora}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Input */}
                                <div className="p-3 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 hover:bg-gray-100 rounded-lg">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                            </svg>
                                        </button>
                                        <input
                                            type="text"
                                            placeholder="Escribe un mensaje..."
                                            value={nuevoMensaje}
                                            onChange={(e) => setNuevoMensaje(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && enviarMensaje()}
                                            className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-[#293577]/30 focus:border-[#293577]"
                                        />
                                        <button onClick={enviarMensaje}
                                            className="p-2.5 bg-[#293577] text-white rounded-full hover:bg-[#181b49] transition disabled:opacity-50"
                                            disabled={!nuevoMensaje.trim()}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                    <span className="text-4xl"><svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg></span>
                                </div>
                                <p className="font-semibold text-gray-600">Selecciona una conversación</p>
                                <p className="text-sm mt-1">Elige un estudiante para comenzar a chatear</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal nuevo chat */}
            {showNewChat && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="font-bold text-gray-900">Nuevo mensaje</h3>
                            <button onClick={() => setShowNewChat(false)} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-4 space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Destinatario</label>
                                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#293577]">
                                    <option value="">Seleccionar estudiante...</option>
                                    <option value="grupo">Mensaje grupal - 8° A</option>
                                    <option value="grupo6">Mensaje grupal - 6° A</option>
                                    {contactos.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.curso})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                                <textarea rows={3} placeholder="Escribe tu mensaje..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-[#293577]"></textarea>
                            </div>
                            <button onClick={() => { alert('Mensaje enviado'); setShowNewChat(false); }}
                                className="w-full py-2.5 bg-[#293577] text-white rounded-lg text-sm font-semibold hover:bg-[#181b49] transition">
                                Enviar mensaje
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </SidebarLayout>
    );
}
