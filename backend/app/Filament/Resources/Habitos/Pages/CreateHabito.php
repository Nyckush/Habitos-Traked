<?php

namespace App\Filament\Resources\Habitos\Pages;

use App\Filament\Resources\Habitos\HabitoResource;
use Filament\Resources\Pages\CreateRecord;

class CreateHabito extends CreateRecord
{
    protected static string $resource = HabitoResource::class;

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $data['user_id'] = auth()->id();
        $data['fecha_creacion'] = now()->toDateString();

        return $data;
    }
}
