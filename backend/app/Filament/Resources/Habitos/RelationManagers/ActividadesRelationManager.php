<?php

namespace App\Filament\Resources\Habitos\RelationManagers;

use Filament\Actions\AssociateAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\DissociateAction;
use Filament\Actions\DissociateBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class ActividadesRelationManager extends RelationManager
{
    protected static string $relationship = 'actividades';

    protected static ?string $title = 'Actividades del habito';

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('nombre')
            ->columns([
                TextColumn::make('nombre')
                    ->searchable(),
                TextColumn::make('orden')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                CreateAction::make()
                    ->label('Crear actividad')
                    ->form([
                        TextInput::make('nombre')
                            ->required()
                            ->maxLength(255),
                        TextInput::make('orden')
                            ->numeric()
                            ->minValue(1)
                            ->default(1)
                            ->required(),
                    ]),
                AssociateAction::make()
                    ->label('Relacionar actividad')
                    ->recordSelectOptionsQuery(
                        fn (Builder $query): Builder => $query
                            ->whereHas('habito', fn (Builder $habitoQuery): Builder => $habitoQuery->where('user_id', auth()->id()))
                    ),
            ])
            ->recordActions([
                EditAction::make(),
                DissociateAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DissociateBulkAction::make(),
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
