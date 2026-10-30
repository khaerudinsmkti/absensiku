<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceAdjustment;
use App\Models\Classroom;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $today = Carbon::today()->toDateString();
        $date = $request->input('date', $today);
        $user = $request->user();

        // If teacher, only load the classroom(s) they teach
        $classroomsQuery = Classroom::with('homeroomTeacher')->orderBy('name');
        if ($user->role === 'teacher') {
            $classroomsQuery->where('homeroom_teacher_id', $user->id);
        }
        $classrooms = $classroomsQuery->get();

        $selectedClassroomId = $request->input('classroom_id');
        if ($user->role === 'teacher') {
            if (! $selectedClassroomId || ! $classrooms->contains('id', (int) $selectedClassroomId)) {
                $selectedClassroomId = $classrooms->first()?->id;
            }
        } elseif (! $selectedClassroomId && $classrooms->isNotEmpty()) {
            $selectedClassroomId = $classrooms->first()->id;
        }

        // Stats across all students or selected class for the selected date
        $attendanceQuery = Attendance::where('date', $date);
        if ($selectedClassroomId) {
            $attendanceQuery->whereHas('student', function ($q) use ($selectedClassroomId) {
                $q->where('classroom_id', $selectedClassroomId);
            });
        }

        $attendances = $attendanceQuery->get();

        $totalStudents = $selectedClassroomId 
            ? Student::where('classroom_id', $selectedClassroomId)->where('is_active', true)->count()
            : Student::where('is_active', true)->count();

        $totalHadir = $attendances->where('status', 'present')->count();
        $totalSakit = $attendances->where('status', 'sick')->count();
        $totalIzin = $attendances->where('status', 'permit')->count();
        $totalAlpha = $attendances->where('status', 'absent')->count();
        $totalTerlambat = $attendances->where('is_late', true)->count();

        $totalAdjustments = AttendanceAdjustment::whereHas('attendance', function ($q) use ($date, $selectedClassroomId) {
            $q->where('date', $date);
            if ($selectedClassroomId) {
                $q->whereHas('student', fn ($sq) => $sq->where('classroom_id', $selectedClassroomId));
            }
        })->count();

        $attendanceRate = $totalStudents > 0 
            ? round(($totalHadir / $totalStudents) * 100, 1) 
            : 0;

        // Fetch students for the selected class with today's attendance & adjustments
        $students = [];
        if ($selectedClassroomId) {
            $students = Student::where('classroom_id', $selectedClassroomId)
                ->where('is_active', true)
                ->with(['attendances' => function ($q) use ($date) {
                    $q->where('date', $date)->with('latestAdjustment');
                }])
                ->orderBy('name')
                ->get()
                ->map(function ($student) {
                    $attendance = $student->attendances->first();
                    return [
                        'id' => $student->id,
                        'name' => $student->name,
                        'nisn' => $student->nisn,
                        'nis' => $student->nis,
                        'gender' => $student->gender,
                        'attendance_id' => $attendance?->id,
                        'status' => $attendance ? ($attendance->is_late ? 'terlambat' : match ($attendance->status) {
                            'present' => 'hadir',
                            'sick' => 'sakit',
                            'permit' => 'izin',
                            'absent' => 'alpha',
                            default => 'hadir'
                        }) : 'hadir',
                        'raw_status' => $attendance?->status ?? 'present',
                        'check_in_time' => $attendance?->check_in_time ? substr($attendance->check_in_time, 0, 5) : ($attendance ? '-' : '07:00'),
                        'is_late' => (bool) ($attendance?->is_late),
                        'late_minutes' => $attendance?->late_minutes ?? 0,
                        'notes' => $attendance?->notes ?? '',
                        'adjustment' => $attendance?->latestAdjustment ? [
                            'type' => $attendance->latestAdjustment->type,
                            'type_name' => $attendance->latestAdjustment->type_name,
                            'departure_time' => substr($attendance->latestAdjustment->departure_time, 0, 5),
                            'reason' => $attendance->latestAdjustment->reason,
                            'pickup_person' => $attendance->latestAdjustment->pickup_person,
                        ] : null,
                    ];
                });
        }

        return Inertia::render('dashboard', [
            'classrooms' => $classrooms,
            'selectedClassroomId' => (int) $selectedClassroomId,
            'selectedDate' => $date,
            'stats' => [
                'total_students' => $totalStudents,
                'total_hadir' => $totalHadir,
                'total_sakit' => $totalSakit,
                'total_izin' => $totalIzin,
                'total_alpha' => $totalAlpha,
                'total_terlambat' => $totalTerlambat,
                'total_adjustments' => $totalAdjustments,
                'attendance_rate' => $attendanceRate,
            ],
            'students' => $students,
        ]);
    }
}

