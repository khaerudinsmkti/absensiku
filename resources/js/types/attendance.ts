export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alpha' | 'terlambat' | 'khusus';

export interface ClassroomData {
    id: number;
    name: string;
    academic_year: string;
    homeroom_teacher_id: number | null;
    homeroom_teacher?: {
        id: number;
        name: string;
        nip?: string;
    } | null;
}

export interface StudentAttendanceRow {
    id: number;
    name: string;
    nisn: string;
    nis: string;
    gender: 'L' | 'P';
    attendance_id?: number | null;
    status: AttendanceStatus | 'present' | 'sick' | 'permit' | 'absent';
    raw_status?: 'present' | 'sick' | 'permit' | 'absent';
    check_in_time?: string;
    is_late?: boolean;
    late_minutes?: number;
    notes?: string;
    adjustment?: {
        type: string;
        type_name: string;
        departure_time: string;
        reason: string;
        pickup_person?: string | null;
    } | null;
}

