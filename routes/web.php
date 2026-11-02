<?php

use App\Http\Controllers\AttendanceAdjustmentController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\LatenessController;
use App\Http\Controllers\MasterDataController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SchoolSettingController;
use App\Http\Controllers\WelcomeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [WelcomeController::class, 'index'])->name('home');
Route::redirect('/register', '/login');

Route::get('/manifest.json', function () {
    $manifestData = \App\Services\PwaManifestService::getManifestData();

    return response()->json($manifestData, 200, [
        'Content-Type' => 'application/manifest+json; charset=UTF-8',
        'Cache-Control' => 'no-cache, no-store, must-revalidate',
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
})->name('pwa.manifest');

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
    Route::put('/attendances/lateness/{attendance}', [LatenessController::class, 'update'])->name('attendances.lateness.update');
    Route::delete('/attendances/lateness/{attendance}', [LatenessController::class, 'destroy'])->name('attendances.lateness.destroy');

    // 4. Absen Khusus / Izin Pulang Awal
    Route::get('/attendances/adjustments', [AttendanceAdjustmentController::class, 'index'])->name('attendances.adjustments');
    Route::post('/attendances/adjustments', [AttendanceAdjustmentController::class, 'store'])->name('attendances.adjustments.store');

    // 5. Rekapitulasi & Ekspor Laporan
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [ReportController::class, 'export'])->name('reports.export');
    Route::get('/reports/export-pdf', [ReportController::class, 'exportPdf'])->name('reports.export-pdf');

    // 6. Master Data (Kelas, Siswa, Guru, Jadwal Piket) - Admin & Kepala Sekolah
    Route::middleware('role:admin,principal')->group(function () {
        Route::get('/master', [MasterDataController::class, 'index'])->name('master.index');
        // Kelas CRUD & Batch Import
        Route::post('/master/classrooms', [MasterDataController::class, 'storeClassroom'])->name('master.classrooms.store');
        Route::put('/master/classrooms/{classroom}', [MasterDataController::class, 'updateClassroom'])->name('master.classrooms.update');
        Route::delete('/master/classrooms/{classroom}', [MasterDataController::class, 'destroyClassroom'])->name('master.classrooms.destroy');
        Route::post('/master/classrooms/batch-import', [MasterDataController::class, 'batchImportClassrooms'])->name('master.classrooms.batch-import');
        Route::post('/master/duty-schedules', [MasterDataController::class, 'storeDutySchedule'])->name('master.duty-schedules.store');
        Route::put('/master/duty-schedules/{dutySchedule}', [MasterDataController::class, 'updateDutySchedule'])->name('master.duty-schedules.update');
        Route::delete('/master/duty-schedules/{dutySchedule}', [MasterDataController::class, 'destroyDutySchedule'])->name('master.duty-schedules.destroy');

        // Siswa CRUD & Batch Import
        Route::post('/master/students', [MasterDataController::class, 'storeStudent'])->name('master.students.store');
        Route::put('/master/students/{student}', [MasterDataController::class, 'updateStudent'])->name('master.students.update');
        Route::delete('/master/students/{student}', [MasterDataController::class, 'destroyStudent'])->name('master.students.destroy');
        Route::post('/master/students/batch-import', [MasterDataController::class, 'batchImportStudents'])->name('master.students.batch-import');
        Route::post('/master/promotions', [MasterDataController::class, 'processPromotions'])->name('master.promotions.process');
        Route::put('/master/alumni/{student}', [MasterDataController::class, 'updateAlumni'])->name('master.alumni.update');
        Route::post('/master/alumni/{student}/restore', [MasterDataController::class, 'restoreAlumni'])->name('master.alumni.restore');
        Route::post('/master/alumni/graduate', [MasterDataController::class, 'graduateStudent'])->name('master.alumni.graduate');
        Route::post('/master/alumni/bulk-destroy', [MasterDataController::class, 'bulkDestroyAlumni'])->name('master.alumni.bulk-destroy');
        Route::delete('/master/alumni/{student}', [MasterDataController::class, 'destroyAlumni'])->name('master.alumni.destroy');

        // Guru CRUD & Batch Import
        Route::post('/master/teachers', [MasterDataController::class, 'storeTeacher'])->name('master.teachers.store');
        Route::put('/master/teachers/{user}', [MasterDataController::class, 'updateTeacher'])->name('master.teachers.update');
        Route::delete('/master/teachers/{user}', [MasterDataController::class, 'destroyTeacher'])->name('master.teachers.destroy');
        Route::post('/master/teachers/batch-import', [MasterDataController::class, 'batchImportTeachers'])->name('master.teachers.batch-import');

        // Pengaturan Sekolah (Identitas, Logo, Jam Masuk, Kepala Sekolah)
        Route::get('/admin/school-settings', [SchoolSettingController::class, 'edit'])->name('school-settings.edit');
        Route::post('/admin/school-settings', [SchoolSettingController::class, 'update'])->name('school-settings.update');

        // Kalender Pendidikan & Hari Libur Nasional
        Route::get('/admin/holidays', [HolidayController::class, 'index'])->name('holidays.index');
        Route::post('/admin/holidays', [HolidayController::class, 'store'])->name('holidays.store');
        Route::patch('/admin/holidays/school-days', [HolidayController::class, 'updateSchoolDays'])->name('holidays.school-days');
        Route::put('/admin/holidays/{holiday}', [HolidayController::class, 'update'])->name('holidays.update');
        Route::delete('/admin/holidays/{holiday}', [HolidayController::class, 'destroy'])->name('holidays.destroy');
        Route::post('/admin/holidays/seed', [HolidayController::class, 'seed'])->name('holidays.seed');
    });
});

require __DIR__.'/settings.php';
