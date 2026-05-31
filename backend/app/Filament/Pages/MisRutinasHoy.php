<?php

namespace App\Filament\Pages;

use App\Models\Habito;
use App\Models\RegistroHabito;
use App\Models\Rutina;
use Carbon\Carbon;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;

class MisRutinasHoy extends Page
{
    protected static ?string $navigationLabel = 'Mis Rutinas de Hoy';

    protected static ?string $title = 'Mis Rutinas de Hoy';

    protected string $view = 'filament.pages.mis-rutinas-hoy';

    /**
     * @var EloquentCollection<int, Rutina>
     */
    public EloquentCollection $rutinas;

    /**
     * @var array<int, bool>
     */
    public array $estado = [];

    /**
     * @var array<int, string>
     */
    public array $observaciones = [];

    /**
     * @var list<int>
     */
    public array $habitosDelDia = [];

    public function mount(): void
    {
        $this->cargarRutinas();
    }

    public function guardarHabito(int $habitoId): void
    {
        $habito = Habito::query()
            ->whereKey($habitoId)
            ->where('user_id', auth()->id())
            ->first();

        if (! $habito) {
            Notification::make()
                ->title('Habito no encontrado para tu usuario')
                ->danger()
                ->send();

            return;
        }

        RegistroHabito::updateOrCreate(
            [
                'habito_id' => $habitoId,
                'fecha' => now()->toDateString(),
            ],
            [
                'completado' => (bool) ($this->estado[$habitoId] ?? false),
                'observacion' => $this->normalizarObservacion($this->observaciones[$habitoId] ?? null),
            ],
        );

        Notification::make()
            ->title('Registro guardado')
            ->success()
            ->send();
    }

    public function completarHabito(int $habitoId): void
    {
        $this->estado[$habitoId] = true;
        $this->guardarHabito($habitoId);
    }

    public function guardarTodo(): void
    {
        foreach ($this->habitosDelDia as $habitoId) {
            RegistroHabito::updateOrCreate(
                [
                    'habito_id' => $habitoId,
                    'fecha' => now()->toDateString(),
                ],
                [
                    'completado' => (bool) ($this->estado[$habitoId] ?? false),
                    'observacion' => $this->normalizarObservacion($this->observaciones[$habitoId] ?? null),
                ],
            );
        }

        Notification::make()
            ->title('Rutinas de hoy actualizadas')
            ->success()
            ->send();
    }

    public function getTotalHabitosProperty(): int
    {
        return count($this->habitosDelDia);
    }

    public function getCompletadosHoyProperty(): int
    {
        return collect($this->habitosDelDia)
            ->filter(fn (int $id): bool => (bool) ($this->estado[$id] ?? false))
            ->count();
    }

    public function getProgresoHoyProperty(): int
    {
        if ($this->totalHabitos === 0) {
            return 0;
        }

        return (int) floor(($this->completadosHoy / $this->totalHabitos) * 100);
    }

    public function getRachaActualProperty(): int
    {
        if ($this->habitosDelDia === []) {
            return 0;
        }

        $hoy = now()->startOfDay();
        $inicio = $hoy->copy()->subDays(365);

        $completadosPorFecha = RegistroHabito::query()
            ->whereIn('habito_id', $this->habitosDelDia)
            ->whereBetween('fecha', [$inicio->toDateString(), $hoy->toDateString()])
            ->where('completado', true)
            ->selectRaw('fecha, COUNT(DISTINCT habito_id) as total')
            ->groupBy('fecha')
            ->pluck('total', 'fecha');

        $racha = 0;

        for ($fecha = $hoy->copy(); $fecha->gte($inicio); $fecha->subDay()) {
            $total = (int) ($completadosPorFecha[$fecha->toDateString()] ?? 0);

            if ($total >= $this->totalHabitos) {
                $racha++;
                continue;
            }

            break;
        }

        return $racha;
    }

    public function getMejorRachaProperty(): int
    {
        if ($this->habitosDelDia === []) {
            return 0;
        }

        $hoy = now()->startOfDay();
        $inicio = $hoy->copy()->subDays(365);

        $completadosPorFecha = RegistroHabito::query()
            ->whereIn('habito_id', $this->habitosDelDia)
            ->whereBetween('fecha', [$inicio->toDateString(), $hoy->toDateString()])
            ->where('completado', true)
            ->selectRaw('fecha, COUNT(DISTINCT habito_id) as total')
            ->groupBy('fecha')
            ->pluck('total', 'fecha');

        $actual = 0;
        $mejor = 0;

        for ($fecha = $inicio->copy(); $fecha->lte($hoy); $fecha->addDay()) {
            $total = (int) ($completadosPorFecha[$fecha->toDateString()] ?? 0);

            if ($total >= $this->totalHabitos) {
                $actual++;
                $mejor = max($mejor, $actual);
                continue;
            }

            $actual = 0;
        }

        return $mejor;
    }

    public function getCumplimientoSemanalProperty(): int
    {
        if ($this->habitosDelDia === []) {
            return 0;
        }

        $inicioSemana = now()->startOfWeek(Carbon::MONDAY)->toDateString();
        $hoy = now()->toDateString();
        $dias = max(1, now()->startOfWeek(Carbon::MONDAY)->diffInDays(now()) + 1);

        $completados = RegistroHabito::query()
            ->whereIn('habito_id', $this->habitosDelDia)
            ->whereBetween('fecha', [$inicioSemana, $hoy])
            ->where('completado', true)
            ->count();

        $esperados = $this->totalHabitos * $dias;

        if ($esperados === 0) {
            return 0;
        }

        return (int) floor(($completados / $esperados) * 100);
    }

    protected function cargarRutinas(): void
    {
        $diaActual = $this->obtenerDiaSemanaActual();

        $this->rutinas = Rutina::query()
            ->where('user_id', auth()->id())
            ->whereHas('rutinaDias', fn ($query) => $query->where('dia_semana', $diaActual))
            ->with([
                'habitos' => fn ($query) => $query
                    ->where('habitos.activo', true)
                    ->orderBy('rutina_habitos.orden'),
            ])
            ->orderBy('nombre')
            ->get();

        $this->habitosDelDia = $this->rutinas
            ->flatMap(fn (Rutina $rutina) => $rutina->habitos->pluck('id'))
            ->unique()
            ->values()
            ->all();

        if ($this->habitosDelDia === []) {
            return;
        }

        $registros = RegistroHabito::query()
            ->whereIn('habito_id', $this->habitosDelDia)
            ->whereDate('fecha', now()->toDateString())
            ->get()
            ->keyBy('habito_id');

        foreach ($this->habitosDelDia as $habitoId) {
            $this->estado[$habitoId] = (bool) optional($registros->get($habitoId))->completado;
            $this->observaciones[$habitoId] = (string) (optional($registros->get($habitoId))->observacion ?? '');
        }
    }

    protected function normalizarObservacion(?string $observacion): ?string
    {
        $texto = trim((string) $observacion);

        return $texto !== '' ? $texto : null;
    }

    protected function obtenerDiaSemanaActual(): string
    {
        return match (now()->dayOfWeekIso) {
            1 => 'lunes',
            2 => 'martes',
            3 => 'miercoles',
            4 => 'jueves',
            5 => 'viernes',
            6 => 'sabado',
            7 => 'domingo',
            default => 'lunes',
        };
    }
}
