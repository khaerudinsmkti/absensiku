<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'classroom_id',
        'name',
        'nisn',
        'nis',
        'gender',
        'is_active',
        'is_alumni',
        'graduation_year',
        'next_school',
        'alumni_phone',
        'alumni_notes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_alumni' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Scope query to only include active students.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope query to only include alumni (graduated students).
     */
    public function scopeAlumni(Builder $query): Builder
    {
        return $query->where('is_alumni', true)->orWhere('is_active', false);
    }
}
