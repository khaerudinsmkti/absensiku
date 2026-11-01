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
        Schema::table('students', function (Blueprint $table) {
            $table->boolean('is_alumni')->default(false)->after('is_active');
            $table->string('graduation_year', 20)->nullable()->after('is_alumni');
            $table->string('next_school')->nullable()->after('graduation_year');
            $table->string('alumni_phone', 30)->nullable()->after('next_school');
            $table->text('alumni_notes')->nullable()->after('alumni_phone');
        });

        // Set existing inactive students (e.g. from class 6) as alumni
        DB::table('students')
            ->where('is_active', false)
            ->update([
                'is_alumni' => true,
                'graduation_year' => '2024/2025',
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'is_alumni',
                'graduation_year',
                'next_school',
                'alumni_phone',
                'alumni_notes',
            ]);
        });
    }
};
