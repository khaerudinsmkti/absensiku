<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $classroomsQuery = Classroom::orderBy('name');
        if ($user->role === 'teacher') {
            $classroomsQuery->where('homeroom_teacher_id', $user->id);
        }
        $classrooms = $classroomsQuery->get();

        $selectedClassroomId = $request->input('classroom_id');
        if ($user->role === 'teacher') {
            if (! $selectedClassroomId || ! $classrooms->contains('id', (int) $selectedClassroomId)) {
                $selectedClassroomId = $classrooms->first()?->id;
            }
        } elseif (! $selectedClassroomId) {
            $selectedClassroomId = $classrooms->first()?->id;
        }
        
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::today()->toDateString());

        $students = [];
        $totalSchoolDays = Carbon::parse($startDate)->diffInDaysFiltered(function (Carbon $date) {
            return ! $date->isSunday();
        }, Carbon::parse($endDate)->addDay());

        if ($selectedClassroomId) {
            $studentsData = Student::where('classroom_id', $selectedClassroomId)
                ->where('is_active', true)
                ->with(['attendances' => function ($q) use ($startDate, $endDate) {
                    $q->whereBetween('date', [$startDate, $endDate])->with('adjustments');
                }])
                ->orderBy('name')
                ->get();

            $students = $studentsData->map(function ($student) use ($totalSchoolDays) {
                $atts = $student->attendances;
                $hadir = $atts->where('status', 'present')->count();
                $sakit = $atts->where('status', 'sick')->count();
                $izin = $atts->where('status', 'permit')->count();
                $alpha = $atts->where('status', 'absent')->count();
                $terlambat = $atts->where('is_late', true)->count();
                $pulangAwal = $atts->filter(fn ($a) => $a->adjustments->isNotEmpty())->count();

                $totalRecorded = $hadir + $sakit + $izin + $alpha;
                $percentage = $totalRecorded > 0 ? round(($hadir / $totalRecorded) * 100, 1) : 0;

                return [
                    'id' => $student->id,
                    'nisn' => $student->nisn,
                    'nis' => $student->nis,
                    'name' => $student->name,
                    'gender' => $student->gender,
                    'hadir' => $hadir,
                    'sakit' => $sakit,
                    'izin' => $izin,
                    'alpha' => $alpha,
                    'terlambat' => $terlambat,
                    'pulang_awal' => $pulangAwal,
                    'percentage' => $percentage,
                ];
            });
        }

        return Inertia::render('reports/index', [
            'classrooms' => $classrooms,
            'selectedClassroomId' => (int) $selectedClassroomId,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'students' => $students,
            'summary' => [
                'total_students' => count($students),
                'total_hadir' => collect($students)->sum('hadir'),
                'total_sakit' => collect($students)->sum('sakit'),
                'total_izin' => collect($students)->sum('izin'),
                'total_alpha' => collect($students)->sum('alpha'),
                'total_terlambat' => collect($students)->sum('terlambat'),
            ],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $user = $request->user();
        $selectedClassroomId = $request->input('classroom_id');

        if ($user->role === 'teacher') {
            $taughtClassrooms = Classroom::where('homeroom_teacher_id', $user->id)->pluck('id');
            if ($selectedClassroomId && ! $taughtClassrooms->contains((int) $selectedClassroomId)) {
                abort(403, 'Akses ekspor dibatasi hanya untuk kelas yang Anda ajar.');
            }
            if (! $selectedClassroomId) {
                $selectedClassroomId = $taughtClassrooms->first();
            }
        }

        $classroom = $selectedClassroomId ? Classroom::find($selectedClassroomId) : null;
        $className = $classroom ? str_replace(' ', '_', $classroom->name) : 'Semua_Kelas';

        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::today()->toDateString());

        $studentsData = Student::when($selectedClassroomId, fn ($q) => $q->where('classroom_id', $selectedClassroomId))
            ->where('is_active', true)
            ->with(['attendances' => function ($q) use ($startDate, $endDate) {
                $q->whereBetween('date', [$startDate, $endDate]);
            }, 'classroom'])
            ->orderBy('name')
            ->get();

        $fileName = "Rekap_Presensi_{$className}_{$startDate}_sd_{$endDate}.csv";

        return response()->streamDownload(function () use ($studentsData) {
            $handle = fopen('php://output', 'w');
            
            // UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // CSV Header
            fputcsv($handle, [
                'No',
                'NISN',
                'NIS',
                'Nama Peserta Didik',
                'Kelas',
                'L/P',
                'Hadir',
                'Sakit',
                'Izin',
                'Alpha',
                'Terlambat',
                'Persentase Kehadiran (%)',
            ]);

            $no = 1;
            foreach ($studentsData as $student) {
                $atts = $student->attendances;
                $hadir = $atts->where('status', 'present')->count();
                $sakit = $atts->where('status', 'sick')->count();
                $izin = $atts->where('status', 'permit')->count();
                $alpha = $atts->where('status', 'absent')->count();
                $terlambat = $atts->where('is_late', true)->count();

                $total = $hadir + $sakit + $izin + $alpha;
                $pct = $total > 0 ? round(($hadir / $total) * 100, 1) : 0;

                fputcsv($handle, [
                    $no++,
                    $student->nisn,
                    $student->nis,
                    $student->name,
                    $student->classroom->name,
                    $student->gender,
                    $hadir,
                    $sakit,
                    $izin,
                    $alpha,
                    $terlambat,
                    $pct . '%',
                ]);
            }

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}

