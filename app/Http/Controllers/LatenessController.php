<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\SchoolSetting;
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

        if ($user->role === 'teacher' && ! $user->isDutyTeacherToday()) {
            $lateRecordsQuery->whereHas('student.classroom', function ($q) use ($user) {
                $q->where('homeroom_teacher_id', $user->id);
            });
        }

        $lateRecords = $lateRecordsQuery->get()
            ->map(function ($att) {
                $rawNotes = $att->notes ?? '';
                $reason = '';
                $sanction = '';
                if (preg_match('/Alasan:\s*(.*?)(?:\s*\|\s*Sanksi\/Tindakan:\s*(.*))?$/s', $rawNotes, $matches)) {
                    $reason = trim($matches[1] ?? '');
                    $sanction = trim($matches[2] ?? '');
                } else {
                    $reason = $rawNotes;
                }

                return [
                    'id' => $att->id,
                    'student_id' => $att->student_id,
                    'name' => $att->student->name,
                    'nisn' => $att->student->nisn,
                    'classroom' => $att->student->classroom->name,
                    'check_in_time' => substr($att->check_in_time, 0, 5),
                    'late_minutes' => $att->late_minutes,
                    'notes' => $att->notes,
                    'reason' => $reason,
                    'sanction' => $sanction,
                    'recorded_by' => $att->recordedBy->name,
                ];
            });

        // Active students for quick selection
        $studentsQuery = Student::where('is_active', true)
            ->with('classroom')
            ->orderBy('name');

        if ($user->role === 'teacher' && ! $user->isDutyTeacherToday()) {
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

        $schoolSetting = SchoolSetting::getSetting();
        $cutoffTime = substr($schoolSetting->start_time ?: '07:00', 0, 5);

        $isFutureDate = $date > $today;
        $holiday = \App\Models\AcademicHoliday::getOffDay($date);

        return Inertia::render('attendances/lateness', [
            'selectedDate' => $date,
            'isFutureDate' => $isFutureDate,
            'holiday' => $holiday ? [
                'name' => $holiday->name,
                'type' => $holiday->type,
                'type_name' => $holiday->type_name,
                'description' => $holiday->description,
            ] : null,
            'lateRecords' => $lateRecords,
            'students' => $students,
            'defaultCheckInTime' => now()->format('H:i'),
            'cutoffTime' => $cutoffTime,
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

        $today = Carbon::today()->toDateString();
        if ($validated['date'] > $today) {
            return back()->with('error', 'Tidak dapat menginput data keterlambatan untuk tanggal di masa mendatang (tanggal tidak boleh melebihi hari ini).');
        }

        $offDay = \App\Models\AcademicHoliday::getOffDay($validated['date']);
        if ($offDay) {
            return back()->with('error', "Tanggal {$validated['date']} adalah hari libur ({$offDay->name}). Keterlambatan tidak dapat diinput.");
        }

        if ($request->user()->role === 'teacher' && ! $request->user()->isDutyTeacherToday()) {
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

        $schoolSetting = SchoolSetting::getSetting();
        $cutoffTimeStr = substr($schoolSetting->start_time ?: '07:00', 0, 5);

        $checkInCarbon = Carbon::createFromFormat('H:i', substr($validated['check_in_time'], 0, 5));
        $cutoffCarbon = Carbon::createFromFormat('H:i', $cutoffTimeStr);

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

    public function update(Request $request, Attendance $attendance): RedirectResponse
    {
        if ($request->user()->role === 'teacher' && ! $request->user()->isDutyTeacherToday()) {
            $isAuthorized = $attendance->student && $attendance->student->classroom &&
                $attendance->student->classroom->homeroom_teacher_id === $request->user()->id;
            if (! $isAuthorized) {
                return back()->withErrors([
                    'error' => 'Anda hanya berwenang mengubah keterlambatan siswa di kelas yang Anda ampu.',
                ]);
            }
        }

        $validated = $request->validate([
            'check_in_time' => 'required',
            'reason' => 'required|string|max:255',
            'sanction' => 'nullable|string|max:255',
        ]);

        $today = Carbon::today()->toDateString();
        $attendanceDate = Carbon::parse($attendance->date)->toDateString();
        if ($attendanceDate > $today) {
            return back()->with('error', 'Tidak dapat mengubah data keterlambatan untuk tanggal di masa mendatang.');
        }

        $offDay = \App\Models\AcademicHoliday::getOffDay($attendanceDate);
        if ($offDay) {
            return back()->with('error', "Tanggal {$attendanceDate} adalah hari libur ({$offDay->name}). Data keterlambatan tidak dapat diubah.");
        }

        $schoolSetting = SchoolSetting::getSetting();
        $cutoffTimeStr = substr($schoolSetting->start_time ?: '07:00', 0, 5);

        $checkInCarbon = Carbon::createFromFormat('H:i', substr($validated['check_in_time'], 0, 5));
        $cutoffCarbon = Carbon::createFromFormat('H:i', $cutoffTimeStr);

        $lateMinutes = 0;
        if ($checkInCarbon->greaterThan($cutoffCarbon)) {
            $lateMinutes = (int) abs($checkInCarbon->diffInMinutes($cutoffCarbon));
        }

        $note = 'Alasan: ' . $validated['reason'];
        if (! empty($validated['sanction'])) {
            $note .= ' | Sanksi/Tindakan: ' . $validated['sanction'];
        }

        $attendance->update([
            'check_in_time' => $checkInCarbon->format('H:i:s'),
            'is_late' => true,
            'late_minutes' => $lateMinutes,
            'notes' => $note,
        ]);

        $studentName = $attendance->student->name ?? 'Siswa';

        return back()->with('success', "Data keterlambatan {$studentName} berhasil diperbarui ({$lateMinutes} menit terlambat).");
    }

    public function destroy(Request $request, Attendance $attendance): RedirectResponse
    {
        if ($request->user()->role === 'teacher' && ! $request->user()->isDutyTeacherToday()) {
            $isAuthorized = $attendance->student && $attendance->student->classroom &&
                $attendance->student->classroom->homeroom_teacher_id === $request->user()->id;
            if (! $isAuthorized) {
                return back()->withErrors([
                    'error' => 'Anda hanya berwenang menghapus keterlambatan siswa di kelas yang Anda ampu.',
                ]);
            }
        }

        $studentName = $attendance->student->name ?? 'Siswa';
        $attendance->delete();

        return back()->with('success', "Data keterlambatan {$studentName} berhasil dihapus.");
    }
}

