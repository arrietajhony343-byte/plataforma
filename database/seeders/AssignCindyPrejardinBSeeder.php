<?php

namespace Database\Seeders;

use App\Models\Curso;
use App\Models\CursoMateria;
use App\Models\Materia;
use App\Models\Sede;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AssignCindyPrejardinBSeeder extends Seeder
{
    public function run(): void
    {
        $sedePrimavera = Sede::query()
            ->whereRaw('LOWER(nombre) = ?', ['primavera'])
            ->first();

        if (!$sedePrimavera) {
            $this->command?->error('No existe la sede Primavera.');
            return;
        }

        $cindy = User::query()->where('documento', '1050959710')->first();
        $isNew = false;

        if (!$cindy) {
            $cindy = new User();
            $cindy->documento = '1050959710';
            $cindy->password = Hash::make('1050959710');
            $isNew = true;
        }

        $cindy->name = 'Cindy Milena Cordoba Medina';
        $cindy->email = 'cindycordoba053@gmail.com';
        $cindy->tipo_documento = 'CC';
        $cindy->telefono = '3232003052';
        $cindy->activo = true;
        $cindy->must_change_password = false;
        $cindy->sede_id = $sedePrimavera->id;
        $cindy->email_verified_at = $cindy->email_verified_at ?? now();
        $cindy->save();
        $cindy->assignRole('profesor');

        $curso = Curso::query()
            ->where('sede_id', $sedePrimavera->id)
            ->where(function ($q) {
                $q->where('nombre', 'Pre Jardín B')
                    ->orWhere('nombre', 'Pre Jardin B');
            })
            ->first();

        if (!$curso) {
            $this->command?->error('No se encontro el curso Pre Jardín B en sede Primavera.');
            return;
        }

        $curso->director_grupo_id = $cindy->id;
        $curso->save();

        $targets = [
            ['nombre' => 'Comunidad', 'area' => 'Convivencia', 'horas' => 5],
            ['nombre' => 'Pre-escritura', 'area' => 'Humanidades', 'horas' => 3],
            ['nombre' => 'Integrado 1 Sociales', 'area' => 'Integrado Inicial', 'horas' => 2],
            ['nombre' => 'Integrado 1 Naturales', 'area' => 'Integrado Inicial', 'horas' => 2],
            ['nombre' => 'Integrado 2 Etica', 'area' => 'Integrado Inicial', 'horas' => 1],
            ['nombre' => 'Integrado 2 Religion', 'area' => 'Integrado Inicial', 'horas' => 1],
            ['nombre' => 'Integrado 3 Informatica', 'area' => 'Integrado Inicial', 'horas' => 2],
            ['nombre' => 'Arte', 'area' => 'Artes', 'horas' => 2],
            ['nombre' => 'Matematicas', 'area' => 'Ciencias Exactas', 'horas' => 4],
            ['nombre' => 'Educacion Fisica', 'area' => 'Educacion Fisica', 'horas' => 2],
            ['nombre' => 'Ingles', 'area' => 'Humanidades', 'horas' => 5],
            ['nombre' => 'Emprendimiento', 'area' => 'Ciencias Sociales', 'horas' => 1],
        ];

        $existingMaterias = Materia::query()->get();
        $byKey = [];
        foreach ($existingMaterias as $materia) {
            $byKey[$this->key($materia->nombre)] = $materia;
        }

        $createdLinks = 0;
        $updatedLinks = 0;

        foreach ($targets as $target) {
            $materia = $byKey[$this->key($target['nombre'])] ?? null;
            if (!$materia) {
                $materia = Materia::query()->create([
                    'nombre' => $target['nombre'],
                    'area' => $target['area'],
                    'codigo' => $this->codigoFromName($target['nombre']),
                    'horas_semanales' => $target['horas'],
                    'activa' => true,
                ]);
            }

            $cm = CursoMateria::query()->firstOrNew([
                'curso_id' => $curso->id,
                'materia_id' => $materia->id,
            ]);

            $wasExisting = $cm->exists;
            $cm->profesor_id = $cindy->id;
            $cm->horas_semanales = $target['horas'];
            $cm->save();

            if ($wasExisting) {
                $updatedLinks++;
            } else {
                $createdLinks++;
            }
        }

        CursoMateria::query()
            ->where('curso_id', $curso->id)
            ->update(['profesor_id' => $cindy->id]);

        $this->command?->info('Asignacion de Cindy a Pre Jardín B finalizada.');
        $this->command?->info('Usuario docente ' . ($isNew ? 'creado' : 'actualizado') . ': ' . $cindy->id);
        $this->command?->info('Curso director asignado: ' . $curso->nombre . ' (ID ' . $curso->id . ')');
        $this->command?->info('Curso-materia creados: ' . $createdLinks);
        $this->command?->info('Curso-materia actualizados: ' . $updatedLinks);
    }

    private function key(string $value): string
    {
        $value = Str::ascii(Str::lower(trim($value)));
        $value = preg_replace('/\s+/', ' ', $value) ?? $value;
        return preg_replace('/[^a-z0-9 ]/', '', $value) ?? '';
    }

    private function codigoFromName(string $name): string
    {
        $raw = Str::upper(Str::ascii($name));
        $raw = preg_replace('/[^A-Z0-9]+/', '', $raw) ?? 'MAT';
        $base = substr($raw, 0, 10);
        if ($base === '') {
            $base = 'MAT';
        }

        if (!Materia::query()->where('codigo', $base)->exists()) {
            return $base;
        }

        $i = 2;
        while (Materia::query()->where('codigo', $base . $i)->exists()) {
            $i++;
        }

        return $base . $i;
    }
}
