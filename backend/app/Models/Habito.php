<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Habito extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'nombre',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function rutinas(): BelongsToMany
    {
        return $this->belongsToMany(Rutina::class, 'rutina_habitos')
            ->using(RutinaHabito::class)
            ->withPivot([
                'hora_inicio',
            ]);
    }

    public function registrosHabito(): HasMany
    {
        return $this->hasMany(RegistroHabito::class);
    }

    public function actividades(): HasMany
    {
        return $this->hasMany(ActividadHabito::class);
    }

    public function objetivos(): HasMany
    {
        return $this->hasMany(Objetivo::class);
    }
}
