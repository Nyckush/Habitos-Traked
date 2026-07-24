<?php

namespace App\Exports\Sheets;

use App\Models\User;
use Carbon\CarbonInterface;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class ObjetivosSheet implements FromArray, ShouldAutoSize, WithEvents, WithTitle
{
    public function __construct(
        protected User $user,
        protected CarbonInterface $fechaReporte,
    ) {
    }

    /**
     * @return array<int, array<int, string|int|float>>
     */
    public function array(): array
    {
        $rows = [
            ['Planilla de Objetivos', '', '', '', '', '', '', '', '', ''],
            ['Generada el ' . $this->fechaReporte->toDateString(), '', '', '', '', '', '', '', '', ''],
            ['Meta', 'Objetivo', 'Habito asociado', 'Fecha inicio', 'Fecha limite', 'Meta esperada', 'Meta actual', 'Dias cumplidos', 'Tasa de exito', 'Estado'],
        ];

        $objetivos = $this->user->objetivos()
            ->with(['meta', 'habito'])
            ->orderBy('fecha_limite')
            ->get();

        foreach ($objetivos as $objetivo) {
            $rows[] = [
                $objetivo->meta?->nombre ?? 'Sin meta',
                $objetivo->nombre,
                $objetivo->habito?->nombre ?? 'Sin habito',
                $objetivo->meta?->fecha_inicio?->toDateString() ?? $objetivo->created_at?->toDateString() ?? '',
                $objetivo->fecha_limite?->toDateString() ?? '',
                (int) $objetivo->meta_esperada,
                (int) $objetivo->meta_actual,
                (int) $objetivo->meta_actual,
                (float) $objetivo->tasa_exito,
                $objetivo->estado,
            ];
        }

        if (count($rows) === 3) {
            $rows[] = ['Sin datos', 'Todavia no tienes objetivos cargados.', '', '', '', 0, 0, 0, 0.0, ''];
        }

        return $rows;
    }

    public function title(): string
    {
        return 'Objetivos';
    }

    /**
     * @return array<class-string, callable>
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event): void {
                $sheet = $event->sheet->getDelegate();
                $lastRow = max(4, $sheet->getHighestRow());

                $sheet->mergeCells('A1:J1');
                $sheet->mergeCells('A2:J2');

                $sheet->getStyle('A1')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => 'FFFFFF']],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1F4E78']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);

                $sheet->getStyle('A2')->applyFromArray([
                    'font' => ['italic' => true, 'color' => ['rgb' => '44546A']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);

                $sheet->getStyle('A3:J3')->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '4F81BD']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'D9E2F3']]],
                ]);

                $sheet->getStyle("A4:J{$lastRow}")->applyFromArray([
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => 'D9D9D9']]],
                    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
                ]);

                $sheet->getStyle("D4:E{$lastRow}")->getNumberFormat()->setFormatCode('yyyy-mm-dd');
                $sheet->getStyle("F4:H{$lastRow}")->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle("I4:I{$lastRow}")->getNumberFormat()->setFormatCode('0.00');
                $sheet->freezePane('A4');
            },
        ];
    }
}
