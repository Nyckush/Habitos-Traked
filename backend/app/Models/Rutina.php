<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Rutina extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'nombre',
        'descripcion',
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function habitos(): BelongsToMany
    {
        return $this->belongsToMany(Habito::class, 'rutina_habitos')
            ->using(RutinaHabito::class)
            ->withPivot([
                'hora_inicio',
                'duracion_estimada',
                'orden',
            ])
            ->orderByPivot('orden');
    }

    public function rutinaDias(): HasMany
    {
        return $this->hasMany(RutinaDia::class);
    }
}
