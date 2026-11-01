<?php

use App\Models\Classroom;
use App\Models\Student;
use App\Models\User;

test('admin can promote students to next grade', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $class1 = Classroom::create([
        'name' => 'Kelas 1-A',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $admin->id,
    ]);

    $class2 = Classroom::create([
        'name' => 'Kelas 2-A',
        'academic_year' => '2026/2027',
        'homeroom_teacher_id' => $admin->id,
    ]);

    $student1 = Student::create([
        'classroom_id' => $class1->id,
        'name' => 'Ahmad Dani',
        'nisn' => '1000000001',
        'nis' => '1001',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $student2 = Student::create([
        'classroom_id' => $class1->id,
        'name' => 'Bella Cantika',
        'nisn' => '1000000002',
        'nis' => '1002',
        'gender' => 'P',
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)
        ->post(route('master.promotions.process'), [
            'source_classroom_id' => $class1->id,
            'promotions' => [
                [
                    'student_id' => $student1->id,
                    'action' => 'promote',
                    'target_classroom_id' => $class2->id,
                ],
                [
                    'student_id' => $student2->id,
                    'action' => 'promote',
                    'target_classroom_id' => $class2->id,
                ],
            ],
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    expect($student1->fresh()->classroom_id)->toBe($class2->id);
    expect($student1->fresh()->is_active)->toBeTrue();
    expect($student2->fresh()->classroom_id)->toBe($class2->id);
    expect($student2->fresh()->is_active)->toBeTrue();
});

test('admin can mark student as repeating grade or graduating', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $class6 = Classroom::create([
        'name' => 'Kelas 6-A',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $admin->id,
    ]);

    $studentRepeat = Student::create([
        'classroom_id' => $class6->id,
        'name' => 'Siswa Tinggal',
        'nisn' => '1000000003',
        'nis' => '1003',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $studentGraduate = Student::create([
        'classroom_id' => $class6->id,
        'name' => 'Siswa Lulus',
        'nisn' => '1000000004',
        'nis' => '1004',
        'gender' => 'P',
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)
        ->post(route('master.promotions.process'), [
            'source_classroom_id' => $class6->id,
            'promotions' => [
                [
                    'student_id' => $studentRepeat->id,
                    'action' => 'repeat',
                    'target_classroom_id' => null,
                ],
                [
                    'student_id' => $studentGraduate->id,
                    'action' => 'graduate',
                    'target_classroom_id' => null,
                ],
            ],
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // Repeating student stays in class6 and is active
    expect($studentRepeat->fresh()->classroom_id)->toBe($class6->id);
    expect($studentRepeat->fresh()->is_active)->toBeTrue();

    // Graduated student is deactivated
    expect($studentGraduate->fresh()->is_active)->toBeFalse();
});

test('teacher cannot process promotions', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    $class = Classroom::create([
        'name' => 'Kelas 1-B',
        'academic_year' => '2025/2026',
    ]);

    $student = Student::create([
        'classroom_id' => $class->id,
        'name' => 'Siswa Test',
        'nisn' => '1000000005',
        'nis' => '1005',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $response = $this->actingAs($teacher)
        ->post(route('master.promotions.process'), [
            'source_classroom_id' => $class->id,
            'promotions' => [
                [
                    'student_id' => $student->id,
                    'action' => 'promote',
                    'target_classroom_id' => $class->id,
                ],
            ],
        ]);

    $response->assertForbidden();
});

