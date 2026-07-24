<?php

namespace App\Exports;

use App\Exports\Sheets\ObjetivosPrototypeSheet;
use App\Exports\Sheets\SeguimientoHabitosPrototypeSheet;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class SeguimientoHabitosPrototypeExport implements WithMultipleSheets
{
    /**
     * @return array<int, object>
     */
    public function sheets(): array
    {
        return [
            new ObjetivosPrototypeSheet(),
            new SeguimientoHabitosPrototypeSheet(),
        ];
    }
}
