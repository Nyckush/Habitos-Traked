<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActividadHabito extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $table = 'actividad_habitos';

    /**
     * @var list<string>
     */
    protected $fillable = [
        'habito_id',
        'nombre',
    ];

    public function habito(): BelongsTo
    {
        return $this->belongsTo(Habito::class);
    }
}
