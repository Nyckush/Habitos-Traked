<?php

namespace App\Filament\Resources\Habitos;

use App\Filament\Resources\Habitos\Pages\CreateHabito;
use App\Filament\Resources\Habitos\Pages\EditHabito;
use App\Filament\Resources\Habitos\Pages\ListHabitos;
use App\Filament\Resources\Habitos\Schemas\HabitoForm;
use App\Filament\Resources\Habitos\Tables\HabitosTable;
use App\Models\Habito;
use Illuminate\Database\Eloquent\Builder;
use UnitEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;

class HabitoResource extends Resource
{
    protected static ?string $model = Habito::class;

    protected static ?string $navigationLabel = 'Habitos';

    protected static ?string $modelLabel = 'Habito';

    protected static ?string $pluralModelLabel = 'Habitos';

    protected static UnitEnum|string|null $navigationGroup = 'Habitos y Rutinas';

    public static function form(Schema $schema): Schema
    {
        return HabitoForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return HabitosTable::configure($table);
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
            'index' => ListHabitos::route('/'),
            'create' => CreateHabito::route('/create'),
            'edit' => EditHabito::route('/{record}/edit'),
        ];
    }
}
