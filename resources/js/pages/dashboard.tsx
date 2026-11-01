import { useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
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
    FileText,
    UserX,
} from 'lucide-react';
import { PageBanner } from '@/components/page-banner';
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
    classrooms?: ClassroomData[];
    selectedClassroomId?: number;
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
    students?: StudentAttendanceRow[];
}

export default function Dashboard({
    selectedClassroomId,
    selectedDate,
    isFutureDate = false,
    holiday,
    stats,
    recap,
    top_students,
}: DashboardProps) {
    const { props } = usePage();
    const user = props.auth?.user as { name?: string } | undefined;
    const greetingTitle = user?.name
        ? `Selamat Datang Bapak/Ibu ${user.name}`
        : 'Selamat Datang Bapak/Ibu';

    const todayStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
    const isFuture = isFutureDate || selectedDate > todayStr;

    const [topPeriod, setTopPeriod] = useState<'yearly' | 'monthly'>('yearly');

    const currentTopData = useMemo(() => {
        if (!top_students) {
            return { terlambat: [], sakit: [], izin: [], alpha: [] };
        }
        return top_students[topPeriod] ?? { terlambat: [], sakit: [], izin: [], alpha: [] };
    }, [top_students, topPeriod]);

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

    const exportUrl = selectedClassroomId
        ? `/reports/export?classroom_id=${selectedClassroomId}&start_date=${selectedDate}&end_date=${selectedDate}`
        : `/reports/export?start_date=${selectedDate}&end_date=${selectedDate}`;

    return (
        <>
            <Head title="Dashboard - AbsensiKu" />
            <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8 bg-page-gradient min-h-screen">
                {/* 1. Page Banner */}
                <PageBanner
                    badgeText={`Hari Ini • ${selectedDate}`}
                    title={greetingTitle}
                    description="Sistem presensi siswa terpadu dengan pencatatan kehadiran realtime, keterlambatan otomatis, dan verifikasi izin pulang awal."
                    action={
                        <div className="flex flex-wrap gap-2.5">
                            <Button
                                asChild
                                variant="secondary"
                                className="bg-white text-[#FF6B35] hover:bg-[#FFFBE6] shadow-sm font-bold border-none"
                            >
                                <a href={exportUrl}>
                                    <Download className="size-4 mr-1.5" />
                                    Export Rekap Excel
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
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-[#111827] dark:text-white">
                                Rekap Status Kehadiran
                            </h2>
                            <span className="rounded-full bg-[#FFF4ED] px-2.5 py-0.5 text-xs font-semibold text-[#FF6B35] dark:bg-[#3D2520] dark:text-[#FFA07A]">
                                Harian, Bulanan & Tahunan
                            </span>
                        </div>
                        <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                            Ringkasan akumulasi kehadiran siswa berdasarkan rentang waktu harian, bulanan, dan tahunan.
                        </p>
                    </div>

                    {/* Summary Comparison Cards (Harian, Bulanan, Tahunan) */}
                    {recap && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {(['daily', 'monthly', 'yearly'] as const).map((pKey) => {
                                const item = recap[pKey];
                                return (
                                    <div
                                        key={pKey}
                                        className="rounded-2xl border-2 border-gray-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]"
                                    >
                                        <div className="flex items-center justify-between mb-3.5 border-b border-gray-100 pb-3 dark:border-gray-800">
                                            <div>
                                                <span className="text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                                    {item.label}
                                                </span>
                                                <div className="text-sm font-extrabold text-gray-900 dark:text-white mt-0.5">
                                                    {item.sublabel}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-[#0D9488] dark:bg-emerald-950/60 dark:text-emerald-300">
                                                    {item.attendance_rate}% Hadir
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-5 gap-2 text-center text-xs">
                                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-2">
                                                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">Hadir</div>
                                                <div className="text-sm font-black text-emerald-800 dark:text-emerald-300 mt-0.5">{item.total_hadir}</div>
                                            </div>
                                            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 p-2">
                                                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase">Sakit</div>
                                                <div className="text-sm font-black text-amber-800 dark:text-amber-300 mt-0.5">{item.total_sakit}</div>
                                            </div>
                                            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-2">
                                                <div className="text-[10px] text-blue-700 dark:text-blue-400 font-bold uppercase">Izin</div>
                                                <div className="text-sm font-black text-blue-800 dark:text-blue-300 mt-0.5">{item.total_izin}</div>
                                            </div>
                                            <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 p-2">
                                                <div className="text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase">Alpa</div>
                                                <div className="text-sm font-black text-rose-800 dark:text-rose-300 mt-0.5">{item.total_alpha}</div>
                                            </div>
                                            <div className="rounded-xl bg-purple-50 dark:bg-purple-950/40 p-2">
                                                <div className="text-[10px] text-purple-700 dark:text-purple-400 font-bold uppercase">Telat</div>
                                                <div className="text-sm font-black text-purple-800 dark:text-purple-300 mt-0.5">{item.total_terlambat}</div>
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
                            title: 'Terbanyak Telat',
                            subtitle: `Siswa terlambat (${topPeriod === 'monthly' ? 'Bulan Ini' : 'Tahun Ini'})`,
                            icon: Clock,
                            accentColor: 'purple',
                            items: currentTopData.terlambat,
                            badgeSuffix: 'x Terlambat',
                            extraInfoKey: 'minutes',
                        })}

                        {/* 2. Sakit */}
                        {renderTopCard({
                            title: 'Terbanyak Sakit',
                            subtitle: `Siswa sakit (${topPeriod === 'monthly' ? 'Bulan Ini' : 'Tahun Ini'})`,
                            icon: Activity,
                            accentColor: 'amber',
                            items: currentTopData.sakit,
                            badgeSuffix: 'x Sakit',
                        })}

                        {/* 3. Izin */}
                        {renderTopCard({
                            title: 'Terbanyak Izin',
                            subtitle: `Siswa izin (${topPeriod === 'monthly' ? 'Bulan Ini' : 'Tahun Ini'})`,
                            icon: FileText,
                            accentColor: 'blue',
                            items: currentTopData.izin,
                            badgeSuffix: 'x Izin',
                        })}

                        {/* 4. Alpha */}
                        {renderTopCard({
                            title: 'Terbanyak Alpa',
                            subtitle: `Siswa tanpa ket. (${topPeriod === 'monthly' ? 'Bulan Ini' : 'Tahun Ini'})`,
                            icon: UserX,
                            accentColor: 'rose',
                            items: currentTopData.alpha,
                            badgeSuffix: 'x Alpa',
                        })}
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
