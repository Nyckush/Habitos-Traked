<?php

namespace App\Filament\Resources\Objetivos\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class ObjetivosTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('nombre')
                    ->searchable(),
                TextColumn::make('meta.nombre')
                    ->label('Meta')
                    ->searchable(),
                TextColumn::make('habitos.nombre')
                    ->label('Habitos')
                    ->badge()
                    ->separator(', '),
                TextColumn::make('meta_esperada')
                    ->label('Meta esperada')
                    ->numeric(decimalPlaces: 0),
                TextColumn::make('meta_actual')
                    ->label('Meta actual')
                    ->numeric(decimalPlaces: 0),
                TextColumn::make('tasa_exito')
                    ->label('Tasa de exito')
                    ->suffix('%'),
                TextColumn::make('estado')
                    ->badge(),
                TextColumn::make('fecha_limite')
                    ->date(),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
