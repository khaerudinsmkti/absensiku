import { Head, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    CalendarRange,
    Clock,
    Download,
    FileDown,
    FileSpreadsheet,
    FileText,
    Filter,
    Layers,
    Percent,
    Printer,
    Table as TableIcon,
    UserCheck,
    Users,
} from 'lucide-react';
import React, { useState } from 'react';
import { PageBanner } from '@/components/page-banner';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import type { ClassroomData } from '@/types/attendance';

interface DayInfo {
    date: string;
    day: number;
    day_name: string;
    day_initial?: string;
    is_sunday: boolean;
    is_saturday?: boolean;
    is_weekend?: boolean;
    is_holiday?: boolean;
    holiday_name?: string | null;
    holiday_type?: string | null;
    holiday_type_name?: string | null;
    holiday_description?: string | null;
}

interface DailyAttendanceInfo {
    code: 'H' | 'T' | 'S' | 'I' | 'A' | 'L' | '-' | '.';
    status: string;
    is_late: boolean;
    notes?: string | null;
}

interface StudentReportRow {
    id: number;
    nisn: string;
    nis: string;
    name: string;
    gender: 'L' | 'P';
    hadir: number;
    sakit: number;
    izin: number;
    alpha: number;
    terlambat: number;
    pulang_awal: number;
    percentage: number;
    daily_attendances?: Record<number, DailyAttendanceInfo>;
}

interface ReportsProps {
    classrooms: ClassroomData[];
    selectedClassroomId: number;
    filterType: 'monthly' | 'yearly' | 'custom';
    month: number;
    year: number;
    monthName: string;
    startDate: string;
    endDate: string;
    periodLabel: string;
    days: DayInfo[];
    students: StudentReportRow[];
    dailyTotals: Record<
        number,
        {
            hadir: number;
            sakit: number;
            izin: number;
            alpha: number;
            terlambat: number;
            is_sunday: boolean;
            is_holiday?: boolean;
            holiday_name?: string | null;
        }
    >;
    summary: {
        total_students: number;
        total_hadir: number;
        total_sakit: number;
        total_izin: number;
        total_alpha: number;
        total_terlambat: number;
        total_pulang_awal?: number;
        effective_school_days?: number;
    };
    genderStats?: {
        male: number;
        female: number;
        total: number;
    };
    monthNames: Record<number, string>;
    periodHolidays?: Array<{
        id: number;
        name: string;
        formatted_dates: string;
        type: string;
        type_name: string;
        description?: string | null;
    }>;
}

