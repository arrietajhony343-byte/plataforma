import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { profesorMenuItems } from '@/Config/profesorMenu';

interface HorarioBack {
    id: number;
    materia: string;
    curso: string;
    dia: string;
    hora: string;
    horaFin: string;
    salon: string;
}

interface ActividadBack {
    id: number;
    titulo: string;
    curso: string;
    materia: string;
    fecha: string;
    tipo: string;
}

interface Evento {
    id: number;
    titulo: string;
    fecha: string;
    hora: string;
    tipo: 'clase' | 'reunion' | 'entrega' | 'evaluacion';
    curso?: string;
}

interface Props {
    profesor: { nombre: string };
    horario: HorarioBack[];
    actividades: ActividadBack[];
}

export default function Calendario({ profesor, horario, actividades }: Props) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Generar eventos a partir de horario semanal + actividades
    const eventos: Evento[] = useMemo(() => {
        const evts: Evento[] = [];
        const daysMap: Record<string, number> = { lunes: 1, martes: 2, miercoles: 3, jueves: 4, viernes: 5, sabado: 6, domingo: 0 };

        // Generar clases semanales para el mes actual
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const daysInM = new Date(year, month + 1, 0).getDate();

        horario.forEach(h => {
            const dayOfWeek = daysMap[h.dia.toLowerCase()] ?? -1;
            if (dayOfWeek < 0) return;
            for (let d = 1; d <= daysInM; d++) {
                const date = new Date(year, month, d);
                if (date.getDay() === dayOfWeek) {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    evts.push({
                        id: h.id * 100 + d,
                        titulo: `${h.materia} - ${h.curso}`,
                        fecha: dateStr,
                        hora: h.hora,
                        tipo: 'clase',
                        curso: h.curso,
                    });
                }
            }
        });

        // Agregar actividades como eventos
        actividades.forEach(a => {
            const tipoMap: Record<string, 'evaluacion' | 'entrega'> = { examen: 'evaluacion', quiz: 'evaluacion', tarea: 'entrega', proyecto: 'entrega', exposicion: 'entrega' };
            evts.push({
                id: a.id + 10000,
                titulo: a.titulo,
                fecha: a.fecha,
                hora: '00:00',
                tipo: tipoMap[a.tipo] || 'entrega',
                curso: a.curso ?? undefined,
            });
        });

        return evts;
    }, [horario, actividades, currentMonth]);

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const getEventsForDate = (day: number) => {
        const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return eventos.filter(e => e.fecha === dateStr);
    };

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'clase': return 'bg-blue-500';
            case 'reunion': return 'bg-purple-500';
            case 'entrega': return 'bg-orange-500';
            case 'evaluacion': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const getTipoBadge = (tipo: string) => {
        switch (tipo) {
            case 'clase': return 'bg-blue-100 text-blue-800';
            case 'reunion': return 'bg-purple-100 text-purple-800';
            case 'entrega': return 'bg-orange-100 text-orange-800';
            case 'evaluacion': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const today = new Date();
    const isToday = (day: number) => {
        return today.getDate() === day && 
               today.getMonth() === currentMonth.getMonth() && 
               today.getFullYear() === currentMonth.getFullYear();
    };

    return (
        <SidebarLayout menuItems={profesorMenuItems} userInfo={{ name: profesor.nombre, role: 'Profesor' }}>
            <Head title="Calendario" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Mi Calendario</h1>
                        <p className="text-gray-600">Gestiona tus clases, reuniones y eventos</p>
                    </div>
                    <button className="flex items-center gap-2 bg-[#293577] text-white px-4 py-2 rounded-lg hover:bg-[#181b49]">
                        <span>+</span> Nuevo Evento
                    </button>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Calendario */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        {/* Navegación del mes */}
                        <div className="flex justify-between items-center mb-4 sm:mb-6">
                            <button
                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                ◀
                            </button>
                            <h2 className="text-xl font-bold text-gray-800">
                                {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </h2>
                            <button
                                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                
                            </button>
                        </div>

                        {/* Días de la semana */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {dayNames.map(day => (
                                <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 py-2">
                                    <span className="sm:hidden">{day.charAt(0)}</span>
                                    <span className="hidden sm:inline">{day}</span>
                                </div>
                            ))}
                        </div>

                        {/* Días del mes */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Espacios vacíos antes del primer día */}
                            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                                <div key={`empty-${i}`} className="h-16 sm:h-24"></div>
                            ))}
                            
                            {/* Días del mes */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dayEvents = getEventsForDate(day);
                                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                
                                return (
                                    <div
                                        key={day}
                                        onClick={() => setSelectedDate(dateStr)}
                                        className={`h-16 sm:h-24 p-1 border rounded-lg cursor-pointer transition-all hover:border-[#293577] ${
                                            isToday(day) ? 'bg-blue-50 border-[#293577]' : 'border-gray-200'
                                        } ${selectedDate === dateStr ? 'ring-2 ring-[#293577]' : ''}`}
                                    >
                                        <span className={`text-xs sm:text-sm font-medium ${isToday(day) ? 'text-[#293577]' : 'text-gray-700'}`}>
                                            {day}
                                        </span>
                                        <div className="mt-1">
                                            <div className="hidden sm:block space-y-1">
                                                {dayEvents.slice(0, 2).map(evento => (
                                                    <div
                                                        key={evento.id}
                                                        className={`text-xs text-white px-1 py-0.5 rounded truncate ${getTipoColor(evento.tipo)}`}
                                                    >
                                                        {evento.titulo}
                                                    </div>
                                                ))}
                                                {dayEvents.length > 2 && (
                                                    <div className="text-xs text-gray-500">+{dayEvents.length - 2} más</div>
                                                )}
                                            </div>
                                            <div className="sm:hidden flex flex-wrap gap-1">
                                                {dayEvents.slice(0, 3).map(evento => (
                                                    <span
                                                        key={evento.id}
                                                        className={`w-2 h-2 rounded-full ${getTipoColor(evento.tipo)}`}
                                                        aria-label={evento.titulo}
                                                    />
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <span className="text-[10px] text-gray-500">+{dayEvents.length - 3}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Panel lateral - Eventos del día */}
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                        <h2 className="font-bold text-gray-800 mb-4">
                            {selectedDate ? `Eventos del ${selectedDate}` : 'Próximos Eventos'}
                        </h2>
                        
                        <div className="space-y-3">
                            {(selectedDate ? eventos.filter(e => e.fecha === selectedDate) : eventos.slice(0, 5)).map(evento => (
                                <div key={evento.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-3 h-3 rounded-full mt-1.5 ${getTipoColor(evento.tipo)}`}></div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-800">{evento.titulo}</h3>
                                            <p className="text-sm text-gray-500">{evento.hora}</p>
                                            {evento.curso && (
                                                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                                    {evento.curso}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {selectedDate && eventos.filter(e => e.fecha === selectedDate).length === 0 && (
                                <p className="text-gray-500 text-center py-4">No hay eventos para este día</p>
                            )}
                        </div>

                        {/* Leyenda */}
                        <div className="mt-6 pt-4 border-t">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Leyenda</h3>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <span className="text-sm text-gray-600">Clase</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <span className="text-sm text-gray-600">Evaluación</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                                    <span className="text-sm text-gray-600">Reunión</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                    <span className="text-sm text-gray-600">Entrega</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
