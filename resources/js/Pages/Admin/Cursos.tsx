import SidebarLayout from '@/Layouts/SidebarLayout';
import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { adminMenuItems } from '@/Config/adminMenu';

interface Curso {
    id: number;
    nombre: string;
    grado: string;
    seccion: string;
    materias: string[];
    profesor_guia: string;
    estudiantes: number;
}

export default function Cursos() {
    const [activeTab, setActiveTab] = useState<'cursos' | 'materias'>('cursos');
    const [showModal, setShowModal] = useState(false);

    const cursos: Curso[] = [
        { id: 1, nombre: '6° Primaria', grado: '6°', seccion: 'A', materias: ['Matemáticas', 'Español', 'Ciencias', 'Historia'], profesor_guia: 'María García', estudiantes: 32 },
        { id: 2, nombre: '6° Primaria', grado: '6°', seccion: 'B', materias: ['Matemáticas', 'Español', 'Ciencias', 'Historia'], profesor_guia: 'Juan Pérez', estudiantes: 30 },
        { id: 3, nombre: '7° Secundaria', grado: '7°', seccion: 'A', materias: ['Álgebra', 'Lenguaje', 'Biología', 'Geografía'], profesor_guia: 'Carlos López', estudiantes: 28 },
        { id: 4, nombre: '8° Secundaria', grado: '8°', seccion: 'A', materias: ['Geometría', 'Literatura', 'Química', 'Física'], profesor_guia: 'Ana Martínez', estudiantes: 35 },
    ];

    const materias = [
        { id: 1, nombre: 'Matemáticas', area: 'Ciencias Exactas', cursos: 4, profesores: 2 },
        { id: 2, nombre: 'Español', area: 'Humanidades', cursos: 4, profesores: 2 },
        { id: 3, nombre: 'Ciencias Naturales', area: 'Ciencias', cursos: 4, profesores: 3 },
        { id: 4, nombre: 'Historia', area: 'Sociales', cursos: 4, profesores: 2 },
        { id: 5, nombre: 'Inglés', area: 'Idiomas', cursos: 6, profesores: 2 },
        { id: 6, nombre: 'Educación Física', area: 'Deportes', cursos: 8, profesores: 1 },
    ];

    return (
        <SidebarLayout menuItems={adminMenuItems} title="Cursos & Materias">
            <Head title="Cursos & Materias" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Cursos & Materias</h1>
                        <p className="text-gray-600">Administra la estructura académica</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 bg-[#293577] text-white px-4 py-2 rounded-lg hover:bg-[#181b49] transition-colors"
                    >
                        <span className="text-xl">+</span>
                        {activeTab === 'cursos' ? 'Nuevo Curso' : 'Nueva Materia'}
                    </button>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-sm p-1 inline-flex">
                    <button
                        onClick={() => setActiveTab('cursos')}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'cursos' ? 'bg-[#293577] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        📚 Cursos
                    </button>
                    <button
                        onClick={() => setActiveTab('materias')}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'materias' ? 'bg-[#293577] text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        📖 Materias
                    </button>
                </div>

                {activeTab === 'cursos' ? (
                    /* Tabla de cursos */
                    <div className="grid gap-4">
                        {cursos.map((curso) => (
                            <div key={curso.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-[#181b49] rounded-xl flex items-center justify-center text-white font-bold text-xl">
                                            {curso.grado}{curso.seccion}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{curso.nombre} - Sección {curso.seccion}</h3>
                                            <p className="text-gray-600 text-sm">Profesor guía: {curso.profesor_guia}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-[#293577]">{curso.estudiantes}</p>
                                            <p className="text-xs text-gray-500">Estudiantes</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-green-600">{curso.materias.length}</p>
                                            <p className="text-xs text-gray-500">Materias</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2 text-[#293577] hover:bg-blue-50 rounded-lg">✏️</button>
                                            <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg">🗑️</button>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {curso.materias.map((materia, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                            {materia}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Tabla de materias */
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Materia</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Área</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cursos</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Profesores</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {materias.map((materia) => (
                                    <tr key={materia.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-[#293577] rounded-lg flex items-center justify-center text-white">
                                                    📖
                                                </div>
                                                <span className="font-medium text-gray-800">{materia.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{materia.area}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{materia.cursos}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">{materia.profesores}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-[#293577] hover:text-[#181b49] mr-3">✏️</button>
                                            <button className="text-red-500 hover:text-red-700">🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <p className="text-2xl font-bold text-[#181b49]">{cursos.length}</p>
                        <p className="text-gray-600 text-sm">Cursos Activos</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <p className="text-2xl font-bold text-[#293577]">{materias.length}</p>
                        <p className="text-gray-600 text-sm">Materias</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{cursos.reduce((acc, c) => acc + c.estudiantes, 0)}</p>
                        <p className="text-gray-600 text-sm">Estudiantes Total</p>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-4 text-center">
                        <p className="text-2xl font-bold text-purple-600">4</p>
                        <p className="text-gray-600 text-sm">Grados</p>
                    </div>
                </div>
            </div>
        </SidebarLayout>
    );
}
