<?php

namespace Database\Seeders;

use App\Models\{Curso, Matricula, Periodo, Sede, User};
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ImportPreescolarPrincipalSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            [
                'estudiante' => 'MAXIMILIANO LEIVA MONTERROSA',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1238349671',
                'acudiente' => 'LINA MARCELA MONTERROSA JARAMILLO',
                'doc_acudiente' => '1047428107',
                'telefono' => '3135016466',
            ],
            [
                'estudiante' => 'MARYSOL SOPHIA CARBONEL VILLARREAL',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1201289616',
                'acudiente' => 'LORENA VANESSA VILLARREAL TUIRAN',
                'doc_acudiente' => '1143412896',
                'telefono' => '3016660670',
            ],
            [
                'estudiante' => 'LIAM DAVID CARDOZA FRANCO',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1201287994',
                'acudiente' => 'LAURA STEFANY FRANCO BLANCO',
                'doc_acudiente' => '1047488358',
                'telefono' => '3003739551',
            ],
            [
                'estudiante' => 'ANDRES MIGUEL ALVAREZ GUTIERREZ',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1143422672',
                'acudiente' => 'VALENTINA GUTIERREZ PORTELA',
                'doc_acudiente' => '1002495056',
                'telefono' => '3042567410',
            ],
            [
                'estudiante' => 'SALOMON JOSE JIMENEZ BARBUDO',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1043342619',
                'acudiente' => 'KARIME DEL CARMEN BARBUDO DUARTE',
                'doc_acudiente' => '1007802357',
                'telefono' => '3044264295',
            ],
            [
                'estudiante' => 'ANDRES FELIPE THORRENS NEGRETE',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1062548887',
                'acudiente' => 'CINDY ROCIO NEGRETE ARROYAVE',
                'doc_acudiente' => '1067910151',
                'telefono' => '3145813615',
            ],
            [
                'estudiante' => 'ADALBERTO PEREZ ANAYA',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1043341748',
                'acudiente' => 'SHEYLA PAOLA ANAYA ROMERO',
                'doc_acudiente' => '1002185499',
                'telefono' => '3215787792',
            ],
            [
                'estudiante' => 'ANTHONY SANCHEZ ARDILA',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1043340800',
                'acudiente' => 'YIARA GABRIELA ARDILA JIMENEZ',
                'doc_acudiente' => '1058667745',
                'telefono' => '3016615815',
            ],
            [
                'estudiante' => 'ALHAN ENRIQUE AREVALO GUARDO',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1044017846',
                'acudiente' => 'LIA MERCEDES GUARDO TORRES',
                'doc_acudiente' => '1143392606',
                'telefono' => '3014535970',
            ],
            [
                'estudiante' => 'MARIA CLAUDIA CANTILLO PEREZ',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1238348877',
                'acudiente' => 'MIRLENES PAOLA PEREZ ARTUZ',
                'doc_acudiente' => '1047422082',
                'telefono' => '3118028021',
            ],
            [
                'estudiante' => 'SIERRA PEREZ JUAN PABLO ANGEL',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1044942272',
                'acudiente' => 'ANA KARINA PEREZ ORTIZ',
                'doc_acudiente' => '1044916747',
                'telefono' => '3004324895',
            ],
        ];

        $this->importDataset($rows, [
            'nombre' => 'Preescolar A',
            'nivel' => 'prejardin',
            'grado' => 'Jardín',
            'grupo' => 'A',
            'jornada' => 'mañana',
        ]);
    }

    protected function importDataset(array $rows, array $courseConfig): void
    {
        $sedePrincipal = Sede::query()
            ->whereRaw('LOWER(nombre) = ?', ['principal'])
            ->first();

        if (!$sedePrincipal) {
            $sedePrincipal = Sede::query()->create([
                'nombre' => 'Principal',
                'activa' => true,
            ]);
        }

        $periodo = Periodo::query()
            ->where('estado', 'activo')
            ->orderByDesc('id')
            ->first() ?? Periodo::query()->orderByDesc('id')->first();

        if (!$periodo) {
            $this->command?->error('No existe ningun periodo para crear matriculas.');
            return;
        }

        $curso = Curso::query()
            ->where('sede_id', $sedePrincipal->id)
            ->where('nombre', $courseConfig['nombre'])
            ->where('anio', $periodo->anio)
            ->first();

        if (!$curso) {
            $curso = Curso::query()->create([
                'nombre' => $courseConfig['nombre'],
                'nivel' => $courseConfig['nivel'],
                'grado' => $courseConfig['grado'],
                'grupo' => $courseConfig['grupo'],
                'jornada' => $courseConfig['jornada'],
                'anio' => $periodo->anio,
                'cupo_maximo' => 35,
                'activo' => true,
                'sede_id' => $sedePrincipal->id,
            ]);
        }

        $createdStudents = 0;
        $createdParents = 0;
        $linked = 0;

        foreach ($rows as $row) {
            $telefono = $this->normalizePhone($row['telefono']);

            $acudiente = User::query()->where('documento', $row['doc_acudiente'])->first();
            if (!$acudiente) {
                $acudiente = new User();
                $acudiente->documento = $row['doc_acudiente'];
                $acudiente->email = $this->uniqueEmail($row['acudiente']);
                $acudiente->password = Hash::make($row['doc_acudiente']);
                $createdParents++;
            }

            $acudiente->name = $row['acudiente'];
            $acudiente->tipo_documento = 'CC';
            $acudiente->telefono = $telefono;
            $acudiente->direccion = null;
            $acudiente->fecha_nacimiento = null;
            $acudiente->genero = null;
            $acudiente->activo = true;
            $acudiente->must_change_password = false;
            $acudiente->sede_id = $sedePrincipal->id;
            $acudiente->save();
            $acudiente->syncRoles(['padre']);

            $estudiante = User::query()->where('documento', $row['doc_estudiante'])->first();
            if (!$estudiante) {
                $estudiante = new User();
                $estudiante->documento = $row['doc_estudiante'];
                $estudiante->email = $this->uniqueEmail($row['estudiante']);
                $estudiante->password = Hash::make($row['doc_estudiante']);
                $createdStudents++;
            }

            $estudiante->name = $row['estudiante'];
            $estudiante->tipo_documento = $row['tipo_doc_estudiante'];
            $estudiante->telefono = $telefono;
            $estudiante->direccion = null;
            $estudiante->fecha_nacimiento = '2020-01-01';
            $estudiante->genero = null;
            $estudiante->activo = true;
            $estudiante->must_change_password = false;
            $estudiante->sede_id = $sedePrincipal->id;
            $estudiante->save();
            $estudiante->syncRoles(['estudiante']);

            $exists = $estudiante->padres()->where('users.id', $acudiente->id)->exists();
            if (!$exists) {
                $estudiante->padres()->attach($acudiente->id, ['parentesco' => 'acudiente']);
                $linked++;
            }

            Matricula::query()->updateOrCreate(
                [
                    'estudiante_id' => $estudiante->id,
                    'curso_id' => $curso->id,
                    'periodo_id' => $periodo->id,
                ],
                [
                    'estado' => 'activa',
                    'fecha_matricula' => now()->toDateString(),
                ]
            );
        }

        $this->command?->info('Importacion finalizada.');
        $this->command?->info("Estudiantes nuevos: {$createdStudents}");
        $this->command?->info("Acudientes nuevos: {$createdParents}");
        $this->command?->info("Vinculos creados: {$linked}");
        $this->command?->info('Curso usado: ' . $curso->nombre . ' (ID ' . $curso->id . ', sede ' . $sedePrincipal->nombre . ')');
    }

    protected function normalizePhone(string $raw): ?string
    {
        $digits = preg_replace('/\D+/', '', $raw) ?? '';
        if ($digits === '') {
            return null;
        }

        return substr($digits, 0, 10);
    }

    protected function uniqueEmail(string $fullName): string
    {
        $parts = preg_split('/\s+/', trim(Str::ascii($fullName))) ?: [];
        $first = isset($parts[0]) ? Str::lower($parts[0]) : 'usuario';
        $last = isset($parts[1]) ? Str::lower($parts[1]) : 'estudiante';

        $first = preg_replace('/[^a-z0-9]/', '', $first) ?: 'usuario';
        $last = preg_replace('/[^a-z0-9]/', '', $last) ?: 'estudiante';

        $base = $first . '_' . $last;
        $candidate = $base . '@emprendedores.com';
        $i = 2;

        while (User::query()->where('email', $candidate)->exists()) {
            $candidate = $base . $i . '@emprendedores.com';
            $i++;
        }

        return $candidate;
    }
}
