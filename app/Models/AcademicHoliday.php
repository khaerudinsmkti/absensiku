<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicHoliday extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'type',
        'description',
        'academic_year',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date:Y-m-d',
            'end_date' => 'date:Y-m-d',
        ];
    }

    protected $appends = [
        'type_name',
        'duration_days',
        'formatted_dates',
    ];

    public function getTypeNameAttribute(): string
    {
        return match ($this->type) {
            'national_holiday' => 'Libur Nasional',
            'joint_leave' => 'Cuti Bersama',
            'school_holiday' => 'Libur Sekolah / Semester',
            default => 'Lainnya',
        };
    }

    public function getDurationDaysAttribute(): int
    {
        if (! $this->start_date || ! $this->end_date) {
            return 1;
        }

        return Carbon::parse($this->start_date)->diffInDays(Carbon::parse($this->end_date)) + 1;
    }

    public function getFormattedDatesAttribute(): string
    {
        if (! $this->start_date || ! $this->end_date) {
            return '-';
        }

        $start = Carbon::parse($this->start_date);
        $end = Carbon::parse($this->end_date);

        if ($start->isSameDay($end)) {
            return $start->translatedFormat('d F Y');
        }

        if ($start->month === $end->month && $start->year === $end->year) {
            return $start->format('d') . ' - ' . $end->translatedFormat('d F Y');
        }

        return $start->translatedFormat('d M Y') . ' - ' . $end->translatedFormat('d M Y');
    }

    /**
     * Check if a specific date is a registered holiday.
     */
    public static function isHoliday(string|Carbon $date): ?self
    {
        $dateStr = Carbon::parse($date)->toDateString();

        return static::where('start_date', '<=', $dateStr)
            ->where('end_date', '>=', $dateStr)
            ->first();
    }

    /**
     * Check if Saturday is treated as a holiday in the school system.
     */
    public static function isSaturdayHoliday(): bool
    {
        return SchoolSetting::getSetting()->isSaturdayHoliday();
    }

    /**
     * Get holiday or weekend off-day information for a specific date.
     * Returns an object with holiday details, or null if it's an active school day.
     */
    public static function getOffDay(string|Carbon $date): ?object
    {
        $carbon = Carbon::parse($date);

        $holiday = static::isHoliday($carbon);
        if ($holiday) {
            return (object) [
                'name' => $holiday->name,
                'type' => $holiday->type,
                'type_name' => $holiday->type_name,
                'description' => $holiday->description,
                'is_weekend' => false,
            ];
        }

        if ($carbon->isSunday()) {
            return (object) [
                'name' => 'Hari Minggu',
                'type' => 'weekend',
                'type_name' => 'Libur Akhir Pekan',
                'description' => 'Hari Minggu adalah hari libur akhir pekan sekolah.',
                'is_weekend' => true,
            ];
        }

        if ($carbon->isSaturday() && static::isSaturdayHoliday()) {
            return (object) [
                'name' => 'Hari Sabtu',
                'type' => 'weekend',
                'type_name' => 'Libur Akhir Pekan (5 Hari Sekolah)',
                'description' => 'Hari Sabtu adalah hari libur akhir pekan (sistem 5 hari sekolah: Senin - Jumat).',
                'is_weekend' => true,
            ];
        }

        return null;
    }

    /**
     * Get an associative array of all holiday dates within the given range:
     * ['2026-08-17' => ['name' => 'Hari Kemerdekaan RI', 'type' => 'national_holiday', ...], ...]
     */
    public static function getHolidayDatesBetween(string|Carbon $start, string|Carbon $end): array
    {
        $startStr = Carbon::parse($start)->toDateString();
        $endStr = Carbon::parse($end)->toDateString();

        $holidays = static::where(function ($q) use ($startStr, $endStr) {
            $q->whereBetween('start_date', [$startStr, $endStr])
                ->orWhereBetween('end_date', [$startStr, $endStr])
                ->orWhere(function ($sub) use ($startStr, $endStr) {
                    $sub->where('start_date', '<=', $startStr)
                        ->where('end_date', '>=', $endStr);
                });
        })->get();

        $dates = [];
        foreach ($holidays as $h) {
            $curr = Carbon::parse($h->start_date);
            $endC = Carbon::parse($h->end_date);
            while ($curr->lte($endC)) {
                $dStr = $curr->toDateString();
                if ($curr->gte(Carbon::parse($startStr)) && $curr->lte(Carbon::parse($endStr))) {
                    $dates[$dStr] = [
                        'name' => $h->name,
                        'type' => $h->type,
                        'type_name' => $h->type_name,
                        'description' => $h->description,
                    ];
                }
                $curr->addDay();
            }
        }

        return $dates;
    }

    /**
     * Seed standard national holidays for a given year.
     */
    public static function seedDefaultHolidays(int $year): int
    {
        $defaults = [
            [
                'name' => 'Tahun Baru Masehi',
                'start_date' => "{$year}-01-01",
                'end_date' => "{$year}-01-01",
                'type' => 'national_holiday',
                'description' => 'Tahun Baru Kalender Masehi',
            ],
            [
                'name' => 'Isra Mi\'raj Nabi Muhammad SAW',
                'start_date' => "{$year}-01-16",
                'end_date' => "{$year}-01-16",
                'type' => 'national_holiday',
                'description' => 'Peringatan Isra Mi\'raj',
            ],
            [
                'name' => 'Tahun Baru Imlek',
                'start_date' => "{$year}-02-17",
                'end_date' => "{$year}-02-17",
                'type' => 'national_holiday',
                'description' => 'Tahun Baru Imlek Kongzili',
            ],
            [
                'name' => 'Hari Suci Nyepi (Tahun Baru Saka)',
                'start_date' => "{$year}-03-19",
                'end_date' => "{$year}-03-19",
                'type' => 'national_holiday',
                'description' => 'Hari Raya Nyepi Saka',
            ],
            [
                'name' => 'Hari Raya Idul Fitri',
                'start_date' => "{$year}-03-21",
                'end_date' => "{$year}-03-22",
                'type' => 'national_holiday',
                'description' => 'Hari Raya Idul Fitri 1447 H',
            ],
            [
                'name' => 'Cuti Bersama Hari Raya Idul Fitri',
                'start_date' => "{$year}-03-23",
                'end_date' => "{$year}-03-25",
                'type' => 'joint_leave',
                'description' => 'Cuti Bersama Idul Fitri',
            ],
            [
                'name' => 'Wafat Yesus Kristus',
                'start_date' => "{$year}-04-03",
                'end_date' => "{$year}-04-03",
                'type' => 'national_holiday',
                'description' => 'Jumat Agung',
            ],
            [
                'name' => 'Hari Buruh Internasional',
                'start_date' => "{$year}-05-01",
                'end_date' => "{$year}-05-01",
                'type' => 'national_holiday',
                'description' => 'May Day',
            ],
            [
                'name' => 'Kenaikan Yesus Kristus',
                'start_date' => "{$year}-05-14",
                'end_date' => "{$year}-05-14",
                'type' => 'national_holiday',
                'description' => 'Kenaikan Isa Almasih',
            ],
            [
                'name' => 'Hari Raya Waisak',
                'start_date' => "{$year}-05-31",
                'end_date' => "{$year}-05-31",
                'type' => 'national_holiday',
                'description' => 'Hari Raya Waisak',
            ],
            [
                'name' => 'Hari Lahir Pancasila',
                'start_date' => "{$year}-06-01",
                'end_date' => "{$year}-06-01",
                'type' => 'national_holiday',
                'description' => 'Hari Lahir Pancasila',
            ],
            [
                'name' => 'Hari Raya Idul Adha',
                'start_date' => "{$year}-05-27",
                'end_date' => "{$year}-05-27",
                'type' => 'national_holiday',
                'description' => 'Hari Raya Qurban Idul Adha',
            ],
            [
                'name' => 'Libur Kenaikan Kelas & Semester Genap',
                'start_date' => "{$year}-06-22",
                'end_date' => "{$year}-07-04",
                'type' => 'school_holiday',
                'description' => 'Libur akhir tahun ajaran sekolah',
            ],
            [
                'name' => 'Tahun Baru Islam (1 Muharram)',
                'start_date' => "{$year}-06-16",
                'end_date' => "{$year}-06-16",
                'type' => 'national_holiday',
                'description' => 'Tahun Baru Hijriah',
            ],
            [
                'name' => 'Hari Kemerdekaan Republik Indonesia',
                'start_date' => "{$year}-08-17",
                'end_date' => "{$year}-08-17",
                'type' => 'national_holiday',
                'description' => 'HUT Kemerdekaan RI',
            ],
            [
                'name' => 'Maulid Nabi Muhammad SAW',
                'start_date' => "{$year}-08-25",
                'end_date' => "{$year}-08-25",
                'type' => 'national_holiday',
                'description' => 'Peringatan Kelahiran Nabi Muhammad SAW',
            ],
            [
                'name' => 'Hari Raya Natal',
                'start_date' => "{$year}-12-25",
                'end_date' => "{$year}-12-25",
                'type' => 'national_holiday',
                'description' => 'Hari Kelahiran Yesus Kristus',
            ],
            [
                'name' => 'Libur Akhir Semester Ganjil',
                'start_date' => "{$year}-12-21",
                'end_date' => "{$year}-12-31",
                'type' => 'school_holiday',
                'description' => 'Libur pembagian raport semester 1',
            ],
        ];

        $count = 0;
        foreach ($defaults as $item) {
            $exists = static::where('name', $item['name'])
                ->where('start_date', $item['start_date'])
                ->exists();

            if (! $exists) {
                static::create($item);
                $count++;
            }
        }

        return $count;
    }
}

