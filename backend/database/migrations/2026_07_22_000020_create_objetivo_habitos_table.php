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
        Schema::create('objetivo_habitos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('objetivo_id')->constrained('objetivos')->cascadeOnDelete();
            $table->foreignId('habito_id')->constrained('habitos')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['objetivo_id', 'habito_id']);
            $table->index(['habito_id', 'objetivo_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('objetivo_habitos');
    }
};
