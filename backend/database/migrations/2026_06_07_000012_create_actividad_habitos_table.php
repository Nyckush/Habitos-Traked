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
        Schema::create('actividad_habitos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('habito_id')->constrained('habitos')->cascadeOnDelete();
            $table->string('nombre');
            $table->unsignedInteger('orden')->default(1);
            $table->timestamps();

            $table->index(['habito_id', 'orden']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actividad_habitos');
    }
};
