<?php

use App\Models\SchoolSetting;
use App\Models\User;

test('pwa manifest returns valid json configuration with school name and logo', function () {
    $setting = SchoolSetting::getSetting();
    $setting->update([
        'name' => 'SD Negeri Harapan Bangsa',
        'logo_path' => 'school/sample_logo.png',
    ]);

    $response = $this->get('/manifest.json');

    $response->assertOk();
    $json = $response->json();

    expect($json['display'])->toBe('standalone');
    expect($json['theme_color'])->toBe('#FF6B35');
    expect($json['start_url'])->toBe('/');
    expect($json['name'])->toContain('SD Negeri Harapan Bangsa');
    expect($json['icons'])->not->toBeEmpty();
});

test('root page contains dynamic favicon and pwa tags', function () {
    $setting = SchoolSetting::getSetting();
    $setting->update([
        'name' => 'SD Negeri Maju Jaya',
        'logo_path' => 'school/sample_logo.png',
    ]);

    $response = $this->get('/');

    $response->assertOk();
    $response->assertSee('rel="manifest"', false);
    $response->assertSee('/manifest.json', false);
    $response->assertSee('sample_logo.png', false);
    $response->assertSee('theme-color', false);
});

