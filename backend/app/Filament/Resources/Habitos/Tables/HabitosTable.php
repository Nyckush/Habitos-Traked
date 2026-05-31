<?php

namespace App\Filament\Resources\Habitos\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;

class HabitosTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('nombre')
                    ->searchable(),
                TextColumn::make('frecuencia')
                    ->badge(),
                IconColumn::make('activo')
                    ->boolean(),
                TextColumn::make('fecha_creacion')
                    ->date(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                TernaryFilter::make('activo'),
                SelectFilter::make('frecuencia')
                    ->options([
                        'diaria' => 'Diaria',
                        'semanal' => 'Semanal',
                        'mensual' => 'Mensual',
                        'personalizada' => 'Personalizada',
                    ]),
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
