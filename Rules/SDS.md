

## 3. System Design Specification (SDS)

### 3.1 Architectural Blueprint

* **Back-end:** Laravel 11 / 12 (RESTful logic, Form Requests, Services, Policy-based Authorization).
* **Front-end:** React 18+ terintegrasi via **Inertia.js** (Single Page Application experience tanpa kerumitan REST API boilerplate terpisah) dipadukan dengan **Tailwind CSS** dan komponen UI (misal: Lucide React, Headless UI / Radix UI).
* **Database:** MySQL 8.0 atau PostgreSQL 16.
* **Auth & Security:** Laravel Breeze/Jetstream (Session-based via Sanctum Cookies) dengan Middleware Role & Permission Spatie atau Gate bawaan Laravel.

```
+-----------------------------------------------------------+
|                     React Client (Tailwind)              |
|   [Admin View]  [Guru/Wali View]  [Piket View]  [Siswa]  |
+-----------------------------+-----------------------------+
                              | (Inertia HTTP Protocol)
+-----------------------------v-----------------------------+
|                  Laravel Web Framework                    |
|   Routing -> Middleware (Auth, RoleCheck, ActivePiket)    |
|   Controllers -> FormRequests -> Domain Services          |
+-----------------------------+-----------------------------+
                              | (Eloquent ORM)
+-----------------------------v-----------------------------+
|                      Relational DB                        |
|  (users, students, classrooms, attendances, special_logs) |
+-----------------------------------------------------------+

```

### 3.2 Database Schema (Entity Relationship)

#### Tabel: `users`

* `id` (BIGINT, PK)
* `name` (VARCHAR)
* `nip` (VARCHAR, Nullable, Unique)
* `username` (VARCHAR, Unique)
* `password` (VARCHAR)
* `role` (ENUM: `'admin'`, `'principal'`, `'teacher'`, `'student'`)
* `remember_token`, `timestamps`

#### Tabel: `students`

* `id` (BIGINT, PK)
* `user_id` (BIGINT, FK ke `users.id`, Nullable/Cascade)
* `classroom_id` (BIGINT, FK ke `classrooms.id`)
* `nisn` (VARCHAR, Unique)
* `nis` (VARCHAR, Unique)
* `gender` (ENUM: `'L'`, `'P'`)
* `is_active` (BOOLEAN, Default: `true`)
* `timestamps`

#### Tabel: `classrooms`

* `id` (BIGINT, PK)
* `name` (VARCHAR, contoh: "XII RPL 1")
* `academic_year` (VARCHAR, contoh: "2026/2027")
* `homeroom_teacher_id` (BIGINT, FK ke `users.id` — Wali Kelas)
* `timestamps`

#### Tabel: `duty_schedules` (Jadwal Guru Piket)

* `id` (BIGINT, PK)
* `teacher_id` (BIGINT, FK ke `users.id`)
* `day_of_week` (TINYINT: 1=Senin s/d 6=Sabtu)
* `is_active` (BOOLEAN, Default: `true`)
* `timestamps`

#### Tabel: `attendances` (Presensi Harian Utama)

* `id` (BIGINT, PK)
* `student_id` (BIGINT, FK ke `students.id`)
* `recorded_by` (BIGINT, FK ke `users.id` — Guru pencatat awal)
* `date` (DATE)
* `status` (ENUM: `'present'`, `'sick'`, `'permit'`, `'absent'`)
* `check_in_time` (TIME, Nullable)
* `is_late` (BOOLEAN, Default: `false`)
* `late_minutes` (INT, Default: 0)
* `notes` (TEXT, Nullable)
* `timestamps`
* *Unique Key:* `(student_id, date)`

#### Tabel: `attendance_adjustments` (Absen Khusus / Pulang Awal)

* `id` (BIGINT, PK)
* `attendance_id` (BIGINT, FK ke `attendances.id`, Cascade)
* `approved_by` (BIGINT, FK ke `users.id` — Guru Piket penanggung jawab)
* `type` (ENUM: `'early_leave_sick'`, `'early_leave_urgent'`, `'other'`)
* `departure_time` (TIME)
* `reason` (TEXT)
* `pickup_person` (VARCHAR, Nullable — Nama penjemput/wali)
* `attachment_path` (VARCHAR, Nullable — Surat izin/foto surat dokter)
* `timestamps`

---

### 3.3 Core Application Logic & State Handlers

#### Middleware: `EnsureUserHasRole` & `EnsureIsDutyTeacher`

```php
public function handle(Request $request, Closure $next, ...$roles)
{
    $user = $request->user();
    if (!in_array($user->role, $roles)) {
        abort(403, 'Akses tidak diizinkan.');
    }
    return $next($request);
}

```

Untuk guru piket, sistem memeriksa apakah guru tersebut memiliki jadwal aktif pada hari berjalan (`duty_schedules`) atau memiliki *override role* dari admin.

#### Controller Presensi Khusus (Mid-Day Early Leave)

```php
public function storeEarlyLeave(EarlyLeaveRequest $request, Attendance $attendance)
{
    DB::transaction(function () use ($request, $attendance) {
        $adjustment = AttendanceAdjustment::create([
            'attendance_id'   => $attendance->id,
            'approved_by'     => auth()->id(),
            'type'            => $request->type, // 'early_leave_sick' atau 'early_leave_urgent'
            'departure_time'  => now()->format('H:i:s'),
            'reason'          => $request->reason,
            'pickup_person'   => $request->pickup_person,
            'attachment_path' => $request->file('proof')?->store('adjustments', 'public'),
        ]);

        // Opsional: perbarui keterangan presensi induk
        $attendance->update([
            'notes' => $attendance->notes . ' | Pulang awal: ' . $request->reason
        ]);
    });

    return back()->with('success', 'Izin pulang awal berhasil dicatat.');
}
