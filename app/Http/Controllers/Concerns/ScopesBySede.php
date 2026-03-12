<?php

namespace App\Http\Controllers\Concerns;

/**
 * Trait para filtrar queries por sede cuando el usuario autenticado
 * tiene rol 'coordinador'. Cualquier controlador admin que use este trait
 * podrá llamar $this->sedeId() y obtener la sede asignada o null.
 */
trait ScopesBySede
{
    /**
     * Devuelve el sede_id del coordinador autenticado, o null si es admin.
     */
    protected function sedeId(): ?int
    {
        $user = auth()->user();
        if ($user && $user->hasRole('coordinador')) {
            return $user->sede_id;
        }
        return null;
    }

    /**
     * ¿El usuario actual es coordinador?
     */
    protected function isCoordinador(): bool
    {
        return (bool) auth()->user()?->hasRole('coordinador');
    }

    /**
     * Aplica where('sede_id', ...) a una query si el usuario es coordinador.
     */
    protected function scopeSede($query)
    {
        if ($sedeId = $this->sedeId()) {
            $query->where('sede_id', $sedeId);
        }
        return $query;
    }
}
