<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Meta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MetaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $metas = $request->user()
            ->metas()
            ->with('objetivos.habitos')
            ->orderBy('created_at')
            ->get();

        return response()->json([
            'data' => $metas->map(fn (Meta $meta): array => $this->metaPayload($meta))->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'fecha_inicio' => ['required', 'date_format:Y-m-d'],
        ]);

        $meta = $request->user()->metas()->create($data);

        return response()->json([
            'message' => 'Meta creada correctamente.',
            'data' => $this->metaPayload($meta->load('objetivos.habitos')),
        ], 201);
    }

    public function update(Request $request, Meta $meta): JsonResponse
    {
        abort_unless($meta->user_id === $request->user()->id, 404);

        $data = $request->validate([
            'nombre' => ['required', 'string', 'max:255'],
            'fecha_inicio' => ['required', 'date_format:Y-m-d'],
        ]);

        $meta->update($data);

        return response()->json([
            'message' => 'Meta actualizada correctamente.',
            'data' => $this->metaPayload($meta->fresh()->load('objetivos.habitos')),
        ]);
    }

    public function destroy(Request $request, Meta $meta): JsonResponse
    {
        abort_unless($meta->user_id === $request->user()->id, 404);

        $meta->delete();

        return response()->json([
            'message' => 'Meta eliminada correctamente.',
        ]);
    }

    /**
     * @return array{id:int,user_id:int,nombre:string,fecha_inicio:?string,estado:string,created_at:?string,updated_at:?string}
     */
    private function metaPayload(Meta $meta): array
    {
        return [
            'id' => $meta->id,
            'user_id' => $meta->user_id,
            'nombre' => $meta->nombre,
            'fecha_inicio' => $meta->fecha_inicio?->toDateString(),
            'estado' => $meta->estado,
            'created_at' => $meta->created_at?->toISOString(),
            'updated_at' => $meta->updated_at?->toISOString(),
        ];
    }
}
