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
        Schema::create('habito_metas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('habito_id')->constrained('habitos')->cascadeOnDelete();
            $table->foreignId('meta_id')->constrained('metas')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['habito_id', 'meta_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('habito_metas');
    }
};
