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
        Schema::create('metas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('habito_id')->constrained('habitos')->cascadeOnDelete();
            $table->string('titulo');
            $table->text('motivo')->nullable();
            $table->unsignedInteger('objetivo');
            $table->date('fecha_inicio');
            $table->date('fecha_limite');
            $table->string('estado')->default('PENDIENTE');
            $table->timestamps();

            $table->index(['habito_id', 'estado']);
            $table->index('fecha_limite');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('metas');
    }
};
