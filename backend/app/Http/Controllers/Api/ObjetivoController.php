<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Habito;
use App\Models\Meta;
use App\Models\Objetivo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ObjetivoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $objetivos = $request->user()
            ->objetivos()
            ->with(['habitos', 'meta'])
            ->orderBy('fecha_limite')
            ->get();

        return response()->json([
            'data' => $objetivos->map(fn (Objetivo $objetivo): array => $this->objectivePayload($objetivo))->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'meta_id' => ['nullable', 'integer'],
            'nombre' => ['required', 'string', 'max:255'],
            'meta_esperada' => ['required', 'integer', 'min:1'],
            'fecha_limite' => ['required', 'date_format:Y-m-d'],
            'habito_ids' => ['required', 'array', 'min:1'],
            'habito_ids.*' => ['required', 'integer'],
        ]);

        $meta = $this->resolveMeta($request, $data['meta_id'] ?? null);
        $habitoIds = $this->resolveHabitIds($request, $data['habito_ids']);

        $objetivo = $request->user()->objetivos()->create([
            'meta_id' => $meta?->id,
            'nombre' => $data['nombre'],
            'meta_esperada' => $data['meta_esperada'],
            'fecha_limite' => $data['fecha_limite'],
        ]);

        $objetivo->habitos()->sync($habitoIds);

        return response()->json([
            'message' => 'Objetivo creado correctamente.',
            'data' => $this->objectivePayload($objetivo->fresh()->load(['habitos', 'meta'])),
        ], 201);
    }

    public function update(Request $request, Objetivo $objetivo): JsonResponse
    {
        abort_unless($objetivo->user_id === $request->user()->id, 404);

        $data = $request->validate([
            'meta_id' => ['nullable', 'integer'],
            'nombre' => ['required', 'string', 'max:255'],
            'meta_esperada' => ['required', 'integer', 'min:1'],
            'fecha_limite' => ['required', 'date_format:Y-m-d'],
            'habito_ids' => ['required', 'array', 'min:1'],
            'habito_ids.*' => ['required', 'integer'],
        ]);

        $meta = $this->resolveMeta($request, $data['meta_id'] ?? null);
        $habitoIds = $this->resolveHabitIds($request, $data['habito_ids']);

        $objetivo->update([
            'meta_id' => $meta?->id,
            'nombre' => $data['nombre'],
            'meta_esperada' => $data['meta_esperada'],
            'fecha_limite' => $data['fecha_limite'],
        ]);

        $objetivo->habitos()->sync($habitoIds);

        return response()->json([
            'message' => 'Objetivo actualizado correctamente.',
            'data' => $this->objectivePayload($objetivo->fresh()->load(['habitos', 'meta'])),
        ]);
    }

    public function destroy(Request $request, Objetivo $objetivo): JsonResponse
    {
        abort_unless($objetivo->user_id === $request->user()->id, 404);

        $objetivo->delete();

        return response()->json([
            'message' => 'Objetivo eliminado correctamente.',
        ]);
    }

    private function resolveMeta(Request $request, ?int $metaId): ?Meta
    {
        if ($metaId === null) {
            return null;
        }

        return Meta::query()
            ->where('user_id', $request->user()->id)
            ->findOrFail($metaId);
    }

    /**
     * @param list<int> $habitIds
     * @return list<int>
     */
    private function resolveHabitIds(Request $request, array $habitIds): array
    {
        return Habito::query()
            ->where('user_id', $request->user()->id)
            ->whereIn('id', $habitIds)
            ->pluck('id')
            ->all();
    }

    /**
     * @return array{id:int,user_id:int,meta_id:?int,nombre:string,meta_esperada:int,fecha_limite:string,habito_ids:list<int>,meta_actual:int,tasa_exito:float,estado:string,created_at:?string,updated_at:?string}
     */
    private function objectivePayload(Objetivo $objetivo): array
    {
        return [
            'id' => $objetivo->id,
            'user_id' => $objetivo->user_id,
            'meta_id' => $objetivo->meta_id,
            'nombre' => $objetivo->nombre,
            'meta_esperada' => (int) $objetivo->meta_esperada,
            'fecha_limite' => $objetivo->fecha_limite->toDateString(),
            'habito_ids' => $objetivo->habitos->pluck('id')->values()->all(),
            'meta_actual' => $objetivo->meta_actual,
            'tasa_exito' => $objetivo->tasa_exito,
            'estado' => $objetivo->estado,
            'created_at' => $objetivo->created_at?->toISOString(),
            'updated_at' => $objetivo->updated_at?->toISOString(),
        ];
    }
}
