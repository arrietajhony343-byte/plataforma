<?php

namespace Database\Seeders;

class ImportQuintoPrincipalSeeder extends ImportPreescolarPrincipalSeeder
{
    public function run(): void
    {
        $rows = [
            [
                'estudiante' => 'ARRIETA OSPINO BRYANNA SOFIA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1050972260',
                'acudiente' => 'JORAINE DAGER',
                'doc_acudiente' => '1143376179',
                'telefono' => '3205597258',
            ],
            [
                'estudiante' => 'BELTRAN CASTRO TALIANA ISABEL',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201251464',
                'acudiente' => 'ANGELICA MARIA MARTINEZ GARCIA',
                'doc_acudiente' => '33226470',
                'telefono' => '3008283350',
            ],
            [
                'estudiante' => 'BERMEJO CASTILLO CRISTOPHER JOSE',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142947040',
                'acudiente' => 'AURA CRISTINA BRAN BERRIO',
                'doc_acudiente' => '1022098016',
                'telefono' => '3155020819',
            ],
            [
                'estudiante' => 'CASTRO RUIZ EMMANUEL JAVID',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1043999975',
                'acudiente' => 'LIZBETH LEONOR PAEZ RAMIREZ',
                'doc_acudiente' => '1124401780',
                'telefono' => '3165222764',
            ],
            [
                'estudiante' => 'FUENTES LORA SAMUEL ALEJANDRO',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1043322151',
                'acudiente' => 'YESENIA INES URANGO SIBAJA',
                'doc_acudiente' => '23175405',
                'telefono' => '3015566976',
            ],
            [
                'estudiante' => 'GARCIA MONTERROSA JUAN JOSE',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201252330',
                'acudiente' => 'KEILA DILIMAR ACOSTA TALAVERA',
                'doc_acudiente' => '6178904',
                'telefono' => '3215756162',
            ],
            [
                'estudiante' => 'GIL MONTES DERECK JAVIER',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1048459806',
                'acudiente' => 'MAIRA ALEJANDRA ROMERO AMARIZO',
                'doc_acudiente' => '45759839',
                'telefono' => '3135438419',
            ],
            [
                'estudiante' => 'GONZALEZ ARRIETA ASHLEY',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1048458286',
                'acudiente' => 'MAYRA FRANCO CASTRO',
                'doc_acudiente' => '1143118756',
                'telefono' => '3002118038',
            ],
            [
                'estudiante' => 'LOPEZ ROMERO KELLY JOHANA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1051420029',
                'acudiente' => 'MERIETH DEL CARMEN DE LA HOZ ZULBARAN',
                'doc_acudiente' => '45548659',
                'telefono' => '3006649278',
            ],
            [
                'estudiante' => 'MAGALLANES SALGADO SAMANTHA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142946314',
                'acudiente' => 'OMARYS DEL CARMEN PADILLA JASPE',
                'doc_acudiente' => '1047414154',
                'telefono' => '3022155515',
            ],
            [
                'estudiante' => 'OROZCO MERCADO THIAGO ANDRES',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1043320808',
                'acudiente' => 'KEVIN JOSE GUERRERO BERRIO',
                'doc_acudiente' => '1047414077',
                'telefono' => '3207337399',
            ],
            [
                'estudiante' => 'PEREZ MARTINEZ SAMUEL JOSE',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201256271',
                'acudiente' => 'YURANIS MALO RODRIGUEZ',
                'doc_acudiente' => '1128045640',
                'telefono' => '3004005675',
            ],
            [
                'estudiante' => 'RAMOS CASSIANI SERGIO LUIS',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142945780',
                'acudiente' => 'CINDY ROCIO NEGRETE ARROYAVE',
                'doc_acudiente' => '1138029587',
                'telefono' => '3145813615',
            ],
            [
                'estudiante' => 'RUZ JIMENEZ MIGUEL ANGEL',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1137535415',
                'acudiente' => 'ROSEMARY DEL RIO CABARCAS',
                'doc_acudiente' => '22804938',
                'telefono' => '3175140782',
            ],
            [
                'estudiante' => 'SIMANCAS VALDEZ ISABELLA',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1142945282',
                'acudiente' => 'LIVIVET CASTELIAR ALGARIN',
                'doc_acudiente' => '32907338',
                'telefono' => '3244010447',
            ],
            [
                'estudiante' => 'VELIZ ESPINOZA SOPHIA NAZARETH',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1238340597',
                'acudiente' => 'MARYS DEL MAR PEREZ MORELO',
                'doc_acudiente' => '33333094',
                'telefono' => '3046217590',
            ],
            [
                'estudiante' => 'SARA SOFIA NORIEGA SUAREZ',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201249717',
                'acudiente' => 'LIDIS MARIA ALMARIO VILLADIEGO',
                'doc_acudiente' => '45368895',
                'telefono' => '3158240541',
            ],
            [
                'estudiante' => 'JIMENEZ VASQUEZ SANTIAGO DE JESUS',
                'tipo_doc_estudiante' => 'TI',
                'doc_estudiante' => '1201241292',
                'acudiente' => 'LIDIS MARIA ALMARIO VILLADIEGO',
                'doc_acudiente' => '45368895',
                'telefono' => '3158240541',
            ],
        ];

        $this->importDataset($rows, [
            'nombre' => 'Quinto A',
            'nivel' => 'primaria',
            'grado' => '5°',
            'grupo' => 'A',
            'jornada' => 'mañana',
        ]);
    }
}
