<?php

use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Carbon::setTestNow('2026-10-28 08:00:00');
});

test('authenticated user can view adjustments page with eligible students and classrooms', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $classroom = Classroom::create([
        'name' => 'Kelas 1-A',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $admin->id,
    ]);

    $student = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Fajar Pratama',
        'nisn' => '1234567890',
        'nis' => '101',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $attendance = Attendance::create([
        'student_id' => $student->id,
        'date' => now()->toDateString(),
        'status' => 'present',
        'recorded_by' => $admin->id,
    ]);

    $response = $this->actingAs($admin)->get(route('attendances.adjustments'));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('attendances/adjustments')
        ->has('classrooms')
        ->has('eligibleStudents', 1)
        ->where('eligibleStudents.0.attendance_id', $attendance->id)
        ->where('eligibleStudents.0.name', 'Fajar Pratama')
        ->where('eligibleStudents.0.classroom', 'Kelas 1-A')
    );
});

test('teacher only sees students from their assigned classroom in adjustments page', function () {
    $teacher1 = User::factory()->create(['role' => 'teacher']);
    $teacher2 = User::factory()->create(['role' => 'teacher']);

    $class1 = Classroom::create([
        'name' => 'Kelas 2-A',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $teacher1->id,
    ]);

    $class2 = Classroom::create([
        'name' => 'Kelas 2-B',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $teacher2->id,
    ]);

    $student1 = Student::create([
        'classroom_id' => $class1->id,
        'name' => 'Siswa Guru Satu',
        'nisn' => '1111111111',
        'nis' => '102',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $student2 = Student::create([
        'classroom_id' => $class2->id,
        'name' => 'Siswa Guru Dua',
        'nisn' => '2222222222',
        'nis' => '103',
        'gender' => 'P',
        'is_active' => true,
    ]);

    $att1 = Attendance::create([
        'student_id' => $student1->id,
        'date' => now()->toDateString(),
        'status' => 'present',
        'recorded_by' => $teacher1->id,
    ]);

    Attendance::create([
        'student_id' => $student2->id,
        'date' => now()->toDateString(),
        'status' => 'present',
        'recorded_by' => $teacher2->id,
    ]);

    $this->actingAs($teacher1)
        ->get(route('attendances.adjustments'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('attendances/adjustments')
            ->has('classrooms', 1)
            ->where('classrooms.0.id', $class1->id)
            ->has('eligibleStudents', 1)
            ->where('eligibleStudents.0.attendance_id', $att1->id)
            ->where('eligibleStudents.0.name', 'Siswa Guru Satu')
        );
});

test('user can record early leave adjustment for eligible present student', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $classroom = Classroom::create([
        'name' => 'Kelas 3-A',
        'academic_year' => '2025/2026',
    ]);

    $student = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Randi Ramadhan',
        'nisn' => '3333333333',
        'nis' => '104',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $attendance = Attendance::create([
        'student_id' => $student->id,
        'date' => now()->toDateString(),
        'status' => 'present',
        'recorded_by' => $admin->id,
    ]);

    $response = $this->actingAs($admin)->post(route('attendances.adjustments.store'), [
        'attendance_id' => $attendance->id,
        'type' => 'early_leave_sick',
        'departure_time' => '10:30',
        'reason' => 'Demam tinggi di kelas',
        'pickup_person' => 'Ibu Kandung',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('attendance_adjustments', [
        'attendance_id' => $attendance->id,
        'type' => 'early_leave_sick',
        'reason' => 'Demam tinggi di kelas',
        'pickup_person' => 'Ibu Kandung',
    ]);
});

