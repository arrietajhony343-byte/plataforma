<?php

namespace Database\Seeders;

class ImportNovenoPrincipalSeeder extends ImportPreescolarPrincipalSeeder
{
    public function run(): void
    {
        $rows = [
            [
                'estudiante' => 'ARROYO VALENCIA EMELITH SOFIA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1053125356',
                'acudiente' => 'ARELIS VALENCIA PEREZ',
                'doc_acudiente' => '45372898',
                'telefono' => '3164043565',
            ],
            [
                'estudiante' => 'BEDOYA LONDONO ANA SOFIA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142934219',
                'acudiente' => 'GLERY BEDOYA LONDONO',
                'doc_acudiente' => '10470182184',
                'telefono' => '3225172898',
            ],
            [
                'estudiante' => 'BERMUDEZ MARQUEZ DAMIAN JOSE',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201230168',
                'acudiente' => 'CARMEN CECILIA MARQUEZ FIGUEROA',
                'doc_acudiente' => '33101136',
                'telefono' => '3217083926',
            ],
            [
                'estudiante' => 'CHAVEZ DIAZ ELKIN JOSE',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142930746',
                'acudiente' => 'MORAIMA DIAZ HERRERA',
                'doc_acudiente' => '30871800',
                'telefono' => '3016467489',
            ],
            [
                'estudiante' => 'FLORIAN PEREZ ADRIAN JOSE',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1143367657',
                'acudiente' => 'JOSE GREGORIO FLORIAN GAMARRA',
                'doc_acudiente' => '73169532',
                'telefono' => '3017975230',
            ],
            [
                'estudiante' => 'GARCIA LADEUS ELIAS DAVID',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1041985788',
                'acudiente' => 'ELIZABETH LADEUS BLANCO',
                'doc_acudiente' => '45490002',
                'telefono' => '3157251039',
            ],
            [
                'estudiante' => 'HOYOS PADILLA JUAN FELIPE',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1044925667',
                'acudiente' => 'MARYURIS PADILLA MARTINEZ',
                'doc_acudiente' => '45564983',
                'telefono' => '3137558933',
            ],
            [
                'estudiante' => 'MAGALLANES SALGADO SALOME',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142925584',
                'acudiente' => 'KAREN SALGADO ECHEVERRY',
                'doc_acudiente' => '1047374884',
                'telefono' => '3043146691',
            ],
            [
                'estudiante' => 'MARRUGO PANTOJA JAMMEL SADAY',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1043311926',
                'acudiente' => 'CLAYDER CECILIA PANTOJA',
                'doc_acudiente' => '32937548',
                'telefono' => '3124724586',
            ],
            [
                'estudiante' => 'MENDOZA JIMENEZ KEILYSMAR PAOLA',
                'tipo_doc_estudiante' => 'PPT',
                'doc_estudiante' => '600266',
                'acudiente' => 'YOKELIS JIMENEZ TOLEDO',
                'doc_acudiente' => '21389681',
                'telefono' => '3144193504',
            ],
            [
                'estudiante' => 'NINO MEJIA ANGEL THOMAS',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201225437',
                'acudiente' => 'LUZ EMILSE MEJIA TABORDA',
                'doc_acudiente' => '32392828',
                'telefono' => '3205417857',
            ],
            [
                'estudiante' => 'PENA DAZA MARTIN ELIAS',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1041987717',
                'acudiente' => 'VERONICA DAZA MENDOZA',
                'doc_acudiente' => '1051418525',
                'telefono' => '3017261536',
            ],
            [
                'estudiante' => 'PEREZ PEREZ KAROL TATIANA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1042586723',
                'acudiente' => 'ANA CAROLINA PEREZ FLOREZ',
                'doc_acudiente' => '1052950217',
                'telefono' => '3046352342',
            ],
            [
                'estudiante' => 'SIERRA MENDEZ TALIANA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1049584330',
                'acudiente' => 'SUGEY CANDELARIA MENDEZ GUERRA',
                'doc_acudiente' => '1128056393',
                'telefono' => '3116364854',
            ],
            [
                'estudiante' => 'SMITH MOSQUERA RACHEL TATIANA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1123629793',
                'acudiente' => 'TATIANA MOSQUERA ARROYO',
                'doc_acudiente' => '45360938',
                'telefono' => '3164141066',
            ],
            [
                'estudiante' => 'VASQUEZ VELASQUEZ STEFFANNYS PATRICIA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201231969',
                'acudiente' => 'SILENE PATRICIA VELASQUEZ BELLO',
                'doc_acudiente' => '53074818',
                'telefono' => '3016931014',
            ],
            [
                'estudiante' => 'BALLESTEROS MOLINA FRENYENLI ALEJANDRA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1102879660',
                'acudiente' => 'LEANIS BALLESTEROS MOLINA',
                'doc_acudiente' => '1052994591',
                'telefono' => '3137240331',
            ],
        ];

        $this->importDataset($rows, [
            'nombre' => 'Noveno A',
            'nivel' => 'bachillerato',
            'grado' => '9°',
            'grupo' => 'A',
            'jornada' => 'mañana',
        ]);
    }
}
