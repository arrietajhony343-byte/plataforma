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
        // 1. Roles y permisos
        $this->call(RoleSeeder::class);

        // 2. Usuario administrador (único que no crea DatosColegioSeeder)
        $admin = User::create([
            'name'           => 'Administrador General',
            'email'          => 'admin@colegio.com',
            'password'       => bcrypt('password'),
            'documento'      => '00000001',
            'tipo_documento' => 'CC',
            'telefono'       => '3001000001',
            'activo'         => true,
        ]);
        $admin->assignRole('admin');

        // 3. Todos los datos del colegio (profesores, estudiantes, padres, cursos, notas, etc.)
        $this->call(DatosColegioSeeder::class);
    }
}
