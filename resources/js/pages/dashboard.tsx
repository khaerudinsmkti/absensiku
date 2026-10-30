import { Head } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    CheckCircle2,
    Clock,
    Download,
    FileSpreadsheet,
    GraduationCap,
    TrendingUp,
    UserCheck,
    Users,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { AttendanceBadge, type AttendanceStatus } from '@/components/attendance-badge';
import { AttendanceRadioGroup } from '@/components/attendance-radio-group';
import { PageBanner } from '@/components/page-banner';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';

interface SampleStudent {
    id: number;
    nisn: string;
    name: string;
    gender: 'L' | 'P';
    kelas: string;
    status: AttendanceStatus;
    waktuHadir?: string;
}

export default function Dashboard() {
    const [selectedDate, setSelectedDate] = useState('2026-10-30');
    const [selectedKelas, setSelectedKelas] = useState('Kelas 4-A');

    const [students, setStudents] = useState<SampleStudent[]>([
        { id: 1, nisn: '0089218201', name: 'Ahmad Faiz Pratama', gender: 'L', kelas: 'Kelas 4-A', status: 'hadir', waktuHadir: '06:48' },
        { id: 2, nisn: '0089218202', name: 'Anindya Putri Kirana', gender: 'P', kelas: 'Kelas 4-A', status: 'hadir', waktuHadir: '06:55' },
        { id: 3, nisn: '0089218203', name: 'Bagas Aditya Nugraha', gender: 'L', kelas: 'Kelas 4-A', status: 'terlambat', waktuHadir: '07:18' },
        { id: 4, nisn: '0089218204', name: 'Citra Amelia Zahra', gender: 'P', kelas: 'Kelas 4-A', status: 'sakit', waktuHadir: '-' },
        { id: 5, nisn: '0089218205', name: 'Dimas Satria Ramadhan', gender: 'L', kelas: 'Kelas 4-A', status: 'izin', waktuHadir: '-' },
        { id: 6, nisn: '0089218206', name: 'Eka Lestari Wulandari', gender: 'P', kelas: 'Kelas 4-A', status: 'alpha', waktuHadir: '-' },
    ]);

    const handleStatusChange = (id: number, newStatus: AttendanceStatus) => {
        setStudents((prev) =>
            prev.map((s) => (s.id === id ? { ...s, status: newStatus } : s)),
        );
    };

    return (
        <>
            <Head title="Dashboard - AbsensiKu" />
            <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8 bg-page-gradient min-h-screen">
                {/* 1. Page Banner */}
                <PageBanner
                    badgeText="Hari Ini • Semester Ganjil"
                    title="Halo, Selamat Pagi Guru Hebat! 👋"
                    description="Pantau kehadiran peserta didik hari ini secara realtime. Rekap otomatis dan laporan presensi siap diunduh kapan pun."
                    action={
                        <div className="flex flex-wrap gap-2.5">
                            <Button
                                variant="secondary"
                                className="bg-white text-[#FF6B35] hover:bg-[#FFFBE6] shadow-sm font-bold border-none"
                            >
                                <Download className="size-4" />
                                Export Rekap
                            </Button>
                        </div>
                    }
                />

                {/* 2. Stats Grid (4 Cards Hierarchy) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Hadir"
                        value="342"
                        subtitle="95% dari 360 siswa"
                        icon={CheckCircle2}
                        variant="success"
                        trend={{ label: '+2.1% kemarin', isPositive: true }}
                    />
                    <StatCard
                        title="Sakit & Izin"
                        value="12"
                        subtitle="8 Sakit, 4 Izin Resmi"
                        icon={AlertCircle}
                        variant="warning"
                    />
                    <StatCard
                        title="Keterlambatan"
                        value="4"
                        subtitle="Tertib masuk gerbang"
                        icon={Clock}
                        variant="purple"
                        trend={{ label: '-50% menurun', isPositive: true }}
                    />
                    <StatCard
                        title="Alpha / Tanpa Ket."
                        value="2"
                        subtitle="Perlu konfirmasi wali"
                        icon={XCircle}
                        variant="danger"
                        trend={{ label: 'Waspada', isPositive: false }}
                    />
                </div>

                {/* 3. Filter Bar & Quick Actions Container */}
                <div className="flex flex-col gap-4 rounded-[18px] border-2 border-[#E8E8E8] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] sm:flex-row sm:items-center sm:justify-between dark:border-[#2D234A] dark:bg-[#18122B]">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider dark:text-[#9CA3AF]">
                                Kelas:
                            </span>
                            <select
                                value={selectedKelas}
                                onChange={(e) => setSelectedKelas(e.target.value)}
                                className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3.5 py-1.5 text-sm font-semibold text-[#1F2937] focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/12 outline-none dark:border-[#2D234A] dark:bg-[#18122B] dark:text-white cursor-pointer"
                            >
                                <option value="Kelas 4-A">Kelas 4-A (Wali: Ibu Nurul)</option>
                                <option value="Kelas 4-B">Kelas 4-B (Wali: Bpk. Bambang)</option>
                                <option value="Kelas 5-A">Kelas 5-A</option>
                                <option value="Kelas 6-A">Kelas 6-A</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider dark:text-[#9CA3AF]">
                                Tanggal:
                            </span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3 py-1.5 text-sm font-semibold text-[#1F2937] focus:border-[#FF6B35] focus:ring-4 focus:ring-[#FF6B35]/12 outline-none dark:border-[#2D234A] dark:bg-[#18122B] dark:text-white"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="font-semibold text-xs">
                            Set Semua Hadir
                        </Button>
                        <Button variant="primary" size="sm" className="font-semibold text-xs">
                            Simpan Presensi
                        </Button>
                    </div>
                </div>

                {/* 4. Data Table Sesuai Spesifikasi Design System */}
                <div className="overflow-hidden rounded-[18px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                    <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-4 dark:border-[#2D234A]">
                        <div>
                            <h2 className="text-base font-bold text-[#111827] dark:text-white">
                                Presensi Siswa: {selectedKelas}
                            </h2>
                            <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                Klik opsi status untuk memperbarui catatan kehadiran dengan cepat.
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="rounded-full bg-[#E8FAF9] px-3 py-1 text-xs font-bold text-[#0D9488] dark:bg-[#113835] dark:text-[#5EEAD4]">
                                28 Siswa Terdaftar
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
                                        NISN
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
                                {students.map((student, idx) => (
                                    <tr
                                        key={student.id}
                                        className="transition-colors hover:bg-gradient-to-r hover:from-[#FFF8F5] hover:to-[#F0FFFE] dark:hover:from-[#211636] dark:hover:to-[#172433]"
                                    >
                                        <td className="px-5 py-3.5 font-bold text-[#6B7280]">
                                            {idx + 1}
                                        </td>
                                        <td className="px-5 py-3.5 font-mono text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                            {student.nisn}
                                        </td>
                                        <td className="px-5 py-3.5 font-bold text-[#1F2937] dark:text-white">
                                            {student.name}
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
                                            {student.waktuHadir}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <AttendanceBadge status={student.status} />
                                        </td>
                                        <td className="px-5 py-3.5 text-center">
                                            <AttendanceRadioGroup
                                                name={`att-${student.id}`}
                                                value={student.status}
                                                compact
                                                onChange={(val) =>
                                                    handleStatusChange(student.id, val)
                                                }
                                            />
                                        </td>
                                    </tr>
                                ))}
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
            href: dashboard(),
        },
    ],
};
