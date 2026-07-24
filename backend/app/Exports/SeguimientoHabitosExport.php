<?php

namespace App\Exports;

use App\Exports\Sheets\ObjetivosSheet;
use App\Exports\Sheets\SeguimientoHabitosSheet;
use App\Models\User;
use Carbon\CarbonInterface;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class SeguimientoHabitosExport implements WithMultipleSheets
{
    public function __construct(
        protected User $user,
        protected CarbonInterface $fechaReporte,
    ) {
    }

    /**
     * @return array<int, object>
     */
    public function sheets(): array
    {
        return [
            new ObjetivosSheet($this->user, $this->fechaReporte),
            new SeguimientoHabitosSheet($this->user, $this->fechaReporte),
        ];
    }
}
