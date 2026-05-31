<?php

namespace Database\Seeders;

use App\Models\Rutina;
use App\Models\RutinaDia;
use Illuminate\Database\Seeder;

class RutinaDiasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $dias = [
            'lunes',
            'martes',
            'miercoles',
            'jueves',
            'viernes',
            'sabado',
            'domingo',
        ];

        $rutinas = Rutina::query()->select('id')->get();

        foreach ($rutinas as $rutina) {
            foreach ($dias as $dia) {
                RutinaDia::query()->firstOrCreate([
                    'rutina_id' => $rutina->id,
                    'dia_semana' => $dia,
                ]);
            }
        }
    }
}
