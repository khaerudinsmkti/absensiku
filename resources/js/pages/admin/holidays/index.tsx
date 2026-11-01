import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    CalendarDays,
    CalendarRange,
    CheckCircle2,
    Clock,
    Download,
    Edit3,
    HelpCircle,
    Plus,
    RefreshCw,
    Search,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageBanner } from '@/components/page-banner';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';

interface AcademicHolidayItem {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    type: 'national_holiday' | 'joint_leave' | 'school_holiday' | 'other';
    type_name: string;
    description: string | null;
    academic_year: string | null;
    duration_days: number;
    formatted_dates: string;
}

interface PageProps {
    holidays: AcademicHolidayItem[];
    selectedYear: number;
    stats: {
        total_holidays: number;
        total_days: number;
        national_holidays: number;
        joint_leaves: number;
        school_holidays: number;
    };
    schoolSetting?: {
        school_days_per_week: number;
        is_saturday_holiday: boolean;
    };
}

export default function HolidaysIndexPage({
    holidays = [],
    selectedYear,
    stats,
    schoolSetting,
}: PageProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<AcademicHolidayItem | null>(null);
    const [schoolDays, setSchoolDays] = useState<number>(schoolSetting?.school_days_per_week ?? 6);
    const [isSavingDays, setIsSavingDays] = useState(false);

    React.useEffect(() => {
        if (schoolSetting?.school_days_per_week) {
            setSchoolDays(schoolSetting.school_days_per_week);
        }
    }, [schoolSetting?.school_days_per_week]);

    const handleUpdateSchoolDays = (days: number) => {
        if (days === schoolDays || isSavingDays) return;
        setIsSavingDays(true);
        router.patch(
            '/admin/holidays/school-days',
            { school_days_per_week: days },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSchoolDays(days);
                    toast.success(
                        days === 5
                            ? 'Sistem 5 Hari Sekolah berhasil diterapkan (Sabtu libur)'
                            : 'Sistem 6 Hari Sekolah berhasil diterapkan (Sabtu masuk)'
                    );
                },
                onError: () => {
                    toast.error('Gagal memperbarui pengaturan hari sekolah');
                },
                onFinish: () => {
                    setIsSavingDays(false);
                },
            }
        );
    };

    const holidayForm = useForm({
        name: '',
        start_date: '',
        end_date: '',
        type: 'national_holiday',
        description: '',
        academic_year: '',
    });

    const openAddModal = () => {
        setEditingItem(null);
        holidayForm.reset();
        holidayForm.setData({
            name: '',
            start_date: `${selectedYear}-01-01`,
            end_date: `${selectedYear}-01-01`,
            type: 'national_holiday',
            description: '',
            academic_year: '',
        });
        setShowModal(true);
    };

    const openEditModal = (item: AcademicHolidayItem) => {
        setEditingItem(item);
        holidayForm.setData({
            name: item.name,
            start_date: item.start_date.substring(0, 10),
            end_date: item.end_date.substring(0, 10),
            type: item.type,
            description: item.description || '',
            academic_year: item.academic_year || '',
        });
        setShowModal(true);
    };

    const handleSaveHoliday = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            holidayForm.put(`/admin/holidays/${editingItem.id}`, {
                onSuccess: () => setShowModal(false),
            });
        } else {
            holidayForm.post('/admin/holidays', {
                onSuccess: () => setShowModal(false),
            });
        }
    };

    const handleDeleteHoliday = (item: AcademicHolidayItem) => {
        if (confirm(`Apakah Anda yakin ingin menghapus '${item.name}' dari kalender pendidikan?`)) {
            router.delete(`/admin/holidays/${item.id}`, {
                preserveScroll: true,
                onError: () => toast.error(`Gagal menghapus hari libur ${item.name}.`),
            });
        }
    };

    const handleSeedHolidays = () => {
        if (confirm(`Sinkronkan daftar hari libur nasional resmi untuk tahun ${selectedYear}? Data yang sudah ada tidak akan diduplikasi.`)) {
            router.post(
                '/admin/holidays/seed',
                { year: selectedYear },
                { preserveScroll: true },
            );
        }
    };

    const handleYearChange = (yr: number) => {
        router.get(
            '/admin/holidays',
            { year: yr },
            { preserveState: true, preserveScroll: true },
        );
    };

    const filteredHolidays = useMemo(() => {
        return holidays.filter((h) => {
            const matchesSearch =
                h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (h.description && h.description.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesType = typeFilter === 'all' || h.type === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [holidays, searchTerm, typeFilter]);

    const currentYr = new Date().getFullYear();
    const availableYears = [currentYr - 1, currentYr, currentYr + 1, currentYr + 2];

    return (
        <>
            <Head title="Kalender Pendidikan & Hari Libur - AbsensiKu" />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8 bg-page-gradient min-h-screen">
                {/* Header Banner */}
                <PageBanner
                    badgeText="Administrasi Akademik"
                    title="Kalender Pendidikan & Hari Libur 📅"
                    description="Kelola hari libur nasional, cuti bersama, dan libur semester. Tanggal yang terdaftar sebagai hari libur secara otomatis tidak dihitung dalam presensi dan absensi siswa."
                    action={
                        <div className="flex flex-wrap items-center gap-2.5">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleSeedHolidays}
                                className="bg-white text-[#FF6B35] hover:bg-[#FFFBE6] shadow-sm font-bold border-none text-xs gap-1.5"
                            >
                                <Sparkles className="size-4" />
                                Sinkron Libur Nasional {selectedYear}
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={openAddModal}
                                className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand font-bold text-xs gap-1.5"
                            >
                                <Plus className="size-4" />
                                Tambah Hari Libur
                            </Button>
                        </div>
                    }
                />

                {/* Pengaturan Hari Belajar Efektif Mingguan (5 Hari vs 6 Hari) */}
                <div className="relative overflow-hidden rounded-[22px] border-2 border-orange-200/80 bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-white p-5 shadow-[0_4px_20px_rgba(255,107,53,0.06)] dark:border-[#2D234A] dark:from-[#1F1735] dark:via-[#18122B] dark:to-[#18122B]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-3.5">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white shadow-md shadow-orange-500/20">
                                <CalendarRange className="size-6" />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                                        Sistem Hari Belajar Efektif Mingguan
                                    </h3>
                                    <span
                                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                                            schoolDays === 5
                                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                                        }`}
                                    >
                                        <span className="size-1.5 rounded-full bg-current"></span>
                                        {schoolDays === 5 ? '5 Hari Sekolah (Sabtu Libur)' : '6 Hari Sekolah (Sabtu Masuk)'}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                                    {schoolDays === 5 ? (
                                        <>
                                            Sekolah menerapkan sistem <strong>5 hari belajar (Senin - Jumat)</strong>. Hari <strong>Sabtu dan Minggu</strong> otomatis dihitung sebagai <strong>libur akhir pekan</strong> pada kalender pendidikan, rekap laporan kehadiran, dan input absensi dinonaktifkan.
                                        </>
                                    ) : (
                                        <>
                                            Sekolah menerapkan sistem <strong>6 hari belajar (Senin - Sabtu)</strong>. Hari <strong>Sabtu</strong> adalah <strong>hari aktif sekolah</strong>, dan hanya hari Minggu yang menjadi libur akhir pekan.
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Interactive Selector Pill */}
                        <div className="flex items-center gap-2 rounded-2xl bg-white/95 p-1.5 shadow-sm border border-gray-200/90 dark:bg-gray-800/90 dark:border-gray-700 self-start lg:self-center shrink-0">
                            <button
                                type="button"
                                disabled={isSavingDays}
                                onClick={() => handleUpdateSchoolDays(5)}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                    schoolDays === 5
                                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand ring-1 ring-orange-400/50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                                title="Pilih 5 Hari Belajar: Senin sampai Jumat (Sabtu Libur)"
                            >
                                <span>5 Hari (Senin - Jumat)</span>
                                {schoolDays === 5 && <CheckCircle2 className="size-3.5" />}
                            </button>
                            <button
                                type="button"
                                disabled={isSavingDays}
                                onClick={() => handleUpdateSchoolDays(6)}
                                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                    schoolDays === 6
                                        ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand ring-1 ring-orange-400/50'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                                title="Pilih 6 Hari Belajar: Senin sampai Sabtu (Sabtu Masuk)"
                            >
                                <span>6 Hari (Senin - Sabtu)</span>
                                {schoolDays === 6 && <CheckCircle2 className="size-3.5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                    <StatCard
                        title="Total Agenda Libur"
                        value={stats.total_holidays}
                        icon={CalendarDays}
                        variant="primary"
                    />
                    <StatCard
                        title="Total Hari Libur"
                        value={`${stats.total_days} Hari`}
                        icon={Clock}
                        variant="warning"
                    />
                    <StatCard
                        title="Libur Nasional"
                        value={stats.national_holidays}
                        icon={Calendar}
                        variant="danger"
                    />
                    <StatCard
                        title="Cuti Bersama"
                        value={stats.joint_leaves}
                        icon={Sparkles}
                        variant="warning"
                    />
                    <StatCard
                        title="Libur Sekolah / Semester"
                        value={stats.school_holidays}
                        icon={CalendarRange}
                        variant="info"
                    />
                </div>

                {/* Filter & Search Bar */}
                <div className="flex flex-col gap-4 rounded-[20px] border-2 border-[#E8E8E8] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        {/* Year Selector Tabs */}
                        <div className="flex items-center gap-1.5 rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
                            {availableYears.map((yr) => (
                                <button
                                    key={yr}
                                    type="button"
                                    onClick={() => handleYearChange(yr)}
                                    className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                                        selectedYear === yr
                                            ? 'bg-white text-[#FF6B35] shadow-sm dark:bg-gray-700 dark:text-white'
                                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400'
                                    }`}
                                >
                                    Tahun {yr}
                                </button>
                            ))}
                        </div>

                        {/* Search & Type Filter */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari hari libur..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="rounded-xl border-2 border-[#E8E8E8] pl-9 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                />
                            </div>

                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3 py-1.5 text-xs font-bold text-gray-800 focus:border-[#FF6B35] outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                            >
                                <option value="all">Semua Kategori</option>
                                <option value="national_holiday">Libur Nasional</option>
                                <option value="joint_leave">Cuti Bersama</option>
                                <option value="school_holiday">Libur Sekolah / Semester</option>
                                <option value="other">Lainnya</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table of Holidays */}
                <div className="overflow-hidden rounded-[20px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                    <div className="border-b border-gray-100 p-5 dark:border-gray-800 flex justify-between items-center">
                        <div>
                            <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                                Daftar Hari Libur Tahun {selectedYear}
                            </h2>
                            <p className="text-xs text-gray-500">
                                Menampilkan {filteredHolidays.length} hari libur terdaftar
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-gray-50/80 text-[#6B7280] uppercase tracking-wider text-[11px] border-b border-gray-100 dark:bg-gray-800/40 dark:border-gray-800 dark:text-gray-400">
                                    <th className="px-5 py-3.5">No</th>
                                    <th className="px-5 py-3.5">Tanggal Libur</th>
                                    <th className="px-5 py-3.5 text-center">Durasi</th>
                                    <th className="px-5 py-3.5">Nama Hari Libur</th>
                                    <th className="px-5 py-3.5">Kategori</th>
                                    <th className="px-5 py-3.5">Keterangan</th>
                                    <th className="px-5 py-3.5 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {filteredHolidays.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                                            Belum ada hari libur untuk tahun {selectedYear}. Klik tombol{' '}
                                            <strong className="text-[#FF6B35]">"Sinkron Libur Nasional {selectedYear}"</strong> untuk memuat data otomatis.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredHolidays.map((item, idx) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-gray-50/70 transition-colors dark:hover:bg-gray-800/30"
                                        >
                                            <td className="px-5 py-3.5 font-bold text-gray-400">{idx + 1}</td>
                                            <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                                {item.formatted_dates}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-extrabold bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                                    {item.duration_days} Hari
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 font-extrabold text-gray-900 dark:text-white">
                                                {item.name}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span
                                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                                                        item.type === 'national_holiday'
                                                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                                                            : item.type === 'joint_leave'
                                                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                                              : item.type === 'school_holiday'
                                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                    }`}
                                                >
                                                    {item.type_name}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-500 max-w-[200px] truncate" title={item.description || ''}>
                                                {item.description || '-'}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditModal(item)}
                                                        className="size-7 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                                        title="Edit Hari Libur"
                                                    >
                                                        <Edit3 className="size-3.5" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteHoliday(item)}
                                                        className="size-7 p-0 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                                        title="Hapus Hari Libur"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL TAMBAH / EDIT HARI LIBUR */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="relative w-full max-w-lg rounded-[20px] bg-white p-6 shadow-2xl dark:bg-[#18122B] border border-gray-200 dark:border-gray-800">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                                <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                                    <CalendarRange className="size-5 text-[#FF6B35]" />
                                    {editingItem ? 'Edit Hari Libur' : 'Tambah Hari Libur Baru'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveHoliday} className="mt-4 flex flex-col gap-4">
                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Nama Hari Libur <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: Hari Raya Idul Fitri 1447 H"
                                        value={holidayForm.data.name}
                                        onChange={(e) => holidayForm.setData('name', e.target.value)}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {holidayForm.errors.name && (
                                        <p className="mt-1 text-xs text-red-500">{holidayForm.errors.name}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Tanggal Mulai <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={holidayForm.data.start_date}
                                            onChange={(e) => {
                                                holidayForm.setData('start_date', e.target.value);
                                                if (!holidayForm.data.end_date || holidayForm.data.end_date < e.target.value) {
                                                    holidayForm.setData('end_date', e.target.value);
                                                }
                                            }}
                                            className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Tanggal Selesai <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            min={holidayForm.data.start_date}
                                            value={holidayForm.data.end_date}
                                            onChange={(e) => holidayForm.setData('end_date', e.target.value)}
                                            className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-semibold text-gray-800 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Kategori Hari Libur <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={holidayForm.data.type}
                                        onChange={(e) => holidayForm.setData('type', e.target.value as any)}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] bg-white px-3 py-2 text-xs font-bold text-gray-800 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    >
                                        <option value="national_holiday">Libur Nasional</option>
                                        <option value="joint_leave">Cuti Bersama</option>
                                        <option value="school_holiday">Libur Sekolah / Semester</option>
                                        <option value="other">Lainnya</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Keterangan Tambahan (Opsional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        placeholder="Contoh: Surat Keputusan Bersama 3 Menteri / Libur Kenaikan Kelas"
                                        value={holidayForm.data.description}
                                        onChange={(e) => holidayForm.setData('description', e.target.value)}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                </div>

                                <div className="mt-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowModal(false)}
                                        className="text-xs font-bold"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        disabled={holidayForm.processing}
                                        className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand font-bold text-xs"
                                    >
                                        {holidayForm.processing ? 'Menyimpan...' : 'Simpan Hari Libur'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

HolidaysIndexPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Kalender Pendidikan', href: '/admin/holidays' },
    ],
};

