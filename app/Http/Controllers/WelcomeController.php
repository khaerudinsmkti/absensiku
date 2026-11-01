<?php

namespace App\Http\Controllers;

use App\Models\AcademicHoliday;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    public function index(Request $request): Response
    {
        $today = Carbon::today();
        $month = (int) $request->input('month', $today->month);
        $year = (int) $request->input('year', $today->year);

        // Normalize month & year if navigated
        if ($month < 1) {
            $month = 12;
            $year--;
        } elseif ($month > 12) {
            $month = 1;
            $year++;
        }

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $currentDate = Carbon::createFromDate($year, $month, 1);
        $startOfMonth = $currentDate->copy()->startOfMonth();
        $endOfMonth = $currentDate->copy()->endOfMonth();
        $daysCount = $currentDate->daysInMonth;

        // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        $firstDayOfWeek = $startOfMonth->dayOfWeek;

        // Holidays for this month
        $holidays = AcademicHoliday::where(function ($q) use ($startOfMonth, $endOfMonth) {
            $q->whereBetween('start_date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                ->orWhereBetween('end_date', [$startOfMonth->toDateString(), $endOfMonth->toDateString()])
                ->orWhere(function ($sub) use ($startOfMonth, $endOfMonth) {
                    $sub->where('start_date', '<=', $startOfMonth->toDateString())
                        ->where('end_date', '>=', $endOfMonth->toDateString());
                });
        })->orderBy('start_date')->get();

        $days = [];
        $effectiveDays = 0;
        $holidayDays = 0;
        $isSaturdayOff = AcademicHoliday::isSaturdayHoliday();

        $dayNamesIndo = [
            0 => 'Minggu', 1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu',
        ];

        for ($i = 1; $i <= $daysCount; $i++) {
            $cur = Carbon::createFromDate($year, $month, $i);
            $dateStr = $cur->toDateString();
            $isSunday = $cur->isSunday();
            $isSaturday = $cur->isSaturday();
            $isSaturdayHoliday = $isSaturday && $isSaturdayOff;
            $isToday = $cur->isSameDay($today);
            $dayOfWeek = $cur->dayOfWeek;

            $matchingHoliday = $holidays->first(function ($h) use ($dateStr) {
                return $dateStr >= $h->start_date->toDateString() && $dateStr <= $h->end_date->toDateString();
            });

            $isWeekend = $isSunday || $isSaturdayHoliday;
            $isHoliday = $isWeekend || $matchingHoliday !== null;
            if ($isHoliday) {
                $holidayDays++;
            } else {
                $effectiveDays++;
            }

            $days[] = [
                'date' => $dateStr,
                'day' => $i,
                'day_of_week' => $dayOfWeek,
                'day_name' => $dayNamesIndo[$dayOfWeek] ?? '',
                'is_sunday' => $isSunday,
                'is_saturday' => $isSaturday,
                'is_saturday_off' => $isSaturdayHoliday,
                'is_holiday' => (bool) $matchingHoliday,
                'is_off' => $isHoliday,
                'is_today' => $isToday,
                'holiday_name' => $matchingHoliday?->name ?? ($isSunday ? 'Hari Minggu' : ($isSaturdayHoliday ? 'Hari Sabtu (Libur Akhir Pekan)' : null)),
                'holiday_type' => $matchingHoliday?->type ?? ($isWeekend ? 'weekend' : null),
                'holiday_type_name' => $matchingHoliday?->type_name ?? ($isWeekend ? 'Libur Akhir Pekan' : null),
                'holiday_description' => $matchingHoliday?->description ?? ($isSaturdayHoliday ? 'Sistem 5 Hari Sekolah: Sabtu & Minggu libur' : null),
            ];
        }

        $holidaysList = $holidays->map(fn ($h) => [
            'id' => $h->id,
            'name' => $h->name,
            'type' => $h->type,
            'type_name' => $h->type_name,
            'start_date' => $h->start_date->toDateString(),
            'end_date' => $h->end_date->toDateString(),
            'formatted_dates' => $h->formatted_dates,
            'description' => $h->description,
        ]);

        $prevDate = $currentDate->copy()->subMonth();
        $nextDate = $currentDate->copy()->addMonth();

        $calendar = [
            'month' => $month,
            'year' => $year,
            'month_name' => ($monthNames[$month] ?? '') . ' ' . $year,
            'is_current_month' => $month === $today->month && $year === $today->year,
            'prev_month' => $prevDate->month,
            'prev_year' => $prevDate->year,
            'next_month' => $nextDate->month,
            'next_year' => $nextDate->year,
            'first_day_of_week' => $firstDayOfWeek,
            'days_count' => (int) $daysCount,
            'days' => $days,
            'holidays' => $holidaysList,
            'effective_days' => (int) $effectiveDays,
            'holiday_days' => (int) $holidayDays,
            'total_days' => (int) $daysCount,
            'school_days_per_week' => $isSaturdayOff ? 5 : 6,
            'is_saturday_holiday' => $isSaturdayOff,
        ];

        return Inertia::render('welcome', [
            'calendar' => $calendar,
        ]);
    }
}

