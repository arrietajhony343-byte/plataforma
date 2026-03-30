<?php

namespace Database\Seeders;

use App\Models\Curso;
use App\Models\CursoMateria;
use App\Models\Sede;
use App\Models\User;
use Illuminate\Database\Seeder;

class AssignKarinaTransicionBSeeder extends Seeder
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

        // Priorizar el perfil docente cuando exista duplicado (madre + docente).
        $karina = User::query()
            ->whereRaw('LOWER(name) like ?', ['%karina%pajaro%'])
            ->role('profesor')
            ->get()
            ->sortBy(function (User $user) {
                return $user->hasRole('padre') ? 1 : 0;
            })
            ->first();

        if (!$karina) {
            $karina = User::query()
                ->whereRaw('LOWER(name) like ?', ['%karina%pajaro%'])
                ->first();
        }

        if (!$karina) {
            $this->command?->error('No se encontro perfil de Karina Pajaro para asignar.');
            return;
        }

        $karina->name = 'Karina Pájaro';
        $karina->tipo_documento = 'CC';
        $karina->activo = true;
        $karina->must_change_password = false;
        $karina->sede_id = $sedePrimavera->id;
        $karina->save();
        $karina->assignRole('profesor');

        $curso = Curso::query()
            ->where('sede_id', $sedePrimavera->id)
            ->where(function ($q) {
                $q->where('nombre', 'Transición B')
                    ->orWhere('nombre', 'Transicion B');
            })
            ->first();

        if (!$curso) {
            $this->command?->error('No se encontro el curso Transición B en sede Primavera.');
            return;
        }

        $curso->director_grupo_id = $karina->id;
        $curso->save();

        $updated = CursoMateria::query()
            ->where('curso_id', $curso->id)
            ->update(['profesor_id' => $karina->id]);

        $this->command?->info('Asignacion de Karina a Transición B finalizada.');
        $this->command?->info('Docente ID: ' . $karina->id);
        $this->command?->info('Curso director: ' . $curso->nombre . ' (ID ' . $curso->id . ')');
        $this->command?->info('Curso-materia reasignados: ' . $updated);
    }
}
