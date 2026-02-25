<?php

namespace Database\Seeders;

use App\Models\{
    User, Periodo, Curso, Materia, CursoMateria, Matricula,
    Nota, Observacion, Actividad, Entrega, HorarioBloque,
    Mensaje, Notificacion, ConceptoPago, Pago, Boletin, Certificado
};
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatosColegioSeeder extends Seeder
{
    public function run(): void
    {
        $anio = 2025;

        /* ══════════════════════════════════════════════
         *  1. PERIODOS ACADÉMICOS
         * ══════════════════════════════════════════════ */
        $periodos = collect([
            ['nombre' => 'Primer Periodo',  'numero' => 1, 'fecha_inicio' => "$anio-01-27", 'fecha_fin' => "$anio-04-04", 'estado' => 'finalizado'],
            ['nombre' => 'Segundo Periodo', 'numero' => 2, 'fecha_inicio' => "$anio-04-07", 'fecha_fin' => "$anio-06-13", 'estado' => 'activo'],
            ['nombre' => 'Tercer Periodo',  'numero' => 3, 'fecha_inicio' => "$anio-07-07", 'fecha_fin' => "$anio-09-12", 'estado' => 'pendiente'],
            ['nombre' => 'Cuarto Periodo',  'numero' => 4, 'fecha_inicio' => "$anio-09-15", 'fecha_fin' => "$anio-11-21", 'estado' => 'pendiente'],
        ])->map(fn($p) => Periodo::create(array_merge($p, ['anio' => $anio, 'porcentaje' => 25.00])));

        $p1 = $periodos[0]; // finalizado
        $p2 = $periodos[1]; // activo

        /* ══════════════════════════════════════════════
         *  2. USUARIOS — Profesores
         * ══════════════════════════════════════════════ */
        $profesoresData = [
            ['name' => 'Carlos Díaz Martínez',   'email' => 'profesor@colegio.com',      'documento' => '79845123', 'tipo_documento' => 'CC', 'telefono' => '3101234567', 'genero' => 'M'],
            ['name' => 'Ana María Gómez Ruiz',   'email' => 'ana.gomez@colegio.com',     'documento' => '52987456', 'tipo_documento' => 'CC', 'telefono' => '3209876543', 'genero' => 'F'],
            ['name' => 'Roberto Suárez Peña',    'email' => 'roberto.suarez@colegio.com', 'documento' => '80123789', 'tipo_documento' => 'CC', 'telefono' => '3157894561', 'genero' => 'M'],
            ['name' => 'Lucía Fernández Arias',  'email' => 'lucia.fernandez@colegio.com','documento' => '53456789', 'tipo_documento' => 'CC', 'telefono' => '3001237890', 'genero' => 'F'],
            ['name' => 'Miguel Ángel Torres',    'email' => 'miguel.torres@colegio.com',  'documento' => '79654321', 'tipo_documento' => 'CC', 'telefono' => '3112345678', 'genero' => 'M'],
            ['name' => 'Patricia Morales Luna',  'email' => 'patricia.morales@colegio.com','documento' => '52741852', 'tipo_documento' => 'CC', 'telefono' => '3223456789', 'genero' => 'F'],
            ['name' => 'Andrés Felipe Ramírez',  'email' => 'andres.ramirez@colegio.com', 'documento' => '80987654', 'tipo_documento' => 'CC', 'telefono' => '3134567890', 'genero' => 'M'],
            ['name' => 'Sandra Milena Castro',   'email' => 'sandra.castro@colegio.com',  'documento' => '53698741', 'tipo_documento' => 'CC', 'telefono' => '3045678901', 'genero' => 'F'],
        ];

        $profesores = collect($profesoresData)->map(function ($data) {
            $u = User::create(array_merge($data, [
                'password'          => bcrypt('password'),
                'activo'            => true,
                'email_verified_at' => now(),
                'fecha_nacimiento'  => fake()->dateTimeBetween('-55 years', '-28 years')->format('Y-m-d'),
                'direccion'         => fake()->address(),
            ]));
            $u->assignRole('profesor');
            return $u;
        });

        // Re-asignar el profesor principal (ya creado en DatabaseSeeder) si existe
        $profPrincipal = User::where('email', 'profesor@colegio.com')->first();

        /* ══════════════════════════════════════════════
         *  3. USUARIOS — Estudiantes (30)
         * ══════════════════════════════════════════════ */
        $nombresEstudiantes = [
            ['name' => 'Juan Pérez Rodríguez',     'email' => 'estudiante@colegio.com',       'documento' => '1012345678', 'genero' => 'M'],
            ['name' => 'Valentina García López',    'email' => 'valentina.garcia@colegio.com', 'documento' => '1012345679', 'genero' => 'F'],
            ['name' => 'Santiago Martínez Gómez',   'email' => 'santiago.martinez@colegio.com','documento' => '1012345680', 'genero' => 'M'],
            ['name' => 'Sofía Hernández Díaz',      'email' => 'sofia.hernandez@colegio.com',  'documento' => '1012345681', 'genero' => 'F'],
            ['name' => 'Mateo López Castro',        'email' => 'mateo.lopez@colegio.com',      'documento' => '1012345682', 'genero' => 'M'],
            ['name' => 'Isabella Torres Ramírez',   'email' => 'isabella.torres@colegio.com',  'documento' => '1012345683', 'genero' => 'F'],
            ['name' => 'Samuel Rodríguez Peña',     'email' => 'samuel.rodriguez@colegio.com', 'documento' => '1012345684', 'genero' => 'M'],
            ['name' => 'Mariana Gómez Suárez',      'email' => 'mariana.gomez@colegio.com',    'documento' => '1012345685', 'genero' => 'F'],
            ['name' => 'Nicolás Díaz Fernández',    'email' => 'nicolas.diaz@colegio.com',     'documento' => '1012345686', 'genero' => 'M'],
            ['name' => 'Gabriela Morales Arias',    'email' => 'gabriela.morales@colegio.com', 'documento' => '1012345687', 'genero' => 'F'],
            ['name' => 'Daniel Castro Vargas',      'email' => 'daniel.castro@colegio.com',    'documento' => '1012345688', 'genero' => 'M'],
            ['name' => 'Camila Suárez Luna',        'email' => 'camila.suarez@colegio.com',    'documento' => '1012345689', 'genero' => 'F'],
            ['name' => 'Sebastián Vargas Mora',     'email' => 'sebastian.vargas@colegio.com', 'documento' => '1012345690', 'genero' => 'M'],
            ['name' => 'Laura Fernández Gil',       'email' => 'laura.fernandez@colegio.com',  'documento' => '1012345691', 'genero' => 'F'],
            ['name' => 'Alejandro Arias Peña',      'email' => 'alejandro.arias@colegio.com',  'documento' => '1012345692', 'genero' => 'M'],
            ['name' => 'Paula Andrea Ramírez',      'email' => 'paula.ramirez@colegio.com',    'documento' => '1012345693', 'genero' => 'F'],
            ['name' => 'David Esteban Mora',        'email' => 'david.mora@colegio.com',       'documento' => '1012345694', 'genero' => 'M'],
            ['name' => 'Natalia Luna Gómez',        'email' => 'natalia.luna@colegio.com',     'documento' => '1012345695', 'genero' => 'F'],
            ['name' => 'Tomás Gil Martínez',        'email' => 'tomas.gil@colegio.com',        'documento' => '1012345696', 'genero' => 'M'],
            ['name' => 'Sara Peña Díaz',            'email' => 'sara.pena@colegio.com',        'documento' => '1012345697', 'genero' => 'F'],
            ['name' => 'Andrés Morales Rodríguez',  'email' => 'andres.morales@colegio.com',   'documento' => '1012345698', 'genero' => 'M'],
            ['name' => 'Daniela Gil Torres',        'email' => 'daniela.gil@colegio.com',      'documento' => '1012345699', 'genero' => 'F'],
            ['name' => 'Felipe Castro García',      'email' => 'felipe.castro@colegio.com',    'documento' => '1012345700', 'genero' => 'M'],
            ['name' => 'Ana Sofía Vargas',          'email' => 'anasofia.vargas@colegio.com',  'documento' => '1012345701', 'genero' => 'F'],
            ['name' => 'Julián Rodríguez Mesa',     'email' => 'julian.rodriguez@colegio.com', 'documento' => '1012345702', 'genero' => 'M'],
            ['name' => 'María José Peña Luna',      'email' => 'mariajose.pena@colegio.com',   'documento' => '1012345703', 'genero' => 'F'],
            ['name' => 'Emiliano Díaz Suárez',      'email' => 'emiliano.diaz@colegio.com',    'documento' => '1012345704', 'genero' => 'M'],
            ['name' => 'Luciana Torres Arias',      'email' => 'luciana.torres@colegio.com',   'documento' => '1012345705', 'genero' => 'F'],
            ['name' => 'Martín Gómez Castro',       'email' => 'martin.gomez@colegio.com',     'documento' => '1012345706', 'genero' => 'M'],
            ['name' => 'Valeria Morales Fernández', 'email' => 'valeria.morales@colegio.com',  'documento' => '1012345707', 'genero' => 'F'],
        ];

        $estudiantes = collect($nombresEstudiantes)->map(function ($data) {
            $u = User::create(array_merge($data, [
                'password'          => bcrypt('password'),
                'tipo_documento'    => 'TI',
                'activo'            => true,
                'email_verified_at' => now(),
                'fecha_nacimiento'  => fake()->dateTimeBetween('-17 years', '-10 years')->format('Y-m-d'),
                'telefono'          => '3' . fake()->numerify('##') . fake()->numerify('#######'),
                'direccion'         => fake()->address(),
            ]));
            $u->assignRole('estudiante');
            return $u;
        });

        // Re-asignar al estudiante principal
        $estPrincipal = $estudiantes->first(); // Juan Pérez

        /* ══════════════════════════════════════════════
         *  4. USUARIOS — Padres (15)
         * ══════════════════════════════════════════════ */
        $padresData = [
            ['name' => 'María López de Pérez',     'email' => 'padre@colegio.com',           'documento' => '39845123', 'genero' => 'F'],
            ['name' => 'Carlos García Ruiz',        'email' => 'carlos.garcia.p@colegio.com', 'documento' => '79147258', 'genero' => 'M'],
            ['name' => 'Luz Marina Gómez',          'email' => 'luz.gomez@colegio.com',        'documento' => '39258741', 'genero' => 'F'],
            ['name' => 'Pedro Martínez Silva',      'email' => 'pedro.martinez@colegio.com',   'documento' => '79369852', 'genero' => 'M'],
            ['name' => 'Gloria Díaz Luna',          'email' => 'gloria.diaz@colegio.com',      'documento' => '39741852', 'genero' => 'F'],
            ['name' => 'Jorge López Castro',        'email' => 'jorge.lopez@colegio.com',      'documento' => '79852963', 'genero' => 'M'],
            ['name' => 'Carmen Torres Mora',        'email' => 'carmen.torres@colegio.com',    'documento' => '39963741', 'genero' => 'F'],
            ['name' => 'Fernando Rodríguez Gil',    'email' => 'fernando.rodriguez@colegio.com','documento' => '79741852', 'genero' => 'M'],
            ['name' => 'Rosa Hernández Peña',       'email' => 'rosa.hernandez@colegio.com',   'documento' => '39852963', 'genero' => 'F'],
            ['name' => 'Luis Vargas Arias',         'email' => 'luis.vargas@colegio.com',      'documento' => '79963741', 'genero' => 'M'],
            ['name' => 'Adriana Suárez Gómez',      'email' => 'adriana.suarez@colegio.com',   'documento' => '39147258', 'genero' => 'F'],
            ['name' => 'Ricardo Morales Díaz',      'email' => 'ricardo.morales@colegio.com',  'documento' => '79258369', 'genero' => 'M'],
            ['name' => 'Diana Fernández Torres',    'email' => 'diana.fernandez.p@colegio.com','documento' => '39369852', 'genero' => 'F'],
            ['name' => 'Héctor Castro Luna',        'email' => 'hector.castro@colegio.com',    'documento' => '79369741', 'genero' => 'M'],
            ['name' => 'Martha Gil Mora',           'email' => 'martha.gil@colegio.com',       'documento' => '39741963', 'genero' => 'F'],
        ];

        $padresUsers = collect($padresData)->map(function ($data) {
            $u = User::create(array_merge($data, [
                'password'          => bcrypt('password'),
                'tipo_documento'    => 'CC',
                'activo'            => true,
                'email_verified_at' => now(),
                'fecha_nacimiento'  => fake()->dateTimeBetween('-55 years', '-30 years')->format('Y-m-d'),
                'telefono'          => '3' . fake()->numerify('##') . fake()->numerify('#######'),
                'direccion'         => fake()->address(),
            ]));
            $u->assignRole('padre');
            return $u;
        });

        /* ══════════════════════════════════════════════
         *  5. PADRE ↔ ESTUDIANTE
         * ══════════════════════════════════════════════ */
        // Cada padre tiene 2 hijos (los 30 estudiantes / 15 padres)
        $parentescos = ['padre', 'madre', 'acudiente'];
        $padresUsers->each(function ($padre, $idx) use ($estudiantes, $parentescos) {
            $hijo1 = $estudiantes[$idx * 2] ?? null;
            $hijo2 = $estudiantes[$idx * 2 + 1] ?? null;
            $parentesco = $parentescos[array_rand($parentescos)];

            if ($hijo1) $padre->hijos()->attach($hijo1->id, ['parentesco' => $parentesco]);
            if ($hijo2) $padre->hijos()->attach($hijo2->id, ['parentesco' => $parentesco]);
        });

        /* ══════════════════════════════════════════════
         *  6. MATERIAS
         * ══════════════════════════════════════════════ */
        $materiasData = [
            ['nombre' => 'Matemáticas',        'area' => 'Ciencias Exactas',   'codigo' => 'MAT', 'horas_semanales' => 5],
            ['nombre' => 'Lengua Castellana',   'area' => 'Humanidades',        'codigo' => 'LEN', 'horas_semanales' => 4],
            ['nombre' => 'Ciencias Naturales',  'area' => 'Ciencias Naturales', 'codigo' => 'NAT', 'horas_semanales' => 4],
            ['nombre' => 'Ciencias Sociales',   'area' => 'Ciencias Sociales',  'codigo' => 'SOC', 'horas_semanales' => 3],
            ['nombre' => 'Inglés',              'area' => 'Humanidades',        'codigo' => 'ING', 'horas_semanales' => 3],
            ['nombre' => 'Educación Física',    'area' => 'Educación Física',   'codigo' => 'EFI', 'horas_semanales' => 2],
            ['nombre' => 'Educación Artística', 'area' => 'Artes',             'codigo' => 'ART', 'horas_semanales' => 2],
            ['nombre' => 'Tecnología e Informática', 'area' => 'Tecnología',   'codigo' => 'TEC', 'horas_semanales' => 2],
            ['nombre' => 'Ética y Valores',     'area' => 'Humanidades',        'codigo' => 'ETI', 'horas_semanales' => 1],
            ['nombre' => 'Religión',            'area' => 'Humanidades',        'codigo' => 'REL', 'horas_semanales' => 1],
        ];

        $materias = collect($materiasData)->map(fn($m) => Materia::create($m));

        /* ══════════════════════════════════════════════
         *  7. CURSOS
         * ══════════════════════════════════════════════ */
        $cursosData = [
            ['nombre' => 'Preescolar A',  'nivel' => 'preescolar',   'grado' => 'Jardín',  'grupo' => 'A'],
            ['nombre' => 'Transición A',  'nivel' => 'transicion',   'grado' => 'Trans',   'grupo' => 'A'],
            ['nombre' => '1°A',           'nivel' => 'primaria',     'grado' => '1°',      'grupo' => 'A'],
            ['nombre' => '2°A',           'nivel' => 'primaria',     'grado' => '2°',      'grupo' => 'A'],
            ['nombre' => '3°A',           'nivel' => 'primaria',     'grado' => '3°',      'grupo' => 'A'],
            ['nombre' => '4°A',           'nivel' => 'primaria',     'grado' => '4°',      'grupo' => 'A'],
            ['nombre' => '5°A',           'nivel' => 'primaria',     'grado' => '5°',      'grupo' => 'A'],
            ['nombre' => '6°A',           'nivel' => 'bachillerato', 'grado' => '6°',      'grupo' => 'A'],
            ['nombre' => '7°A',           'nivel' => 'bachillerato', 'grado' => '7°',      'grupo' => 'A'],
            ['nombre' => '8°A',           'nivel' => 'bachillerato', 'grado' => '8°',      'grupo' => 'A'],
            ['nombre' => '9°A',           'nivel' => 'bachillerato', 'grado' => '9°',      'grupo' => 'A'],
            ['nombre' => '10°A',          'nivel' => 'bachillerato', 'grado' => '10°',     'grupo' => 'A'],
            ['nombre' => '11°A',          'nivel' => 'bachillerato', 'grado' => '11°',     'grupo' => 'A'],
        ];

        $cursos = collect($cursosData)->map(function ($c, $idx) use ($anio, $profesores) {
            return Curso::create(array_merge($c, [
                'anio'              => $anio,
                'jornada'           => 'mañana',
                'cupo_maximo'       => 35,
                'director_grupo_id' => $profesores[$idx % $profesores->count()]->id,
                'activo'            => true,
            ]));
        });

        /* ══════════════════════════════════════════════
         *  8. CURSO ↔ MATERIA (asignación de profesores)
         * ══════════════════════════════════════════════ */
        $cursoMaterias = collect();

        // Materias principales para bachillerato (6° a 11°): todas las 10
        // Para primaria (1°-5°): 8 materias (sin Ética ni Religión separadas en cursos pequeños)
        // Para preescolar/transición: 5 materias básicas

        $cursos->each(function ($curso, $idx) use ($materias, $profesores, &$cursoMaterias) {
            $materiasDelCurso = match(true) {
                in_array($curso->nivel, ['preescolar', 'transicion']) => $materias->take(5),
                $curso->nivel === 'primaria'                          => $materias->take(8),
                default                                               => $materias, // bachillerato: todas
            };

            $materiasDelCurso->each(function ($materia, $mIdx) use ($curso, $profesores, &$cursoMaterias) {
                $cm = CursoMateria::create([
                    'curso_id'        => $curso->id,
                    'materia_id'      => $materia->id,
                    'profesor_id'     => $profesores[($mIdx + $curso->id) % $profesores->count()]->id,
                    'horas_semanales' => $materia->horas_semanales,
                ]);
                $cursoMaterias->push($cm);
            });
        });

        /* ══════════════════════════════════════════════
         *  9. MATRÍCULAS — distribuir 30 estudiantes en cursos
         * ══════════════════════════════════════════════ */
        // Distribuir: ~2-3 por curso en primaria/bachillerato
        $cursosBachPrim = $cursos->filter(fn($c) => in_array($c->nivel, ['primaria', 'bachillerato']));
        $estIdx = 0;

        $cursosBachPrim->each(function ($curso) use ($estudiantes, &$estIdx, $p1, $p2) {
            $cantPorCurso = ($estIdx + 3 <= $estudiantes->count()) ? 3 : max(0, $estudiantes->count() - $estIdx);

            for ($i = 0; $i < $cantPorCurso && $estIdx < $estudiantes->count(); $i++, $estIdx++) {
                // Matrícula en periodo 1 (finalizado)
                Matricula::create([
                    'estudiante_id'  => $estudiantes[$estIdx]->id,
                    'curso_id'       => $curso->id,
                    'periodo_id'     => $p1->id,
                    'estado'         => 'activa',
                    'fecha_matricula'=> "$p1->anio-01-15",
                ]);
                // Matrícula en periodo 2 (activo)
                Matricula::create([
                    'estudiante_id'  => $estudiantes[$estIdx]->id,
                    'curso_id'       => $curso->id,
                    'periodo_id'     => $p2->id,
                    'estado'         => 'activa',
                    'fecha_matricula'=> "$p2->anio-01-15",
                ]);
            }
        });

        /* ══════════════════════════════════════════════
         *  10. NOTAS — Periodo 1 completo, parcial en P2
         * ══════════════════════════════════════════════ */
        $tipos = ['parcial', 'quiz', 'examen', 'definitiva'];

        Matricula::where('periodo_id', $p1->id)->with('curso.cursoMaterias')->get()->each(function ($mat) use ($p1, $tipos) {
            $mat->curso->cursoMaterias->each(function ($cm) use ($mat, $p1, $tipos) {
                // 3 notas parciales + 1 definitiva por materia
                foreach (['parcial', 'quiz', 'examen'] as $tipo) {
                    Nota::create([
                        'estudiante_id'   => $mat->estudiante_id,
                        'curso_materia_id'=> $cm->id,
                        'periodo_id'      => $p1->id,
                        'valor'           => round(mt_rand(25, 50) / 10, 1),
                        'tipo'            => $tipo,
                        'descripcion'     => ucfirst($tipo) . ' - ' . $cm->materia->nombre ?? 'Evaluación',
                    ]);
                }
                // Definitiva
                Nota::create([
                    'estudiante_id'   => $mat->estudiante_id,
                    'curso_materia_id'=> $cm->id,
                    'periodo_id'      => $p1->id,
                    'valor'           => round(mt_rand(30, 48) / 10, 1),
                    'tipo'            => 'definitiva',
                    'descripcion'     => 'Nota definitiva Periodo 1',
                ]);
            });
        });

        // Periodo 2: solo parciales (en curso)
        Matricula::where('periodo_id', $p2->id)->with('curso.cursoMaterias')->get()->each(function ($mat) use ($p2) {
            $mat->curso->cursoMaterias->take(5)->each(function ($cm) use ($mat, $p2) {
                Nota::create([
                    'estudiante_id'   => $mat->estudiante_id,
                    'curso_materia_id'=> $cm->id,
                    'periodo_id'      => $p2->id,
                    'valor'           => round(mt_rand(20, 50) / 10, 1),
                    'tipo'            => 'parcial',
                    'descripcion'     => 'Primera evaluación Periodo 2',
                ]);
            });
        });

        /* ══════════════════════════════════════════════
         *  11. OBSERVACIONES
         * ══════════════════════════════════════════════ */
        $categoriasPositivas = ['Participación en clase', 'Excelente desempeño', 'Liderazgo', 'Trabajo en equipo', 'Creatividad'];
        $categoriasNegativas = ['Incumplimiento de tareas', 'Indisciplina', 'Llegadas tarde', 'Falta de atención', 'Uso del celular'];

        $descPositivas = [
            'Demostró un excelente desempeño durante la actividad grupal.',
            'Participó activamente en clase, aportando ideas valiosas.',
            'Lideró el grupo de trabajo con responsabilidad y compromiso.',
            'Entregó el proyecto final con una calidad excepcional.',
            'Mostró una actitud positiva y colaborativa durante la clase.',
        ];

        $descNegativas = [
            'No presentó la tarea asignada en la fecha indicada.',
            'Interrumpió la clase de forma reiterada.',
            'Llegó tarde a clase sin justificación.',
            'No prestó atención durante la explicación del tema.',
            'Usó el celular durante la evaluación sin autorización.',
        ];

        $estudiantes->take(20)->each(function ($est) use ($profesores, $materias, $categoriasPositivas, $categoriasNegativas, $descPositivas, $descNegativas) {
            // 2-4 observaciones por estudiante
            $cant = mt_rand(2, 4);
            for ($i = 0; $i < $cant; $i++) {
                $esPositiva = mt_rand(0, 1);
                Observacion::create([
                    'estudiante_id' => $est->id,
                    'profesor_id'   => $profesores->random()->id,
                    'materia_id'    => mt_rand(0, 1) ? $materias->random()->id : null,
                    'tipo'          => $esPositiva ? 'positiva' : 'negativa',
                    'categoria'     => $esPositiva
                        ? $categoriasPositivas[array_rand($categoriasPositivas)]
                        : $categoriasNegativas[array_rand($categoriasNegativas)],
                    'descripcion'   => $esPositiva
                        ? $descPositivas[array_rand($descPositivas)]
                        : $descNegativas[array_rand($descNegativas)],
                    'fecha'         => Carbon::now()->subDays(mt_rand(1, 90))->format('Y-m-d'),
                ]);
            }
        });

        /* ══════════════════════════════════════════════
         *  12. ACTIVIDADES + ENTREGAS
         * ══════════════════════════════════════════════ */
        $tiposActividad = ['tarea', 'quiz', 'examen', 'proyecto', 'taller'];
        $titulosActividad = [
            'tarea'    => ['Taller de ejercicios', 'Investigación bibliográfica', 'Problemas del capítulo', 'Resumen del tema'],
            'quiz'     => ['Quiz sorpresa', 'Quiz del tema', 'Evaluación corta'],
            'examen'   => ['Examen parcial', 'Evaluación bimestral', 'Prueba escrita'],
            'proyecto' => ['Proyecto final', 'Proyecto de investigación', 'Exposición grupal'],
            'taller'   => ['Taller práctico', 'Laboratorio', 'Taller en clase'],
        ];

        // Crear actividades para los primeros 20 curso_materias (bachillerato)
        $cmBachillerato = $cursoMaterias->filter(fn($cm) =>
            $cursos->firstWhere('id', $cm->curso_id)?->nivel === 'bachillerato'
        )->take(20);

        $cmBachillerato->each(function ($cm) use ($p2, $titulosActividad, $estudiantes) {
            // 2-3 actividades por curso-materia
            $cant = mt_rand(2, 3);
            for ($i = 0; $i < $cant; $i++) {
                $tipo = array_rand($titulosActividad);
                $titulos = $titulosActividad[$tipo];
                $fechaAsignacion = Carbon::parse($p2->fecha_inicio)->addDays(mt_rand(0, 30));
                $fechaEntrega = $fechaAsignacion->copy()->addDays(mt_rand(3, 14));

                $actividad = Actividad::create([
                    'curso_materia_id' => $cm->id,
                    'titulo'           => $titulos[array_rand($titulos)],
                    'descripcion'      => 'Actividad correspondiente al segundo periodo académico.',
                    'tipo'             => $tipo,
                    'fecha_asignacion' => $fechaAsignacion->format('Y-m-d'),
                    'fecha_entrega'    => $fechaEntrega->format('Y-m-d'),
                    'porcentaje'       => round(100 / $cant, 2),
                    'activa'           => true,
                ]);

                // Entregas de los estudiantes del curso
                $matriculados = Matricula::where('curso_id', $cm->curso_id)
                    ->where('periodo_id', $p2->id ?? 2)
                    ->pluck('estudiante_id');

                $matriculados->each(function ($estId) use ($actividad) {
                    $estado = ['pendiente', 'entregada', 'calificada'][mt_rand(0, 2)];
                    Entrega::create([
                        'actividad_id'      => $actividad->id,
                        'estudiante_id'     => $estId,
                        'contenido'         => $estado !== 'pendiente' ? 'Trabajo entregado por el estudiante.' : null,
                        'calificacion'      => $estado === 'calificada' ? round(mt_rand(25, 50) / 10, 1) : null,
                        'retroalimentacion' => $estado === 'calificada' ? 'Buen trabajo. Mejorar la presentación.' : null,
                        'estado'            => $estado,
                        'fecha_entrega'     => $estado !== 'pendiente' ? Carbon::now()->subDays(mt_rand(1, 15)) : null,
                    ]);
                });
            }
        });

        /* ══════════════════════════════════════════════
         *  13. HORARIO DE BLOQUES
         * ══════════════════════════════════════════════ */
        $dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
        $horas = ['07:00', '07:45', '08:30', '09:15', '10:15', '11:00', '11:45'];

        // Horario para cursos de bachillerato
        $cursosBach = $cursos->filter(fn($c) => $c->nivel === 'bachillerato');

        $cursosBach->each(function ($curso) use ($dias, $horas) {
            $cmsCurso = CursoMateria::where('curso_id', $curso->id)->get();
            $bloqueIdx = 0;

            foreach ($dias as $dia) {
                foreach ($horas as $horaIdx => $horaInicio) {
                    if ($bloqueIdx >= $cmsCurso->count() * 2) break 2; // suficientes bloques

                    $cm = $cmsCurso[$bloqueIdx % $cmsCurso->count()];
                    $horaFin = Carbon::parse($horaInicio)->addMinutes(45)->format('H:i');

                    HorarioBloque::create([
                        'curso_materia_id' => $cm->id,
                        'dia'              => $dia,
                        'hora_inicio'      => $horaInicio,
                        'hora_fin'         => $horaFin,
                        'salon'            => 'Salón ' . $curso->grado . '-' . mt_rand(1, 5),
                    ]);

                    $bloqueIdx++;
                }
            }
        });

        /* ══════════════════════════════════════════════
         *  14. MENSAJES
         * ══════════════════════════════════════════════ */
        $asuntos = [
            'Consulta sobre notas', 'Reunión de padres', 'Tarea pendiente',
            'Felicitaciones', 'Solicitud de certificado', 'Información importante',
            'Horario de recuperación', 'Proyecto grupal',
        ];

        $contenidos = [
            'Buenos días, quisiera consultar sobre las notas del primer periodo.',
            'Le informo que la reunión de padres será el próximo viernes a las 3:00 PM.',
            'Recuerde que la tarea está pendiente de entrega para mañana.',
            'Felicitaciones por el excelente desempeño en la evaluación.',
            'Solicito un certificado de estudio para trámites personales.',
            'Les informamos que mañana no habrá clase por jornada pedagógica.',
            'Los horarios de recuperación serán publicados esta semana.',
            'El proyecto grupal debe presentarse la próxima semana.',
        ];

        // 20 mensajes entre distintos usuarios
        for ($i = 0; $i < 20; $i++) {
            $remitente    = $i < 10 ? $profesores->random() : $padresUsers->random();
            $destinatario = $i < 10 ? $padresUsers->random() : $profesores->random();

            Mensaje::create([
                'remitente_id'    => $remitente->id,
                'destinatario_id' => $destinatario->id,
                'asunto'          => $asuntos[array_rand($asuntos)],
                'contenido'       => $contenidos[array_rand($contenidos)],
                'leido'           => (bool) mt_rand(0, 1),
                'leido_at'        => mt_rand(0, 1) ? Carbon::now()->subHours(mt_rand(1, 72)) : null,
            ]);
        }

        /* ══════════════════════════════════════════════
         *  15. NOTIFICACIONES
         * ══════════════════════════════════════════════ */
        $tiposNotif = ['sistema', 'academica', 'pago', 'mensaje'];
        $titulosNotif = [
            'sistema'   => ['Bienvenido al sistema', 'Actualización de la plataforma', 'Mantenimiento programado'],
            'academica' => ['Nuevas notas publicadas', 'Actividad asignada', 'Periodo finalizado'],
            'pago'      => ['Pago pendiente', 'Pago confirmado', 'Factura disponible'],
            'mensaje'   => ['Nuevo mensaje recibido', 'Mensaje leído', 'Respuesta a su consulta'],
        ];

        $admin = User::where('email', 'admin@colegio.com')->first();
        $todosUsuarios = collect([$admin])->merge($profesores)->merge($estudiantes->take(10))->merge($padresUsers->take(5));

        $todosUsuarios->each(function ($user) use ($tiposNotif, $titulosNotif) {
            $cant = mt_rand(2, 5);
            for ($i = 0; $i < $cant; $i++) {
                $tipo = $tiposNotif[array_rand($tiposNotif)];
                $titulos = $titulosNotif[$tipo];
                Notificacion::create([
                    'user_id'  => $user->id,
                    'tipo'     => $tipo,
                    'titulo'   => $titulos[array_rand($titulos)],
                    'mensaje'  => 'Esta es una notificación de tipo ' . $tipo . ' generada automáticamente.',
                    'leida'    => (bool) mt_rand(0, 1),
                    'leida_at' => mt_rand(0, 1) ? Carbon::now()->subHours(mt_rand(1, 168)) : null,
                ]);
            }
        });

        /* ══════════════════════════════════════════════
         *  16. CONCEPTOS DE PAGO + PAGOS
         * ══════════════════════════════════════════════ */
        $conceptos = [
            ConceptoPago::create(['nombre' => 'Matrícula 2025',        'descripcion' => 'Pago de matrícula anual',            'monto' => 350000,  'periodicidad' => 'unico']),
            ConceptoPago::create(['nombre' => 'Pensión Mensual',       'descripcion' => 'Pensión mensual del colegio',        'monto' => 280000,  'periodicidad' => 'mensual']),
            ConceptoPago::create(['nombre' => 'Seguro Estudiantil',    'descripcion' => 'Seguro de accidentes estudiantil',   'monto' => 45000,   'periodicidad' => 'anual']),
            ConceptoPago::create(['nombre' => 'Material Didáctico',    'descripcion' => 'Kit de materiales del año',          'monto' => 120000,  'periodicidad' => 'anual']),
            ConceptoPago::create(['nombre' => 'Cafetería',             'descripcion' => 'Servicio mensual de cafetería',      'monto' => 85000,   'periodicidad' => 'mensual']),
        ];

        $estadosPago = ['pendiente', 'pagado', 'vencido'];
        $metodosPago = ['efectivo', 'transferencia', 'PSE', 'tarjeta'];

        // Pagos para los primeros 20 estudiantes
        $estudiantes->take(20)->each(function ($est) use ($conceptos, $p1, $p2, $estadosPago, $metodosPago) {
            // Matrícula (pagada)
            Pago::create([
                'estudiante_id'     => $est->id,
                'concepto_pago_id'  => $conceptos[0]->id,
                'periodo_id'        => $p1->id,
                'monto'             => $conceptos[0]->monto,
                'estado'            => 'pagado',
                'metodo_pago'       => $metodosPago[array_rand($metodosPago)],
                'referencia'        => 'REF-' . mt_rand(100000, 999999),
                'fecha_vencimiento' => '2025-01-20',
                'fecha_pago'        => '2025-01-' . mt_rand(10, 19),
            ]);

            // Pensiones (febrero a mayo: 2 pagadas, 1-2 pendientes/vencidas)
            $meses = ['02', '03', '04', '05'];
            foreach ($meses as $idx => $mes) {
                $estado = $idx < 2 ? 'pagado' : $estadosPago[array_rand($estadosPago)];
                Pago::create([
                    'estudiante_id'     => $est->id,
                    'concepto_pago_id'  => $conceptos[1]->id,
                    'periodo_id'        => $idx < 2 ? $p1->id : $p2->id,
                    'monto'             => $conceptos[1]->monto,
                    'estado'            => $estado,
                    'metodo_pago'       => $estado === 'pagado' ? $metodosPago[array_rand($metodosPago)] : null,
                    'referencia'        => $estado === 'pagado' ? 'REF-' . mt_rand(100000, 999999) : null,
                    'fecha_vencimiento' => "2025-$mes-05",
                    'fecha_pago'        => $estado === 'pagado' ? "2025-$mes-0" . mt_rand(1, 4) : null,
                ]);
            }
        });

        /* ══════════════════════════════════════════════
         *  17. BOLETINES (Periodo 1 — generados)
         * ══════════════════════════════════════════════ */
        Matricula::where('periodo_id', $p1->id)->get()->each(function ($mat) use ($p1) {
            // Calcular promedio real del estudiante en ese periodo
            $promedioEstudiante = Nota::where('estudiante_id', $mat->estudiante_id)
                ->where('periodo_id', $p1->id)
                ->where('tipo', 'definitiva')
                ->avg('valor');

            Boletin::create([
                'estudiante_id'      => $mat->estudiante_id,
                'periodo_id'         => $p1->id,
                'curso_id'           => $mat->curso_id,
                'promedio'           => round($promedioEstudiante ?? 3.5, 1),
                'puesto'             => mt_rand(1, 10),
                'observacion_general'=> 'El estudiante muestra un desempeño adecuado durante el primer periodo.',
                'estado'             => 'generado',
            ]);
        });

        /* ══════════════════════════════════════════════
         *  18. CERTIFICADOS (algunos de ejemplo)
         * ══════════════════════════════════════════════ */
        $estudiantes->take(5)->each(function ($est) {
            Certificado::create([
                'estudiante_id'   => $est->id,
                'tipo'            => ['estudio', 'notas', 'constancia', 'paz_y_salvo'][mt_rand(0, 3)],
                'descripcion'     => 'Certificado solicitado por el acudiente.',
                'estado'          => ['solicitado', 'en_proceso', 'listo'][mt_rand(0, 2)],
                'fecha_solicitud' => Carbon::now()->subDays(mt_rand(1, 30))->format('Y-m-d'),
            ]);
        });

        $this->command->info('Datos del colegio creados exitosamente.');
        $this->command->info("  - {$profesores->count()} profesores");
        $this->command->info("  - {$estudiantes->count()} estudiantes");
        $this->command->info("  - {$padresUsers->count()} padres");
        $this->command->info('  - ' . $cursos->count() . ' cursos');
        $this->command->info('  - ' . $materias->count() . ' materias');
        $this->command->info('  - ' . Nota::count() . ' notas');
        $this->command->info('  - ' . Observacion::count() . ' observaciones');
        $this->command->info('  - ' . Actividad::count() . ' actividades');
        $this->command->info('  - ' . Pago::count() . ' pagos');
    }
}
