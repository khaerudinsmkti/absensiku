<?php

use App\Http\Controllers\AttendanceAdjustmentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\LatenessController;
use App\Http\Controllers\MasterDataController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // 1. Dashboard Eksekutif & Ringkasan Realtime
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 2. Presensi Harian (Batch & Quick Update)
    Route::get('/attendances', [AttendanceController::class, 'index'])->name('attendances.index');
    Route::post('/attendances/batch', [AttendanceController::class, 'storeBatch'])->name('attendances.batch');
    Route::patch('/attendances/student/{student}', [AttendanceController::class, 'quickUpdate'])->name('attendances.quick-update');

    // 3. Pelacak Keterlambatan Siswa
    Route::get('/attendances/lateness', [LatenessController::class, 'index'])->name('attendances.lateness');
    Route::post('/attendances/lateness', [LatenessController::class, 'store'])->name('attendances.lateness.store');

    // 4. Absen Khusus / Izin Pulang Awal
    Route::get('/attendances/adjustments', [AttendanceAdjustmentController::class, 'index'])->name('attendances.adjustments');
    Route::post('/attendances/adjustments', [AttendanceAdjustmentController::class, 'store'])->name('attendances.adjustments.store');

    // 5. Rekapitulasi & Ekspor Laporan
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [ReportController::class, 'export'])->name('reports.export');

    // 6. Master Data (Kelas, Siswa, Jadwal Piket)
    Route::get('/master', [MasterDataController::class, 'index'])->name('master.index');
    Route::post('/master/classrooms', [MasterDataController::class, 'storeClassroom'])->name('master.classrooms.store');
    Route::post('/master/students', [MasterDataController::class, 'storeStudent'])->name('master.students.store');
    Route::post('/master/duty-schedules', [MasterDataController::class, 'storeDutySchedule'])->name('master.duty-schedules.store');
});

require __DIR__.'/settings.php';
