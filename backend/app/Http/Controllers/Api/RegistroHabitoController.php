<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Habito;
use App\Models\RegistroHabito;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegistroHabitoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $records = RegistroHabito::query()
            ->whereHas('habito', fn ($query) => $query->where('user_id', $request->user()->id))
            ->orderByDesc('fecha')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'data' => $records->map(fn (RegistroHabito $record): array => $this->recordPayload($record))->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'habito_id' => ['required', 'integer'],
            'fecha' => ['required', 'date_format:Y-m-d'],
            'completado' => ['required', 'boolean'],
            'observacion' => ['nullable', 'string'],
        ]);

        $habito = Habito::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($data['habito_id']);

        $record = RegistroHabito::query()->updateOrCreate(
            [
                'habito_id' => $habito->id,
                'fecha' => $data['fecha'],
            ],
            [
                'completado' => $data['completado'],
                'observacion' => $this->normalizeObservacion($data['observacion'] ?? null),
            ],
        );

        return response()->json([
            'message' => 'Registro de habito guardado correctamente.',
            'data' => $this->recordPayload($record->fresh()),
        ], 201);
    }

    public function update(Request $request, int $registroHabito): JsonResponse
    {
        $data = $request->validate([
            'completado' => ['required', 'boolean'],
            'observacion' => ['nullable', 'string'],
        ]);

        $record = RegistroHabito::query()
            ->whereKey($registroHabito)
            ->whereHas('habito', fn ($query) => $query->where('user_id', $request->user()->id))
            ->firstOrFail();

        $record->update([
            'completado' => $data['completado'],
            'observacion' => $this->normalizeObservacion($data['observacion'] ?? null),
        ]);

        return response()->json([
            'message' => 'Registro de habito actualizado correctamente.',
            'data' => $this->recordPayload($record->fresh()),
        ]);
    }

    /**
     * @return array{id:int,habito_id:int,fecha:string,completado:bool,observacion:?string,created_at:?string,updated_at:?string}
     */
    private function recordPayload(RegistroHabito $record): array
    {
        return [
            'id' => $record->id,
            'habito_id' => $record->habito_id,
            'fecha' => $record->fecha->toDateString(),
            'completado' => (bool) $record->completado,
            'observacion' => $record->observacion,
            'created_at' => $record->created_at?->toISOString(),
            'updated_at' => $record->updated_at?->toISOString(),
        ];
    }

    private function normalizeObservacion(?string $observacion): ?string
    {
        $value = trim((string) $observacion);

        return $value !== '' ? $value : null;
    }
}
