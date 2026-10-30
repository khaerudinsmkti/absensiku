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

    // 6. Master Data (Kelas, Siswa, Guru, Jadwal Piket) - Khusus Admin
    Route::middleware('role:admin')->group(function () {
        Route::get('/master', [MasterDataController::class, 'index'])->name('master.index');
        Route::post('/master/classrooms', [MasterDataController::class, 'storeClassroom'])->name('master.classrooms.store');
        Route::put('/master/classrooms/{classroom}', [MasterDataController::class, 'updateClassroom'])->name('master.classrooms.update');
        Route::delete('/master/classrooms/{classroom}', [MasterDataController::class, 'destroyClassroom'])->name('master.classrooms.destroy');
        Route::post('/master/duty-schedules', [MasterDataController::class, 'storeDutySchedule'])->name('master.duty-schedules.store');
        Route::put('/master/duty-schedules/{dutySchedule}', [MasterDataController::class, 'updateDutySchedule'])->name('master.duty-schedules.update');
        Route::delete('/master/duty-schedules/{dutySchedule}', [MasterDataController::class, 'destroyDutySchedule'])->name('master.duty-schedules.destroy');

        // Siswa CRUD & Batch Import
        Route::post('/master/students', [MasterDataController::class, 'storeStudent'])->name('master.students.store');
        Route::put('/master/students/{student}', [MasterDataController::class, 'updateStudent'])->name('master.students.update');
        Route::delete('/master/students/{student}', [MasterDataController::class, 'destroyStudent'])->name('master.students.destroy');
        Route::post('/master/students/batch-import', [MasterDataController::class, 'batchImportStudents'])->name('master.students.batch-import');

        // Guru CRUD
        Route::post('/master/teachers', [MasterDataController::class, 'storeTeacher'])->name('master.teachers.store');
        Route::put('/master/teachers/{user}', [MasterDataController::class, 'updateTeacher'])->name('master.teachers.update');
        Route::delete('/master/teachers/{user}', [MasterDataController::class, 'destroyTeacher'])->name('master.teachers.destroy');
    });
});

require __DIR__.'/settings.php';
