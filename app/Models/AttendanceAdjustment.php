<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'attendance_id',
        'approved_by',
        'type',
        'departure_time',
        'reason',
        'pickup_person',
        'attachment_path',
    ];

    public function attendance(): BelongsTo
    {
        return $this->belongsTo(Attendance::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function getTypeNameAttribute(): string
    {
        return match ($this->type) {
            'early_leave_sick' => 'Sakit di Sekolah',
            'early_leave_urgent' => 'Keperluan Mendesak',
            'other' => 'Lainnya',
            default => $this->type,
        };
    }
}

