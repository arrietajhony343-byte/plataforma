<?php

namespace Database\Seeders;

class ImportCuartoPrincipalSeeder extends ImportPreescolarPrincipalSeeder
{
    public function run(): void
    {
        $rows = [
            [
                'estudiante' => 'ARAQUE ACOSTA DULCE MARIA',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1044005629',
                'acudiente' => 'ZESIANY YAMALITH ACOSTA DIAZ',
                'doc_acudiente' => '1047450995',
                'telefono' => '3147348433',
            ],
            [
                'estudiante' => 'ARNEDO MENDOZA JERONIMO',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201258707',
                'acudiente' => 'MARLY PATRICIA MENDOZA CANO',
                'doc_acudiente' => '1065562767',
                'telefono' => '3102939557',
            ],
            [
                'estudiante' => 'COY BLANCO SALOME CRISTINA',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1044005111',
                'acudiente' => 'ANA MARIA BLANCO GORDON',
                'doc_acudiente' => '1050952638',
                'telefono' => '3008114663',
            ],
            [
                'estudiante' => 'DE ARCO AMADOR MERLIS SOFIA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201258220',
                'acudiente' => 'CIMENA AMADOR MORENO',
                'doc_acudiente' => '30088344',
                'telefono' => '3136656379',
            ],
            [
                'estudiante' => 'GEROSA RAMOS LIAM ALDAHIR',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201265595',
                'acudiente' => 'YESICA RAMOS CANTERO',
                'doc_acudiente' => '1047438886',
                'telefono' => '3104251581',
            ],
            [
                'estudiante' => 'JIMENEZ VERBEL ABIGAIL',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1048460033',
                'acudiente' => 'ANGELICA VERBEL QUINTERO',
                'doc_acudiente' => '1069481509',
                'telefono' => '3166175721',
            ],
            [
                'estudiante' => 'LAVIERA PIRELA JUAN ANDRES',
                'tipo_doc_estudiante' => 'CE',
                'doc_estudiante' => '37565317',
                'acudiente' => 'ADELAIMIS NOSLIN PIRELA VILCREZ',
                'doc_acudiente' => '19809482',
                'telefono' => '3245098406',
            ],
            [
                'estudiante' => 'VALDIRIS LOPEZ STEFANIA',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1044003736',
                'acudiente' => 'FANNY MARCELA LOPEZ ARRIETA',
                'doc_acudiente' => '1047421535',
                'telefono' => '3116888207',
            ],
            [
                'estudiante' => 'MARQUEZ OSPINA SABINA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1044000757',
                'acudiente' => 'DIANA CAROLINA OSPINA SABALZA',
                'doc_acudiente' => '1047433667',
                'telefono' => '3017704066',
            ],
            [
                'estudiante' => 'MARTINEZ MONTENEGRO CHRISTINE',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201262918',
                'acudiente' => 'LUZ ESTELA MONTENEGRO PEREIRA',
                'doc_acudiente' => '1143340364',
                'telefono' => '3024601891',
            ],
            [
                'estudiante' => 'OROZCO MERCADO RONY ANDRES',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1043326014',
                'acudiente' => 'ADELA MARGARITA MERCADO DE AVILA',
                'doc_acudiente' => '32938456',
                'telefono' => '3008579864',
            ],
            [
                'estudiante' => 'ORTIZ SABALZA LUIS SANTIAGO',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1043998477',
                'acudiente' => 'ADRIANA CAROLINA SABALZA PALLARES',
                'doc_acudiente' => '1047465488',
                'telefono' => '3023257376',
            ],
            [
                'estudiante' => 'PEREIRA MEJIA AINHOA SHAMARA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1044003497',
                'acudiente' => 'ANDREINA FRANCIS MEJIA GARCIA',
                'doc_acudiente' => '644157',
                'telefono' => '3508377136',
            ],
            [
                'estudiante' => 'HERNANDEZ GONZALEZ HUGO HERNAN',
                'tipo_doc_estudiante' => 'RC',
                'doc_estudiante' => '1201259439',
                'acudiente' => 'SILVIA INES GONZALEZ CRAWFORD',
                'doc_acudiente' => '1047395822',
                'telefono' => '3014477145',
            ],
            [
                'estudiante' => 'JIMENEZ VASQUEZ SAMUEL JOSE',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201255377',
                'acudiente' => 'ALEXANDRA VASQUEZ ALVAREZ',
                'doc_acudiente' => '1143380124',
                'telefono' => '3045275515',
            ],
        ];

        $this->importDataset($rows, [
            'nombre' => 'Cuarto A',
            'nivel' => 'primaria',
            'grado' => '4°',
            'grupo' => 'A',
            'jornada' => 'mañana',
        ]);
    }
}
