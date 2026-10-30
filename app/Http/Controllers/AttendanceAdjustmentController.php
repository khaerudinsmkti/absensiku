<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceAdjustment;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceAdjustmentController extends Controller
{
    public function index(Request $request): Response
    {
        $today = Carbon::today()->toDateString();
        $date = $request->input('date', $today);

        // Fetch adjustments for the date
        $adjustments = AttendanceAdjustment::whereHas('attendance', function ($q) use ($date) {
            $q->where('date', $date);
        })
        ->with(['attendance.student.classroom', 'approvedBy'])
        ->latest()
        ->get()
        ->map(function ($adj) {
            return [
                'id' => $adj->id,
                'attendance_id' => $adj->attendance_id,
                'student_name' => $adj->attendance->student->name,
                'nisn' => $adj->attendance->student->nisn,
                'classroom' => $adj->attendance->student->classroom->name,
                'type' => $adj->type,
                'type_name' => $adj->type_name,
                'departure_time' => substr($adj->departure_time, 0, 5),
                'reason' => $adj->reason,
                'pickup_person' => $adj->pickup_person,
                'attachment_url' => $adj->attachment_path ? asset('storage/' . $adj->attachment_path) : null,
                'approved_by' => $adj->approvedBy->name,
                'created_at' => $adj->created_at->format('H:i'),
            ];
        });

        // Students who are present today and can request mid-day leave
        $eligibleStudents = Attendance::where('date', $date)
            ->where('status', 'present')
            ->with('student.classroom')
            ->get()
            ->map(function ($att) {
                return [
                    'attendance_id' => $att->id,
                    'student_id' => $att->student_id,
                    'name' => $att->student->name,
                    'nisn' => $att->student->nisn,
                    'classroom' => $att->student->classroom->name,
                ];
            });

        return Inertia::render('attendances/adjustments', [
            'selectedDate' => $date,
            'adjustments' => $adjustments,
            'eligibleStudents' => $eligibleStudents,
            'defaultDepartureTime' => now()->format('H:i'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'attendance_id' => 'required|exists:attendances,id',
            'type' => 'required|in:early_leave_sick,early_leave_urgent,other',
            'departure_time' => 'required',
            'reason' => 'required|string|max:500',
            'pickup_person' => 'nullable|string|max:150',
            'proof' => 'nullable|file|mimes:jpeg,png,jpg,pdf|max:2048',
        ]);

        $attendance = Attendance::findOrFail($validated['attendance_id']);

        DB::transaction(function () use ($validated, $request, $attendance) {
            $path = null;
            if ($request->hasFile('proof')) {
                $path = $request->file('proof')->store('adjustments', 'public');
            }

            AttendanceAdjustment::create([
                'attendance_id' => $attendance->id,
                'approved_by' => $request->user()->id,
                'type' => $validated['type'],
                'departure_time' => substr($validated['departure_time'], 0, 5) . ':00',
                'reason' => $validated['reason'],
                'pickup_person' => $validated['pickup_person'] ?? null,
                'attachment_path' => $path,
            ]);

            $typeLabel = match ($validated['type']) {
                'early_leave_sick' => 'Sakit di Sekolah',
                'early_leave_urgent' => 'Izin Pulang Cepat',
                default => 'Absen Khusus',
            };

            $additionalNote = " | Pulang Awal ({$typeLabel}) pkl {$validated['departure_time']}: {$validated['reason']}";
            $attendance->update([
                'notes' => trim(($attendance->notes ?? '') . $additionalNote),
            ]);
        });

        return back()->with('success', 'Izin khusus pulang awal berhasil dicatat dan diverifikasi.');
    }
}

