<?php

namespace App\Filament\Pages;

use App\Models\Habito;
use App\Models\Meta;
use App\Models\RegistroHabito;
use App\Models\Rutina;
use App\Models\Tarea;
use Carbon\Carbon;
use Filament\Notifications\Notification;
use Filament\Pages\Page;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Contracts\Support\Htmlable;

class MisRutinasHoy extends Page
{
    protected static ?string $navigationLabel = 'Mis Rutinas de Hoy';

    protected static ?string $title = 'Mis Rutinas de Hoy';

    protected static ?string $slug = 'mis-rutinas-hoy';

    protected static ?int $navigationSort = -1;

    protected string $view = 'filament.pages.mis-rutinas-hoy';

    /**
     * @var EloquentCollection<int, Rutina>
     */
    public EloquentCollection $rutinas;

    /**
     * @var EloquentCollection<int, Meta>
     */
    public EloquentCollection $metas;

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

    /**
     * @var EloquentCollection<int, Tarea>
     */
    public EloquentCollection $tareasPendientes;

    public function getHeading(): string|Htmlable|null
    {
        return null;
    }

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

    public function alternarHabito(int $habitoId): void
    {
        $this->estado[$habitoId] = ! ($this->estado[$habitoId] ?? false);
        $this->guardarHabito($habitoId);
    }

    public function completarTarea(int $tareaId): void
    {
        $tarea = Tarea::query()
            ->whereKey($tareaId)
            ->where('user_id', auth()->id())
            ->first();

        if (! $tarea) {
            Notification::make()
                ->title('Tarea no encontrada para tu usuario')
                ->danger()
                ->send();

            return;
        }

        $tarea->forceFill(['estado' => 'COMPLETADA'])->save();

        Notification::make()
            ->title('Tarea marcada como completada')
            ->success()
            ->send();

        $this->cargarRutinas();
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

        $this->metas = Meta::query()
            ->whereHas('habitos', function ($query) {
                $query->where('user_id', auth()->id());
            })
            ->where('estado', '!=', 'CANCELADA')
            ->get();

        $this->habitosDelDia = $this->rutinas
            ->flatMap(fn (Rutina $rutina) => $rutina->habitos->pluck('id'))
            ->unique()
            ->values()
            ->all();

        Tarea::query()
            ->where('user_id', auth()->id())
            ->whereIn('estado', ['PENDIENTE', 'EN_PROGRESO'])
            ->whereNotNull('fecha_vencimiento')
            ->where('fecha_vencimiento', '<', now())
            ->update(['estado' => 'VENCIDA']);

        $this->tareasPendientes = Tarea::query()
            ->where('user_id', auth()->id())
            ->whereIn('estado', ['PENDIENTE', 'EN_PROGRESO'])
            ->where(function ($query) {
                $query->whereNull('fecha_vencimiento')
                    ->orWhere('fecha_vencimiento', '>=', now());
            })
            ->orderBy('fecha_vencimiento')
            ->get();

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
