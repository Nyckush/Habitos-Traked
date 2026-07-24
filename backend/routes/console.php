<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\SeguimientoHabitosPrototypeExport;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('prototype:excel-seguimiento {--path=}', function (): void {
    $relativePath = $this->option('path') ?: 'prototipos/prototipo_seguimiento_habitos.xlsx';

    Storage::disk('public')->makeDirectory(dirname($relativePath));

    Excel::store(new SeguimientoHabitosPrototypeExport(), $relativePath, 'public');

    $absolutePath = Storage::disk('public')->path($relativePath);

    $this->info("Prototipo generado en: {$absolutePath}");
})->purpose('Genera un prototipo Excel con hojas de objetivos y seguimiento de habitos');
