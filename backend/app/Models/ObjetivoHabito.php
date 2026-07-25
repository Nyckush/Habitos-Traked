<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class ObjetivoHabito extends Pivot
{
    protected $table = 'objetivo_habitos';

    public $incrementing = true;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'objetivo_id',
        'habito_id',
    ];

    public function objetivo(): BelongsTo
    {
        return $this->belongsTo(Objetivo::class);
    }

    public function habito(): BelongsTo
    {
        return $this->belongsTo(Habito::class);
    }
}
