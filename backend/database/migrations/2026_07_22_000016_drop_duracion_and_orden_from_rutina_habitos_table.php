<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('rutina_habitos', function (Blueprint $table) {
            $table->dropColumn([
                'duracion_estimada',
                'orden',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('rutina_habitos', function (Blueprint $table) {
            $table->unsignedInteger('duracion_estimada')->nullable()->after('hora_inicio');
            $table->unsignedInteger('orden')->nullable()->after('duracion_estimada');
        });
    }
};
