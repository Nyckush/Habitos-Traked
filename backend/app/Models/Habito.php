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

    protected static function booted(): void
    {
        static::creating(function (self $habito): void {
            if (blank($habito->fecha_creacion)) {
                $habito->fecha_creacion = now()->toDateString();
            }
        });
    }

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'nombre',
        'descripcion',
        'frecuencia',
        'activo',
        'fecha_creacion',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'activo' => 'boolean',
            'fecha_creacion' => 'date',
        ];
    }

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
                'duracion_estimada',
                'orden',
            ]);
    }

    public function registrosHabito(): HasMany
    {
        return $this->hasMany(RegistroHabito::class);
    }
}
