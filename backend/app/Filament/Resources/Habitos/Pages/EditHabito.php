<?php

namespace App\Filament\Resources\Habitos\Pages;

use App\Filament\Resources\Habitos\HabitoResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditHabito extends EditRecord
{
    protected static string $resource = HabitoResource::class;

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
