<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Habito;
use App\Models\Rutina;
use App\Models\RutinaHabito;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RutinaHabitoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $links = RutinaHabito::query()
            ->whereHas('rutina', fn ($query) => $query->where('user_id', $request->user()->id))
            ->orderByRaw('CASE WHEN hora_inicio IS NULL THEN 1 ELSE 0 END')
            ->orderBy('hora_inicio')
            ->get();

        return response()->json([
            'data' => $links->map(fn (RutinaHabito $link): array => $this->linkPayload($link))->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'rutina_id' => ['required', 'integer'],
            'habito_id' => ['required', 'integer'],
            'hora_inicio' => ['nullable', 'date_format:H:i'],
        ]);

        $rutina = Rutina::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($data['rutina_id']);

        $habito = Habito::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($data['habito_id']);

        $link = RutinaHabito::query()->firstOrCreate(
            [
                'rutina_id' => $rutina->id,
                'habito_id' => $habito->id,
            ],
            [
                'hora_inicio' => $data['hora_inicio'] ?? null,
            ],
        );

        if (array_key_exists('hora_inicio', $data)) {
            $link->hora_inicio = $data['hora_inicio'];
            $link->save();
        }

        return response()->json([
            'message' => 'Habito vinculado correctamente a la rutina.',
            'data' => $this->linkPayload($link->fresh()),
        ], 201);
    }

    public function update(Request $request, int $rutinaHabito): JsonResponse
    {
        $data = $request->validate([
            'hora_inicio' => ['nullable', 'date_format:H:i'],
        ]);

        $link = RutinaHabito::query()
            ->whereKey($rutinaHabito)
            ->whereHas('rutina', fn ($query) => $query->where('user_id', $request->user()->id))
            ->firstOrFail();

        $link->update([
            'hora_inicio' => $data['hora_inicio'] ?? null,
        ]);

        return response()->json([
            'message' => 'Habito de la rutina actualizado correctamente.',
            'data' => $this->linkPayload($link->fresh()),
        ]);
    }

    public function destroy(Request $request, int $rutinaHabito): JsonResponse
    {
        $link = RutinaHabito::query()
            ->whereKey($rutinaHabito)
            ->whereHas('rutina', fn ($query) => $query->where('user_id', $request->user()->id))
            ->firstOrFail();

        $link->delete();

        return response()->json([
            'message' => 'Habito eliminado de la rutina correctamente.',
        ]);
    }

    /**
     * @return array{id:int,rutina_id:int,habito_id:int,hora_inicio:?string}
     */
    private function linkPayload(RutinaHabito $link): array
    {
        return [
            'id' => $link->id,
            'rutina_id' => $link->rutina_id,
            'habito_id' => $link->habito_id,
            'hora_inicio' => $link->hora_inicio,
        ];
    }
}
