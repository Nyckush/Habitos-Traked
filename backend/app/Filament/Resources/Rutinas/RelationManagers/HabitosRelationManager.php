<?php

namespace App\Filament\Resources\Rutinas\RelationManagers;

use Filament\Actions\AttachAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DetachAction;
use Filament\Actions\DetachBulkAction;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\TimePicker;
use Illuminate\Database\Eloquent\Builder;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class HabitosRelationManager extends RelationManager
{
    protected static string $relationship = 'habitos';

    protected static ?string $title = 'Habitos de la rutina';

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('nombre')
            ->columns([
                TextColumn::make('nombre')
                    ->searchable(),
                TextColumn::make('frecuencia')
                    ->badge(),
                TextColumn::make('pivot.hora_inicio')
                    ->label('Inicio')
                    ->placeholder('-'),
                TextColumn::make('pivot.duracion_estimada')
                    ->label('Duracion estimada (min)')
                    ->numeric(),
                TextColumn::make('pivot.orden')
                    ->label('Orden')
                    ->numeric()
                    ->sortable(),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                AttachAction::make()
                    ->label('Relacionar habito')
                    ->recordSelectOptionsQuery(fn (Builder $query): Builder => $query->where('user_id', auth()->id()))
                    ->form(fn (AttachAction $action): array => [
                        $action->getRecordSelect(),
                        TimePicker::make('hora_inicio')
                            ->label('Hora inicio')
                            ->seconds(false),
                        TextInput::make('duracion_estimada')
                            ->label('Duracion estimada (min)')
                            ->numeric()
                            ->minValue(1)
                            ->required(),
                        TextInput::make('orden')
                            ->label('Orden')
                            ->numeric()
                            ->minValue(1)
                            ->default(1)
                            ->required(),
                    ]),
            ])
            ->recordActions([
                DetachAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DetachBulkAction::make(),
                ]),
            ]);
    }
}
