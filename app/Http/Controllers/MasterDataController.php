<?php

namespace App\Http\Controllers;

use App\Models\Classroom;
use App\Models\DutySchedule;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MasterDataController extends Controller
{
    /**
     * Master Data Classrooms, Students, Teachers & Duty Schedules
     */
    public function index(Request $request): Response
    {
        $classrooms = Classroom::with(['homeroomTeacher', 'students'])->orderBy('name')->get();
        $selectedClassroomId = $request->input('classroom_id');
        $search = $request->input('search');

        $studentsQuery = Student::query()
            ->when($selectedClassroomId, fn ($q) => $q->where('classroom_id', $selectedClassroomId))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('name', 'like', "%{$search}%")
                        ->orWhere('nisn', 'like', "%{$search}%")
                        ->orWhere('nis', 'like', "%{$search}%");
                });
            })
            ->with('classroom')
            ->orderBy('name');

        $students = $studentsQuery->paginate(15)->withQueryString();

        $teachers = User::whereIn('role', ['teacher', 'admin', 'principal'])
            ->with(['homeroomClassrooms', 'dutySchedules'])
            ->orderBy('name')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
                'nip' => $t->nip,
                'username' => $t->username,
                'email' => $t->email,
                'role' => $t->role,
                'homeroom_class' => $t->homeroomClassrooms->pluck('name')->join(', '),
                'duty_days' => $t->dutySchedules->map(fn ($d) => $d->day_name)->join(', '),
            ]);

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
            'selectedClassroomId' => $selectedClassroomId ? (int) $selectedClassroomId : null,
            'search' => $search ?? '',
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
     * Update classroom
     */
    public function updateClassroom(Request $request, Classroom $classroom): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'academic_year' => 'required|string|max:20',
            'homeroom_teacher_id' => 'nullable|exists:users,id',
        ]);

        $classroom->update($validated);

        return back()->with('success', "Data kelas {$classroom->name} berhasil diperbarui.");
    }

    /**
     * Delete classroom
     */
    public function destroyClassroom(Classroom $classroom): RedirectResponse
    {
        if ($classroom->students()->exists()) {
            $studentCount = $classroom->students()->count();
            return back()->with('error', "Kelas {$classroom->name} tidak dapat dihapus karena masih memiliki {$studentCount} siswa terdaftar. Pindahkan atau hapus data siswa terlebih dahulu.");
        }

        $name = $classroom->name;
        $classroom->delete();

        return back()->with('success', "Kelas {$name} berhasil dihapus.");
    }

    /**
     * Batch import classrooms from Excel file or direct copy-paste payload
     */
    public function batchImportClassrooms(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'classrooms' => 'required|array|min:1',
            'classrooms.*.name' => 'required|string|max:50',
            'classrooms.*.academic_year' => 'nullable|string|max:20',
            'classrooms.*.homeroom_teacher' => 'nullable|string|max:150',
        ]);

        $count = 0;

        DB::transaction(function () use ($validated, &$count) {
            $defaultYear = '2026/2027';
            $teachers = User::whereIn('role', ['teacher', 'admin', 'principal'])->get();

            foreach ($validated['classrooms'] as $item) {
                $name = trim($item['name']);
                if (empty($name)) {
                    continue;
                }

                $academicYear = ! empty($item['academic_year']) ? trim($item['academic_year']) : $defaultYear;
                $teacherIdentifier = ! empty($item['homeroom_teacher']) ? trim($item['homeroom_teacher']) : null;

                $homeroomTeacherId = null;
                if ($teacherIdentifier) {
                    $matchedTeacher = $teachers->first(fn ($t) => $t->nip && $t->nip === $teacherIdentifier);
                    if (! $matchedTeacher) {
                        $matchedTeacher = $teachers->first(fn ($t) => strcasecmp($t->name, $teacherIdentifier) === 0);
                    }
                    if (! $matchedTeacher) {
                        $matchedTeacher = $teachers->first(fn ($t) => stripos($t->name, $teacherIdentifier) !== false);
                    }
                    if ($matchedTeacher) {
                        $homeroomTeacherId = $matchedTeacher->id;
                    }
                }

                Classroom::updateOrCreate(
                    [
                        'name' => $name,
                        'academic_year' => $academicYear,
                    ],
                    [
                        'homeroom_teacher_id' => $homeroomTeacherId,
                    ]
                );

                $count++;
            }
        });

        return back()->with('success', "{$count} data rombel kelas berhasil diimpor ke sistem.");
    }

    /**
     * Create student (Single)
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
     * Update student
     */
    public function updateStudent(Request $request, Student $student): RedirectResponse
    {
        $validated = $request->validate([
            'classroom_id' => 'required|exists:classrooms,id',
            'name' => 'required|string|max:150',
            'nisn' => 'required|string|max:20|unique:students,nisn,' . $student->id,
            'nis' => 'required|string|max:20|unique:students,nis,' . $student->id,
            'gender' => 'required|in:L,P',
            'is_active' => 'required|boolean',
        ]);

        $student->update($validated);

        return back()->with('success', "Data siswa {$student->name} berhasil diperbarui.");
    }

    /**
     * Delete student
     */
    public function destroyStudent(Student $student): RedirectResponse
    {
        $name = $student->name;
        $student->delete();

        return back()->with('success', "Data siswa {$name} berhasil dihapus.");
    }

    /**
     * Batch import students from Excel file or direct copy-paste JSON payload
     */
    public function batchImportStudents(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'classroom_id' => 'nullable|exists:classrooms,id',
            'students' => 'required|array|min:1',
            'students.*.name' => 'required|string|max:150',
            'students.*.nisn' => 'required|string|max:20',
            'students.*.nis' => 'nullable|string|max:20',
            'students.*.gender' => 'required|string|max:5',
            'students.*.classroom_name' => 'nullable|string|max:50',
            'students.*.classroom_id' => 'nullable|exists:classrooms,id',
        ]);

        $count = 0;

        DB::transaction(function () use ($validated, &$count) {
            $classrooms = Classroom::all()->keyBy(fn ($c) => strtolower(trim($c->name)));
            $fallbackClassroomId = $validated['classroom_id'] ?? null;

            foreach ($validated['students'] as $item) {
                $targetClassroomId = $fallbackClassroomId;

                if (! empty($item['classroom_id'])) {
                    $targetClassroomId = $item['classroom_id'];
                } elseif (! empty($item['classroom_name'])) {
                    $clsKey = strtolower(trim($item['classroom_name']));
                    if (isset($classrooms[$clsKey])) {
                        $targetClassroomId = $classrooms[$clsKey]->id;
                    } else {
                        $newCls = Classroom::create([
                            'name' => trim($item['classroom_name']),
                            'academic_year' => '2026/2027',
                        ]);
                        $classrooms[strtolower(trim($newCls->name))] = $newCls;
                        $targetClassroomId = $newCls->id;
                    }
                }

                if (! $targetClassroomId) {
                    $firstClass = Classroom::first();
                    $targetClassroomId = $firstClass ? $firstClass->id : Classroom::create(['name' => 'Kelas 1', 'academic_year' => '2026/2027'])->id;
                }

                $nis = ! empty($item['nis']) ? $item['nis'] : $item['nisn'];
                $gender = strtoupper(trim($item['gender'])) === 'P' || strtoupper(trim($item['gender'])) === 'PEREMPUAN' ? 'P' : 'L';

                Student::updateOrCreate(
                    ['nisn' => trim($item['nisn'])],
                    [
                        'classroom_id' => $targetClassroomId,
                        'name' => trim($item['name']),
                        'nis' => trim($nis),
                        'gender' => $gender,
                        'is_active' => true,
                    ]
                );

                $count++;
            }
        });

        return back()->with('success', "{$count} data siswa berhasil diimpor ke sistem.");
    }

    /**
     * Create teacher
     */
    public function storeTeacher(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'nip' => 'nullable|string|max:50|unique:users,nip',
            'username' => 'required|string|max:50|unique:users,username',
            'email' => 'required|email|max:150|unique:users,email',
            'role' => 'required|in:teacher,admin,principal',
            'password' => 'required|string|min:6',
        ]);

        User::create([
            'name' => $validated['name'],
            'nip' => $validated['nip'] ?? null,
            'username' => $validated['username'],
            'email' => $validated['email'],
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
            'email_verified_at' => now(),
        ]);

        return back()->with('success', "Akun guru {$validated['name']} berhasil dibuat.");
    }

    /**
     * Update teacher
     */
    public function updateTeacher(Request $request, User $user): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'nip' => 'nullable|string|max:50|unique:users,nip,' . $user->id,
            'username' => 'required|string|max:50|unique:users,username,' . $user->id,
            'email' => 'required|email|max:150|unique:users,email,' . $user->id,
            'role' => 'required|in:teacher,admin,principal',
            'password' => 'nullable|string|min:6',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'nip' => $validated['nip'] ?? null,
            'username' => $validated['username'],
            'email' => $validated['email'],
            'role' => $validated['role'],
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return back()->with('success', "Data guru {$user->name} berhasil diperbarui.");
    }

    /**
     * Delete teacher
     */
    public function destroyTeacher(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        $name = $user->name;
        $user->delete();

        return back()->with('success', "Data guru {$name} berhasil dihapus.");
    }

    /**
     * Batch import teachers from Excel file or direct copy-paste payload
     */
    public function batchImportTeachers(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'teachers' => 'required|array|min:1',
            'teachers.*.name' => 'required|string|max:150',
            'teachers.*.nip' => 'nullable|string|max:50',
            'teachers.*.username' => 'nullable|string|max:50',
            'teachers.*.email' => 'nullable|string|max:150',
            'teachers.*.role' => 'nullable|string|max:20',
            'teachers.*.password' => 'nullable|string|min:4',
        ]);

        $count = 0;

        DB::transaction(function () use ($validated, &$count) {
            foreach ($validated['teachers'] as $item) {
                $name = trim($item['name']);
                if (empty($name)) {
                    continue;
                }

                $nip = ! empty($item['nip']) ? trim($item['nip']) : null;

                // Determine or generate username
                $username = ! empty($item['username']) ? trim($item['username']) : null;
                if (! $username) {
                    if ($nip) {
                        $username = $nip;
                    } else {
                        $baseUsername = Str::slug($name, '');
                        if (empty($baseUsername)) {
                            $baseUsername = 'guru';
                        }
                        $username = substr($baseUsername, 0, 20);
                    }
                }

                // Determine or generate email
                $email = ! empty($item['email']) ? trim($item['email']) : null;
                if (! $email || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $emailUser = $nip ?: $username;
                    $email = strtolower($emailUser) . '@sekolah.id';
                }

                // Parse role
                $rawRole = strtolower(trim($item['role'] ?? 'teacher'));
                $role = match ($rawRole) {
                    'admin', 'administrator' => 'admin',
                    'principal', 'kepala sekolah', 'kepsek' => 'principal',
                    default => 'teacher',
                };

                $password = ! empty($item['password']) ? trim($item['password']) : '123456';

                // Look up existing user by NIP or username or email
                $user = null;
                if ($nip) {
                    $user = User::where('nip', $nip)->first();
                }
                if (! $user) {
                    $user = User::where('username', $username)->first();
                }
                if (! $user) {
                    $user = User::where('email', $email)->first();
                }

                if ($user) {
                    // Update existing user
                    $updatePayload = [
                        'name' => $name,
                        'role' => $role,
                    ];
                    if ($nip) {
                        $updatePayload['nip'] = $nip;
                    }
                    if (! empty($item['password'])) {
                        $updatePayload['password'] = Hash::make($password);
                    }
                    $user->update($updatePayload);
                } else {
                    // Ensure unique username & email if衝突
                    $origUsername = $username;
                    $counter = 1;
                    while (User::where('username', $username)->exists()) {
                        $username = $origUsername . $counter;
                        $counter++;
                    }

                    $origEmail = $email;
                    $counter = 1;
                    while (User::where('email', $email)->exists()) {
                        $parts = explode('@', $origEmail);
                        $email = $parts[0] . $counter . '@' . ($parts[1] ?? 'sekolah.id');
                        $counter++;
                    }

                    User::create([
                        'name' => $name,
                        'nip' => $nip,
                        'username' => $username,
                        'email' => $email,
                        'role' => $role,
                        'password' => Hash::make($password),
                        'email_verified_at' => now(),
                    ]);
                }

                $count++;
            }
        });

        return back()->with('success', "{$count} data guru & staf berhasil diimpor ke sistem.");
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

    /**
     * Update duty schedule
     */
    public function updateDutySchedule(Request $request, DutySchedule $dutySchedule): RedirectResponse
    {
        $validated = $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'day_of_week' => 'required|integer|between:1,6',
            'is_active' => 'nullable|boolean',
        ]);

        $dutySchedule->update([
            'teacher_id' => $validated['teacher_id'],
            'day_of_week' => $validated['day_of_week'],
            'is_active' => $request->has('is_active') ? $validated['is_active'] : true,
        ]);

        return back()->with('success', 'Jadwal piket guru berhasil diperbarui.');
    }

    /**
     * Delete duty schedule
     */
    public function destroyDutySchedule(DutySchedule $dutySchedule): RedirectResponse
    {
        $dutySchedule->delete();

        return back()->with('success', 'Jadwal piket guru berhasil dihapus.');
    }
}
