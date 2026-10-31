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
        Schema::create('school_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('SD Digital Indonesia');
            $table->text('address')->nullable();
            $table->string('city')->nullable()->default('Jakarta');
            $table->string('postal_code')->nullable();
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('principal_name')->nullable()->default('Drs. H. Mulyadi, M.Pd.');
            $table->string('principal_nip')->nullable()->default('197205121998031004');
            $table->string('start_time', 10)->default('07:00');
            $table->string('logo_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('school_settings');
    }
};

