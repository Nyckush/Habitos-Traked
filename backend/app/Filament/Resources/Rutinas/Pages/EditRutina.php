<?php

namespace App\Filament\Resources\Rutinas\Pages;

use App\Filament\Resources\Rutinas\RutinaResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditRutina extends EditRecord
{
    protected static string $resource = RutinaResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
