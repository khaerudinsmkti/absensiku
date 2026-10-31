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
        'logo_path',
    ];

    protected $appends = [
        'logo_url',
    ];

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo_path ? asset('storage/' . $this->logo_path) : null;
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
            'logo_path' => null,
        ]);
    }
}

