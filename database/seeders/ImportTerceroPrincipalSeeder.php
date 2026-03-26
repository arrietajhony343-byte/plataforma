<?php

namespace Database\Seeders;

class ImportTerceroPrincipalSeeder extends ImportPreescolarPrincipalSeeder
{
    public function run(): void
    {
        $rows = [
            [
                'estudiante' => 'BONZA MORENO SARA VALENTINA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1092189695',
                'acudiente' => 'MILDREY ESLENDI MORENO CARVAJAL',
                'doc_acudiente' => '1004845283',
                'telefono' => '3150740109',
            ],
            [
                'estudiante' => 'BOSSIO FORTICH AARON DAVID',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201271175',
                'acudiente' => 'NMARIA FERNANDA FORTICH BULA',
                'doc_acudiente' => '1143414841',
                'telefono' => '3158742831',
            ],
            [
                'estudiante' => 'GOMEZ JIMENEZ JESUS DANIEL',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1048611181',
                'acudiente' => 'ANA MILEDIS JIMENEZ MACHACON',
                'doc_acudiente' => '1047460670',
                'telefono' => '3163034172',
            ],
            [
                'estudiante' => 'GONZALEZ PATERNINA LIAN DAVID',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1049831814',
                'acudiente' => 'YISELA MARIA PATERNINA RUIZ',
                'doc_acudiente' => '55235939',
                'telefono' => '3207661459',
            ],
            [
                'estudiante' => 'LOZANO PAJARO DANY LUZ',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1043326848',
                'acudiente' => 'DINA LUZ PAJARO CABARCAS',
                'doc_acudiente' => '1047391338',
                'telefono' => '3005164140',
            ],
            [
                'estudiante' => 'MENDEZ LOPEZ SALOMON',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1238340895',
                'acudiente' => 'MAYRA MENDEZ GUERRA',
                'doc_acudiente' => '1047399002',
                'telefono' => '3002132334',
            ],
            [
                'estudiante' => 'PEREZ AYOLA LUIS FELIPE',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1042594852',
                'acudiente' => 'YISSET KARINA AYOLA HERRERA',
                'doc_acudiente' => '45541463',
                'telefono' => '3165207797',
            ],
            [
                'estudiante' => 'QUIÑONES BARRIOS GERONIMO',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1043327309',
                'acudiente' => 'MARILUZ BARRIOS MUÑOZ',
                'doc_acudiente' => '45531328',
                'telefono' => '3002095994',
            ],
            [
                'estudiante' => 'ROMERO ESPAÑA PAULA ELENA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1044007933',
                'acudiente' => 'ANA DEL ROSARIO ESPAÑA AVILA',
                'doc_acudiente' => '37687518',
                'telefono' => '3202473143',
            ],
            [
                'estudiante' => 'SALAZAR CORREDOR ANGEL MATHIAS',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1201271645',
                'acudiente' => 'NORELYS JOHANA CORREDOR TORRADO',
                'doc_acudiente' => '1047436275',
                'telefono' => '3126664723',
            ],
            [
                'estudiante' => 'VASQUEZ PALOMINO MATIAS ANDRES',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1041996317',
                'acudiente' => 'XIOMARA PALOMINO JARAMILLO',
                'doc_acudiente' => '22808665',
                'telefono' => '3136853774',
            ],
            [
                'estudiante' => 'MARIA ANGEL ACOSTA MEDINA',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1238340286',
                'acudiente' => 'MARTHA MEDINA SERPA',
                'doc_acudiente' => '45509700',
                'telefono' => '3104406435',
            ],
        ];

        $this->importDataset($rows, [
            'nombre' => 'Tercero A',
            'nivel' => 'primaria',
            'grado' => '3°',
            'grupo' => 'A',
            'jornada' => 'mañana',
        ]);
    }
}
