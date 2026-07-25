<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class ObjetivosPrototypeSheet implements FromArray, ShouldAutoSize, WithEvents, WithTitle
{
    /**
     * @return array<int, array<int, string|int|float>>
     */
    public function array(): array
    {
        return [
            ['Planilla de Objetivos', '', '', '', '', '', '', '', '', ''],
            ['Generada el 2026-07-22', '', '', '', '', '', '', '', '', ''],
            ['Meta', 'Objetivo', 'Habito asociado', 'Fecha inicio', 'Fecha limite', 'Meta esperada', 'Meta actual', 'Dias cumplidos', 'Tasa de exito', 'Estado'],
            ['Ponerme en forma para el verano', 'Correr 4 veces a la semana', 'Correr, Dormir temprano', '2026-07-22', '2026-07-26', 4, 3, 3, 75.0, 'Completado Parcialmente'],
            ['Ponerme en forma para el verano', 'Tomar agua 7 dias seguidos', 'Tomar agua', '2026-07-22', '2026-07-28', 7, 5, 5, 71.43, 'Completado Parcialmente'],
            ['Mejorar mi disciplina', 'Leer 5 veces', 'Leer, Escribir resumen', '2026-07-22', '2026-07-26', 5, 0, 0, 0.0, 'Vencido'],
        ];
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
                        'startColor' => ['rgb' => '1F4E78'],
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
                        'startColor' => ['rgb' => '4F81BD'],
                    ],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                    ],
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => 'D9E2F3'],
                        ],
                    ],
                ]);

                $sheet->getStyle('A4:J6')->applyFromArray([
                    'borders' => [
                        'allBorders' => [
                            'borderStyle' => Border::BORDER_THIN,
                            'color' => ['rgb' => 'D9D9D9'],
                        ],
                    ],
                    'alignment' => [
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getStyle('D4:E6')->getNumberFormat()->setFormatCode('yyyy-mm-dd');
                $sheet->getStyle('F4:H6')->getNumberFormat()->setFormatCode('#,##0');
                $sheet->getStyle('I4:I6')->getNumberFormat()->setFormatCode('0.00');

                $sheet->freezePane('A4');
            },
        ];
    }
}
