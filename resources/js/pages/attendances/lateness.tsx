import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    Pencil,
    PlusCircle,
    Search,
    Trash2,
    UserCheck,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageBanner } from '@/components/page-banner';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface LateRecord {
    id: number;
    student_id: number;
    name: string;
    nisn: string;
    classroom: string;
    check_in_time: string;
    late_minutes: number;
    notes: string;
    reason?: string;
    sanction?: string;
    recorded_by: string;
}

interface StudentOption {
    id: number;
    name: string;
    nisn: string;
    classroom: string;
}

interface HolidayInfo {
    name: string;
    type: string;
    type_name: string;
    description?: string;
}

interface LatenessProps {
    selectedDate: string;
    isFutureDate?: boolean;
    holiday?: HolidayInfo | null;
    lateRecords: LateRecord[];
    students: StudentOption[];
    defaultCheckInTime: string;
    cutoffTime: string;
}

export default function LatenessPage({
    selectedDate,
    isFutureDate = false,
    holiday = null,
    lateRecords = [],
    students = [],
    defaultCheckInTime,
    cutoffTime = '07:00',
}: LatenessProps) {
    const todayStr = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
    const isFuture = isFutureDate || selectedDate > todayStr;
    const isBlocked = !!holiday || isFuture;

    const [searchTerm, setSearchTerm] = useState('');
    const [editingRecord, setEditingRecord] = useState<LateRecord | null>(null);
    const [deletingRecord, setDeletingRecord] = useState<LateRecord | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        student_id: '' as string | number,
        date: selectedDate,
        check_in_time: defaultCheckInTime || '07:15',
        reason: '',
        sanction: '',
    });

    const editForm = useForm({
        check_in_time: '',
        reason: '',
        sanction: '',
    });

    const handleOpenEdit = (record: LateRecord) => {
        setEditingRecord(record);
        editForm.setData({
            check_in_time: record.check_in_time,
            reason: record.reason || record.notes || '',
            sanction: record.sanction || '',
        });
    };

    // Live calculate edit minutes
    const calculatedEditMinutes = useMemo(() => {
        if (!editForm.data.check_in_time) return 0;
        const [inH, inM] = editForm.data.check_in_time.split(':').map(Number);
        const [cutH, cutM] = cutoffTime.split(':').map(Number);
        const diff = inH * 60 + inM - (cutH * 60 + cutM);
        return diff > 0 ? diff : 0;
    }, [editForm.data.check_in_time, cutoffTime]);

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingRecord) return;
        editForm.put(`/attendances/lateness/${editingRecord.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingRecord(null);
            },
        });
    };

    const handleDelete = () => {
        if (!deletingRecord) return;
        router.delete(`/attendances/lateness/${deletingRecord.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingRecord(null);
            },
        });
    };

    const handleDateChange = (newDate: string) => {
        router.get(
            '/attendances/lateness',
            { date: newDate },
            { preserveState: true, preserveScroll: true },
        );
    };

    // Filter students by search term
    const filteredStudents = useMemo(() => {
        if (!searchTerm.trim()) return students.slice(0, 50);
        const lower = searchTerm.toLowerCase();
        return students.filter(
            (s) =>
                s.name.toLowerCase().includes(lower) ||
                s.nisn.includes(lower) ||
                s.classroom.toLowerCase().includes(lower),
        );
    }, [students, searchTerm]);

    // Live calculate late minutes
    const calculatedMinutes = useMemo(() => {
        if (!data.check_in_time) return 0;
        const [inH, inM] = data.check_in_time.split(':').map(Number);
        const [cutH, cutM] = cutoffTime.split(':').map(Number);
        const diff = inH * 60 + inM - (cutH * 60 + cutM);
        return diff > 0 ? diff : 0;
    }, [data.check_in_time, cutoffTime]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/attendances/lateness', {
            onSuccess: () => {
                reset('student_id', 'reason', 'sanction');
                setSearchTerm('');
            },
        });
    };

    const totalLateMinutes = lateRecords.reduce((acc, curr) => acc + curr.late_minutes, 0);

    return (
        <>
            <Head title="Pelacak Keterlambatan - AbsensiKu" />
            <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8 bg-page-gradient min-h-screen">
                <PageBanner
                    badgeText="Modul Guru Piket • Keterlambatan"
                    title="Pencatatan Keterlambatan Siswa ⏱️"
                    description="Catat siswa yang tiba di gerbang melewati ambang batas jam masuk (07:00). Sistem otomatis menghitung menit keterlambatan dan memperbarui status kehadiran."
                    action={
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-white/20 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                                Batas Masuk: {cutoffTime} WIB
                            </span>
                        </div>
                    }
                />

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <StatCard
                        title="Siswa Terlambat Hari Ini"
                        value={lateRecords.length}
                        subtitle="Siswa dicatat petugas piket"
                        icon={Clock}
                        variant="purple"
                    />
                    <StatCard
                        title="Akumulasi Menit Terlambat"
                        value={`${totalLateMinutes} Menit`}
                        subtitle="Total keterlambatan hari ini"
                        icon={AlertTriangle}
                        variant="warning"
                    />
                    <StatCard
                        title="Rata-rata Keterlambatan"
                        value={lateRecords.length > 0 ? `${Math.round(totalLateMinutes / lateRecords.length)} m` : '0 m'}
                        subtitle="Durasi per siswa"
                        icon={CheckCircle2}
                        variant="info"
                    />
                </div>

                {/* Holiday / Future Date Warning Banner */}
                {holiday && (
                    <div className="rounded-2xl border-2 border-red-300 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/40">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="size-5 text-red-600 dark:text-red-400 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-red-800 dark:text-red-200">
                                    Hari Libur: {holiday.name} ({holiday.type_name})
                                </h4>
                                <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                                    {holiday.description || 'Tanggal yang dipilih merupakan hari libur. Pencatatan keterlambatan siswa dinonaktifkan.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {!holiday && isFuture && (
                    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-200">
                                    Tanggal Melebihi Hari Ini (Tanggal Maju)
                                </h4>
                                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                                    Pencatatan keterlambatan tidak dapat dilakukan untuk tanggal di masa mendatang. Silakan pilih tanggal hari ini atau sebelumnya.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Form: Input Keterlambatan */}
                    <div className="lg:col-span-1 rounded-[18px] border-2 border-[#E8E8E8] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                        <h2 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2 mb-4">
                            <PlusCircle className="size-5 text-[#FF6B35]" />
                            Form Entri Keterlambatan
                        </h2>

                        {isBlocked && (
                            <div className="mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-300">
                                ⚠️ Penginputan dinonaktifkan karena tanggal yang dipilih adalah hari libur atau melebihi hari ini.
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                    Cari & Pilih Siswa:
                                </label>
                                <div className="relative mb-2">
                                    <Search className="absolute left-3 top-2.5 size-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder={students.length === 0 ? "Tidak ada siswa tersedia" : "Ketik NISN atau nama siswa..."}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        disabled={isBlocked || students.length === 0}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] pl-9 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800"
                                    />
                                </div>
                                <select
                                    value={data.student_id}
                                    onChange={(e) => setData('student_id', e.target.value)}
                                    disabled={isBlocked || students.length === 0}
                                    className="w-full rounded-xl border-2 border-[#E8E8E8] bg-white px-3.5 py-2 text-xs font-medium text-gray-800 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/15 disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800"
                                    required
                                >
                                    <option value="">
                                        {students.length === 0
                                            ? '-- Tidak ada siswa di kelas yang diampu --'
                                            : '-- Pilih Siswa Terlambat --'}
                                    </option>
                                    {filteredStudents.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name} ({s.classroom} - {s.nisn})
                                        </option>
                                    ))}
                                </select>
                                {students.length === 0 && (
                                    <p className="mt-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                        Catatan: Hanya menampilkan siswa dari kelas yang Anda ampu. Belum ada siswa atau Anda belum ditugaskan sebagai wali kelas aktif.
                                    </p>
                                )}
                                {errors.student_id && (
                                    <p className="text-red-500 text-[11px] mt-1">{errors.student_id}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                        Jam Tiba:
                                    </label>
                                    <input
                                        type="time"
                                        value={data.check_in_time}
                                        onChange={(e) => setData('check_in_time', e.target.value)}
                                        disabled={isBlocked}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-bold text-gray-800 focus:border-[#FF6B35] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                        Durasi Terlambat:
                                    </label>
                                    <div className="flex items-center h-[38px] rounded-xl bg-[#EDE9FE] px-3 text-xs font-extrabold text-[#7C3AED]">
                                        +{calculatedMinutes} Menit
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                    Alasan Keterlambatan:
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="Contoh: Ban motor kempes, bangun kesiangan..."
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                    disabled={isBlocked}
                                    className="w-full rounded-xl border-2 border-[#E8E8E8] p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800"
                                    required
                                />
                                {errors.reason && (
                                    <p className="text-red-500 text-[11px] mt-1">{errors.reason}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                    Sanksi / Tindakan Piket (Opsional):
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Bersihkan perpustakaan 15 menit"
                                    value={data.sanction}
                                    onChange={(e) => setData('sanction', e.target.value)}
                                    disabled={isBlocked}
                                    className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none disabled:bg-gray-100 disabled:text-gray-400 dark:disabled:bg-gray-800"
                                />
                            </div>

                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isBlocked || processing || !data.student_id}
                                className="w-full mt-2 font-bold text-xs bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand hover:translate-y-[-1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Menyimpan...' : 'Catat Keterlambatan Siswa'}
                            </Button>
                        </form>
                    </div>

                    {/* Right Table: Daftar Siswa Terlambat */}
                    <div className="lg:col-span-2 overflow-hidden rounded-[18px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E8E8E8] px-6 py-4 gap-3 dark:border-[#2D234A]">
                            <div>
                                <h2 className="text-base font-bold text-[#111827] dark:text-white">
                                    Daftar Siswa Terlambat
                                </h2>
                                <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                    Menampilkan rekaman kedisiplinan gerbang pada tanggal terpilih.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#6B7280]">Tanggal:</span>
                                <input
                                    type="date"
                                    max={todayStr}
                                    value={selectedDate}
                                    onChange={(e) => handleDateChange(e.target.value)}
                                    className="rounded-xl border border-[#E8E8E8] px-2.5 py-1 text-xs font-semibold text-gray-800 focus:border-[#FF6B35] outline-none"
                                />
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
                                            Nama Siswa
                                        </th>
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            Kelas
                                        </th>
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            Jam Tiba
                                        </th>
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            Durasi
                                        </th>
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            Alasan / Tindakan
                                        </th>
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">
                                            Petugas Piket
                                        </th>
                                        <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35] text-center">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F5F5F5]">
                                    {lateRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center py-12 text-gray-500 font-medium">
                                                Tidak ada catatan keterlambatan pada tanggal ini. Bagus, semua siswa tertib! 🎉
                                            </td>
                                        </tr>
                                    ) : (
                                        lateRecords.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="px-5 py-3.5 font-bold text-gray-500">{idx + 1}</td>
                                                <td className="px-5 py-3.5 font-bold text-gray-900">
                                                    <div>{item.name}</div>
                                                    <div className="text-[11px] text-gray-400 font-normal">NISN: {item.nisn}</div>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">
                                                    <span className="rounded-md bg-gray-100 px-2 py-0.5">{item.classroom}</span>
                                                </td>
                                                <td className="px-5 py-3.5 font-bold text-gray-800 text-xs">
                                                    {item.check_in_time} WIB
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex rounded-lg bg-[#EDE9FE] px-2.5 py-0.5 text-xs font-bold text-[#7C3AED]">
                                                        +{item.late_minutes} Menit
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-gray-600 max-w-xs">
                                                    {item.notes}
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-gray-500">
                                                    {item.recorded_by}
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEdit(item)}
                                                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors dark:text-blue-400 dark:hover:bg-blue-950/40"
                                                            title="Edit Keterlambatan"
                                                        >
                                                            <Pencil className="size-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingRecord(item)}
                                                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-950/40"
                                                            title="Hapus Keterlambatan"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modal Edit Keterlambatan */}
                <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-gray-900 dark:text-white">
                                <Pencil className="size-5 text-[#FF6B35]" />
                                Edit Catatan Keterlambatan
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500">
                                Perbarui jam tiba atau keterangan keterlambatan untuk siswa terpilih.
                            </DialogDescription>
                        </DialogHeader>

                        {editingRecord && (
                            <form onSubmit={handleUpdate} className="flex flex-col gap-4 mt-2">
                                <div className="rounded-xl bg-orange-50/70 border border-orange-200/80 p-3 text-xs dark:bg-orange-950/30 dark:border-orange-900/40">
                                    <div className="font-extrabold text-gray-900 dark:text-white text-sm">
                                        {editingRecord.name}
                                    </div>
                                    <div className="text-gray-500 flex items-center gap-2 mt-0.5">
                                        <span>NISN: {editingRecord.nisn}</span>
                                        <span>•</span>
                                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                                            Kelas {editingRecord.classroom}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                            Jam Tiba:
                                        </label>
                                        <input
                                            type="time"
                                            value={editForm.data.check_in_time}
                                            onChange={(e) => editForm.setData('check_in_time', e.target.value)}
                                            className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-bold text-gray-800 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                            required
                                        />
                                        {editForm.errors.check_in_time && (
                                            <p className="text-red-500 text-[11px] mt-1">{editForm.errors.check_in_time}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                            Durasi Terlambat:
                                        </label>
                                        <div className="flex items-center h-[38px] rounded-xl bg-[#EDE9FE] px-3 text-xs font-extrabold text-[#7C3AED] dark:bg-purple-950/50 dark:text-purple-300">
                                            +{calculatedEditMinutes} Menit
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                        Alasan Keterlambatan:
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={editForm.data.reason}
                                        onChange={(e) => editForm.setData('reason', e.target.value)}
                                        placeholder="Contoh: Ban motor kempes, bangun kesiangan..."
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                        required
                                    />
                                    {editForm.errors.reason && (
                                        <p className="text-red-500 text-[11px] mt-1">{editForm.errors.reason}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1.5">
                                        Sanksi / Tindakan Piket (Opsional):
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.data.sanction}
                                        onChange={(e) => editForm.setData('sanction', e.target.value)}
                                        placeholder="Contoh: Bersihkan perpustakaan 15 menit"
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                    />
                                    {editForm.errors.sanction && (
                                        <p className="text-red-500 text-[11px] mt-1">{editForm.errors.sanction}</p>
                                    )}
                                </div>

                                <DialogFooter className="mt-2 flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingRecord(null)}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        disabled={editForm.processing}
                                        className="bg-[#FF6B35] text-white hover:bg-[#E85A24] font-bold"
                                    >
                                        {editForm.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Modal Konfirmasi Hapus */}
                <Dialog open={!!deletingRecord} onOpenChange={(open) => !open && setDeletingRecord(null)}>
                    <DialogContent className="sm:max-w-[420px]">
                        <DialogHeader>
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 mb-2">
                                <Trash2 className="size-5" />
                            </div>
                            <DialogTitle className="text-base font-extrabold text-gray-900 dark:text-white">
                                Hapus Catatan Keterlambatan?
                            </DialogTitle>
                            <DialogDescription className="text-xs text-gray-500">
                                Data keterlambatan untuk{' '}
                                <strong className="text-gray-900 dark:text-white">{deletingRecord?.name}</strong> ({deletingRecord?.classroom})
                                pada tanggal {selectedDate} akan dihapus dari sistem.
                            </DialogDescription>
                        </DialogHeader>

                        <DialogFooter className="mt-4 flex items-center justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingRecord(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                                className="bg-red-600 text-white hover:bg-red-700 font-bold"
                            >
                                Ya, Hapus
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}

LatenessPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Keterlambatan Siswa', href: '/attendances/lateness' },
    ],
};

