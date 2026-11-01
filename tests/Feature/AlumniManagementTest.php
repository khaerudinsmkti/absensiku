<?php

use App\Models\Classroom;
use App\Models\Student;
use App\Models\User;

test('graduating student via promotion process marks student as alumni with graduation year', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $class6 = Classroom::create([
        'name' => 'Kelas 6-A',
        'academic_year' => '2025/2026',
        'homeroom_teacher_id' => $admin->id,
    ]);

    $student = Student::create([
        'classroom_id' => $class6->id,
        'name' => 'Budi Santoso',
        'nisn' => '2000000001',
        'nis' => '2001',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)
        ->post(route('master.promotions.process'), [
            'source_classroom_id' => $class6->id,
            'promotions' => [
                [
                    'student_id' => $student->id,
                    'action' => 'graduate',
                    'target_classroom_id' => null,
                ],
            ],
        ]);

    $response->assertRedirect();
    $freshStudent = $student->fresh();
    expect($freshStudent->is_active)->toBeFalse();
    expect($freshStudent->is_alumni)->toBeTrue();
    expect($freshStudent->graduation_year)->toBe('2025/2026');
});

test('admin can view master page with alumni data and stats', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $classroom = Classroom::create([
        'name' => 'Kelas 6-B',
        'academic_year' => '2024/2025',
    ]);

    Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Alumni Hebat',
        'nisn' => '2000000002',
        'nis' => '2002',
        'gender' => 'P',
        'is_active' => false,
        'is_alumni' => true,
        'graduation_year' => '2024/2025',
        'next_school' => 'SMP Negeri 1 Tarik',
    ]);

    $response = $this->actingAs($admin)->get(route('master.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('master/index')
        ->has('alumni')
        ->has('alumniYears')
        ->has('alumniStats')
        ->where('alumniStats.total', 1)
        ->where('alumniStats.with_next_school', 1)
    );
});

test('admin can update alumni details including next school and notes', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $classroom = Classroom::create([
        'name' => 'Kelas 6-C',
        'academic_year' => '2024/2025',
    ]);

    $alumnus = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Citra Kirana',
        'nisn' => '2000000003',
        'nis' => '2003',
        'gender' => 'P',
        'is_active' => false,
        'is_alumni' => true,
        'graduation_year' => '2024/2025',
    ]);

    $response = $this->actingAs($admin)
        ->put(route('master.alumni.update', $alumnus), [
            'graduation_year' => '2024/2025',
            'next_school' => 'SMP Negeri 2 Sidoarjo',
            'alumni_phone' => '081234567890',
            'alumni_notes' => 'Juara 1 OSN Matematika',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $fresh = $alumnus->fresh();
    expect($fresh->next_school)->toBe('SMP Negeri 2 Sidoarjo');
    expect($fresh->alumni_phone)->toBe('081234567890');
    expect($fresh->alumni_notes)->toBe('Juara 1 OSN Matematika');
});

test('admin can restore an alumnus back to active student in a class', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $classroom = Classroom::create([
        'name' => 'Kelas 6-A',
        'academic_year' => '2025/2026',
    ]);

    $alumnus = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Doni Salman',
        'nisn' => '2000000004',
        'nis' => '2004',
        'gender' => 'L',
        'is_active' => false,
        'is_alumni' => true,
        'graduation_year' => '2024/2025',
    ]);

    $response = $this->actingAs($admin)
        ->post(route('master.alumni.restore', $alumnus), [
            'classroom_id' => $classroom->id,
        ]);

    $response->assertRedirect();
    $fresh = $alumnus->fresh();
    expect($fresh->is_active)->toBeTrue();
    expect($fresh->is_alumni)->toBeFalse();
    expect($fresh->graduation_year)->toBeNull();
    expect($fresh->classroom_id)->toBe($classroom->id);
});