export default function ReportsPage({
    classrooms = [],
    selectedClassroomId,
    filterType = 'monthly',
    month = new Date().getMonth() + 1,
    year = new Date().getFullYear(),
    monthName = '',
    startDate,
    endDate,
    periodLabel,
    days = [],
    students = [],
    dailyTotals = {},
    summary,
    genderStats,
    monthNames = {},
    periodHolidays = [],
}: ReportsProps) {
    const { school } = usePage<{
        school?: {
            name?: string;
            address?: string;
            city?: string;
            principal_name?: string;
            principal_nip?: string;
        };
    }>().props;

    const [classId, setClassId] = useState(selectedClassroomId);
    const [currentFilterType, setCurrentFilterType] = useState<'monthly' | 'yearly' | 'custom'>(filterType);
    const [selectedMonth, setSelectedMonth] = useState(month);
    const [selectedYear, setSelectedYear] = useState(year);
    const [start, setStart] = useState(startDate);
    const [end, setEnd] = useState(endDate);

    // View tab toggle: 'matrix' (Daily 1-31) vs 'summary' (Totals)
    const [viewMode, setViewMode] = useState<'matrix' | 'summary'>(days.length > 0 ? 'matrix' : 'summary');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/reports',
            {
                classroom_id: classId,
                filter_type: currentFilterType,
                month: selectedMonth,
                year: selectedYear,
                start_date: start,
                end_date: end,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const currentClass = classrooms.find((c) => c.id === selectedClassroomId);

    // Export links query string
    const exportQueryParams = `classroom_id=${selectedClassroomId}&filter_type=${currentFilterType}&month=${selectedMonth}&year=${selectedYear}&start_date=${startDate}&end_date=${endDate}`;

    // Available years: 3 years back to 2 years ahead
    const currentYr = new Date().getFullYear();
    const yearsList = [currentYr - 2, currentYr - 1, currentYr, currentYr + 1];

    return (
        <>
            <Head title="Rekap & Laporan Presensi - AbsensiKu" />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 bg-page-gradient min-h-screen">
                {/* Header Banner */}
                <PageBanner
                    badgeText="Laporan & Audit Presensi"
                    title="Rekapitulasi Kehadiran Siswa 📊"
                    description={`Pantau data kehadiran berkala (bulanan, tahunan, atau rentang kustom). Dilengkapi matriks harian tanggal 1-31 serta fitur cetak & unduh PDF resmi.`}
                    action={
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Download PDF Button */}
                            <Button
                                asChild
                                variant="secondary"
                                className="bg-red-600 hover:bg-red-700 text-white shadow-sm font-bold border-none text-xs gap-1.5"
                            >
                                <a href={`/reports/export-pdf?${exportQueryParams}`} target="_blank" rel="noopener noreferrer">
                                    <FileDown className="size-4" />
                                    Download PDF
                                </a>
                            </Button>

                            {/* Export Excel Button */}
                            <Button
                                asChild
                                variant="secondary"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold border-none text-xs gap-1.5"
                            >
                                <a href={`/reports/export?${exportQueryParams}`}>
                                    <FileSpreadsheet className="size-4" />
                                    Ekspor Excel
                                </a>
                            </Button>

                            {/* Print Button */}
                        </div>
                    }
                />

                {/* Filter Card */}
                <form
                    onSubmit={handleFilter}
                    className="flex flex-col gap-4 rounded-[20px] border-2 border-[#E8E8E8] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]"
                >
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4 dark:border-gray-800">
                        {/* Filter Type Toggle Buttons */}
                        <div className="flex items-center gap-1.5 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                            <button
                                type="button"
                                onClick={() => setCurrentFilterType('monthly')}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                    currentFilterType === 'monthly'
                                        ? 'bg-white text-[#FF6B35] shadow-sm dark:bg-gray-700 dark:text-white'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                                }`}
                            >
                                📅 Laporan Bulanan
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentFilterType('yearly')}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                    currentFilterType === 'yearly'
                                        ? 'bg-white text-[#FF6B35] shadow-sm dark:bg-gray-700 dark:text-white'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                                }`}
                            >
                                🗓️ Laporan Tahunan
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentFilterType('custom')}
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                    currentFilterType === 'custom'
                                        ? 'bg-white text-[#FF6B35] shadow-sm dark:bg-gray-700 dark:text-white'
                                        : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                                }`}
                            >
                                ⏳ Rentang Kustom
                            </button>
                        </div>

                        {/* View Mode Toggle: Matrix 1-31 vs Ringkasan */}
                        {days.length > 0 && (
                            <div className="flex items-center gap-1.5 rounded-xl bg-orange-50/80 p-1 border border-orange-200/50 dark:bg-orange-950/40 dark:border-orange-900/50">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('matrix')}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-extrabold transition-all ${
                                        viewMode === 'matrix'
                                            ? 'bg-[#FF6B35] text-white shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
                                    }`}
                                >
                                    <TableIcon className="size-3.5" />
                                    Matriks Tanggal 1-31
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('summary')}
                                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-extrabold transition-all ${
                                        viewMode === 'summary'
                                            ? 'bg-[#FF6B35] text-white shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-300'
                                    }`}
                                >
                                    <Layers className="size-3.5" />
                                    Ringkasan Total
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Inputs Filter Row */}
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Classroom Picker */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                                Kelas:
                            </span>
                            <select
                                value={classId || ''}
                                onChange={(e) => setClassId(Number(e.target.value))}
                                className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800 focus:border-[#FF6B35] outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            >
                                {classrooms.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Monthly Picker: Month & Year */}
                        {currentFilterType === 'monthly' && (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                                        Bulan:
                                    </span>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                        className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800 focus:border-[#FF6B35] outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    >
                                        {Object.entries(monthNames).map(([mNum, mName]) => (
                                            <option key={mNum} value={mNum}>
                                                {mName}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                                        Tahun:
                                    </span>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                                        className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800 focus:border-[#FF6B35] outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    >
                                        {yearsList.map((yr) => (
                                            <option key={yr} value={yr}>
                                                {yr}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Yearly Picker: Year */}
                        {currentFilterType === 'yearly' && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                                    Tahun Pelajaran:
                                </span>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3.5 py-1.5 text-xs font-bold text-gray-800 focus:border-[#FF6B35] outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                >
                                    {yearsList.map((yr) => (
                                        <option key={yr} value={yr}>
                                            Tahun {yr}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Custom Date Range Picker */}
                        {currentFilterType === 'custom' && (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                                        Dari:
                                    </span>
                                    <input
                                        type="date"
                                        value={start}
                                        onChange={(e) => setStart(e.target.value)}
                                        className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 focus:border-[#FF6B35] outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                                        Sampai:
                                    </span>
                                    <input
                                        type="date"
                                        value={end}
                                        onChange={(e) => setEnd(e.target.value)}
                                        className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 focus:border-[#FF6B35] outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>
                            </>
                        )}

                        {/* Submit Filter Button */}
                        <Button
                            type="submit"
                            variant="primary"
                            className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand font-bold text-xs px-5 py-2 ml-auto"
                        >
                            <Filter className="size-3.5 mr-1.5" />
                            Tampilkan Laporan
                        </Button>
                    </div>
                </form>

                {/* Holiday Banner for current period */}
                {periodHolidays && periodHolidays.length > 0 && (
                    <div className="rounded-[18px] border-2 border-amber-300/60 bg-amber-50/70 p-4 text-xs dark:border-amber-900/50 dark:bg-amber-950/30 shadow-sm">
                        <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 mb-2">
                            <CalendarRange className="size-4 text-amber-600 dark:text-amber-400" />
                            <span>Hari Libur Resmi pada Periode Ini (Otomatis Tidak Dihitung dalam Absensi):</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {periodHolidays.map((h) => (
                                <span
                                    key={h.id}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-gray-800 border border-amber-200/80 shadow-sm dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
                                >
                                    <span className="font-extrabold text-[#FF6B35]">{h.formatted_dates}:</span>
                                    <span>{h.name}</span>
                                    <span className="text-[10px] text-gray-500 font-normal">({h.type_name})</span>
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Summary Stat Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-6">
                    <StatCard
                        title="Total Siswa"
                        value={summary?.total_students || 0}
                        icon={Users}
                        variant="primary"
                    />
                    <StatCard
                        title="Total Hadir"
                        value={summary?.total_hadir || 0}
                        icon={UserCheck}
                        variant="success"
                    />
                    <StatCard
                        title="Total Sakit"
                        value={summary?.total_sakit || 0}
                        icon={Calendar}
                        variant="info"
                    />
                    <StatCard
                        title="Total Izin"
                        value={summary?.total_izin || 0}
                        icon={Calendar}
                        variant="warning"
                    />
                    <StatCard
                        title="Total Alpha"
                        value={summary?.total_alpha || 0}
                        icon={Calendar}
                        variant="danger"
                    />
                    <StatCard
                        title="Total Terlambat"
                        value={summary?.total_terlambat || 0}
                        icon={Clock}
                        variant="purple"
                    />
                </div>

                {/* Main Content Card: Matriks Tanggal 1-31 atau Ringkasan Total */}
                <div className="overflow-hidden rounded-[20px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                    {/* Subheader Title */}
                    <div className="flex flex-wrap items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800 gap-2">
                        <div>
                            <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                                {viewMode === 'matrix' && days.length > 0
                                    ? `Matriks Presensi Harian: ${currentClass?.name || 'Semua Kelas'} (${periodLabel})`
                                    : `Rekapitulasi Akumulasi: ${currentClass?.name || 'Semua Kelas'} (${periodLabel})`}
                            </h2>
                            <p className="text-xs text-gray-500">
                                Wali Kelas:{' '}
                                <span className="font-bold text-gray-700 dark:text-gray-300">
                                    {currentClass?.homeroom_teacher?.name || '-'}
                                </span>
                            </p>
                        </div>

                        {/* Legend in Header */}
                        {viewMode === 'matrix' && days.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    H = Hadir
                                </span>
                                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                                    T = Terlambat
                                </span>
                                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                    S = Sakit
                                </span>
                                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                    I = Izin
                                </span>
                                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
                                    A = Alpha
                                </span>
                                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300">
                                    L = Libur Resmi
                                </span>
                                <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
                                    - = Akhir Pekan
                                </span>
                            </div>
                        )}
                    </div>

                    {/* VIEW 1: MATRIKS TANGGAL 1 - 31 */}
                    {viewMode === 'matrix' && days.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 text-[#6B7280] border-b border-gray-200 uppercase tracking-wider text-[10px] dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-400">
                                        <th rowSpan={2} className="px-3 py-2 text-center sticky left-0 z-20 bg-gray-50 dark:bg-gray-800">
                                            No
                                        </th>
                                        <th rowSpan={2} className="px-3 py-2 text-left sticky left-8 z-20 bg-gray-50 dark:bg-gray-800 min-w-[140px]">
                                            Nama Siswa
                                        </th>
                                        <th rowSpan={2} className="px-2 py-2 text-center">
                                            L/P
                                        </th>
                                        <th colSpan={days.length} className="px-2 py-1 text-center border-l border-r border-gray-200 dark:border-gray-700">
                                            Tanggal Presensi (1 - {days.length})
                                        </th>
                                        <th colSpan={5} className="px-2 py-1 text-center bg-gray-100/70 dark:bg-gray-800/80 border-r border-gray-200 dark:border-gray-700">
                                            Total
                                        </th>
                                        <th rowSpan={2} className="px-3 py-2 text-center bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-extrabold">
                                            %
                                        </th>
                                    </tr>
                                    <tr className="bg-gray-100/60 text-[10px] font-bold border-b border-gray-200 dark:bg-gray-800/40 dark:border-gray-700">
                                        {/* Day numbers */}
                                        {days.map((d) => {
                                            const isRedDay = d.is_holiday || d.is_sunday || d.is_saturday;
                                            return (
                                                <th
                                                    key={d.date}
                                                    className={`px-1.5 py-1 text-center min-w-[24px] ${
                                                        isRedDay
                                                            ? 'bg-red-50 text-red-600 border-b-2 border-red-300 dark:bg-red-950/50 dark:text-red-400'
                                                            : 'text-gray-700 dark:text-gray-300'
                                                    }`}
                                                    title={
                                                        d.is_holiday
                                                            ? `Libur: ${d.holiday_name}${d.holiday_description ? ' - ' + d.holiday_description : ''}`
                                                            : `${d.day_name}, ${d.date}`
                                                    }
                                                >
                                                    <div className="font-extrabold">{d.day}</div>
                                                    <div className={`text-[8.5px] font-bold ${isRedDay ? 'text-red-600 dark:text-red-400' : 'text-gray-500 opacity-80'}`}>
                                                        {d.day_initial || d.day_name.substring(0, 1)}
                                                    </div>
                                                </th>
                                            );
                                        })}

                                        {/* Total columns header */}
                                        <th className="px-2 py-1 text-center text-emerald-700 bg-emerald-50/50 dark:text-emerald-400">H</th>
                                        <th className="px-2 py-1 text-center text-blue-700 bg-blue-50/50 dark:text-blue-400">S</th>
                                        <th className="px-2 py-1 text-center text-amber-700 bg-amber-50/50 dark:text-amber-400">I</th>
                                        <th className="px-2 py-1 text-center text-red-700 bg-red-50/50 dark:text-red-400">A</th>
                                        <th className="px-2 py-1 text-center text-purple-700 bg-purple-50/50 dark:text-purple-400">T</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {students.length === 0 ? (
                                        <tr>
                                            <td colSpan={days.length + 9} className="px-5 py-8 text-center text-gray-500">
                                                Tidak ada data siswa ditemukan untuk kelas dan periode yang dipilih.
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((student, idx) => (
                                            <tr
                                                key={student.id}
                                                className="hover:bg-gray-50/80 transition-colors dark:hover:bg-gray-800/30"
                                            >
                                                {/* Sticky No */}
                                                <td className="px-3 py-2 text-center font-bold text-gray-400 sticky left-0 bg-white dark:bg-[#18122B]">
                                                    {idx + 1}
                                                </td>

                                                {/* Sticky Name */}
                                                <td className="px-3 py-2 font-bold text-gray-900 sticky left-8 bg-white dark:bg-[#18122B] dark:text-white whitespace-nowrap">
                                                    <div>{student.name}</div>
                                                    <div className="text-[10px] font-mono font-normal text-gray-400">
                                                        {student.nisn}
                                                    </div>
                                                </td>

                                                {/* Gender */}
                                                <td className="px-2 py-2 text-center">
                                                    <span
                                                        className={`inline-flex size-5 items-center justify-center rounded text-[10px] font-bold ${
                                                            student.gender === 'L'
                                                                ? 'bg-[#E8FAF9] text-[#0D9488]'
                                                                : 'bg-[#EDE9FE] text-[#7C3AED]'
                                                        }`}
                                                    >
                                                        {student.gender}
                                                    </span>
                                                </td>

                                                {/* Daily Attendance Columns */}
                                                {days.map((d) => {
                                                    const daily = student.daily_attendances?.[d.day];
                                                    const isRedDay = d.is_holiday || d.is_sunday || d.is_saturday;
                                                    const code = daily?.code || (d.is_holiday ? 'L' : (d.is_sunday || d.is_saturday ? '-' : '.'));
                                                    return (
                                                        <td
                                                            key={d.date}
                                                            className={`px-1 py-1 text-center text-[11px] font-bold ${
                                                                isRedDay
                                                                    ? 'bg-red-50/50 dark:bg-red-950/20'
                                                                    : ''
                                                            }`}
                                                            title={daily?.notes || (d.is_holiday ? `${d.holiday_name || 'Hari Libur'}${d.holiday_description ? ' - ' + d.holiday_description : ''}` : undefined)}
                                                        >
                                                            {code === 'H' ? (
                                                                <span className="inline-block size-5 leading-5 rounded bg-emerald-100 text-emerald-800 font-extrabold dark:bg-emerald-950/80 dark:text-emerald-300">
                                                                    H
                                                                </span>
                                                            ) : code === 'T' ? (
                                                                <span className="inline-block size-5 leading-5 rounded bg-purple-100 text-purple-800 font-extrabold dark:bg-purple-950/80 dark:text-purple-300">
                                                                    T
                                                                </span>
                                                            ) : code === 'S' ? (
                                                                <span className="inline-block size-5 leading-5 rounded bg-blue-100 text-blue-800 font-extrabold dark:bg-blue-950/80 dark:text-blue-300">
                                                                    S
                                                                </span>
                                                            ) : code === 'I' ? (
                                                                <span className="inline-block size-5 leading-5 rounded bg-amber-100 text-amber-800 font-extrabold dark:bg-amber-950/80 dark:text-amber-300">
                                                                    I
                                                                </span>
                                                            ) : code === 'A' ? (
                                                                <span className="inline-block size-5 leading-5 rounded bg-red-100 text-red-800 font-extrabold dark:bg-red-950/80 dark:text-red-300">
                                                                    A
                                                                </span>
                                                            ) : code === 'L' || d.is_holiday ? (
                                                                <span
                                                                    className="inline-block size-5 leading-5 rounded bg-red-100 text-red-700 font-black dark:bg-red-950/80 dark:text-red-300 text-[10px]"
                                                                    title={d.holiday_name ? `${d.holiday_name}${d.holiday_description ? ' - ' + d.holiday_description : ''}` : 'Hari Libur'}
                                                                >
                                                                    L
                                                                </span>
                                                            ) : d.is_sunday || d.is_saturday ? (
                                                                <span className="text-red-300 dark:text-red-700">-</span>
                                                            ) : (
                                                                <span className="text-gray-200 dark:text-gray-800">.</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}

                                                {/* Total columns per student */}
                                                <td className="px-2 py-2 text-center font-extrabold text-emerald-600 bg-emerald-50/30">
                                                    {student.hadir}
                                                </td>
                                                <td className="px-2 py-2 text-center font-extrabold text-blue-600 bg-blue-50/30">
                                                    {student.sakit}
                                                </td>
                                                <td className="px-2 py-2 text-center font-extrabold text-amber-600 bg-amber-50/30">
                                                    {student.izin}
                                                </td>
                                                <td className="px-2 py-2 text-center font-extrabold text-red-600 bg-red-50/30">
                                                    {student.alpha}
                                                </td>
                                                <td className="px-2 py-2 text-center font-extrabold text-purple-600 bg-purple-50/30">
                                                    {student.terlambat}
                                                </td>
                                                <td className="px-2.5 py-2 text-center font-extrabold text-gray-900 dark:text-white bg-gray-50/60 dark:bg-gray-800/40">
                                                    {student.percentage}%
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>

                                {/* Total per date row footer */}
                                {students.length > 0 && (
                                    <tfoot>
                                        <tr className="bg-gray-100/80 font-bold border-t-2 border-gray-300 text-gray-800 text-[11px] dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200">
                                            <td colSpan={3} className="px-3 py-2.5 text-right font-extrabold sticky left-0 bg-gray-100 dark:bg-gray-800 z-10">
                                                Total Hadir Harian:
                                            </td>
                                            {days.map((d) => {
                                                const hCount = dailyTotals[d.day]?.hadir ?? 0;
                                                const isRedDay = d.is_holiday || d.is_sunday || d.is_saturday;
                                                return (
                                                    <td
                                                        key={d.date}
                                                        className={`px-1 py-2 text-center font-extrabold ${
                                                            isRedDay
                                                                ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 text-[10px]'
                                                                : hCount > 0
                                                                  ? 'text-emerald-700 dark:text-emerald-400'
                                                                  : 'text-gray-400'
                                                        }`}
                                                        title={d.is_holiday ? `Libur: ${d.holiday_name}` : undefined}
                                                    >
                                                        {d.is_holiday ? 'L' : (d.is_sunday || d.is_saturday ? '-' : (hCount > 0 ? hCount : '-'))}
                                                    </td>
                                                );
                                            })}
                                            <td className="px-2 py-2 text-center text-emerald-700 bg-emerald-100/50 font-black">
                                                {summary?.total_hadir || 0}
                                            </td>
                                            <td className="px-2 py-2 text-center text-blue-700 bg-blue-100/50 font-black">
                                                {summary?.total_sakit || 0}
                                            </td>
                                            <td className="px-2 py-2 text-center text-amber-700 bg-amber-100/50 font-black">
                                                {summary?.total_izin || 0}
                                            </td>
                                            <td className="px-2 py-2 text-center text-red-700 bg-red-100/50 font-black">
                                                {summary?.total_alpha || 0}
                                            </td>
                                            <td className="px-2 py-2 text-center text-purple-700 bg-purple-100/50 font-black">
                                                {summary?.total_terlambat || 0}
                                            </td>
                                            <td className="px-2 py-2 text-center font-bold text-gray-400">-</td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    ) : (
                        /* VIEW 2: RINGKASAN AKUMULASI */
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-gray-50/80 text-[#6B7280] uppercase tracking-wider text-[11px] border-b border-gray-100 dark:bg-gray-800/40 dark:border-gray-800 dark:text-gray-400">
                                        <th className="px-5 py-3.5">No</th>
                                        <th className="px-5 py-3.5">NISN / NIS</th>
                                        <th className="px-5 py-3.5">Nama Peserta Didik</th>
                                        <th className="px-5 py-3.5 text-center">L/P</th>
                                        <th className="px-4 py-3.5 text-center text-[#059669]">Hadir</th>
                                        <th className="px-4 py-3.5 text-center text-[#1D4ED8]">Sakit</th>
                                        <th className="px-4 py-3.5 text-center text-[#B45309]">Izin</th>
                                        <th className="px-4 py-3.5 text-center text-[#DC2626]">Alpha</th>
                                        <th className="px-4 py-3.5 text-center text-[#7C3AED]">Terlambat</th>
                                        <th className="px-4 py-3.5 text-center text-[#0F766E]">Pulang Awal</th>
                                        <th className="px-5 py-3.5 text-center">Persentase</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {students.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="px-5 py-8 text-center text-gray-500">
                                                Tidak ada data siswa ditemukan untuk kelas dan filter yang dipilih.
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((student, idx) => (
                                            <tr key={student.id} className="hover:bg-gray-50/70 transition-colors dark:hover:bg-gray-800/30">
                                                <td className="px-5 py-3.5 font-bold text-gray-500">{idx + 1}</td>
                                                <td className="px-5 py-3.5 font-mono text-xs text-gray-600 dark:text-gray-400">
                                                    <div>{student.nisn}</div>
                                                    <div className="text-[11px] text-gray-400">NIS: {student.nis}</div>
                                                </td>
                                                <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">{student.name}</td>
                                                <td className="px-5 py-3.5 text-center">
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
                                                <td className="px-4 py-3.5 text-center font-bold text-[#059669]">{student.hadir}</td>
                                                <td className="px-4 py-3.5 text-center font-bold text-[#1D4ED8]">{student.sakit}</td>
                                                <td className="px-4 py-3.5 text-center font-bold text-[#B45309]">{student.izin}</td>
                                                <td className="px-4 py-3.5 text-center font-bold text-[#DC2626]">{student.alpha}</td>
                                                <td className="px-4 py-3.5 text-center font-bold text-[#7C3AED]">{student.terlambat}</td>
                                                <td className="px-4 py-3.5 text-center font-bold text-[#0F766E]">{student.pulang_awal}</td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
                                                            student.percentage >= 80
                                                                ? 'bg-[#DCFCE7] text-[#059669]'
                                                                : student.percentage >= 60
                                                                  ? 'bg-[#FEF3C7] text-[#B45309]'
                                                                  : 'bg-[#FEE2E2] text-[#DC2626]'
                                                        }`}
                                                    >
                                                        {student.percentage}%
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Keterangan Status, Catatan Libur Nasional & Rekapitulasi Gender Siswa */}
                    <div className="border-t border-gray-200 p-5 bg-white dark:border-gray-800 dark:bg-[#18122B] flex flex-col gap-3.5">
                        {/* Keterangan Status Simbol */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="font-bold text-gray-700 dark:text-gray-300 mr-1">Keterangan:</span>
                            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[11px]">
                                H = Hadir
                            </span>
                            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-bold text-[11px]">
                                T = Terlambat
                            </span>
                            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-bold text-[11px]">
                                S = Sakit
                            </span>
                            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold text-[11px]">
                                I = Izin
                            </span>
                            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 font-bold text-[11px]">
                                A = Alpha
                            </span>
                            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300 font-bold text-[11px]">
                                L = Libur Resmi (Tidak Dihitung)
                            </span>
                            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 font-bold text-[11px]">
                                - = Libur Akhir Pekan (Sabtu / Minggu)
                            </span>
                        </div>

                        {/* Catatan Hari Libur Kalender Pendidikan (Tulisan Miring & Deskripsi) */}
                        {periodHolidays && periodHolidays.length > 0 && (
                            <div className="rounded-xl border border-red-200 bg-red-50/60 p-3 text-xs text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200">
                                <div className="flex items-center gap-1.5 font-bold mb-1 text-red-800 dark:text-red-300">
                                    <CalendarRange className="size-3.5 text-red-600 dark:text-red-400" />
                                    <span>Catatan Hari Libur Kalender Pendidikan:</span>
                                </div>
                                <div className="space-y-1 pl-5">
                                    {periodHolidays.map((h) => (
                                        <p key={h.id} className="italic text-[11px] text-red-800 dark:text-red-300">
                                            * {h.formatted_dates}: <span className="font-bold">{h.name}</span> ({h.type_name})
                                            {h.description ? ` — ${h.description}` : ''}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Baris Paling Bawah: Keterangan Jumlah Siswa */}
                        <div className="border-t border-dashed border-gray-200 pt-3 dark:border-gray-700 flex flex-wrap items-center gap-4 text-xs">
                            <span className="font-extrabold text-gray-800 dark:text-gray-200">
                                Keterangan:
                            </span>
                            <span className="rounded-md bg-blue-50 px-2.5 py-1 text-blue-900 font-bold dark:bg-blue-950/50 dark:text-blue-300">
                                Jumlah laki-laki = {genderStats?.male ?? 0}
                            </span>
                            <span className="rounded-md bg-pink-50 px-2.5 py-1 text-pink-900 font-bold dark:bg-pink-950/50 dark:text-pink-300">
                                Jumlah perempuan = {genderStats?.female ?? 0}
                            </span>
                            <span className="rounded-md bg-gray-100 px-2.5 py-1 text-gray-900 font-extrabold dark:bg-gray-800 dark:text-white">
                                Total = {genderStats?.total ?? 0}
                            </span>
                        </div>
                    </div>

                    {/* Lembar Pengesahan / Tanda Tangan Resmi */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6 p-6 border-t border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/30 text-xs">
                        <div className="text-center sm:text-left text-gray-500">
                            <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                                {school?.name || 'SD Digital Indonesia'}
                            </p>
                            <p className="text-[11px] text-gray-500">
                                {school?.address ? `${school.address}, ` : ''}{school?.city || 'Jakarta'}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">Dicetak melalui Sistem Informasi Presensi Siswa (AbsensiKu)</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-8 justify-center sm:justify-end">
                            <div className="text-center min-w-[170px]">
                                <p className="text-gray-600 dark:text-gray-400 text-xs">
                                    Wali Kelas {currentClass?.name || ''}
                                </p>
                                <div className="h-14 flex items-center justify-center">
                                    <span className="text-[9px] italic text-gray-300 dark:text-gray-700">(Tanda Tangan)</span>
                                </div>
                                <p className="font-extrabold text-gray-900 dark:text-white underline text-sm">
                                    {currentClass?.homeroom_teacher?.name || '-'}
                                </p>
                                <p className="text-[11px] text-gray-500 font-mono">
                                    NIP. {currentClass?.homeroom_teacher?.nip || '-'}
                                </p>
                            </div>

                            <div className="text-center min-w-[170px]">
                                <p className="text-gray-600 dark:text-gray-400 text-xs">
                                    {school?.city || 'Kota'}, {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
                                </p>
                                <p className="font-bold text-gray-900 dark:text-white">
                                    Kepala Sekolah,
                                </p>
                                <div className="h-12 flex items-center justify-center">
                                    <span className="text-[9px] italic text-gray-300 dark:text-gray-700">(Cap & Tanda Tangan)</span>
                                </div>
                                <p className="font-extrabold text-gray-900 dark:text-white underline text-sm">
                                    {school?.principal_name || 'Drs. H. Mulyadi, M.Pd.'}
                                </p>
                                <p className="text-[11px] text-gray-500 font-mono">
                                    NIP. {school?.principal_nip || '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

ReportsPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Rekapitulasi & Laporan', href: '/reports' },
    ],
};
