<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RutinaDia extends Model
{
    use HasFactory;

    public $timestamps = false;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'rutina_id',
        'dia_semana',
    ];

    public function rutina(): BelongsTo
    {
        return $this->belongsTo(Rutina::class);
    }
}
