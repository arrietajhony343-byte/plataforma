<?php

namespace Database\Seeders;

class ImportOctavoPrincipalSeeder extends ImportPreescolarPrincipalSeeder
{
    public function run(): void
    {
        $rows = [
            [
                'estudiante' => 'ARDILA CASTELLANO JORGE LUIS',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1048607458',
                'acudiente' => 'ELIS DEL CARMEN CASTELLANO ARROYO',
                'doc_acudiente' => '1048602567',
                'telefono' => '3116268324',
            ],
            [
                'estudiante' => 'ARIAS CASTELLANO LIAN DAVID',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1048607598',
                'acudiente' => 'ANISAIDYS CASTELLANO ARROYO',
                'doc_acudiente' => '1048603514',
                'telefono' => '3053790797',
            ],
            [
                'estudiante' => 'BONZA MANZANO MARIANGEL',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1091990465',
                'acudiente' => 'GISELA LORENA MANZANO DIAZ',
                'doc_acudiente' => '37336674',
                'telefono' => '3150740109',
            ],
            [
                'estudiante' => 'BUENDIA GUERRERO JHONATAN DAVID',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1043994289',
                'acudiente' => 'KELLY JOHANA GUERRERO CALIXTO',
                'doc_acudiente' => '1143363864',
                'telefono' => '3027261792',
            ],
            [
                'estudiante' => 'CANO GOMEZ MATIAS',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1048456817',
                'acudiente' => 'XIOMARA GOMEZ MARTINEZ ADRIANA MADRASTRA',
                'doc_acudiente' => '1064987111',
                'telefono' => '3217535391',
            ],
            [
                'estudiante' => 'CARABALLO DUQUE SEBASTIAN',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1137532982',
                'acudiente' => 'ALEJANDRA DUQUE GUARIN',
                'doc_acudiente' => '1047446975',
                'telefono' => '3217773030',
            ],
            [
                'estudiante' => 'CHIQUILLO GUTIERREZ DANIEL JOSE',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1048456924',
                'acudiente' => 'JOSE MANUEL CHIQUILLO CORTES',
                'doc_acudiente' => '73201424',
                'telefono' => '3188563011',
            ],
            [
                'estudiante' => 'DIAZ MENDOZA MELISSA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201229439',
                'acudiente' => 'ERIKA MENDOZA BENAVIDEZ',
                'doc_acudiente' => '45548701',
                'telefono' => '3113164592',
            ],
            [
                'estudiante' => 'JIMENEZ ARROYO NATALY',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1137533379',
                'acudiente' => 'EVA SANDRITH ARROYO LEGUIA',
                'doc_acudiente' => '1143401743',
                'telefono' => '3103817359',
            ],
            [
                'estudiante' => 'MARIN BARRIOS JULIAN ANDRES',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1025897709',
                'acudiente' => 'LISNEI BARRIOS LOPEZ',
                'doc_acudiente' => '1130824082',
                'telefono' => '3136985397',
            ],
            [
                'estudiante' => 'MELENDEZ MURILLO JOINER MANUEL',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142935775',
                'acudiente' => 'LUZ ESTELA MURILLO MOYAR',
                'doc_acudiente' => '45689159',
                'telefono' => '3215389545',
            ],
            [
                'estudiante' => 'ORTEGA CASTILLA ANDY ERNESTO',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1048940492',
                'acudiente' => 'KELIS MARIA CASTILLA PAJARO',
                'doc_acudiente' => '30871639',
                'telefono' => '3205334320',
            ],
            [
                'estudiante' => 'SANCHEZ JULIO DULCE MARIA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201231214',
                'acudiente' => 'ARLINE JULIO DE AVILA',
                'doc_acudiente' => '33333851',
                'telefono' => '3042540430',
            ],
            [
                'estudiante' => 'TRIBINO PAJARO ISABEL SOFIA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1043311751',
                'acudiente' => 'NEIDY DEL CARMEN PAJARO ROSARIO',
                'doc_acudiente' => '22785617',
                'telefono' => '3108374294',
            ],
            [
                'estudiante' => 'VARGAS CASTRO VICTOR MANUEL',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201234987',
                'acudiente' => 'VIVIAN KARINA CASTRO RIVERA',
                'doc_acudiente' => '1042088614',
                'telefono' => '3114391878',
            ],
            [
                'estudiante' => 'ACOSTA MEDINA MARIA FERNANDA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1043990443',
                'acudiente' => 'ARNULFO ACOSTA ESTRADA',
                'doc_acudiente' => '73125962',
                'telefono' => '3104406435',
            ],
            [
                'estudiante' => 'RUIZ MARTINEZ EMMANUEL',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1044927902',
                'acudiente' => 'ROSIRIS DEL CARMEN MARTINEZ HIDALGO',
                'doc_acudiente' => '30765965',
                'telefono' => '3018023753',
            ],
        ];

        $this->importDataset($rows, [
            'nombre' => 'Octavo A',
            'nivel' => 'bachillerato',
            'grado' => '8°',
            'grupo' => 'A',
            'jornada' => 'mañana',
        ]);
    }
}
