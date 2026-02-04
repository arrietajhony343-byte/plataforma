<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Primero crear roles y permisos
        $this->call(RoleSeeder::class);

        // Crear usuario administrador
        $admin = User::factory()->create([
            'name' => 'Administrador',
            'email' => 'admin@colegio.com',
        ]);
        $admin->assignRole('admin');

        // Crear profesor de ejemplo
        $profesor = User::factory()->create([
            'name' => 'Carlos Díaz',
            'email' => 'profesor@colegio.com',
        ]);
        $profesor->assignRole('profesor');

        // Crear estudiante de ejemplo
        $estudiante = User::factory()->create([
            'name' => 'Juan Pérez',
            'email' => 'estudiante@colegio.com',
        ]);
        $estudiante->assignRole('estudiante');
    }
}
