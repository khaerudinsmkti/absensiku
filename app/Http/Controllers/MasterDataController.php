<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\DutySchedule;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MasterDataController extends Controller
{
    /**
     * Master Data Classrooms & Students list
     */
    public function index(Request $request): Response
    {
        $classrooms = Classroom::with(['homeroomTeacher', 'students'])->orderBy('name')->get();
        $selectedClassroomId = $request->input('classroom_id', $classrooms->first()?->id);

        $students = Student::when($selectedClassroomId, fn ($q) => $q->where('classroom_id', $selectedClassroomId))
            ->with('classroom')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $teachers = User::whereIn('role', ['teacher', 'admin'])->orderBy('name')->get();

        $dutySchedules = DutySchedule::with('teacher')
            ->orderBy('day_of_week')
            ->get()
            ->map(fn ($ds) => [
                'id' => $ds->id,
                'teacher_id' => $ds->teacher_id,
                'teacher_name' => $ds->teacher->name,
                'day_of_week' => $ds->day_of_week,
                'day_name' => $ds->day_name,
                'is_active' => $ds->is_active,
            ]);

        return Inertia::render('master/index', [
            'classrooms' => $classrooms,
            'selectedClassroomId' => (int) $selectedClassroomId,
            'students' => $students,
            'teachers' => $teachers,
            'dutySchedules' => $dutySchedules,
        ]);
    }

    /**
     * Create classroom
     */
    public function storeClassroom(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'academic_year' => 'required|string|max:20',
            'homeroom_teacher_id' => 'nullable|exists:users,id',
        ]);

        Classroom::create($validated);

        return back()->with('success', "Kelas {$validated['name']} berhasil ditambahkan.");
    }

    /**
     * Create student
     */
    public function storeStudent(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'classroom_id' => 'required|exists:classrooms,id',
            'name' => 'required|string|max:150',
            'nisn' => 'required|string|unique:students,nisn|max:20',
            'nis' => 'required|string|unique:students,nis|max:20',
            'gender' => 'required|in:L,P',
        ]);

        Student::create([
            ...$validated,
            'is_active' => true,
        ]);

        return back()->with('success', "Siswa {$validated['name']} berhasil ditambahkan.");
    }

    /**
     * Store duty schedule
     */
    public function storeDutySchedule(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'day_of_week' => 'required|integer|between:1,6',
        ]);

        DutySchedule::updateOrCreate(
            [
                'teacher_id' => $validated['teacher_id'],
                'day_of_week' => $validated['day_of_week'],
            ],
            [
                'is_active' => true,
            ]
        );

        return back()->with('success', 'Jadwal piket guru berhasil disimpan.');
    }
}

