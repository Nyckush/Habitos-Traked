<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Meta extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'titulo',
        'motivo',
        'objetivo',
        'fecha_inicio',
        'fecha_limite',
        'estado',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'objetivo' => 'integer',
            'fecha_inicio' => 'date',
            'fecha_limite' => 'date',
        ];
    }

    public function getEjecucionesCompletadasAttribute(): int
    {
        return $this->contarEjecucionesCompletadas();
    }

    public function contarEjecucionesCompletadas(): int
    {
        if (blank($this->fecha_inicio) || blank($this->fecha_limite) || blank($this->id)) {
            return 0;
        }

        return RegistroHabito::query()
            ->where('completado', true)
            ->whereBetween('fecha', [
                $this->fecha_inicio->toDateString(),
                $this->fecha_limite->toDateString(),
            ])
            ->whereHas('habito.metas', fn (Builder $query): Builder => $query->whereKey($this->id))
            ->count();
    }

    public function recalcularEstadoPorObjetivo(): void
    {
        if ($this->estado === 'CANCELADA') {
            return;
        }

        $ejecuciones = $this->contarEjecucionesCompletadas();
        $objetivo = max(1, (int) $this->objetivo);

        $estado = $ejecuciones >= $objetivo
            ? 'COMPLETADA'
            : ($ejecuciones > 0 ? 'EN_PROGRESO' : 'PENDIENTE');

        if ($this->estado === $estado) {
            return;
        }

        $this->forceFill(['estado' => $estado])->saveQuietly();
    }

    public function habitos(): BelongsToMany
    {
        return $this->belongsToMany(Habito::class, 'habito_metas')
            ->withTimestamps();
    }

    public function tareas(): HasMany
    {
        return $this->hasMany(Tarea::class);
    }
}
