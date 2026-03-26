<?php

namespace Database\Seeders;

class ImportDecimoPrincipalSeeder extends ImportPreescolarPrincipalSeeder
{
    public function run(): void
    {
        $rows = [
            [
                'estudiante' => 'MUNOZ PAEZ LEINIR GUILLERMO',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1042590446',
                'acudiente' => 'GINA PAOLA PAEZ CANAVERA',
                'doc_acudiente' => '45529929',
                'telefono' => '3004640147',
            ],
            [
                'estudiante' => 'SIERRA PEREZ YURI KARINA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1044921502',
                'acudiente' => 'NESTOR DANIEL SIERA PAYARES',
                'doc_acudiente' => '7938192',
                'telefono' => '320502548',
            ],
            [
                'estudiante' => 'TEJEDOR JULIO SILVA ISABEL',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201220464',
                'acudiente' => 'ARLINE JULIO DE AVILA',
                'doc_acudiente' => '33333851',
                'telefono' => '3042540430',
            ],
            [
                'estudiante' => 'TORDECILLA DAVILA VALERIA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201226515',
                'acudiente' => 'KERIN DAVILA PENALOZA',
                'doc_acudiente' => '1047387958',
                'telefono' => '3002472535',
            ],
            [
                'estudiante' => 'TORRES DAZA IVAN DAVID',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1051418212',
                'acudiente' => 'YURANIS PAOLA DAZA MENDOZA',
                'doc_acudiente' => '30900137',
                'telefono' => '3002256558',
            ],
            [
                'estudiante' => 'VERJEL TAPIA JHON ESTEBAN',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142928791',
                'acudiente' => 'MARLIS TAPIA ALMANZA',
                'doc_acudiente' => '30896501',
                'telefono' => '3126412249',
            ],
            [
                'estudiante' => 'VISBAL SALGADO MARIA CAMILA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201221171',
                'acudiente' => 'JUANA SALGADO SALGADO',
                'doc_acudiente' => '64740380',
                'telefono' => '3234966490',
            ],
            [
                'estudiante' => 'ZUNIGA NUNEZ ANDRES ALEJANDRO',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1127589359',
                'acudiente' => 'LUZ DARY GONZALEZ LOPEZ',
                'doc_acudiente' => '26145935',
                'telefono' => '3127965065',
            ],
            [
                'estudiante' => 'ARGUMEDO OLIVA TALIANA SOFIA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1047453325',
                'acudiente' => 'ANA OLIVA ROMERO',
                'doc_acudiente' => '1047476628',
                'telefono' => '3043288511',
            ],
            [
                'estudiante' => 'QUINTANA PAJARO MOISER DE JESUS',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1073483395',
                'acudiente' => 'AURY ESTELLA PAJARO BURGOS',
                'doc_acudiente' => '1047428102',
                'telefono' => '3013333778',
            ],
            [
                'estudiante' => 'MATEO ANDRES ARROYO VILLA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1043987510',
                'acudiente' => 'LILIANA MARIA VILLA MORALES',
                'doc_acudiente' => '1050004118',
                'telefono' => '3146161308',
            ],
            [
                'estudiante' => 'NAZIR MARTINEZ MOSQUERA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201214970',
                'acudiente' => 'LIDYS JHOANA MOSQUERA MALDONADO',
                'doc_acudiente' => '45542634',
                'telefono' => '3117490011',
            ],
            [
                'estudiante' => 'MARTIN ANTONIO VASCO PADRON',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1143370918',
                'acudiente' => 'DAYANA VASCO PADRON',
                'doc_acudiente' => '1007884686',
                'telefono' => '3045339886',
            ],
        ];

        $this->importDataset($rows, [
            'nombre' => 'Decimo A',
            'nivel' => 'bachillerato',
            'grado' => '10°',
            'grupo' => 'A',
            'jornada' => 'mañana',
        ]);
    }
}
