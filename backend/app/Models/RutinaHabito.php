<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RutinaHabito extends Model
{
    public $timestamps = false;
    public $incrementing = true;

    /**
     * @var string
     */
    protected $table = 'rutina_habitos';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'rutina_id',
        'habito_id',
        'hora_inicio',
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
