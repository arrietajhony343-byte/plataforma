<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'documento',
        'tipo_documento',
        'telefono',
        'direccion',
        'fecha_nacimiento',
        'genero',
        'foto',
        'activo',
        'login_attempts',
        'last_login_at',
        'must_change_password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at'    => 'datetime',
            'password'             => 'hashed',
            'fecha_nacimiento'     => 'date',
            'activo'               => 'boolean',
            'last_login_at'        => 'datetime',
            'must_change_password' => 'boolean',
        ];
    }

    /* ══════════════════════════════════════════════
     *  Relaciones como ESTUDIANTE
     * ══════════════════════════════════════════════ */

    /** Matrículas del estudiante */
    public function matriculas(): HasMany
    {
        return $this->hasMany(Matricula::class, 'estudiante_id');
    }

    /** Notas del estudiante */
    public function notas(): HasMany
    {
        return $this->hasMany(Nota::class, 'estudiante_id');
    }

    /** Entregas del estudiante */
    public function entregas(): HasMany
    {
        return $this->hasMany(Entrega::class, 'estudiante_id');
    }

    /** Observaciones recibidas */
    public function observacionesRecibidas(): HasMany
    {
        return $this->hasMany(Observacion::class, 'estudiante_id');
    }

    /** Padres / acudientes del estudiante */
    public function padres(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'padre_estudiante', 'estudiante_id', 'padre_id')
                    ->withPivot('parentesco')
                    ->withTimestamps();
    }

    /** Pagos del estudiante */
    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class, 'estudiante_id');
    }

    /** Boletines del estudiante */
    public function boletines(): HasMany
    {
        return $this->hasMany(Boletin::class, 'estudiante_id');
    }

    /** Certificados del estudiante */
    public function certificados(): HasMany
    {
        return $this->hasMany(Certificado::class, 'estudiante_id');
    }

    /* ══════════════════════════════════════════════
     *  Relaciones como PADRE
     * ══════════════════════════════════════════════ */

    /** Hijos / acudidos del padre */
    public function hijos(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'padre_estudiante', 'padre_id', 'estudiante_id')
                    ->withPivot('parentesco')
                    ->withTimestamps();
    }

    /* ══════════════════════════════════════════════
     *  Relaciones como PROFESOR
     * ══════════════════════════════════════════════ */

    /** Curso-materias que dicta */
    public function cursoMaterias(): HasMany
    {
        return $this->hasMany(CursoMateria::class, 'profesor_id');
    }

    /** Observaciones escritas por el profesor */
    public function observacionesEscritas(): HasMany
    {
        return $this->hasMany(Observacion::class, 'profesor_id');
    }

    /** Cursos donde es director de grupo */
    public function cursosDirector(): HasMany
    {
        return $this->hasMany(Curso::class, 'director_grupo_id');
    }

    /* ══════════════════════════════════════════════
     *  Relaciones generales
     * ══════════════════════════════════════════════ */

    /** Mensajes enviados */
    public function mensajesEnviados(): HasMany
    {
        return $this->hasMany(Mensaje::class, 'remitente_id');
    }

    /** Mensajes recibidos */
    public function mensajesRecibidos(): HasMany
    {
        return $this->hasMany(Mensaje::class, 'destinatario_id');
    }

    /** Notificaciones */
    public function notificaciones(): HasMany
    {
        return $this->hasMany(Notificacion::class);
    }

    /** Logs de actividad sobre este usuario */
    public function activityLogs(): HasMany
    {
        return $this->hasMany(UserActivityLog::class);
    }

    /* ══════════════════════════════════════════════
     *  Helpers
     * ══════════════════════════════════════════════ */

    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    public function scopeRol($query, string $role)
    {
        return $query->role($role);
    }

    /** Nombre corto: primer nombre + primer apellido */
    public function getNombreCortoAttribute(): string
    {
        $parts = explode(' ', $this->name);
        return count($parts) >= 2 ? $parts[0] . ' ' . $parts[1] : $this->name;
    }
}
