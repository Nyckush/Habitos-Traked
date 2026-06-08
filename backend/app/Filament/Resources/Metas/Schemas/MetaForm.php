<?php

namespace App\Filament\Resources\Metas\Schemas;

use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Schema;
use Illuminate\Database\Eloquent\Builder;

class MetaForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('titulo')
                    ->required()
                    ->maxLength(255),
                Textarea::make('motivo')
                    ->rows(3)
                    ->columnSpanFull(),
                TextInput::make('objetivo')
                    ->numeric()
                    ->minValue(1)
                    ->step('1')
                    ->helperText('Cantidad total de ejecuciones requeridas entre los habitos asociados.')
                    ->required(),
                DatePicker::make('fecha_inicio')
                    ->required(),
                DatePicker::make('fecha_limite')
                    ->required(),
                Hidden::make('estado')
                    ->default('PENDIENTE')
                    ->required(),
                Select::make('habitos')
                    ->label('Habitos')
                    ->multiple()
                    ->relationship(
                        name: 'habitos',
                        titleAttribute: 'nombre',
                        modifyQueryUsing: fn (Builder $query): Builder => $query->where('user_id', auth()->id()),
                    )
                    ->preload()
                    ->searchable()
                    ->required(),
            ]);
    }
}
