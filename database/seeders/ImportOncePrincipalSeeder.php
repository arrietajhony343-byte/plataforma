<?php

namespace Database\Seeders;

class ImportOncePrincipalSeeder extends ImportPreescolarPrincipalSeeder
{
    public function run(): void
    {
        $rows = [
            [
                'estudiante' => 'ALVAREZ REYES DARCY MARIA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1043975039',
                'acudiente' => 'ISOLINA REYES',
                'doc_acudiente' => '45498422',
                'telefono' => '3004551959',
            ],
            [
                'estudiante' => 'ATEHORTUA MARTINEZ LAURA SOFIA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1040040264',
                'acudiente' => 'CRISTINA ATEHORTUA MARTINEZ',
                'doc_acudiente' => '1007115054',
                'telefono' => '3106120583',
            ],
            [
                'estudiante' => 'CABARCAS HERRERA FABIAN',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201216753',
                'acudiente' => 'NAYIBE HERRERA BUSTAMANTE',
                'doc_acudiente' => '45690871',
                'telefono' => '3006106593',
            ],
            [
                'estudiante' => 'CALDERA DIAZ ENRIQUE ALEJANDRO',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1042586984',
                'acudiente' => 'ENRIQUE CALDERA RAMIREZ',
                'doc_acudiente' => '9098382',
                'telefono' => '3006271664',
            ],
            [
                'estudiante' => 'DUQUE AGUDELO SEBASTIAN',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142925512',
                'acudiente' => 'NELVI ROSA AGUDELO ARISTIZABAL',
                'doc_acudiente' => '39211937',
                'telefono' => '3008941790',
            ],
            [
                'estudiante' => 'GUARDO LEON JUAN ANDRES',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1044636319',
                'acudiente' => 'JUAN CARLOS GUARDO CASTELLON',
                'doc_acudiente' => '1000000006',
                'telefono' => '3053750855',
            ],
            [
                'estudiante' => 'MIRANDA OVIEDO DANIEL ANDRES',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1143361866',
                'acudiente' => 'NIZA MIRANDA OVIEDO',
                'doc_acudiente' => '45646519',
                'telefono' => '3003780239',
            ],
            [
                'estudiante' => 'MORILLO OSPINO JOSE ANGEL',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1043656856',
                'acudiente' => 'MARLEDIYS OSPINO BELLO',
                'doc_acudiente' => '45372819',
                'telefono' => '3183077321',
            ],
            [
                'estudiante' => 'PADILLA MARTINEZ SARAY',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1043982179',
                'acudiente' => 'MERLYS MARTINEZ MENDEZ',
                'doc_acudiente' => '45690718',
                'telefono' => '3104419249',
            ],
            [
                'estudiante' => 'RIOS PAJARO MATEO DE JESUS',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1063155294',
                'acudiente' => 'DAYZ BURGOS HERNANDEZ',
                'doc_acudiente' => '45421226',
                'telefono' => '3013335066',
            ],
            [
                'estudiante' => 'RIVERA CABARCAS NAIBEYIS MARCELA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142924489',
                'acudiente' => 'NELVIS DEL CARMEN CABARCAS SERRANO',
                'doc_acudiente' => '45687108',
                'telefono' => '3225141948',
            ],
            [
                'estudiante' => 'HERNANDEZ GONZALEZ TYLER SANTIAGO',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142927280',
                'acudiente' => 'SILVIA INES GONZALEZ CRAWFORD',
                'doc_acudiente' => '1047395822',
                'telefono' => '3014477145',
            ],
        ];

        $this->importDataset($rows, [
            'nombre' => 'Once A',
            'nivel' => 'bachillerato',
            'grado' => '11°',
            'grupo' => 'A',
            'jornada' => 'mañana',
        ]);
    }
}
