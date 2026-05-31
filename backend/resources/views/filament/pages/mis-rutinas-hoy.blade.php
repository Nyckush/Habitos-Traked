<x-filament-panels::page>
    @include('filament.pages.mis-rutinas-hoy-styles')

    @php
        $circunferencia = 251.2;
        $progreso = max(0, min(100, (int) $this->progresoHoy));
        $offset = $circunferencia - (($progreso / 100) * $circunferencia);

        $itemsHoy = $this->rutinas->flatMap(function ($rutina) {
            return $rutina->habitos->map(function ($habito) use ($rutina) {
                return [
                    'rutina' => $rutina,
                    'habito' => $habito,
                    'hora' => $habito->pivot->hora_inicio,
                ];
            });
        })->values();

        $pendientes = $itemsHoy->filter(fn ($item) => ! ($this->estado[$item['habito']->id] ?? false));
        $horaActual = now()->format('H:i:s');

        $habitoAtrasado = $pendientes
            ->filter(fn ($item) => filled($item['hora']) && $item['hora'] <= $horaActual)
            ->sortBy(fn ($item) => $item['hora'])
            ->first();

        $proximoHabito = $pendientes
            ->filter(fn ($item) => filled($item['hora']) && $item['hora'] > $horaActual)
            ->sortBy(fn ($item) => $item['hora'])
            ->first();
    @endphp

    <div class="mrh-root">
        <header class="mrh-topbar">
            <div class="mrh-topbar-title">Rutinas de Hoy</div>
            <div class="mrh-topbar-tools">
                <button class="mrh-icon-btn" type="button" aria-label="Notificaciones">
                    <span>•</span>
                </button>
                <button class="mrh-icon-btn" type="button" aria-label="Configuracion">
                    <span>••</span>
                </button>
                <div class="mrh-avatar">{{ strtoupper(substr((string) auth()->user()?->nombre, 0, 2)) }}</div>
            </div>
        </header>

        <div class="mrh-page">
            <section class="mrh-center">
                <h1 class="mrh-date-title">{{ now()->translatedFormat('l, d M') }}</h1>
                <p class="mrh-date-sub">{{ $this->completadosHoy }} de {{ $this->totalHabitos }} completados</p>

                <div class="mrh-ring">
                    <svg class="mrh-ring-svg" viewBox="0 0 100 100" aria-hidden="true">
                        <circle class="mrh-ring-bg" cx="50" cy="50" fill="transparent" r="40" stroke-width="8"></circle>
                        <circle
                            class="mrh-ring-progress"
                            cx="50"
                            cy="50"
                            fill="transparent"
                            r="40"
                            stroke-width="8"
                            stroke-dasharray="{{ $circunferencia }}"
                            stroke-dashoffset="{{ $offset }}"
                            stroke-linecap="round"
                        ></circle>
                    </svg>
                    <span class="mrh-ring-value">{{ $progreso }}%</span>
                </div>
            </section>

            @if ($habitoAtrasado)
                <section class="mrh-card mrh-card-overdue">
                    <span class="mrh-pill mrh-pill-danger">Atrasado - En curso</span>
                    <h2 class="mrh-card-title">{{ $habitoAtrasado['habito']->nombre }}</h2>
                    <p class="mrh-meta">
                        <span>{{ $habitoAtrasado['hora'] ? substr($habitoAtrasado['hora'], 0, 5) : 'Sin hora' }}</span>
                        <span>|</span>
                        <span>{{ $habitoAtrasado['habito']->pivot->duracion_estimada ?? '-' }} min</span>
                    </p>

                    <x-filament::button
                        class="mrh-full-btn"
                        wire:click="completarHabito({{ $habitoAtrasado['habito']->id }})"
                        color="primary"
                    >
                        Completar ahora
                    </x-filament::button>
                </section>
            @endif

            @if ($proximoHabito)
                <section class="mrh-card mrh-next">
                    <div>
                        <p class="mrh-next-kicker">Proximo habito</p>
                        <h3 class="mrh-next-title">{{ $proximoHabito['habito']->nombre }}</h3>
                        <p class="mrh-meta">{{ substr($proximoHabito['hora'], 0, 5) }}</p>
                    </div>

                    <div>
                        <div class="mrh-next-time">{{ $proximoHabito['habito']->pivot->duracion_estimada ?? '-' }}m</div>
                        <p class="mrh-date-sub">estimado</p>
                    </div>
                </section>
            @endif

            <section class="mrh-routines">
                @forelse ($this->rutinas as $rutina)
                    @php
                        $totalRutina = $rutina->habitos->count();
                        $completadosRutina = $rutina->habitos->filter(fn ($habito) => (bool) ($this->estado[$habito->id] ?? false))->count();
                        $progresoRutina = $totalRutina > 0 ? (int) floor(($completadosRutina / $totalRutina) * 100) : 0;
                    @endphp

                    <article class="mrh-card">
                        <div class="mrh-routine-top">
                            <h3 class="mrh-routine-title">{{ $rutina->nombre }}</h3>
                            <span class="mrh-routine-progress">{{ $progresoRutina }}%</span>
                        </div>

                        <div class="mrh-routine-habits">
                            @forelse ($rutina->habitos as $habito)
                                @php
                                    $completado = (bool) ($this->estado[$habito->id] ?? false);
                                    $hora = $habito->pivot->hora_inicio;
                                    $atrasado = ! $completado && filled($hora) && $hora <= $horaActual;
                                @endphp

                                <div class="mrh-habit-row {{ $atrasado ? 'mrh-habit-row-overdue' : '' }}">
                                    <div class="mrh-habit-left">
                                        <button
                                            type="button"
                                            class="mrh-check {{ $completado ? 'mrh-check-done' : '' }}"
                                            wire:click="$toggle('estado.{{ $habito->id }}')"
                                            aria-label="Marcar habito"
                                        >
                                            {{ $completado ? '✓' : '' }}
                                        </button>

                                        <div>
                                            <div class="mrh-habit-name {{ $completado ? 'mrh-habit-name-done' : '' }}">{{ $habito->nombre }}</div>
                                            <div class="mrh-habit-note {{ $atrasado ? 'mrh-habit-note-danger' : '' }}">
                                                @if ($atrasado)
                                                    Atrasado ({{ substr((string) $hora, 0, 5) }})
                                                @else
                                                    {{ $hora ? substr($hora, 0, 5) : 'Sin hora' }} | {{ $habito->pivot->duracion_estimada ?? '-' }} min
                                                @endif
                                            </div>
                                        </div>
                                    </div>

                                    <x-filament::button
                                        wire:click="guardarHabito({{ $habito->id }})"
                                        size="sm"
                                        color="gray"
                                    >
                                        Guardar
                                    </x-filament::button>
                                </div>

                                <textarea
                                    wire:model.blur="observaciones.{{ $habito->id }}"
                                    rows="2"
                                    class="mrh-observation"
                                    placeholder="Observacion opcional"
                                ></textarea>
                            @empty
                                <p class="mrh-muted">Esta rutina no tiene habitos activos relacionados.</p>
                            @endforelse
                        </div>
                    </article>
                @empty
                    <section class="mrh-card">
                        <h3 class="mrh-routine-title">No tienes rutinas para hoy</h3>
                        <p class="mrh-muted">Crea una rutina y relaciona habitos para empezar tu seguimiento diario.</p>
                    </section>
                @endforelse
            </section>

            <section class="mrh-stats">
                <article class="mrh-stat">
                    <div>R</div>
                    <div class="mrh-stat-value">{{ $this->rachaActual }}</div>
                    <div class="mrh-stat-label">Racha actual</div>
                </article>

                <article class="mrh-stat">
                    <div>M</div>
                    <div class="mrh-stat-value">{{ $this->mejorRacha }}</div>
                    <div class="mrh-stat-label">Mejor racha</div>
                </article>

                <article class="mrh-stat mrh-week">
                    <div>
                        <div class="mrh-routine-title">Cumplimiento semanal</div>
                        <div class="mrh-muted">Semana actual</div>
                    </div>
                    <div class="mrh-stat-value">{{ $this->cumplimientoSemanal }}%</div>
                </article>
            </section>

            @if ($this->totalHabitos > 0)
                <x-filament::button wire:click="guardarTodo" color="primary">
                    Guardar avances de hoy
                </x-filament::button>
            @endif
        </div>
    </div>
</x-filament-panels::page>
