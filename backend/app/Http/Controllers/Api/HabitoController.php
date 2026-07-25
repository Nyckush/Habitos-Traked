<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Habito;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HabitoController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $habitos = $request->user()
            ->habitos()
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $habitos->map(fn (Habito $habito): array => $this->habitPayload($habito))->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
        ]);

        $habito = $request->user()->habitos()->create([
            'nombre' => $data['nombre'],
        ]);

        return response()->json([
            'message' => 'Habito creado correctamente.',
            'data' => $this->habitPayload($habito),
        ], 201);
    }

    public function update(Request $request, Habito $habito): JsonResponse
    {
        abort_unless($habito->user_id === $request->user()->id, 404);

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
        ]);

        $habito->update([
            'nombre' => $data['nombre'],
        ]);

        return response()->json([
            'message' => 'Habito actualizado correctamente.',
            'data' => $this->habitPayload($habito->fresh()),
        ]);
    }

    public function destroy(Request $request, Habito $habito): JsonResponse
    {
        abort_unless($habito->user_id === $request->user()->id, 404);

        $habito->delete();

        return response()->json([
            'message' => 'Habito eliminado correctamente.',
        ]);
    }

    /**
     * @return array{id:int,user_id:int,nombre:string,created_at:?string,updated_at:?string}
     */
    private function habitPayload(Habito $habito): array
    {
        return [
            'id' => $habito->id,
            'user_id' => $habito->user_id,
            'nombre' => $habito->nombre,
            'created_at' => $habito->created_at?->toISOString(),
            'updated_at' => $habito->updated_at?->toISOString(),
        ];
    }
}
