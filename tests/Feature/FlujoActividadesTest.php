<?php

namespace Tests\Feature;

use App\Models\Actividad;
use App\Models\Curso;
use App\Models\CursoMateria;
use App\Models\Entrega;
use App\Models\Materia;
use App\Models\Matricula;
use App\Models\Notificacion;
use App\Models\Periodo;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class FlujoActividadesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
        Role::findOrCreate('profesor', 'web');
        Role::findOrCreate('estudiante', 'web');
    }

    public function test_flujo_completo_actividad_con_devolucion_reenvio_y_calificacion_tardia(): void
    {
        $profesor = User::factory()->create();
        $profesor->assignRole('profesor');

        $estudiante = User::factory()->create();
        $estudiante->assignRole('estudiante');

        $periodo = Periodo::create([
            'anio' => (int) now()->year,
            'nombre' => 'Periodo 1',
            'numero' => 1,
            'fecha_inicio' => Carbon::now()->startOfYear()->toDateString(),
            'fecha_fin' => Carbon::now()->endOfYear()->toDateString(),
            'porcentaje' => 25,
            'estado' => 'activo',
        ]);

        $curso = Curso::create([
            'nombre' => 'Sexto A',
            'nivel' => 'primaria',
            'grado' => 'Sexto',
            'grupo' => 'A',
            'jornada' => 'mañana',
            'anio' => (int) now()->year,
            'cupo_maximo' => 35,
            'activo' => true,
        ]);

        $materia = Materia::create([
            'nombre' => 'Matemáticas',
            'area' => 'Ciencias Exactas',
            'codigo' => 'MAT-TEST',
            'horas_semanales' => 4,
            'activa' => true,
        ]);

        $cursoMateria = CursoMateria::create([
            'curso_id' => $curso->id,
            'materia_id' => $materia->id,
            'profesor_id' => $profesor->id,
            'horas_semanales' => 4,
        ]);

        Matricula::create([
            'estudiante_id' => $estudiante->id,
            'curso_id' => $curso->id,
            'periodo_id' => $periodo->id,
            'estado' => 'activa',
            'fecha_matricula' => now()->toDateString(),
        ]);

        // 1) Profesor crea quiz con todos los tipos de pregunta.
        $this->actingAs($profesor)
            ->post(route('profesor.actividades.store'), [
                'curso_materia_id' => $cursoMateria->id,
                'titulo' => 'Quiz integral unidad 1',
                'descripcion' => 'Incluye selección múltiple, V/F y abierta.',
                'tipo' => 'quiz',
                'fecha_entrega' => now()->addDays(3)->format('Y-m-d H:i:s'),
                'porcentaje' => 20,
                'activa' => true,
                'permite_entrega_tardia' => false,
                'preguntas' => [
                    [
                        'enunciado' => '¿Cuánto es 2 + 2?',
                        'tipo' => 'seleccion_multiple',
                        'puntos' => 2,
                        'opciones' => [
                            ['texto' => '3', 'es_correcta' => false],
                            ['texto' => '4', 'es_correcta' => true],
                            ['texto' => '5', 'es_correcta' => false],
                        ],
                    ],
                    [
                        'enunciado' => 'El número 7 es impar.',
                        'tipo' => 'verdadero_falso',
                        'puntos' => 2,
                        'opciones' => [
                            ['texto' => 'Verdadero', 'es_correcta' => true],
                            ['texto' => 'Falso', 'es_correcta' => false],
                        ],
                    ],
                    [
                        'enunciado' => 'Explica cómo verificas una suma mentalmente.',
                        'tipo' => 'abierta',
                        'puntos' => 1,
                    ],
                ],
            ])
            ->assertRedirect('/profesor/actividades');

        $actividadQuiz = Actividad::where('titulo', 'Quiz integral unidad 1')->firstOrFail();
        $this->assertTrue($actividadQuiz->tiene_preguntas);
        $this->assertCount(3, $actividadQuiz->preguntas);

        $entregaQuiz = Entrega::where('actividad_id', $actividadQuiz->id)
            ->where('estudiante_id', $estudiante->id)
            ->firstOrFail();

        $this->assertSame('pendiente', $entregaQuiz->estado);

        $preguntaSeleccion = $actividadQuiz->preguntas()->where('tipo', 'seleccion_multiple')->with('opciones')->firstOrFail();
        $preguntaVF = $actividadQuiz->preguntas()->where('tipo', 'verdadero_falso')->with('opciones')->firstOrFail();
        $preguntaAbierta = $actividadQuiz->preguntas()->where('tipo', 'abierta')->firstOrFail();

        $opcionSeleccionCorrecta = $preguntaSeleccion->opciones->firstWhere('es_correcta', true);
        $opcionVFCorrecta = $preguntaVF->opciones->firstWhere('es_correcta', true);

        // 2) Estudiante responde quiz. Como hay pregunta abierta, queda entregada para revisión manual.
        $this->actingAs($estudiante)
            ->post(route('estudiante.actividades.quiz', $actividadQuiz), [
                'respuestas' => [
                    $preguntaSeleccion->id => $opcionSeleccionCorrecta?->id,
                    $preguntaVF->id => $opcionVFCorrecta?->id,
                    $preguntaAbierta->id => 'Uso descomposición y verificación inversa.',
                ],
            ])
            ->assertRedirect(route('estudiante.actividades.show', $actividadQuiz, false));

        $entregaQuiz->refresh();
        $this->assertSame('entregada', $entregaQuiz->estado);
        $this->assertNull($entregaQuiz->calificacion);
        $this->assertSame(1, $entregaQuiz->intentos_usados);

        // 3) Profesor devuelve la entrega para corrección y se notifica al estudiante.
        $this->actingAs($profesor)
            ->putJson(route('profesor.entregas.extender', $entregaQuiz), [
                'tipo' => 'devolver',
                'nota_devolucion' => 'Corrige la respuesta abierta con más detalle.',
            ])
            ->assertOk()
            ->assertJson(['success' => true]);

        $entregaQuiz->refresh();
        $this->assertSame('pendiente', $entregaQuiz->estado);
        $this->assertNull($entregaQuiz->fecha_entrega);
        $this->assertSame('Corrige la respuesta abierta con más detalle.', $entregaQuiz->nota_devolucion);

        $this->assertDatabaseHas('notificaciones', [
            'user_id' => $estudiante->id,
            'tipo' => 'actividad',
            'titulo' => 'Actividad devuelta para corrección',
        ]);

        // 4) Estudiante reenvía tras la devolución.
        $this->actingAs($estudiante)
            ->post(route('estudiante.actividades.quiz', $actividadQuiz), [
                'respuestas' => [
                    $preguntaSeleccion->id => $opcionSeleccionCorrecta?->id,
                    $preguntaVF->id => $opcionVFCorrecta?->id,
                    $preguntaAbierta->id => 'Ahora explico paso a paso y validación final.',
                ],
            ])
            ->assertRedirect(route('estudiante.actividades.show', $actividadQuiz, false));

        $entregaQuiz->refresh();
        $this->assertSame('entregada', $entregaQuiz->estado);
        $this->assertNull($entregaQuiz->nota_devolucion);
        $this->assertSame(2, $entregaQuiz->intentos_usados);

        // 5) Profesor califica la entrega reenviada.
        $this->actingAs($profesor)
            ->postJson(route('profesor.actividades.calificar', $actividadQuiz), [
                'calificaciones' => [
                    [
                        'entrega_id' => $entregaQuiz->id,
                        'calificacion' => 4.6,
                        'retroalimentacion' => 'Buena corrección y mejor argumentación.',
                    ],
                ],
            ])
            ->assertOk()
            ->assertJson([
                'success' => true,
                'saved' => 1,
            ]);

        $entregaQuiz->refresh();
        $this->assertSame('calificada', $entregaQuiz->estado);
        $this->assertSame(4.6, (float) $entregaQuiz->calificacion);
        $this->assertSame('Buena corrección y mejor argumentación.', $entregaQuiz->retroalimentacion);

        // 6) Crear tarea con fecha vencida pero permitiendo entrega tardía.
        $this->actingAs($profesor)
            ->post(route('profesor.actividades.store'), [
                'curso_materia_id' => $cursoMateria->id,
                'titulo' => 'Tarea con entrega tardía',
                'descripcion' => 'Se debe aceptar fuera de la fecha límite.',
                'tipo' => 'tarea',
                'fecha_entrega' => now()->subDay()->format('Y-m-d H:i:s'),
                'porcentaje' => 10,
                'activa' => true,
                'permite_entrega_tardia' => true,
            ])
            ->assertRedirect('/profesor/actividades');

        $actividadTardia = Actividad::where('titulo', 'Tarea con entrega tardía')->firstOrFail();

        $entregaTardia = Entrega::where('actividad_id', $actividadTardia->id)
            ->where('estudiante_id', $estudiante->id)
            ->firstOrFail();

        $this->assertSame('pendiente', $entregaTardia->estado);

        // 7) Estudiante entrega tarde y luego profesor califica.
        $this->actingAs($estudiante)
            ->post(route('estudiante.actividades.entregar', $actividadTardia), [
                'contenido' => 'Entrega fuera del plazo con justificación.',
            ])
            ->assertRedirect(route('estudiante.actividades.show', $actividadTardia, false));

        $entregaTardia->refresh();
        $this->assertSame('atrasada', $entregaTardia->estado);
        $this->assertNotNull($entregaTardia->fecha_entrega);

        $this->actingAs($profesor)
            ->postJson(route('profesor.actividades.calificar', $actividadTardia), [
                'calificaciones' => [
                    [
                        'entrega_id' => $entregaTardia->id,
                        'calificacion' => 3.8,
                        'retroalimentacion' => 'Aceptada tarde, pero cumple criterios mínimos.',
                    ],
                ],
            ])
            ->assertOk()
            ->assertJson([
                'success' => true,
                'saved' => 1,
            ]);

        $entregaTardia->refresh();
        $this->assertSame('calificada', $entregaTardia->estado);
        $this->assertSame(3.8, (float) $entregaTardia->calificacion);

        $this->assertGreaterThanOrEqual(
            1,
            Notificacion::where('user_id', $estudiante->id)
                ->where('tipo', 'actividad')
                ->count()
        );
    }
}
