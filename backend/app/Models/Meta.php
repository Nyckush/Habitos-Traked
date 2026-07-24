<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Meta extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'nombre',
        'fecha_inicio',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'estado',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fecha_inicio' => 'date',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function objetivos(): HasMany
    {
        return $this->hasMany(Objetivo::class);
    }

    public function getEstadoAttribute(): string
    {
        $objetivos = $this->relationLoaded('objetivos')
            ? $this->objetivos
            : $this->objetivos()->get();

        if ($objetivos->isEmpty()) {
            return 'En Progreso';
        }

        $estados = $objetivos->pluck('estado');

        if ($estados->every(fn (string $estado): bool => $estado === 'Realizado con Exito')) {
            return 'Completada';
        }

        if ($estados->contains(fn (string $estado): bool => in_array($estado, ['En Progreso', 'Completado Parcialmente'], true))) {
            return 'En Progreso';
        }

        return 'Incompleta';
    }
}
