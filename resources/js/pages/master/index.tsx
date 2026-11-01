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
    TrendingUp,
    Upload,
    UserCheck,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { PageBanner } from '@/components/page-banner';
import { Button } from '@/components/ui/button';

interface ClassroomItem {
    id: number;
    name: string;
    academic_year: string;
    homeroom_teacher?: { id: number; name: string } | null;
    students_count?: number;
    students?: {
        id: number;
        name: string;
        nisn: string;
        nis: string;
        gender: 'L' | 'P';
        classroom_id: number;
        is_active: boolean;
    }[];
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

interface ParsedTeacherRow {
    name: string;
    nip?: string;
    email?: string;
    username?: string;
    role?: string;
    password?: string;
    [key: string]: any;
}

interface ParsedClassroomRow {
    name: string;
    academic_year?: string;
    homeroom_teacher?: string;
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
    const [activeTab, setActiveTab] = useState<'students' | 'promotions' | 'teachers' | 'classrooms' | 'duty'>('students');
    const [searchTerm, setSearchTerm] = useState(search);

    // Promotion Tab States
    const [promoSourceClassId, setPromoSourceClassId] = useState<number | ''>('');
    const [promoTargetClassId, setPromoTargetClassId] = useState<number | ''>('');
    const [studentDecisions, setStudentDecisions] = useState<Record<number, { action: 'promote' | 'repeat' | 'graduate'; targetClassId: number | '' }>>({});
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [isSubmittingPromo, setIsSubmittingPromo] = useState(false);
    const [showPromoConfirmModal, setShowPromoConfirmModal] = useState(false);

    const promoSourceClass = useMemo(() => {
        return classrooms.find((c) => c.id === Number(promoSourceClassId));
    }, [classrooms, promoSourceClassId]);

    const sourceStudents = useMemo(() => {
        return promoSourceClass?.students || [];
    }, [promoSourceClass]);

    // When source class changes, initialize student decisions and selections
    useEffect(() => {
        if (!promoSourceClass) {
            setStudentDecisions({});
            setSelectedStudentIds([]);
            return;
        }
        const initialDecisions: Record<number, { action: 'promote' | 'repeat' | 'graduate'; targetClassId: number | '' }> = {};
        const ids: number[] = [];
        promoSourceClass.students?.forEach((st) => {
            initialDecisions[st.id] = {
                action: 'promote',
                targetClassId: promoTargetClassId || '',
            };
            ids.push(st.id);
        });
        setStudentDecisions(initialDecisions);
        setSelectedStudentIds(ids);
    }, [promoSourceClassId, promoSourceClass]);

    const handleSelectAllStudents = () => {
        if (selectedStudentIds.length === sourceStudents.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(sourceStudents.map((st) => st.id));
        }
    };

    const handleToggleStudentSelect = (id: number) => {
        setSelectedStudentIds((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    const handleSetStudentAction = (id: number, action: 'promote' | 'repeat' | 'graduate') => {
        setStudentDecisions((prev) => ({
            ...prev,
            [id]: {
                action,
                targetClassId: action === 'promote' ? (prev[id]?.targetClassId || promoTargetClassId || '') : '',
            },
        }));
    };

    const handleSetStudentTargetClass = (id: number, targetClassId: number | '') => {
        setStudentDecisions((prev) => ({
            ...prev,
            [id]: {
                action: 'promote',
                targetClassId,
            },
        }));
    };

    const handleApplyTargetToSelected = () => {
        if (!promoTargetClassId) {
            toast.error('Silakan pilih Kelas Tujuan terlebih dahulu');
            return;
        }
        setStudentDecisions((prev) => {
            const next = { ...prev };
            selectedStudentIds.forEach((id) => {
                next[id] = {
                    action: 'promote',
                    targetClassId: Number(promoTargetClassId),
                };
            });
            return next;
        });
        toast.success(`Kelas tujuan diterapkan ke ${selectedStudentIds.length} siswa`);
    };

    const handleMarkSelectedAsPromote = () => {
        setStudentDecisions((prev) => {
            const next = { ...prev };
            selectedStudentIds.forEach((id) => {
                next[id] = {
                    action: 'promote',
                    targetClassId: prev[id]?.targetClassId || promoTargetClassId || '',
                };
            });
            return next;
        });
        toast.success(`${selectedStudentIds.length} siswa ditandai Naik Kelas`);
    };

    const handleMarkSelectedAsRepeat = () => {
        setStudentDecisions((prev) => {
            const next = { ...prev };
            selectedStudentIds.forEach((id) => {
                next[id] = {
                    action: 'repeat',
                    targetClassId: '',
                };
            });
            return next;
        });
        toast.info(`${selectedStudentIds.length} siswa ditandai Tinggal Kelas`);
    };

    const handleMarkSelectedAsGraduated = () => {
        setStudentDecisions((prev) => {
            const next = { ...prev };
            selectedStudentIds.forEach((id) => {
                next[id] = {
                    action: 'graduate',
                    targetClassId: '',
                };
            });
            return next;
        });
        toast.success(`${selectedStudentIds.length} siswa ditandai Lulus / Alumni`);
    };

    const promoSummary = useMemo(() => {
        let promoteCount = 0;
        let repeatCount = 0;
        let graduateCount = 0;
        let invalidCount = 0;

        selectedStudentIds.forEach((id) => {
            const decision = studentDecisions[id];
            if (!decision) return;
            if (decision.action === 'promote') {
                if (decision.targetClassId) {
                    promoteCount++;
                } else {
                    invalidCount++;
                }
            } else if (decision.action === 'repeat') {
                repeatCount++;
            } else if (decision.action === 'graduate') {
                graduateCount++;
            }
        });

        return {
            promoteCount,
            repeatCount,
            graduateCount,
            invalidCount,
            totalSelected: selectedStudentIds.length,
        };
    }, [selectedStudentIds, studentDecisions]);

    const handleSubmitPromotions = () => {
        if (selectedStudentIds.length === 0) {
            toast.error('Pilih minimal satu siswa untuk diproses');
            return;
        }
        if (promoSummary.invalidCount > 0) {
            toast.error(`Ada ${promoSummary.invalidCount} siswa naik kelas yang belum dipilihkan kelas tujuannya`);
            return;
        }

        const payload = selectedStudentIds.map((id) => ({
            student_id: id,
            action: studentDecisions[id]?.action || 'promote',
            target_classroom_id: studentDecisions[id]?.action === 'promote' ? studentDecisions[id]?.targetClassId : null,
        }));

        setIsSubmittingPromo(true);
        router.post(
            '/master/promotions',
            {
                source_classroom_id: Number(promoSourceClassId),
                promotions: payload,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowPromoConfirmModal(false);
                    setPromoSourceClassId('');
                    setPromoTargetClassId('');
                    toast.success('Kenaikan kelas berhasil diproses');
                },
                onError: (err) => {
                    toast.error(err?.message || 'Terjadi kesalahan saat memproses kenaikan kelas');
                },
                onFinish: () => {
                    setIsSubmittingPromo(false);
                },
            }
        );
    };

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

    // Teacher Import States
    const [showTeacherImportModal, setShowTeacherImportModal] = useState(false);
    const [teacherImportTab, setTeacherImportTab] = useState<'excel' | 'paste'>('excel');
    const [teacherPasteText, setTeacherPasteText] = useState('');
    const [parsedTeacherData, setParsedTeacherData] = useState<ParsedTeacherRow[]>([]);

    const [editingClass, setEditingClass] = useState<ClassroomItem | null>(null);
    const [editingDuty, setEditingDuty] = useState<DutyScheduleItem | null>(null);

    // Classroom Import States
    const [showClassImportModal, setShowClassImportModal] = useState(false);
    const [classImportTab, setClassImportTab] = useState<'excel' | 'paste'>('excel');
    const [classPasteText, setClassPasteText] = useState('');
    const [parsedClassData, setParsedClassData] = useState<ParsedClassroomRow[]>([]);

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
                onError: () => toast.error(`Gagal menghapus data siswa ${s.name}.`),
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
                if (rows.length === 0) {
                    toast.warning('Tidak ditemukan baris data siswa yang valid pada berkas Excel.');
                } else {
                    toast.success(`${rows.length} baris data siswa berhasil dibaca dari berkas.`);
                }
            } catch (err) {
                toast.error('Gagal membaca file Excel. Pastikan format file adalah .xlsx, .xls, atau .csv');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handlePasteProcess = () => {
        if (!pasteText.trim()) {
            toast.error('Silakan tempel teks tabel Excel terlebih dahulu pada kolom yang disediakan.');
            return;
        }

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
        if (rows.length === 0) {
            toast.warning('Tidak ada baris data siswa yang valid ditemukan dari teks yang ditempel.');
        } else {
            toast.success(`${rows.length} baris data siswa berhasil dibaca dari clipboard.`);
        }
    };

    const handleExecuteImport = () => {
        if (parsedData.length === 0) {
            toast.error('Tidak ada data siswa yang valid untuk diimpor.');
            return;
        }

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
                onError: (errs) => {
                    const firstErr = Object.values(errs)[0];
                    toast.error(typeof firstErr === 'string' ? firstErr : 'Gagal mengimpor data siswa.');
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
                onError: () => toast.error(`Gagal menghapus data guru ${t.name}.`),
            });
        }
    };

