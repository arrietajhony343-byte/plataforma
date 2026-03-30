<?php

namespace Database\Seeders;

use App\Models\Curso;
use App\Models\HorarioBloque;
use App\Models\Jornada;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SyncHorariosJornadaInicialPrimaveraSeeder extends Seeder
{
    public function run(): void
    {
        Jornada::updateOrCreate(
            ['nivel' => 'prejardin'],
            [
                'bloques' => [
                    ['hora' => '07:30', 'horaFin' => '08:20', 'esDescanso' => false],
                    ['hora' => '08:20', 'horaFin' => '09:10', 'esDescanso' => false],
                    ['hora' => '09:10', 'horaFin' => '10:00', 'esDescanso' => false],
                    ['hora' => '10:00', 'horaFin' => '10:30', 'esDescanso' => true],
                    ['hora' => '10:30', 'horaFin' => '11:20', 'esDescanso' => false],
                    ['hora' => '11:20', 'horaFin' => '12:00', 'esDescanso' => false],
                ],
            ]
        );

        // Nota: "Comunidad" no se registra como materia/bloque académico.
        $sharedRows = [
            ['dia' => 'lunes', 'inicio' => '07:30', 'fin' => '08:20', 'materia' => 'Integrado 1 Sociales'],
            ['dia' => 'martes', 'inicio' => '07:30', 'fin' => '08:20', 'materia' => 'Pre-escritura'],
            ['dia' => 'miercoles', 'inicio' => '07:30', 'fin' => '08:20', 'materia' => 'Integrado 1 Sociales'],
            ['dia' => 'jueves', 'inicio' => '07:30', 'fin' => '08:20', 'materia' => 'Integrado 1 Naturales'],
            ['dia' => 'viernes', 'inicio' => '07:30', 'fin' => '08:20', 'materia' => 'Matematicas'],

            ['dia' => 'lunes', 'inicio' => '08:20', 'fin' => '09:10', 'materia' => 'Integrado 2 Etica'],
            ['dia' => 'martes', 'inicio' => '08:20', 'fin' => '09:10', 'materia' => 'Arte'],
            ['dia' => 'miercoles', 'inicio' => '08:20', 'fin' => '09:10', 'materia' => 'Matematicas'],
            ['dia' => 'jueves', 'inicio' => '08:20', 'fin' => '09:10', 'materia' => 'Integrado 3 Informatica'],

            ['dia' => 'lunes', 'inicio' => '09:10', 'fin' => '10:00', 'materia' => 'Ingles'],
            ['dia' => 'martes', 'inicio' => '09:10', 'fin' => '10:00', 'materia' => 'Ingles'],
            ['dia' => 'miercoles', 'inicio' => '09:10', 'fin' => '10:00', 'materia' => 'Ingles'],
            ['dia' => 'jueves', 'inicio' => '09:10', 'fin' => '10:00', 'materia' => 'Ingles'],
            ['dia' => 'viernes', 'inicio' => '09:10', 'fin' => '10:00', 'materia' => 'Ingles'],
        ];

        $courseRows = [
            // Pre Jardín B
            28 => array_merge($sharedRows, [
                ['dia' => 'viernes', 'inicio' => '08:20', 'fin' => '09:10', 'materia' => 'Educacion Fisica'],

                ['dia' => 'lunes', 'inicio' => '10:30', 'fin' => '11:20', 'materia' => 'Emprendimiento'],
                ['dia' => 'martes', 'inicio' => '10:30', 'fin' => '11:20', 'materia' => 'Integrado 2 Religion'],
                ['dia' => 'miercoles', 'inicio' => '10:30', 'fin' => '11:20', 'materia' => 'Integrado 3 Informatica'],
                ['dia' => 'jueves', 'inicio' => '10:30', 'fin' => '11:20', 'materia' => 'Matematicas'],
                ['dia' => 'viernes', 'inicio' => '10:30', 'fin' => '11:20', 'materia' => 'Pre-escritura'],

                ['dia' => 'lunes', 'inicio' => '11:20', 'fin' => '12:00', 'materia' => 'Arte'],
                ['dia' => 'martes', 'inicio' => '11:20', 'fin' => '12:00', 'materia' => 'Matematicas'],
                ['dia' => 'miercoles', 'inicio' => '11:20', 'fin' => '12:00', 'materia' => 'Educacion Fisica'],
                ['dia' => 'jueves', 'inicio' => '11:20', 'fin' => '12:00', 'materia' => 'Pre-escritura'],
                ['dia' => 'viernes', 'inicio' => '11:20', 'fin' => '12:00', 'materia' => 'Integrado 1 Naturales'],
            ]),

            // Jardín B
            29 => array_merge($sharedRows, [
                ['dia' => 'viernes', 'inicio' => '08:20', 'fin' => '09:10', 'materia' => 'Integrado 1 Naturales'],

                ['dia' => 'lunes', 'inicio' => '10:30', 'fin' => '11:20', 'materia' => 'Emprendimiento'],
                ['dia' => 'martes', 'inicio' => '10:30', 'fin' => '11:20', 'materia' => 'Integrado 2 Religion'],
                ['dia' => 'miercoles', 'inicio' => '10:30', 'fin' => '11:20', 'materia' => 'Integrado 3 Informatica'],
                ['dia' => 'jueves', 'inicio' => '10:30', 'fin' => '11:20', 'materia' => 'Matematicas'],
                ['dia' => 'viernes', 'inicio' => '10:30', 'fin' => '11:20', 'materia' => 'Pre-escritura'],

                ['dia' => 'lunes', 'inicio' => '11:20', 'fin' => '12:00', 'materia' => 'Arte'],
                ['dia' => 'martes', 'inicio' => '11:20', 'fin' => '12:00', 'materia' => 'Educacion Fisica'],
                ['dia' => 'miercoles', 'inicio' => '11:20', 'fin' => '12:00', 'materia' => 'Matematicas'],
                ['dia' => 'jueves', 'inicio' => '11:20', 'fin' => '12:00', 'materia' => 'Pre-escritura'],
                ['dia' => 'viernes', 'inicio' => '11:20', 'fin' => '12:00', 'materia' => 'Educacion Fisica'],
            ]),

            // Transición B
            30 => array_merge($sharedRows, [
                ['dia' => 'viernes', 'inicio' => '08:20', 'fin' => '09:10', 'materia' => 'Integrado 1 Naturales'],

                ['dia' => 'lunes', 'inicio' => '10:30', 'fin' => '11:20', 'materia' => 'Arte'],
                ['dia' => 'martes', 'inicio' => '10:30', 'fin' => '11:20', 'materia' => 'Matematicas'],
                ['dia' => 'miercoles', 'inicio' => '10:30', 'fin' => '11:20', 'materia' => 'Integrado 3 Informatica'],
                ['dia' => 'jueves', 'inicio' => '10:30', 'fin' => '11:20', 'materia' => 'Educacion Fisica'],
                ['dia' => 'viernes', 'inicio' => '10:30', 'fin' => '11:20', 'materia' => 'Pre-escritura'],

                ['dia' => 'lunes', 'inicio' => '11:20', 'fin' => '12:00', 'materia' => 'Emprendimiento'],
                ['dia' => 'martes', 'inicio' => '11:20', 'fin' => '12:00', 'materia' => 'Integrado 2 Religion'],
                ['dia' => 'miercoles', 'inicio' => '11:20', 'fin' => '12:00', 'materia' => 'Matematicas'],
                ['dia' => 'jueves', 'inicio' => '11:20', 'fin' => '12:00', 'materia' => 'Educacion Fisica'],
                ['dia' => 'viernes', 'inicio' => '11:20', 'fin' => '12:00', 'materia' => 'Pre-escritura'],
            ]),
        ];

        $inserted = 0;
        foreach ($courseRows as $courseId => $rows) {
            $curso = Curso::query()->find($courseId);
            if (!$curso) {
                $this->command?->warn("Curso ID {$courseId} no existe, se omite.");
                continue;
            }

            $map = $curso->cursoMaterias()
                ->with('materia:id,nombre')
                ->get()
                ->mapWithKeys(function ($cm) {
                    return [$this->key($cm->materia?->nombre ?? '') => $cm->id];
                })
                ->toArray();

            $cmIds = array_values($map);
            if (!empty($cmIds)) {
                HorarioBloque::query()->whereIn('curso_materia_id', $cmIds)->delete();
            }

            foreach ($rows as $row) {
                $key = $this->key($row['materia']);
                $cmId = $map[$key] ?? null;
                if (!$cmId) {
                    $this->command?->warn("Materia '{$row['materia']}' no encontrada en curso {$curso->nombre}.");
                    continue;
                }

                HorarioBloque::query()->create([
                    'curso_materia_id' => $cmId,
                    'dia' => $row['dia'],
                    'hora_inicio' => $row['inicio'],
                    'hora_fin' => $row['fin'],
                    'salon' => null,
                ]);
                $inserted++;
            }
        }

        $this->command?->info('Sincronizacion de jornadas y horarios B (Primavera) finalizada.');
        $this->command?->info('Bloques insertados: ' . $inserted);
    }

    private function key(string $value): string
    {
        $ascii = Str::ascii(Str::lower(trim($value)));
        $ascii = preg_replace('/\s+/', ' ', $ascii) ?? $ascii;
        return preg_replace('/[^a-z0-9 ]/', '', $ascii) ?? '';
    }
}
