import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { padreMenuItems } from '@/Config/padreMenu';

interface Contacto {
    id: number;
    nombre: string;
    rol: string;
    materia?: string;
    avatar: string;
    en_linea: boolean;
    ultimo_mensaje?: string;
    ultimo_mensaje_fecha?: string;
    no_leidos: number;
}

interface Mensaje {
    id: number;
    de: 'yo' | 'otro';
    texto: string;
    fecha: string;
    hora: string;
    leido: boolean;
}

export default function Mensajes() {
    const [contactoActivo, setContactoActivo] = useState<Contacto | null>(null);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRol, setFilterRol] = useState<'todos' | 'docente' | 'administrativo'>('todos');
    const [showContactos, setShowContactos] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const contactos: Contacto[] = [
        { id: 1, nombre: 'Prof. María González', rol: 'Docente', materia: 'Matemáticas', avatar: 'MG', en_linea: true, ultimo_mensaje: 'Buen día, le informo que Carlos ha mejorado...', ultimo_mensaje_fecha: '10:30 AM', no_leidos: 2 },
        { id: 2, nombre: 'Prof. Juan Pérez', rol: 'Docente', materia: 'Español', avatar: 'JP', en_linea: false, ultimo_mensaje: 'Recordar entregar el ensayo del viernes', ultimo_mensaje_fecha: 'Ayer', no_leidos: 0 },
        { id: 3, nombre: 'Prof. Ana Rodríguez', rol: 'Docente', materia: 'Ciencias', avatar: 'AR', en_linea: true, ultimo_mensaje: 'La exposición fue reprogramada para el miércoles', ultimo_mensaje_fecha: 'Ayer', no_leidos: 1 },
        { id: 4, nombre: 'Coord. Laura Martínez', rol: 'Administrativo', avatar: 'LM', en_linea: false, ultimo_mensaje: 'El certificado de estudios está listo', ultimo_mensaje_fecha: 'Lun', no_leidos: 0 },
        { id: 5, nombre: 'Rector Pedro Silva', rol: 'Administrativo', avatar: 'PS', en_linea: false, ultimo_mensaje: '', ultimo_mensaje_fecha: '', no_leidos: 0 },
        { id: 6, nombre: 'Secretaría Académica', rol: 'Administrativo', avatar: 'SA', en_linea: true, ultimo_mensaje: 'Recuerde que la fecha límite de matrícula...', ultimo_mensaje_fecha: 'Mar', no_leidos: 0 },
        { id: 7, nombre: 'Prof. Diego Castro', rol: 'Docente', materia: 'Ed. Física', avatar: 'DC', en_linea: false, ultimo_mensaje: 'Carlos debe traer el uniforme de deportes', ultimo_mensaje_fecha: 'Lun', no_leidos: 0 },
    ];

    const mensajesConversacion: Record<number, Mensaje[]> = {
        1: [
            { id: 1, de: 'otro', texto: 'Buen día, señora López. Le escribo para informarle sobre el rendimiento de Carlos en Matemáticas.', fecha: '2026-02-10', hora: '10:15 AM', leido: true },
            { id: 2, de: 'otro', texto: 'Ha mostrado una mejora significativa en las últimas evaluaciones. Su nota subió de 3.2 a 4.1.', fecha: '2026-02-10', hora: '10:16 AM', leido: true },
            { id: 3, de: 'yo', texto: 'Buenos días profesora, muchas gracias por la información. Nos alegra mucho saber eso.', fecha: '2026-02-10', hora: '10:20 AM', leido: true },
            { id: 4, de: 'yo', texto: '¿Hay algo en lo que podamos apoyar desde casa para que siga mejorando?', fecha: '2026-02-10', hora: '10:20 AM', leido: true },
            { id: 5, de: 'otro', texto: 'Le recomiendo que practique ejercicios de fracciones y geometría. Puedo enviarle una guía de refuerzo.', fecha: '2026-02-10', hora: '10:25 AM', leido: true },
            { id: 6, de: 'yo', texto: 'Sería excelente, muchas gracias profesora.', fecha: '2026-02-10', hora: '10:28 AM', leido: true },
            { id: 7, de: 'otro', texto: 'Buen día, le informo que Carlos ha mejorado en el último quiz. ¡Obtuvo 4.5! Sigan apoyándolo así.', fecha: '2026-02-11', hora: '10:30 AM', leido: false },
            { id: 8, de: 'otro', texto: 'Adjunto la guía de refuerzo que le mencioné. Guía_Matemáticas_7.pdf', fecha: '2026-02-11', hora: '10:30 AM', leido: false },
        ],
        3: [
            { id: 1, de: 'otro', texto: 'Buenas tardes. Le informo que la exposición de ciencias fue reprogramada para el miércoles.', fecha: '2026-02-10', hora: '3:00 PM', leido: true },
            { id: 2, de: 'otro', texto: 'Carlos debe traer la maqueta terminada. Puede usar materiales reciclables.', fecha: '2026-02-10', hora: '3:01 PM', leido: false },
        ],
        4: [
            { id: 1, de: 'yo', texto: 'Buenas tardes, necesito solicitar un certificado de estudios para Carlos.', fecha: '2026-02-08', hora: '2:00 PM', leido: true },
            { id: 2, de: 'otro', texto: 'Buen día. Claro, el certificado estará listo en 2 días hábiles.', fecha: '2026-02-08', hora: '2:30 PM', leido: true },
            { id: 3, de: 'otro', texto: 'El certificado de estudios está listo. Puede recogerlo en secretaría o descargarlo desde la plataforma.', fecha: '2026-02-10', hora: '9:00 AM', leido: true },
        ],
    };

    const filteredContactos = contactos.filter(c => {
        const matchesSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (c.materia && c.materia.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesRol = filterRol === 'todos' || c.rol.toLowerCase() === filterRol;
        return matchesSearch && matchesRol;
    });

    const mensajesActivos = contactoActivo ? (mensajesConversacion[contactoActivo.id] || []) : [];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [mensajesActivos, contactoActivo]);

    const handleEnviar = () => {
        if (!nuevoMensaje.trim()) return;
        alert(`Mensaje enviado: "${nuevoMensaje}" (Mockup - sin backend)`);
        setNuevoMensaje('');
    };

    const totalNoLeidos = contactos.reduce((sum, c) => sum + c.no_leidos, 0);

    return (
        <SidebarLayout menuItems={padreMenuItems} title="Mensajes">
            <Head title="Mensajes" />

            <div className="space-y-4" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800" style={{ fontFamily: "'Inter', sans-serif" }}>Mensajes</h1>
                        <p className="text-gray-600">Comunicación directa con docentes y administrativos</p>
                    </div>
                    {totalNoLeidos > 0 && (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                            {totalNoLeidos} sin leer
                        </span>
                    )}
                </div>

                {/* Chat container */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
                    <div className="flex h-full">
                        {/* Lista de contactos */}
                        <div className={`w-full lg:w-80 border-r flex flex-col ${contactoActivo && !showContactos ? 'hidden lg:flex' : 'flex'}`}>
                            {/* Search */}
                            <div className="p-3 border-b space-y-2">
                                <div className="relative">
                                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-800" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                                    <input
                                        type="text"
                                        placeholder="Buscar contacto..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-transparent"
                                    />
                                </div>
                                <div className="flex gap-1">
                                    {(['todos', 'docente', 'administrativo'] as const).map(rol => (
                                        <button
                                            key={rol}
                                            onClick={() => setFilterRol(rol)}
                                            className={`flex-1 text-xs px-2 py-1 rounded-lg font-medium transition-colors ${
                                                filterRol === rol
                                                    ? 'bg-[#293577] text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {rol.charAt(0).toUpperCase() + rol.slice(1)}s
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Contactos */}
                            <div className="flex-1 overflow-y-auto">
                                {filteredContactos.map(c => (
                                    <button
                                        key={c.id}
                                        onClick={() => { setContactoActivo(c); setShowContactos(false); }}
                                        className={`w-full p-3 flex items-start gap-3 hover:bg-gray-50 text-left border-b transition-colors ${
                                            contactoActivo?.id === c.id ? 'bg-blue-50' : ''
                                        }`}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <span className="text-2xl">{c.avatar}</span>
                                            {c.en_linea && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <h3 className={`text-sm truncate ${c.no_leidos > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                    {c.nombre}
                                                </h3>
                                                <span className="text-xs text-gray-400 flex-shrink-0 ml-1">{c.ultimo_mensaje_fecha}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">{c.rol}{c.materia ? ` · ${c.materia}` : ''}</p>
                                            {c.ultimo_mensaje && (
                                                <p className={`text-xs mt-1 truncate ${c.no_leidos > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
                                                    {c.ultimo_mensaje}
                                                </p>
                                            )}
                                        </div>
                                        {c.no_leidos > 0 && (
                                            <span className="bg-[#293577] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                                {c.no_leidos}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Área de chat */}
                        <div className={`flex-1 flex flex-col ${!contactoActivo || showContactos ? 'hidden lg:flex' : 'flex'}`}>
                            {contactoActivo ? (
                                <>
                                    {/* Chat header */}
                                    <div className="p-3 border-b flex items-center gap-3 bg-gray-50">
                                        <button
                                            onClick={() => setShowContactos(true)}
                                            className="lg:hidden text-gray-500 hover:text-gray-700"
                                        >
                                            ← Volver
                                        </button>
                                        <div className="relative">
                                            <span className="text-2xl">{contactoActivo.avatar}</span>
                                            {contactoActivo.en_linea && (
                                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-800">{contactoActivo.nombre}</h3>
                                            <p className="text-xs text-gray-500">
                                                {contactoActivo.rol}{contactoActivo.materia ? ` · ${contactoActivo.materia}` : ''}
                                                {contactoActivo.en_linea && <span className="text-green-600 ml-2">● En línea</span>}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Mensajes */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                                        {mensajesActivos.length === 0 && (
                                            <div className="text-center text-gray-400 py-10">
                                                <svg className="w-8 h-8 text-gray-300 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                                                <p>No hay mensajes aún</p>
                                                <p className="text-sm">Inicie la conversación enviando un mensaje</p>
                                            </div>
                                        )}
                                        {mensajesActivos.map((m, i) => {
                                            const showDate = i === 0 || mensajesActivos[i - 1].fecha !== m.fecha;
                                            return (
                                                <div key={m.id}>
                                                    {showDate && (
                                                        <div className="text-center my-3">
                                                            <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                                                {new Date(m.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className={`flex ${m.de === 'yo' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                                                            m.de === 'yo'
                                                                ? 'bg-[#293577] text-white rounded-br-md'
                                                                : 'bg-white text-gray-800 shadow-sm rounded-bl-md'
                                                        }`}>
                                                            <p className="text-sm whitespace-pre-wrap">{m.texto}</p>
                                                            <p className={`text-xs mt-1 ${
                                                                m.de === 'yo' ? 'text-blue-200' : 'text-gray-400'
                                                            }`}>
                                                                {m.hora} {m.de === 'yo' && (m.leido ? '✓✓' : '✓')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input de mensaje */}
                                    <div className="p-3 border-t bg-white">
                                        <div className="flex gap-2">
                                            <button className="text-gray-400 hover:text-gray-600 px-2" title="Adjuntar archivo">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>
                                            </button>
                                            <input
                                                type="text"
                                                placeholder="Escriba su mensaje..."
                                                value={nuevoMensaje}
                                                onChange={(e) => setNuevoMensaje(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && handleEnviar()}
                                                className="flex-1 px-4 py-2 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-[#293577] focus:border-transparent"
                                            />
                                            <button
                                                onClick={handleEnviar}
                                                disabled={!nuevoMensaje.trim()}
                                                className="bg-[#293577] text-white px-4 py-2 rounded-full hover:bg-[#181b49] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                            >
                                                Enviar ➤
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 text-center">
                                            Los mensajes son revisados por el colegio · Comunicación oficial plataforma a plataforma
                                        </p>
                                    </div>
                                </>
                            ) : (
                                /* Estado vacío */
                                <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                    <svg className="w-14 h-14 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                                    <h3 className="text-lg font-medium text-gray-600">Mensajes</h3>
                                    <p className="text-sm mt-1">Seleccione un contacto para iniciar la conversación</p>
                                    <p className="text-xs mt-4 text-gray-400 max-w-sm text-center">
                                        Comuníquese directamente con los docentes y administrativos del colegio de forma segura a través de la plataforma
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
