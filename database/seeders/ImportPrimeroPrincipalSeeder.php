<?php

namespace Database\Seeders;

class ImportPrimeroPrincipalSeeder extends ImportPreescolarPrincipalSeeder
{
    public function run(): void
    {
        $rows = [
            [
                'estudiante' => 'BUENDIA GUERRERO HEILYN JOHANA',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1044014343',
                'acudiente' => 'KELLY JOHANA GUERRERO CALIXTO',
                'doc_acudiente' => '1143363864',
                'telefono' => '3027261792',
            ],
            [
                'estudiante' => 'CHICO NOVOA MATIAS ANDRES',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1201276850',
                'acudiente' => 'LISETH PAOLA NOVOA FUENTES',
                'doc_acudiente' => '1030581612',
                'telefono' => '3007078809',
            ],
            [
                'estudiante' => 'DE CUENTAS CASSERES MARIA ANGEL',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1041999502',
                'acudiente' => 'LECETH CASSERES GOMEZ',
                'doc_acudiente' => '1047418033',
                'telefono' => '3234829788',
            ],
            [
                'estudiante' => 'FERNANDEZ MENDEZ JULIANA MARCELA',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1201279459',
                'acudiente' => 'LINA MARCELA MENDEZ HERRERA',
                'doc_acudiente' => '1052072140',
                'telefono' => '3017622765',
            ],
            [
                'estudiante' => 'MONTENEGRO CAMARGO VALENTINA ANDREA',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1232805810',
                'acudiente' => 'NATALIA ANDREA CAMARGO CUADROS',
                'doc_acudiente' => '1082854675',
                'telefono' => '3243256856',
            ],
            [
                'estudiante' => 'PAUTT MORALES SALOME',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1143419063',
                'acudiente' => 'LINA PAOLA MORALES VERGARA',
                'doc_acudiente' => '1143369720',
                'telefono' => '3005715726',
            ],
            [
                'estudiante' => 'TORRECILLA JULIO KYLIAN ANDRES',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1201283332',
                'acudiente' => 'MARLID MARIA JULIO HERRERA',
                'doc_acudiente' => '1047505562',
                'telefono' => '3045696845',
            ],
            [
                'estudiante' => 'ZAMBRANO VILLANUEVA ABBY LIZ',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1044013332',
                'acudiente' => 'JENIFER VILLANUEVA GARCES',
                'doc_acudiente' => '1143367893',
                'telefono' => '3023455370',
            ],
        ];

        $this->importDataset($rows, [
            'nombre' => 'Primero A',
            'nivel' => 'primaria',
            'grado' => '1°',
            'grupo' => 'A',
            'jornada' => 'mañana',
        ]);
    }
}
