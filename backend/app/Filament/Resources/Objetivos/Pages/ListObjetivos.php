<?php

namespace App\Filament\Resources\Objetivos\Pages;

use App\Filament\Resources\Objetivos\ObjetivoResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListObjetivos extends ListRecords
{
    protected static string $resource = ObjetivoResource::class;

    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
