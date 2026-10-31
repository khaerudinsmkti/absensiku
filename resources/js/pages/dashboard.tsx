import { useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarRange,
    CheckCircle2,
    Clock,
    Download,
    FileSpreadsheet,
    UserCheck,
    Users,
    XCircle,
} from 'lucide-react';
import { AttendanceBadge, type AttendanceStatus } from '@/components/attendance-badge';
import { AttendanceRadioGroup } from '@/components/attendance-radio-group';
import { PageBanner } from '@/components/page-banner';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import type { ClassroomData, StudentAttendanceRow } from '@/types/attendance';

interface DashboardProps {
    classrooms: ClassroomData[];
    selectedClassroomId: number;
    selectedDate: string;
    isFutureDate?: boolean;
    holiday?: {
        name: string;
        type: string;
        type_name: string;
        description?: string | null;
    } | null;
    stats: {
        total_students: number;
        total_hadir: number;
        total_sakit: number;
        total_izin: number;
        total_alpha: number;
        total_terlambat: number;
        total_adjustments: number;
        attendance_rate: number;
    };
    students: StudentAttendanceRow[];
}

export default function Dashboard({
    classrooms = [],
    selectedClassroomId,
    selectedDate,
    isFutureDate = false,
    holiday,
    stats,
    students = [],
}: DashboardProps) {
    const todayStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
    const isFuture = isFutureDate || selectedDate > todayStr;
    const isBlocked = !!holiday || isFuture;

    const handleClassChange = (newClassId: string) => {
        router.get(
            '/dashboard',
            {
                classroom_id: newClassId,
                date: selectedDate,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleDateChange = (newDate: string) => {
        router.get(
            '/dashboard',
            {
                classroom_id: selectedClassroomId,
                date: newDate,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleQuickStatusChange = (studentId: number, status: AttendanceStatus) => {
        if (isBlocked) return;

        const mappedStatus = status === 'hadir' ? 'present'
            : status === 'sakit' ? 'sick'
            : status === 'izin' ? 'permit'
            : status === 'alpha' ? 'absent'
            : 'present';

        router.patch(
            `/attendances/student/${studentId}`,
            {
                date: selectedDate,
                status: mappedStatus,
            },
            { preserveScroll: true },
        );
    };

    const currentClassroom = classrooms.find((c) => c.id === selectedClassroomId);

    return (
        <>
            <Head title="Dashboard - AbsensiKu" />
            <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8 bg-page-gradient min-h-screen">
                {/* 1. Page Banner */}
                <PageBanner
                    badgeText={`Hari Ini • ${selectedDate}`}
                    title="Halo, Selamat Datang di AbsensiKu! 👋"
                    description="Sistem presensi siswa terpadu dengan pencatatan kehadiran realtime, keterlambatan otomatis, dan verifikasi izin pulang awal."
                    action={
                        <div className="flex flex-wrap gap-2.5">
                            <Button
                                asChild
                                variant="secondary"
                                className="bg-white text-[#FF6B35] hover:bg-[#FFFBE6] shadow-sm font-bold border-none"
                            >
                                <a href={`/reports/export?classroom_id=${selectedClassroomId}&start_date=${selectedDate}&end_date=${selectedDate}`}>
                                    <Download className="size-4 mr-1.5" />
                                    Export Rekap CSV
                                </a>
                            </Button>
                        </div>
                    }
                />

                {/* Holiday Banner if today / selected date is a holiday */}
                {holiday && (
                    <div className="flex items-center gap-3.5 rounded-2xl border-2 border-red-300/80 bg-red-50 p-4 text-red-900 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200">
                            <CalendarRange className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-extrabold text-red-950 dark:text-red-100">
                                    Hari Libur: {holiday.name}
                                </span>
                                <span className="rounded-md bg-red-200/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-900 dark:bg-red-900 dark:text-red-200">
                                    {holiday.type_name}
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-red-800/90 dark:text-red-300/90">
                                {holiday.description || 'Tanggal ini tercatat sebagai hari libur pada Kalender Pendidikan. Presensi siswa dinonaktifkan hari ini.'}
                            </p>
                        </div>
                    </div>
                )}

                {!holiday && isFuture && (
                    <div className="flex items-center gap-3.5 rounded-2xl border-2 border-amber-300/80 bg-amber-50 p-4 text-amber-900 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200">
                            <AlertCircle className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-extrabold text-amber-950 dark:text-amber-100">
                                Tanggal Melebihi Hari Ini (Tanggal Maju)
                            </span>
                            <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-300/90">
                                Tidak dapat menginput atau memperbarui presensi untuk tanggal di masa mendatang. Silakan pilih hari ini atau sebelumnya.
                            </p>
                        </div>
                    </div>
                )}

                {/* 2. Stats Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Tingkat Kehadiran"
                        value={`${stats.attendance_rate}%`}
                        subtitle={`${stats.total_hadir} dari ${stats.total_students} siswa hadir`}
                        icon={CheckCircle2}
                        variant="success"
                        trend={{ label: `${stats.total_hadir} Hadir`, isPositive: true }}
                    />
                    <StatCard
                        title="Sakit & Izin"
                        value={stats.total_sakit + stats.total_izin}
                        subtitle={`${stats.total_sakit} Sakit, ${stats.total_izin} Izin Resmi`}
                        icon={AlertCircle}
                        variant="warning"
                    />
                    <StatCard
                        title="Keterlambatan"
                        value={stats.total_terlambat}
                        subtitle="Tercatat guru piket hari ini"
                        icon={Clock}
                        variant="purple"
                    />
                    <StatCard
                        title="Alpha & Tanpa Ket."
                        value={stats.total_alpha}
                        subtitle={stats.total_adjustments > 0 ? `${stats.total_adjustments} Pulang Awal` : 'Perlu konfirmasi wali'}
                        icon={XCircle}
                        variant="danger"
                        trend={stats.total_alpha > 0 ? { label: 'Perlu Cek', isPositive: false } : undefined}
                    />
                </div>

                {/* 3. Filter Bar */}
                <div className="flex flex-col gap-4 rounded-[18px] border-2 border-[#E8E8E8] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] sm:flex-row sm:items-center sm:justify-between dark:border-[#2D234A] dark:bg-[#18122B]">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider dark:text-[#9CA3AF]">
                                Kelas:
                            </span>
                            <select
                                value={selectedClassroomId || ''}
                                onChange={(e) => handleClassChange(e.target.value)}
                                className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3.5 py-1.5 text-sm font-semibold text-[#1F2937] focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/12 outline-none dark:border-[#2D234A] dark:bg-[#18122B] dark:text-white cursor-pointer"
                            >
                                {classrooms.length === 0 && (
                                    <option value="">Belum ada kelas yang diampu</option>
                                )}
                                {classrooms.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name} {cls.homeroom_teacher ? `(Wali: ${cls.homeroom_teacher.name})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider dark:text-[#9CA3AF]">
                                Tanggal:
                            </span>
                            <input
                                type="date"
                                max={todayStr}
                                value={selectedDate}
                                onChange={(e) => handleDateChange(e.target.value)}
                                className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3 py-1.5 text-sm font-semibold text-[#1F2937] focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/12 outline-none dark:border-[#2D234A] dark:bg-[#18122B] dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            asChild
                            variant="primary"
                            size="sm"
                            className="font-semibold text-xs bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand"
                        >
                            <a href={`/attendances?classroom_id=${selectedClassroomId}&date=${selectedDate}`}>
                                <UserCheck className="size-4 mr-1.5" />
                                Buka Presensi Massal
                            </a>
                        </Button>
                    </div>
                </div>

                {/* 4. Data Table */}
                <div className="overflow-hidden rounded-[18px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                    <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-4 dark:border-[#2D234A]">
                        <div>
                            <h2 className="text-base font-bold text-[#111827] dark:text-white">
                                Presensi Siswa: {currentClassroom?.name ?? 'Pilih Kelas'}
                            </h2>
                            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                Klik opsi status untuk memperbarui catatan kehadiran dengan cepat (otomatis tersimpan).
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-[#E8FAF9] px-3 py-1 text-xs font-bold text-[#0D9488] dark:bg-[#113835] dark:text-[#5EEAD4]">
                                {students.length} Siswa Terdaftar
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="bg-table-header border-b-2 border-[#FFD4C2] dark:border-[#3D2520]">
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                        No
                                    </th>
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                        NISN / NIS
                                    </th>
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                        Nama Peserta Didik
                                    </th>
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                        L/P
                                    </th>
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                        Waktu Presensi
                                    </th>
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                        Status Kehadiran
                                    </th>
                                    <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                        Aksi Cepat
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F5F5F5] dark:divide-[#231A3A]">
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-gray-500 font-medium">
                                            Belum ada data siswa untuk kelas ini.
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student, idx) => (
                                        <tr
                                            key={student.id}
                                            className="transition-colors hover:bg-gradient-to-r hover:from-[#FFF8F5] hover:to-[#F0FFFE] dark:hover:from-[#211636] dark:hover:to-[#172433]"
                                        >
                                            <td className="px-5 py-3.5 font-bold text-[#6B7280]">
                                                {idx + 1}
                                            </td>
                                            <td className="px-5 py-3.5 font-mono text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                                <div>{student.nisn}</div>
                                                <div className="text-[11px] text-gray-400">NIS: {student.nis}</div>
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-[#1F2937] dark:text-white">
                                                <div>{student.name}</div>
                                                {student.adjustment && (
                                                    <div className="mt-1 inline-flex items-center gap-1 rounded bg-[#CCFBF1] px-2 py-0.5 text-[10px] font-bold text-[#0F766E]">
                                                        {student.adjustment.type_name} ({student.adjustment.departure_time})
                                                    </div>
                                                )}
                                                {student.notes && !student.adjustment && (
                                                    <div className="text-[11px] text-gray-500 font-normal mt-0.5">
                                                        {student.notes}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span
                                                    className={`inline-flex size-6 items-center justify-center rounded-md text-xs font-bold ${
                                                        student.gender === 'L'
                                                            ? 'bg-[#E8FAF9] text-[#0D9488]'
                                                            : 'bg-[#EDE9FE] text-[#7C3AED]'
                                                    }`}
                                                >
                                                    {student.gender}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-xs font-medium text-[#6B7280]">
                                                {student.is_late ? (
                                                    <span className="font-bold text-[#7C3AED]">
                                                        {student.check_in_time} (+{student.late_minutes}m)
                                                    </span>
                                                ) : (
                                                    student.check_in_time || '-'
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <AttendanceBadge
                                                    status={student.status as AttendanceStatus}
                                                />
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <AttendanceRadioGroup
                                                    name={`att-${student.id}`}
                                                    value={
                                                        student.status === 'terlambat' ? 'hadir' :
                                                        student.status === 'khusus' ? 'hadir' :
                                                        student.status as AttendanceStatus
                                                    }
                                                    compact
                                                    disabled={isBlocked}
                                                    onChange={(val) =>
                                                        handleQuickStatusChange(student.id, val)
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
