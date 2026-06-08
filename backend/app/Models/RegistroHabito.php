<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistroHabito extends Model
{
    use HasFactory;

    protected static function booted(): void
    {
        static::saved(fn (self $registro): bool => $registro->recalcularMetasRelacionadas());
        static::deleted(fn (self $registro): bool => $registro->recalcularMetasRelacionadas());
    }

    protected $table = 'registro_habitos';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'habito_id',
        'fecha',
        'completado',
        'observacion',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'fecha' => 'date',
            'completado' => 'boolean',
        ];
    }

    public function habito(): BelongsTo
    {
        return $this->belongsTo(Habito::class);
    }

    protected function recalcularMetasRelacionadas(): bool
    {
        if (blank($this->habito_id)) {
            return true;
        }

        Meta::query()
            ->whereHas('habitos', fn (Builder $query): Builder => $query->whereKey($this->habito_id))
            ->each(function (Meta $meta): void {
                $meta->recalcularEstadoPorObjetivo();
            });

        return true;
    }
}
