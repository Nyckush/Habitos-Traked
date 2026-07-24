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
        Schema::create('objetivos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('meta_id')->nullable()->constrained('metas')->nullOnDelete();
            $table->foreignId('habito_id')->constrained('habitos')->cascadeOnDelete();
            $table->string('nombre');
            $table->unsignedInteger('meta_esperada');
            $table->date('fecha_limite');
            $table->timestamps();

            $table->index(['meta_id', 'fecha_limite']);
            $table->index(['user_id', 'fecha_limite']);
            $table->index(['habito_id', 'fecha_limite']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('objetivos');
    }
};
