<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Rutina;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RutinaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $rutinas = $request->user()
            ->rutinas()
            ->with('rutinaDias')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $rutinas->map(fn (Rutina $rutina): array => $this->routinePayload($rutina))->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'dias' => ['required', 'array', 'min:1'],
            'dias.*' => ['required', 'string', 'in:lunes,martes,miercoles,jueves,viernes,sabado,domingo'],
        ]);

        $rutina = $request->user()->rutinas()->create([
            'nombre' => $data['nombre'],
        ]);

        foreach (array_values(array_unique($data['dias'])) as $dia) {
            $rutina->rutinaDias()->create([
                'dia_semana' => $dia,
            ]);
        }

        return response()->json([
            'message' => 'Rutina creada correctamente.',
            'data' => $this->routinePayload($rutina->load('rutinaDias')),
        ], 201);
    }

    public function update(Request $request, Rutina $rutina): JsonResponse
    {
        abort_unless($rutina->user_id === $request->user()->id, 404);

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'dias' => ['required', 'array', 'min:1'],
            'dias.*' => ['required', 'string', 'in:lunes,martes,miercoles,jueves,viernes,sabado,domingo'],
        ]);

        $rutina->update([
            'nombre' => $data['nombre'],
        ]);

        $rutina->rutinaDias()->delete();

        foreach (array_values(array_unique($data['dias'])) as $dia) {
            $rutina->rutinaDias()->create([
                'dia_semana' => $dia,
            ]);
        }

        return response()->json([
            'message' => 'Rutina actualizada correctamente.',
            'data' => $this->routinePayload($rutina->fresh()->load('rutinaDias')),
        ]);
    }

    public function destroy(Request $request, Rutina $rutina): JsonResponse
    {
        abort_unless($rutina->user_id === $request->user()->id, 404);

        $rutina->delete();

        return response()->json([
            'message' => 'Rutina eliminada correctamente.',
        ]);
    }

    /**
     * @return array{id:int,user_id:int,nombre:string,dias:list<string>,created_at:?string,updated_at:?string}
     */
    private function routinePayload(Rutina $rutina): array
    {
        return [
            'id' => $rutina->id,
            'user_id' => $rutina->user_id,
            'nombre' => $rutina->nombre,
            'dias' => $rutina->rutinaDias->pluck('dia_semana')->values()->all(),
            'created_at' => $rutina->created_at?->toISOString(),
            'updated_at' => $rutina->updated_at?->toISOString(),
        ];
    }
}
