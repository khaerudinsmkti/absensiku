<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'city',
        'postal_code',
        'phone',
        'email',
        'principal_name',
        'principal_nip',
        'start_time',
        'school_days_per_week',
        'logo_path',
    ];

    protected function casts(): array
    {
        return [
            'school_days_per_week' => 'integer',
        ];
    }

    protected $appends = [
        'logo_url',
        'is_saturday_holiday',
    ];

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo_path ? asset('storage/' . $this->logo_path) : null;
    }

    public function getIsSaturdayHolidayAttribute(): bool
    {
        return $this->isSaturdayHoliday();
    }

    /**
     * Check if Saturday is treated as a weekend holiday (5-day school week).
     */
    public function isSaturdayHoliday(): bool
    {
        return (int) ($this->school_days_per_week ?? 6) === 5;
    }

    /**
     * Get or create the singleton instance of school settings.
     */
    public static function getSetting(): self
    {
        return static::firstOrCreate([], [
            'name' => 'SD Digital Indonesia',
            'address' => 'Jl. Pendidikan Merdeka No. 45',
            'city' => 'Jakarta Selatan',
            'postal_code' => '12150',
            'phone' => '(021) 7890123',
            'email' => 'info@sddigital.sch.id',
            'principal_name' => 'Drs. H. Mulyadi, M.Pd.',
            'principal_nip' => '197205121998031004',
            'start_time' => '07:00',
            'school_days_per_week' => 6,
            'logo_path' => null,
        ]);
    }
}
