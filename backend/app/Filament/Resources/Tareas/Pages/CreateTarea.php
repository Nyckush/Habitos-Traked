<?php

namespace App\Filament\Resources\Tareas\Pages;

use App\Filament\Resources\Tareas\TareaResource;
use Filament\Resources\Pages\CreateRecord;

class CreateTarea extends CreateRecord
{
    protected static string $resource = TareaResource::class;

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