    // -------------------------------------------------------------
    // TEACHER EXCEL & COPY PASTE IMPORT
    // -------------------------------------------------------------
    const parseTeacherExcelFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (json.length === 0) return;

                const rows: ParsedTeacherRow[] = [];
                const startIndex = typeof json[0][0] === 'string' && isNaN(Number(json[0][0])) ? 1 : 0;

                for (let i = startIndex; i < json.length; i++) {
                    const row = json[i];
                    if (!row || row.length === 0) continue;

                    const cells = row.map((c: any) => (c !== undefined && c !== null ? String(c).trim() : ''));
                    if (cells.every((c: string) => !c)) continue;

                    const isFirstNumber = !isNaN(Number(cells[0])) && cells[0].length <= 3 && cells[1];
                    const offset = isFirstNumber ? 1 : 0;

                    let name = cells[offset] || '';
                    let nip = cells[offset + 1] || '';
                    let email = cells[offset + 2] || '';
                    let username = cells[offset + 3] || '';
                    let role = cells[offset + 4] || 'Guru';
                    let password = cells[offset + 5] || '123456';

                    if (!isNaN(Number(name)) && name.length >= 8 && isNaN(Number(nip))) {
                        const temp = name;
                        name = nip;
                        nip = temp;
                    }

                    if (name) {
                        rows.push({
                            name,
                            nip: nip || undefined,
                            email: email || undefined,
                            username: username || undefined,
                            role: role || 'Guru',
                            password: password || '123456',
                        });
                    }
                }

