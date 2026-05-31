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
        'orden',
    ];

    public function rutina(): BelongsTo
    {
        return $this->belongsTo(Rutina::class);
    }

    public function habito(): BelongsTo
    {
        return $this->belongsTo(Habito::class);
    }
}
