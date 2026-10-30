<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LatenessController extends Controller
{
    /**
     * Cutoff time for school arrival (07:00 AM)
     */
    const CUTOFF_TIME = '07:00:00';

    public function index(Request $request): Response
    {
        $today = Carbon::today()->toDateString();
        $date = $request->input('date', $today);
        $user = $request->user();

        // Fetch late students for the date
        $lateRecordsQuery = Attendance::where('date', $date)
            ->where('is_late', true)
            ->with(['student.classroom', 'recordedBy'])
            ->orderByDesc('late_minutes');

        if ($user->role === 'teacher') {
            $lateRecordsQuery->whereHas('student.classroom', function ($q) use ($user) {
                $q->where('homeroom_teacher_id', $user->id);
            });
        }

        $lateRecords = $lateRecordsQuery->get()
            ->map(function ($att) {
                return [
                    'id' => $att->id,
                    'student_id' => $att->student_id,
                    'name' => $att->student->name,
                    'nisn' => $att->student->nisn,
                    'classroom' => $att->student->classroom->name,
                    'check_in_time' => substr($att->check_in_time, 0, 5),
                    'late_minutes' => $att->late_minutes,
                    'notes' => $att->notes,
                    'recorded_by' => $att->recordedBy->name,
                ];
            });

        // Active students for quick selection
        $studentsQuery = Student::where('is_active', true)
            ->with('classroom')
            ->orderBy('name');

        if ($user->role === 'teacher') {
            $studentsQuery->whereHas('classroom', function ($q) use ($user) {
                $q->where('homeroom_teacher_id', $user->id);
            });
        }

        $students = $studentsQuery->get()
            ->map(function ($s) {
                return [
                    'id' => $s->id,
                    'name' => $s->name,
                    'nisn' => $s->nisn,
                    'classroom' => $s->classroom->name,
                ];
            });

        return Inertia::render('attendances/lateness', [
            'selectedDate' => $date,
            'lateRecords' => $lateRecords,
            'students' => $students,
            'defaultCheckInTime' => now()->format('H:i'),
            'cutoffTime' => '07:00',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'date' => 'required|date',
            'check_in_time' => 'required',
            'reason' => 'required|string|max:255',
            'sanction' => 'nullable|string|max:255',
        ]);

        if ($request->user()->role === 'teacher') {
            $isAuthorizedStudent = Student::where('id', $validated['student_id'])
                ->whereHas('classroom', function ($q) use ($request) {
                    $q->where('homeroom_teacher_id', $request->user()->id);
                })
                ->exists();

            if (! $isAuthorizedStudent) {
                return back()->withErrors([
                    'student_id' => 'Anda hanya dapat mencatat keterlambatan untuk siswa di kelas yang Anda ampu.',
                ]);
            }
        }

        $checkInCarbon = Carbon::createFromFormat('H:i', substr($validated['check_in_time'], 0, 5));
        $cutoffCarbon = Carbon::createFromFormat('H:i', '07:00');

        $lateMinutes = 0;
        if ($checkInCarbon->greaterThan($cutoffCarbon)) {
            $lateMinutes = (int) abs($checkInCarbon->diffInMinutes($cutoffCarbon));
        }

        $note = 'Alasan: ' . $validated['reason'];
        if (! empty($validated['sanction'])) {
            $note .= ' | Sanksi/Tindakan: ' . $validated['sanction'];
        }

        Attendance::updateOrCreate(
            [
                'student_id' => $validated['student_id'],
                'date' => $validated['date'],
            ],
            [
                'recorded_by' => $request->user()->id,
                'status' => 'present',
                'check_in_time' => $checkInCarbon->format('H:i:s'),
                'is_late' => true,
                'late_minutes' => $lateMinutes,
                'notes' => $note,
            ]
        );

        return back()->with('success', "Keterlambatan siswa berhasil dicatat ({$lateMinutes} menit terlambat).");
    }
}

