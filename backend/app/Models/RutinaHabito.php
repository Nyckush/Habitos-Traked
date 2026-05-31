<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class RutinaHabito extends Pivot
{
    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'rutina_id',
        'habito_id',
        'hora_inicio',
        'duracion_estimada',
        'orden',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'duracion_estimada' => 'integer',
        ];
    }

    public function rutina(): BelongsTo
    {
        return $this->belongsTo(Rutina::class);
    }

    public function habito(): BelongsTo
    {
        return $this->belongsTo(Habito::class);
    }
}
