<?php

use App\Models\DutySchedule;
use App\Models\User;

test('admin can assign duty schedule to a teacher for multiple days at once', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $teacher = User::factory()->create(['role' => 'teacher', 'name' => 'Guru Piket Hebat']);

    $response = $this->actingAs($admin)
        ->post(route('master.duty-schedules.store'), [
            'teacher_id' => $teacher->id,
            'days_of_week' => [1, 3, 5], // Senin, Rabu, Jumat
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $schedules = DutySchedule::where('teacher_id', $teacher->id)->get();
    expect($schedules)->toHaveCount(3);
    expect($schedules->pluck('day_of_week')->sort()->values()->toArray())->toBe([1, 3, 5]);
});

test('admin can assign duty schedule with single day for backward compatibility', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $teacher = User::factory()->create(['role' => 'teacher', 'name' => 'Guru Piket Selasa']);

    $response = $this->actingAs($admin)
        ->post(route('master.duty-schedules.store'), [
            'teacher_id' => $teacher->id,
            'day_of_week' => 2, // Selasa
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    $schedule = DutySchedule::where('teacher_id', $teacher->id)->first();
    expect($schedule)->not->toBeNull();
    expect($schedule->day_of_week)->toBe(2);
});

test('teacher cannot assign duty schedule', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);
    $otherTeacher = User::factory()->create(['role' => 'teacher']);

    $this->actingAs($teacher)
        ->post(route('master.duty-schedules.store'), [
            'teacher_id' => $otherTeacher->id,
            'days_of_week' => [1, 2],
        ])
        ->assertForbidden();
});

