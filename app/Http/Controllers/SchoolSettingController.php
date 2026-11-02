<?php

namespace App\Http\Controllers;

use App\Models\SchoolSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SchoolSettingController extends Controller
{
    /**
     * Display the school settings form.
     */
    public function edit(): Response
    {
        $setting = SchoolSetting::getSetting();

        return Inertia::render('admin/school-settings', [
            'setting' => $setting,
        ]);
    }

    /**
     * Update the school settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:500',
            'city' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:100',
            'principal_name' => 'nullable|string|max:255',
            'principal_nip' => 'nullable|string|max:50',
            'start_time' => 'required|string|max:10',
            'school_days_per_week' => 'nullable|integer|in:5,6',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp,svg|max:2048',
            'remove_logo' => 'nullable|boolean',
        ]);

        $setting = SchoolSetting::getSetting();

        if ($request->boolean('remove_logo')) {
            if ($setting->logo_path && Storage::disk('public')->exists($setting->logo_path)) {
                Storage::disk('public')->delete($setting->logo_path);
            }
            $setting->logo_path = null;
        }

        if ($request->hasFile('logo')) {
            // Remove previous logo if existed
            if ($setting->logo_path && Storage::disk('public')->exists($setting->logo_path)) {
                Storage::disk('public')->delete($setting->logo_path);
            }

            $path = $request->file('logo')->store('school', 'public');
            $setting->logo_path = $path;
        }

        $setting->name = $validated['name'];
        $setting->address = $validated['address'] ?? null;
        $setting->city = $validated['city'] ?? null;
        $setting->postal_code = $validated['postal_code'] ?? null;
        $setting->phone = $validated['phone'] ?? null;
        $setting->email = $validated['email'] ?? null;
        $setting->principal_name = $validated['principal_name'] ?? null;
        $setting->principal_nip = $validated['principal_nip'] ?? null;
        $setting->start_time = substr($validated['start_time'], 0, 5);
        $setting->save();

        \App\Services\PwaManifestService::syncManifest();

        return back()->with('success', 'Pengaturan profil sekolah dan jam masuk berhasil disimpan.');
    }
}

