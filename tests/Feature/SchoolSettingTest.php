<?php

use App\Models\SchoolSetting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected from school settings page to login', function () {
    $response = $this->get(route('school-settings.edit'));
    $response->assertRedirect(route('login'));
});

test('teachers cannot access school settings page', function () {
    $teacher = User::factory()->create(['role' => 'teacher']);

    $response = $this->actingAs($teacher)->get(route('school-settings.edit'));
    $response->assertForbidden();
});

test('admin can view school settings page', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)->get(route('school-settings.edit'));
    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('admin/school-settings')
        ->has('setting')
    );
});

test('admin can update school profile and start time', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)
        ->from(route('school-settings.edit'))
        ->post(route('school-settings.update'), [
            'name' => 'SD Negeri Unggulan 01',
            'address' => 'Jl. Kartini No. 88',
            'city' => 'Bandung',
            'postal_code' => '40115',
            'phone' => '(022) 1234567',
            'email' => 'admin@sdn01bandung.sch.id',
            'principal_name' => 'Dra. Hj. Siti Aminah, M.M.',
            'principal_nip' => '196803151992032003',
            'start_time' => '07:15',
        ]);

    $response->assertSessionHasNoErrors();
    $response->assertRedirect(route('school-settings.edit'));

    $setting = SchoolSetting::getSetting();
    expect($setting->name)->toBe('SD Negeri Unggulan 01');
    expect($setting->address)->toBe('Jl. Kartini No. 88');
    expect($setting->city)->toBe('Bandung');
    expect($setting->principal_name)->toBe('Dra. Hj. Siti Aminah, M.M.');
    expect($setting->principal_nip)->toBe('196803151992032003');
    expect($setting->start_time)->toBe('07:15');
});

test('admin can upload and remove school logo', function () {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'admin']);

    $file = UploadedFile::fake()->image('logo.png', 200, 200);

    $response = $this->actingAs($admin)
        ->from(route('school-settings.edit'))
        ->post(route('school-settings.update'), [
            'name' => 'SD Negeri Unggulan 01',
            'start_time' => '07:00',
            'logo' => $file,
        ]);

    $response->assertSessionHasNoErrors();

    $setting = SchoolSetting::getSetting();
    expect($setting->logo_path)->not->toBeNull();
    Storage::disk('public')->assertExists($setting->logo_path);

    // Test removing logo
    $removeResponse = $this->actingAs($admin)
        ->from(route('school-settings.edit'))
        ->post(route('school-settings.update'), [
            'name' => 'SD Negeri Unggulan 01',
            'start_time' => '07:00',
            'remove_logo' => true,
        ]);

    $removeResponse->assertSessionHasNoErrors();
    $setting->refresh();
    expect($setting->logo_path)->toBeNull();
});

