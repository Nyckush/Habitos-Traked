<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Filament\Models\Contracts\HasAvatar;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements FilamentUser, HasAvatar
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'nombre',
        'username',
        'perfil',
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
            if (blank($user->username) && filled($user->nombre)) {
                $user->username = $user->nombre;
            }

            if (blank($user->username) && filled($user->name)) {
                $user->username = $user->name;
            }

            if (blank($user->username)) {
                $user->username = (string) str($user->email)->before('@');
            }
        });
    }

    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn (): ?string => $this->attributes['username'] ?? null,
            set: fn (?string $value): array => ['username' => $value],
        );
    }

    protected function nombre(): Attribute
    {
        return Attribute::make(
            get: fn (): ?string => $this->attributes['username'] ?? null,
            set: fn (?string $value): array => ['username' => $value],
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

    public function objetivos(): HasMany
    {
        return $this->hasMany(Objetivo::class);
    }

    public function tareas(): HasMany
    {
        return $this->hasMany(Tarea::class);
    }

    public function metas(): HasMany
    {
        return $this->hasMany(Meta::class);
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return true;
    }

    public function getFilamentAvatarUrl(): ?string
    {
        if (blank($this->perfil)) {
            return null;
        }

        if (str_starts_with($this->perfil, 'http://') || str_starts_with($this->perfil, 'https://')) {
            return $this->perfil;
        }

        if (str_starts_with($this->perfil, '/storage/')) {
            return rtrim((string) config('app.url'), '/') . $this->perfil;
        }

        return rtrim((string) config('app.url'), '/') . Storage::disk('public')->url($this->perfil);
    }
}
