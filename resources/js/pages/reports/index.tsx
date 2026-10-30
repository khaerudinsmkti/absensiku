import { Head, router } from '@inertiajs/react';
import {
    Calendar,
    Download,
    FileSpreadsheet,
    Filter,
    Percent,
    Printer,
    UserCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { PageBanner } from '@/components/page-banner';
import { StatCard } from '@/components/stat-card';
import { Button } from '@/components/ui/button';
import type { ClassroomData } from '@/types/attendance';

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
}

interface ReportsProps {
    classrooms: ClassroomData[];
    selectedClassroomId: number;
    startDate: string;
    endDate: string;
    students: StudentReportRow[];
    summary: {
        total_students: number;
        total_hadir: number;
        total_sakit: number;
        total_izin: number;
        total_alpha: number;
        total_terlambat: number;
    };
}

export default function ReportsPage({
    classrooms = [],
    selectedClassroomId,
    startDate,
    endDate,
    students = [],
    summary,
}: ReportsProps) {
    const [classId, setClassId] = useState(selectedClassroomId);
    const [start, setStart] = useState(startDate);
    const [end, setEnd] = useState(endDate);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/reports',
            {
                classroom_id: classId,
                start_date: start,
                end_date: end,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const currentClass = classrooms.find((c) => c.id === selectedClassroomId);

    return (
        <>
            <Head title="Rekap & Laporan Presensi - AbsensiKu" />
            <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8 bg-page-gradient min-h-screen">
                <PageBanner
                    badgeText="Laporan & Audit Presensi"
                    title="Rekapitulasi Kehadiran Siswa 📊"
                    description="Pantau performa kehadiran berkala mingguan, bulanan, atau semesteran. Cetak rekapitulasi atau unduh data dalam format CSV/Excel untuk pelaporan resmi."
                    action={
                        <div className="flex flex-wrap gap-2.5">
                            <Button
                                asChild
                                variant="secondary"
                                className="bg-white text-[#FF6B35] hover:bg-[#FFFBE6] shadow-sm font-bold border-none"
                            >
                                <a
                                    href={`/reports/export?classroom_id=${selectedClassroomId}&start_date=${startDate}&end_date=${endDate}`}
                                >
                                    <Download className="size-4 mr-1.5" />
                                    Ekspor CSV / Excel
                                </a>
                            </Button>
                        </div>
                    }
                />

                {/* Filter Bar */}
                <form
                    onSubmit={handleFilter}
                    className="flex flex-col gap-4 rounded-[18px] border-2 border-[#E8E8E8] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] lg:flex-row lg:items-center lg:justify-between dark:border-[#2D234A] dark:bg-[#18122B]"
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                                Kelas:
                            </span>
                            <select
                                value={classId || ''}
                                onChange={(e) => setClassId(Number(e.target.value))}
                                className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-800 focus:border-[#FF6B35] outline-none"
                            >
                                {classrooms.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#6B7280] uppercase tracking-wider">
                                Dari:
                            </span>
                            <input
                                type="date"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 focus:border-[#FF6B35] outline-none"
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
                                className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 focus:border-[#FF6B35] outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            className="font-bold text-xs bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand"
                        >
                            <Filter className="size-3.5 mr-1.5" />
                            Terapkan Filter
                        </Button>
                    </div>
                </form>

                {/* Stat Cards Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <div className="rounded-xl border-2 border-[#E8E8E8] bg-white p-3.5">
                        <div className="text-[11px] font-bold text-gray-500 uppercase">Total Siswa</div>
                        <div className="text-xl font-extrabold text-gray-900 mt-1">{summary.total_students}</div>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-[#DCFCE7]/60 p-3.5">
                        <div className="text-[11px] font-bold text-[#059669] uppercase">Akumulasi Hadir</div>
                        <div className="text-xl font-extrabold text-[#059669] mt-1">{summary.total_hadir}</div>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-[#DBEAFE]/60 p-3.5">
                        <div className="text-[11px] font-bold text-[#1D4ED8] uppercase">Sakit</div>
                        <div className="text-xl font-extrabold text-[#1D4ED8] mt-1">{summary.total_sakit}</div>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-[#FEF3C7]/60 p-3.5">
                        <div className="text-[11px] font-bold text-[#B45309] uppercase">Izin</div>
                        <div className="text-xl font-extrabold text-[#B45309] mt-1">{summary.total_izin}</div>
                    </div>
                    <div className="rounded-xl border border-red-200 bg-[#FEE2E2]/60 p-3.5">
                        <div className="text-[11px] font-bold text-[#DC2626] uppercase">Alpha</div>
                        <div className="text-xl font-extrabold text-[#DC2626] mt-1">{summary.total_alpha}</div>
                    </div>
                    <div className="rounded-xl border border-purple-200 bg-[#EDE9FE]/60 p-3.5">
                        <div className="text-[11px] font-bold text-[#7C3AED] uppercase">Terlambat</div>
                        <div className="text-xl font-extrabold text-[#7C3AED] mt-1">{summary.total_terlambat}</div>
                    </div>
                </div>

                {/* Matrix Table */}
                <div className="overflow-hidden rounded-[18px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                    <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-4 dark:border-[#2D234A]">
                        <div>
                            <h2 className="text-base font-bold text-[#111827] dark:text-white">
                                Matriks Presensi: {currentClass?.name ?? 'Kelas'}
                            </h2>
                            <p className="text-xs text-[#6B7280]">
                                Periode {startDate} s/d {endDate} • Wali: {currentClass?.homeroom_teacher?.name ?? '-'}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="bg-table-header border-b-2 border-[#FFD4C2]">
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">No</th>
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">NISN / NIS</th>
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">Nama Peserta Didik</th>
                                    <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">L/P</th>
                                    <th className="px-4 py-3.5 text-center text-xs font-bold uppercase text-[#059669]">Hadir</th>
                                    <th className="px-4 py-3.5 text-center text-xs font-bold uppercase text-[#1D4ED8]">Sakit</th>
                                    <th className="px-4 py-3.5 text-center text-xs font-bold uppercase text-[#B45309]">Izin</th>
                                    <th className="px-4 py-3.5 text-center text-xs font-bold uppercase text-[#DC2626]">Alpha</th>
                                    <th className="px-4 py-3.5 text-center text-xs font-bold uppercase text-[#7C3AED]">Terlambat</th>
                                    <th className="px-4 py-3.5 text-center text-xs font-bold uppercase text-[#0F766E]">Pulang Awal</th>
                                    <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-[#FF6B35]">Kehadiran</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F5F5F5]">
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="text-center py-12 text-gray-500 font-medium">
                                            Tidak ada data untuk filter yang dipilih.
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student, idx) => (
                                        <tr key={student.id} className="hover:bg-gray-50/70 transition-colors">
                                            <td className="px-5 py-3.5 font-bold text-gray-500">{idx + 1}</td>
                                            <td className="px-5 py-3.5 font-mono text-xs text-gray-600">
                                                <div>{student.nisn}</div>
                                                <div className="text-[11px] text-gray-400">NIS: {student.nis}</div>
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-gray-900">{student.name}</td>
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

