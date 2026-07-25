<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Objetivo extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'meta_id',
        'nombre',
        'meta_esperada',
        'fecha_limite',
    ];

    /**
     * @var list<string>
     */
    protected $appends = [
        'meta_actual',
        'tasa_exito',
        'estado',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'meta_esperada' => 'integer',
            'fecha_limite' => 'date',
        ];
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function meta(): BelongsTo
    {
        return $this->belongsTo(Meta::class);
    }

    public function habitos(): BelongsToMany
    {
        return $this->belongsToMany(Habito::class, 'objetivo_habitos')
            ->using(ObjetivoHabito::class)
            ->withTimestamps();
    }

    public function getMetaActualAttribute(): int
    {
        return $this->calcularMetaActual();
    }

    public function getTasaExitoAttribute(): float
    {
        $esperada = max(1, (int) $this->meta_esperada);

        return round(($this->meta_actual / $esperada) * 100, 2);
    }

    public function getEstadoAttribute(): string
    {
        if ($this->meta_actual >= (int) $this->meta_esperada) {
            return 'Realizado con Exito';
        }

        if (today()->gt($this->fecha_limite)) {
            return 'Vencido';
        }

        if ($this->meta_actual > 0) {
            return 'Completado Parcialmente';
        }

        return 'En Progreso';
    }

    public function calcularMetaActual(): int
    {
        if (blank($this->fecha_limite) || blank($this->created_at)) {
            return 0;
        }

        $habitoIds = $this->relationLoaded('habitos')
            ? $this->habitos->pluck('id')->all()
            : $this->habitos()->pluck('habitos.id')->all();

        if ($habitoIds === []) {
            return 0;
        }

        return RegistroHabito::query()
            ->whereIn('habito_id', $habitoIds)
            ->where('completado', true)
            ->whereBetween('fecha', [
                $this->created_at->toDateString(),
                $this->fecha_limite->toDateString(),
            ])
            ->count();
    }
}