                setParsedTeacherData(rows);
                if (rows.length === 0) {
                    toast.warning('Tidak ditemukan baris data guru yang valid pada berkas Excel.');
                } else {
                    toast.success(`${rows.length} baris data guru berhasil dibaca dari berkas.`);
                }
            } catch (err) {
                toast.error('Gagal membaca file Excel. Pastikan format file adalah .xlsx, .xls, atau .csv');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleTeacherPasteProcess = () => {
        if (!teacherPasteText.trim()) {
            toast.error('Silakan tempel teks tabel Excel terlebih dahulu pada kolom yang disediakan.');
            return;
        }

        const lines = teacherPasteText.split(/\r?\n/);
        const rows: ParsedTeacherRow[] = [];

        lines.forEach((line) => {
            if (!line.trim()) return;
            const parts = line.includes('\t') ? line.split('\t') : line.split(',');
            const cells = parts.map((p) => p.trim());

            if (cells.some((c) => c.toLowerCase() === 'nama' || c.toLowerCase() === 'nip')) {
                return;
            }

            const isFirstNumber = !isNaN(Number(cells[0])) && cells[0].length <= 3 && cells[1];
            const offset = isFirstNumber ? 1 : 0;

            let name = cells[offset] || '';
            let nip = cells[offset + 1] || '';
            let email = cells[offset + 2] || '';
            let username = cells[offset + 3] || '';
            let role = cells[offset + 4] || 'Guru';
            let password = cells[offset + 5] || '123456';

            if (!isNaN(Number(name)) && name.length >= 8 && isNaN(Number(nip))) {
                const temp = name;
                name = nip;
                nip = temp;
            }

            if (name) {
                rows.push({
                    name,
                    nip: nip || undefined,
                    email: email || undefined,
                    username: username || undefined,
                    role: role || 'Guru',
                    password: password || '123456',
                });
            }
        });

        setParsedTeacherData(rows);
        if (rows.length === 0) {
            toast.warning('Tidak ada baris data guru yang valid ditemukan dari teks yang ditempel.');
        } else {
            toast.success(`${rows.length} baris data guru berhasil dibaca dari clipboard.`);
        }
    };

    const handleExecuteTeacherImport = () => {
        if (parsedTeacherData.length === 0) {
            toast.error('Tidak ada data guru yang valid untuk diimpor.');
            return;
        }

        router.post(
            '/master/teachers/batch-import',
            {
                teachers: parsedTeacherData,
            },
            {
                onSuccess: () => {
                    setShowTeacherImportModal(false);
                    setParsedTeacherData([]);
                    setTeacherPasteText('');
                },
                onError: (errs) => {
                    const firstErr = Object.values(errs)[0];
                    toast.error(typeof firstErr === 'string' ? firstErr : 'Gagal mengimpor data guru.');
                },
            },
        );
    };

    const downloadTeacherTemplate = () => {
        const templateData = [
            ['Nama Guru & Staf', 'NIP', 'Email (Opsional)', 'Username (Opsional)', 'Peran (Guru/Admin/Kepsek)', 'Password (Opsional)'],
            ['Budi Santoso, S.Pd', '198501012010011001', 'budi@sekolah.id', 'budi85', 'Guru', '123456'],
            ['Siti Aminah, M.Pd', '198702022011022002', 'siti@sekolah.id', 'siti87', 'Guru', '123456'],
            ['Drs. Hendro Wibowo', '197505051999031003', 'hendro@sekolah.id', 'hendro75', 'Kepala Sekolah', '123456'],
        ];
        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template Guru');
        XLSX.writeFile(wb, 'Format_Import_Data_Guru.xlsx');
    };

    // Classroom & Duty Handlers
    const openEditClass = (c: ClassroomItem) => {
        setEditingClass(c);
        classForm.setData({
            name: c.name,
            academic_year: c.academic_year,
            homeroom_teacher_id: c.homeroom_teacher ? String(c.homeroom_teacher.id) : '',
        });
    };

    const cancelEditClass = () => {
        setEditingClass(null);
        classForm.reset();
    };

    const handleSaveClass = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingClass) {
            classForm.put(`/master/classrooms/${editingClass.id}`, {
                onSuccess: () => cancelEditClass(),
            });
        } else {
            classForm.post('/master/classrooms', {
                onSuccess: () => classForm.reset('name'),
            });
        }
    };

    const handleDeleteClass = (c: ClassroomItem) => {
        const studentCount = c.students?.length ?? 0;
        if (studentCount > 0) {
            toast.error(`Kelas ${c.name} tidak dapat dihapus karena masih memiliki ${studentCount} siswa terdaftar. Pindahkan atau hapus data siswa terlebih dahulu.`);
            return;
        }

        if (confirm(`Apakah Anda yakin ingin menghapus kelas ${c.name}?`)) {
            router.delete(`/master/classrooms/${c.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    if (editingClass?.id === c.id) {
                        cancelEditClass();
                    }
                },
                onError: () => {
                    toast.error(`Gagal menghapus kelas ${c.name}.`);
                },
            });
        }
    };

    // -------------------------------------------------------------
    // CLASSROOM EXCEL & COPY PASTE IMPORT
    // -------------------------------------------------------------
    const parseClassExcelFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (json.length === 0) return;

                const rows: ParsedClassroomRow[] = [];
                const startIndex = typeof json[0][0] === 'string' && (json[0][0].toLowerCase().includes('kelas') || json[0][0].toLowerCase().includes('nama') || json[0][0].toLowerCase().includes('no')) ? 1 : 0;

                for (let i = startIndex; i < json.length; i++) {
                    const row = json[i];
                    if (!row || row.length === 0) continue;

                    const cells = row.map((c: any) => (c !== undefined && c !== null ? String(c).trim() : ''));
                    if (cells.every((c: string) => !c)) continue;

                    const isFirstNumber = !isNaN(Number(cells[0])) && cells[0].length <= 3 && cells[1];
                    const offset = isFirstNumber ? 1 : 0;

                    const name = cells[offset] || '';
                    const academic_year = cells[offset + 1] || '2026/2027';
                    const homeroom_teacher = cells[offset + 2] || '';

                    if (name) {
                        rows.push({
                            name,
                            academic_year: academic_year || '2026/2027',
                            homeroom_teacher: homeroom_teacher || undefined,
                        });
                    }
                }

                setParsedClassData(rows);
                if (rows.length === 0) {
                    toast.warning('Tidak ditemukan baris data rombel kelas yang valid pada berkas Excel.');
                } else {
                    toast.success(`${rows.length} baris data rombel kelas berhasil dibaca dari berkas.`);
                }
            } catch (err) {
                toast.error('Gagal membaca file Excel. Pastikan format file adalah .xlsx, .xls, atau .csv');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleClassPasteProcess = () => {
        if (!classPasteText.trim()) {
            toast.error('Silakan tempel teks tabel Excel terlebih dahulu pada kolom yang disediakan.');
            return;
        }

        const lines = classPasteText.split(/\r?\n/);
        const rows: ParsedClassroomRow[] = [];

        lines.forEach((line) => {
            if (!line.trim()) return;
            const parts = line.includes('\t') ? line.split('\t') : line.split(',');
            const cells = parts.map((p) => p.trim());

            if (cells.some((c) => c.toLowerCase() === 'kelas' || c.toLowerCase() === 'nama kelas' || c.toLowerCase() === 'rombel')) {
                return;
            }

            const isFirstNumber = !isNaN(Number(cells[0])) && cells[0].length <= 3 && cells[1];
            const offset = isFirstNumber ? 1 : 0;

            const name = cells[offset] || '';
            const academic_year = cells[offset + 1] || '2026/2027';
            const homeroom_teacher = cells[offset + 2] || '';

            if (name) {
                rows.push({
                    name,
                    academic_year: academic_year || '2026/2027',
                    homeroom_teacher: homeroom_teacher || undefined,
                });
            }
        });

        setParsedClassData(rows);
        if (rows.length === 0) {
            toast.warning('Tidak ada baris data rombel kelas yang valid ditemukan dari teks yang ditempel.');
        } else {
            toast.success(`${rows.length} baris data rombel kelas berhasil dibaca dari clipboard.`);
        }
    };

    const handleExecuteClassImport = () => {
        if (parsedClassData.length === 0) {
            toast.error('Tidak ada data rombel kelas yang valid untuk diimpor.');
            return;
        }

        router.post(
            '/master/classrooms/batch-import',
            {
                classrooms: parsedClassData,
            },
            {
                onSuccess: () => {
                    setShowClassImportModal(false);
                    setParsedClassData([]);
                    setClassPasteText('');
                },
                onError: (errs) => {
                    const firstErr = Object.values(errs)[0];
                    toast.error(typeof firstErr === 'string' ? firstErr : 'Gagal mengimpor data rombel kelas.');
                },
            },
        );
    };

    const downloadClassTemplate = () => {
        const templateData = [
            ['Nama Rombel / Kelas', 'Tahun Ajaran', 'Wali Kelas (Nama / NIP - Opsional)'],
            ['Kelas 1-A', '2026/2027', 'Budi Santoso, S.Pd'],
            ['Kelas 1-B', '2026/2027', 'Siti Aminah, M.Pd'],
            ['Kelas 2-A', '2026/2027', ''],
            ['Kelas 2-B', '2026/2027', ''],
        ];
        const ws = XLSX.utils.aoa_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Template Rombel');
        XLSX.writeFile(wb, 'Format_Import_Data_Rombel.xlsx');
    };

    const openEditDuty = (ds: DutyScheduleItem) => {
        setEditingDuty(ds);
        dutyForm.setData({
            teacher_id: String(ds.teacher_id),
            day_of_week: String(ds.day_of_week),
        });
    };

    const cancelEditDuty = () => {
        setEditingDuty(null);
        dutyForm.reset();
    };

    const handleSaveDuty = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingDuty) {
            dutyForm.put(`/master/duty-schedules/${editingDuty.id}`, {
                onSuccess: () => cancelEditDuty(),
            });
        } else {
            dutyForm.post('/master/duty-schedules', {
                onSuccess: () => dutyForm.reset('teacher_id'),
            });
        }
    };

    const handleDeleteDuty = (ds: DutyScheduleItem) => {
        if (confirm(`Apakah Anda yakin ingin menghapus jadwal piket hari ${ds.day_name} untuk ${ds.teacher_name}?`)) {
            router.delete(`/master/duty-schedules/${ds.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    if (editingDuty?.id === ds.id) {
                        cancelEditDuty();
                    }
                },
                onError: () => {
                    toast.error(`Gagal menghapus jadwal piket hari ${ds.day_name}.`);
                },
            });
        }
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
                        onClick={() => setActiveTab('promotions')}
                        className={`flex items-center gap-2 pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
                            activeTab === 'promotions'
                                ? 'border-[#FF6B35] text-[#FF6B35]'
                                : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400'
                        }`}
                    >
                        <TrendingUp className="size-4" />
                        Kenaikan Kelas 🚀
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
                {/* TAB 2: KENAIKAN & KELULUSAN KELAS                         */}
                {/* ========================================================= */}
                {activeTab === 'promotions' && (
                    <div className="flex flex-col gap-6">
                        {/* Banner Instruksi */}
                        <div className="relative overflow-hidden rounded-[22px] border-2 border-orange-200/80 bg-gradient-to-br from-orange-50/70 via-amber-50/40 to-white p-5 shadow-[0_4px_20px_rgba(255,107,53,0.06)] dark:border-[#2D234A] dark:from-[#1F1735] dark:via-[#18122B] dark:to-[#18122B]">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-start gap-3.5">
                                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white shadow-md shadow-orange-500/20">
                                        <TrendingUp className="size-6" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                                                Kenaikan Kelas & Kelulusan Siswa
                                            </h3>
                                            <span className="rounded-full bg-orange-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#FF6B35] dark:bg-orange-950 dark:text-orange-300">
                                                Pergantian Tahun Ajaran
                                            </span>
                                        </div>
                                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 max-w-2xl leading-relaxed">
                                            Pilih kelas asal siswa, tentukan kelas tujuan untuk siswa yang naik kelas, siswa yang tinggal kelas, atau tandai kelulusan siswa tingkat akhir (alumni).
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setActiveTab('classrooms')}
                                        className="text-xs font-bold gap-1.5"
                                    >
                                        <Plus className="size-3.5" />
                                        Kelola / Buat Kelas Baru
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* STEP 1: PILIH KELAS ASAL & KELAS TUJUAN UTAMA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-[20px] border-2 border-[#E8E8E8] bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                            <div>
                                <label className="mb-1.5 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                    <span>1. Pilih Kelas Asal <span className="text-red-500">*</span></span>
                                    {promoSourceClass && (
                                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                            {promoSourceClass.students?.length || 0} Siswa Aktif
                                        </span>
                                    )}
                                </label>
                                <select
                                    value={promoSourceClassId}
                                    onChange={(e) => {
                                        const val = e.target.value ? Number(e.target.value) : '';
                                        setPromoSourceClassId(val);
                                    }}
                                    className="w-full rounded-xl border-2 border-[#E8E8E8] bg-white px-3.5 py-2.5 text-xs font-extrabold text-gray-800 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                >
                                    <option value="">-- Pilih Kelas Asal Siswa --</option>
                                    {classrooms.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.academic_year}) {c.homeroom_teacher ? `• Wali: ${c.homeroom_teacher.name}` : ''} • ({c.students?.length || 0} siswa)
                                        </option>
                                    ))}
                                </select>
                                {promoSourceClass && (
                                    <p className="mt-1.5 text-[11px] text-gray-500">
                                        Wali Kelas: <strong className="text-gray-700 dark:text-gray-300">{promoSourceClass.homeroom_teacher?.name || '-'}</strong> | Tahun Ajaran: <strong className="text-gray-700 dark:text-gray-300">{promoSourceClass.academic_year}</strong>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                    2. Kelas Tujuan Default (Untuk Siswa Naik Kelas)
                                </label>
                                <div className="flex gap-2">
                                    <select
                                        value={promoTargetClassId}
                                        onChange={(e) => {
                                            const val = e.target.value ? Number(e.target.value) : '';
                                            setPromoTargetClassId(val);
                                        }}
                                        disabled={!promoSourceClassId}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] bg-white px-3.5 py-2.5 text-xs font-extrabold text-gray-800 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:opacity-50"
                                    >
                                        <option value="">-- Pilih Kelas Tujuan --</option>
                                        {classrooms
                                            .filter((c) => c.id !== Number(promoSourceClassId))
                                            .map((c) => (
                                                <option key={c.id} value={c.id}>
                                                    {c.name} ({c.academic_year}) {c.homeroom_teacher ? `• Wali: ${c.homeroom_teacher.name}` : ''}
                                                </option>
                                            ))}
                                    </select>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        disabled={!promoSourceClassId || !promoTargetClassId}
                                        onClick={handleApplyTargetToSelected}
                                        className="bg-orange-50 text-[#FF6B35] hover:bg-orange-100 font-bold text-xs shrink-0 whitespace-nowrap border-none"
                                    >
                                        Terapkan ke Terpilih
                                    </Button>
                                </div>
                                <p className="mt-1.5 text-[11px] text-gray-500">
                                    Pilih kelas tingkat berikutnya (misal jika kelas asal 1-A, target: 2-A).
                                </p>
                            </div>
                        </div>

                        {/* STEP 2: DAFTAR SISWA & KONTROL MASSAL */}
                        {promoSourceClassId ? (
                            <div className="overflow-hidden rounded-[20px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                                {/* Bulk Actions Header Bar */}
                                <div className="flex flex-col gap-3 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between dark:border-gray-800">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                                                Daftar Siswa: {promoSourceClass?.name}
                                            </h4>
                                            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                {promoSummary.totalSelected} dari {sourceStudents.length} Siswa Terpilih
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            Tentukan aksi kenaikan kelas untuk masing-masing siswa di bawah ini.
                                        </p>
                                    </div>

                                    {/* Quick Action Badges / Buttons */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={handleSelectAllStudents}
                                            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                                        >
                                            {selectedStudentIds.length === sourceStudents.length ? 'Batal Pilih Semua' : 'Pilih Semua Siswa'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleMarkSelectedAsPromote}
                                            className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300"
                                        >
                                            🟢 Naik Kelas
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleMarkSelectedAsRepeat}
                                            className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300"
                                        >
                                            🟡 Tinggal Kelas
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleMarkSelectedAsGraduated}
                                            className="rounded-lg bg-purple-50 px-2.5 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300"
                                        >
                                            🎓 Lulus (Alumni)
                                        </button>
                                    </div>
                                </div>

                                {/* Summary Pill Bar */}
                                <div className="flex flex-wrap items-center gap-3 bg-gray-50/80 px-5 py-3 border-b border-gray-100 dark:bg-gray-800/40 dark:border-gray-800 text-xs">
                                    <span className="font-bold text-gray-600 dark:text-gray-400">Ringkasan Keputusan:</span>
                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
                                        <span className="size-2 rounded-full bg-emerald-500"></span>
                                        {promoSummary.promoteCount} Naik Kelas
                                    </span>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-400">
                                        <span className="size-2 rounded-full bg-amber-500"></span>
                                        {promoSummary.repeatCount} Tinggal Kelas
                                    </span>
                                    <span>•</span>
                                    <span className="inline-flex items-center gap-1 font-bold text-purple-700 dark:text-purple-400">
                                        <span className="size-2 rounded-full bg-purple-500"></span>
                                        {promoSummary.graduateCount} Lulus / Alumni
                                    </span>
                                    {promoSummary.invalidCount > 0 && (
                                        <>
                                            <span>•</span>
                                            <span className="inline-flex items-center gap-1 font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 px-2 py-0.5 rounded-md">
                                                ⚠️ {promoSummary.invalidCount} Belum Pilih Kelas Tujuan
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Table */}
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="bg-gray-50 text-[#6B7280] uppercase tracking-wider text-[11px] border-b border-gray-100 dark:bg-gray-800/60 dark:border-gray-800 dark:text-gray-400">
                                                <th className="px-4 py-3 text-center w-12">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudentIds.length === sourceStudents.length && sourceStudents.length > 0}
                                                        onChange={handleSelectAllStudents}
                                                        className="size-4 rounded text-[#FF6B35] focus:ring-[#FF6B35]"
                                                    />
                                                </th>
                                                <th className="px-4 py-3">No</th>
                                                <th className="px-4 py-3">NISN / NIS</th>
                                                <th className="px-4 py-3">Nama Siswa</th>
                                                <th className="px-4 py-3 text-center">L/P</th>
                                                <th className="px-4 py-3">Keputusan</th>
                                                <th className="px-4 py-3">Kelas Tujuan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                            {sourceStudents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                                                        Tidak ada siswa aktif terdaftar pada kelas ini.
                                                    </td>
                                                </tr>
                                            ) : (
                                                sourceStudents.map((st, idx) => {
                                                    const isSelected = selectedStudentIds.includes(st.id);
                                                    const decision = studentDecisions[st.id] || { action: 'promote', targetClassId: promoTargetClassId || '' };
                                                    const isPromote = decision.action === 'promote';
                                                    const isRepeat = decision.action === 'repeat';
                                                    const isGraduate = decision.action === 'graduate';
                                                    const needsTarget = isPromote && !decision.targetClassId;

                                                    return (
                                                        <tr
                                                            key={st.id}
                                                            className={`transition-colors ${
                                                                !isSelected
                                                                    ? 'opacity-40 bg-gray-50/50'
                                                                    : needsTarget
                                                                      ? 'bg-red-50/40 dark:bg-red-950/20'
                                                                      : isPromote
                                                                        ? 'hover:bg-emerald-50/30'
                                                                        : isRepeat
                                                                          ? 'hover:bg-amber-50/30'
                                                                          : 'hover:bg-purple-50/30'
                                                            }`}
                                                        >
                                                            <td className="px-4 py-3 text-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => handleToggleStudentSelect(st.id)}
                                                                    className="size-4 rounded text-[#FF6B35] focus:ring-[#FF6B35]"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-3 font-bold text-gray-400">{idx + 1}</td>
                                                            <td className="px-4 py-3 font-mono text-[11px] text-gray-600 dark:text-gray-300">
                                                                {st.nisn} / {st.nis}
                                                            </td>
                                                            <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                                                                {st.name}
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`font-black ${st.gender === 'L' ? 'text-[#0D9488]' : 'text-[#7C3AED]'}`}>
                                                                    {st.gender}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSetStudentAction(st.id, 'promote')}
                                                                        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                                                                            isPromote
                                                                                ? 'bg-emerald-600 text-white shadow-xs'
                                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                                                        }`}
                                                                    >
                                                                        Naik Kelas
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSetStudentAction(st.id, 'repeat')}
                                                                        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                                                                            isRepeat
                                                                                ? 'bg-amber-500 text-white shadow-xs'
                                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                                                        }`}
                                                                    >
                                                                        Tinggal
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSetStudentAction(st.id, 'graduate')}
                                                                        className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                                                                            isGraduate
                                                                                ? 'bg-purple-600 text-white shadow-xs'
                                                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                                                                        }`}
                                                                    >
                                                                        Lulus
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                {isPromote ? (
                                                                    <div className="flex items-center gap-2">
                                                                        <select
                                                                            value={decision.targetClassId || ''}
                                                                            onChange={(e) => handleSetStudentTargetClass(st.id, e.target.value ? Number(e.target.value) : '')}
                                                                            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold focus:outline-none dark:bg-gray-800 dark:text-white ${
                                                                                needsTarget
                                                                                    ? 'border-red-500 bg-red-50/50 text-red-900 focus:border-red-600'
                                                                                    : 'border-gray-300 bg-white focus:border-[#FF6B35]'
                                                                            }`}
                                                                        >
                                                                            <option value="">-- Pilih Kelas Tujuan --</option>
                                                                            {classrooms
                                                                                .filter((c) => c.id !== Number(promoSourceClassId))
                                                                                .map((c) => (
                                                                                    <option key={c.id} value={c.id}>
                                                                                        {c.name} ({c.academic_year})
                                                                                    </option>
                                                                                ))}
                                                                        </select>
                                                                        {needsTarget && (
                                                                            <span className="text-[10px] font-bold text-red-500">
                                                                                Wajib dipilih
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ) : isRepeat ? (
                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                                                        Tetap di {promoSourceClass?.name}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 dark:text-purple-400">
                                                                        Lulus & Menjadi Alumni (Nonaktif)
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer Submit Bar */}
                                {sourceStudents.length > 0 && (
                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 p-5 bg-gray-50/60 dark:border-gray-800 dark:bg-gray-800/40">
                                        <div className="text-xs text-gray-500">
                                            Pastikan data kenaikan kelas sudah sesuai sebelum memproses ke database.
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button
                                                type="button"
                                                variant="primary"
                                                onClick={() => setShowPromoConfirmModal(true)}
                                                disabled={selectedStudentIds.length === 0 || promoSummary.invalidCount > 0 || isSubmittingPromo}
                                                className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand font-bold text-xs gap-1.5 px-5 py-2.5"
                                            >
                                                <TrendingUp className="size-4" />
                                                Proses Kenaikan Kelas ({selectedStudentIds.length} Siswa)
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-[#18122B]">
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950/60 dark:text-orange-300 mb-3">
                                    <GraduationCap className="size-7" />
                                </div>
                                <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                                    Silakan Pilih Kelas Asal
                                </h4>
                                <p className="mt-1 text-xs text-gray-500 max-w-md">
                                    Pilih kelas asal pada formulir di atas untuk memuat daftar siswa yang akan diproses kenaikan atau kelulusannya.
                                </p>
                            </div>
                        )}

                        {/* MODAL KONFIRMASI KENAIKAN KELAS */}
                        {showPromoConfirmModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                                <div className="relative w-full max-w-lg rounded-[22px] bg-white p-6 shadow-2xl dark:bg-[#18122B] border border-gray-200 dark:border-gray-800">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                                        <h3 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                                            <AlertCircle className="size-5 text-[#FF6B35]" />
                                            Konfirmasi Proses Kenaikan Kelas
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={() => setShowPromoConfirmModal(false)}
                                            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            <X className="size-5" />
                                        </button>
                                    </div>

                                    <div className="my-4 flex flex-col gap-3">
                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                            Anda akan memproses mutasi / kenaikan kelas untuk <strong>{promoSummary.totalSelected} siswa</strong> dari kelas <strong>{promoSourceClass?.name}</strong> dengan rincian:
                                        </p>

                                        <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 text-xs divide-y divide-gray-200/70 dark:border-gray-700 dark:bg-gray-800/50 dark:divide-gray-700">
                                            <div className="flex items-center justify-between py-1.5 first:pt-0">
                                                <span className="text-emerald-700 dark:text-emerald-400 font-bold">🟢 Naik Kelas:</span>
                                                <span className="font-extrabold text-gray-900 dark:text-white">{promoSummary.promoteCount} Siswa</span>
                                            </div>
                                            <div className="flex items-center justify-between py-1.5">
                                                <span className="text-amber-700 dark:text-amber-400 font-bold">🟡 Tinggal Kelas:</span>
                                                <span className="font-extrabold text-gray-900 dark:text-white">{promoSummary.repeatCount} Siswa</span>
                                            </div>
                                            <div className="flex items-center justify-between py-1.5 last:pb-0">
                                                <span className="text-purple-700 dark:text-purple-400 font-bold">🎓 Lulus / Alumni:</span>
                                                <span className="font-extrabold text-gray-900 dark:text-white">{promoSummary.graduateCount} Siswa</span>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
                                            ⚠️ <strong>Perhatian:</strong> Siswa yang naik kelas akan otomatis dipindahkan ke rombel kelas tujuan, dan siswa yang lulus akan dinonaktifkan dari daftar absensi aktif.
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3 dark:border-gray-800">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowPromoConfirmModal(false)}
                                            disabled={isSubmittingPromo}
                                            className="text-xs font-bold"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="primary"
                                            size="sm"
                                            disabled={isSubmittingPromo}
                                            onClick={handleSubmitPromotions}
                                            className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand font-bold text-xs"
                                        >
                                            {isSubmittingPromo ? 'Memproses...' : 'Ya, Proses Kenaikan Kelas'}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
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
                            <div className="flex flex-wrap items-center gap-2.5">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowTeacherImportModal(true)}
                                    className="font-bold text-xs bg-[#E8FAF9] text-[#0D9488] hover:bg-[#CCFBF1] border border-[#0D9488]/30 shadow-sm"
                                >
                                    <FileSpreadsheet className="size-4 mr-1.5" />
                                    Import Excel / Copy-Paste
                                </Button>
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
                        <div className="lg:col-span-1 rounded-[18px] border-2 border-[#E8E8E8] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
                                    {editingClass ? (
                                        <>
                                            <Edit3 className="size-5 text-[#FF6B35]" />
                                            Edit Rombel / Kelas
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircle className="size-5 text-[#FF6B35]" />
                                            Tambah Rombel Baru
                                        </>
                                    )}
                                </h3>
                                {editingClass && (
                                    <button
                                        type="button"
                                        onClick={cancelEditClass}
                                        className="text-xs text-gray-500 hover:text-gray-800 font-semibold"
                                    >
                                        Batal
                                    </button>
                                )}
                            </div>
                            <form onSubmit={handleSaveClass} className="flex flex-col gap-3.5">
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
                                        Nama Rombel / Kelas:
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Kelas 5-B"
                                        value={classForm.data.name}
                                        onChange={(e) => classForm.setData('name', e.target.value)}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs focus:border-[#FF6B35] outline-none"
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
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-medium focus:border-[#FF6B35] outline-none"
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
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-semibold focus:border-[#FF6B35] outline-none"
                                    >
                                        <option value="">-- Pilih Guru --</option>
                                        {teachers.map((t) => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={classForm.processing}
                                        className="flex-1 font-bold text-xs bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand hover:translate-y-[-1px] transition-all"
                                    >
                                        {classForm.processing
                                            ? 'Menyimpan...'
                                            : editingClass
                                            ? 'Perbarui Kelas'
                                            : 'Simpan Kelas'}
                                    </Button>
                                    {editingClass && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={cancelEditClass}
                                            className="font-semibold text-xs border border-gray-200"
                                        >
                                            Batal
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="lg:col-span-2 overflow-hidden rounded-[18px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#E8E8E8] px-6 py-4 dark:border-[#2D234A] gap-3">
                                <div>
                                    <h3 className="text-base font-bold text-[#111827] dark:text-white">Daftar Rombel / Kelas Aktif</h3>
                                    <p className="text-xs text-gray-500">Kelola rombel kelas beserta penetapan wali kelas yang bertanggung jawab.</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setShowClassImportModal(true)}
                                    className="font-bold text-xs bg-[#E8FAF9] text-[#0D9488] hover:bg-[#CCFBF1] border border-[#0D9488]/30 shadow-sm shrink-0"
                                >
                                    <FileSpreadsheet className="size-4 mr-1.5" />
                                    Import Excel / Copy-Paste
                                </Button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="bg-table-header border-b-2 border-[#FFD4C2] dark:border-[#3D2520]">
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">No</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Nama Kelas</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Tahun Akademik</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Wali Kelas</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Jumlah Siswa</th>
                                            <th className="px-5 py-3 text-center text-xs font-bold uppercase text-[#FF6B35]">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                                        {classrooms.map((c, idx) => (
                                            <tr key={c.id} className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-5 py-3.5 text-xs font-bold text-gray-500">{idx + 1}</td>
                                                <td className="px-5 py-3.5 font-bold text-gray-900 text-xs">{c.name}</td>
                                                <td className="px-5 py-3.5 text-xs font-semibold text-gray-600">{c.academic_year}</td>
                                                <td className="px-5 py-3.5 text-xs font-medium text-gray-800">
                                                    {c.homeroom_teacher?.name ?? <span className="text-gray-400 italic">Belum ditentukan</span>}
                                                </td>
                                                <td className="px-5 py-3.5 text-xs font-bold text-teal-700">
                                                    {c.students?.length ?? 0} Siswa
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditClass(c)}
                                                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                                                            title="Edit Rombel"
                                                        >
                                                            <Edit3 className="size-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteClass(c)}
                                                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                                                            title="Hapus Rombel"
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
                {/* TAB 4: JADWAL GURU PIKET                                  */}
                {/* ========================================================= */}
                {activeTab === 'duty' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 rounded-[18px] border-2 border-[#E8E8E8] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-base font-bold text-[#111827] dark:text-white flex items-center gap-2">
                                    {editingDuty ? (
                                        <>
                                            <Edit3 className="size-5 text-[#FF6B35]" />
                                            Edit Jadwal Piket
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircle className="size-5 text-[#FF6B35]" />
                                            Tetapkan Guru Piket
                                        </>
                                    )}
                                </h3>
                                {editingDuty && (
                                    <button
                                        type="button"
                                        onClick={cancelEditDuty}
                                        className="text-xs text-gray-500 hover:text-gray-800 font-semibold"
                                    >
                                        Batal
                                    </button>
                                )}
                            </div>
                            <form onSubmit={handleSaveDuty} className="flex flex-col gap-3.5">
                                <div>
                                    <label className="text-xs font-bold text-[#6B7280] uppercase tracking-wider block mb-1">
                                        Pilih Guru:
                                    </label>
                                    <select
                                        value={dutyForm.data.teacher_id}
                                        onChange={(e) => dutyForm.setData('teacher_id', e.target.value)}
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-semibold focus:border-[#FF6B35] outline-none"
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
                                        className="w-full rounded-xl border-2 border-[#E8E8E8] px-3 py-2 text-xs font-semibold focus:border-[#FF6B35] outline-none"
                                    >
                                        <option value="1">Senin</option>
                                        <option value="2">Selasa</option>
                                        <option value="3">Rabu</option>
                                        <option value="4">Kamis</option>
                                        <option value="5">Jumat</option>
                                        <option value="6">Sabtu</option>
                                    </select>
                                </div>

                                <div className="flex items-center gap-2 mt-2">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={dutyForm.processing}
                                        className="flex-1 font-bold text-xs bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand hover:translate-y-[-1px] transition-all"
                                    >
                                        {dutyForm.processing
                                            ? 'Menyimpan...'
                                            : editingDuty
                                            ? 'Perbarui Jadwal Piket'
                                            : 'Simpan Jadwal Piket'}
                                    </Button>
                                    {editingDuty && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={cancelEditDuty}
                                            className="font-semibold text-xs border border-gray-200"
                                        >
                                            Batal
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="lg:col-span-2 overflow-hidden rounded-[18px] border-2 border-[#E8E8E8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                            <div className="border-b border-[#E8E8E8] px-6 py-4 dark:border-[#2D234A]">
                                <h3 className="text-base font-bold text-[#111827] dark:text-white">Jadwal Tugas Guru Piket Mingguan</h3>
                                <p className="text-xs text-gray-500">Guru yang bertugas pada hari aktif berwenang mengelola keterlambatan & izin pulang awal.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="bg-table-header border-b-2 border-[#FFD4C2] dark:border-[#3D2520]">
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Hari</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Nama Guru Piket</th>
                                            <th className="px-5 py-3 text-xs font-bold uppercase text-[#FF6B35]">Status Otoritas</th>
                                            <th className="px-5 py-3 text-center text-xs font-bold uppercase text-[#FF6B35]">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                                        {dutySchedules.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center py-10 text-gray-500 text-xs font-medium">
                                                    Belum ada jadwal piket yang ditetapkan.
                                                </td>
                                            </tr>
                                        ) : (
                                            dutySchedules.map((ds) => (
                                                <tr key={ds.id} className="hover:bg-gray-50/70 dark:hover:bg-white/5 transition-colors">
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
                                                    <td className="px-5 py-3.5 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditDuty(ds)}
                                                                className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 transition-colors"
                                                                title="Edit Jadwal Piket"
                                                            >
                                                                <Edit3 className="size-4" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteDuty(ds)}
                                                                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                                                                title="Hapus Jadwal Piket"
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

                {/* ========================================================= */}
                {/* MODAL 4: IMPORT DATA GURU & STAF (EXCEL / COPY PASTE)      */}
                {/* ========================================================= */}
                {showTeacherImportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                        <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[22px] bg-white p-6 shadow-2xl dark:bg-[#18122B] animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between border-b pb-3 mb-4 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-[#FFF0EB] p-2 text-[#FF6B35]">
                                        <FileSpreadsheet className="size-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                        Import Data Guru & Staf Massal
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowTeacherImportModal(false);
                                        setParsedTeacherData([]);
                                    }}
                                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 pr-1 flex flex-col gap-4">
                                {/* Format guidance & Template download */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl bg-orange-50 border border-orange-200 p-3.5 text-xs text-orange-950 gap-2">
                                    <div className="flex items-start gap-2">
                                        <HelpCircle className="size-4 text-[#FF6B35] mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-bold">Format Kolom Excel:</span> [Nama Lengkap] [NIP (Opsional)] [Email (Opsional)] [Username (Opsional)] [Peran (Opsional)] [Password (Opsional)]
                                            <p className="text-[11px] text-orange-800 mt-0.5">
                                                Jika username/email/password tidak diisi, sistem otomatis membuatkannya berdasarkan NIP atau nama (Password default: 123456).
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={downloadTeacherTemplate}
                                        className="shrink-0 font-bold text-xs text-[#FF6B35] border border-[#FF6B35]/40 hover:bg-orange-100"
                                    >
                                        <Download className="size-3.5 mr-1" />
                                        Unduh Template Excel
                                    </Button>
                                </div>

                                {/* Import Tabs: Upload File vs Copy Paste */}
                                <div className="flex items-center gap-2 border-b">
                                    <button
                                        type="button"
                                        onClick={() => setTeacherImportTab('excel')}
                                        className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                                            teacherImportTab === 'excel'
                                                ? 'border-[#FF6B35] text-[#FF6B35]'
                                                : 'border-transparent text-gray-400'
                                        }`}
                                    >
                                        <Upload className="size-3.5" />
                                        Upload File Excel (.xlsx / .csv)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTeacherImportTab('paste')}
                                        className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                                            teacherImportTab === 'paste'
                                                ? 'border-[#FF6B35] text-[#FF6B35]'
                                                : 'border-transparent text-gray-400'
                                        }`}
                                    >
                                        <ClipboardPaste className="size-3.5" />
                                        Copy-Paste Langsung dari Excel
                                    </button>
                                </div>

                                {/* Option 1: File Upload */}
                                {teacherImportTab === 'excel' && (
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
                                                        parseTeacherExcelFile(e.target.files[0]);
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
                                {teacherImportTab === 'paste' && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-gray-600">
                                            Paste Baris Tabel dari Excel di Sini (Ctrl+V):
                                        </label>
                                        <textarea
                                            rows={5}
                                            value={teacherPasteText}
                                            onChange={(e) => setTeacherPasteText(e.target.value)}
                                            placeholder={`Contoh copy-paste dari Excel:\nBudi Santoso, S.Pd\t198501012010011001\tbudi@sekolah.id\tbudi85\tGuru\t123456\nSiti Aminah, M.Pd\t198702022011022002\tsiti@sekolah.id\tsiti87\tGuru\t123456`}
                                            className="w-full rounded-xl border-2 border-gray-200 p-3 font-mono text-xs focus:border-[#FF6B35] outline-none"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleTeacherPasteProcess}
                                            className="self-end text-xs font-bold bg-[#FF6B35] text-white hover:bg-[#E55A25]"
                                        >
                                            Proses Teks Paste
                                        </Button>
                                    </div>
                                )}

                                {/* Live Preview Table */}
                                {parsedTeacherData.length > 0 && (
                                    <div className="flex flex-col gap-2 mt-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-800">
                                                Pratinjau Hasil Parsing ({parsedTeacherData.length} baris guru siap disimpan):
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setParsedTeacherData([])}
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
                                                        <th className="p-2.5">Nama Guru</th>
                                                        <th className="p-2.5">NIP</th>
                                                        <th className="p-2.5">Email</th>
                                                        <th className="p-2.5">Username</th>
                                                        <th className="p-2.5">Peran</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {parsedTeacherData.map((row, i) => (
                                                        <tr key={i} className="hover:bg-gray-50/50">
                                                            <td className="p-2 text-gray-400 font-bold">{i + 1}</td>
                                                            <td className="p-2 font-semibold text-gray-900">{row.name}</td>
                                                            <td className="p-2 font-mono text-gray-600">{row.nip || '-'}</td>
                                                            <td className="p-2 text-gray-600">{row.email || '(Otomatis)'}</td>
                                                            <td className="p-2 font-mono text-gray-600">{row.username || '(Otomatis)'}</td>
                                                            <td className="p-2 font-medium text-teal-700">{row.role || 'Guru'}</td>
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
                                        setShowTeacherImportModal(false);
                                        setParsedTeacherData([]);
                                    }}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    disabled={parsedTeacherData.length === 0}
                                    onClick={handleExecuteTeacherImport}
                                    className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand font-bold"
                                >
                                    <CheckCircle2 className="size-4 mr-1.5" />
                                    Simpan {parsedTeacherData.length} Data Guru
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* MODAL 5: IMPORT DATA ROMBEL KELAS (EXCEL / COPY PASTE)     */}
                {/* ========================================================= */}
                {showClassImportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                        <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[22px] bg-white p-6 shadow-2xl dark:bg-[#18122B] animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between border-b pb-3 mb-4 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className="rounded-xl bg-[#FFF0EB] p-2 text-[#FF6B35]">
                                        <FileSpreadsheet className="size-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                        Import Data Rombel Kelas Massal
                                    </h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowClassImportModal(false);
                                        setParsedClassData([]);
                                    }}
                                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 pr-1 flex flex-col gap-4">
                                {/* Format guidance & Template download */}
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl bg-orange-50 border border-orange-200 p-3.5 text-xs text-orange-950 gap-2">
                                    <div className="flex items-start gap-2">
                                        <HelpCircle className="size-4 text-[#FF6B35] mt-0.5 shrink-0" />
                                        <div>
                                            <span className="font-bold">Format Kolom Excel:</span> [Nama Rombel / Kelas] [Tahun Ajaran (Opsional)] [Wali Kelas (Nama / NIP - Opsional)]
                                            <p className="text-[11px] text-orange-800 mt-0.5">
                                                Jika tahun ajaran kosong, otomatis diisi "2026/2027". Wali kelas akan dicocokkan dengan data guru yang ada.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={downloadClassTemplate}
                                        className="shrink-0 font-bold text-xs text-[#FF6B35] border border-[#FF6B35]/40 hover:bg-orange-100"
                                    >
                                        <Download className="size-3.5 mr-1" />
                                        Unduh Template Excel
                                    </Button>
                                </div>

                                {/* Import Tabs: Upload File vs Copy Paste */}
                                <div className="flex items-center gap-2 border-b">
                                    <button
                                        type="button"
                                        onClick={() => setClassImportTab('excel')}
                                        className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                                            classImportTab === 'excel'
                                                ? 'border-[#FF6B35] text-[#FF6B35]'
                                                : 'border-transparent text-gray-400'
                                        }`}
                                    >
                                        <Upload className="size-3.5" />
                                        Upload File Excel (.xlsx / .csv)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setClassImportTab('paste')}
                                        className={`pb-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                                            classImportTab === 'paste'
                                                ? 'border-[#FF6B35] text-[#FF6B35]'
                                                : 'border-transparent text-gray-400'
                                        }`}
                                    >
                                        <ClipboardPaste className="size-3.5" />
                                        Copy-Paste Langsung dari Excel
                                    </button>
                                </div>

                                {/* Option 1: File Upload */}
                                {classImportTab === 'excel' && (
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
                                                        parseClassExcelFile(e.target.files[0]);
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
                                {classImportTab === 'paste' && (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-xs font-bold text-gray-600">
                                            Paste Baris Tabel dari Excel di Sini (Ctrl+V):
                                        </label>
                                        <textarea
                                            rows={5}
                                            value={classPasteText}
                                            onChange={(e) => setClassPasteText(e.target.value)}
                                            placeholder={`Contoh copy-paste dari Excel:\nKelas 1-A\t2026/2027\tBudi Santoso, S.Pd\nKelas 1-B\t2026/2027\tSiti Aminah, M.Pd\nKelas 2-A\t2026/2027\t`}
                                            className="w-full rounded-xl border-2 border-gray-200 p-3 font-mono text-xs focus:border-[#FF6B35] outline-none"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={handleClassPasteProcess}
                                            className="self-end text-xs font-bold bg-[#FF6B35] text-white hover:bg-[#E55A25]"
                                        >
                                            Proses Teks Paste
                                        </Button>
                                    </div>
                                )}

                                {/* Live Preview Table */}
                                {parsedClassData.length > 0 && (
                                    <div className="flex flex-col gap-2 mt-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-800">
                                                Pratinjau Hasil Parsing ({parsedClassData.length} baris kelas siap disimpan):
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setParsedClassData([])}
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
                                                        <th className="p-2.5">Nama Kelas / Rombel</th>
                                                        <th className="p-2.5">Tahun Ajaran</th>
                                                        <th className="p-2.5">Wali Kelas</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {parsedClassData.map((row, i) => (
                                                        <tr key={i} className="hover:bg-gray-50/50">
                                                            <td className="p-2 text-gray-400 font-bold">{i + 1}</td>
                                                            <td className="p-2 font-bold text-gray-900">{row.name}</td>
                                                            <td className="p-2 font-semibold text-gray-600">{row.academic_year || '2026/2027'}</td>
                                                            <td className="p-2 text-teal-700 font-medium">{row.homeroom_teacher || '(Belum Ditentukan)'}</td>
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
                                        setShowClassImportModal(false);
                                        setParsedClassData([]);
                                    }}
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    disabled={parsedClassData.length === 0}
                                    onClick={handleExecuteClassImport}
                                    className="bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand font-bold"
                                >
                                    <CheckCircle2 className="size-4 mr-1.5" />
                                    Simpan {parsedClassData.length} Data Rombel
                                </Button>
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
        { title: 'Master Data Siswa & Guru', href: '/master' },
    ],
};
