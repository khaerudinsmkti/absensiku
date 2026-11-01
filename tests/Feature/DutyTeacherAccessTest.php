<?php

use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\DutySchedule;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Carbon::setTestNow('2026-10-28 08:00:00'); // Wednesday

    SchoolSetting::create([
        'name' => 'SD Negeri Contoh',
        'start_time' => '07:00:00',
        'saturday_off' => false,
    ]);
});

test('duty teacher today can view all classrooms in daily attendance page', function () {
    $todayIso = Carbon::today()->dayOfWeekIso;

    $teacher1 = User::factory()->create(['role' => 'teacher', 'name' => 'Guru 1']);
    $teacher2 = User::factory()->create(['role' => 'teacher', 'name' => 'Guru 2']);

    Classroom::create(['name' => 'Kelas 1A', 'homeroom_teacher_id' => $teacher1->id]);
    Classroom::create(['name' => 'Kelas 2A', 'homeroom_teacher_id' => $teacher2->id]);

    // Teacher 1 is on duty today
    DutySchedule::create([
        'teacher_id' => $teacher1->id,
        'day_of_week' => $todayIso,
        'is_active' => true,
    ]);

    // Teacher 1 (duty) should see both classes
    $this->actingAs($teacher1)
        ->get(route('attendances.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('attendances/index')
            ->has('classrooms', 2)
            ->where('auth.user.is_duty_teacher_today', true)
        );

    // Teacher 2 (not on duty) should only see their own class
    $this->actingAs($teacher2)
        ->get(route('attendances.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('attendances/index')
            ->has('classrooms', 1)
            ->where('auth.user.is_duty_teacher_today', false)
        );
});

test('duty teacher can submit batch attendance and quick update for another teacher class', function () {
    $todayIso = Carbon::today()->dayOfWeekIso;

    $dutyTeacher = User::factory()->create(['role' => 'teacher']);
    $regularTeacher = User::factory()->create(['role' => 'teacher']);

    DutySchedule::create([
        'teacher_id' => $dutyTeacher->id,
        'day_of_week' => $todayIso,
        'is_active' => true,
    ]);

    $classOther = Classroom::create(['name' => 'Kelas 3B', 'homeroom_teacher_id' => $regularTeacher->id]);
    $student = Student::create([
        'name' => 'Budi Siswa',
        'nisn' => '1234567890',
        'nis' => '1001',
        'gender' => 'L',
        'classroom_id' => $classOther->id,
        'is_active' => true,
    ]);

    $todayStr = Carbon::today()->toDateString();

    // Regular teacher trying to submit for another class should fail
    $otherRegularTeacher = User::factory()->create(['role' => 'teacher']);
    $this->actingAs($otherRegularTeacher)
        ->post(route('attendances.batch'), [
            'classroom_id' => $classOther->id,
            'date' => $todayStr,
            'attendances' => [
                ['student_id' => $student->id, 'status' => 'present', 'is_late' => false],
            ],
        ])
        ->assertForbidden();

    // Duty teacher submitting for another class should succeed
    $this->actingAs($dutyTeacher)
        ->post(route('attendances.batch'), [
            'classroom_id' => $classOther->id,
            'date' => $todayStr,
            'attendances' => [
                ['student_id' => $student->id, 'status' => 'present', 'is_late' => false],
            ],
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('attendances', [
        'student_id' => $student->id,
        'date' => $todayStr,
        'status' => 'present',
    ]);

    // Duty teacher quick update
    $this->actingAs($dutyTeacher)
        ->patch(route('attendances.quick-update', $student), [
            'date' => $todayStr,
            'status' => 'sick',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('attendances', [
        'student_id' => $student->id,
        'date' => $todayStr,
        'status' => 'sick',
    ]);
});

test('duty teacher can record lateness for student from another class', function () {
    $todayIso = Carbon::today()->dayOfWeekIso;

    $dutyTeacher = User::factory()->create(['role' => 'teacher']);
    $regularTeacher = User::factory()->create(['role' => 'teacher']);

    DutySchedule::create([
        'teacher_id' => $dutyTeacher->id,
        'day_of_week' => $todayIso,
        'is_active' => true,
    ]);

    $classOther = Classroom::create(['name' => 'Kelas 4A', 'homeroom_teacher_id' => $regularTeacher->id]);
    $student = Student::create([
        'name' => 'Citra Siswi',
        'nisn' => '9876543210',
        'nis' => '1002',
        'gender' => 'P',
        'classroom_id' => $classOther->id,
        'is_active' => true,
    ]);

    $todayStr = Carbon::today()->toDateString();

    // Regular teacher cannot record lateness for student of another classroom
    $otherRegularTeacher = User::factory()->create(['role' => 'teacher']);
    $this->actingAs($otherRegularTeacher)
        ->from(route('attendances.lateness'))
        ->post(route('attendances.lateness.store'), [
            'student_id' => $student->id,
            'date' => $todayStr,
            'check_in_time' => '07:30',
            'reason' => 'Ban bocor',
        ])
        ->assertSessionHasErrors('student_id');

    // Duty teacher can record lateness for student of any classroom
    $this->actingAs($dutyTeacher)
        ->from(route('attendances.lateness'))
        ->post(route('attendances.lateness.store'), [
            'student_id' => $student->id,
            'date' => $todayStr,
            'check_in_time' => '07:30',
            'reason' => 'Ban bocor',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('attendances', [
        'student_id' => $student->id,
        'date' => $todayStr,
        'is_late' => true,
        'late_minutes' => 30,
    ]);
});

test('duty teacher can record attendance adjustment for student from another class', function () {
    $todayIso = Carbon::today()->dayOfWeekIso;

    $dutyTeacher = User::factory()->create(['role' => 'teacher']);
    $regularTeacher = User::factory()->create(['role' => 'teacher']);

    DutySchedule::create([
        'teacher_id' => $dutyTeacher->id,
        'day_of_week' => $todayIso,
        'is_active' => true,
    ]);

    $classOther = Classroom::create(['name' => 'Kelas 5A', 'homeroom_teacher_id' => $regularTeacher->id]);
    $student = Student::create([
        'name' => 'Doni Siswa',
        'nisn' => '5555555555',
        'nis' => '1003',
        'gender' => 'L',
        'classroom_id' => $classOther->id,
        'is_active' => true,
    ]);

    $todayStr = Carbon::today()->toDateString();
    $attendance = Attendance::create([
        'student_id' => $student->id,
        'date' => $todayStr,
        'status' => 'present',
        'recorded_by' => $regularTeacher->id,
    ]);

    // Regular teacher of another class cannot record adjustment
    $otherRegularTeacher = User::factory()->create(['role' => 'teacher']);
    $this->actingAs($otherRegularTeacher)
        ->post(route('attendances.adjustments.store'), [
            'attendance_id' => $attendance->id,
            'type' => 'early_leave_sick',
            'departure_time' => '10:00',
            'reason' => 'Demam tinggi',
            'pickup_person' => 'Orang tua',
        ])
        ->assertForbidden();

    // Duty teacher can record adjustment for any student
    $this->actingAs($dutyTeacher)
        ->post(route('attendances.adjustments.store'), [
            'attendance_id' => $attendance->id,
            'type' => 'early_leave_sick',
            'departure_time' => '10:00',
            'reason' => 'Demam tinggi',
            'pickup_person' => 'Orang tua',
        ])
        ->assertRedirect()
        ->assertSessionHas('success');

    $this->assertDatabaseHas('attendance_adjustments', [
        'attendance_id' => $attendance->id,
        'type' => 'early_leave_sick',
        'pickup_person' => 'Orang tua',
    ]);
});

test('duty teacher sees all classrooms in report and dashboard', function () {
    $todayIso = Carbon::today()->dayOfWeekIso;

    $dutyTeacher = User::factory()->create(['role' => 'teacher']);
    $teacher2 = User::factory()->create(['role' => 'teacher']);

    Classroom::create(['name' => 'Kelas A', 'homeroom_teacher_id' => $dutyTeacher->id]);
    Classroom::create(['name' => 'Kelas B', 'homeroom_teacher_id' => $teacher2->id]);

    DutySchedule::create([
        'teacher_id' => $dutyTeacher->id,
        'day_of_week' => $todayIso,
        'is_active' => true,
    ]);

    // Report
    $this->actingAs($dutyTeacher)
        ->get(route('reports.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('reports/index')
            ->has('classrooms', 2)
        );

    // Dashboard
    $this->actingAs($dutyTeacher)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->has('classrooms', 2)
        );
});
