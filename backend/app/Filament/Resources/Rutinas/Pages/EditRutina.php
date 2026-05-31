<?php

namespace App\Filament\Resources\Rutinas\Pages;

use App\Filament\Resources\Rutinas\RutinaResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditRutina extends EditRecord
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
    protected function mutateFormDataBeforeFill(array $data): array
    {
        $data['dias_semana'] = $this->record->rutinaDias()->pluck('dia_semana')->all();

        return $data;
    }

    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    protected function mutateFormDataBeforeSave(array $data): array
    {
        $this->diasSemanaSeleccionados = array_values(array_unique($data['dias_semana'] ?? []));

        unset($data['dias_semana']);

        return $data;
    }

    protected function afterSave(): void
    {
        $this->record->rutinaDias()->delete();

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

    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
        ];
    }
}
