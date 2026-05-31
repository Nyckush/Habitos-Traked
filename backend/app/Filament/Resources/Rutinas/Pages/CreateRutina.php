<?php

namespace App\Filament\Resources\Rutinas\Pages;

use App\Filament\Resources\Rutinas\RutinaResource;
use Filament\Resources\Pages\CreateRecord;

class CreateRutina extends CreateRecord
{
    protected static string $resource = RutinaResource::class;

    /**
     * @var list<string>
     */
    protected array $diasSemanaSeleccionados = [];

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    protected function mutateFormDataBeforeCreate(array $data): array
    {
        $this->diasSemanaSeleccionados = array_values(array_unique($data['dias_semana'] ?? []));

        unset($data['dias_semana']);

        $data['user_id'] = auth()->id();

        return $data;
    }

    protected function afterCreate(): void
    {
        if ($this->diasSemanaSeleccionados === []) {
            return;
        }

        $this->record->rutinaDias()->createMany(
            array_map(
                fn (string $dia): array => ['dia_semana' => $dia],
                $this->diasSemanaSeleccionados,
            ),
        );
    }
}
