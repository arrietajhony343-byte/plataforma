<?php

namespace Database\Seeders;

class ImportSeptimoPrincipalSeeder extends ImportPreescolarPrincipalSeeder
{
    public function run(): void
    {
        $rows = [
            [
                'estudiante' => 'ALVAREZ PEREZ SEBASTIAN ANDRES',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1052703266',
                'acudiente' => 'LUIS ALFREDO ALVAREEZ GUTIERREZ',
                'doc_acudiente' => '1143339086',
                'telefono' => '3135547105',
            ],
            [
                'estudiante' => 'CARRENO DE LA ROSA ANDRES FELIPE',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142940064',
                'acudiente' => 'KELLY MARIA DE LA ROSA ELJAIEK',
                'doc_acudiente' => '1047396235',
                'telefono' => '3116635092',
            ],
            [
                'estudiante' => 'CASTRO MONTEGRO RAUL',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142940294',
                'acudiente' => 'RAUL CASTRO ANGULO',
                'doc_acudiente' => '73146987',
                'telefono' => '3006879847',
            ],
            [
                'estudiante' => 'GEROSA RAMOS KRISHELL',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201238032',
                'acudiente' => 'YESICA RAMOS CANTERO',
                'doc_acudiente' => '1047438886',
                'telefono' => '3104251581',
            ],
            [
                'estudiante' => 'JIMENEZ DEL TORO SANTIAGO DE JESUS',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1083028698',
                'acudiente' => 'EYLEEN ALEXANDRA DEL TORO GAMEZ',
                'doc_acudiente' => '1065632738',
                'telefono' => '3153536628',
            ],
            [
                'estudiante' => 'MALDONADO DEL RIO RONALD JESUS',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1041991123',
                'acudiente' => 'ROSEMARY DEL RIO CABARCAS',
                'doc_acudiente' => '22804938',
                'telefono' => '3175140782',
            ],
            [
                'estudiante' => 'MILANES MORALES SHAIRA CRISTINA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142941527',
                'acudiente' => 'LINA PAOLA MORALES VERGARA',
                'doc_acudiente' => '1143369720',
                'telefono' => '3013446669',
            ],
            [
                'estudiante' => 'MUNOZ JIMENEZ SHEILY JOHANA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1043996911',
                'acudiente' => 'KELLY JOHANA JIMENEZ BOBADILLA',
                'doc_acudiente' => '1148692798',
                'telefono' => '3013440274',
            ],
            [
                'estudiante' => 'RIVAS SEPULVEDA MICHAEL JESUS',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142941498',
                'acudiente' => 'ANA CAROLINA SEPULVEDA FERRER',
                'doc_acudiente' => '1047491354',
                'telefono' => '3218063446',
            ],
            [
                'estudiante' => 'SANJUAN GRIMALDO YEIRY',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142941741',
                'acudiente' => 'YAIMI GRIMALDO FLOREZ',
                'doc_acudiente' => '30863264',
                'telefono' => '3217773141',
            ],
            [
                'estudiante' => 'UTRIA VARGAS ISABELLA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1041990476',
                'acudiente' => 'DIANA VARGAS',
                'doc_acudiente' => '45556850',
                'telefono' => '3014326493',
            ],
            [
                'estudiante' => 'VALERIA JULIO CANEDA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1028724031',
                'acudiente' => 'LUZ TERESA SALAS FERIA',
                'doc_acudiente' => '45540660',
                'telefono' => '3215524119',
            ],
            [
                'estudiante' => 'IAN JOSE MARTINEZ SANJUAN',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201241837',
                'acudiente' => 'NATALIA MARTINEZ SAN JUAN',
                'doc_acudiente' => '32936863',
                'telefono' => '3023692274',
            ],
            [
                'estudiante' => 'JORGE DAVID ZAMBO DAVILA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1143382548',
                'acudiente' => 'ANA GARCIA',
                'doc_acudiente' => '33214722',
                'telefono' => '3017482088',
            ],
            [
                'estudiante' => 'ISAAC DAVID VERGARA JIMENEZ',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1041989013',
                'acudiente' => 'KEYLA PAOLA JIMENEZ DUARTE',
                'doc_acudiente' => '1050963721',
                'telefono' => '3015614110',
            ],
            [
                'estudiante' => 'SANTIAGO GARRIDO MARRUGO',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1143384736',
                'acudiente' => 'GERALDIN MARRUGO ESCOLAR',
                'doc_acudiente' => '1047477920',
                'telefono' => '3234923788',
            ],
        ];

        $this->importDataset($rows, [
            'nombre' => 'Septimo A',
            'nivel' => 'bachillerato',
            'grado' => '7°',
            'grupo' => 'A',
            'jornada' => 'mañana',
        ]);
    }
}
