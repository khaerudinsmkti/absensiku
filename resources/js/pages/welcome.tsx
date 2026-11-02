import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    Calendar,
    CalendarCheck,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock,
    Info,
    Sparkles,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';
import { dashboard, login } from '@/routes';

interface SchoolProp {
    name?: string;
    logo_url?: string | null;
}

interface DayCalendarItem {
    date: string;
    day: number;
    day_of_week: number;
    day_name: string;
    is_sunday: boolean;
    is_saturday?: boolean;
    is_saturday_off?: boolean;
    is_holiday: boolean;
    is_off: boolean;
    is_today: boolean;
    holiday_name?: string | null;
    holiday_type?: string | null;
    holiday_type_name?: string | null;
    holiday_description?: string | null;
}

interface HolidayItem {
    id: number;
    name: string;
    type: string;
    type_name: string;
    start_date: string;
    end_date: string;
    formatted_dates: string;
    description?: string | null;
}

interface CalendarData {
    month: number;
    year: number;
    month_name: string;
    is_current_month: boolean;
    prev_month: number;
    prev_year: number;
    next_month: number;
    next_year: number;
    first_day_of_week: number;
    days_count: number;
    days: DayCalendarItem[];
    holidays: HolidayItem[];
    effective_days: number;
    holiday_days: number;
    total_days: number;
    school_days_per_week?: number;
    is_saturday_holiday?: boolean;
}

interface WelcomeProps {
    calendar?: CalendarData;
}