test('admin can manually graduate students to alumni', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $classroom = Classroom::create([
        'name' => 'Kelas 6-D',
        'academic_year' => '2025/2026',
    ]);

    $s1 = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Eka Prasetya',
        'nisn' => '2000000005',
        'nis' => '2005',
        'gender' => 'L',
        'is_active' => true,
    ]);

    $s2 = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Fani Rahma',
        'nisn' => '2000000006',
        'nis' => '2006',
        'gender' => 'P',
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)
        ->post(route('master.alumni.graduate'), [
            'student_ids' => [$s1->id, $s2->id],
            'graduation_year' => '2025/2026',
        ]);

    $response->assertRedirect();
    expect($s1->fresh()->is_alumni)->toBeTrue();
    expect($s1->fresh()->is_active)->toBeFalse();
    expect($s1->fresh()->graduation_year)->toBe('2025/2026');

    expect($s2->fresh()->is_alumni)->toBeTrue();
    expect($s2->fresh()->is_active)->toBeFalse();
    expect($s2->fresh()->graduation_year)->toBe('2025/2026');
});

test('teacher cannot access alumni management endpoints', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);

    $classroom = Classroom::create([
        'name' => 'Kelas 6-A',
        'academic_year' => '2024/2025',
    ]);

    $alumnus = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Gina Safitri',
        'nisn' => '2000000007',
        'nis' => '2007',
        'gender' => 'P',
        'is_active' => false,
        'is_alumni' => true,
        'graduation_year' => '2024/2025',
    ]);

    $this->actingAs($teacher)
        ->put(route('master.alumni.update', $alumnus), [
            'graduation_year' => '2024/2025',
        ])
        ->assertForbidden();

    $this->actingAs($teacher)
        ->post(route('master.alumni.restore', $alumnus), [
            'classroom_id' => $classroom->id,
        ])
        ->assertForbidden();

    $this->actingAs($teacher)
        ->post(route('master.alumni.graduate'), [
            'student_ids' => [$alumnus->id],
            'graduation_year' => '2024/2025',
        ])
        ->assertForbidden();

    $this->actingAs($teacher)
        ->post(route('master.alumni.bulk-destroy'), [
            'mode' => 'all',
        ])
        ->assertForbidden();
});

test('deleting single alumni removes attendances, lateness, adjustments and files', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    $admin = User::factory()->create(['role' => 'admin']);

    $classroom = Classroom::create([
        'name' => 'Kelas 6-A',
        'academic_year' => '2024/2025',
    ]);

    $alumnus = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Hendra Setiawan',
        'nisn' => '2000000008',
        'nis' => '2008',
        'gender' => 'L',
        'is_active' => false,
        'is_alumni' => true,
        'graduation_year' => '2024/2025',
    ]);

    // Create attendance with lateness
    $attendance = \App\Models\Attendance::create([
        'student_id' => $alumnus->id,
        'recorded_by' => $admin->id,
        'date' => '2024-09-01',
        'status' => 'present',
        'check_in_time' => '07:25:00',
        'is_late' => true,
        'late_minutes' => 25,
    ]);

    // Create special attendance adjustment with attachment
    $attachmentPath = 'adjustments/sample_izin.pdf';
    \Illuminate\Support\Facades\Storage::disk('public')->put($attachmentPath, 'sample file content');

    $adjustment = \App\Models\AttendanceAdjustment::create([
        'attendance_id' => $attendance->id,
        'approved_by' => $admin->id,
        'type' => 'early_leave_sick',
        'departure_time' => '10:00:00',
        'reason' => 'Demam tinggi',
        'pickup_person' => 'Orang Tua',
        'attachment_path' => $attachmentPath,
    ]);

    expect(\Illuminate\Support\Facades\Storage::disk('public')->exists($attachmentPath))->toBeTrue();

    $response = $this->actingAs($admin)
        ->delete(route('master.alumni.destroy', $alumnus));

    $response->assertRedirect();
    $response->assertSessionHas('success');

    expect(Student::find($alumnus->id))->toBeNull();
    expect(\App\Models\Attendance::find($attendance->id))->toBeNull();
    expect(\App\Models\AttendanceAdjustment::find($adjustment->id))->toBeNull();
    expect(\Illuminate\Support\Facades\Storage::disk('public')->exists($attachmentPath))->toBeFalse();
});

