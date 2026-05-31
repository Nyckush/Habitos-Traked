<?php

namespace App\Filament\Resources\Habitos\Pages;

use App\Filament\Resources\Habitos\HabitoResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListHabitos extends ListRecords
{
    protected static string $resource = HabitoResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
