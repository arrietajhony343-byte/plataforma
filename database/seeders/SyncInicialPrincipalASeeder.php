<?php

namespace Database\Seeders;

use App\Models\Curso;
use App\Models\CursoMateria;
use App\Models\HorarioBloque;
use App\Models\Sede;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SyncInicialPrincipalASeeder extends Seeder
{
    public function run(): void
    {
        $sedePrincipal = Sede::query()
            ->whereRaw('LOWER(nombre) = ?', ['principal'])
            ->first();

        $sedePrimavera = Sede::query()
            ->whereRaw('LOWER(nombre) = ?', ['primavera'])
            ->first();

        if (!$sedePrincipal || !$sedePrimavera) {
            $this->command?->error('No se encontraron las sedes Principal y/o Primavera.');
            return;
        }

        $anela = User::query()
            ->where('documento', '1102574905')
            ->orWhere('email', 'uparelaalena051@gmail.com')
            ->first();

        $lissy = User::query()
            ->where('documento', '1143377320')
            ->orWhereRaw('LOWER(name) = ?', ['lissy carolina romero palomino'])
            ->first();

        if (!$anela || !$lissy) {
            $this->command?->error('No se encontraron las docentes Anela y/o Lissy.');
            return;
        }

        foreach ([$anela, $lissy] as $docente) {
            $docente->activo = true;
            $docente->must_change_password = false;
            $docente->sede_id = $sedePrincipal->id;
            $docente->save();
            $docente->assignRole('profesor');
        }

        $pairs = [
            [
                'source' => ['Pre Jardín B', 'Pre Jardin B'],
                'target' => ['Pre Jardín A', 'Pre Jardin A'],
                'docente_id' => $anela->id,
                'label' => 'Pre Jardin A',
            ],
            [
                'source' => ['Jardín B', 'Jardin B'],
                'target' => ['Jardín A', 'Jardin A'],
                'docente_id' => $anela->id,
                'label' => 'Jardin A',
            ],
            [
                'source' => ['Transición B', 'Transicion B'],
                'target' => ['Transición A', 'Transicion A'],
                'docente_id' => $lissy->id,
                'label' => 'Transicion A',
            ],
        ];

        $totalInsertados = 0;

        foreach ($pairs as $pair) {
            $sourceCurso = $this->findCursoByNames($pair['source'], (int) $sedePrimavera->id);
            $targetCurso = $this->findCursoByNames($pair['target'], (int) $sedePrincipal->id);

            if (!$sourceCurso || !$targetCurso) {
                $this->command?->warn('No se pudo mapear par de cursos para ' . $pair['label'] . '.');
                continue;
            }

            $targetCurso->director_grupo_id = $pair['docente_id'];
            $targetCurso->save();

            CursoMateria::query()
                ->where('curso_id', $targetCurso->id)
                ->update(['profesor_id' => $pair['docente_id']]);

            $sourceCMs = $sourceCurso->cursoMaterias()->with('materia:id,nombre')->get();
            $targetCMs = $targetCurso->cursoMaterias()->with('materia:id,nombre')->get();

            $sourceMateriaByCMId = $sourceCMs
                ->mapWithKeys(fn ($cm) => [$cm->id => $this->key((string) ($cm->materia?->nombre ?? ''))])
                ->toArray();

            $targetCMIdByMateriaKey = $targetCMs
                ->mapWithKeys(fn ($cm) => [$this->key((string) ($cm->materia?->nombre ?? '')) => $cm->id])
                ->toArray();

            $targetCMIds = $targetCMs->pluck('id')->all();
            if (!empty($targetCMIds)) {
                HorarioBloque::query()->whereIn('curso_materia_id', $targetCMIds)->delete();
            }

            $sourceCMIds = $sourceCMs->pluck('id')->all();
            if (empty($sourceCMIds)) {
                $this->command?->warn('Curso origen sin materias: ' . $sourceCurso->nombre);
                continue;
            }

            $sourceBlocks = HorarioBloque::query()
                ->whereIn('curso_materia_id', $sourceCMIds)
                ->orderBy('dia')
                ->orderBy('hora_inicio')
                ->get();

            $insertadosCurso = 0;
            foreach ($sourceBlocks as $block) {
                $materiaKey = $sourceMateriaByCMId[$block->curso_materia_id] ?? null;
                $targetCMId = $materiaKey ? ($targetCMIdByMateriaKey[$materiaKey] ?? null) : null;

                if (!$targetCMId) {
                    $this->command?->warn('Materia sin equivalente en ' . $targetCurso->nombre . ' para bloque ID ' . $block->id);
                    continue;
                }

                HorarioBloque::query()->create([
                    'curso_materia_id' => $targetCMId,
                    'dia' => $block->dia,
                    'hora_inicio' => $block->hora_inicio,
                    'hora_fin' => $block->hora_fin,
                    'salon' => $block->salon,
                ]);

                $insertadosCurso++;
            }

            $totalInsertados += $insertadosCurso;
            $this->command?->info($targetCurso->nombre . ': bloques sincronizados=' . $insertadosCurso . ', directora_id=' . $pair['docente_id']);
        }

        $this->command?->info('Sincronizacion Principal A completada. Bloques insertados: ' . $totalInsertados);
    }

    private function findCursoByNames(array $names, int $sedeId): ?Curso
    {
        return Curso::query()
            ->where('sede_id', $sedeId)
            ->where('activo', true)
            ->where(function ($q) use ($names) {
                foreach ($names as $name) {
                    $q->orWhere('nombre', $name);
                }
            })
            ->first();
    }

    private function key(string $value): string
    {
        $ascii = Str::ascii(Str::lower(trim($value)));
        $ascii = preg_replace('/\s+/', ' ', $ascii) ?? $ascii;
        return preg_replace('/[^a-z0-9 ]/', '', $ascii) ?? '';
    }
}
