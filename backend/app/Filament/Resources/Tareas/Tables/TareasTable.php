<?php

namespace App\Filament\Resources\Tareas\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class TareasTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('titulo')
                    ->searchable(),
                TextColumn::make('meta.titulo')
                    ->label('Meta')
                    ->toggleable(),
                TextColumn::make('prioridad')
                    ->badge(),
                TextColumn::make('estado')
                    ->badge(),
                TextColumn::make('fecha_vencimiento')
                    ->dateTime()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('prioridad')
                    ->options([
                        'BAJA' => 'Baja',
                        'MEDIA' => 'Media',
                        'ALTA' => 'Alta',
                        'URGENTE' => 'Urgente',
                    ]),
                SelectFilter::make('estado')
                    ->options([
                        'PENDIENTE' => 'Pendiente',
                        'COMPLETADA' => 'Completada',
                        'CANCELADA' => 'Cancelada',
                        'VENCIDA' => 'Vencida',
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
