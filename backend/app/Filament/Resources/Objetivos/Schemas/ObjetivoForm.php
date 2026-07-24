<?php

namespace App\Filament\Resources\Objetivos\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;
use Illuminate\Database\Eloquent\Builder;

class ObjetivoForm
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
                    ->relationship(
                        name: 'meta',
                        titleAttribute: 'nombre',
                        modifyQueryUsing: fn (Builder $query): Builder => $query->where('user_id', auth()->id()),
                    )
                    ->searchable()
                    ->preload()
                    ->required(),
                TextInput::make('nombre')
                    ->required()
                    ->maxLength(255),
                Select::make('habito_id')
                    ->label('Habito')
                    ->relationship(
                        name: 'habito',
                        titleAttribute: 'nombre',
                        modifyQueryUsing: fn (Builder $query): Builder => $query->where('user_id', auth()->id()),
                    )
                    ->searchable()
                    ->preload()
                    ->required(),
                TextInput::make('meta_esperada')
                    ->numeric()
                    ->minValue(1)
                    ->step('1')
                    ->helperText('Cantidad de veces que el habito debe completarse antes de la fecha limite.')
                    ->required(),
                DatePicker::make('fecha_limite')
                    ->minDate(today())
                    ->required(),
            ]);
    }
}
