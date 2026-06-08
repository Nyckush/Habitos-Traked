<?php

namespace App\Filament\Resources\Tareas;

use App\Filament\Resources\Tareas\Pages\CreateTarea;
use App\Filament\Resources\Tareas\Pages\EditTarea;
use App\Filament\Resources\Tareas\Pages\ListTareas;
use App\Filament\Resources\Tareas\Schemas\TareaForm;
use App\Filament\Resources\Tareas\Tables\TareasTable;
use App\Models\Tarea;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use UnitEnum;

class TareaResource extends Resource
{
    protected static ?string $model = Tarea::class;
        
    public static function shouldRegisterNavigation(): bool
    {
        return false;
    }
        
    protected static ?string $navigationLabel = 'Tareas';

    protected static ?string $modelLabel = 'Tarea';

    protected static ?string $pluralModelLabel = 'Tareas';

    protected static UnitEnum|string|null $navigationGroup = 'Habitos y Rutinas';

    public static function form(Schema $schema): Schema
    {
        return TareaForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return TareasTable::configure($table);
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
            'index' => ListTareas::route('/'),
            'create' => CreateTarea::route('/create'),
            'edit' => EditTarea::route('/{record}/edit'),
        ];
    }
}
