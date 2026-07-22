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
        Schema::table('habitos', function (Blueprint $table) {
            $table->dropColumn([
                'frecuencia',
                'activo',
                'fecha_creacion',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('habitos', function (Blueprint $table) {
            $table->string('frecuencia')->nullable()->after('nombre');
            $table->boolean('activo')->default(true)->after('frecuencia');
            $table->date('fecha_creacion')->nullable()->after('activo');
        });
    }
};
