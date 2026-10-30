<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\AttendanceAdjustment;
use App\Models\Classroom;
use App\Models\DutySchedule;
use App\Models\Student;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create or Update Admin User
        $admin = User::first();
        if ($admin) {
            $admin->update([
                'role' => 'admin',
                'username' => $admin->username ?? 'admin',
                'nip' => $admin->nip ?? '198001012005011001',
            ]);
        } else {
            $admin = User::create([
                'name' => 'Administrator',
                'username' => 'admin',
                'email' => 'admin@absensiku.com',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'nip' => '198001012005011001',
                'email_verified_at' => now(),
            ]);
        }

        // 2. Create Principal (Kepala Sekolah)
        $principal = User::firstOrCreate(
            ['email' => 'kepsek@absensiku.com'],
            [
                'name' => 'Drs. H. Mulyadi, M.Pd.',
                'username' => 'kepsek',
                'password' => Hash::make('password'),
                'role' => 'principal',
                'nip' => '197001011995121001',
                'email_verified_at' => now(),
            ]
        );

        // 3. Create Teachers
        $teacher1 = User::firstOrCreate(
            ['email' => 'nurul@absensiku.com'],
            [
                'name' => 'Nurul Hidayati, S.Pd.',
                'username' => 'nurul',
                'password' => Hash::make('password'),
                'role' => 'teacher',
                'nip' => '198205142006042018',
                'email_verified_at' => now(),
            ]
        );

        $teacher2 = User::firstOrCreate(
            ['email' => 'bambang@absensiku.com'],
            [
                'name' => 'Bambang Prasetyo, S.Pd.',
                'username' => 'bambang',
                'password' => Hash::make('password'),
                'role' => 'teacher',
                'nip' => '198503112009021003',
                'email_verified_at' => now(),
            ]
        );

        $teacher3 = User::firstOrCreate(
            ['email' => 'siti@absensiku.com'],
            [
                'name' => 'Siti Rahmawati, S.Pd.',
                'username' => 'siti',
                'password' => Hash::make('password'),
                'role' => 'teacher',
                'nip' => '199008202015032004',
                'email_verified_at' => now(),
            ]
        );

        $teacher4 = User::firstOrCreate(
            ['email' => 'zaki@absensiku.com'],
            [
                'name' => 'Ahmad Zaki, S.Pd.I',
                'username' => 'zaki',
                'password' => Hash::make('password'),
                'role' => 'teacher',
                'nip' => '199211052019031008',
                'email_verified_at' => now(),
            ]
        );

        // 4. Create Classrooms
        $kelas4A = Classroom::firstOrCreate(
            ['name' => 'Kelas 4-A'],
            [
                'academic_year' => '2026/2027',
                'homeroom_teacher_id' => $teacher1->id,
            ]
        );

        $kelas4B = Classroom::firstOrCreate(
            ['name' => 'Kelas 4-B'],
            [
                'academic_year' => '2026/2027',
                'homeroom_teacher_id' => $teacher2->id,
            ]
        );

        $kelas5A = Classroom::firstOrCreate(
            ['name' => 'Kelas 5-A'],
            [
                'academic_year' => '2026/2027',
                'homeroom_teacher_id' => $teacher3->id,
            ]
        );

        $kelas6A = Classroom::firstOrCreate(
            ['name' => 'Kelas 6-A'],
            [
                'academic_year' => '2026/2027',
                'homeroom_teacher_id' => $teacher4->id,
            ]
        );

        // 5. Duty Schedules (Piket)
        DutySchedule::firstOrCreate(
            ['teacher_id' => $teacher2->id, 'day_of_week' => 1],
            ['is_active' => true]
        );
        DutySchedule::firstOrCreate(
            ['teacher_id' => $teacher1->id, 'day_of_week' => 2],
            ['is_active' => true]
        );
        DutySchedule::firstOrCreate(
            ['teacher_id' => $teacher3->id, 'day_of_week' => 3],
            ['is_active' => true]
        );
        DutySchedule::firstOrCreate(
            ['teacher_id' => $teacher4->id, 'day_of_week' => 4],
            ['is_active' => true]
        );
        DutySchedule::firstOrCreate(
            ['teacher_id' => $teacher2->id, 'day_of_week' => 5],
            ['is_active' => true]
        );
        DutySchedule::firstOrCreate(
            ['teacher_id' => $teacher1->id, 'day_of_week' => 6],
            ['is_active' => true]
        );

        // 6. Create Students for Kelas 4-A
        $students4A = [
            ['name' => 'Ahmad Faiz Pratama', 'nisn' => '0089218201', 'nis' => '4001', 'gender' => 'L'],
            ['name' => 'Anindya Putri Kirana', 'nisn' => '0089218202', 'nis' => '4002', 'gender' => 'P'],
            ['name' => 'Bagas Aditya Nugraha', 'nisn' => '0089218203', 'nis' => '4003', 'gender' => 'L'],
            ['name' => 'Citra Amelia Zahra', 'nisn' => '0089218204', 'nis' => '4004', 'gender' => 'P'],
            ['name' => 'Dimas Satria Ramadhan', 'nisn' => '0089218205', 'nis' => '4005', 'gender' => 'L'],
            ['name' => 'Eka Lestari Wulandari', 'nisn' => '0089218206', 'nis' => '4006', 'gender' => 'P'],
            ['name' => 'Fadhil Muhammad Ihsan', 'nisn' => '0089218207', 'nis' => '4007', 'gender' => 'L'],
            ['name' => 'Gita Permata Sari', 'nisn' => '0089218208', 'nis' => '4008', 'gender' => 'P'],
            ['name' => 'Hafiz Rizky Pratama', 'nisn' => '0089218209', 'nis' => '4009', 'gender' => 'L'],
            ['name' => 'Indah Cahya Lestari', 'nisn' => '0089218210', 'nis' => '4010', 'gender' => 'P'],
        ];

        $studentEntities4A = [];
        foreach ($students4A as $data) {
            $studentEntities4A[] = Student::firstOrCreate(
                ['nisn' => $data['nisn']],
                [
                    'classroom_id' => $kelas4A->id,
                    'name' => $data['name'],
                    'nis' => $data['nis'],
                    'gender' => $data['gender'],
                    'is_active' => true,
                ]
            );
        }

        // Students for Kelas 4-B
        $students4B = [
            ['name' => 'Kevin Arya Wijaya', 'nisn' => '0089218301', 'nis' => '4101', 'gender' => 'L'],
            ['name' => 'Laila Nur Azizah', 'nisn' => '0089218302', 'nis' => '4102', 'gender' => 'P'],
            ['name' => 'Muhammad Naufal Al-Farisi', 'nisn' => '0089218303', 'nis' => '4103', 'gender' => 'L'],
            ['name' => 'Nadia Syakira', 'nisn' => '0089218304', 'nis' => '4104', 'gender' => 'P'],
            ['name' => 'Randi Saputra', 'nisn' => '0089218305', 'nis' => '4105', 'gender' => 'L'],
        ];
        foreach ($students4B as $data) {
            Student::firstOrCreate(
                ['nisn' => $data['nisn']],
                [
                    'classroom_id' => $kelas4B->id,
                    'name' => $data['name'],
                    'nis' => $data['nis'],
                    'gender' => $data['gender'],
                    'is_active' => true,
                ]
            );
        }

        // 7. Seed Sample Attendances for Today
        $today = Carbon::today()->toDateString();
        $sampleRecords = [
            0 => ['status' => 'present', 'check_in' => '06:48:00', 'is_late' => false, 'late' => 0, 'notes' => 'Tepat waktu'],
            1 => ['status' => 'present', 'check_in' => '06:55:00', 'is_late' => false, 'late' => 0, 'notes' => 'Tepat waktu'],
            2 => ['status' => 'present', 'check_in' => '07:18:00', 'is_late' => true, 'late' => 18, 'notes' => 'Ban sepeda kempes'],
            3 => ['status' => 'sick', 'check_in' => null, 'is_late' => false, 'late' => 0, 'notes' => 'Demam tinggi'],
            4 => ['status' => 'permit', 'check_in' => null, 'is_late' => false, 'late' => 0, 'notes' => 'Acara keluarga di luar kota'],
            5 => ['status' => 'absent', 'check_in' => null, 'is_late' => false, 'late' => 0, 'notes' => 'Tanpa keterangan'],
            6 => ['status' => 'present', 'check_in' => '06:40:00', 'is_late' => false, 'late' => 0, 'notes' => 'Tepat waktu'],
            7 => ['status' => 'present', 'check_in' => '06:50:00', 'is_late' => false, 'late' => 0, 'notes' => 'Tepat waktu'],
            8 => ['status' => 'present', 'check_in' => '07:12:00', 'is_late' => true, 'late' => 12, 'notes' => 'Terjebak macet jalan raya'],
            9 => ['status' => 'present', 'check_in' => '06:45:00', 'is_late' => false, 'late' => 0, 'notes' => 'Tepat waktu'],
        ];

        foreach ($sampleRecords as $idx => $attData) {
            if (isset($studentEntities4A[$idx])) {
                $student = $studentEntities4A[$idx];
                $attendance = Attendance::firstOrCreate(
                    [
                        'student_id' => $student->id,
                        'date' => $today,
                    ],
                    [
                        'recorded_by' => $teacher1->id,
                        'status' => $attData['status'],
                        'check_in_time' => $attData['check_in'],
                        'is_late' => $attData['is_late'],
                        'late_minutes' => $attData['late'],
                        'notes' => $attData['notes'],
                    ]
                );

                // Add 1 sample adjustment (Early leave) for student 0
                if ($idx === 0) {
                    AttendanceAdjustment::firstOrCreate(
                        ['attendance_id' => $attendance->id],
                        [
                            'approved_by' => $teacher2->id,
                            'type' => 'early_leave_sick',
                            'departure_time' => '10:30:00',
                            'reason' => 'Mengeluh pusing dan mual saat istirahat pertama',
                            'pickup_person' => 'Ibu Kandung (Ny. Rahma)',
                            'attachment_path' => null,
                        ]
                    );
                }
            }
        }
    }
}
