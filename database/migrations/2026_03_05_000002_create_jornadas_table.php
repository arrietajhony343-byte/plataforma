<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('jornadas', function (Blueprint $table) {
            $table->id();
            $table->string('nivel', 30)->unique(); // general | preescolar | primaria | bachillerato
            $table->json('bloques');               // [{hora, hora_fin, es_descanso?}, ...]
            $table->timestamps();
        });

        // Semilla con valores por defecto
        $general = [
            ['hora' => '7:00', 'horaFin' => '7:50'],
            ['hora' => '7:50', 'horaFin' => '8:40'],
            ['hora' => '8:40', 'horaFin' => '9:30'],
            ['hora' => '9:30', 'horaFin' => '10:00', 'esDescanso' => true],
            ['hora' => '10:00', 'horaFin' => '10:50'],
            ['hora' => '10:50', 'horaFin' => '11:40'],
            ['hora' => '11:40', 'horaFin' => '12:00', 'esDescanso' => true],
            ['hora' => '12:00', 'horaFin' => '12:50'],
            ['hora' => '12:50', 'horaFin' => '13:40'],
        ];

        $preescolar = [
            ['hora' => '7:00', 'horaFin' => '7:50'],
            ['hora' => '7:50', 'horaFin' => '8:40'],
            ['hora' => '8:40', 'horaFin' => '9:10', 'esDescanso' => true],
            ['hora' => '9:10', 'horaFin' => '10:00'],
            ['hora' => '10:00', 'horaFin' => '10:50'],
            ['hora' => '10:50', 'horaFin' => '11:15', 'esDescanso' => true],
            ['hora' => '11:15', 'horaFin' => '12:05'],
        ];

        foreach ([
            ['nivel' => 'general',      'bloques' => $general],
            ['nivel' => 'preescolar',   'bloques' => $preescolar],
            ['nivel' => 'primaria',     'bloques' => $general],
            ['nivel' => 'bachillerato', 'bloques' => $general],
        ] as $row) {
            DB::table('jornadas')->insert([
                'nivel'      => $row['nivel'],
                'bloques'    => json_encode($row['bloques']),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('jornadas');
    }
};
