<?php

namespace App\Filament\Resources\Rutinas\Pages;

use App\Filament\Resources\Rutinas\RutinaResource;
use Filament\Resources\Pages\CreateRecord;

class CreateRutina extends CreateRecord
{
    protected static string $resource = RutinaResource::class;

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['user_id'] = auth()->id();

        return $data;
    }
}
