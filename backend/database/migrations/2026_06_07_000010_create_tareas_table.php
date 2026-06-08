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
        Schema::create('tareas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('meta_id')->nullable()->constrained('metas')->nullOnDelete();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->dateTime('fecha_vencimiento')->nullable();
            $table->enum('prioridad', ['BAJA', 'MEDIA', 'ALTA', 'URGENTE'])->default('MEDIA');
            $table->enum('estado', ['PENDIENTE', 'EN_PROGRESO', 'COMPLETADA', 'CANCELADA'])->default('PENDIENTE');
            $table->timestamps();

            $table->index(['user_id', 'estado']);
            $table->index('fecha_vencimiento');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tareas');
    }
};
