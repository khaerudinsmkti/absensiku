import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    AlertTriangle,
    Award,
    Calendar,
    CalendarRange,
    CheckCircle2,
    Clock,
    Download,
    FileSpreadsheet,
    FileText,
    UserCheck,
    Users,
    UserX,
    XCircle,
} from 'lucide-react';
import { AttendanceBadge, type AttendanceStatus } from '@/components/attendance-badge';
import { AttendanceRadioGroup } from '@/components/attendance-radio-group';
import { PageBanner } from '@/components/page-banner';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import type { ClassroomData, StudentAttendanceRow } from '@/types/attendance';

export interface AttendanceRecapItem {
    period: 'daily' | 'monthly' | 'yearly';
    label: string;
    sublabel: string;
    total_students: number;
    total_hadir: number;
    total_sakit: number;
    total_izin: number;
    total_alpha: number;
    total_terlambat: number;
    total_adjustments: number;
    attendance_rate: number;
    total_records: number;
}

export interface TopStudentItem {
    id: number;
    name: string;
    nisn: string;
    nis: string;
    classroom_name: string;
    gender: 'L' | 'P';
    count: number;
    minutes?: number;
}

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
    stats: AttendanceRecapItem;
    recap?: {
        daily: AttendanceRecapItem;
        monthly: AttendanceRecapItem;
        yearly: AttendanceRecapItem;
    };
    top_students?: {
        monthly: {
            terlambat: TopStudentItem[];
            sakit: TopStudentItem[];
            izin: TopStudentItem[];
            alpha: TopStudentItem[];
        };
        yearly: {
            terlambat: TopStudentItem[];
            sakit: TopStudentItem[];
            izin: TopStudentItem[];
            alpha: TopStudentItem[];
        };
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
    recap,
    top_students,
    students = [],
}: DashboardProps) {
    const todayStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
    const isFuture = isFutureDate || selectedDate > todayStr;
    const isBlocked = !!holiday || isFuture;

    const [recapPeriod, setRecapPeriod] = useState<'daily' | 'monthly' | 'yearly'>('daily');
    const [topPeriod, setTopPeriod] = useState<'yearly' | 'monthly'>('yearly');

    const activeRecap: AttendanceRecapItem = useMemo(() => {
        if (!recap) return stats;
        return recap[recapPeriod] ?? stats;
    }, [recap, recapPeriod, stats]);

    const currentTopData = useMemo(() => {
        if (!top_students) {
            return { terlambat: [], sakit: [], izin: [], alpha: [] };
        }
        return top_students[topPeriod] ?? { terlambat: [], sakit: [], izin: [], alpha: [] };
    }, [top_students, topPeriod]);

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

    const renderTopCard = ({
        title,
        subtitle,
        icon: Icon,
        accentColor,
        items = [],
        badgeSuffix,
        extraInfoKey,
    }: {
        title: string;
        subtitle: string;
        icon: any;
        accentColor: 'purple' | 'amber' | 'blue' | 'rose';
        items: TopStudentItem[];
        badgeSuffix: string;
        extraInfoKey?: 'minutes';
    }) => {
        const colorStyles = {
            purple: {
                border: 'border-purple-200/80 dark:border-purple-900/40',
                bg: 'bg-white dark:bg-[#18122B]',
                headerIconBg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
                badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
                rankMedal: 'bg-purple-600 text-white',
            },
            amber: {
                border: 'border-amber-200/80 dark:border-amber-900/40',
                bg: 'bg-white dark:bg-[#18122B]',
                headerIconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
                badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
                rankMedal: 'bg-amber-500 text-white',
            },
            blue: {
                border: 'border-blue-200/80 dark:border-blue-900/40',
                bg: 'bg-white dark:bg-[#18122B]',
                headerIconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
                badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
                rankMedal: 'bg-blue-600 text-white',
            },
            rose: {
                border: 'border-rose-200/80 dark:border-rose-900/40',
                bg: 'bg-white dark:bg-[#18122B]',
                headerIconBg: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
                badge: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
                rankMedal: 'bg-rose-600 text-white',
            },
        }[accentColor];

        return (
            <div className={`flex flex-col rounded-[18px] border-2 ${colorStyles.border} ${colorStyles.bg} p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]`}>
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3.5 dark:border-gray-800">
                    <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${colorStyles.headerIconBg}`}>
                        <Icon className="size-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-[#111827] dark:text-white truncate">
                            {title}
                        </h3>
                        <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] truncate">
                            {subtitle}
                        </p>
                    </div>
                </div>

                <div className="mt-3.5 flex-1 divide-y divide-gray-100 dark:divide-gray-800/60">
                    {items.length === 0 ? (
                        <div className="flex h-36 flex-col items-center justify-center text-center text-gray-400">
                            <CheckCircle2 className="size-6 text-gray-300 dark:text-gray-600 mb-1" />
                            <span className="text-xs font-medium">Nihil / Belum ada data</span>
                        </div>
                    ) : (
                        items.map((student, idx) => (
                            <div key={student.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                                        idx === 0 ? colorStyles.rankMedal : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                                    }`}>
                                        {idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                        <div className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                            {student.name}
                                        </div>
                                        <div className="text-[10px] text-gray-400 flex items-center gap-1 truncate">
                                            <span>{student.classroom_name}</span>
                                            <span>•</span>
                                            <span className={student.gender === 'L' ? 'text-[#0D9488]' : 'text-[#7C3AED]'}>
                                                {student.gender}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="shrink-0 text-right">
                                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-extrabold ${colorStyles.badge}`}>
                                        {student.count} {badgeSuffix.replace('x ', '')}
                                    </span>
                                    {extraInfoKey === 'minutes' && student.minutes && student.minutes > 0 ? (
                                        <div className="text-[10px] font-mono text-gray-400">
                                            {student.minutes} mnt
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    };

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

                {/* 2. Rekapan Status Kehadiran (Harian, Bulanan, Tahunan) */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-[#111827] dark:text-white">
                                    Rekap Status Kehadiran
                                </h2>
                                <span className="rounded-full bg-[#FFF4ED] px-2.5 py-0.5 text-xs font-semibold text-[#FF6B35] dark:bg-[#3D2520] dark:text-[#FFA07A]">
                                    {activeRecap.sublabel}
                                </span>
                            </div>
                            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                Ringkasan akumulasi kehadiran siswa berdasarkan rentang waktu harian, bulanan, dan tahunan.
                            </p>
                        </div>

                        {/* Segmented Controls for Recap Period */}
                        <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-[#1E1735] self-start sm:self-auto border border-gray-200/60 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={() => setRecapPeriod('daily')}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    recapPeriod === 'daily'
                                        ? 'bg-white text-[#FF6B35] shadow-sm dark:bg-[#2A2045] dark:text-[#FFA07A]'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                }`}
                            >
                                <Calendar className="size-3.5" />
                                Harian
                            </button>
                            <button
                                type="button"
                                onClick={() => setRecapPeriod('monthly')}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    recapPeriod === 'monthly'
                                        ? 'bg-white text-[#FF6B35] shadow-sm dark:bg-[#2A2045] dark:text-[#FFA07A]'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                }`}
                            >
                                <CalendarRange className="size-3.5" />
                                Bulanan
                            </button>
                            <button
                                type="button"
                                onClick={() => setRecapPeriod('yearly')}
                                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    recapPeriod === 'yearly'
                                        ? 'bg-white text-[#FF6B35] shadow-sm dark:bg-[#2A2045] dark:text-[#FFA07A]'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                }`}
                            >
                                <Award className="size-3.5" />
                                Tahunan
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            title="Tingkat Kehadiran"
                            value={`${activeRecap.attendance_rate}%`}
                            subtitle={
                                activeRecap.period === 'daily'
                                    ? `${activeRecap.total_hadir} dari ${activeRecap.total_students} siswa hadir`
                                    : `${activeRecap.total_hadir} dari ${activeRecap.total_records} catatan presensi`
                            }
                            icon={CheckCircle2}
                            variant="success"
                            trend={{ label: `${activeRecap.total_hadir} Hadir`, isPositive: true }}
                        />
                        <StatCard
                            title="Sakit & Izin"
                            value={activeRecap.total_sakit + activeRecap.total_izin}
                            subtitle={`${activeRecap.total_sakit} Sakit, ${activeRecap.total_izin} Izin Resmi`}
                            icon={AlertCircle}
                            variant="warning"
                        />
                        <StatCard
                            title="Keterlambatan"
                            value={activeRecap.total_terlambat}
                            subtitle={`Tercatat terlambat (${activeRecap.sublabel})`}
                            icon={Clock}
                            variant="purple"
                        />
                        <StatCard
                            title="Alpha & Tanpa Ket."
                            value={activeRecap.total_alpha}
                            subtitle={activeRecap.total_adjustments > 0 ? `${activeRecap.total_adjustments} Pulang Awal` : 'Perlu perhatian wali'}
                            icon={XCircle}
                            variant="danger"
                            trend={activeRecap.total_alpha > 0 ? { label: 'Perlu Cek', isPositive: false } : undefined}
                        />
                    </div>

                    {/* Mini Comparison Summary Cards */}
                    {recap && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {(['daily', 'monthly', 'yearly'] as const).map((pKey) => {
                                const item = recap[pKey];
                                const isSelected = recapPeriod === pKey;
                                return (
                                    <div
                                        key={pKey}
                                        onClick={() => setRecapPeriod(pKey)}
                                        className={`cursor-pointer rounded-2xl border-2 p-4 transition-all duration-200 ${
                                            isSelected
                                                ? 'border-[#FF6B35] bg-[#FFF8F5] shadow-sm dark:border-[#FF6B35] dark:bg-[#2A1D2D]'
                                                : 'border-gray-200/80 bg-white hover:border-gray-300 dark:border-[#2D234A] dark:bg-[#18122B] dark:hover:border-gray-700'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                                {item.label} • <span className="text-gray-700 dark:text-gray-200">{item.sublabel}</span>
                                            </span>
                                            <span className="text-xs font-extrabold text-[#0D9488]">
                                                {item.attendance_rate}% Hadir
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                                            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-1.5">
                                                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">Hadir</div>
                                                <div className="font-extrabold text-emerald-800 dark:text-emerald-300">{item.total_hadir}</div>
                                            </div>
                                            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-1.5">
                                                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Sakit</div>
                                                <div className="font-extrabold text-amber-800 dark:text-amber-300">{item.total_sakit}</div>
                                            </div>
                                            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 p-1.5">
                                                <div className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">Izin</div>
                                                <div className="font-extrabold text-blue-800 dark:text-blue-300">{item.total_izin}</div>
                                            </div>
                                            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 p-1.5">
                                                <div className="text-[10px] text-rose-700 dark:text-rose-400 font-medium">Alpa</div>
                                                <div className="font-extrabold text-rose-800 dark:text-rose-300">{item.total_alpha}</div>
                                            </div>
                                            <div className="rounded-lg bg-purple-50 dark:bg-purple-950/40 p-1.5">
                                                <div className="text-[10px] text-purple-700 dark:text-purple-400 font-medium">Telat</div>
                                                <div className="font-extrabold text-purple-800 dark:text-purple-300">{item.total_terlambat}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 3. Card Daftar Siswa Paling Banyak Telat, Sakit, Ijin, Alpa */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                                    <AlertTriangle className="size-4" />
                                </div>
                                <h2 className="text-base font-bold text-[#111827] dark:text-white">
                                    Siswa Perlu Perhatian Khusus
                                </h2>
                            </div>
                            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                Daftar siswa dengan frekuensi ketidakhadiran dan keterlambatan tertinggi untuk evaluasi & pembinaan wali kelas.
                            </p>
                        </div>

                        {/* Toggle Periode Top Siswa (Bulan Ini vs Tahun Ini) */}
                        <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-[#1E1735] self-start sm:self-auto border border-gray-200/60 dark:border-gray-800">
                            <button
                                type="button"
                                onClick={() => setTopPeriod('monthly')}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                    topPeriod === 'monthly'
                                        ? 'bg-white text-[#FF6B35] shadow-sm dark:bg-[#2A2045] dark:text-[#FFA07A]'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                }`}
                            >
                                Bulan Ini
                            </button>
                            <button
                                type="button"
                                onClick={() => setTopPeriod('yearly')}
                                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                                    topPeriod === 'yearly'
                                        ? 'bg-white text-[#FF6B35] shadow-sm dark:bg-[#2A2045] dark:text-[#FFA07A]'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                                }`}
                            >
                                Tahun Ini
                            </button>
                        </div>
                    </div>

                    {/* 4 Cards Grid */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* 1. Telat */}
                        {renderTopCard({
                            title: 'Paling Banyak Telat',
                            subtitle: `Siswa terlambat (${topPeriod === 'monthly' ? 'Bulan Ini' : 'Tahun Ini'})`,
                            icon: Clock,
                            accentColor: 'purple',
                            items: currentTopData.terlambat,
                            badgeSuffix: 'x Terlambat',
                            extraInfoKey: 'minutes',
                        })}

                        {/* 2. Sakit */}
                        {renderTopCard({
                            title: 'Paling Banyak Sakit',
                            subtitle: `Siswa sakit (${topPeriod === 'monthly' ? 'Bulan Ini' : 'Tahun Ini'})`,
                            icon: Activity,
                            accentColor: 'amber',
                            items: currentTopData.sakit,
                            badgeSuffix: 'x Sakit',
                        })}

                        {/* 3. Izin */}
                        {renderTopCard({
                            title: 'Paling Banyak Izin',
                            subtitle: `Siswa izin (${topPeriod === 'monthly' ? 'Bulan Ini' : 'Tahun Ini'})`,
                            icon: FileText,
                            accentColor: 'blue',
                            items: currentTopData.izin,
                            badgeSuffix: 'x Izin',
                        })}

                        {/* 4. Alpha */}
                        {renderTopCard({
                            title: 'Paling Banyak Alpa',
                            subtitle: `Siswa tanpa ket. (${topPeriod === 'monthly' ? 'Bulan Ini' : 'Tahun Ini'})`,
                            icon: UserX,
                            accentColor: 'rose',
                            items: currentTopData.alpha,
                            badgeSuffix: 'x Alpa',
                        })}
                    </div>
                </div>

                {/* 4. Filter Bar */}
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
                                    <th className="hidden sm:table-cell px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
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
                                            <td className="hidden sm:table-cell px-5 py-3.5 font-mono text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                                <div>{student.nisn}</div>
                                                <div className="text-[11px] text-gray-400">NIS: {student.nis}</div>
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-[#1F2937] dark:text-white">
                                                <div>{student.name}</div>
                                                <div className="text-[11px] font-normal text-gray-400 font-mono sm:hidden">
                                                    NISN: {student.nisn}
                                                </div>
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
