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

        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];

        $carbonDate = Carbon::parse($date);
        $dailyLabel = $carbonDate->day . ' ' . ($monthNames[$carbonDate->month] ?? '') . ' ' . $carbonDate->year;

        $monthStart = $carbonDate->copy()->startOfMonth()->toDateString();
        $monthEnd = $carbonDate->copy()->endOfMonth()->toDateString();
        $monthlyLabel = ($monthNames[$carbonDate->month] ?? '') . ' ' . $carbonDate->year;

        $yearStart = $carbonDate->copy()->startOfYear()->toDateString();
        $yearEnd = $carbonDate->copy()->endOfYear()->toDateString();
        $yearlyLabel = 'Tahun ' . $carbonDate->year;

        // If teacher, only load the classroom(s) they teach (unless on duty today)
        $classroomsQuery = Classroom::with('homeroomTeacher')->orderBy('name');
        if ($user->role === 'teacher' && ! $user->isDutyTeacherToday()) {
            $classroomsQuery->where('homeroom_teacher_id', $user->id);
        }
        $classrooms = $classroomsQuery->get();

        $selectedClassroomId = $request->input('classroom_id');
        if ($user->role === 'teacher' && ! $user->isDutyTeacherToday()) {
            if (! $selectedClassroomId || ! $classrooms->contains('id', (int) $selectedClassroomId)) {
                $selectedClassroomId = $classrooms->first()?->id;
            }
        } elseif (! $selectedClassroomId && $classrooms->isNotEmpty()) {
            $selectedClassroomId = $classrooms->first()->id;
        }

        $totalStudents = $selectedClassroomId 
            ? Student::where('classroom_id', $selectedClassroomId)->where('is_active', true)->count()
            : Student::where('is_active', true)->count();

        // 1. Daily Stats
        $attendanceQuery = Attendance::where('date', $date);
        if ($selectedClassroomId) {
            $attendanceQuery->whereHas('student', function ($q) use ($selectedClassroomId) {
                $q->where('classroom_id', $selectedClassroomId);
            });
        }
        $attendances = $attendanceQuery->get();

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

        $dailyStats = [
            'period' => 'daily',
            'label' => 'Harian',
            'sublabel' => $dailyLabel,
            'total_students' => $totalStudents,
            'total_hadir' => $totalHadir,
            'total_sakit' => $totalSakit,
            'total_izin' => $totalIzin,
            'total_alpha' => $totalAlpha,
            'total_terlambat' => $totalTerlambat,
            'total_adjustments' => $totalAdjustments,
            'attendance_rate' => $attendanceRate,
            'total_records' => $attendances->count(),
        ];

        // 2. Monthly Stats
        $monthlyQuery = Attendance::whereBetween('date', [$monthStart, $monthEnd]);
        if ($selectedClassroomId) {
            $monthlyQuery->whereHas('student', fn ($q) => $q->where('classroom_id', $selectedClassroomId));
        }
        $monthlyRow = $monthlyQuery->selectRaw("
            COUNT(*) as total_records,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as total_hadir,
            SUM(CASE WHEN status = 'sick' THEN 1 ELSE 0 END) as total_sakit,
            SUM(CASE WHEN status = 'permit' THEN 1 ELSE 0 END) as total_izin,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as total_alpha,
            SUM(CASE WHEN is_late = 1 THEN 1 ELSE 0 END) as total_terlambat
        ")->first();

        $mHadir = (int) ($monthlyRow->total_hadir ?? 0);
        $mSakit = (int) ($monthlyRow->total_sakit ?? 0);
        $mIzin = (int) ($monthlyRow->total_izin ?? 0);
        $mAlpha = (int) ($monthlyRow->total_alpha ?? 0);
        $mTerlambat = (int) ($monthlyRow->total_terlambat ?? 0);
        $mRecords = (int) ($monthlyRow->total_records ?? 0);
        $mRate = $mRecords > 0 ? round(($mHadir / $mRecords) * 100, 1) : 0;

        $monthlyAdjustments = AttendanceAdjustment::whereHas('attendance', function ($q) use ($monthStart, $monthEnd, $selectedClassroomId) {
            $q->whereBetween('date', [$monthStart, $monthEnd]);
            if ($selectedClassroomId) {
                $q->whereHas('student', fn ($sq) => $sq->where('classroom_id', $selectedClassroomId));
            }
        })->count();

        $monthlyStats = [
            'period' => 'monthly',
            'label' => 'Bulanan',
            'sublabel' => $monthlyLabel,
            'total_students' => $totalStudents,
            'total_hadir' => $mHadir,
            'total_sakit' => $mSakit,
            'total_izin' => $mIzin,
            'total_alpha' => $mAlpha,
            'total_terlambat' => $mTerlambat,
            'total_adjustments' => $monthlyAdjustments,
            'attendance_rate' => $mRate,
            'total_records' => $mRecords,
        ];

        // 3. Yearly Stats
        $yearlyQuery = Attendance::whereBetween('date', [$yearStart, $yearEnd]);
        if ($selectedClassroomId) {
            $yearlyQuery->whereHas('student', fn ($q) => $q->where('classroom_id', $selectedClassroomId));
        }
        $yearlyRow = $yearlyQuery->selectRaw("
            COUNT(*) as total_records,
            SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as total_hadir,
            SUM(CASE WHEN status = 'sick' THEN 1 ELSE 0 END) as total_sakit,
            SUM(CASE WHEN status = 'permit' THEN 1 ELSE 0 END) as total_izin,
            SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as total_alpha,
            SUM(CASE WHEN is_late = 1 THEN 1 ELSE 0 END) as total_terlambat
        ")->first();

        $yHadir = (int) ($yearlyRow->total_hadir ?? 0);
        $ySakit = (int) ($yearlyRow->total_sakit ?? 0);
        $yIzin = (int) ($yearlyRow->total_izin ?? 0);
        $yAlpha = (int) ($yearlyRow->total_alpha ?? 0);
        $yTerlambat = (int) ($yearlyRow->total_terlambat ?? 0);
        $yRecords = (int) ($yearlyRow->total_records ?? 0);
        $yRate = $yRecords > 0 ? round(($yHadir / $yRecords) * 100, 1) : 0;

        $yearlyAdjustments = AttendanceAdjustment::whereHas('attendance', function ($q) use ($yearStart, $yearEnd, $selectedClassroomId) {
            $q->whereBetween('date', [$yearStart, $yearEnd]);
            if ($selectedClassroomId) {
                $q->whereHas('student', fn ($sq) => $sq->where('classroom_id', $selectedClassroomId));
            }
        })->count();

        $yearlyStats = [
            'period' => 'yearly',
            'label' => 'Tahunan',
            'sublabel' => $yearlyLabel,
            'total_students' => $totalStudents,
            'total_hadir' => $yHadir,
            'total_sakit' => $ySakit,
            'total_izin' => $yIzin,
            'total_alpha' => $yAlpha,
            'total_terlambat' => $yTerlambat,
            'total_adjustments' => $yearlyAdjustments,
            'attendance_rate' => $yRate,
            'total_records' => $yRecords,
        ];

        // 4. Top Students (Paling banyak Telat, Sakit, Izin, Alpa)
        $getTopStudents = function (string $type, string $start, string $end) use ($selectedClassroomId) {
            $query = Attendance::whereBetween('date', [$start, $end]);

            if ($type === 'terlambat') {
                $query->where('is_late', true);
            } else {
                $status = match ($type) {
                    'sakit' => 'sick',
                    'izin' => 'permit',
                    'alpha' => 'absent',
                    default => 'absent',
                };
                $query->where('status', $status);
            }

            $query->whereHas('student', function ($q) use ($selectedClassroomId) {
                $q->where('is_active', true);
                if ($selectedClassroomId) {
                    $q->where('classroom_id', $selectedClassroomId);
                }
            });

            $selectRaw = $type === 'terlambat' 
                ? 'student_id, COUNT(*) as total_count, SUM(late_minutes) as total_minutes'
                : 'student_id, COUNT(*) as total_count';

            return $query->selectRaw($selectRaw)
                ->groupBy('student_id')
                ->orderByDesc('total_count')
                ->limit(5)
                ->with(['student.classroom'])
                ->get()
                ->filter(fn ($item) => $item->student !== null)
                ->map(fn ($item) => [
                    'id' => $item->student->id,
                    'name' => $item->student->name,
                    'nisn' => $item->student->nisn,
                    'nis' => $item->student->nis,
                    'classroom_name' => $item->student->classroom?->name ?? '-',
                    'gender' => $item->student->gender,
                    'count' => (int) $item->total_count,
                    'minutes' => (int) ($item->total_minutes ?? 0),
                ])
                ->values()
                ->all();
        };

        $topStudents = [
            'monthly' => [
                'terlambat' => $getTopStudents('terlambat', $monthStart, $monthEnd),
                'sakit' => $getTopStudents('sakit', $monthStart, $monthEnd),
                'izin' => $getTopStudents('izin', $monthStart, $monthEnd),
                'alpha' => $getTopStudents('alpha', $monthStart, $monthEnd),
            ],
            'yearly' => [
                'terlambat' => $getTopStudents('terlambat', $yearStart, $yearEnd),
                'sakit' => $getTopStudents('sakit', $yearStart, $yearEnd),
                'izin' => $getTopStudents('izin', $yearStart, $yearEnd),
                'alpha' => $getTopStudents('alpha', $yearStart, $yearEnd),
            ],
        ];

        // Student list is no longer rendered on the dashboard (moved exclusively to Attendances page)
        $students = [];

        $isFutureDate = $date > $today;
        $holiday = \App\Models\AcademicHoliday::getOffDay($date);

        return Inertia::render('dashboard', [
            'classrooms' => $classrooms,
            'selectedClassroomId' => (int) $selectedClassroomId,
            'selectedDate' => $date,
            'isFutureDate' => $isFutureDate,
            'holiday' => $holiday ? [
                'name' => $holiday->name,
                'type' => $holiday->type,
                'type_name' => $holiday->type_name,
                'description' => $holiday->description,
            ] : null,
            'stats' => $dailyStats,
            'recap' => [
                'daily' => $dailyStats,
                'monthly' => $monthlyStats,
                'yearly' => $yearlyStats,
            ],
            'top_students' => $topStudents,
            'students' => $students,
        ]);
    }
}

