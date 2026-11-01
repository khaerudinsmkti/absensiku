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

test('teacher only sees students from their assigned classroom in lateness form', function () {
    $teacher1 = User::factory()->create(['role' => 'teacher']);
    $teacher2 = User::factory()->create(['role' => 'teacher']);

    $class1 = Classroom::create([
        'name' => 'Kelas X-A',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $teacher1->id,
    ]);

    $class2 = Classroom::create([
        'name' => 'Kelas X-B',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $teacher2->id,
    ]);

    $student1 = Student::create([
        'classroom_id' => $class1->id,
        'name' => 'Budi Santoso',
        'nisn' => '0012345678',
        'nis' => '1001',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $student2 = Student::create([
        'classroom_id' => $class2->id,
        'name' => 'Siti Rahma',
        'nisn' => '0087654321',
        'nis' => '1002',
        'gender' => 'P',
        'is_active' => true,
    ]);

    $this->actingAs($teacher1)
        ->get(route('attendances.lateness'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('attendances/lateness')
            ->has('students', 1)
            ->where('students.0.id', $student1->id)
            ->where('students.0.name', 'Budi Santoso')
        );
});

test('teacher cannot record lateness for a student outside their assigned classroom', function () {
    $teacher1 = User::factory()->create(['role' => 'teacher']);
    $teacher2 = User::factory()->create(['role' => 'teacher']);

    $class1 = Classroom::create([
        'name' => 'Kelas XI-A',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $teacher1->id,
    ]);

    $class2 = Classroom::create([
        'name' => 'Kelas XI-B',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $teacher2->id,
    ]);

    $student2 = Student::create([
        'classroom_id' => $class2->id,
        'name' => 'Ahmad Outside',
        'nisn' => '0099999991',
        'nis' => '1003',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $response = $this->actingAs($teacher1)
        ->from(route('attendances.lateness'))
        ->post(route('attendances.lateness.store'), [
            'student_id' => $student2->id,
            'date' => now()->toDateString(),
            'check_in_time' => '07:30',
            'reason' => 'Macet di jalan',
        ]);

    $response->assertSessionHasErrors(['student_id']);
    expect(Attendance::where('student_id', $student2->id)->count())->toBe(0);
});

test('teacher can record lateness for their own student', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);

    $class = Classroom::create([
        'name' => 'Kelas XII-A',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $teacher->id,
    ]);

    $student = Student::create([
        'classroom_id' => $class->id,
        'name' => 'Joko MyStudent',
        'nisn' => '0099999992',
        'nis' => '1004',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $response = $this->actingAs($teacher)
        ->from(route('attendances.lateness'))
        ->post(route('attendances.lateness.store'), [
            'student_id' => $student->id,
            'date' => now()->toDateString(),
            'check_in_time' => '07:25',
            'reason' => 'Ban bocor',
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('attendances.lateness'));

    $record = Attendance::where('student_id', $student->id)->first();
    expect($record)->not->toBeNull();
    expect($record->is_late)->toBeTrue();
    expect($record->late_minutes)->toBe(25);
});

test('user can update lateness record', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $class = Classroom::create([
        'name' => 'Kelas X-C',
        'academic_year' => '2025/2026',
    ]);

    $student = Student::create([
        'classroom_id' => $class->id,
        'name' => 'Doni Lateness',
        'nisn' => '0099999993',
        'nis' => '1005',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $attendance = Attendance::create([
        'student_id' => $student->id,
        'date' => now()->toDateString(),
        'status' => 'present',
        'check_in_time' => '07:20:00',
        'is_late' => true,
        'late_minutes' => 20,
        'notes' => 'Alasan: Rantai sepeda putus',
        'recorded_by' => $admin->id,
    ]);

    $response = $this->actingAs($admin)
        ->put(route('attendances.lateness.update', $attendance), [
            'check_in_time' => '07:35',
            'reason' => 'Rantai sepeda putus dan jalan kaki',
            'sanction' => 'Menyapu halaman 10 menit',
        ]);

    $response->assertRedirect();
    $attendance->refresh();
    expect($attendance->late_minutes)->toBe(35);
    expect($attendance->notes)->toContain('Menyapu halaman 10 menit');
});

test('user can delete lateness record', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $class = Classroom::create([
        'name' => 'Kelas X-D',
        'academic_year' => '2025/2026',
    ]);

    $student = Student::create([
        'classroom_id' => $class->id,
        'name' => 'Eka DeleteMe',
        'nisn' => '0099999994',
        'nis' => '1006',
        'gender' => 'P',
        'is_active' => true,
    ]);

    $attendance = Attendance::create([
        'student_id' => $student->id,
        'date' => now()->toDateString(),
        'status' => 'present',
        'check_in_time' => '07:15:00',
        'is_late' => true,
        'late_minutes' => 15,
        'notes' => 'Alasan: Salah catat',
        'recorded_by' => $admin->id,
    ]);

    $response = $this->actingAs($admin)
        ->delete(route('attendances.lateness.destroy', $attendance));

    $response->assertRedirect();
    expect(Attendance::find($attendance->id))->toBeNull();
});
