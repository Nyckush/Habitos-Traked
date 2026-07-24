<?php

namespace App\Filament\Resources\Objetivos;

use App\Filament\Resources\Objetivos\Pages\CreateObjetivo;
use App\Filament\Resources\Objetivos\Pages\EditObjetivo;
use App\Filament\Resources\Objetivos\Pages\ListObjetivos;
use App\Filament\Resources\Objetivos\Schemas\ObjetivoForm;
use App\Filament\Resources\Objetivos\Tables\ObjetivosTable;
use App\Models\Objetivo;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use UnitEnum;

class ObjetivoResource extends Resource
{
    protected static ?string $model = Objetivo::class;

    protected static ?string $navigationLabel = 'Objetivos';

    protected static ?string $modelLabel = 'Objetivo';

    protected static ?string $pluralModelLabel = 'Objetivos';

    protected static UnitEnum|string|null $navigationGroup = 'Habitos y Rutinas';

    public static function form(Schema $schema): Schema
    {
        return ObjetivoForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ObjetivosTable::configure($table);
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->where('user_id', auth()->id());
    }

    public static function getRelations(): array
    {
        return [
            //
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListObjetivos::route('/'),
            'create' => CreateObjetivo::route('/create'),
            'edit' => EditObjetivo::route('/{record}/edit'),
        ];
    }
}
