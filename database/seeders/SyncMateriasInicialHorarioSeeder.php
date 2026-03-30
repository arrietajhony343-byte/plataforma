<?php

namespace Database\Seeders;

use App\Models\Curso;
use App\Models\CursoMateria;
use App\Models\Materia;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SyncMateriasInicialHorarioSeeder extends Seeder
{
    public function run(): void
    {
        $targets = [
            ['nombre' => 'Comunidad', 'area' => 'Convivencia', 'codigo' => 'COM', 'horas' => 5],
            ['nombre' => 'Pre-escritura', 'area' => 'Humanidades', 'codigo' => 'PREESC', 'horas' => 3],
            ['nombre' => 'Integrado 1 Sociales', 'area' => 'Integrado Inicial', 'codigo' => 'INT1SOC', 'horas' => 2],
            ['nombre' => 'Integrado 1 Naturales', 'area' => 'Integrado Inicial', 'codigo' => 'INT1NAT', 'horas' => 2],
            ['nombre' => 'Integrado 2 Etica', 'area' => 'Integrado Inicial', 'codigo' => 'INT2ETI', 'horas' => 1],
            ['nombre' => 'Integrado 2 Religion', 'area' => 'Integrado Inicial', 'codigo' => 'INT2REL', 'horas' => 1],
            ['nombre' => 'Integrado 3 Informatica', 'area' => 'Integrado Inicial', 'codigo' => 'INT3INF', 'horas' => 2],
            ['nombre' => 'Arte', 'area' => 'Artes', 'codigo' => 'ART', 'horas' => 2],
            ['nombre' => 'Matematicas', 'area' => 'Ciencias Exactas', 'codigo' => 'MAT', 'horas' => 4],
            ['nombre' => 'Educacion Fisica', 'area' => 'Educacion Fisica', 'codigo' => 'EDF', 'horas' => 2],
            ['nombre' => 'Ingles', 'area' => 'Humanidades', 'codigo' => 'ING', 'horas' => 5],
            ['nombre' => 'Emprendimiento', 'area' => 'Ciencias Sociales', 'codigo' => 'EMP', 'horas' => 1],
        ];

        $existing = Materia::query()->get();
        $byKey = [];
        foreach ($existing as $materia) {
            $byKey[$this->key($materia->nombre)] = $materia;
        }

        $materias = [];
        $created = 0;
        $reused = 0;

        foreach ($targets as $target) {
            $key = $this->key($target['nombre']);
            $materia = $byKey[$key] ?? null;

            if (!$materia) {
                $materia = Materia::query()->create([
                    'nombre' => $target['nombre'],
                    'area' => $target['area'],
                    'codigo' => $this->uniqueCodigo($target['codigo']),
                    'horas_semanales' => $target['horas'],
                    'activa' => true,
                ]);
                $created++;
                $byKey[$key] = $materia;
            } else {
                $reused++;
                if (!$materia->activa) {
                    $materia->activa = true;
                    $materia->save();
                }
            }

            $materias[] = [
                'id' => $materia->id,
                'horas' => $target['horas'],
                'nombre' => $target['nombre'],
            ];
        }

        $cursos = Curso::query()
            ->where('nivel', 'prejardin')
            ->whereIn('grado', ['Pre-jardin', 'Pre-jardín', 'Jardin', 'Jardín', 'Trans', 'Transicion', 'Transición'])
            ->get();

        $defaultProfesorId = User::query()->role('profesor')->orderBy('id')->value('id');
        if (!$defaultProfesorId) {
            $this->command?->error('No hay usuarios con rol profesor para asignar en curso_materia.');
            return;
        }

        $linksCreated = 0;
        $linksExisting = 0;

        foreach ($cursos as $curso) {
            foreach ($materias as $materia) {
                $exists = CursoMateria::query()
                    ->where('curso_id', $curso->id)
                    ->where('materia_id', $materia['id'])
                    ->exists();

                if ($exists) {
                    $linksExisting++;
                    continue;
                }

                CursoMateria::query()->create([
                    'curso_id' => $curso->id,
                    'materia_id' => $materia['id'],
                    'profesor_id' => $defaultProfesorId,
                    'horas_semanales' => $materia['horas'],
                ]);
                $linksCreated++;
            }
        }

        $this->command?->info('Sincronizacion de materias iniciales finalizada.');
        $this->command?->info('Materias creadas: ' . $created);
        $this->command?->info('Materias reutilizadas: ' . $reused);
        $this->command?->info('Cursos objetivo (prejardin): ' . $cursos->count());
        $this->command?->info('Relaciones curso_materia creadas: ' . $linksCreated);
        $this->command?->info('Relaciones curso_materia ya existentes: ' . $linksExisting);
    }

    private function key(string $value): string
    {
        $value = Str::ascii(Str::lower(trim($value)));
        $value = preg_replace('/\s+/', ' ', $value) ?? $value;
        return preg_replace('/[^a-z0-9 ]/', '', $value) ?? '';
    }

    private function uniqueCodigo(string $base): string
    {
        $candidate = Str::upper($base);
        if (!Materia::query()->where('codigo', $candidate)->exists()) {
            return $candidate;
        }

        $i = 2;
        while (Materia::query()->where('codigo', $candidate . $i)->exists()) {
            $i++;
        }

        return $candidate . $i;
    }
}
