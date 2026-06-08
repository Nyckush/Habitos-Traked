<?php

namespace App\Filament\Resources\Tareas\Schemas;

use App\Models\Meta;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class TareaForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Hidden::make('user_id')
                    ->default(fn (): ?int => auth()->id())
                    ->required(),
                Select::make('meta_id')
                    ->label('Meta')
                    ->options(fn (): array => Meta::query()
                        ->whereHas('habitos', fn ($query) => $query->where('user_id', auth()->id()))
                        ->orderBy('titulo')
                        ->pluck('titulo', 'id')
                        ->all())
                    ->searchable()
                    ->preload()
                    ->nullable(),
                TextInput::make('titulo')
                    ->required()
                    ->maxLength(255),
                Textarea::make('descripcion')
                    ->rows(3)
                    ->columnSpanFull(),
                DateTimePicker::make('fecha_vencimiento')
                    ->seconds(false)
                    ->nullable(),
                Select::make('prioridad')
                    ->options([
                        'BAJA' => 'Baja',
                        'MEDIA' => 'Media',
                        'ALTA' => 'Alta',
                        'URGENTE' => 'Urgente',
                    ])
                    ->default('MEDIA')
                    ->required(),
                Select::make('estado')
                    ->options([
                        'PENDIENTE' => 'Pendiente',
                        'EN_PROGRESO' => 'En progreso',
                        'COMPLETADA' => 'Completada',
                        'CANCELADA' => 'Cancelada',
                    ])
                    ->default('PENDIENTE')
                    ->required(),
            ]);
    }
}
