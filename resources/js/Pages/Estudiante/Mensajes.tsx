import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { estudianteMenuItems } from '@/Config/estudianteMenu';

const SearchIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
);

interface Mensaje {
    id: number;
    texto: string;
    hora: string;
    esPropio: boolean;
    tipo?: 'mensaje' | 'archivo' | 'actividad';
    archivo?: string;
    actividad?: { titulo: string; materia: string; fecha: string };
}

interface Contacto {
    id: number;
    nombre: string;
    rol: string;
    materia?: string;
    avatar: string;
    ultimoMensaje: string;
    hora: string;
    sinLeer: number;
    online: boolean;
    mensajes: Mensaje[];
}

export default function Mensajes() {
    const nombre = 'Andrés Felipe Muñoz';
    const [searchTerm, setSearchTerm] = useState('');
    const [contactoActivo, setContactoActivo] = useState<number | null>(1);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [showContactos, setShowContactos] = useState(true);
    const [filterRol, setFilterRol] = useState<'todos' | 'profesor' | 'admin'>('todos');

    const contactos: Contacto[] = [
        {
            id: 1, nombre: 'Prof. María García', rol: 'profesor', materia: 'Matemáticas', avatar: 'MG',
            ultimoMensaje: 'Recuerda estudiar para el quiz del lunes.', hora: 'Hace 2h', sinLeer: 2, online: true,
            mensajes: [
                { id: 1, texto: 'Buenos días Andrés. ¿Cómo vas con el taller de ecuaciones?', hora: '9:30 AM', esPropio: false },
                { id: 2, texto: 'Buenos días profe! Ya llevo 15 de los 20 ejercicios.', hora: '9:45 AM', esPropio: true },
                { id: 3, texto: 'Muy bien! Recuerda mostrar el procedimiento completo en cada uno.', hora: '9:47 AM', esPropio: false },
                { id: 4, texto: 'Sí profe, he tenido dudas con los ejercicios 16 y 17 que son de ecuaciones simultáneas.', hora: '10:00 AM', esPropio: true },
                { id: 5, texto: 'Te recomiendo revisar el video que compartí en clase sobre el método de sustitución. Si sigues con duda, podemos revisar juntos en la próxima clase.', hora: '10:05 AM', esPropio: false },
                { id: 6, texto: 'Recuerda estudiar para el quiz de factorización del lunes. Repasa los casos especiales.', hora: '2:30 PM', esPropio: false },
                { id: 7, texto: 'Listo profe, muchas gracias!', hora: '2:35 PM', esPropio: true },
            ]
        },
        {
            id: 2, nombre: 'Prof. Juan Pérez', rol: 'profesor', materia: 'Español', avatar: 'JP',
            ultimoMensaje: 'Tu ensayo tiene buena estructura, revisa la conclusión.', hora: 'Hace 5h', sinLeer: 1, online: false,
            mensajes: [
                { id: 1, texto: 'Andrés, revisé el borrador de tu ensayo sobre Cien Años de Soledad.', hora: '11:00 AM', esPropio: false },
                { id: 2, texto: '¿Qué le pareció profe?', hora: '11:15 AM', esPropio: true },
                { id: 3, texto: 'Tu ensayo tiene buena estructura y argumentación. Solo necesitas mejorar la conclusión: debe sintetizar tus argumentos principales y no introducir ideas nuevas.', hora: '11:20 AM', esPropio: false },
                { id: 4, texto: 'Te comparto una guía para conclusiones:', hora: '11:21 AM', esPropio: false, tipo: 'archivo', archivo: 'guia_conclusiones.pdf' },
                { id: 5, texto: 'Muchas gracias profe! Lo corrijo y lo entrego antes del viernes.', hora: '11:30 AM', esPropio: true },
            ]
        },
        {
            id: 3, nombre: 'Prof. Ana Martínez', rol: 'profesor', materia: 'Inglés', avatar: 'AM',
            ultimoMensaje: 'Great progress on your speaking skills!', hora: 'Ayer', sinLeer: 0, online: true,
            mensajes: [
                { id: 1, texto: 'Hi Andrés! I wanted to congratulate you on your speaking test. You did excellent!', hora: '3:00 PM', esPropio: false },
                { id: 2, texto: 'Thank you teacher! I practiced a lot for it 😊', hora: '3:15 PM', esPropio: true },
                { id: 3, texto: 'Great progress on your speaking skills! Keep practicing with the podcasts I recommended.', hora: '3:18 PM', esPropio: false },
            ]
        },
        {
            id: 4, nombre: 'Prof. Pedro Sánchez', rol: 'profesor', materia: 'Ciencias', avatar: 'PS',
            ultimoMensaje: 'No olvides traer bata para el laboratorio del jueves.', hora: 'Ayer', sinLeer: 0, online: false,
            mensajes: [
                { id: 1, texto: 'Hola Andrés, recuerda que el jueves tenemos práctica de laboratorio.', hora: '4:00 PM', esPropio: false },
                { id: 2, texto: 'No olvides traer bata para el laboratorio del jueves.', hora: '4:01 PM', esPropio: false },
                { id: 3, texto: 'Sí profe, todo listo! ¿Necesitamos llevar algún material adicional?', hora: '4:30 PM', esPropio: true },
                { id: 4, texto: 'Solo la bata y un cuaderno para apuntes. Los materiales del experimento los proporciona el colegio.', hora: '4:45 PM', esPropio: false },
            ]
        },
        {
            id: 5, nombre: 'Prof. Roberto Gómez', rol: 'profesor', materia: 'Química', avatar: 'RG',
            ultimoMensaje: 'Te asigné una actividad de refuerzo.', hora: '22 Feb', sinLeer: 0, online: false,
            mensajes: [
                { id: 1, texto: 'Andrés, vi los resultados del taller de balanceo. Necesitas refuerzo en ese tema.', hora: '10:00 AM', esPropio: false },
                { id: 2, texto: 'Sí profe, se me dificultó bastante 😅', hora: '10:20 AM', esPropio: true },
                { id: 3, texto: 'Te asigné una actividad de refuerzo. Son ejercicios más sencillos para ir avanzando gradualmente.', hora: '10:25 AM', esPropio: false, tipo: 'actividad', actividad: { titulo: 'Refuerzo: Balanceo básico', materia: 'Química', fecha: '28 Feb 2026' } },
                { id: 4, texto: 'Gracias profe! Lo voy a revisar esta semana.', hora: '10:30 AM', esPropio: true },
            ]
        },
        {
            id: 6, nombre: 'Coord. Académica', rol: 'admin', avatar: 'CA',
            ultimoMensaje: 'Reunión de padres programada para el 28 de febrero.', hora: '20 Feb', sinLeer: 0, online: false,
            mensajes: [
                { id: 1, texto: 'Estimado estudiante, le informamos que la reunión de padres ha sido programada para el 28 de febrero a las 4:00 PM.', hora: '8:00 AM', esPropio: false },
                { id: 2, texto: 'Recuerde entregar la circular firmada por su acudiente antes del 27 de febrero.', hora: '8:01 AM', esPropio: false },
                { id: 3, texto: 'Sí señora, ya se la entregué a mi papá. La traigo mañana firmada.', hora: '2:00 PM', esPropio: true },
            ]
        },
        {
            id: 7, nombre: 'Prof. Carlos López', rol: 'profesor', materia: 'Historia', avatar: 'CL',
            ultimoMensaje: 'Pendiente la entrega de la línea de tiempo.', hora: '19 Feb', sinLeer: 0, online: false,
            mensajes: [
                { id: 1, texto: 'Andrés, noto que no has entregado la línea de tiempo que se venció hace 4 días.', hora: '9:00 AM', esPropio: false },
                { id: 2, texto: 'Profe, disculpe. Tuve un problema con los materiales. ¿Puedo entregarla mañana con penalización?', hora: '12:00 PM', esPropio: true },
                { id: 3, texto: 'Pendiente la entrega de la línea de tiempo. Puedes entregarla hasta mañana con descuento del 20%.', hora: '12:30 PM', esPropio: false },
            ]
        },
    ];

    const contactoSeleccionado = contactos.find(c => c.id === contactoActivo);

    const contactosFiltrados = useMemo(() => {
        let result = contactos;
        if (filterRol !== 'todos') {
            result = result.filter(c => c.rol === filterRol);
        }
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            result = result.filter(c => c.nombre.toLowerCase().includes(s) || c.materia?.toLowerCase().includes(s));
        }
        return result;
    }, [filterRol, searchTerm]);

    const enviarMensaje = () => {
        if (!nuevoMensaje.trim()) return;
        // En producción, esto enviaría al backend
        alert(`Mensaje enviado: "${nuevoMensaje}"`);
        setNuevoMensaje('');
    };

    return (
        <SidebarLayout
            menuItems={estudianteMenuItems}
            userInfo={{ name: nombre, role: 'Estudiante' }}
        >
            <Head title="Mensajes" />

            {/* Header */}
            <div className="mb-4">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Mensajes
                </h1>
                <p className="text-gray-500 mt-1" style={{ fontFamily: "'Roboto Condensed', sans-serif" }}>Comunicación con profesores y coordinación</p>
            </div>

            {/* Chat container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}>
                <div className="flex h-full">
                    {/* Lista de contactos */}
                    <div className={`w-full lg:w-80 border-r border-gray-100 flex flex-col ${contactoActivo && !showContactos ? 'hidden lg:flex' : 'flex'}`}>
                        {/* Search */}
                        <div className="p-3 border-b border-gray-100 space-y-2">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-800">
                                    <SearchIcon className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Buscar contacto..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#293577] focus:border-transparent"
                                />
                            </div>
                            <div className="flex gap-1">
                                {(['todos', 'profesor', 'admin'] as const).map(rol => (
                                    <button
                                        key={rol}
                                        onClick={() => setFilterRol(rol)}
                                        className={`flex-1 text-xs px-2 py-1.5 rounded-lg font-medium transition-colors ${
                                            filterRol === rol
                                                ? 'bg-[#293577] text-white'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                        }`}
                                    >
                                        {rol === 'todos' ? 'Todos' : rol === 'profesor' ? 'Profesores' : 'Admin'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Contact list */}
                        <div className="flex-1 overflow-y-auto">
                            {contactosFiltrados.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => { setContactoActivo(c.id); setShowContactos(false); }}
                                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                                        contactoActivo === c.id ? 'bg-blue-50/50 border-l-4 border-l-[#293577]' : ''
                                    }`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center text-xl">
                                            {c.avatar}
                                        </div>
                                        {c.online && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-900 truncate">{c.nombre}</span>
                                            <span className="text-[10px] text-gray-400 flex-shrink-0">{c.hora}</span>
                                        </div>
                                        {c.materia && <p className="text-[10px] text-gray-400">{c.materia}</p>}
                                        <p className="text-xs text-gray-500 truncate">{c.ultimoMensaje}</p>
                                    </div>
                                    {c.sinLeer > 0 && (
                                        <span className="flex-shrink-0 w-5 h-5 bg-[#293577] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                                            {c.sinLeer}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Área de chat */}
                    {contactoSeleccionado ? (
                        <div className={`flex-1 flex flex-col ${contactoActivo && !showContactos ? 'flex' : 'hidden lg:flex'}`}>
                            {/* Chat header */}
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-gray-50/50">
                                <button
                                    onClick={() => setShowContactos(true)}
                                    className="lg:hidden p-1 rounded-lg hover:bg-gray-200"
                                >
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                </button>
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                                        {contactoSeleccionado.avatar}
                                    </div>
                                    {contactoSeleccionado.online && (
                                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">{contactoSeleccionado.nombre}</h3>
                                    <p className="text-[11px] text-gray-400">
                                        {contactoSeleccionado.materia && `${contactoSeleccionado.materia} • `}
                                        {contactoSeleccionado.online ? 'En línea' : 'Desconectado'}
                                    </p>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/30">
                                {contactoSeleccionado.mensajes.map(msg => (
                                    <div key={msg.id} className={`flex ${msg.esPropio ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                                            msg.esPropio
                                                ? 'bg-[#293577] text-white rounded-br-md'
                                                : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md'
                                        }`}>
                                            <p className="text-sm leading-relaxed">{msg.texto}</p>
                                            {msg.tipo === 'archivo' && msg.archivo && (
                                                <div className={`mt-2 p-2 rounded-lg flex items-center gap-2 ${msg.esPropio ? 'bg-white/10' : 'bg-gray-50 border border-gray-100'}`}>
                                                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                                    </svg>
                                                    <span className="text-xs font-medium truncate">{msg.archivo}</span>
                                                </div>
                                            )}
                                            {msg.tipo === 'actividad' && msg.actividad && (
                                                <div className={`mt-2 p-2 rounded-lg ${msg.esPropio ? 'bg-white/10' : 'bg-amber-50 border border-amber-100'}`}>
                                                    <p className="text-xs font-bold">{msg.actividad.titulo}</p>
                                                    <p className="text-[10px] opacity-70">{msg.actividad.materia} • Entrega: {msg.actividad.fecha}</p>
                                                </div>
                                            )}
                                            <p className={`text-[10px] mt-1 ${msg.esPropio ? 'text-white/50' : 'text-gray-400'}`}>{msg.hora}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input */}
                            <div className="p-3 border-t border-gray-100 bg-white">
                                <div className="flex items-center gap-2">
                                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                        </svg>
                                    </button>
                                    <input
                                        type="text"
                                        placeholder="Escribe un mensaje..."
                                        value={nuevoMensaje}
                                        onChange={(e) => setNuevoMensaje(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && enviarMensaje()}
                                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#293577] focus:border-transparent"
                                    />
                                    <button
                                        onClick={enviarMensaje}
                                        disabled={!nuevoMensaje.trim()}
                                        className="p-2.5 bg-[#293577] text-white rounded-xl hover:bg-[#181b49] disabled:opacity-40 transition-all"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 hidden lg:flex items-center justify-center bg-gray-50/30">
                            <div className="text-center">
                                <p className="text-5xl mb-3"><svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg></p>
                                <p className="text-gray-400 text-sm">Selecciona un contacto para comenzar</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </SidebarLayout>
    );
}
