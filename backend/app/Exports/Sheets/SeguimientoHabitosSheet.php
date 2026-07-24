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
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class SeguimientoHabitosSheet implements FromArray, ShouldAutoSize, WithEvents, WithTitle
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
        $inicioSemana = $this->fechaReporte->copy()->startOfWeek();
        $finSemana = $inicioSemana->copy()->addDays(6);
        $fechas = collect(range(0, 6))
            ->map(fn (int $offset) => $inicioSemana->copy()->addDays($offset))
            ->values();

        $header = ['Habito'];

        foreach ($fechas as $fecha) {
            $header[] = $fecha->toDateString();
        }

        $header[] = 'Total cumplidos';
        $header[] = 'Tasa de exito';

        $rows = [
            ['Seguimiento de Habitos', '', '', '', '', '', '', '', '', ''],
            ['Semana del ' . $inicioSemana->toDateString() . ' al ' . $finSemana->toDateString(), '', '', '', '', '', '', '', '', ''],
            $header,
        ];

        $habitos = $this->user->habitos()
            ->with(['registrosHabito' => fn ($query) => $query->whereBetween('fecha', [
                $inicioSemana->toDateString(),
                $finSemana->toDateString(),
            ])])
            ->orderBy('nombre')
            ->get();

        foreach ($habitos as $habito) {
            $registros = $habito->registrosHabito->keyBy(fn ($registro) => $registro->fecha->toDateString());
            $row = [$habito->nombre];
            $cumplidos = 0;

            foreach ($fechas as $fecha) {
                if ($fecha->isFuture()) {
                    $row[] = '-';
                    continue;
                }

                $completado = (bool) optional($registros->get($fecha->toDateString()))->completado;
                $row[] = $completado ? 1 : 0;
                $cumplidos += $completado ? 1 : 0;
            }

            $row[] = $cumplidos;
            $row[] = round(($cumplidos / max(1, $fechas->count())) * 100, 2);
            $rows[] = $row;
        }

        if (count($rows) === 3) {
            $rows[] = ['Sin datos', 'Todavia no tienes habitos cargados.', '', '', '', '', '', '', 0, 0.0];
        }

        return $rows;
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
                $lastColumn = $sheet->getHighestColumn();
                $lastRow = max(4, $sheet->getHighestRow());

                $sheet->mergeCells('A1:J1');
                $sheet->mergeCells('A2:J2');

                $sheet->getStyle('A1')->applyFromArray([
                    'font' => ['bold' => true, 'size' => 16, 'color' => ['rgb' => 'FFFFFF']],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '2F6B3C']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);

                $sheet->getStyle('A2')->applyFromArray([
                    'font' => ['italic' => true, 'color' => ['rgb' => '44546A']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                ]);

                $sheet->getStyle("A3:{$lastColumn}3")->applyFromArray([
                    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '70AD47']],
                    'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
                ]);

                $sheet->getStyle("A4:{$lastColumn}{$lastRow}")->applyFromArray([
                    'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '000000']]],
                    'alignment' => [
                        'horizontal' => Alignment::HORIZONTAL_CENTER,
                        'vertical' => Alignment::VERTICAL_CENTER,
                    ],
                ]);

                $sheet->getStyle("B4:H{$lastRow}")->getNumberFormat()->setFormatCode(';;;');
                $sheet->getStyle("I4:{$lastColumn}{$lastRow}")->getNumberFormat()->setFormatCode('#,##0.00');
                $sheet->getRowDimension(3)->setRowHeight(24);

                for ($row = 4; $row <= $lastRow; $row++) {
                    $sheet->getRowDimension($row)->setRowHeight(28);
                }

                for ($row = 4; $row <= $lastRow; $row++) {
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
