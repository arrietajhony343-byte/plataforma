<?php

namespace Database\Seeders;

use App\Models\Curso;
use App\Models\Matricula;
use App\Models\Periodo;
use App\Models\Sede;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SyncDirectorioPrimaveraCsvSeeder extends Seeder
{
    private const FALLBACK_GUARDIAN_DOC = 'ACUDIENTE-SIN-ASIGNAR';

    public function run(): void
    {
        $csvPath = database_path('schema/DIRECTORIO PRIMAVERA.csv');
        if (!is_file($csvPath)) {
            $this->command?->error("No se encontro el CSV en: {$csvPath}");
            return;
        }

        $sedePrimavera = Sede::query()->firstOrCreate(
            ['nombre' => 'Primavera'],
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

        $fallbackGuardian = $this->getFallbackGuardian($sedePrimavera);

        $stats = [
            'rows_total' => count($rows),
            'rows_skipped' => $skippedRows,
            'existing_by_doc' => 0,
            'existing_by_name' => 0,
            'created' => 0,
            'updated' => 0,
            'docs_corrected' => 0,
            'sede_moved_to_primavera' => 0,
            'courses_created' => 0,
            'matriculas_upserted' => 0,
            'matriculas_reassigned' => 0,
            'guardians_existing' => 0,
            'guardians_created' => 0,
            'guardian_links_created' => 0,
            'fallback_links_created' => 0,
            'fallback_links_removed' => 0,
            'rows_without_guardian_data' => 0,
        ];

        $auditRows = [];

        foreach ($rows as $row) {
            $courseConfig = $this->courseConfigForGrade($row['grado_raw']);
            if (!$courseConfig) {
                $stats['rows_skipped']++;
                continue;
            }

            $curso = Curso::query()
                ->where('sede_id', $sedePrimavera->id)
                ->where('grado', $courseConfig['grado'])
                ->where('grupo', 'A')
                ->where('jornada', 'mañana')
                ->where('anio', $periodo->anio)
                ->first();

            if (!$curso) {
                $curso = Curso::query()
                    ->where('sede_id', $sedePrimavera->id)
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
                    'sede_id' => $sedePrimavera->id,
                ]);
                $stats['courses_created']++;
            } else {
                $curso->nombre = $courseConfig['nombre'];
                $curso->nivel = $courseConfig['nivel'];
                $curso->grado = $courseConfig['grado'];
                $curso->grupo = 'A';
                $curso->jornada = 'mañana';
                $curso->anio = $periodo->anio;
                $curso->activo = true;
                $curso->sede_id = $sedePrimavera->id;
                $curso->save();
            }

            [$estudiante, $foundBy] = $this->findStudent($row['doc_estudiante'], $row['estudiante']);
            $isNew = false;

            if (!$estudiante) {
                $estudiante = new User();
                $estudiante->documento = $row['doc_estudiante'];
                $estudiante->email = $this->uniqueEmail($row['estudiante']);
                $estudiante->password = Hash::make($row['doc_estudiante']);
                $isNew = true;
                $stats['created']++;
            } else {
                if ($foundBy === 'doc') {
                    $stats['existing_by_doc']++;
                } elseif ($foundBy === 'name') {
                    $stats['existing_by_name']++;
                }

                if (($estudiante->documento ?? '') !== $row['doc_estudiante']) {
                    $estudiante->documento = $row['doc_estudiante'];
                    $stats['docs_corrected']++;
                }

                $stats['updated']++;
            }

            $previousSede = $estudiante->sede_id;

            $estudiante->name = $row['estudiante'];
            $estudiante->tipo_documento = $row['tipo_doc_estudiante'];
            $estudiante->fecha_nacimiento = $row['fecha_nacimiento'];
            $estudiante->genero = $row['sexo'];
            $estudiante->activo = true;
            $estudiante->must_change_password = false;
            $estudiante->sede_id = $sedePrimavera->id;
            $estudiante->save();
            $estudiante->syncRoles(['estudiante']);

            if (!$isNew && (int) $previousSede !== (int) $sedePrimavera->id) {
                $stats['sede_moved_to_primavera']++;
            }

            $removed = Matricula::query()
                ->where('estudiante_id', $estudiante->id)
                ->where('periodo_id', $periodo->id)
                ->where('curso_id', '!=', $curso->id)
                ->delete();
            if ($removed > 0) {
                $stats['matriculas_reassigned'] += $removed;
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
            $stats['matriculas_upserted']++;

            // Acudiente desde CSV
            $guardian = null;
            if ($row['doc_acudiente'] !== '' && $row['acudiente'] !== '') {
                $guardian = $this->upsertGuardianFromCsv($row, $sedePrimavera, $stats);
            } else {
                $stats['rows_without_guardian_data']++;
            }

            if (!$guardian) {
                $guardian = $fallbackGuardian;
                $alreadyLinked = DB::table('padre_estudiante')
                    ->where('padre_id', $guardian->id)
                    ->where('estudiante_id', $estudiante->id)
                    ->exists();
                if (!$alreadyLinked) {
                    DB::table('padre_estudiante')->insert([
                        'padre_id' => $guardian->id,
                        'estudiante_id' => $estudiante->id,
                        'parentesco' => 'acudiente',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $stats['fallback_links_created']++;
                }
            } else {
                $alreadyLinked = DB::table('padre_estudiante')
                    ->where('padre_id', $guardian->id)
                    ->where('estudiante_id', $estudiante->id)
                    ->exists();

                if (!$alreadyLinked) {
                    DB::table('padre_estudiante')->insert([
                        'padre_id' => $guardian->id,
                        'estudiante_id' => $estudiante->id,
                        'parentesco' => 'acudiente',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    $stats['guardian_links_created']++;
                }

                $removedFallback = DB::table('padre_estudiante')
                    ->where('estudiante_id', $estudiante->id)
                    ->where('padre_id', $fallbackGuardian->id)
                    ->delete();
                if ($removedFallback > 0) {
                    $stats['fallback_links_removed'] += $removedFallback;
                }
            }

            $auditRows[] = [
                'DOCUMENTO' => $row['doc_estudiante'],
                'ESTUDIANTE' => $row['estudiante'],
                'CURSO' => $curso->nombre,
                'SEDE' => 'Primavera',
                'ESTADO' => $isNew ? 'CREADO' : 'ACTUALIZADO',
                'ACUDIENTE' => $guardian?->name ?? 'ACUDIENTE SIN ASIGNAR',
                'DOC_ACUDIENTE' => $guardian?->documento ?? self::FALLBACK_GUARDIAN_DOC,
            ];
        }

        $auditPath = $this->writeAuditCsv($auditRows, 'auditoria_sync_primavera_');

        $this->command?->info('Sincronizacion DIRECTORIO PRIMAVERA finalizada.');
        $this->command?->info('Filas leidas CSV: ' . $stats['rows_total']);
        $this->command?->info('Filas omitidas: ' . $stats['rows_skipped']);
        $this->command?->info('Existentes por documento: ' . $stats['existing_by_doc']);
        $this->command?->info('Existentes por nombre: ' . $stats['existing_by_name']);
        $this->command?->info('Estudiantes creados: ' . $stats['created']);
        $this->command?->info('Estudiantes actualizados: ' . $stats['updated']);
        $this->command?->info('Documentos corregidos: ' . $stats['docs_corrected']);
        $this->command?->info('Movidos a sede Primavera: ' . $stats['sede_moved_to_primavera']);
        $this->command?->info('Cursos Primavera creados: ' . $stats['courses_created']);
        $this->command?->info('Matriculas upserted: ' . $stats['matriculas_upserted']);
        $this->command?->info('Matriculas reasignadas: ' . $stats['matriculas_reassigned']);
        $this->command?->info('Acudientes existentes usados: ' . $stats['guardians_existing']);
        $this->command?->info('Acudientes creados: ' . $stats['guardians_created']);
        $this->command?->info('Vinculos con acudiente real creados: ' . $stats['guardian_links_created']);
        $this->command?->info('Vinculos fallback creados: ' . $stats['fallback_links_created']);
        $this->command?->info('Vinculos fallback removidos: ' . $stats['fallback_links_removed']);
        $this->command?->info('Filas sin datos de acudiente: ' . $stats['rows_without_guardian_data']);
        $this->command?->info('CSV auditoria: ' . $auditPath);
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

            $primerApellido = $cols[1] ?? '';
            $segundoApellido = $cols[2] ?? '';
            $primerNombre = $cols[3] ?? '';
            $segundoNombre = $cols[4] ?? '';
            $tipoDocRaw = $cols[5] ?? '';
            $docRaw = $cols[6] ?? '';
            $fechaRaw = $cols[7] ?? '';
            $sexoRaw = $cols[8] ?? '';
            $gradoRaw = $cols[9] ?? '';

            $acudienteRaw = $cols[10] ?? '';
            $cedulaAcudRaw = $cols[11] ?? '';
            $telefonoAcudRaw = $cols[12] ?? '';

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

            [$tipoAcud, $docAcud] = $this->normalizeDocument($cedulaAcudRaw, $cedulaAcudRaw);
            $phoneAcud = preg_replace('/\D+/', '', $telefonoAcudRaw) ?? '';

            $rows[] = [
                'doc_estudiante' => $doc,
                'tipo_doc_estudiante' => $tipoDoc,
                'estudiante' => $fullName,
                'fecha_nacimiento' => $this->parseDate($fechaRaw),
                'sexo' => $this->normalizeSex($sexoRaw),
                'grado_raw' => $gradoRaw,
                'acudiente' => $this->normalizeName($acudienteRaw),
                'doc_acudiente' => $docAcud,
                'tipo_doc_acudiente' => $tipoAcud,
                'telefono_acudiente' => $phoneAcud !== '' ? $phoneAcud : null,
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

    private function upsertGuardianFromCsv(array $row, Sede $sedePrimavera, array &$stats): ?User
    {
        if ($row['doc_acudiente'] === '' || $row['acudiente'] === '') {
            return null;
        }

        $guardian = User::query()->where('documento', $row['doc_acudiente'])->first();
        if ($guardian) {
            $stats['guardians_existing']++;
        } else {
            $guardian = new User();
            $guardian->documento = $row['doc_acudiente'];
            $guardian->email = $this->uniqueEmail($row['acudiente']);
            $guardian->password = Hash::make($row['doc_acudiente']);
            $stats['guardians_created']++;
        }

        $guardian->name = $row['acudiente'];
        $guardian->tipo_documento = $row['tipo_doc_acudiente'] ?: 'CC';
        $guardian->telefono = $row['telefono_acudiente'];
        $guardian->activo = true;
        $guardian->must_change_password = false;
        $guardian->sede_id = $sedePrimavera->id;
        $guardian->save();
        $guardian->syncRoles(['padre']);

        return $guardian;
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
        $last = isset($parts[1]) ? Str::lower($parts[1]) : 'persona';

        $first = preg_replace('/[^a-z0-9]/', '', $first) ?: 'usuario';
        $last = preg_replace('/[^a-z0-9]/', '', $last) ?: 'persona';

        $base = $first . '_' . $last;
        $candidate = $base . '@emprendedores.com';
        $i = 2;

        while (User::query()->where('email', $candidate)->exists()) {
            $candidate = $base . $i . '@emprendedores.com';
            $i++;
        }

        return $candidate;
    }

    private function writeAuditCsv(array $rows, string $prefix): string
    {
        $dir = 'imports';
        $filename = $prefix . now()->format('Ymd_His') . '.csv';
        $path = $dir . '/' . $filename;

        $stream = fopen('php://temp', 'r+');
        fputcsv($stream, ['DOCUMENTO', 'ESTUDIANTE', 'CURSO', 'SEDE', 'ESTADO', 'ACUDIENTE', 'DOC_ACUDIENTE']);

        foreach ($rows as $row) {
            fputcsv($stream, [
                $row['DOCUMENTO'],
                $row['ESTUDIANTE'],
                $row['CURSO'],
                $row['SEDE'],
                $row['ESTADO'],
                $row['ACUDIENTE'],
                $row['DOC_ACUDIENTE'],
            ]);
        }

        rewind($stream);
        $content = stream_get_contents($stream) ?: '';
        fclose($stream);

        Storage::disk('local')->put($path, $content);

        return storage_path('app/' . $path);
    }
}
