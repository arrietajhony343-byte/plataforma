<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Fix periodos year: they have 2026 dates but anio:2025 — update to 2026
        DB::table('periodos')
            ->where('anio', 2025)
            ->update(['anio' => 2026]);

        // 2. Delete duplicate matriculas — keep only the one with the lowest id per (estudiante_id, curso_id)
        // First, find the IDs to keep (one per student+course)
        $keepIds = DB::table('matriculas')
            ->selectRaw('MIN(id) as id')
            ->groupBy('estudiante_id', 'curso_id')
            ->pluck('id')
            ->toArray();

        if (!empty($keepIds)) {
            DB::table('matriculas')
                ->whereNotIn('id', $keepIds)
                ->delete();
        }

        // 3. All remaining matriculas should point to periodo_id=1 (Primer Periodo 2026)
        //    and have estado=activa
        DB::table('matriculas')->update([
            'periodo_id' => 1,
            'estado'     => 'activa',
        ]);
    }

    public function down(): void
    {
        // Revert periodos year back to 2025
        DB::table('periodos')
            ->where('anio', 2026)
            ->update(['anio' => 2025]);
        // Note: duplicate matriculas and periodo_id changes are not reversible
    }
};
