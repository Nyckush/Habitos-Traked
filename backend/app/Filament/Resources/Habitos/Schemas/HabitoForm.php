<?php

namespace App\Filament\Resources\Habitos\Schemas;

use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Schema;

class HabitoForm
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
                Select::make('frecuencia')
                    ->options([
                        'diaria' => 'Diaria',
                        'semanal' => 'Semanal',
                        'mensual' => 'Mensual',
                        'personalizada' => 'Personalizada',
                    ])
                    ->required(),
                Toggle::make('activo')
                    ->default(true)
                    ->required(),
            ]);
    }
}
