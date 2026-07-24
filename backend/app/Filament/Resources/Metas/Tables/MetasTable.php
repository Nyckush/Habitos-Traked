<?php

namespace App\Filament\Resources\Metas\Tables;

use App\Models\Meta;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class MetasTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('nombre')
                    ->searchable(),
                TextColumn::make('estado')
                    ->badge()
                    ->state(fn (Meta $record): string => $record->estado),
                TextColumn::make('objetivos_count')
                    ->counts('objetivos')
                    ->label('Objetivos'),
                TextColumn::make('fecha_inicio')
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
