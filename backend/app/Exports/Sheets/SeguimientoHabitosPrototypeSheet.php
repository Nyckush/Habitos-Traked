<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class SeguimientoHabitosPrototypeSheet implements FromArray, ShouldAutoSize, WithEvents, WithTitle
{
    /**
     * @return array<int, array<int, string|int>>
     */
    public function array(): array
    {
        return [
            ['Seguimiento de Habitos', '', '', '', '', '', '', '', '', ''],
            ['Semana del 2026-07-20 al 2026-07-26', '', '', '', '', '', '', '', '', ''],
            ['Habito', '2026-07-20', '2026-07-21', '2026-07-22', '2026-07-23', '2026-07-24', '2026-07-25', '2026-07-26', 'Total cumplidos', 'Tasa de exito'],
            ['Correr', 1, 0, 1, '-', '-', '-', '-', 3, 42.86],
            ['Tomar agua', 1, 1, 1, '-', '-', '-', '-', 5, 71.43],
            ['Leer', 0, 0, 0, '-', '-', '-', '-', 0, 0.0],
        ];
    }

    public function title(): string
    {
        return 'Seguimiento Habitos';
    }

    /**
     * @return array<class-string, callable>
     */
    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event): void {
                $sheet = $event->sheet->getDelegate();

                $sheet->mergeCells('A1:J1');
                $sheet->mergeCells('A2:J2');

                $sheet->getStyle('A1')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'size' => 16,
                        'color' => ['rgb' => 'FFFFFF'],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '2F6B3C'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                    ],
                ]);

                $sheet->getStyle('A2')->applyFromArray([
                    'font' => [
                        'italic' => true,
                        'color' => ['rgb' => '44546A'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                    ],
                ]);

                $sheet->getStyle('A3:J3')->applyFromArray([
                    'font' => [
                        'bold' => true,
                        'color' => ['rgb' => 'FFFFFF'],
                    ],
                    'fill' => [
                        'fillType' => Fill::FILL_SOLID,
                        'startColor' => ['rgb' => '70AD47'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '000000'],
                        ],
                    ],
                ]);

                $sheet->getStyle('A4:J6')->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => '000000'],
                        ],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getStyle('B4:H6')->getNumberFormat()->setFormatCode(';;;');
                $sheet->getStyle('I4:I6')->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('J4:J6')->getNumberFormat()->setFormatCode('0.00');
                $sheet->getRowDimension(3)->setRowHeight(24);

                for ($row = 4; $row <= 6; $row++) {
                    $sheet->getRowDimension($row)->setRowHeight(28);
                }

                for ($row = 4; $row <= 6; $row++) {
                    for ($col = 2; $col <= 8; $col++) {
                        $cell = Coordinate::stringFromColumnIndex($col) . $row;
                        $value = $sheet->getCell($cell)->getValue();

                        if ($value === '-') {
                            $sheet->getStyle($cell)->applyFromArray([
                                'font' => [
                                    'bold' => true,
                                    'color' => ['rgb' => '7A7A7A'],
                                ],
                            ]);
                            continue;
                        }

                        if ((int) $value === 1) {
                            $sheet->getStyle($cell)->applyFromArray([
                                'fill' => [
                                    'fillType' => Fill::FILL_SOLID,
                                    'startColor' => ['rgb' => 'C6E0B4'],
                                ],
                                'font' => [
                                    'bold' => true,
                                    'color' => ['rgb' => '215E21'],
                                ],
                            ]);
                        }

                        if ((int) $value === 0) {
                            $sheet->getStyle($cell)->applyFromArray([
                                'fill' => [
                                    'fillType' => Fill::FILL_SOLID,
                                    'startColor' => ['rgb' => 'F4CCCC'],
                                ],
                                'font' => [
                                    'bold' => true,
                                    'color' => ['rgb' => '9C0006'],
                                ],
                            ]);
                        }
                    }
                }

                $sheet->freezePane('A4');
            },
        ];
    }
}
