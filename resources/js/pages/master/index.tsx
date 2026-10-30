import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertCircle,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ClipboardPaste,
    Download,
    Edit3,
    FileSpreadsheet,
    GraduationCap,
    HelpCircle,
    KeyRound,
    Plus,
    PlusCircle,
    Search,
    Shield,
    Trash2,
    Upload,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
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
    nip?: string | null;
    username: string;
    email: string;
    role: string;
    homeroom_class?: string;
    duty_days?: string;
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
    selectedClassroomId: number | null;
    search: string;
    students: {
        data: StudentItem[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    teachers: TeacherItem[];
    dutySchedules: DutyScheduleItem[];
}

interface ParsedStudentRow {
    nisn: string;
    nis: string;
    name: string;
    gender: 'L' | 'P';
    classroom_name?: string;
    [key: string]: any;
}

export default function MasterIndexPage({
    classrooms = [],
    selectedClassroomId,
    search = '',
    students,
    teachers = [],
    dutySchedules = [],
}: MasterPageProps) {
    const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'classrooms' | 'duty'>('students');
    const [searchTerm, setSearchTerm] = useState(search);

    // Modal States
    const [showStudentModal, setShowStudentModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);

    const [showImportModal, setShowImportModal] = useState(false);
    const [importTab, setImportTab] = useState<'excel' | 'paste'>('excel');
    const [pasteText, setPasteText] = useState('');
    const [parsedData, setParsedData] = useState<ParsedStudentRow[]>([]);
    const [importClassroomId, setImportClassroomId] = useState<number>(classrooms[0]?.id || 0);

    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<TeacherItem | null>(null);

    // Student Single Form
    const studentForm = useForm({
        classroom_id: classrooms[0]?.id || '',
        name: '',
        nisn: '',
        nis: '',
        gender: 'L' as 'L' | 'P',
        is_active: true,
    });

    // Teacher Form
    const teacherForm = useForm({
        name: '',
        nip: '',
        username: '',
        email: '',
        role: 'teacher',
        password: '',
    });

    // Classroom Form
    const classForm = useForm({
        name: '',
        academic_year: '2026/2027',
        homeroom_teacher_id: '',
    });

    // Duty Schedule Form
    const dutyForm = useForm({
        teacher_id: '',
        day_of_week: '1',
    });

    // -------------------------------------------------------------
    // SEARCH & FILTER
    // -------------------------------------------------------------
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/master',
            {
                classroom_id: selectedClassroomId || undefined,
                search: searchTerm || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    const handleClassFilter = (classId: string) => {
        router.get(
            '/master',
            {
                classroom_id: classId || undefined,
                search: searchTerm || undefined,
            },
            { preserveState: true, preserveScroll: true },
        );
    };

    // -------------------------------------------------------------
    // STUDENT CRUD
    // -------------------------------------------------------------
    const openCreateStudent = () => {
        setEditingStudent(null);
        studentForm.reset();
        studentForm.setData({
            classroom_id: selectedClassroomId || classrooms[0]?.id || '',
            name: '',
            nisn: '',
            nis: '',
            gender: 'L',
            is_active: true,
        });
        setShowStudentModal(true);
    };

    const openEditStudent = (s: StudentItem) => {
        setEditingStudent(s);
        studentForm.setData({
            classroom_id: s.classroom_id,
            name: s.name,
            nisn: s.nisn,
            nis: s.nis,
            gender: s.gender,
            is_active: s.is_active,
        });
        setShowStudentModal(true);
    };

    const handleSaveStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingStudent) {
            studentForm.put(`/master/students/${editingStudent.id}`, {
                onSuccess: () => setShowStudentModal(false),
            });
        } else {
            studentForm.post('/master/students', {
                onSuccess: () => setShowStudentModal(false),
            });
        }
    };

    const handleDeleteStudent = (s: StudentItem) => {
        if (confirm(`Apakah Anda yakin ingin menghapus data siswa ${s.name}?`)) {
            router.delete(`/master/students/${s.id}`, {
                preserveScroll: true,
            });
        }
    };

    // -------------------------------------------------------------
    // EXCEL & COPY PASTE IMPORT
    // -------------------------------------------------------------
    const parseExcelFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (json.length === 0) return;

                // Look for header row or parse rows
                const rows: ParsedStudentRow[] = [];
                // Check if first row is header
                const startIndex = typeof json[0][0] === 'string' && isNaN(Number(json[0][0])) ? 1 : 0;

                for (let i = startIndex; i < json.length; i++) {
                    const row = json[i];
                    if (!row || row.length === 0) continue;

                    // Support format: NISN, NIS, Nama, L/P, Kelas OR No, NISN, NIS, Nama, L/P
                    let nisn = '';
                    let nis = '';
                    let name = '';
                    let gender: 'L' | 'P' = 'L';
                    let clsName = '';

                    // Heuristic column matching
                    const cells = row.map((c: any) => (c !== undefined && c !== null ? String(c).trim() : ''));
                    // Filter empty cells
                    if (cells.every((c: string) => !c)) continue;

                    if (cells.length >= 4) {
                        // Check if cell 0 is row number e.g. "1", "2"
                        const isFirstNumber = !isNaN(Number(cells[0])) && cells[0].length <= 3 && cells[1] && cells[1].length > 4;
                        const offset = isFirstNumber ? 1 : 0;

                        nisn = cells[offset] || '';
                        nis = cells[offset + 1] || '';
                        name = cells[offset + 2] || '';
                        const rawGender = (cells[offset + 3] || '').toUpperCase();
                        gender = rawGender.startsWith('P') ? 'P' : 'L';
                        clsName = cells[offset + 4] || '';
                    }

                    if (name && nisn) {
                        rows.push({
                            nisn,
                            nis: nis || nisn,
                            name,
                            gender,
                            classroom_name: clsName,
                        });
                    }
                }

                setParsedData(rows);
            } catch (err) {
                alert('Gagal membaca file Excel. Pastikan format file adalah .xlsx atau .csv');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handlePasteProcess = () => {
        if (!pasteText.trim()) return;

        const lines = pasteText.split(/\r?\n/);
        const rows: ParsedStudentRow[] = [];

        lines.forEach((line) => {
            if (!line.trim()) return;
            // Split by tab (Excel copy delimiter) or comma
            const parts = line.includes('\t') ? line.split('\t') : line.split(',');
            const cells = parts.map((p) => p.trim());

            // Skip header if line contains 'nama' or 'nisn'
            if (cells.some((c) => c.toLowerCase() === 'nama' || c.toLowerCase() === 'nisn')) {
                return;
            }

            let nisn = '';
            let nis = '';
            let name = '';
            let gender: 'L' | 'P' = 'L';
            let clsName = '';

            const isFirstNumber = !isNaN(Number(cells[0])) && cells[0].length <= 3 && cells[1] && cells[1].length >= 4;
            const offset = isFirstNumber ? 1 : 0;

            if (cells.length >= offset + 3) {
                nisn = cells[offset] || '';
                nis = cells[offset + 1] || '';
                name = cells[offset + 2] || '';
                const rawGender = (cells[offset + 3] || '').toUpperCase();
                gender = rawGender.startsWith('P') ? 'P' : 'L';
                clsName = cells[offset + 4] || '';
            }

            if (name && nisn) {
                rows.push({
                    nisn,
                    nis: nis || nisn,
                    name,
                    gender,
                    classroom_name: clsName,
                });
            }
        });

        setParsedData(rows);
    };

    const handleExecuteImport = () => {
        if (parsedData.length === 0) return;

        router.post(
            '/master/students/batch-import',
            {
                classroom_id: importClassroomId || undefined,
                students: parsedData,
            },
            {
                onSuccess: () => {
                    setShowImportModal(false);
                    setParsedData([]);
                    setPasteText('');
                },
            },
        );
    };

    const downloadTemplate = () => {
        const templateData = [
            ['NISN', 'NIS', 'Nama Siswa', 'Jenis Kelamin (L/P)', 'Kelas'],
            ['0089218201', '4001', 'Ahmad Faiz Pratama', 'L', 'Kelas 4-A'],
            ['0089218202', '4002', 'Anindya Putri Kirana', 'P', 'Kelas 4-A'],
            ['0089218203', '4003', 'Bagas Aditya Nugraha', 'L', 'Kelas 4-B'],
        ];
        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
        XLSX.writeFile(wb, 'Format_Import_Data_Siswa.xlsx');
    };

    // -------------------------------------------------------------
    // TEACHER CRUD
    // -------------------------------------------------------------
    const openCreateTeacher = () => {
        setEditingTeacher(null);
        teacherForm.reset();
        setShowTeacherModal(true);
    };

    const openEditTeacher = (t: TeacherItem) => {
        setEditingTeacher(t);
        teacherForm.setData({
            name: t.name,
            nip: t.nip || '',
            username: t.username,
            email: t.email,
            role: t.role,
            password: '',
        });
        setShowTeacherModal(true);
    };

    const handleSaveTeacher = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingTeacher) {
            teacherForm.put(`/master/teachers/${editingTeacher.id}`, {
                onSuccess: () => setShowTeacherModal(false),
            });
        } else {
            teacherForm.post('/master/teachers', {
                onSuccess: () => setShowTeacherModal(false),
            });
        }
    };

    const handleDeleteTeacher = (t: TeacherItem) => {
        if (confirm(`Apakah Anda yakin ingin menghapus data guru ${t.name}?`)) {
            router.delete(`/master/teachers/${t.id}`, {
                preserveScroll: true,
            });
        }
    };

    // Classroom & Duty Handlers
    const handleCreateClass = (e: React.FormEvent) => {
        e.preventDefault();
        classForm.post('/master/classrooms', {
            onSuccess: () => classForm.reset('name'),
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
            <Head title="Kelola Data Master - AbsensiKu" />
            <div className="flex flex-1 flex-col gap-6 p-6 sm:p-8 bg-page-gradient min-h-screen">
                <PageBanner
                    badgeText="Modul Administrator Sistem"
                    title="Kelola Data Master Siswa, Guru & Rombel 🏫"
                    description="Kelola data guru pengajar, peserta didik aktif dengan fitur import Excel & copy-paste langsung, serta penetapan rombel dan piket sekolah."
                />

                {/* Main Navigation Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-white/10">
                    <button
                        type="button"
                        onClick={() => setActiveTab('students')}
                        className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                            activeTab === 'students'
                                ? 'border-[#FF6B35] text-[#FF6B35]'
                                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
                        }`}
                    >
                        <Users className="size-4" />
                        Data Siswa ({students.total})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('teachers')}
                        className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                            activeTab === 'teachers'
                                ? 'border-[#FF6B35] text-[#FF6B35]'
                                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
                        }`}
                    >
                        <Shield className="size-4" />
                        Data Guru & Staf ({teachers.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('classrooms')}
                        className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                            activeTab === 'classrooms'
                                ? 'border-[#FF6B35] text-[#FF6B35]'
                                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
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
                                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
                        }`}
                    >
                        <CalendarDays className="size-4" />
                        Jadwal Guru Piket ({dutySchedules.length})
                    </button>
                </div>

                {/* ========================================================= */}
                {/* TAB 1: DATA SISWA (CRUD + IMPORT EXCEL & COPY PASTE)      */}
                {/* ========================================================= */}
                {activeTab === 'students' && (
                    <div className="flex flex-col gap-6">
                        {/* Control & Action Bar */}
                        <div className="flex flex-col gap-4 rounded-[18px] border-2 border-[#E8E8E8] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] lg:flex-row lg:items-center lg:justify-between dark:border-[#2D234A] dark:bg-[#18122B]">
                            <div className="flex flex-wrap items-center gap-3">
                                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                                    <Search className="absolute left-3 size-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari NISN, NIS, atau nama..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-64 rounded-xl border-2 border-[#E8E8E8] bg-white pl-9 pr-3 py-1.5 text-xs text-gray-800 focus:border-[#FF6B35] outline-none"
                                    />
                                </form>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-gray-500">Kelas:</span>
                                    <select
                                        value={selectedClassroomId || ''}
                                        onChange={(e) => handleClassFilter(e.target.value)}
                                        className="rounded-xl border-2 border-[#E8E8E8] bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 focus:border-[#FF6B35] outline-none cursor-pointer"
                                    >
                                        <option value="">Semua Rombel</option>
                                        {classrooms.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2.5">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowImportModal(true)}
                                    className="font-bold text-xs bg-[#E8FAF9] text-[#0D9488] hover:bg-[#CCFBF1] border border-[#0D9488]/30 shadow-sm"
                                >
                                    <FileSpreadsheet className="size-4 mr-1.5" />
                                    Import Excel / Copy-Paste
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    onClick={openCreateStudent}
                                    className="font-bold text-xs bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand hover:translate-y-[-1px] transition-all"
                                >
                                    <Plus className="size-4 mr-1" />
                                    Tambah Siswa Baru
                                </Button>
                            </div>
                        </div>

                        {/* Student Data Table */}
                        <div className="overflow-hidden rounded-[18px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                            <div className="flex items-center justify-between border-b border-[#E8E8E8] px-6 py-4 dark:border-[#2D234A]">
                                <div>
                                    <h3 className="text-base font-bold text-[#111827] dark:text-white">
                                        Daftar Peserta Didik
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        Menampilkan {students.from ?? 0} - {students.to ?? 0} dari total {students.total} siswa aktif.
                                    </p>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="bg-table-header border-b-2 border-[#FFD4C2] dark:border-[#3D2520]">
                                            <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">No</th>
                                            <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">NISN / NIS</th>
                                            <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">Nama Lengkap</th>
                                            <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">Kelas</th>
                                            <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">L/P</th>
                                            <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-[#FF6B35]">Status</th>
                                            <th className="px-5 py-3.5 text-center text-xs font-bold uppercase tracking-wider text-[#FF6B35]">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                                        {students.data.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="text-center py-12 text-gray-500 font-medium">
                                                    Tidak ditemukan data siswa. Gunakan tombol Tambah Siswa atau Import Excel untuk menambahkan.
                                                </td>
                                            </tr>
                                        ) : (
                                            students.data.map((s, idx) => (
                                                <tr key={s.id} className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors">
                                                    <td className="px-5 py-3.5 text-xs font-bold text-gray-500">
                                                        {(students.current_page - 1) * students.per_page + idx + 1}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs font-mono text-gray-600">
                                                        <div>{s.nisn}</div>
                                                        <div className="text-[11px] text-gray-400">NIS: {s.nis}</div>
                                                    </td>
                                                    <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                                                        {s.name}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">
                                                        <span className="rounded-md bg-gray-100 px-2 py-0.5">
                                                            {s.classroom?.name ?? '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs font-bold">
                                                        <span
                                                            className={`inline-flex size-6 items-center justify-center rounded-md ${
                                                                s.gender === 'L'
                                                                    ? 'bg-[#E8FAF9] text-[#0D9488]'
                                                                    : 'bg-[#EDE9FE] text-[#7C3AED]'
                                                            }`}
                                                        >
                                                            {s.gender}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs">
                                                        <span
                                                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                                s.is_active
                                                                    ? 'bg-emerald-100 text-emerald-800'
                                                                    : 'bg-gray-100 text-gray-500'
                                                            }`}
                                                        >
                                                            {s.is_active ? 'Aktif' : 'Non-Aktif'}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-3.5 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditStudent(s)}
                                                                className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                                                                title="Edit Siswa"
                                                            >
                                                                <Edit3 className="size-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteStudent(s)}
                                                                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                                                                title="Hapus Siswa"
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

                            {/* Pagination */}
                            {students.last_page > 1 && (
                                <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 dark:border-white/10">
                                    <div className="text-xs text-gray-500">
                                        Halaman {students.current_page} dari {students.last_page}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {students.links.map((link, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                disabled={!link.url || link.active}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                                                    link.active
                                                        ? 'bg-[#FF6B35] text-white'
                                                        : link.url
                                                        ? 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                                                        : 'text-gray-300 cursor-not-allowed'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 2: DATA GURU & STAF (CRUD)                            */}
                {/* ========================================================= */}
                {activeTab === 'teachers' && (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-[18px] border-2 border-[#E8E8E8] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                            <div>
                                <h3 className="text-base font-bold text-[#111827] dark:text-white">
                                    Daftar Tenaga Pendidik & Pegawai
                                </h3>
                                <p className="text-xs text-gray-500">
                                    Kelola akun guru, wali kelas, guru piket, dan hak akses login sistem.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={openCreateTeacher}
                                className="font-bold text-xs bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand hover:translate-y-[-1px] transition-all"
                            >
                                <Plus className="size-4 mr-1" />
                                Tambah Guru Baru
                            </Button>
                        </div>

                        <div className="overflow-hidden rounded-[18px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="bg-table-header border-b-2 border-[#FFD4C2] dark:border-[#3D2520]">
                                            <th className="px-5 py-3.5 text-xs font-bold uppercase text-[#FF6B35]">No</th>
                                            <th className="px-5 py-3.5 text-xs font-bold uppercase text-[#FF6B35]">Nama Guru & NIP</th>
                                            <th className="px-5 py-3.5 text-xs font-bold uppercase text-[#FF6B35]">Username & Email</th>
                                            <th className="px-5 py-3.5 text-xs font-bold uppercase text-[#FF6B35]">Peran Akses</th>
                                            <th className="px-5 py-3.5 text-xs font-bold uppercase text-[#FF6B35]">Wali Kelas</th>
                                            <th className="px-5 py-3.5 text-xs font-bold uppercase text-[#FF6B35]">Jadwal Piket</th>
                                            <th className="px-5 py-3.5 text-center text-xs font-bold uppercase text-[#FF6B35]">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                                        {teachers.map((t, idx) => (
                                            <tr key={t.id} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="px-5 py-3.5 text-xs font-bold text-gray-500">{idx + 1}</td>
                                                <td className="px-5 py-3.5">
                                                    <div className="font-bold text-gray-900 text-xs">{t.name}</div>
                                                    <div className="text-[11px] font-mono text-gray-400">
                                                        NIP: {t.nip || 'Belum diisi'}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-gray-600">
                                                    <div className="font-mono font-medium text-gray-800">@{t.username}</div>
                                                    <div className="text-[11px] text-gray-400">{t.email}</div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                            t.role === 'admin'
                                                                ? 'bg-purple-100 text-purple-800'
                                                                : t.role === 'principal'
                                                                ? 'bg-amber-100 text-amber-800'
                                                                : 'bg-teal-100 text-teal-800'
                                                        }`}
                                                    >
                                                        {t.role === 'admin' ? 'Administrator' : t.role === 'principal' ? 'Kepala Sekolah' : 'Guru Pengajar'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs font-semibold text-gray-700">
                                                    {t.homeroom_class ? (
                                                        <span className="rounded bg-teal-50 px-2 py-0.5 text-teal-700">
                                                            {t.homeroom_class}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic">-</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-purple-700 font-semibold">
                                                    {t.duty_days || <span className="text-gray-400 italic">-</span>}
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditTeacher(t)}
                                                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                                                            title="Edit Guru"
                                                        >
                                                            <Edit3 className="size-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteTeacher(t)}
                                                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                                                            title="Hapus Guru"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 3: DATA KELAS / ROMBEL                                */}
                {/* ========================================================= */}
                {activeTab === 'classrooms' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                {/* ========================================================= */}
                {/* TAB 4: JADWAL GURU PIKET                                  */}
                {/* ========================================================= */}
                {activeTab === 'duty' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

                {/* ========================================================= */}
                {/* MODAL 1: TAMBAH / EDIT SISWA                              */}
                {/* ========================================================= */}
                {showStudentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                        <div className="w-full max-w-md rounded-[22px] bg-white p-6 shadow-2xl dark:bg-[#18122B] animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between border-b pb-3 mb-4">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowStudentModal(false)}
                                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveStudent} className="flex flex-col gap-3.5">
                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                        Kelas / Rombel:
                                    </label>
                                    <select
                                        value={studentForm.data.classroom_id}
                                        onChange={(e) => studentForm.setData('classroom_id', Number(e.target.value))}
                                        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-xs font-semibold"
                                        required
                                    >
                                        {classrooms.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                        Nama Lengkap Siswa:
                                    </label>
                                    <input
                                        type="text"
                                        value={studentForm.data.name}
                                        onChange={(e) => studentForm.setData('name', e.target.value)}
                                        placeholder="Nama siswa..."
                                        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-xs"
                                        required
                                    />
                                    {studentForm.errors.name && (
                                        <p className="text-red-500 text-[11px] mt-1">{studentForm.errors.name}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase block mb-1">NISN:</label>
                                        <input
                                            type="text"
                                            value={studentForm.data.nisn}
                                            onChange={(e) => studentForm.setData('nisn', e.target.value)}
                                            placeholder="0089218201"
                                            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-xs font-mono"
                                            required
                                        />
                                        {studentForm.errors.nisn && (
                                            <p className="text-red-500 text-[11px] mt-1">{studentForm.errors.nisn}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase block mb-1">NIS:</label>
                                        <input
                                            type="text"
                                            value={studentForm.data.nis}
                                            onChange={(e) => studentForm.setData('nis', e.target.value)}
                                            placeholder="4001"
                                            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-xs font-mono"
                                            required
                                        />
                                        {studentForm.errors.nis && (
                                            <p className="text-red-500 text-[11px] mt-1">{studentForm.errors.nis}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Jenis Kelamin:</label>
                                        <select
                                            value={studentForm.data.gender}
                                            onChange={(e) => studentForm.setData('gender', e.target.value as 'L' | 'P')}
                                            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-xs font-semibold"
                                        >
                                            <option value="L">Laki-laki (L)</option>
                                            <option value="P">Perempuan (P)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase block mb-1">Status Keaktifan:</label>
                                        <select
                                            value={studentForm.data.is_active ? '1' : '0'}
                                            onChange={(e) => studentForm.setData('is_active', e.target.value === '1')}
                                            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-xs font-semibold"
                                        >
                                            <option value="1">Aktif</option>
                                            <option value="0">Non-Aktif</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowStudentModal(false)}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        disabled={studentForm.processing}
                                        className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand font-bold"
                                    >
                                        {studentForm.processing ? 'Menyimpan...' : 'Simpan Data'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* MODAL 2: IMPORT EXCEL & COPY-PASTE                        */}
                {/* ========================================================= */}
                {showImportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                        <div className="w-full max-w-3xl rounded-[22px] bg-white p-6 shadow-2xl dark:bg-[#18122B] max-h-[90vh] flex flex-col">
                            <div className="flex items-center justify-between border-b pb-3 mb-4 shrink-0">
                                <div className="flex items-center gap-2">
                                    <FileSpreadsheet className="size-5 text-[#FF6B35]" />
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                        Import Data Siswa Massal
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setParsedData([]);
                                    }}
                                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 pr-1 flex flex-col gap-4">
                                {/* Format guidance & Template download */}
                                <div className="flex items-center justify-between rounded-xl bg-orange-50 border border-orange-200 p-3.5 text-xs text-orange-950">
                                    <div className="flex items-start gap-2">
                                        <HelpCircle className="size-4 text-[#FF6B35] mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-bold">Format Kolom Excel:</span> [NISN] [NIS] [Nama Siswa] [L/P] [Kelas (Opsional)]
                                            <p className="text-[11px] text-orange-800 mt-0.5">
                                                Jika kolom kelas tidak diisi di Excel, siswa otomatis dimasukkan ke kelas pilihan di bawah.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={downloadTemplate}
                                        className="shrink-0 font-bold text-xs text-[#FF6B35] border border-[#FF6B35]/40 hover:bg-orange-100"
                                    >
                                        <Download className="size-3.5 mr-1" />
                                        Unduh Template Excel
                                    </Button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-gray-600">Pilih Kelas Default:</span>
                                    <select
                                        value={importClassroomId}
                                        onChange={(e) => setImportClassroomId(Number(e.target.value))}
                                        className="rounded-xl border-2 border-gray-200 px-3 py-1.5 text-xs font-semibold"
                                    >
                                        {classrooms.map((c) => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Import Tabs: Upload File vs Copy Paste */}
                                <div className="flex items-center gap-2 border-b">
                                    <button
                                        type="button"
                                        onClick={() => setImportTab('excel')}
                                        className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                                            importTab === 'excel'
                                                ? 'border-[#FF6B35] text-[#FF6B35]'
                                                : 'border-transparent text-gray-400'
                                        }`}
                                    >
                                        <Upload className="size-3.5" />
                                        Upload File Excel (.xlsx / .csv)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setImportTab('paste')}
                                        className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                                            importTab === 'paste'
                                                ? 'border-[#FF6B35] text-[#FF6B35]'
                                                : 'border-transparent text-gray-400'
                                        }`}
                                    >
                                        <ClipboardPaste className="size-3.5" />
                                        Copy-Paste Langsung dari Excel
                                    </button>
                                </div>

                                {/* Option 1: File Upload */}
                                {importTab === 'excel' && (
                                    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#FF6B35]/40 bg-[#FFF0EB]/30 p-8 text-center">
                                        <FileSpreadsheet className="size-10 text-[#FF6B35] mb-2" />
                                        <div className="text-xs font-bold text-gray-800">
                                            Pilih atau tarik file Excel / CSV ke sini
                                        </div>
                                        <p className="text-[11px] text-gray-500 mt-1 mb-3">
                                            Mendukung ekstensi .xlsx, .xls, dan .csv
                                        </p>
                                        <label className="cursor-pointer">
                                            <input
                                                type="file"
                                                accept=".xlsx, .xls, .csv"
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        parseExcelFile(e.target.files[0]);
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                            <span className="rounded-xl bg-[#FF6B35] px-4 py-2 text-xs font-bold text-white shadow-brand hover:bg-[#E55A25]">
                                                Pilih File dari Komputer
                                            </span>
                                        </label>
                                    </div>
                                )}

                                {/* Option 2: Copy-Paste Box */}
                                {importTab === 'paste' && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-gray-600">
                                            Paste Baris Tabel dari Excel di Sini (Ctrl+V):
                                        </label>
                                        <textarea
                                            rows={5}
                                            value={pasteText}
                                            onChange={(e) => setPasteText(e.target.value)}
                                            placeholder={`Contoh copy-paste dari Excel:\n0089218201\t4001\tAhmad Faiz Pratama\tL\tKelas 4-A\n0089218202\t4002\tAnindya Putri Kirana\tP\tKelas 4-A`}
                                            className="w-full rounded-xl border-2 border-gray-200 p-3 font-mono text-xs focus:border-[#FF6B35] outline-none"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handlePasteProcess}
                                            className="self-end text-xs font-bold bg-[#FF6B35] text-white hover:bg-[#E55A25]"
                                        >
                                            Proses Teks Paste
                                        </Button>
                                    </div>
                                )}

                                {/* Live Preview Table */}
                                {parsedData.length > 0 && (
                                    <div className="flex flex-col gap-2 mt-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-800">
                                                Pratinjau Hasil Parsing ({parsedData.length} baris siap disimpan):
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setParsedData([])}
                                                className="text-[11px] text-red-500 font-bold hover:underline"
                                            >
                                                Hapus / Reset
                                            </button>
                                        </div>

                                        <div className="overflow-x-auto max-h-48 rounded-xl border border-gray-200">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-gray-50 border-b font-bold text-gray-600 sticky top-0">
                                                    <tr>
                                                        <th className="p-2.5">No</th>
                                                        <th className="p-2.5">NISN</th>
                                                        <th className="p-2.5">NIS</th>
                                                        <th className="p-2.5">Nama Siswa</th>
                                                        <th className="p-2.5">L/P</th>
                                                        <th className="p-2.5">Kelas</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {parsedData.map((row, i) => (
                                                        <tr key={i} className="hover:bg-gray-50/50">
                                                            <td className="p-2 text-gray-400 font-bold">{i + 1}</td>
                                                            <td className="p-2 font-mono">{row.nisn}</td>
                                                            <td className="p-2 font-mono">{row.nis}</td>
                                                            <td className="p-2 font-semibold text-gray-900">{row.name}</td>
                                                            <td className="p-2 font-bold">{row.gender}</td>
                                                            <td className="p-2 text-teal-700 font-medium">
                                                                {row.classroom_name || 'Mengikuti Kelas Default'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t mt-4 shrink-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setParsedData([]);
                                    }}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    disabled={parsedData.length === 0}
                                    onClick={handleExecuteImport}
                                    className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand font-bold"
                                >
                                    <CheckCircle2 className="size-4 mr-1.5" />
                                    Simpan {parsedData.length} Data Siswa
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* MODAL 3: TAMBAH / EDIT GURU                               */}
                {/* ========================================================= */}
                {showTeacherModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                        <div className="w-full max-w-md rounded-[22px] bg-white p-6 shadow-2xl dark:bg-[#18122B] animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between border-b pb-3 mb-4">
                                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                    {editingTeacher ? 'Edit Data Guru' : 'Tambah Guru & Pegawai Baru'}
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowTeacherModal(false)}
                                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveTeacher} className="flex flex-col gap-3.5">
                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                        Nama Lengkap & Gelar:
                                    </label>
                                    <input
                                        type="text"
                                        value={teacherForm.data.name}
                                        onChange={(e) => teacherForm.setData('name', e.target.value)}
                                        placeholder="Contoh: Dra. Hj. Siti Fatimah, M.Pd."
                                        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-xs"
                                        required
                                    />
                                    {teacherForm.errors.name && (
                                        <p className="text-red-500 text-[11px] mt-1">{teacherForm.errors.name}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                            NIP (Opsional):
                                        </label>
                                        <input
                                            type="text"
                                            value={teacherForm.data.nip}
                                            onChange={(e) => teacherForm.setData('nip', e.target.value)}
                                            placeholder="19800101..."
                                            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-xs font-mono"
                                        />
                                        {teacherForm.errors.nip && (
                                            <p className="text-red-500 text-[11px] mt-1">{teacherForm.errors.nip}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                            Peran Akses:
                                        </label>
                                        <select
                                            value={teacherForm.data.role}
                                            onChange={(e) => teacherForm.setData('role', e.target.value)}
                                            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-xs font-semibold"
                                        >
                                            <option value="teacher">Guru Pengajar</option>
                                            <option value="principal">Kepala Sekolah</option>
                                            <option value="admin">Administrator</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                            Username Login:
                                        </label>
                                        <input
                                            type="text"
                                            value={teacherForm.data.username}
                                            onChange={(e) => teacherForm.setData('username', e.target.value)}
                                            placeholder="siti_guru"
                                            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-xs font-mono"
                                            required
                                        />
                                        {teacherForm.errors.username && (
                                            <p className="text-red-500 text-[11px] mt-1">{teacherForm.errors.username}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                            Email:
                                        </label>
                                        <input
                                            type="email"
                                            value={teacherForm.data.email}
                                            onChange={(e) => teacherForm.setData('email', e.target.value)}
                                            placeholder="siti@absensiku.com"
                                            className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-xs"
                                            required
                                        />
                                        {teacherForm.errors.email && (
                                            <p className="text-red-500 text-[11px] mt-1">{teacherForm.errors.email}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-600 uppercase block mb-1">
                                        Password {editingTeacher ? '(Kosongkan jika tidak diubah)' : 'Login'}:
                                    </label>
                                    <input
                                        type="password"
                                        value={teacherForm.data.password}
                                        onChange={(e) => teacherForm.setData('password', e.target.value)}
                                        placeholder={editingTeacher ? '••••••••' : 'Minimal 6 karakter'}
                                        className="w-full rounded-xl border-2 border-gray-200 px-3 py-2 text-xs"
                                        required={!editingTeacher}
                                    />
                                    {teacherForm.errors.password && (
                                        <p className="text-red-500 text-[11px] mt-1">{teacherForm.errors.password}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowTeacherModal(false)}
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="sm"
                                        disabled={teacherForm.processing}
                                        className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand font-bold"
                                    >
                                        {teacherForm.processing ? 'Menyimpan...' : 'Simpan Akun Guru'}
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

MasterIndexPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Master Data Siswa & Guru', href: '/master' },
    ],
};
