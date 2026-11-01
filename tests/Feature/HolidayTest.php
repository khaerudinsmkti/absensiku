<?php

use App\Models\AcademicHoliday;
use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin can view holidays page', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    AcademicHoliday::create([
        'name' => 'Hari Pendidikan Nasional',
        'type' => 'school_holiday',
        'start_date' => '2026-05-02',
        'end_date' => '2026-05-02',
        'description' => 'Hardiknas',
    ]);

    $response = $this->actingAs($admin)->get(route('holidays.index', ['year' => 2026]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/holidays/index')
        ->where('selectedYear', 2026)
        ->has('holidays')
        ->has('stats')
    );
});

test('teacher cannot access holidays page', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);

    $response = $this->actingAs($teacher)->get(route('holidays.index'));

    $response->assertForbidden();
});

test('admin can create holiday', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->post(route('holidays.store'), [
        'name' => 'Hari Libur Ujian Semester Gasal',
        'type' => 'school_holiday',
        'start_date' => '2026-12-20',
        'end_date' => '2026-12-25',
        'description' => 'Libur jeda semester',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('academic_holidays', [
        'name' => 'Hari Libur Ujian Semester Gasal',
        'type' => 'school_holiday',
        'start_date' => '2026-12-20',
        'end_date' => '2026-12-25',
    ]);
});

test('admin can update holiday', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $holiday = AcademicHoliday::create([
        'name' => 'Hari Guru',
        'type' => 'school_holiday',
        'start_date' => '2026-11-25',
        'end_date' => '2026-11-25',
    ]);

    $response = $this->actingAs($admin)->put(route('holidays.update', $holiday), [
        'name' => 'Hari Guru Nasional & HUT PGRI',
        'type' => 'school_holiday',
        'start_date' => '2026-11-25',
        'end_date' => '2026-11-26',
        'description' => 'Kegiatan khusus guru',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('academic_holidays', [
        'id' => $holiday->id,
        'name' => 'Hari Guru Nasional & HUT PGRI',
        'end_date' => '2026-11-26',
    ]);
});

test('admin can delete holiday', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $holiday = AcademicHoliday::create([
        'name' => 'Libur Uji Coba',
        'type' => 'school_holiday',
        'start_date' => '2026-10-15',
        'end_date' => '2026-10-15',
    ]);

    $response = $this->actingAs($admin)->delete(route('holidays.destroy', $holiday));

    $response->assertRedirect();
    $this->assertDatabaseMissing('academic_holidays', [
        'id' => $holiday->id,
    ]);
});

test('admin can seed default national holidays', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->post(route('holidays.seed'), [
        'year' => 2026,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('academic_holidays', [
        'name' => 'Tahun Baru Masehi',
        'start_date' => '2026-01-01',
    ]);
});

test('holiday dates are excluded from attendance effective school days and marked L in matrix', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $classroom = Classroom::create([
        'name' => 'Kelas X-A',
        'academic_year' => '2026/2027',
        'homeroom_teacher_id' => $admin->id,
    ]);

    $student = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Rina Gunawan',
        'nisn' => '9988776655',
        'nis' => '5001',
        'gender' => 'P',
        'is_active' => true,
    ]);

    // Set 2026-10-15 as a national holiday
    AcademicHoliday::create([
        'name' => 'Hari Libur Nasional Contoh',
        'type' => 'national_holiday',
        'start_date' => '2026-10-15',
        'end_date' => '2026-10-15',
        'description' => 'Libur Uji Coba Kalender',
    ]);

    // Student attends 2026-10-14 (present)
    Attendance::create([
        'student_id' => $student->id,
        'date' => '2026-10-14',
        'status' => 'present',
        'recorded_by' => $admin->id,
    ]);

    $response = $this->actingAs($admin)->get(route('reports.index', [
        'classroom_id' => $classroom->id,
        'filter_type' => 'monthly',
        'month' => 10,
        'year' => 2026,
    ]));

    $response->assertOk();
    $response->assertInertia(function (Assert $page) {
        $page->component('reports/index')
            ->has('periodHolidays')
            ->where('days.14.date', '2026-10-15')
            ->where('days.14.is_holiday', true)
            ->where('days.14.holiday_name', 'Hari Libur Nasional Contoh')
            ->where('students.0.daily_attendances.15.code', 'L')
            ->where('students.0.daily_attendances.15.status', 'holiday');
    });
});

test('admin can switch school days to 5 days week and 6 days week', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->patch(route('holidays.school-days'), [
        'school_days_per_week' => 5,
    ]);

    $response->assertRedirect();
    $setting = \App\Models\SchoolSetting::getSetting();
    expect($setting->school_days_per_week)->toBe(5);
    expect($setting->isSaturdayHoliday())->toBeTrue();

    // Switch back to 6 days
    $response6 = $this->actingAs($admin)->patch(route('holidays.school-days'), [
        'school_days_per_week' => 6,
    ]);

    $response6->assertRedirect();
    $setting->refresh();
    expect($setting->school_days_per_week)->toBe(6);
    expect($setting->isSaturdayHoliday())->toBeFalse();
});

test('saturday is recognized as off day when 5 days week is active', function () {
    $setting = \App\Models\SchoolSetting::getSetting();
    $setting->update(['school_days_per_week' => 5]);

    // 2026-10-31 is Saturday
    $saturday = '2026-10-31';
    $offDay = AcademicHoliday::getOffDay($saturday);

    expect($offDay)->not->toBeNull();
    expect($offDay->name)->toBe('Hari Sabtu');
    expect($offDay->is_weekend)->toBeTrue();

    // If 6 days week is active, Saturday is active school day
    $setting->update(['school_days_per_week' => 6]);
    $offDay6 = AcademicHoliday::getOffDay($saturday);
    expect($offDay6)->toBeNull();
});

test('batch attendance cannot be submitted on saturday when 5 days week is active', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $setting = \App\Models\SchoolSetting::getSetting();
    $setting->update(['school_days_per_week' => 5]);

    $classroom = Classroom::create([
        'name' => 'Kelas X-SatTest',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $admin->id,
    ]);

    $student = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Siswa Sabtu Libur',
        'nisn' => '1122334455',
        'nis' => '8001',
        'gender' => 'L',
        'is_active' => true,
    ]);

    // Saturday 2026-10-24
    $saturdayDate = '2026-10-24';

    $response = $this->actingAs($admin)
        ->post(route('attendances.batch'), [
            'classroom_id' => $classroom->id,
            'date' => $saturdayDate,
            'attendances' => [
                [
                    'student_id' => $student->id,
                    'status' => 'present',
                ],
            ],
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('error');
    $this->assertDatabaseMissing('attendances', [
        'student_id' => $student->id,
        'date' => $saturdayDate,
    ]);
});
