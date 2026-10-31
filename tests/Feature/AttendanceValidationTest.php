<?php

use App\Models\AcademicHoliday;
use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;

test('submitting batch attendance on a holiday fails and redirects back with error', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $classroom = Classroom::create([
        'name' => 'Kelas X-Validation',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $admin->id,
    ]);

    $student = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Siswa Test Holiday',
        'nisn' => '9988112233',
        'nis' => '7001',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $holidayDate = '2026-08-17';
    AcademicHoliday::create([
        'name' => 'Hari Kemerdekaan RI',
        'type' => 'national_holiday',
        'start_date' => $holidayDate,
        'end_date' => $holidayDate,
    ]);

    $response = $this->actingAs($admin)
        ->from(route('attendances.index', ['classroom_id' => $classroom->id, 'date' => $holidayDate]))
        ->post(route('attendances.batch'), [
            'classroom_id' => $classroom->id,
            'date' => $holidayDate,
            'attendances' => [
                [
                    'student_id' => $student->id,
                    'status' => 'present',
                    'notes' => null,
                ],
            ],
        ]);

    $response->assertRedirect(route('attendances.index', ['classroom_id' => $classroom->id, 'date' => $holidayDate]));
    $response->assertSessionHas('error');
    $this->assertDatabaseMissing('attendances', [
        'student_id' => $student->id,
        'date' => $holidayDate,
    ]);
});

test('submitting batch attendance on a future date fails and redirects back with error', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $classroom = Classroom::create([
        'name' => 'Kelas X-Future',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $admin->id,
    ]);

    $student = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Siswa Test Future',
        'nisn' => '9988112234',
        'nis' => '7002',
        'gender' => 'P',
        'is_active' => true,
    ]);

    $futureDate = Carbon::tomorrow()->toDateString();

    $response = $this->actingAs($admin)
        ->from(route('attendances.index', ['classroom_id' => $classroom->id, 'date' => $futureDate]))
        ->post(route('attendances.batch'), [
            'classroom_id' => $classroom->id,
            'date' => $futureDate,
            'attendances' => [
                [
                    'student_id' => $student->id,
                    'status' => 'present',
                    'notes' => null,
                ],
            ],
        ]);

    $response->assertRedirect(route('attendances.index', ['classroom_id' => $classroom->id, 'date' => $futureDate]));
    $response->assertSessionHas('error');
    $this->assertDatabaseMissing('attendances', [
        'student_id' => $student->id,
        'date' => $futureDate,
    ]);
});

test('quick attendance update on future date fails and redirects back with error', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $classroom = Classroom::create([
        'name' => 'Kelas X-Quick',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $admin->id,
    ]);

    $student = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Siswa Quick Update',
        'nisn' => '9988112235',
        'nis' => '7003',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $futureDate = Carbon::tomorrow()->toDateString();

    $response = $this->actingAs($admin)
        ->patch(route('attendances.quick-update', $student), [
            'date' => $futureDate,
            'status' => 'present',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('error');
    $this->assertDatabaseMissing('attendances', [
        'student_id' => $student->id,
        'date' => $futureDate,
    ]);
});

test('submitting lateness on a holiday or future date fails with error flash', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $classroom = Classroom::create([
        'name' => 'Kelas X-LateValidation',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $admin->id,
    ]);

    $student = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Siswa Late Validation',
        'nisn' => '9988112236',
        'nis' => '7004',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $holidayDate = '2026-05-01';
    AcademicHoliday::create([
        'name' => 'Hari Buruh Internasional',
        'type' => 'national_holiday',
        'start_date' => $holidayDate,
        'end_date' => $holidayDate,
    ]);

    // 1. Holiday attempt
    $resHoliday = $this->actingAs($admin)
        ->post(route('attendances.lateness.store'), [
            'student_id' => $student->id,
            'date' => $holidayDate,
            'check_in_time' => '07:25',
            'reason' => 'Macet',
        ]);

    $resHoliday->assertRedirect();
    $resHoliday->assertSessionHas('error');

    // 2. Future date attempt
    $futureDate = Carbon::tomorrow()->toDateString();
    $resFuture = $this->actingAs($admin)
        ->post(route('attendances.lateness.store'), [
            'student_id' => $student->id,
            'date' => $futureDate,
            'check_in_time' => '07:25',
            'reason' => 'Macet masa depan',
        ]);

    $resFuture->assertRedirect();
    $resFuture->assertSessionHas('error');
});

test('submitting adjustment on a holiday or future date fails with error flash', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $classroom = Classroom::create([
        'name' => 'Kelas X-AdjValidation',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $admin->id,
    ]);

    $student = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Siswa Adj Validation',
        'nisn' => '9988112237',
        'nis' => '7005',
        'gender' => 'P',
        'is_active' => true,
    ]);

    $holidayDate = '2026-12-25';
    AcademicHoliday::create([
        'name' => 'Hari Raya Natal',
        'type' => 'national_holiday',
        'start_date' => $holidayDate,
        'end_date' => $holidayDate,
    ]);

    $attHoliday = Attendance::create([
        'student_id' => $student->id,
        'date' => $holidayDate,
        'status' => 'present',
        'recorded_by' => $admin->id,
    ]);

    $resHoliday = $this->actingAs($admin)
        ->post(route('attendances.adjustments.store'), [
            'attendance_id' => $attHoliday->id,
            'type' => 'early_leave_sick',
            'departure_time' => '10:00',
            'reason' => 'Demam mendadak di hari libur',
        ]);

    $resHoliday->assertRedirect();
    $resHoliday->assertSessionHas('error');

    $futureDate = Carbon::tomorrow()->toDateString();
    $attFuture = Attendance::create([
        'student_id' => $student->id,
        'date' => $futureDate,
        'status' => 'present',
        'recorded_by' => $admin->id,
    ]);

    $resFuture = $this->actingAs($admin)
        ->post(route('attendances.adjustments.store'), [
            'attendance_id' => $attFuture->id,
            'type' => 'early_leave_urgent',
            'departure_time' => '11:00',
            'reason' => 'Acara keluarga masa depan',
        ]);

    $resFuture->assertRedirect();
    $resFuture->assertSessionHas('error');
});
