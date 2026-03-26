<?php

namespace Database\Seeders;

class ImportTransicionPrincipalSeeder extends ImportPreescolarPrincipalSeeder
{
    public function run(): void
    {
        $rows = [
            [
                'estudiante' => 'BAYUELO BOLIVAR DARA SOFIA',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1047519341',
                'acudiente' => 'MICHELL KARIANA BOLIVAR POLO',
                'doc_acudiente' => '1046268424',
                'telefono' => '3134000894',
            ],
            [
                'estudiante' => 'BLANQUICETT PESTANA DOMINIC ANDRES',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1235050795',
                'acudiente' => 'CAROLINA ANDREA PESTANA MARMOLEJO',
                'doc_acudiente' => '1007229946',
                'telefono' => '3003831072',
            ],
            [
                'estudiante' => 'CHAVEZ HENRIQUEZ ANNAISHA ESTHER',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1042595996',
                'acudiente' => 'PRISCY HENRIQUEZ SMTIH',
                'doc_acudiente' => '1001899434',
                'telefono' => '3013469993',
            ],
            [
                'estudiante' => 'DE AVILA CANATE LIAN ZAID',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1044013769',
                'acudiente' => 'YOLIMA DEL CARMEN CANATE HURTADO',
                'doc_acudiente' => '1128052735',
                'telefono' => '3022842897',
            ],
            [
                'estudiante' => 'LAVIERA PIRELA ISADORA CRISTINA',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1142953071',
                'acudiente' => 'ADELAIMIS NOSLIN PIRELA VILCREZ',
                'doc_acudiente' => '19809482',
                'telefono' => '3245098406',
            ],
            [
                'estudiante' => 'LEIVA MONTERROSA THAEL SOFIA',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1043338609',
                'acudiente' => 'LINA MARCELA MONTERROSA JARAMILLO',
                'doc_acudiente' => '1047428107',
                'telefono' => '3135016466',
            ],
            [
                'estudiante' => 'MARRUGO ORTIZ ENZO',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1222140012',
                'acudiente' => 'NELSY ESTHER ORTIZ ALZAMORA',
                'doc_acudiente' => '1047498627',
                'telefono' => '3103626379',
            ],
            [
                'estudiante' => 'MARTES TORRES LUCAS DANIEL',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1201284740',
                'acudiente' => 'GENESIS TORRES RICO',
                'doc_acudiente' => '1044928283',
                'telefono' => '3016438319',
            ],
            [
                'estudiante' => 'MOLINA ZAMBO EMILI CRISTINA',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1201284878',
                'acudiente' => 'VIRGINIA ZAMBO GARCIA',
                'doc_acudiente' => '33224256',
                'telefono' => '3183590944',
            ],
            [
                'estudiante' => 'PAJARO BURGOS YHAEL DE JESUS',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1042595703',
                'acudiente' => 'KARINA PATRICIA PAJARO BURGOS',
                'doc_acudiente' => '1047380265',
                'telefono' => '3017504039',
            ],
            [
                'estudiante' => 'PENA MERCADO GLEIDIS GABRIELA',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1224389261',
                'acudiente' => 'GREISY MERCADO VILLADIEGO',
                'doc_acudiente' => '1047454780',
                'telefono' => '3174129561',
            ],
            [
                'estudiante' => 'SCHOTBORGH BLANCO JANEIKER NAYID',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1044011692',
                'acudiente' => 'YOULISSA BLANCO PIMENTEL',
                'doc_acudiente' => '1047504064',
                'telefono' => '3232933272',
            ],
        ];

        $this->importDataset($rows, [
            'nombre' => 'Transición A',
            'nivel' => 'prejardin',
            'grado' => 'Trans',
            'grupo' => 'A',
            'jornada' => 'mañana',
        ]);
    }
}
