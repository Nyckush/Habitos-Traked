<?php

namespace App\Filament\Resources\Rutinas\Pages;

use App\Filament\Resources\Rutinas\RutinaResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListRutinas extends ListRecords
{
    protected static string $resource = RutinaResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
