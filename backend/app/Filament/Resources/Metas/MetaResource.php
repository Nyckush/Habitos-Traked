<?php

namespace App\Filament\Resources\Metas;

use App\Filament\Resources\Metas\Pages\CreateMeta;
use App\Filament\Resources\Metas\Pages\EditMeta;
use App\Filament\Resources\Metas\Pages\ListMetas;
use App\Filament\Resources\Metas\Schemas\MetaForm;
use App\Filament\Resources\Metas\Tables\MetasTable;
use App\Models\Meta;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use UnitEnum;

class MetaResource extends Resource
{
    protected static ?string $model = Meta::class;

    protected static ?string $navigationLabel = 'Metas';

    protected static ?string $modelLabel = 'Meta';

    protected static ?string $pluralModelLabel = 'Metas';

    protected static UnitEnum|string|null $navigationGroup = 'Habitos y Rutinas';

    public static function form(Schema $schema): Schema
    {
        return MetaForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return MetasTable::configure($table);
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->whereHas('habitos', fn (Builder $query): Builder => $query->where('user_id', auth()->id()));
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
            'index' => ListMetas::route('/'),
            'create' => CreateMeta::route('/create'),
            'edit' => EditMeta::route('/{record}/edit'),
        ];
    }
}
