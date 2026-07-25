<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HabitoController;
use App\Http\Controllers\Api\MetaController;
use App\Http\Controllers\Api\ObjetivoController;
use App\Http\Controllers\Api\ObjetivoHabitoController;
use App\Http\Controllers\Api\RutinaController;
use App\Http\Controllers\Api\RutinaHabitoController;
use App\Http\Controllers\Api\RegistroHabitoController;
use App\Http\Controllers\Api\TareaController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);

        Route::get('/habitos', [HabitoController::class, 'index']);
        Route::post('/habitos', [HabitoController::class, 'store']);
        Route::put('/habitos/{habito}', [HabitoController::class, 'update']);
        Route::delete('/habitos/{habito}', [HabitoController::class, 'destroy']);

        Route::get('/rutinas', [RutinaController::class, 'index']);
        Route::post('/rutinas', [RutinaController::class, 'store']);
        Route::put('/rutinas/{rutina}', [RutinaController::class, 'update']);
        Route::delete('/rutinas/{rutina}', [RutinaController::class, 'destroy']);

        Route::get('/rutina-habitos', [RutinaHabitoController::class, 'index']);
        Route::post('/rutina-habitos', [RutinaHabitoController::class, 'store']);
        Route::put('/rutina-habitos/{rutinaHabito}', [RutinaHabitoController::class, 'update']);
        Route::delete('/rutina-habitos/{rutinaHabito}', [RutinaHabitoController::class, 'destroy']);

        Route::get('/registro-habitos', [RegistroHabitoController::class, 'index']);
        Route::post('/registro-habitos', [RegistroHabitoController::class, 'store']);
        Route::put('/registro-habitos/{registroHabito}', [RegistroHabitoController::class, 'update']);

        Route::get('/tareas', [TareaController::class, 'index']);
        Route::post('/tareas', [TareaController::class, 'store']);
        Route::put('/tareas/{tarea}', [TareaController::class, 'update']);
        Route::delete('/tareas/{tarea}', [TareaController::class, 'destroy']);

        Route::get('/metas', [MetaController::class, 'index']);
        Route::post('/metas', [MetaController::class, 'store']);
        Route::put('/metas/{meta}', [MetaController::class, 'update']);
        Route::delete('/metas/{meta}', [MetaController::class, 'destroy']);

        Route::get('/objetivos', [ObjetivoController::class, 'index']);
        Route::post('/objetivos', [ObjetivoController::class, 'store']);
        Route::put('/objetivos/{objetivo}', [ObjetivoController::class, 'update']);
        Route::delete('/objetivos/{objetivo}', [ObjetivoController::class, 'destroy']);

        Route::get('/objetivo-habitos', [ObjetivoHabitoController::class, 'index']);
        Route::post('/objetivo-habitos', [ObjetivoHabitoController::class, 'store']);
        Route::delete('/objetivo-habitos/{objetivoHabito}', [ObjetivoHabitoController::class, 'destroy']);
    });
});
