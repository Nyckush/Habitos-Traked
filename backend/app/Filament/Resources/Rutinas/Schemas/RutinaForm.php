<?php

namespace App\Filament\Resources\Rutinas\Schemas;

use Filament\Forms\Components\CheckboxList;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;

class RutinaForm
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
                Textarea::make('descripcion')
                    ->required()
                    ->rows(3)
                    ->columnSpanFull(),
                CheckboxList::make('dias_semana')
                    ->label('Dias de la semana')
                    ->options([
                        'lunes' => 'Lunes',
                        'martes' => 'Martes',
                        'miercoles' => 'Miercoles',
                        'jueves' => 'Jueves',
                        'viernes' => 'Viernes',
                        'sabado' => 'Sabado',
                        'domingo' => 'Domingo',
                    ])
                    ->columns(2)
                    ->minItems(1)
                    ->required(),
            ]);
    }
}
