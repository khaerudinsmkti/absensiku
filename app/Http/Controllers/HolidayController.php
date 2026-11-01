<?php

namespace App\Http\Controllers;

use App\Models\AcademicHoliday;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HolidayController extends Controller
{
    /**
     * Display a listing of educational calendar holidays.
     */
    public function index(Request $request): Response
    {
        $selectedYear = (int) $request->input('year', Carbon::today()->year);

        $holidays = AcademicHoliday::where(function ($q) use ($selectedYear) {
            $q->whereYear('start_date', $selectedYear)
                ->orWhereYear('end_date', $selectedYear);
        })
        ->orderBy('start_date')
        ->get();

        $schoolSetting = \App\Models\SchoolSetting::getSetting();

        $stats = [
            'total_holidays' => $holidays->count(),
            'total_days' => $holidays->sum('duration_days'),
            'national_holidays' => $holidays->where('type', 'national_holiday')->count(),
            'joint_leaves' => $holidays->where('type', 'joint_leave')->count(),
            'school_holidays' => $holidays->where('type', 'school_holiday')->count(),
        ];

        return Inertia::render('admin/holidays/index', [
            'holidays' => $holidays,
            'selectedYear' => $selectedYear,
            'stats' => $stats,
            'schoolSetting' => [
                'school_days_per_week' => (int) ($schoolSetting->school_days_per_week ?? 6),
                'is_saturday_holiday' => $schoolSetting->isSaturdayHoliday(),
            ],
        ]);
    }

    /**
     * Store a newly created holiday.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'type' => 'required|string|in:national_holiday,joint_leave,school_holiday,other',
            'description' => 'nullable|string|max:500',
            'academic_year' => 'nullable|string|max:50',
        ]);

        AcademicHoliday::create($validated);

        return back()->with('success', "Hari libur '{$validated['name']}' berhasil ditambahkan ke kalender pendidikan.");
    }

    /**
     * Update the specified holiday.
     */
    public function update(Request $request, AcademicHoliday $holiday): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'type' => 'required|string|in:national_holiday,joint_leave,school_holiday,other',
            'description' => 'nullable|string|max:500',
            'academic_year' => 'nullable|string|max:50',
        ]);

        $holiday->update($validated);

        return back()->with('success', "Data hari libur '{$holiday->name}' berhasil diperbarui.");
    }

    /**
     * Remove the specified holiday.
     */
    public function destroy(AcademicHoliday $holiday): RedirectResponse
    {
        $name = $holiday->name;
        $holiday->delete();

        return back()->with('success', "Hari libur '{$name}' berhasil dihapus dari kalender pendidikan.");
    }

    /**
     * Update effective school days per week (5-day vs 6-day week).
     */
    public function updateSchoolDays(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'school_days_per_week' => 'required|integer|in:5,6',
        ]);

        $setting = \App\Models\SchoolSetting::getSetting();
        $setting->update([
            'school_days_per_week' => (int) $validated['school_days_per_week'],
        ]);

        $msg = (int) $validated['school_days_per_week'] === 5
            ? 'Sistem 5 Hari Sekolah berhasil diterapkan (Hari Sabtu & Minggu libur, hari efektif: Senin - Jumat).'
            : 'Sistem 6 Hari Sekolah berhasil diterapkan (Hari Sabtu aktif belajar, hanya Minggu yang libur).';

        return back()->with('success', $msg);
    }

    /**
     * Seed standard national holidays for a given year.
     */
    public function seed(Request $request): RedirectResponse
    {
        $year = (int) $request->input('year', Carbon::today()->year);
        $count = AcademicHoliday::seedDefaultHolidays($year);

        return back()->with('success', "{$count} hari libur nasional untuk tahun {$year} berhasil disinkronkan.");
    }
}

