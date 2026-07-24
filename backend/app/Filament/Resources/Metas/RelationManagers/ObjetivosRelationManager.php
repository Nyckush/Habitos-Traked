<?php

namespace App\Filament\Resources\Metas\RelationManagers;

use Filament\Actions\AssociateAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DissociateAction;
use Filament\Actions\DissociateBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class ObjetivosRelationManager extends RelationManager
{
    protected static string $relationship = 'objetivos';

    protected static ?string $title = 'Objetivos de la meta';

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('nombre')
            ->columns([
                TextColumn::make('nombre')
                    ->searchable(),
                TextColumn::make('habito.nombre')
                    ->label('Habito'),
                TextColumn::make('meta_esperada')
                    ->label('Meta esperada')
                    ->numeric(decimalPlaces: 0),
                TextColumn::make('meta_actual')
                    ->label('Meta actual')
                    ->numeric(decimalPlaces: 0),
                TextColumn::make('estado')
                    ->badge(),
                TextColumn::make('fecha_limite')
                    ->date(),
            ])
            ->filters([
                //
            ])
            ->headerActions([
                CreateAction::make()
                    ->label('Crear objetivo')
                    ->form([
                        Hidden::make('user_id')
                            ->default(fn (): ?int => auth()->id())
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
                            ->required(),
                        DatePicker::make('fecha_limite')
                            ->required(),
                    ]),
                AssociateAction::make()
                    ->label('Relacionar objetivo')
                    ->recordSelectOptionsQuery(
                        fn (Builder $query): Builder => $query
                            ->where('user_id', auth()->id())
                            ->whereNull('meta_id')
                    ),
            ])
            ->recordActions([
                EditAction::make(),
                DissociateAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DissociateBulkAction::make(),
                ]),
            ]);
    }
}
