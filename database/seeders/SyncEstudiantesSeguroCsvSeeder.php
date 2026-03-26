<?php

namespace Database\Seeders;

use App\Models\Curso;
use App\Models\Matricula;
use App\Models\Periodo;
use App\Models\Sede;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SyncEstudiantesSeguroCsvSeeder extends Seeder
{
    private const FALLBACK_GUARDIAN_DOC = 'ACUDIENTE-SIN-ASIGNAR';

    public function run(): void
    {
        $csvPath = database_path('schema/FORMATO ESTUDIANTES SEGURO.csv');
        if (!is_file($csvPath)) {
            $this->command?->error("No se encontro el CSV en: {$csvPath}");
            return;
        }

        $sedePrincipal = Sede::query()->firstOrCreate(
            ['nombre' => 'Principal'],
            ['activa' => true]
        );

        $periodo = Periodo::query()
            ->where('estado', 'activo')
            ->orderByDesc('id')
            ->first() ?? Periodo::query()->orderByDesc('id')->first();

        if (!$periodo) {
            $this->command?->error('No existe ningun periodo para crear matriculas.');
            return;
        }

        [$rows, $skippedRows] = $this->readCsvRows($csvPath);
        if (empty($rows)) {
            $this->command?->warn('No se encontraron filas validas para importar.');
            return;
        }

        $fallbackGuardian = $this->getFallbackGuardian($sedePrincipal);

        $stats = [
            'rows_total' => count($rows),
            'students_existing_by_doc' => 0,
            'students_existing_by_name' => 0,
            'students_created' => 0,
            'students_updated' => 0,
            'docs_corrected' => 0,
            'matriculas_created_or_updated' => 0,
            'matriculas_reassigned' => 0,
            'links_created' => 0,
            'rows_skipped' => $skippedRows,
        ];

        $withoutGuardianRows = [];

        foreach ($rows as $row) {
            $courseConfig = $this->courseConfigForGrade($row['grado_raw']);
            if (!$courseConfig) {
                $stats['rows_skipped']++;
                continue;
            }

            $curso = Curso::query()
                ->where('sede_id', $sedePrincipal->id)
                ->where('grado', $courseConfig['grado'])
                ->where('grupo', 'A')
                ->where('jornada', 'mañana')
                ->where('anio', $periodo->anio)
                ->first();

            if (!$curso) {
                $curso = Curso::query()
                    ->where('sede_id', $sedePrincipal->id)
                    ->where('nombre', $courseConfig['nombre'])
                    ->where('anio', $periodo->anio)
                    ->first();
            }

            if (!$curso) {
                $curso = Curso::query()->create([
                    'nombre' => $courseConfig['nombre'],
                    'nivel' => $courseConfig['nivel'],
                    'grado' => $courseConfig['grado'],
                    'grupo' => 'A',
                    'jornada' => 'mañana',
                    'anio' => $periodo->anio,
                    'cupo_maximo' => 35,
                    'activo' => true,
                    'sede_id' => $sedePrincipal->id,
                ]);
            } else {
                $curso->nombre = $courseConfig['nombre'];
                $curso->nivel = $courseConfig['nivel'];
                $curso->grado = $courseConfig['grado'];
                $curso->grupo = 'A';
                $curso->jornada = 'mañana';
                $curso->anio = $periodo->anio;
                $curso->activo = true;
                $curso->sede_id = $sedePrincipal->id;
                $curso->save();
            }

            [$estudiante, $foundBy] = $this->findStudent($row['doc_estudiante'], $row['estudiante']);
            $isNewStudent = false;

            if (!$estudiante) {
                $estudiante = new User();
                $estudiante->documento = $row['doc_estudiante'];
                $estudiante->email = $this->uniqueEmail($row['estudiante']);
                $estudiante->password = Hash::make($row['doc_estudiante']);
                $isNewStudent = true;
                $stats['students_created']++;
            } else {
                if ($foundBy === 'doc') {
                    $stats['students_existing_by_doc']++;
                } elseif ($foundBy === 'name') {
                    $stats['students_existing_by_name']++;
                }

                if (($estudiante->documento ?? '') !== $row['doc_estudiante']) {
                    $estudiante->documento = $row['doc_estudiante'];
                    $stats['docs_corrected']++;
                }
                $stats['students_updated']++;
            }

            $estudiante->name = $row['estudiante'];
            $estudiante->tipo_documento = $row['tipo_doc_estudiante'];
            $estudiante->fecha_nacimiento = $row['fecha_nacimiento'];
            $estudiante->genero = $row['sexo'];
            $estudiante->telefono = null;
            $estudiante->direccion = null;
            $estudiante->activo = true;
            $estudiante->must_change_password = false;
            $estudiante->sede_id = $sedePrincipal->id;
            $estudiante->save();
            $estudiante->syncRoles(['estudiante']);

            $hasGuardian = $estudiante->padres()->exists();
            if (!$hasGuardian) {
                $alreadyLinked = $estudiante->padres()->where('users.id', $fallbackGuardian->id)->exists();
                if (!$alreadyLinked) {
                    $estudiante->padres()->attach($fallbackGuardian->id, ['parentesco' => 'acudiente']);
                    $stats['links_created']++;
                }

                $withoutGuardianRows[] = [
                    'doc_estudiante' => $row['doc_estudiante'],
                    'estudiante' => $row['estudiante'],
                    'grado_csv' => $row['grado_raw'],
                    'curso_asignado' => $courseConfig['nombre'],
                    'es_nuevo' => $isNewStudent ? 'SI' : 'NO',
                ];
            }

            $deletedWrongMatriculas = Matricula::query()
                ->where('estudiante_id', $estudiante->id)
                ->where('periodo_id', $periodo->id)
                ->where('curso_id', '!=', $curso->id)
                ->delete();

            if ($deletedWrongMatriculas > 0) {
                $stats['matriculas_reassigned'] += $deletedWrongMatriculas;
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
            $stats['matriculas_created_or_updated']++;
        }

        $reportPath = $this->writeWithoutGuardianCsv($withoutGuardianRows);

        $this->command?->info('Sincronizacion de estudiantes finalizada.');
        $this->command?->info('Filas leidas CSV: ' . $stats['rows_total']);
        $this->command?->info('Filas omitidas: ' . $stats['rows_skipped']);
        $this->command?->info('Existentes por documento: ' . $stats['students_existing_by_doc']);
        $this->command?->info('Existentes por nombre (doc corregido): ' . $stats['students_existing_by_name']);
        $this->command?->info('Estudiantes nuevos: ' . $stats['students_created']);
        $this->command?->info('Estudiantes actualizados: ' . $stats['students_updated']);
        $this->command?->info('Documentos corregidos: ' . $stats['docs_corrected']);
        $this->command?->info('Matriculas creadas/actualizadas: ' . $stats['matriculas_created_or_updated']);
        $this->command?->info('Matriculas reasignadas de curso: ' . $stats['matriculas_reassigned']);
        $this->command?->info('Vinculos con acudiente sin asignar: ' . $stats['links_created']);
        $this->command?->info('CSV sin acudiente: ' . $reportPath);
    }

    private function readCsvRows(string $csvPath): array
    {
        $rows = [];
        $skipped = 0;
        $headerFound = false;

        $handle = fopen($csvPath, 'r');
        if (!$handle) {
            return [[], 1];
        }

        while (($cols = fgetcsv($handle)) !== false) {
            $cols = array_map(static fn ($v) => trim((string) $v), $cols);

            if (!$headerFound) {
                if ((isset($cols[0], $cols[1]) && Str::upper($cols[0]) === 'ID' && Str::contains(Str::upper($cols[1]), 'PRIMER APELLIDO'))) {
                    $headerFound = true;
                }
                continue;
            }

            if (count(array_filter($cols, static fn ($v) => $v !== '')) === 0) {
                continue;
            }

            $id = $cols[0] ?? '';
            if (!ctype_digit((string) $id)) {
                continue;
            }

            $primerApellido = $cols[1] ?? '';
            $segundoApellido = $cols[2] ?? '';
            $primerNombre = $cols[3] ?? '';
            $segundoNombre = $cols[4] ?? '';
            $tipoDocRaw = $cols[5] ?? '';
            $docRaw = $cols[6] ?? '';
            $fechaRaw = $cols[7] ?? '';
            $sexoRaw = $cols[8] ?? '';
            $gradoRaw = $cols[9] ?? '';

            [$tipoDoc, $doc] = $this->normalizeDocument($tipoDocRaw, $docRaw);
            if ($doc === '') {
                $skipped++;
                continue;
            }

            $fullName = $this->normalizeName(implode(' ', [
                $primerNombre,
                $segundoNombre,
                $primerApellido,
                $segundoApellido,
            ]));

            if ($fullName === '') {
                $skipped++;
                continue;
            }

            $rows[] = [
                'doc_estudiante' => $doc,
                'tipo_doc_estudiante' => $tipoDoc,
                'estudiante' => $fullName,
                'fecha_nacimiento' => $this->parseDate($fechaRaw),
                'sexo' => $this->normalizeSex($sexoRaw),
                'grado_raw' => $gradoRaw,
            ];
        }

        fclose($handle);

        return [$rows, $skipped];
    }

    private function normalizeDocument(string $tipoDocRaw, string $docRaw): array
    {
        $tipo = Str::upper(trim($tipoDocRaw));
        $tipo = preg_replace('/\s+/', ' ', $tipo) ?? $tipo;

        $doc = preg_replace('/\D+/', '', $docRaw) ?? '';

        if ($doc === '') {
            $docFromTipo = preg_replace('/\D+/', '', $tipo) ?? '';
            if ($docFromTipo !== '') {
                $doc = $docFromTipo;
                $tipo = trim((string) preg_replace('/\d+/', '', $tipo));
            }
        }

        if (Str::contains($tipo, 'PERU CE')) {
            $tipo = 'CE';
        }

        if ($tipo === '') {
            $tipo = 'RC';
        }

        return [$tipo, $doc];
    }

    private function normalizeName(string $name): string
    {
        $name = trim(preg_replace('/\s+/', ' ', $name) ?? '');
        return Str::upper($name);
    }

    private function normalizeSex(string $sex): ?string
    {
        $sex = Str::upper(trim($sex));
        return in_array($sex, ['M', 'F'], true) ? $sex : null;
    }

    private function parseDate(string $raw): ?string
    {
        $value = Str::upper(trim(Str::ascii($raw)));
        if ($value === '') {
            return null;
        }

        $value = str_replace(['/', '.', ' '], '-', $value);
        $value = preg_replace('/-+/', '-', $value) ?? $value;

        if (preg_match('/^(\d{4})-([A-Z]+)-(\d{1,3})$/', $value, $m)) {
            $y = (int) $m[1];
            $month = $this->monthToNumber($m[2]);
            $day = (int) ltrim($m[3], '0');
            if ($day <= 0) {
                $day = (int) $m[3];
            }
            return $this->safeDate($y, $month, $day);
        }

        if (preg_match('/^(\d{1,2})-([A-Z]+)-(\d{2,4})$/', $value, $m)) {
            $day = (int) $m[1];
            $month = $this->monthToNumber($m[2]);
            $y = (int) $m[3];
            if ($y < 100) {
                $y += 2000;
            }
            return $this->safeDate($y, $month, $day);
        }

        if (preg_match('/^(\d{4})-(\d{1,2})-(\d{1,2})$/', $value, $m)) {
            return $this->safeDate((int) $m[1], (int) $m[2], (int) $m[3]);
        }

        return null;
    }

    private function safeDate(int $year, ?int $month, int $day): ?string
    {
        if ($month === null || $year < 1900) {
            return null;
        }

        if ($day > 31) {
            $day = (int) substr((string) $day, 0, 2);
        }

        if ($day <= 0 || $day > 31) {
            return null;
        }

        if (!checkdate($month, $day, $year)) {
            return null;
        }

        return sprintf('%04d-%02d-%02d', $year, $month, $day);
    }

    private function monthToNumber(string $token): ?int
    {
        $token = Str::upper(trim($token));

        $map = [
            'ENE' => 1,
            'ENERO' => 1,
            'JAN' => 1,
            'FEB' => 2,
            'FEBRERO' => 2,
            'MAR' => 3,
            'MARZO' => 3,
            'ABR' => 4,
            'ABRI' => 4,
            'ABRIL' => 4,
            'APR' => 4,
            'MAY' => 5,
            'MAYO' => 5,
            'JUN' => 6,
            'JUNIO' => 6,
            'JUL' => 7,
            'JULIO' => 7,
            'AGO' => 8,
            'AGOSTO' => 8,
            'AUG' => 8,
            'SEP' => 9,
            'SEPT' => 9,
            'SEPTIEMBRE' => 9,
            'OCT' => 10,
            'OCTUBRE' => 10,
            'NOV' => 11,
            'NOVIEMBRE' => 11,
            'DIC' => 12,
            'DICIEMBRE' => 12,
            'DEC' => 12,
        ];

        return $map[$token] ?? null;
    }

    private function courseConfigForGrade(string $rawGrade): ?array
    {
        $grade = Str::upper(trim(Str::ascii($rawGrade)));
        $grade = preg_replace('/\s+/', ' ', $grade) ?? $grade;

        $map = [
            'PRE JARDIN' => ['nombre' => 'Pre Jardín A', 'nivel' => 'prejardin', 'grado' => 'Pre-jardín'],
            'PREJARDIN' => ['nombre' => 'Pre Jardín A', 'nivel' => 'prejardin', 'grado' => 'Pre-jardín'],
            'JARDIN' => ['nombre' => 'Jardín A', 'nivel' => 'prejardin', 'grado' => 'Jardín'],
            'TRANSICION' => ['nombre' => 'Transición A', 'nivel' => 'prejardin', 'grado' => 'Trans'],
            'PRIMERO' => ['nombre' => 'Primero A', 'nivel' => 'primaria', 'grado' => '1°'],
            'SEGUNDO' => ['nombre' => 'Segundo A', 'nivel' => 'primaria', 'grado' => '2°'],
            'TERCERO' => ['nombre' => 'Tercero A', 'nivel' => 'primaria', 'grado' => '3°'],
            'CUARTO' => ['nombre' => 'Cuarto A', 'nivel' => 'primaria', 'grado' => '4°'],
            'QUINTO' => ['nombre' => 'Quinto A', 'nivel' => 'primaria', 'grado' => '5°'],
            'SEXTO' => ['nombre' => 'Sexto A', 'nivel' => 'bachillerato', 'grado' => '6°'],
            'SEPTIMO' => ['nombre' => 'Septimo A', 'nivel' => 'bachillerato', 'grado' => '7°'],
            'OCTAVO' => ['nombre' => 'Octavo A', 'nivel' => 'bachillerato', 'grado' => '8°'],
            'NOVENO' => ['nombre' => 'Noveno A', 'nivel' => 'bachillerato', 'grado' => '9°'],
            'DECIMO' => ['nombre' => 'Decimo A', 'nivel' => 'bachillerato', 'grado' => '10°'],
            'ONCE' => ['nombre' => 'Once A', 'nivel' => 'bachillerato', 'grado' => '11°'],
        ];

        return $map[$grade] ?? null;
    }

    private function findStudent(string $documento, string $name): array
    {
        $byDoc = User::query()->where('documento', $documento)->first();
        if ($byDoc) {
            return [$byDoc, 'doc'];
        }

        $normalizedName = $this->normalizedKey($name);

        $byName = User::query()
            ->role('estudiante')
            ->get()
            ->first(function (User $user) use ($normalizedName) {
                return $this->normalizedKey($user->name) === $normalizedName;
            });

        if ($byName) {
            return [$byName, 'name'];
        }

        return [null, null];
    }

    private function normalizedKey(string $value): string
    {
        $ascii = Str::ascii(Str::upper(trim($value)));
        $ascii = preg_replace('/\s+/', ' ', $ascii) ?? $ascii;
        return trim((string) preg_replace('/[^A-Z0-9 ]/', '', $ascii));
    }

    private function getFallbackGuardian(Sede $sede): User
    {
        $guardian = User::query()->where('documento', self::FALLBACK_GUARDIAN_DOC)->first();

        if (!$guardian) {
            $guardian = new User();
            $guardian->documento = self::FALLBACK_GUARDIAN_DOC;
            $guardian->email = $this->fallbackEmail();
            $guardian->password = Hash::make(Str::random(20));
        }

        $guardian->name = 'ACUDIENTE SIN ASIGNAR';
        $guardian->tipo_documento = 'CC';
        $guardian->telefono = null;
        $guardian->direccion = null;
        $guardian->fecha_nacimiento = null;
        $guardian->genero = null;
        $guardian->activo = true;
        $guardian->must_change_password = false;
        $guardian->sede_id = $sede->id;
        $guardian->save();
        $guardian->syncRoles(['padre']);

        return $guardian;
    }

    private function fallbackEmail(): string
    {
        $base = 'acudiente_sin_asignar@emprendedores.com';
        if (!User::query()->where('email', $base)->exists()) {
            return $base;
        }

        $i = 2;
        while (User::query()->where('email', "acudiente_sin_asignar{$i}@emprendedores.com")->exists()) {
            $i++;
        }

        return "acudiente_sin_asignar{$i}@emprendedores.com";
    }

    private function uniqueEmail(string $fullName): string
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

    private function writeWithoutGuardianCsv(array $rows): string
    {
        $dir = 'imports';
        $filename = 'estudiantes_sin_acudiente_' . now()->format('Ymd_His') . '.csv';
        $path = $dir . '/' . $filename;

        $stream = fopen('php://temp', 'r+');
        fputcsv($stream, ['DOCUMENTO', 'ESTUDIANTE', 'GRADO_CSV', 'CURSO_ASIGNADO', 'ES_NUEVO']);

        foreach ($rows as $row) {
            fputcsv($stream, [
                $row['doc_estudiante'],
                $row['estudiante'],
                $row['grado_csv'],
                $row['curso_asignado'],
                $row['es_nuevo'],
            ]);
        }

        rewind($stream);
        $content = stream_get_contents($stream) ?: '';
        fclose($stream);

        Storage::disk('local')->put($path, $content);

        return storage_path('app/' . $path);
    }
}
