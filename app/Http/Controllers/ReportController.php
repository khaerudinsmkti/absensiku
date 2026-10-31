<?php

namespace App\Http\Controllers;

use App\Models\AcademicHoliday;
use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\SchoolSetting;
use App\Models\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    protected array $monthNames = [
        1 => 'Januari',
        2 => 'Februari',
        3 => 'Maret',
        4 => 'April',
        5 => 'Mei',
        6 => 'Juni',
        7 => 'Juli',
        8 => 'Agustus',
        9 => 'September',
        10 => 'Oktober',
        11 => 'November',
        12 => 'Desember',
    ];

    /**
     * Helper to resolve filters, classrooms, matrix days and student attendances.
     */
    protected function resolveReportData(Request $request): array
    {
        $user = $request->user();
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
        } elseif (! $selectedClassroomId) {
            $selectedClassroomId = $classrooms->first()?->id;
        }

        $classroom = $selectedClassroomId ? Classroom::with('homeroomTeacher')->find($selectedClassroomId) : null;

        $filterType = $request->input('filter_type', 'monthly');
        $month = (int) $request->input('month', Carbon::today()->month);
        $year = (int) $request->input('year', Carbon::today()->year);

        if ($filterType === 'monthly') {
            $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth()->toDateString();
            $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth()->toDateString();
            $periodLabel = 'Bulan ' . ($this->monthNames[$month] ?? '') . ' ' . $year;
        } elseif ($filterType === 'yearly') {
            $startDate = Carbon::createFromDate($year, 1, 1)->startOfYear()->toDateString();
            $endDate = Carbon::createFromDate($year, 12, 31)->endOfYear()->toDateString();
            $periodLabel = 'Tahun ' . $year;
        } else {
            $filterType = 'custom';
            $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
            $endDate = $request->input('end_date', Carbon::today()->toDateString());
            $periodLabel = Carbon::parse($startDate)->format('d/m/Y') . ' s.d. ' . Carbon::parse($endDate)->format('d/m/Y');
        }

        $carbonStart = Carbon::parse($startDate);
        $carbonEnd = Carbon::parse($endDate);
        $daysCount = $carbonStart->diffInDays($carbonEnd) + 1;

        // Fetch official holidays in this date range
        $holidayDates = AcademicHoliday::getHolidayDatesBetween($startDate, $endDate);

        $indoDays = [
            0 => ['name' => 'Minggu', 'initial' => 'M'],
            1 => ['name' => 'Senin', 'initial' => 'S'],
            2 => ['name' => 'Selasa', 'initial' => 'S'],
            3 => ['name' => 'Rabu', 'initial' => 'R'],
            4 => ['name' => 'Kamis', 'initial' => 'K'],
            5 => ['name' => 'Jumat', 'initial' => 'J'],
            6 => ['name' => 'Sabtu', 'initial' => 'S'],
        ];

        $days = [];
        if ($filterType === 'monthly' || $daysCount <= 31) {
            $temp = $carbonStart->copy();
            while ($temp->lte($carbonEnd)) {
                $dateStr = $temp->toDateString();
                $isHoliday = isset($holidayDates[$dateStr]);
                $holidayInfo = $holidayDates[$dateStr] ?? null;
                $dayOfWeek = $temp->dayOfWeek;
                $dayData = $indoDays[$dayOfWeek] ?? [
                    'name' => $temp->translatedFormat('D'),
                    'initial' => strtoupper(substr($temp->translatedFormat('D'), 0, 1)),
                ];
                $isSunday = $temp->isSunday();
                $isSaturday = $temp->isSaturday();

                $days[] = [
                    'date' => $dateStr,
                    'day' => $temp->day,
                    'day_name' => $dayData['name'],
                    'day_initial' => $dayData['initial'],
                    'is_sunday' => $isSunday,
                    'is_saturday' => $isSaturday,
                    'is_weekend' => $isSunday || $isSaturday,
                    'is_holiday' => $isHoliday,
                    'holiday_name' => $holidayInfo['name'] ?? null,
                    'holiday_type' => $holidayInfo['type'] ?? null,
                    'holiday_type_name' => $holidayInfo['type_name'] ?? null,
                    'holiday_description' => $holidayInfo['description'] ?? null,
                ];
                $temp->addDay();
            }
        }

        // Calculate effective school days (excluding Sundays and official holidays)
        $effectiveSchoolDays = collect($days)->filter(fn ($d) => ! $d['is_sunday'] && ! $d['is_holiday'])->count();

        $students = [];
        $dailyTotals = [];

        if ($selectedClassroomId) {
            $studentsData = Student::where('classroom_id', $selectedClassroomId)
                ->where('is_active', true)
                ->with(['attendances' => function ($q) use ($startDate, $endDate) {
                    $q->whereBetween('date', [$startDate, $endDate])->with('adjustments');
                }])
                ->orderBy('name')
                ->get();

            $students = $studentsData->map(function ($student) use ($days, $effectiveSchoolDays) {
                $atts = $student->attendances;
                $hadir = $atts->where('status', 'present')->count();
                $sakit = $atts->where('status', 'sick')->count();
                $izin = $atts->where('status', 'permit')->count();
                $alpha = $atts->where('status', 'absent')->count();
                $terlambat = $atts->where('is_late', true)->count();
                $pulangAwal = $atts->filter(fn ($a) => $a->adjustments->isNotEmpty())->count();

                $totalRecorded = $hadir + $sakit + $izin + $alpha;
                // Exclude holidays and Sundays from attendance calculation
                $denominator = $effectiveSchoolDays > 0 ? $effectiveSchoolDays : ($totalRecorded > 0 ? $totalRecorded : 1);
                $percentage = round(($hadir / $denominator) * 100, 1);
                if ($percentage > 100) $percentage = 100;

                $attsByDate = $atts->keyBy('date');
                $dailyAttendances = [];
                foreach ($days as $dayInfo) {
                    $d = $dayInfo['day'];
                    $dateStr = $dayInfo['date'];
                    $att = $attsByDate->get($dateStr);
                    if ($att) {
                        $code = match ($att->status) {
                            'present' => $att->is_late ? 'T' : 'H',
                            'sick' => 'S',
                            'permit' => 'I',
                            'absent' => 'A',
                            default => '-',
                        };
                        $dailyAttendances[$d] = [
                            'code' => $code,
                            'status' => $att->status,
                            'is_late' => (bool) $att->is_late,
                            'notes' => $att->notes,
                        ];
                    } else {
                        if ($dayInfo['is_holiday']) {
                            $code = 'L';
                            $status = 'holiday';
                        } elseif ($dayInfo['is_sunday'] || $dayInfo['is_saturday']) {
                            $code = '-';
                            $status = 'weekend';
                        } else {
                            $code = '.';
                            $status = 'empty';
                        }

                        $dailyAttendances[$d] = [
                            'code' => $code,
                            'status' => $status,
                            'is_late' => false,
                            'notes' => $dayInfo['holiday_name'] ?? ($dayInfo['is_weekend'] ? 'Libur Akhir Pekan' : null),
                        ];
                    }
                }

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
                    'daily_attendances' => $dailyAttendances,
                ];
            });

            foreach ($days as $dayInfo) {
                $d = $dayInfo['day'];
                $dDate = $dayInfo['date'];
                $h = 0; $s = 0; $i = 0; $a = 0; $t = 0;
                foreach ($studentsData as $st) {
                    $att = $st->attendances->firstWhere('date', $dDate);
                    if ($att) {
                        if ($att->status === 'present') {
                            $h++;
                            if ($att->is_late) $t++;
                        } elseif ($att->status === 'sick') $s++;
                        elseif ($att->status === 'permit') $i++;
                        elseif ($att->status === 'absent') $a++;
                    }
                }
                $dailyTotals[$d] = [
                    'hadir' => $h,
                    'sakit' => $s,
                    'izin' => $i,
                    'alpha' => $a,
                    'terlambat' => $t,
                    'is_sunday' => $dayInfo['is_sunday'],
                    'is_saturday' => $dayInfo['is_saturday'],
                    'is_weekend' => $dayInfo['is_weekend'],
                    'is_holiday' => $dayInfo['is_holiday'],
                    'holiday_name' => $dayInfo['holiday_name'],
                ];
            }
        }

        $maleCount = collect($students)->where('gender', 'L')->count();
        $femaleCount = collect($students)->where('gender', 'P')->count();
        $genderStats = [
            'male' => $maleCount,
            'female' => $femaleCount,
            'total' => $maleCount + $femaleCount,
        ];

        $summary = [
            'total_students' => count($students),
            'total_hadir' => collect($students)->sum('hadir'),
            'total_sakit' => collect($students)->sum('sakit'),
            'total_izin' => collect($students)->sum('izin'),
            'total_alpha' => collect($students)->sum('alpha'),
            'total_terlambat' => collect($students)->sum('terlambat'),
            'total_pulang_awal' => collect($students)->sum('pulang_awal'),
            'effective_school_days' => $effectiveSchoolDays,
        ];

        $periodHolidays = AcademicHoliday::where(function ($q) use ($startDate, $endDate) {
            $q->whereBetween('start_date', [$startDate, $endDate])
                ->orWhereBetween('end_date', [$startDate, $endDate])
                ->orWhere(function ($sub) use ($startDate, $endDate) {
                    $sub->where('start_date', '<=', $startDate)
                        ->where('end_date', '>=', $endDate);
                });
        })->orderBy('start_date')->get();

        return [
            'classrooms' => $classrooms,
            'selectedClassroomId' => (int) $selectedClassroomId,
            'classroom' => $classroom,
            'filterType' => $filterType,
            'month' => $month,
            'year' => $year,
            'monthName' => $this->monthNames[$month] ?? 'Januari',
            'startDate' => $startDate,
            'endDate' => $endDate,
            'periodLabel' => $periodLabel,
            'days' => $days,
            'students' => $students,
            'dailyTotals' => $dailyTotals,
            'summary' => $summary,
            'genderStats' => $genderStats,
            'monthNames' => $this->monthNames,
            'periodHolidays' => $periodHolidays,
        ];
    }

    public function index(Request $request): Response
    {
        $data = $this->resolveReportData($request);

        return Inertia::render('reports/index', [
            'classrooms' => $data['classrooms'],
            'selectedClassroomId' => $data['selectedClassroomId'],
            'filterType' => $data['filterType'],
            'month' => $data['month'],
            'year' => $data['year'],
            'monthName' => $data['monthName'],
            'startDate' => $data['startDate'],
            'endDate' => $data['endDate'],
            'periodLabel' => $data['periodLabel'],
            'days' => $data['days'],
            'students' => $data['students'],
            'dailyTotals' => $data['dailyTotals'],
            'summary' => $data['summary'],
            'genderStats' => $data['genderStats'],
            'monthNames' => $data['monthNames'],
            'periodHolidays' => $data['periodHolidays'],
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        $data = $this->resolveReportData($request);
        $classroom = $data['classroom'];
        $className = $classroom ? str_replace(' ', '_', $classroom->name) : 'Semua_Kelas';
        $periodLabel = str_replace(' ', '_', $data['periodLabel']);
        $days = $data['days'];
        $students = $data['students'];

        $fileName = "Rekap_Presensi_{$className}_{$periodLabel}.csv";
        $genderStats = $data['genderStats'];

        return response()->streamDownload(function () use ($students, $days, $classroom, $genderStats) {
            $handle = fopen('php://output', 'w');

            // UTF-8 BOM for Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            // Construct header
            $header = [
                'No',
                'NISN',
                'NIS',
                'Nama Peserta Didik',
                'Kelas',
                'L/P',
            ];

            if (count($days) > 0) {
                foreach ($days as $day) {
                    $header[] = $day['day'];
                }
            }

            $header[] = 'Hadir (H)';
            $header[] = 'Sakit (S)';
            $header[] = 'Izin (I)';
            $header[] = 'Alpha (A)';
            $header[] = 'Terlambat (T)';
            $header[] = 'Persentase Kehadiran (%)';

            fputcsv($handle, $header);

            $no = 1;
            foreach ($students as $student) {
                $row = [
                    $no++,
                    $student['nisn'],
                    $student['nis'],
                    $student['name'],
                    $classroom->name ?? '-',
                    $student['gender'],
                ];

                if (count($days) > 0) {
                    foreach ($days as $day) {
                        $daily = $student['daily_attendances'][$day['day']] ?? null;
                        $row[] = $daily['code'] ?? ($day['is_sunday'] ? '-' : '.');
                    }
                }

                $row[] = $student['hadir'];
                $row[] = $student['sakit'];
                $row[] = $student['izin'];
                $row[] = $student['alpha'];
                $row[] = $student['terlambat'];
                $row[] = $student['percentage'] . '%';

                fputcsv($handle, $row);
            }

            // Append gender breakdown and signature block at the bottom
            fputcsv($handle, []);
            fputcsv($handle, ['Keterangan Siswa:']);
            fputcsv($handle, ['Jumlah Laki-laki = ' . ($genderStats['male'] ?? 0)]);
            fputcsv($handle, ['Jumlah Perempuan = ' . ($genderStats['female'] ?? 0)]);
            fputcsv($handle, ['Total = ' . ($genderStats['total'] ?? 0)]);

            $school = SchoolSetting::getSetting();
            fputcsv($handle, []);
            fputcsv($handle, ['Mengetahui,']);
            fputcsv($handle, ['Kepala Sekolah ' . ($school->name ?? '')]);
            fputcsv($handle, [$school->principal_name ?? '']);
            fputcsv($handle, ['NIP. ' . ($school->principal_nip ?? '-')]);

            fclose($handle);
        }, $fileName, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function exportPdf(Request $request): HttpResponse
    {
        $data = $this->resolveReportData($request);
        $school = SchoolSetting::getSetting();

        // Convert school logo to base64 for reliable PDF rendering
        $logoBase64 = null;
        if ($school->logo_path && file_exists(storage_path('app/public/' . $school->logo_path))) {
            $imageData = base64_encode(file_get_contents(storage_path('app/public/' . $school->logo_path)));
            $mime = mime_content_type(storage_path('app/public/' . $school->logo_path));
            $logoBase64 = "data:{$mime};base64,{$imageData}";
        }

        $className = $data['classroom'] ? str_replace(' ', '_', $data['classroom']->name) : 'Semua_Kelas';
        $periodLabel = str_replace(' ', '_', $data['periodLabel']);
        $fileName = "Laporan_Presensi_{$className}_{$periodLabel}.pdf";

        $pdf = Pdf::loadView('reports.pdf', [
            ...$data,
            'school' => $school,
            'logoBase64' => $logoBase64,
            'title' => 'Laporan Presensi ' . ($data['classroom']->name ?? '') . ' - ' . $data['periodLabel'],
            'printedAt' => now()->translatedFormat('d F Y'),
        ]);

        $pdf->setPaper('a4', 'landscape');

        return $pdf->download($fileName);
    }
}
