<?php

namespace Database\Seeders;

use App\Models\Curso;
use App\Models\CursoMateria;
use App\Models\Sede;
use App\Models\User;
use Illuminate\Database\Seeder;

class AssignZulaisJardinBSeeder extends Seeder
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

        $zulais = User::query()->where('documento', '1002411272')->first();
        if (!$zulais) {
            $this->command?->error('No existe la docente con documento 1002411272.');
            return;
        }

        $zulais->name = 'Zulais Isabel Cervantes Cabrera';
        $zulais->tipo_documento = 'CC';
        $zulais->activo = true;
        $zulais->must_change_password = false;
        $zulais->sede_id = $sedePrimavera->id;
        $zulais->save();
        $zulais->assignRole('profesor');

        $curso = Curso::query()
            ->where('sede_id', $sedePrimavera->id)
            ->where(function ($q) {
                $q->where('nombre', 'Jardín B')
                    ->orWhere('nombre', 'Jardin B');
            })
            ->first();

        if (!$curso) {
            $this->command?->error('No se encontro el curso Jardín B en sede Primavera.');
            return;
        }

        $curso->director_grupo_id = $zulais->id;
        $curso->save();

        $updated = CursoMateria::query()
            ->where('curso_id', $curso->id)
            ->update(['profesor_id' => $zulais->id]);

        $this->command?->info('Asignacion de Zulais a Jardín B finalizada.');
        $this->command?->info('Docente ID: ' . $zulais->id);
        $this->command?->info('Curso director: ' . $curso->nombre . ' (ID ' . $curso->id . ')');
        $this->command?->info('Curso-materia reasignados: ' . $updated);
    }
}
