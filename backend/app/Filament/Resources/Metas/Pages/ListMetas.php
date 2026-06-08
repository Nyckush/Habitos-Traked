<?php

namespace App\Filament\Resources\Metas\Pages;

use App\Filament\Resources\Metas\MetaResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListMetas extends ListRecords
{
    protected static string $resource = MetaResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
