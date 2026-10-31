<?php

use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('dashboard returns daily, monthly, and yearly recap and top students', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $classroom = Classroom::create([
        'name' => 'Kelas 1-A',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $admin->id,
    ]);

    $student1 = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Budi Pratama',
        'nisn' => '0011223344',
        'nis' => '1001',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $student2 = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Siti Aisyah',
        'nisn' => '0011223355',
        'nis' => '1002',
        'gender' => 'P',
        'is_active' => true,
    ]);

    $today = Carbon::today()->toDateString();

    // Student 1: late today
    Attendance::create([
        'student_id' => $student1->id,
        'recorded_by' => $admin->id,
        'date' => $today,
        'status' => 'present',
        'is_late' => true,
        'late_minutes' => 15,
        'notes' => 'Macet',
    ]);

    // Student 2: absent today
    Attendance::create([
        'student_id' => $student2->id,
        'recorded_by' => $admin->id,
        'date' => $today,
        'status' => 'absent',
        'is_late' => false,
        'notes' => 'Tanpa keterangan',
    ]);

    $this->actingAs($admin);

    $response = $this->get(route('dashboard', ['classroom_id' => $classroom->id]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('dashboard')
        ->has('recap.daily')
        ->has('recap.monthly')
        ->has('recap.yearly')
        ->has('top_students.yearly.terlambat')
        ->has('top_students.yearly.alpha')
        ->where('recap.daily.total_terlambat', 1)
        ->where('recap.daily.total_alpha', 1)
        ->where('top_students.yearly.terlambat.0.name', 'Budi Pratama')
        ->where('top_students.yearly.alpha.0.name', 'Siti Aisyah')
    );
});
