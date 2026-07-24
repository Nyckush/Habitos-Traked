<?php

namespace App\Filament\Resources\Objetivos\Pages;

use App\Filament\Resources\Objetivos\ObjetivoResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditObjetivo extends EditRecord
{
    protected static string $resource = ObjetivoResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