export default function Welcome({ calendar }: WelcomeProps) {
    const { auth, school } = usePage<{ auth: any; school?: SchoolProp }>().props;
    const schoolName = school?.name || 'AbsensiKu SD';
    const logoUrl = school?.logo_url;

    const navigateMonth = (targetMonth: number, targetYear: number) => {
        router.get(
            '/',
            { month: targetMonth, year: targetYear },
            { preserveScroll: true, preserveState: true },
        );
    };

    const resetToCurrentMonth = () => {
        router.get('/', {}, { preserveScroll: true, preserveState: true });
    };

    const dayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    return (
        <>
            <Head title={`${schoolName} - Sistem Presensi Siswa Digital`} />
            <div className="flex min-h-screen flex-col bg-page-gradient text-[#1F2937] dark:text-neutral-100">
                {/* Navbar */}
                <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#E8E8E8] bg-white/80 px-6 backdrop-blur-md lg:px-12 dark:border-[#2D234A] dark:bg-[#18122B]/80">
                    <div className="flex items-center gap-3">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={schoolName}
                                className="size-10 object-contain rounded-xl bg-white p-1 shadow-md border border-[#E8E8E8] dark:border-[#2D234A]"
                            />
                        ) : (
                            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#FFE66D] text-white shadow-md shadow-[#FF6B35]/25">
                                <AppLogoIcon className="size-6 text-white" />
                            </div>
                        )}
                        <div>
                            <span className="text-lg font-black tracking-tight text-[#111827] dark:text-white leading-tight">
                                {schoolName}
                            </span>
                            <span className="ml-1.5 rounded bg-[#FFF0EB] px-1.5 py-0.5 text-[10px] font-bold text-[#FF6B35] dark:bg-[#3D1A10]">
                                PRESENSI DIGITAL
                            </span>
                        </div>
                    </div>

                    <nav className="flex items-center gap-3">
                        {auth.user ? (
                            <Button asChild variant="primary">
                                <Link href={dashboard()}>
                                    Buka Dashboard
                                    <ArrowRight className="size-4" />
                                </Link>
                            </Button>
                        ) : (
                            <Button asChild variant="primary" size="sm">
                                <Link href={login()}>Masuk ke Sistem</Link>
                            </Button>
                        )}
                    </nav>
                </header>

                {/* Hero Section */}
                <main className="flex-1">
                    <section className="relative overflow-hidden px-6 pt-12 pb-16 lg:px-12 lg:pt-16 lg:pb-24">
                        {/* Background blobs */}
                        <div className="pointer-events-none absolute -top-20 -left-20 size-[450px] rounded-full bg-[#FF6B35]/15 blur-3xl" />
                        <div className="pointer-events-none absolute top-1/2 -right-20 size-[450px] rounded-full bg-[#4ECDC4]/20 blur-3xl" />

                        <div className="relative z-10 mx-auto max-w-5xl text-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[#FF6B35]/30 bg-[#FFF0EB] px-4 py-1.5 text-xs font-bold text-[#FF6B35] shadow-xs dark:border-[#FF6B35]/30 dark:bg-[#331C1A] dark:text-[#FF8C5A]">
                                <Sparkles className="size-4" />
                                Standar Baru Presensi Sekolah Dasar Modern
                            </div>

                            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-[#111827] sm:text-6xl dark:text-white leading-[1.15]">
                                Pengelolaan Presensi Siswa yang{' '}
                                <span className="bg-gradient-to-r from-[#FF6B35] via-[#F59E0B] to-[#4ECDC4] bg-clip-text text-transparent">
                                    Cepat, Akurat, & Ceria
                                </span>
                            </h1>

                            <p className="mx-auto mt-6 max-w-2xl text-base text-[#6B7280] sm:text-lg dark:text-[#9CA3AF] leading-relaxed">
                                AbsensiKu menghadirkan pengalaman pencatatan kehadiran yang ramah untuk guru kelas, piket, dan staf sekolah. Dilengkapi rekap otomatis, pantau terlambat, kalender pendidikan terpadu, dan cetak laporan instan.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                                {auth.user ? (
                                    <Button asChild size="lg" variant="primary">
                                        <Link href={dashboard()}>
                                            Menuju Dashboard
                                            <ArrowRight className="size-5" />
                                        </Link>
                                    </Button>
                                ) : (
                                    <Button asChild size="lg" variant="primary">
                                        <Link href={login()}>
                                            Masuk ke Portal Presensi
                                            <ArrowRight className="size-5" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>

                        {/* SECTION: Kalender Pendidikan Bulan Berjalan */}
                        {calendar && (
                            <div className="relative z-10 mx-auto mt-16 max-w-6xl">
                                <div className="rounded-[24px] border-2 border-[#E8E8E8] bg-white/95 p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md sm:p-8 dark:border-[#2D234A] dark:bg-[#18122B]/95">
                                    {/* Calendar Header with Controls */}
                                    <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                                        <div>
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950/60 dark:text-[#FFA07A]">
                                                    <CalendarDays className="size-5" />
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-black text-[#111827] dark:text-white">
                                                        Kalender Pendidikan
                                                    </h2>
                                                    <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                                        Jadwal hari efektif belajar dan agenda libur resmi sekolah.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Month Controls & Active Badge */}
                                        <div className="flex items-center gap-2 self-start sm:self-auto">
                                            <button
                                                type="button"
                                                onClick={() => navigateMonth(calendar.prev_month, calendar.prev_year)}
                                                className="flex size-9 items-center justify-center rounded-xl border-2 border-gray-200 bg-white text-gray-700 shadow-xs transition-all hover:border-[#FF6B35] hover:text-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-[#FF6B35]"
                                                title="Bulan Sebelumnya"
                                            >
                                                <ChevronLeft className="size-4.5" />
                                            </button>

                                            <div className="flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-3.5 py-1.5 shadow-xs dark:border-gray-700 dark:bg-gray-800">
                                                <Calendar className="size-4 text-[#FF6B35]" />
                                                <span className="text-sm font-extrabold text-[#111827] dark:text-white">
                                                    {calendar.month_name}
                                                </span>
                                                {calendar.is_current_month ? (
                                                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                        Bulan Berjalan
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={resetToCurrentMonth}
                                                        className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-[#FF6B35] hover:bg-orange-200 dark:bg-orange-950 dark:text-[#FFA07A]"
                                                    >
                                                        Hari Ini
                                                    </button>
                                                )}
                                                {calendar.school_days_per_week === 5 && (
                                                    <span className="hidden sm:inline-flex rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                                        5 Hari Sekolah
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => navigateMonth(calendar.next_month, calendar.next_year)}
                                                className="flex size-9 items-center justify-center rounded-xl border-2 border-gray-200 bg-white text-gray-700 shadow-xs transition-all hover:border-[#FF6B35] hover:text-[#FF6B35] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-[#FF6B35]"
                                                title="Bulan Berikutnya"
                                            >
                                                <ChevronRight className="size-4.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Quick Metric Pills */}
                                    <div className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-200/60 dark:bg-emerald-950/30 dark:border-emerald-900/40">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                                                <span className="text-base font-black">🎒</span>
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-emerald-900 dark:text-emerald-200 leading-tight">
                                                    {Math.round(calendar.effective_days)} Hari
                                                </div>
                                                <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                                    Efektif Belajar
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-2xl bg-rose-50/70 p-3.5 border border-rose-200/60 dark:bg-rose-950/30 dark:border-rose-900/40">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                                                <span className="text-base font-black">🏖️</span>
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-rose-900 dark:text-rose-200 leading-tight">
                                                    {Math.round(calendar.holiday_days)} Hari
                                                </div>
                                                <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                                                    Libur & Akhir Pekan
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-2xl bg-amber-50/70 p-3.5 border border-amber-200/60 dark:bg-amber-950/30 dark:border-amber-900/40">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                                                <span className="text-base font-black">📌</span>
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-amber-900 dark:text-amber-200 leading-tight">
                                                    {calendar.holidays.length} Agenda
                                                </div>
                                                <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                                    Hari Libur Resmi
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 rounded-2xl bg-blue-50/70 p-3.5 border border-blue-200/60 dark:bg-blue-950/30 dark:border-blue-900/40">
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                                                <span className="text-base font-black">📅</span>
                                            </div>
                                            <div>
                                                <div className="text-lg font-black text-blue-900 dark:text-blue-200 leading-tight">
                                                    {Math.round(calendar.total_days)} Hari
                                                </div>
                                                <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                                                    Total Bulan Ini
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Body: Grid Matrix (Left) & Holiday List (Right) */}
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                                        {/* Left: 7-Days Calendar Grid */}
                                        <div className="lg:col-span-8">
                                            {/* Days of week header */}
                                            <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
                                                {dayLabels.map((lbl, idx) => {
                                                    const isSunday = idx === 0;
                                                    const isSaturdayOff = idx === 6 && calendar.school_days_per_week === 5;
                                                    return (
                                                        <div
                                                            key={lbl}
                                                            className={`py-2 text-xs font-black uppercase tracking-wider rounded-lg ${
                                                                isSunday || isSaturdayOff
                                                                    ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300'
                                                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                                            }`}
                                                        >
                                                            {lbl}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Calendar Days Matrix */}
                                            <div className="grid grid-cols-7 gap-1.5">
                                                {/* Empty offset padding for days before the 1st */}
                                                {Array.from({ length: calendar.first_day_of_week }).map((_, idx) => (
                                                    <div
                                                        key={`empty-${idx}`}
                                                        className="h-16 sm:h-20 rounded-xl bg-gray-50/40 dark:bg-gray-800/20 border border-dashed border-gray-200/50 dark:border-gray-800/50"
                                                    />
                                                ))}

                                                {/* Active Days */}
                                                {calendar.days.map((item) => {
                                                    const isHoliday = item.is_holiday;
                                                    const isSunday = item.is_sunday;
                                                    const isSaturdayOff = item.is_saturday_off;
                                                    const isToday = item.is_today;

                                                    let cardStyle = 'bg-white text-gray-800 border-gray-200/70 hover:border-emerald-400 dark:bg-gray-800/70 dark:text-gray-100 dark:border-gray-700';

                                                    if (isToday) {
                                                        cardStyle = 'bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white shadow-md shadow-[#FF6B35]/25 border-transparent ring-2 ring-[#FF6B35]/40';
                                                    } else if (isHoliday) {
                                                        cardStyle = 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/60 dark:border-red-900/60 dark:text-red-200';
                                                    } else if (isSunday || isSaturdayOff) {
                                                        cardStyle = 'bg-red-50/50 border-red-100 text-red-600 dark:bg-red-950/30 dark:border-red-950 dark:text-red-300';
                                                    }

                                                    return (
                                                        <div
                                                            key={item.date}
                                                            className={`relative flex flex-col justify-between rounded-xl border p-2 h-16 sm:h-20 transition-all ${cardStyle}`}
                                                            title={item.holiday_name ? `${item.holiday_name} (${item.date})` : item.date}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className={`text-xs sm:text-sm font-black ${isToday ? 'text-white' : ''}`}>
                                                                    {item.day}
                                                                </span>
                                                                {isToday && (
                                                                    <span className="rounded bg-white/20 px-1 text-[9px] font-bold uppercase tracking-tight text-white">
                                                                        Hari Ini
                                                                    </span>
                                                                )}
                                                                {isHoliday && !isToday && (
                                                                    <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                                                                )}
                                                            </div>

                                                            {item.holiday_name ? (
                                                                <div className={`text-[9px] font-bold line-clamp-2 leading-tight ${isToday ? 'text-white/90' : 'text-red-700 dark:text-red-300'}`}>
                                                                    {item.holiday_name}
                                                                </div>
                                                            ) : isSunday ? (
                                                                <div className="text-[9px] font-semibold text-red-500/80">
                                                                    Minggu
                                                                </div>
                                                            ) : isSaturdayOff ? (
                                                                <div className="text-[9px] font-semibold text-rose-500/80 dark:text-rose-400">
                                                                    Sabtu
                                                                </div>
                                                            ) : (
                                                                <div className="text-[9px] font-medium text-emerald-600/80 dark:text-emerald-400">
                                                                    Efektif
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Legend */}
                                            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-600 dark:text-gray-300 pt-3 border-t border-gray-100 dark:border-gray-800">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="size-3 rounded-md bg-emerald-500" />
                                                    <span>Hari Efektif</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="size-3 rounded-md bg-red-500" />
                                                    <span>Libur Nasional / Semester</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="size-3 rounded-md bg-red-200 border border-red-400" />
                                                    <span>Minggu (Akhir Pekan)</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="size-3 rounded-md bg-[#FF6B35]" />
                                                    <span>Hari Ini</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Holiday Events List */}
                                        <div className="flex flex-col rounded-2xl border-2 border-gray-100 bg-gray-50/60 p-5 lg:col-span-4 dark:border-gray-800 dark:bg-gray-900/50">
                                            <div className="flex items-center gap-2 border-b border-gray-200 pb-3 dark:border-gray-800">
                                                <span className="text-base font-bold text-gray-900 dark:text-white">
                                                    Hari Libur & Cuti Bersama
                                                </span>
                                                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-800 dark:bg-red-950 dark:text-red-300">
                                                    {calendar.holidays.length}
                                                </span>
                                            </div>

                                            <div className="mt-3.5 flex-1 divide-y divide-gray-200/80 overflow-y-auto max-h-[380px] dark:divide-gray-800">
                                                {calendar.holidays.length === 0 ? (
                                                    <div className="flex h-48 flex-col items-center justify-center text-center text-gray-400">
                                                        <CalendarCheck className="size-8 text-emerald-500/70 mb-2" />
                                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                            Tidak Ada Libur Nasional Khusus
                                                        </span>
                                                        <p className="mt-1 text-[11px] text-gray-500 max-w-[200px]">
                                                            Semua hari sekolah pada bulan ini berjalan efektif untuk proses belajar mengajar.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    calendar.holidays.map((h) => (
                                                        <div key={h.id} className="py-3 first:pt-0 last:pb-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="rounded-md bg-[#FFF0EB] px-2 py-0.5 font-mono text-[11px] font-extrabold text-[#FF6B35] dark:bg-[#3D1A10]">
                                                                    {h.formatted_dates}
                                                                </span>
                                                                <span className="rounded-md bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-800 dark:bg-red-950 dark:text-red-300">
                                                                    {h.type_name}
                                                                </span>
                                                            </div>
                                                            <div className="mt-1.5 text-xs font-bold text-gray-900 dark:text-white">
                                                                {h.name}
                                                            </div>
                                                            {h.description && (
                                                                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                                                                    {h.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))
                                                )}
                                            </div>

                                            <div className="mt-4 rounded-xl bg-white p-3 text-[11px] text-gray-500 border border-gray-200/70 shadow-xs dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
                                                <div className="flex items-start gap-2">
                                                    <Info className="size-3.5 text-[#FF6B35] shrink-0 mt-0.5" />
                                                    <span>
                                                        Tanggal libur resmi di atas otomatis disinkronkan ke seluruh sistem dan tidak dihitung dalam rekapitulasi ketidakhadiran.
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Feature Cards Grid */}
                        <div className="relative z-10 mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="rounded-[18px] border-2 border-[#E8E8E8] bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                                <div className="flex size-12 items-center justify-center rounded-[14px] bg-[#DCFCE7] text-[#059669]">
                                    <CalendarCheck className="size-6 stroke-[2.2]" />
                                </div>
                                <h3 className="mt-5 text-lg font-bold text-[#111827] dark:text-white">
                                    Presensi Kapsul Sekali Klik
                                </h3>
                                <p className="mt-2 text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                                    Guru dapat menandai Hadir, Sakit, Izin, atau Alpha dalam format kapsul responsif tanpa ribet membuka dropdown.
                                </p>
                            </div>

                            <div className="rounded-[18px] border-2 border-[#E8E8E8] bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                                <div className="flex size-12 items-center justify-center rounded-[14px] bg-[#EDE9FE] text-[#7C3AED]">
                                    <Clock className="size-6 stroke-[2.2]" />
                                </div>
                                <h3 className="mt-5 text-lg font-bold text-[#111827] dark:text-white">
                                    Modul Khusus Keterlambatan
                                </h3>
                                <p className="mt-2 text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                                    Pencatatan jam kedatangan siswa di gerbang secara akurat untuk memotivasi kedisiplinan dan evaluasi berkala.
                                </p>
                            </div>

                            <div className="rounded-[18px] border-2 border-[#E8E8E8] bg-white p-7 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                                <div className="flex size-12 items-center justify-center rounded-[14px] bg-[#FFF0EB] text-[#FF6B35]">
                                    <BarChart3 className="size-6 stroke-[2.2]" />
                                </div>
                                <h3 className="mt-5 text-lg font-bold text-[#111827] dark:text-white">
                                    Rekapitulasi Matriks Bulanan
                                </h3>
                                <p className="mt-2 text-sm text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                                    Tabel rekapitulasi kehadiran dengan kolom nama siswa tetap terkunci (sticky) siap cetak dan ekspor format spreadsheet.
                                </p>
                            </div>
                        </div>
                    </section>
                </main>

                {/* Footer */}
                <footer className="border-t border-[#E8E8E8] bg-white/70 py-6 text-center text-xs text-[#6B7280] backdrop-blur-md dark:border-[#2D234A] dark:bg-[#18122B]/70 dark:text-[#9CA3AF]">
                    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
                        <div>
                            &copy; {new Date().getFullYear()} {schoolName}. All rights reserved.
                        </div>
                    </div>
                </footer>

                <PwaInstallPrompt />
            </div>
        </>
    );
}
