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

        $isOverallAuthorized = $user->isAdmin() || $user->isPrincipal() || $user->isDutyTeacherToday($date);

        // Classrooms available for this user
        $classroomsQuery = Classroom::with('homeroomTeacher')->orderBy('name');
        if (! $isOverallAuthorized) {
            // Regular teacher: only classes they teach
            $classroomsQuery->where('homeroom_teacher_id', $user->id);
        }
        $classrooms = $classroomsQuery->get();

        $selectedClassroomId = $request->input('classroom_id');

        if (! $isOverallAuthorized) {
            // For regular teacher, MUST be their classroom
            if (! $selectedClassroomId || ! $classrooms->contains('id', (int) $selectedClassroomId)) {
                $selectedClassroomId = $classrooms->first()?->id;
            }
        } else {
            // For admin, principal, duty teacher:
            // Default is null (Keseluruhan Kelas / seluruh sekolah)
            // If they explicitly pass a classroom_id that exists, use it
            if ($selectedClassroomId && ! $classrooms->contains('id', (int) $selectedClassroomId)) {
                $selectedClassroomId = null;
            }
        }

        $hasNoAssignedClass = ! $isOverallAuthorized && $classrooms->isEmpty();

        $user->loadMissing('homeroomClassrooms');
        $userRoleLabel = 'Guru Pengajar';

        if ($user->isAdmin()) {
            $userRoleLabel = 'Administrator';
        } elseif ($user->isPrincipal()) {
            $userRoleLabel = 'Kepala Sekolah';
        } elseif ($user->isStudent()) {
            $userRoleLabel = 'Siswa';
        } else {
            $homeroomNames = $user->homeroomClassrooms->pluck('name')->join(', ');
            $isDuty = $user->isDutyTeacherToday($date);

            if ($homeroomNames && $isDuty) {
                $userRoleLabel = 'Wali Kelas ' . $homeroomNames . ' • Guru Piket';
            } elseif ($homeroomNames) {
                $userRoleLabel = 'Wali Kelas ' . $homeroomNames;
            } elseif ($isDuty) {
                $userRoleLabel = 'Guru Piket';
            } else {
                $userRoleLabel = 'Guru Pengajar';
            }
        }

        $totalStudents = 0;
        if (! $hasNoAssignedClass) {
            $studentsCountQuery = Student::where('is_active', true)->where('is_alumni', false);
            if ($selectedClassroomId) {
                $studentsCountQuery->where('classroom_id', $selectedClassroomId);
            }
            $totalStudents = $studentsCountQuery->count();
        }

        // 1. Daily Stats
        if ($hasNoAssignedClass) {
            $attendances = collect();
        } else {
            $attendanceQuery = Attendance::where('date', $date);
            $attendanceQuery->whereHas('student', function ($q) use ($selectedClassroomId) {
                $q->where('is_active', true)->where('is_alumni', false);
                if ($selectedClassroomId) {
                    $q->where('classroom_id', $selectedClassroomId);
                }
            });
            $attendances = $attendanceQuery->get();
        }

        $totalHadir = $attendances->where('status', 'present')->count();
        $totalSakit = $attendances->where('status', 'sick')->count();
        $totalIzin = $attendances->where('status', 'permit')->count();
        $totalAlpha = $attendances->where('status', 'absent')->count();
        $totalTerlambat = $attendances->where('is_late', true)->count();

        $totalAdjustments = 0;
        if (! $hasNoAssignedClass) {
            $totalAdjustments = AttendanceAdjustment::whereHas('attendance', function ($q) use ($date, $selectedClassroomId) {
                $q->where('date', $date);
                $q->whereHas('student', function ($sq) use ($selectedClassroomId) {
                    $sq->where('is_active', true)->where('is_alumni', false);
                    if ($selectedClassroomId) {
                        $sq->where('classroom_id', $selectedClassroomId);
                    }
                });
            })->count();
        }

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
        $monthlyRow = null;
        $monthlyAdjustments = 0;
        if (! $hasNoAssignedClass) {
            $monthlyQuery = Attendance::whereBetween('date', [$monthStart, $monthEnd]);
            $monthlyQuery->whereHas('student', function ($q) use ($selectedClassroomId) {
                $q->where('is_active', true)->where('is_alumni', false);
                if ($selectedClassroomId) {
                    $q->where('classroom_id', $selectedClassroomId);
                }
            });
            $monthlyRow = $monthlyQuery->selectRaw("
                COUNT(*) as total_records,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as total_hadir,
                SUM(CASE WHEN status = 'sick' THEN 1 ELSE 0 END) as total_sakit,
                SUM(CASE WHEN status = 'permit' THEN 1 ELSE 0 END) as total_izin,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as total_alpha,
                SUM(CASE WHEN is_late = 1 THEN 1 ELSE 0 END) as total_terlambat
            ")->first();

            $monthlyAdjustments = AttendanceAdjustment::whereHas('attendance', function ($q) use ($monthStart, $monthEnd, $selectedClassroomId) {
                $q->whereBetween('date', [$monthStart, $monthEnd]);
                $q->whereHas('student', function ($sq) use ($selectedClassroomId) {
                    $sq->where('is_active', true)->where('is_alumni', false);
                    if ($selectedClassroomId) {
                        $sq->where('classroom_id', $selectedClassroomId);
                    }
                });
            })->count();
        }

        $mHadir = (int) ($monthlyRow->total_hadir ?? 0);
        $mSakit = (int) ($monthlyRow->total_sakit ?? 0);
        $mIzin = (int) ($monthlyRow->total_izin ?? 0);
        $mAlpha = (int) ($monthlyRow->total_alpha ?? 0);
        $mTerlambat = (int) ($monthlyRow->total_terlambat ?? 0);
        $mRecords = (int) ($monthlyRow->total_records ?? 0);
        $mRate = $mRecords > 0 ? round(($mHadir / $mRecords) * 100, 1) : 0;

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
        $yearlyRow = null;
        $yearlyAdjustments = 0;
        if (! $hasNoAssignedClass) {
            $yearlyQuery = Attendance::whereBetween('date', [$yearStart, $yearEnd]);
            $yearlyQuery->whereHas('student', function ($q) use ($selectedClassroomId) {
                $q->where('is_active', true)->where('is_alumni', false);
                if ($selectedClassroomId) {
                    $q->where('classroom_id', $selectedClassroomId);
                }
            });
            $yearlyRow = $yearlyQuery->selectRaw("
                COUNT(*) as total_records,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as total_hadir,
                SUM(CASE WHEN status = 'sick' THEN 1 ELSE 0 END) as total_sakit,
                SUM(CASE WHEN status = 'permit' THEN 1 ELSE 0 END) as total_izin,
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as total_alpha,
                SUM(CASE WHEN is_late = 1 THEN 1 ELSE 0 END) as total_terlambat
            ")->first();

            $yearlyAdjustments = AttendanceAdjustment::whereHas('attendance', function ($q) use ($yearStart, $yearEnd, $selectedClassroomId) {
                $q->whereBetween('date', [$yearStart, $yearEnd]);
                $q->whereHas('student', function ($sq) use ($selectedClassroomId) {
                    $sq->where('is_active', true)->where('is_alumni', false);
                    if ($selectedClassroomId) {
                        $sq->where('classroom_id', $selectedClassroomId);
                    }
                });
            })->count();
        }

        $yHadir = (int) ($yearlyRow->total_hadir ?? 0);
        $ySakit = (int) ($yearlyRow->total_sakit ?? 0);
        $yIzin = (int) ($yearlyRow->total_izin ?? 0);
        $yAlpha = (int) ($yearlyRow->total_alpha ?? 0);
        $yTerlambat = (int) ($yearlyRow->total_terlambat ?? 0);
        $yRecords = (int) ($yearlyRow->total_records ?? 0);
        $yRate = $yRecords > 0 ? round(($yHadir / $yRecords) * 100, 1) : 0;

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
        $getTopStudents = function (string $type, string $start, string $end) use ($selectedClassroomId, $hasNoAssignedClass) {
            if ($hasNoAssignedClass) {
                return [];
            }

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
                $q->where('is_active', true)->where('is_alumni', false);
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

        // Check if user has authority to monitor unmarked classes (Admin, Principal/Kepsek, or Duty Teacher today)
        $canViewUnmarkedClasses = $user->isAdmin() || $user->isPrincipal() || $user->isDutyTeacherToday($date);
        $unmarkedClassrooms = [];
        $totalClassroomsCount = 0;

        if ($canViewUnmarkedClasses) {
            $allClassrooms = Classroom::with('homeroomTeacher')
                ->withCount(['students' => function ($q) {
                    $q->where('is_active', true)->where('is_alumni', false);
                }])
                ->orderBy('name')
                ->get();

            $totalClassroomsCount = $allClassrooms->where('students_count', '>', 0)->count();

            // Count attended students per classroom on date $date
            $attendanceCounts = Attendance::where('date', $date)
                ->whereHas('student', fn ($q) => $q->where('is_active', true)->where('is_alumni', false))
                ->join('students', 'attendances.student_id', '=', 'students.id')
                ->selectRaw('students.classroom_id, COUNT(DISTINCT attendances.student_id) as attended_count')
                ->groupBy('students.classroom_id')
                ->pluck('attended_count', 'classroom_id');

            foreach ($allClassrooms as $cls) {
                $totalActive = (int) $cls->students_count;
                if ($totalActive === 0) {
                    continue;
                }
                $attended = (int) ($attendanceCounts[$cls->id] ?? 0);

                if ($attended < $totalActive) {
                    $unmarkedClassrooms[] = [
                        'id' => $cls->id,
                        'name' => $cls->name,
                        'academic_year' => $cls->academic_year,
                        'homeroom_teacher' => $cls->homeroomTeacher ? [
                            'id' => $cls->homeroomTeacher->id,
                            'name' => $cls->homeroomTeacher->name,
                            'nip' => $cls->homeroomTeacher->nip,
                        ] : null,
                        'total_students' => $totalActive,
                        'attended_students' => $attended,
                        'status' => $attended === 0 ? 'unmarked' : 'partial',
                    ];
                }
            }
        }

        return Inertia::render('dashboard', [
            'userRoleLabel' => $userRoleLabel,
            'classrooms' => $classrooms,
            'selectedClassroomId' => $selectedClassroomId ? (int) $selectedClassroomId : null,
            'isOverallAuthorized' => $isOverallAuthorized,
            'hasNoAssignedClass' => $hasNoAssignedClass,
            'selectedDate' => $date,
            'isFutureDate' => $isFutureDate,
            'canViewUnmarkedClasses' => $canViewUnmarkedClasses,
            'unmarkedClassrooms' => $unmarkedClassrooms,
            'totalClassroomsCount' => $totalClassroomsCount,
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

