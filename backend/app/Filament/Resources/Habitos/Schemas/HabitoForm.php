<?php

namespace App\Filament\Resources\Habitos\Schemas;

use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\TextInput;
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
            ]);
    }
}