test('admin can bulk delete alumni by selected student IDs along with all related records', function () {
    \Illuminate\Support\Facades\Storage::fake('public');
    $admin = User::factory()->create(['role' => 'admin']);

    $classroom = Classroom::create([
        'name' => 'Kelas 6-B',
        'academic_year' => '2024/2025',
    ]);

    $alumni1 = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Siswa 1',
        'nisn' => '2000000011',
        'nis' => '2011',
        'gender' => 'L',
        'is_active' => false,
        'is_alumni' => true,
        'graduation_year' => '2024/2025',
    ]);

    $alumni2 = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Siswa 2',
        'nisn' => '2000000012',
        'nis' => '2012',
        'gender' => 'P',
        'is_active' => false,
        'is_alumni' => true,
        'graduation_year' => '2024/2025',
    ]);

    $att1 = \App\Models\Attendance::create([
        'student_id' => $alumni1->id,
        'recorded_by' => $admin->id,
        'date' => '2024-09-02',
        'status' => 'present',
        'is_late' => false,
    ]);

    $att2 = \App\Models\Attendance::create([
        'student_id' => $alumni2->id,
        'recorded_by' => $admin->id,
        'date' => '2024-09-02',
        'status' => 'present',
        'is_late' => true,
        'late_minutes' => 15,
    ]);

    $response = $this->actingAs($admin)
        ->post(route('master.alumni.bulk-destroy'), [
            'mode' => 'selected',
            'student_ids' => [$alumni1->id, $alumni2->id],
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    expect(Student::whereIn('id', [$alumni1->id, $alumni2->id])->count())->toBe(0);
    expect(\App\Models\Attendance::whereIn('id', [$att1->id, $att2->id])->count())->toBe(0);
});

test('admin can bulk delete alumni by graduation year', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $classroom = Classroom::create([
        'name' => 'Kelas 6-C',
        'academic_year' => '2023/2024',
    ]);

    $alumni2023 = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Lulusan 2023',
        'nisn' => '2000000021',
        'nis' => '2021',
        'gender' => 'L',
        'is_active' => false,
        'is_alumni' => true,
        'graduation_year' => '2023/2024',
    ]);

    $alumni2024 = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Lulusan 2024',
        'nisn' => '2000000022',
        'nis' => '2022',
        'gender' => 'P',
        'is_active' => false,
        'is_alumni' => true,
        'graduation_year' => '2024/2025',
    ]);

    $response = $this->actingAs($admin)
        ->post(route('master.alumni.bulk-destroy'), [
            'mode' => 'year',
            'graduation_year' => '2023/2024',
        ]);

    $response->assertRedirect();
    expect(Student::find($alumni2023->id))->toBeNull();
    expect(Student::find($alumni2024->id))->not->toBeNull();
});

test('admin can bulk delete all alumni', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $classroom = Classroom::create([
        'name' => 'Kelas 6-D',
        'academic_year' => '2024/2025',
    ]);

    Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Alumni A',
        'nisn' => '2000000031',
        'nis' => '2031',
        'gender' => 'L',
        'is_active' => false,
        'is_alumni' => true,
        'graduation_year' => '2024/2025',
    ]);

    // Active student should not be deleted
    $activeStudent = Student::create([
        'classroom_id' => $classroom->id,
        'name' => 'Siswa Masih Aktif',
        'nisn' => '2000000032',
        'nis' => '2032',
        'gender' => 'P',
        'is_active' => true,
        'is_alumni' => false,
    ]);

    $response = $this->actingAs($admin)
        ->post(route('master.alumni.bulk-destroy'), [
            'mode' => 'all',
        ]);

    $response->assertRedirect();
    expect(Student::where('is_alumni', true)->count())->toBe(0);
    expect(Student::find($activeStudent->id))->not->toBeNull();
});

