<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Habito;
use App\Models\Objetivo;
use App\Models\ObjetivoHabito;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ObjetivoHabitoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $links = ObjetivoHabito::query()
            ->whereHas('objetivo', fn ($query) => $query->where('user_id', $request->user()->id))
            ->orderBy('objetivo_id')
            ->orderBy('habito_id')
            ->get();

        return response()->json([
            'data' => $links->map(fn (ObjetivoHabito $link): array => $this->linkPayload($link))->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'objetivo_id' => ['required', 'integer'],
            'habito_id' => ['required', 'integer'],
        ]);

        $objetivo = Objetivo::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($data['objetivo_id']);

        $habito = Habito::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($data['habito_id']);

        $link = ObjetivoHabito::query()->firstOrCreate([
            'objetivo_id' => $objetivo->id,
            'habito_id' => $habito->id,
        ]);

        return response()->json([
            'message' => 'Habito vinculado correctamente al objetivo.',
            'data' => $this->linkPayload($link->fresh()),
        ], 201);
    }

    public function destroy(Request $request, int $objetivoHabito): JsonResponse
    {
        $link = ObjetivoHabito::query()
            ->whereKey($objetivoHabito)
            ->whereHas('objetivo', fn ($query) => $query->where('user_id', $request->user()->id))
            ->firstOrFail();

        $link->delete();

        return response()->json([
            'message' => 'Habito eliminado del objetivo correctamente.',
        ]);
    }

    /**
     * @return array{id:int,objetivo_id:int,habito_id:int}
     */
    private function linkPayload(ObjetivoHabito $link): array
    {
        return [
            'id' => $link->id,
            'objetivo_id' => $link->objetivo_id,
            'habito_id' => $link->habito_id,
        ];
    }
}
