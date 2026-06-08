<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('metas') || ! Schema::hasColumn('metas', 'habito_id')) {
            return;
        }

        DB::table('metas')
            ->select(['id', 'habito_id'])
            ->whereNotNull('habito_id')
            ->orderBy('id')
            ->chunkById(500, function ($metas): void {
                $now = now();
                $rows = [];

                foreach ($metas as $meta) {
                    $rows[] = [
                        'habito_id' => $meta->habito_id,
                        'meta_id' => $meta->id,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }

                if ($rows !== []) {
                    DB::table('habito_metas')->upsert(
                        $rows,
                        ['habito_id', 'meta_id'],
                        ['updated_at']
                    );
                }
            });

        Schema::table('metas', function (Blueprint $table) {
            $table->dropConstrainedForeignId('habito_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('metas') || Schema::hasColumn('metas', 'habito_id')) {
            return;
        }

        Schema::table('metas', function (Blueprint $table) {
            $table->foreignId('habito_id')->nullable()->after('id')->constrained('habitos')->nullOnDelete();
        });

        $firstHabitoPerMeta = DB::table('habito_metas')
            ->select('meta_id', DB::raw('MIN(habito_id) as habito_id'))
            ->groupBy('meta_id')
            ->get();

        foreach ($firstHabitoPerMeta as $row) {
            DB::table('metas')
                ->where('id', $row->meta_id)
                ->update(['habito_id' => $row->habito_id]);
        }
    }
};
