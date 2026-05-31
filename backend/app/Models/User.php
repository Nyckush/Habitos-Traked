<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'nombre',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $user): void {
            if (blank($user->nombre) && filled($user->name)) {
                $user->nombre = $user->name;
            }

            if (blank($user->nombre)) {
                $user->nombre = (string) str($user->email)->before('@');
            }
        });
    }

    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn (): ?string => $this->attributes['nombre'] ?? null,
            set: fn (?string $value): array => ['nombre' => $value],
        );
    }

    public function habitos(): HasMany
    {
        return $this->hasMany(Habito::class);
    }

    public function rutinas(): HasMany
    {
        return $this->hasMany(Rutina::class);
    }
}
