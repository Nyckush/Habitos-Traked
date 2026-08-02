<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tarea;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Http\Request;

class TareaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tareas = $request->user()
            ->tareas()
            ->orderByRaw('CASE WHEN hora_inicio IS NULL THEN 1 ELSE 0 END')
            ->orderBy('hora_inicio')
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'data' => $tareas->map(fn (Tarea $tarea): array => $this->taskPayload($tarea))->all(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'hora_inicio' => ['nullable', 'date_format:H:i'],
            'estado' => ['nullable', 'string', 'in:pendiente,completada'],
            'completed_at' => ['nullable', 'date'],
        ]);

        $estado = $data['estado'] ?? 'pendiente';
        $completedAt = $estado === 'completada'
            ? ($data['completed_at'] ?? now())
            : null;

        $tarea = $request->user()->tareas()->create([
            'titulo' => trim($data['titulo']),
            'hora_inicio' => $data['hora_inicio'] ?? null,
            'estado' => $estado,
            'completed_at' => $completedAt,
        ]);

        return response()->json([
            'message' => 'Tarea creada correctamente.',
            'data' => $this->taskPayload($tarea),
        ], 201);
    }

    public function update(Request $request, Tarea $tarea): JsonResponse
    {
        abort_unless($tarea->user_id === $request->user()->id, 404);

        $data = $request->validate([
            'titulo' => ['sometimes', 'required', 'string', 'max:255'],
            'hora_inicio' => ['sometimes', 'nullable', 'date_format:H:i'],
            'estado' => ['sometimes', 'required', 'string', 'in:pendiente,completada'],
            'completed_at' => ['sometimes', 'nullable', 'date'],
        ]);

        $updates = [];

        if (array_key_exists('titulo', $data)) {
            $updates['titulo'] = trim($data['titulo']);
        }

        if (array_key_exists('hora_inicio', $data)) {
            $updates['hora_inicio'] = $data['hora_inicio'];
        }

        if (array_key_exists('estado', $data)) {
            $updates['estado'] = $data['estado'];

            if ($data['estado'] === 'completada') {
                $updates['completed_at'] = $data['completed_at'] ?? $tarea->completed_at ?? now();
            } else {
                $updates['completed_at'] = null;
            }
        } elseif (array_key_exists('completed_at', $data)) {
            $updates['completed_at'] = $data['completed_at'];
        }

        $tarea->update($updates);

        return response()->json([
            'message' => 'Tarea actualizada correctamente.',
            'data' => $this->taskPayload($tarea->fresh()),
        ]);
    }

    public function destroy(Request $request, Tarea $tarea): JsonResponse
    {
        abort_unless($tarea->user_id === $request->user()->id, 404);

        $tarea->delete();

        return response()->json([
            'message' => 'Tarea eliminada correctamente.',
        ]);
    }

    /**
     * @return array{id:int,user_id:int,titulo:string,hora_inicio:?string,estado:string,completed_at:?string,created_at:?string,updated_at:?string,deleted_at:?string}
     */
    private function taskPayload(Tarea $tarea): array
    {
        return [
            'id' => $tarea->id,
            'user_id' => $tarea->user_id,
            'titulo' => $tarea->titulo,
            'hora_inicio' => $this->formatTime($tarea->hora_inicio),
            'estado' => $tarea->estado,
            'completed_at' => $tarea->completed_at?->toISOString(),
            'created_at' => $tarea->created_at?->toISOString(),
            'updated_at' => $tarea->updated_at?->toISOString(),
            'deleted_at' => $tarea->deleted_at?->toISOString(),
        ];
    }

    private function formatTime(?string $value): ?string
    {
        if ($value === null || trim($value) === '') {
            return null;
        }

        $normalizedValue = trim($value);

        foreach (['H:i:s', 'H:i'] as $format) {
            try {
                return Carbon::createFromFormat($format, $normalizedValue)->format('H:i');
            } catch (\Throwable) {
                // Intentamos con el siguiente formato valido.
            }
        }

        return substr($normalizedValue, 0, 5);
    }
}
