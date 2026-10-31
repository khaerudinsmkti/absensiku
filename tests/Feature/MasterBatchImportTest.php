<?php

use App\Models\Classroom;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('admin can batch import teachers from payload', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $payload = [
        'teachers' => [
            [
                'name' => 'Budi Santoso, S.Pd',
                'nip' => '198501012010011001',
                'email' => 'budi85@sekolah.id',
                'username' => 'budi85',
                'role' => 'Guru',
                'password' => 'secret123',
            ],
            [
                'name' => 'Dra. Hj. Siti Aminah, M.Pd',
                'nip' => '198702022011022002',
                'email' => null, // should generate automatically
                'username' => null, // should generate automatically
                'role' => 'Kepala Sekolah',
                'password' => null, // default
            ],
        ],
    ];

    $response = $this->actingAs($admin)
        ->post(route('master.teachers.batch-import'), $payload);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('users', [
        'name' => 'Budi Santoso, S.Pd',
        'nip' => '198501012010011001',
        'email' => 'budi85@sekolah.id',
        'username' => 'budi85',
        'role' => 'teacher',
    ]);

    $budi = User::where('nip', '198501012010011001')->first();
    expect(Hash::check('secret123', $budi->password))->toBeTrue();

    $this->assertDatabaseHas('users', [
        'name' => 'Dra. Hj. Siti Aminah, M.Pd',
        'nip' => '198702022011022002',
        'role' => 'principal',
    ]);
});

test('admin can batch import classrooms from payload and match homeroom teacher', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $teacher = User::factory()->create([
        'name' => 'Ahmad Dahlan, S.Pd',
        'nip' => '198205052008011005',
        'role' => 'teacher',
    ]);

    $payload = [
        'classrooms' => [
            [
                'name' => 'Kelas 1-A',
                'academic_year' => '2026/2027',
                'homeroom_teacher' => 'Ahmad Dahlan, S.Pd',
            ],
            [
                'name' => 'Kelas 1-B',
                'academic_year' => '2026/2027',
                'homeroom_teacher' => null,
            ],
        ],
    ];

    $response = $this->actingAs($admin)
        ->post(route('master.classrooms.batch-import'), $payload);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $this->assertDatabaseHas('classrooms', [
        'name' => 'Kelas 1-A',
        'academic_year' => '2026/2027',
        'homeroom_teacher_id' => $teacher->id,
    ]);

    $this->assertDatabaseHas('classrooms', [
        'name' => 'Kelas 1-B',
        'academic_year' => '2026/2027',
        'homeroom_teacher_id' => null,
    ]);
});

test('non-admin cannot batch import teachers or classrooms', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);

    $resTeachers = $this->actingAs($teacher)
        ->post(route('master.teachers.batch-import'), [
            'teachers' => [
                ['name' => 'Guru Palsu', 'nip' => '12345'],
            ],
        ]);

    $resTeachers->assertForbidden();

    $resClassrooms = $this->actingAs($teacher)
        ->post(route('master.classrooms.batch-import'), [
            'classrooms' => [
                ['name' => 'Kelas Ilegal'],
            ],
        ]);

    $resClassrooms->assertForbidden();
});

