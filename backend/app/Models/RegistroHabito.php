<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RegistroHabito extends Model
{
    use HasFactory;

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
}
