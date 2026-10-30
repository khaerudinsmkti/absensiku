import { Head, router, useForm } from '@inertiajs/react';
import {
    CalendarDays,
    GraduationCap,
    Plus,
    PlusCircle,
    UserCheck,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { PageBanner } from '@/components/page-banner';
import { Button } from '@/components/ui/button';

interface ClassroomItem {
    id: number;
    name: string;
    academic_year: string;
    homeroom_teacher?: { id: number; name: string } | null;
    students_count?: number;
    students?: { id: number }[];
}

interface TeacherItem {
    id: number;
    name: string;
    nip?: string;
    role: string;
}

interface StudentItem {
    id: number;
    classroom_id: number;
    classroom: { id: number; name: string };
    name: string;
    nisn: string;
    nis: string;
    gender: 'L' | 'P';
    is_active: boolean;
}

interface DutyScheduleItem {
    id: number;
    teacher_id: number;
    teacher_name: string;
    day_of_week: number;
    day_name: string;
    is_active: boolean;
}

interface MasterPageProps {
    classrooms: ClassroomItem[];
    selectedClassroomId: number;
    students: {
        data: StudentItem[];
        current_page: number;
        last_page: number;
        total: number;
    };
    teachers: TeacherItem[];
    dutySchedules: DutyScheduleItem[];
}

export default function MasterIndexPage({
    classrooms = [],
    selectedClassroomId,
    students,
    teachers = [],
    dutySchedules = [],
}: MasterPageProps) {
    const [activeTab, setActiveTab] = useState<'classrooms' | 'students' | 'duty'>('students');

    // Forms
    const classForm = useForm({
        name: '',
        academic_year: '2026/2027',
        homeroom_teacher_id: '',
    });

    const studentForm = useForm({
        classroom_id: selectedClassroomId || (classrooms[0]?.id ?? ''),
        name: '',
        nisn: '',
        nis: '',
        gender: 'L',
    });

    const dutyForm = useForm({
        teacher_id: '',
        day_of_week: '1',
    });

    const handleCreateClass = (e: React.FormEvent) => {
        e.preventDefault();
        classForm.post('/master/classrooms', {
            onSuccess: () => classForm.reset('name'),
        });
    };

    const handleCreateStudent = (e: React.FormEvent) => {
        e.preventDefault();
        studentForm.post('/master/students', {
            onSuccess: () => studentForm.reset('name', 'nisn', 'nis'),
        });
    };

    const handleCreateDuty = (e: React.FormEvent) => {
        e.preventDefault();
        dutyForm.post('/master/duty-schedules', {
            onSuccess: () => dutyForm.reset('teacher_id'),
        });
    };

    return (
        <>
            <Head title="Data Master - AbsensiKu" />
            <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8 bg-page-gradient min-h-screen">
                <PageBanner
                    badgeText="Konfigurasi Administrator & TU"
                    title="Manajemen Rombel, Siswa & Jadwal Piket 🏫"
                    description="Kelola master data kelas, peserta didik aktif, serta penetapan tugas guru piket harian sekolah."
                />

                {/* Tabs Selector */}
                <div className="flex items-center gap-2 border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => setActiveTab('students')}
                        className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                            activeTab === 'students'
                                ? 'border-[#FF6B35] text-[#FF6B35]'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <Users className="size-4" />
                        Data Siswa ({students.total})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('classrooms')}
                        className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                            activeTab === 'classrooms'
                                ? 'border-[#FF6B35] text-[#FF6B35]'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <GraduationCap className="size-4" />
                        Data Rombel / Kelas ({classrooms.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('duty')}
                        className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                            activeTab === 'duty'
                                ? 'border-[#FF6B35] text-[#FF6B35]'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        <CalendarDays className="size-4" />
                        Jadwal Guru Piket ({dutySchedules.length})
                    </button>
                </div>

                {/* TAB 1: DATA SISWA */}
                {activeTab === 'students' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Form Tambah Siswa */}
                        <div className="lg:col-span-1 rounded-[18px] border-2 border-[#E8E8E8] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                            <h3 className="text-base font-bold text-[#111827] flex items-center gap-2 mb-4">
                                <PlusCircle className="size-5 text-[#FF6B35]" />
                                Tambah Siswa Baru
                            </h3>
                            <form onSubmit={handleCreateStudent} className="flex flex-col gap-3.5">
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
                                        Kelas:
                                    </label>
                                    <select
                                        value={studentForm.data.classroom_id}
                                        onChange={(e) => studentForm.setData('classroom_id', Number(e.target.value))}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-semibold"
                                        required
                                    >
                                        {classrooms.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
                                        Nama Lengkap Siswa:
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Muhammad Rizky Pratama"
                                        value={studentForm.data.name}
                                        onChange={(e) => studentForm.setData('name', e.target.value)}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs"
                                        required
                                    />
                                    {studentForm.errors.name && (
                                        <p className="text-red-500 text-[11px] mt-1">{studentForm.errors.name}</p>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
                                            NISN:
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="0089218201"
                                            value={studentForm.data.nisn}
                                            onChange={(e) => studentForm.setData('nisn', e.target.value)}
                                            className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-mono"
                                            required
                                        />
                                        {studentForm.errors.nisn && (
                                            <p className="text-red-500 text-[11px] mt-1">{studentForm.errors.nisn}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
                                            NIS:
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="4001"
                                            value={studentForm.data.nis}
                                            onChange={(e) => studentForm.setData('nis', e.target.value)}
                                            className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-mono"
                                            required
                                        />
                                        {studentForm.errors.nis && (
                                            <p className="text-red-500 text-[11px] mt-1">{studentForm.errors.nis}</p>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
                                        Jenis Kelamin:
                                    </label>
                                    <select
                                        value={studentForm.data.gender}
                                        onChange={(e) => studentForm.setData('gender', e.target.value as 'L' | 'P')}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-semibold"
                                    >
                                        <option value="L">Laki-laki (L)</option>
                                        <option value="P">Perempuan (P)</option>
                                    </select>
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={studentForm.processing}
                                    className="w-full mt-2 font-bold text-xs bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand"
                                >
                                    {studentForm.processing ? 'Menyimpan...' : 'Simpan Siswa'}
                                </Button>
                            </form>
                        </div>

                        {/* List Siswa */}
                        <div className="lg:col-span-2 overflow-hidden rounded-[18px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                            <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-4">
                                <h3 className="text-base font-bold text-[#111827]">Daftar Peserta Didik</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-500">Filter Rombel:</span>
                                    <select
                                        value={selectedClassroomId || ''}
                                        onChange={(e) => router.get('/master', { classroom_id: e.target.value }, { preserveState: true })}
                                        className="rounded-xl border border-gray-200 px-2.5 py-1 text-xs font-semibold"
                                    >
                                        {classrooms.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="bg-table-header border-b-2 border-[#FFD4C2]">
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">No</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">NISN / NIS</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Nama Lengkap</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Kelas</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">L/P</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {students.data.map((s, idx) => (
                                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-3 text-xs font-bold text-gray-500">{idx + 1}</td>
                                                <td className="px-5 py-3 text-xs font-mono text-gray-600">
                                                    <div>{s.nisn}</div>
                                                    <div className="text-[10px] text-gray-400">NIS: {s.nis}</div>
                                                </td>
                                                <td className="px-5 py-3 font-bold text-gray-900 text-xs">{s.name}</td>
                                                <td className="px-5 py-3 text-xs font-medium text-gray-700">{s.classroom.name}</td>
                                                <td className="px-5 py-3 text-xs font-bold">
                                                    <span className={`inline-flex size-6 items-center justify-center rounded ${s.gender === 'L' ? 'bg-teal-50 text-teal-700' : 'bg-purple-50 text-purple-700'}`}>
                                                        {s.gender}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-xs">
                                                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                                                        Aktif
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: DATA KELAS */}
                {activeTab === 'classrooms' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Form Tambah Kelas */}
                        <div className="lg:col-span-1 rounded-[18px] border-2 border-[#E8E8E8] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                            <h3 className="text-base font-bold text-[#111827] flex items-center gap-2 mb-4">
                                <PlusCircle className="size-5 text-[#FF6B35]" />
                                Tambah Rombel Baru
                            </h3>
                            <form onSubmit={handleCreateClass} className="flex flex-col gap-3.5">
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
                                        Nama Rombel / Kelas:
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Kelas 5-B"
                                        value={classForm.data.name}
                                        onChange={(e) => classForm.setData('name', e.target.value)}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs"
                                        required
                                    />
                                    {classForm.errors.name && (
                                        <p className="text-red-500 text-[11px] mt-1">{classForm.errors.name}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
                                        Tahun Ajaran:
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="2026/2027"
                                        value={classForm.data.academic_year}
                                        onChange={(e) => classForm.setData('academic_year', e.target.value)}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-medium"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
                                        Wali Kelas:
                                    </label>
                                    <select
                                        value={classForm.data.homeroom_teacher_id}
                                        onChange={(e) => classForm.setData('homeroom_teacher_id', e.target.value)}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-semibold"
                                    >
                                        <option value="">-- Pilih Guru --</option>
                                        {teachers.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={classForm.processing}
                                    className="w-full mt-2 font-bold text-xs bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand"
                                >
                                    {classForm.processing ? 'Menyimpan...' : 'Simpan Kelas'}
                                </Button>
                            </form>
                        </div>

                        {/* List Kelas */}
                        <div className="lg:col-span-2 overflow-hidden rounded-[18px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                            <div className="border-b border-[#E8E8E8] px-6 py-4">
                                <h3 className="text-base font-bold text-[#111827]">Daftar Rombel / Kelas Aktif</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="bg-table-header border-b-2 border-[#FFD4C2]">
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">No</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Nama Kelas</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Tahun Akademik</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Wali Kelas</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Jumlah Siswa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {classrooms.map((c, idx) => (
                                            <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-3.5 text-xs font-bold text-gray-500">{idx + 1}</td>
                                                <td className="px-5 py-3.5 font-bold text-gray-900 text-xs">{c.name}</td>
                                                <td className="px-5 py-3.5 text-xs font-semibold text-gray-600">{c.academic_year}</td>
                                                <td className="px-5 py-3.5 text-xs font-medium text-gray-800">
                                                    {c.homeroom_teacher?.name ?? <span className="text-gray-400 italic">Belum ditentukan</span>}
                                                </td>
                                                <td className="px-5 py-3.5 text-xs font-bold text-teal-700">
                                                    {c.students?.length ?? 0} Siswa
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: JADWAL GURU PIKET */}
                {activeTab === 'duty' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Form Tambah Piket */}
                        <div className="lg:col-span-1 rounded-[18px] border-2 border-[#E8E8E8] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                            <h3 className="text-base font-bold text-[#111827] flex items-center gap-2 mb-4">
                                <PlusCircle className="size-5 text-[#FF6B35]" />
                                Tetapkan Guru Piket
                            </h3>
                            <form onSubmit={handleCreateDuty} className="flex flex-col gap-3.5">
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
                                        Pilih Guru:
                                    </label>
                                    <select
                                        value={dutyForm.data.teacher_id}
                                        onChange={(e) => dutyForm.setData('teacher_id', e.target.value)}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-semibold"
                                        required
                                    >
                                        <option value="">-- Pilih Guru --</option>
                                        {teachers.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    {dutyForm.errors.teacher_id && (
                                        <p className="text-red-500 text-[11px] mt-1">{dutyForm.errors.teacher_id}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
                                        Hari Bertugas:
                                    </label>
                                    <select
                                        value={dutyForm.data.day_of_week}
                                        onChange={(e) => dutyForm.setData('day_of_week', e.target.value)}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-semibold"
                                    >
                                        <option value="1">Senin</option>
                                        <option value="2">Selasa</option>
                                        <option value="3">Rabu</option>
                                        <option value="4">Kamis</option>
                                        <option value="5">Jumat</option>
                                        <option value="6">Sabtu</option>
                                    </select>
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={dutyForm.processing}
                                    className="w-full mt-2 font-bold text-xs bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand"
                                >
                                    {dutyForm.processing ? 'Menyimpan...' : 'Simpan Jadwal Piket'}
                                </Button>
                            </form>
                        </div>

                        {/* List Jadwal Piket */}
                        <div className="lg:col-span-2 overflow-hidden rounded-[18px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                            <div className="border-b border-[#E8E8E8] px-6 py-4">
                                <h3 className="text-base font-bold text-[#111827]">Jadwal Tugas Guru Piket Mingguan</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="bg-table-header border-b-2 border-[#FFD4C2]">
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Hari</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Nama Guru Piket</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Status Otoritas</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {dutySchedules.map((ds) => (
                                            <tr key={ds.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-3.5 font-bold text-gray-900 text-xs">
                                                    <span className="rounded-md bg-purple-50 text-purple-700 px-2.5 py-1">
                                                        {ds.day_name}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 font-bold text-gray-800 text-xs">{ds.teacher_name}</td>
                                                <td className="px-5 py-3.5 text-xs">
                                                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold">
                                                        Akses Piket Aktif
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

MasterIndexPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Master Data Siswa & Kelas', href: '/master' },
    ],
};

