<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    /**
     * Display the batch attendance form.
     */
    public function index(Request $request): Response
    {
        $today = Carbon::today()->toDateString();
        $date = $request->input('date', $today);
        $user = $request->user();

        $classroomsQuery = Classroom::with('homeroomTeacher')->orderBy('name');
        
        // If teacher is homeroom and not admin, prioritize their classroom
        $classrooms = $classroomsQuery->get();

        $selectedClassroomId = $request->input('classroom_id');
        if (! $selectedClassroomId) {
            $userClass = $classrooms->firstWhere('homeroom_teacher_id', $user->id);
            $selectedClassroomId = $userClass ? $userClass->id : $classrooms->first()?->id;
        }

        $students = [];
        $selectedClassroom = null;

        if ($selectedClassroomId) {
            $selectedClassroom = Classroom::with('homeroomTeacher')->find($selectedClassroomId);
            $students = Student::where('classroom_id', $selectedClassroomId)
                ->where('is_active', true)
                ->with(['attendances' => function ($q) use ($date) {
                    $q->where('date', $date)->with('latestAdjustment');
                }])
                ->orderBy('name')
                ->get()
                ->map(function ($student) {
                    $att = $student->attendances->first();
                    return [
                        'id' => $student->id,
                        'name' => $student->name,
                        'nisn' => $student->nisn,
                        'nis' => $student->nis,
                        'gender' => $student->gender,
                        'attendance_id' => $att?->id,
                        'status' => $att ? $att->status : 'present',
                        'is_late' => (bool) ($att?->is_late),
                        'late_minutes' => $att?->late_minutes ?? 0,
                        'check_in_time' => $att?->check_in_time ? substr($att->check_in_time, 0, 5) : '',
                        'notes' => $att?->notes ?? '',
                        'adjustment' => $att?->latestAdjustment ? [
                            'type' => $att->latestAdjustment->type,
                            'type_name' => $att->latestAdjustment->type_name,
                            'departure_time' => substr($att->latestAdjustment->departure_time, 0, 5),
                            'reason' => $att->latestAdjustment->reason,
                        ] : null,
                    ];
                });
        }

        return Inertia::render('attendances/index', [
            'classrooms' => $classrooms,
            'selectedClassroom' => $selectedClassroom,
            'selectedClassroomId' => (int) $selectedClassroomId,
            'selectedDate' => $date,
            'students' => $students,
        ]);
    }

    /**
     * Store or update batch attendance for a classroom on a specific date.
     */
    public function storeBatch(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'classroom_id' => 'required|exists:classrooms,id',
            'date' => 'required|date',
            'attendances' => 'required|array',
            'attendances.*.student_id' => 'required|exists:students,id',
            'attendances.*.status' => 'required|in:present,sick,permit,absent',
            'attendances.*.notes' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($validated, $request) {
            foreach ($validated['attendances'] as $item) {
                $status = $item['status'];
                $checkIn = $status === 'present' ? now()->format('H:i:s') : null;

                Attendance::updateOrCreate(
                    [
                        'student_id' => $item['student_id'],
                        'date' => $validated['date'],
                    ],
                    [
                        'recorded_by' => $request->user()->id,
                        'status' => $status,
                        'check_in_time' => $checkIn,
                        'notes' => $item['notes'] ?? null,
                    ]
                );
            }
        });

        return back()->with('success', 'Presensi massal kelas berhasil disimpan.');
    }

    /**
     * Quick update a single attendance status.
     */
    public function quickUpdate(Request $request, Student $student): RedirectResponse
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'status' => 'required|in:present,sick,permit,absent',
        ]);

        Attendance::updateOrCreate(
            [
                'student_id' => $student->id,
                'date' => $validated['date'],
            ],
            [
                'recorded_by' => $request->user()->id,
                'status' => $validated['status'],
                'check_in_time' => $validated['status'] === 'present' ? now()->format('H:i:s') : null,
            ]
        );

        return back()->with('success', "Status kehadiran {$student->name} diperbarui.");
    }
}

