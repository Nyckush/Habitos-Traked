<?php

namespace App\Filament\Resources\Rutinas;

use App\Filament\Resources\Rutinas\Pages\CreateRutina;
use App\Filament\Resources\Rutinas\Pages\EditRutina;
use App\Filament\Resources\Rutinas\Pages\ListRutinas;
use App\Filament\Resources\Rutinas\Schemas\RutinaForm;
use App\Filament\Resources\Rutinas\Tables\RutinasTable;
use App\Models\Rutina;
use Illuminate\Database\Eloquent\Builder;
use UnitEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;

class RutinaResource extends Resource
{
    protected static ?string $model = Rutina::class;

    protected static ?string $navigationLabel = 'Rutinas';

    protected static ?string $modelLabel = 'Rutina';

    protected static ?string $pluralModelLabel = 'Rutinas';

    protected static UnitEnum|string|null $navigationGroup = 'Habitos y Rutinas';

    public static function form(Schema $schema): Schema
    {
        return RutinaForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return RutinasTable::configure($table);
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
            'index' => ListRutinas::route('/'),
            'create' => CreateRutina::route('/create'),
            'edit' => EditRutina::route('/{record}/edit'),
        ];
    }
}
