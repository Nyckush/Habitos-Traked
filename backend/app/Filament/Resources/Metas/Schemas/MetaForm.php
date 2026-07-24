<?php

namespace App\Filament\Resources\Metas\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class MetaForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Hidden::make('user_id')
                    ->default(fn (): ?int => auth()->id())
                    ->required(),
                TextInput::make('nombre')
                    ->required()
                    ->maxLength(255),
                DatePicker::make('fecha_inicio')
                    ->default(today())
                    ->required(),
                Placeholder::make('estado')
                    ->label('Estado')
                    ->content(fn ($record): string => $record?->estado ?? 'En Progreso'),
            ]);
    }
}
