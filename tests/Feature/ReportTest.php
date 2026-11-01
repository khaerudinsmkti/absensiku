<?php

use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('authenticated user can view monthly attendance matrix report', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $classroom = Classroom::create([
        'name' => 'Kelas 1-A',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $admin->id,
    ]);

    $student = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Ahmad Fadhil',
        'nisn' => '0011223344',
        'nis' => '1001',
        'gender' => 'L',
        'is_active' => true,
    ]);

    Attendance::create([
        'student_id' => $student->id,
        'date' => '2026-10-05',
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
    $response->assertInertia(fn (Assert $page) => $page
        ->component('reports/index')
        ->has('days', 31)
        ->has('students', 1)
        ->where('students.0.name', 'Ahmad Fadhil')
        ->where('filterType', 'monthly')
        ->where('month', 10)
        ->where('year', 2026)
    );
});

test('user can view yearly report', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $classroom = Classroom::create([
        'name' => 'Kelas 2-B',
        'academic_year' => '2025/2026',
    ]);

    $response = $this->actingAs($admin)->get(route('reports.index', [
        'classroom_id' => $classroom->id,
        'filter_type' => 'yearly',
        'year' => 2026,
    ]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('reports/index')
        ->where('filterType', 'yearly')
    );
});

test('user can download attendance report as PDF', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $classroom = Classroom::create([
        'name' => 'Kelas 3-A',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $admin->id,
    ]);

    $student = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Citra Lestari',
        'nisn' => '0099887766',
        'nis' => '1002',
        'gender' => 'P',
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)->get(route('reports.export-pdf', [
        'classroom_id' => $classroom->id,
        'filter_type' => 'monthly',
        'month' => 10,
        'year' => 2026,
    ]));

    $response->assertOk();
    $response->assertHeader('content-type', 'application/pdf');
});

test('user can download attendance report as CSV', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $classroom = Classroom::create([
        'name' => 'Kelas 4-C',
        'academic_year' => '2025/2026',
    ]);

    $response = $this->actingAs($admin)->get(route('reports.export', [
        'classroom_id' => $classroom->id,
        'filter_type' => 'monthly',
        'month' => 10,
        'year' => 2026,
    ]));

    $response->assertOk();
    $response->assertHeader('content-type', 'application/vnd.ms-excel; charset=UTF-8');
});

test('report includes indonesian day initials and gender statistics breakdown', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $classroom = Classroom::create([
        'name' => 'Kelas 5-B',
        'academic_year' => '2026/2027',
        'homeroom_teacher_id' => $admin->id,
    ]);

    Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Budi Santoso',
        'nisn' => '1111222233',
        'nis' => '2001',
        'gender' => 'L',
        'is_active' => true,
    ]);

    Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Siti Nurhaliza',
        'nisn' => '1111222234',
        'nis' => '2002',
        'gender' => 'P',
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)->get(route('reports.index', [
        'classroom_id' => $classroom->id,
        'filter_type' => 'monthly',
        'month' => 10,
        'year' => 2026,
    ]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('reports/index')
        ->has('days', 31)
        ->where('days.0.day_name', 'Kamis') // 2026-10-01 was Thursday (Kamis)
        ->where('days.0.day_initial', 'K')
        ->has('genderStats')
        ->where('genderStats.male', 1)
        ->where('genderStats.female', 1)
        ->where('genderStats.total', 2)
    );
});


