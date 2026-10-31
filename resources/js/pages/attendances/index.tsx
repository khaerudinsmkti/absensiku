import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarRange,
    CheckCircle2,
    Clock,
    GraduationCap,
    Save,
    UserCheck,
    Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { AttendanceRadioGroup } from '@/components/attendance-radio-group';
import { PageBanner } from '@/components/page-banner';
import { Button } from '@/components/ui/button';
import type { ClassroomData } from '@/types/attendance';

interface StudentItem {
    id: number;
    name: string;
    nisn: string;
    nis: string;
    gender: 'L' | 'P';
    attendance_id?: number | null;
    status: 'present' | 'sick' | 'permit' | 'absent';
    is_late?: boolean;
    late_minutes?: number;
    check_in_time?: string;
    notes?: string;
    adjustment?: {
        type: string;
        type_name: string;
        departure_time: string;
        reason: string;
    } | null;
}

interface AttendanceIndexProps {
    classrooms: ClassroomData[];
    selectedClassroom: ClassroomData | null;
    selectedClassroomId: number;
    selectedDate: string;
    isFutureDate?: boolean;
    holiday?: {
        name: string;
        type: string;
        type_name: string;
        description?: string | null;
    } | null;
    students: StudentItem[];
}

export default function AttendanceIndex({
    classrooms = [],
    selectedClassroom,
    selectedClassroomId,
    selectedDate,
    isFutureDate = false,
    holiday,
    students = [],
}: AttendanceIndexProps) {
    const todayStr = new Date().toLocaleDateString('en-CA');
    const isFuture = isFutureDate || selectedDate > todayStr;
    const isBlocked = !!holiday || isFuture;

    const { data, setData, post, processing, wasSuccessful } = useForm({
        classroom_id: selectedClassroomId,
        date: selectedDate,
        attendances: students.map((s) => ({
            student_id: s.id,
            status: s.status || 'present',
            notes: s.notes || '',
        })),
    });

    // Update form attendances when students prop changes
    useEffect(() => {
        setData({
            classroom_id: selectedClassroomId,
            date: selectedDate,
            attendances: students.map((s) => ({
                student_id: s.id,
                status: s.status || 'present',
                notes: s.notes || '',
            })),
        });
    }, [students, selectedClassroomId, selectedDate]);

    const handleClassChange = (newClassId: string) => {
        router.get(
            '/attendances',
            { classroom_id: newClassId, date: selectedDate },
            { preserveState: false, preserveScroll: true },
        );
    };

    const handleDateChange = (newDate: string) => {
        router.get(
            '/attendances',
            { classroom_id: selectedClassroomId, date: newDate },
            { preserveState: false, preserveScroll: true },
        );
    };

    const handleStatusChange = (
        studentId: number,
        newStatus: 'present' | 'sick' | 'permit' | 'absent',
    ) => {
        setData(
            'attendances',
            data.attendances.map((item) =>
                item.student_id === studentId ? { ...item, status: newStatus } : item,
            ),
        );
    };

    const handleNotesChange = (studentId: number, notes: string) => {
        setData(
            'attendances',
            data.attendances.map((item) =>
                item.student_id === studentId ? { ...item, notes } : item,
            ),
        );
    };

    const handleSetAllPresent = () => {
        setData(
            'attendances',
            data.attendances.map((item) => ({ ...item, status: 'present' })),
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/attendances/batch', {
            preserveScroll: true,
        });
    };

    // Calculate current breakdown from local form data
    const hadirCount = data.attendances.filter((a) => a.status === 'present').length;
    const sakitCount = data.attendances.filter((a) => a.status === 'sick').length;
    const izinCount = data.attendances.filter((a) => a.status === 'permit').length;
    const alphaCount = data.attendances.filter((a) => a.status === 'absent').length;

    return (
        <>
            <Head title="Presensi Harian Massal - AbsensiKu" />
            <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8 bg-page-gradient min-h-screen">
                <PageBanner
                    badgeText="Presensi Reguler Pagi"
                    title="Formulir Presensi Harian Siswa 📋"
                    description="Isi kehadiran siswa secara massal per kelas. Siswa otomatis berstatus Hadir secara default, ubah opsi bagi yang sakit, izin, atau tanpa keterangan."
                    action={
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                                Wali: {selectedClassroom?.homeroom_teacher?.name ?? 'Belum Ditentukan'}
                            </span>
                        </div>
                    }
                />

                {/* Holiday Notice if selected date is holiday */}
                {holiday && (
                    <div className="flex items-center gap-3.5 rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-red-900 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200">
                            <CalendarRange className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-extrabold text-red-950 dark:text-red-100">
                                    Peringatan Hari Libur: {holiday.name}
                                </span>
                                <span className="rounded-md bg-red-200/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-900 dark:bg-red-900 dark:text-red-200">
                                    {holiday.type_name}
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-red-800/90 dark:text-red-300/90 font-medium">
                                {holiday.description || 'Tanggal yang dipilih merupakan hari libur. Presensi siswa tidak dapat diinput pada hari libur.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Future Date Warning */}
                {isFuture && (
                    <div className="flex items-center gap-3.5 rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-red-900 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-200">
                            <AlertCircle className="size-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-sm font-extrabold text-red-950 dark:text-red-100">
                                Tanggal Masa Depan Tidak Diperbolehkan
                            </span>
                            <p className="mt-0.5 text-xs text-red-800/90 dark:text-red-300/90 font-medium">
                                Anda tidak dapat menginput presensi untuk tanggal maju dari hari ini. Silakan pilih tanggal hari ini atau sebelumnya.
                            </p>
                        </div>
                    </div>
                )}

                {/* Filter and Control Bar */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 rounded-[18px] border-2 border-[#E8E8E8] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] lg:flex-row lg:items-center lg:justify-between dark:border-[#2D234A] dark:bg-[#18122B]">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider dark:text-[#9CA3AF]">
                                    Pilih Kelas:
                                </label>
                                <select
                                    value={selectedClassroomId || ''}
                                    onChange={(e) => handleClassChange(e.target.value)}
                                    className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3.5 py-2 text-sm font-semibold text-[#1F2937] focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/12 outline-none dark:border-[#2D234A] dark:bg-[#18122B] dark:text-white cursor-pointer"
                                >
                                    {classrooms.length === 0 && (
                                        <option value="">Belum ada kelas yang diampu</option>
                                    )}
                                    {classrooms.map((cls) => (
                                        <option key={cls.id} value={cls.id}>
                                            {cls.name} ({cls.academic_year})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider dark:text-[#9CA3AF]">
                                    Tanggal Presensi:
                                </label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    max={todayStr}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3.5 py-2 text-sm font-semibold text-[#1F2937] focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/12 outline-none dark:border-[#2D234A] dark:bg-[#18122B] dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isBlocked}
                                onClick={handleSetAllPresent}
                                className="font-semibold text-xs border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <CheckCircle2 className="size-4 mr-1 text-emerald-600" />
                                Set Semua Hadir
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={processing || students.length === 0 || isBlocked}
                                className="font-bold text-xs bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand hover:translate-y-[-1px] transition-all disabled:opacity-50"
                            >
                                <Save className="size-4 mr-1.5" />
                                {processing ? 'Menyimpan...' : 'Simpan Presensi Kelas'}
                            </Button>
                        </div>
                    </div>

                    {/* Quick Summary Pill Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-[#DCFCE7]/60 p-3">
                            <span className="text-xs font-bold text-[#059669]">Hadir</span>
                            <span className="text-base font-extrabold text-[#059669]">{hadirCount}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-[#DBEAFE]/60 p-3">
                            <span className="text-xs font-bold text-[#1D4ED8]">Sakit</span>
                            <span className="text-base font-extrabold text-[#1D4ED8]">{sakitCount}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-[#FEF3C7]/60 p-3">
                            <span className="text-xs font-bold text-[#B45309]">Izin</span>
                            <span className="text-base font-extrabold text-[#B45309]">{izinCount}</span>
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-[#FEE2E2]/60 p-3">
                            <span className="text-xs font-bold text-[#DC2626]">Alpha</span>
                            <span className="text-base font-extrabold text-[#DC2626]">{alphaCount}</span>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="overflow-hidden rounded-[18px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                        <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-4 dark:border-[#2D234A]">
                            <div>
                                <h2 className="text-base font-bold text-[#111827] dark:text-white">
                                    Daftar Siswa: {selectedClassroom?.name ?? 'Memuat...'}
                                </h2>
                                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                    Status dapat diubah satu per satu menggunakan kapsul radio button di bawah.
                                </p>
                            </div>
                            <span className="rounded-full bg-[#E8FAF9] px-3 py-1 text-xs font-bold text-[#0D9488]">
                                Total {students.length} Siswa
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm">
                                <thead>
                                    <tr className="bg-table-header border-b-2 border-[#FFD4C2] dark:border-[#3D2520]">
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            No
                                        </th>
                                        <th className="hidden sm:table-cell px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            NISN / NIS
                                        </th>
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            Nama Siswa
                                        </th>
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            L/P
                                        </th>
                                        <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            Pilihan Presensi
                                        </th>
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            Keterangan / Alasan
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F5F5F5] dark:divide-[#231A3A]">
                                    {students.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="text-center py-10 text-gray-500 font-medium">
                                                Belum ada data siswa di kelas ini. Tambahkan siswa melalui menu Data Siswa & Kelas.
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((student, idx) => {
                                            const currentEntry = data.attendances.find(
                                                (a) => a.student_id === student.id,
                                            );
                                            const currentStatus = currentEntry?.status ?? 'present';
                                            const mappedVal = currentStatus === 'present' ? 'hadir'
                                                : currentStatus === 'sick' ? 'sakit'
                                                : currentStatus === 'permit' ? 'izin'
                                                : 'alpha';

                                            return (
                                                <tr
                                                    key={student.id}
                                                    className="transition-colors hover:bg-gradient-to-r hover:from-[#FFF8F5] hover:to-[#F0FFFE]"
                                                >
                                                    <td className="px-5 py-3.5 font-bold text-[#6B7280]">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="hidden sm:table-cell px-5 py-3.5 font-mono text-xs text-[#6B7280]">
                                                        <div>{student.nisn}</div>
                                                        <div className="text-[11px] text-gray-400">NIS: {student.nis}</div>
                                                    </td>
                                                    <td className="px-5 py-3.5 font-bold text-[#1F2937] dark:text-white">
                                                        <div>{student.name}</div>
                                                        <div className="text-[11px] font-normal text-gray-400 font-mono sm:hidden">
                                                            NISN: {student.nisn}
                                                        </div>
                                                        {student.adjustment && (
                                                            <span className="mt-1 inline-flex items-center gap-1 rounded bg-[#CCFBF1] px-2 py-0.5 text-[10px] font-bold text-[#0F766E]">
                                                                {student.adjustment.type_name} ({student.adjustment.departure_time})
                                                            </span>
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
                                                    <td className="px-5 py-3.5 text-center">
                                                        <AttendanceRadioGroup
                                                            name={`status-${student.id}`}
                                                            value={mappedVal}
                                                            disabled={isBlocked}
                                                            onChange={(val) => {
                                                                const dbVal = val === 'hadir' ? 'present'
                                                                    : val === 'sakit' ? 'sick'
                                                                    : val === 'izin' ? 'permit'
                                                                    : 'absent';
                                                                handleStatusChange(student.id, dbVal);
                                                            }}
                                                        />
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <input
                                                            type="text"
                                                            disabled={isBlocked}
                                                            placeholder={
                                                                isBlocked
                                                                    ? 'Tidak dapat diisi (libur / non-aktif)'
                                                                    : currentStatus === 'present'
                                                                      ? 'Tepat waktu (opsional)'
                                                                      : 'Tuliskan alasan / surat...'
                                                            }
                                                            value={currentEntry?.notes ?? ''}
                                                            onChange={(e) =>
                                                                handleNotesChange(student.id, e.target.value)
                                                            }
                                                            className="w-full max-w-sm rounded-lg border border-[#E8E8E8] px-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/15 disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {students.length > 0 && (
                            <div className="flex items-center justify-between border-t border-[#E8E8E8] bg-gray-50/50 p-4 px-6 dark:border-[#2D234A] dark:bg-[#18122B]">
                                <span className="text-xs text-gray-500 font-medium">
                                    Menampilkan {students.length} siswa • Klik Simpan Presensi Kelas untuk memperbarui.
                                </span>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={processing}
                                    className="font-bold text-xs bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand hover:translate-y-[-1px] transition-all"
                                >
                                    <Save className="size-4 mr-1.5" />
                                    {processing ? 'Menyimpan...' : 'Simpan Presensi Kelas'}
                                </Button>
                            </div>
                        )}
                    </div>
                </form>
            </div>
        </>
    );
}

AttendanceIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Presensi Harian', href: '/attendances' },
    ],
};
