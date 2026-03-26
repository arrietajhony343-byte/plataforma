<?php

namespace Database\Seeders;

use App\Models\Sede;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ImportDocentesListaSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            ['nombre' => 'YESICA MONTENEGRO', 'documento' => '1128056199', 'cargo' => 'RECTORA'],
            ['nombre' => 'YORLEIDIS QUINTANA', 'documento' => '1047434518', 'cargo' => 'DOCENTE (OCTAVO)'],
            ['nombre' => 'TAQUI MARCELA JIMENEZ', 'documento' => '1001972456', 'cargo' => 'DOCENTE (SEXTO)'],
            ['nombre' => 'HERMES JOSE GONZALEZ', 'documento' => '1143515544', 'cargo' => 'DOCENTE (NUEVE)'],
            ['nombre' => 'JULIETT SALCESO ARELLANO', 'documento' => '1002185422', 'cargo' => 'DOCENTE (SEPTIMO)'],
            ['nombre' => 'MARLEIDIS ESCUDERO', 'documento' => '1148703513', 'cargo' => 'PRIMAVERA (PRE JARDIN)'],
            ['nombre' => 'KARINA PAJARO', 'documento' => '1047380265', 'cargo' => 'PRIMAVERA (TRANSICION)'],
            ['nombre' => 'ZULAIZ ISABEL CERVANTES CABRERA', 'documento' => '1002411272', 'cargo' => 'PRIMAVERA (JARDIN)'],
            ['nombre' => 'YULIANY MARIA BRANGO RAMOS', 'documento' => '1003212842', 'cargo' => 'PRIMAVERA (1)'],
            ['nombre' => 'CAROL IVON CORDERO BELENO', 'documento' => '1047424679', 'cargo' => 'PRINCIPAL (3)'],
            ['nombre' => 'LORENA VANESSA VILLARREAL TUIRAN', 'documento' => '1143412896', 'cargo' => 'PRINCIPAL (2)'],
            ['nombre' => 'MAUREN JULIETT PEREZ HEREDIA', 'documento' => '1043965024', 'cargo' => 'PRINCIPAL (4)'],
            ['nombre' => 'JOSELYN SAEZ JIMENEZ', 'documento' => '1069506814', 'cargo' => 'PRINCIPAL (5)'],
            ['nombre' => 'MARIA CAMILA MAZA CARCELLO', 'documento' => '1143406144', 'cargo' => 'DOCENTE (10)'],
            ['nombre' => 'DUNNYS ESTHER DIAZ GREY', 'documento' => '45477584', 'cargo' => 'SECRETARIA BACHILLERATO'],
            ['nombre' => 'ANA ELVIRA PUELLO BLANDON', 'documento' => '1143398596', 'cargo' => 'PRIMAVERA (AUXILIAR)'],
            ['nombre' => 'ANA MARIA CABELLERO FIGUEROA', 'documento' => '55245799', 'cargo' => 'SECRETARIA PRIMAVERA'],
            ['nombre' => 'YUDITH MENDOZA HERRERA', 'documento' => '110210121', 'cargo' => 'COORDINADORA PRIMAVERA'],
            ['nombre' => 'ANGIE PAOLA CORTES OZUNA', 'documento' => '1143395549', 'cargo' => 'PRIMAVERA (CUARTO)'],
            ['nombre' => 'GISELA MARIA ROMERO ARBOLEDA', 'documento' => '1043971200', 'cargo' => 'PRIMAVERA (5)'],
            ['nombre' => 'DELCY MARIANA REBOLLO PRIMERA', 'documento' => '1044001244', 'cargo' => 'SECRETARIA PRINCIPAL'],
            ['nombre' => 'GREGORIA MORENO PACHECO', 'documento' => '1151448505', 'cargo' => 'ASEADORA'],
            ['nombre' => 'ANA MILENA ACEVEDO CHICO', 'documento' => '1143381906', 'cargo' => 'PRIMAVERA (3)'],
            ['nombre' => 'ORIETA MARIANGO PADILLA', 'documento' => '45688985', 'cargo' => 'PRIMAVERA (2)'],
            ['nombre' => 'TIBISAIS RODRIGUEZ PEREZ', 'documento' => '1044911671', 'cargo' => 'ASEADORA'],
            ['nombre' => 'ANELA UPARELA CASTRO', 'documento' => '1102574905', 'cargo' => 'PRINCIPAL (JARDIN)'],
            ['nombre' => 'LISSY CAROLINA ROMERO PALOMINO', 'documento' => '1143377320', 'cargo' => 'PRINCIPAL (TRANSICION)'],
            ['nombre' => 'AURY PAJARO BURGOS', 'documento' => '', 'cargo' => 'PRINCIPAL (1)'],
            ['nombre' => 'PAOLA PARRA', 'documento' => '', 'cargo' => 'BACHILLERATO (11)'],
        ];

        $defaultSedeId = Sede::query()->orderBy('id')->value('id');

        $created = 0;
        $updated = 0;
        $skipped = 0;

        foreach ($rows as $row) {
            $documento = preg_replace('/\D+/', '', (string) ($row['documento'] ?? ''));
            if (!$documento) {
                $skipped++;
                $this->command?->warn("Omitido sin documento: {$row['nombre']} ({$row['cargo']})");
                continue;
            }

            $name = trim((string) $row['nombre']);
            $email = $this->buildUniqueEmail($name, $documento);

            $user = User::query()->where('documento', $documento)->first();

            if ($user) {
                $user->name = $name;
                $user->tipo_documento = 'CC';
                $user->telefono = $user->telefono ?: '0000000000';
                $user->direccion = $user->direccion ?: 'Sin Asignar';
                $user->fecha_nacimiento = $user->fecha_nacimiento ?: '2000-01-01 00:00:00';
                $user->email = $user->email ?: $email;
                $user->activo = true;
                $user->must_change_password = true;
                $user->sede_id = $user->sede_id ?: $defaultSedeId;
                $user->save();
                $updated++;
            } else {
                $user = User::query()->create([
                    'name' => $name,
                    'email' => $email,
                    'password' => Hash::make('Docente123*'),
                    'documento' => $documento,
                    'tipo_documento' => 'CC',
                    'telefono' => '0000000000',
                    'direccion' => 'Sin Asignar',
                    'fecha_nacimiento' => '2000-01-01 00:00:00',
                    'genero' => null,
                    'activo' => true,
                    'must_change_password' => true,
                    'sede_id' => $defaultSedeId,
                    'email_verified_at' => now(),
                ]);
                $created++;
            }

            if (!$user->hasRole('profesor')) {
                $user->assignRole('profesor');
            }
        }

        $this->command?->info("Docentes importados. Creados: {$created}, actualizados: {$updated}, omitidos: {$skipped}");
    }

    private function buildUniqueEmail(string $name, string $documento): string
    {
        $base = Str::of($name)
            ->ascii()
            ->lower()
            ->replaceMatches('/[^a-z0-9 ]+/', '')
            ->trim()
            ->replace(' ', '_')
            ->value();

        if ($base === '') {
            $base = 'docente';
        }

        $email = "{$base}@emprendedores.com";
        if (!User::query()->where('email', $email)->exists()) {
            return $email;
        }

        return "{$base}_{$documento}@emprendedores.com";
    }
}
