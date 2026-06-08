<?php

namespace App\Filament\Resources\Metas\Tables;

use App\Models\Meta;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class MetasTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('titulo')
                    ->searchable(),
                TextColumn::make('objetivo')
                    ->numeric(decimalPlaces: 0),
                TextColumn::make('avance')
                    ->state(fn (Meta $record): string => $record->ejecuciones_completadas . ' / ' . (int) $record->objetivo)
                    ->label('Avance'),
                TextColumn::make('estado')
                    ->badge(),
                TextColumn::make('fecha_limite')
                    ->date(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('estado')
                    ->options([
                        'PENDIENTE' => 'Pendiente',
                        'EN_PROGRESO' => 'En progreso',
                        'COMPLETADA' => 'Completada',
                        'CANCELADA' => 'Cancelada',
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
