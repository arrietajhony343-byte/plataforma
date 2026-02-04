<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        // Crear roles
        $admin = Role::create(['name' => 'admin']);
        $profesor = Role::create(['name' => 'profesor']);
        $estudiante = Role::create(['name' => 'estudiante']);
        $padre = Role::create(['name' => 'padre']);

        // Crear permisos
        $permissions = [
            // Usuarios
            'users.index',
            'users.create',
            'users.edit',
            'users.delete',
            
            // Cursos
            'cursos.index',
            'cursos.create',
            'cursos.edit',
            'cursos.delete',
            
            // Materias
            'materias.index',
            'materias.create',
            'materias.edit',
            'materias.delete',
            
            // Notas
            'notas.index',
            'notas.create',
            'notas.edit',
            'notas.delete',
            'notas.view-own',
            
            // Observaciones
            'observaciones.index',
            'observaciones.create',
            'observaciones.edit',
            'observaciones.delete',
            'observaciones.view-own',
            
            // Boletines
            'boletines.index',
            'boletines.generate',
            'boletines.download',
            
            // Periodos
            'periodos.index',
            'periodos.create',
            'periodos.edit',
            'periodos.delete',
            
            // Reportes
            'reportes.index',
            'reportes.generate',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Asignar todos los permisos al admin
        $admin->givePermissionTo(Permission::all());

        // Permisos del profesor
        $profesor->givePermissionTo([
            'cursos.index',
            'notas.index',
            'notas.create',
            'notas.edit',
            'observaciones.index',
            'observaciones.create',
            'observaciones.edit',
            'boletines.index',
            'boletines.generate',
        ]);

        // Permisos del estudiante
        $estudiante->givePermissionTo([
            'notas.view-own',
            'observaciones.view-own',
            'boletines.download',
        ]);

        // Permisos del padre (solo consulta)
        $padre->givePermissionTo([
            'notas.view-own',
            'observaciones.view-own',
            'boletines.download',
        ]);
    }
}
