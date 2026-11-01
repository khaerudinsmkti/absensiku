import { Head, useForm, usePage } from '@inertiajs/react';
import {
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    FileSpreadsheet,
    HelpCircle,
    Image as ImageIcon,
    Mail,
    MapPin,
    Phone,
    Save,
    School,
    Trash2,
    Upload,
    UserCheck,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { PageBanner } from '@/components/page-banner';
import { Button } from '@/components/ui/button';

interface SchoolSetting {
    id: number;
    name: string;
    address: string | null;
    city: string | null;
    postal_code: string | null;
    phone: string | null;
    email: string | null;
    principal_name: string | null;
    principal_nip: string | null;
    start_time: string;
    school_days_per_week?: number;
    logo_path: string | null;
    logo_url: string | null;
}

interface PageProps {
    setting: SchoolSetting;
}

export default function SchoolSettingsPage({ setting }: PageProps) {
    const { flash } = usePage<{ flash?: { success?: string; error?: string } }>().props;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(setting.logo_url);

    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        name: setting.name || '',
        address: setting.address || '',
        city: setting.city || '',
        postal_code: setting.postal_code || '',
        phone: setting.phone || '',
        email: setting.email || '',
        principal_name: setting.principal_name || '',
        principal_nip: setting.principal_nip || '',
        start_time: setting.start_time ? setting.start_time.substring(0, 5) : '07:00',
        school_days_per_week: setting.school_days_per_week ?? 6,
        logo: null as File | null,
        remove_logo: false,
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData((prev) => ({
                ...prev,
                logo: file,
                remove_logo: false,
            }));
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveLogo = () => {
        setData((prev) => ({
            ...prev,
            logo: null,
            remove_logo: true,
        }));
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/school-settings', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    // Format today's date in Indonesian for preview
    const todayFormatted = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date());

    return (
        <>
            <Head title="Pengaturan Sekolah" />

            <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
                {/* Banner Header */}
                <PageBanner
                    badgeText="Administrasi & Konfigurasi"
                    title="Pengaturan Profil Sekolah"
                    description="Kelola identitas resmi lembaga, logo sekolah, pejabat penandatangan dokumen, serta batas jam masuk siswa."
                />

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-center gap-3 rounded-2xl border-2 border-emerald-500/20 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <div className="text-sm font-semibold">{flash.success}</div>
                    </div>
                )}

                {recentlySuccessful && !flash?.success && (
                    <div className="flex items-center gap-3 rounded-2xl border-2 border-emerald-500/20 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <div className="text-sm font-semibold">Pengaturan sekolah berhasil diperbarui.</div>
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Column: Form Settings (7 cols) */}
                    <div className="lg:col-span-7">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                            {/* Card 1: Identitas Lembaga */}
                            <div className="rounded-[20px] border-2 border-[#E8E8E8] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                                <div className="mb-5 flex items-center gap-2.5 border-b border-gray-100 pb-4 dark:border-gray-800">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-orange-100 text-[#FF6B35] dark:bg-orange-950/60">
                                        <School className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                                            Identitas & Kontak Lembaga
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Nama dan lokasi sekolah yang digunakan pada kop dan laporan
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Nama Sekolah <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                required
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="Contoh: SD Digital Indonesia"
                                                className="w-full rounded-xl border-2 border-[#E8E8E8] px-3.5 py-2 text-sm font-bold text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/15 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
                                            />
                                        </div>
                                        {errors.name && (
                                            <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Alamat Lengkap Sekolah
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                            placeholder="Contoh: Jl. Merdeka Belajar No. 12, Kel. Maju Jaya"
                                            className="w-full rounded-xl border-2 border-[#E8E8E8] p-3 text-xs font-medium text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/15 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
                                        />
                                        {errors.address && (
                                            <p className="mt-1 text-xs text-red-500">{errors.address}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Kota / Kabupaten
                                        </label>
                                        <input
                                            type="text"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            placeholder="Contoh: Jakarta Selatan"
                                            className="w-full rounded-xl border-2 border-[#E8E8E8] px-3.5 py-2 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/15 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
                                        />
                                        {errors.city && (
                                            <p className="mt-1 text-xs text-red-500">{errors.city}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Kode Pos
                                        </label>
                                        <input
                                            type="text"
                                            value={data.postal_code}
                                            onChange={(e) => setData('postal_code', e.target.value)}
                                            placeholder="Contoh: 12150"
                                            className="w-full rounded-xl border-2 border-[#E8E8E8] px-3.5 py-2 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/15 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Nomor Telepon
                                        </label>
                                        <input
                                            type="text"
                                            value={data.phone}
                                            onChange={(e) => setData('phone', e.target.value)}
                                            placeholder="Contoh: (021) 7890123"
                                            className="w-full rounded-xl border-2 border-[#E8E8E8] px-3.5 py-2 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/15 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Email Resmi
                                        </label>
                                        <input
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="Contoh: info@sddigital.sch.id"
                                            className="w-full rounded-xl border-2 border-[#E8E8E8] px-3.5 py-2 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/15 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
                                        />
                                        {errors.email && (
                                            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Kepala Sekolah & Penandatangan */}
                            <div className="rounded-[20px] border-2 border-[#E8E8E8] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                                <div className="mb-5 flex items-center gap-2.5 border-b border-gray-100 pb-4 dark:border-gray-800">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
                                        <UserCheck className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                                            Kepala Sekolah / Penandatangan
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Identitas pejabat yang dicantumkan pada bagian pengesahan laporan
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Nama Kepala Sekolah
                                        </label>
                                        <input
                                            type="text"
                                            value={data.principal_name}
                                            onChange={(e) => setData('principal_name', e.target.value)}
                                            placeholder="Contoh: Drs. H. Mulyadi, M.Pd."
                                            className="w-full rounded-xl border-2 border-[#E8E8E8] px-3.5 py-2 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/15 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
                                        />
                                        {errors.principal_name && (
                                            <p className="mt-1 text-xs text-red-500">{errors.principal_name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            NIP Kepala Sekolah
                                        </label>
                                        <input
                                            type="text"
                                            value={data.principal_nip}
                                            onChange={(e) => setData('principal_nip', e.target.value)}
                                            placeholder="Contoh: 19720512 199803 1 004"
                                            className="w-full rounded-xl border-2 border-[#E8E8E8] px-3.5 py-2 text-xs font-semibold text-gray-800 placeholder-gray-400 focus:border-[#FF6B35] focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/15 dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
                                        />
                                        {errors.principal_nip && (
                                            <p className="mt-1 text-xs text-red-500">{errors.principal_nip}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Jam Masuk Sekolah & Toleransi */}
                            <div className="rounded-[20px] border-2 border-[#E8E8E8] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                                <div className="mb-5 flex items-center gap-2.5 border-b border-gray-100 pb-4 dark:border-gray-800">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                                        <Clock className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                                            Aturan Jam Masuk & Keterlambatan
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Batas waktu kedatangan resmi (Cutoff Time) absensi harian siswa
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-center">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                            Jam Masuk Sekolah (WIB) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="time"
                                                required
                                                value={data.start_time}
                                                onChange={(e) => setData('start_time', e.target.value)}
                                                className="w-full rounded-xl border-2 border-[#E8E8E8] px-3.5 py-2 text-sm font-extrabold text-gray-800 focus:border-[#FF6B35] focus:outline-none dark:border-gray-700 dark:bg-gray-900/50 dark:text-white"
                                            />
                                        </div>
                                        {errors.start_time && (
                                            <p className="mt-1 text-xs text-red-500">{errors.start_time}</p>
                                        )}
                                    </div>

                                    <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                                        <p className="font-semibold leading-relaxed">
                                            💡 Siswa yang dicatat tiba setelah pukul <span className="font-bold underline">{data.start_time || '07:00'}</span> akan otomatis dikalkulasikan durasi keterlambatannya (dalam menit) pada Modul Keterlambatan Siswa.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                        Sistem Hari Sekolah (Hari Efektif Mingguan) <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <label
                                            className={`flex items-start gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition-all ${
                                                Number(data.school_days_per_week) === 5
                                                    ? 'border-[#FF6B35] bg-orange-50/40 dark:bg-[#251B38]'
                                                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="school_days_per_week"
                                                value={5}
                                                checked={Number(data.school_days_per_week) === 5}
                                                onChange={() => setData('school_days_per_week', 5)}
                                                className="mt-0.5 text-[#FF6B35] focus:ring-[#FF6B35]"
                                            />
                                            <div>
                                                <div className="text-xs font-black text-gray-900 dark:text-white">
                                                    5 Hari Sekolah (Senin - Jumat)
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Hari Sabtu & Minggu libur akhir pekan. Hari efektif belajar: 5 hari.
                                                </div>
                                            </div>
                                        </label>

                                        <label
                                            className={`flex items-start gap-3 rounded-xl border-2 p-3.5 cursor-pointer transition-all ${
                                                Number(data.school_days_per_week) === 6
                                                    ? 'border-[#FF6B35] bg-orange-50/40 dark:bg-[#251B38]'
                                                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                                            }`}
                                        >
                                            <input
                                                type="radio"
                                                name="school_days_per_week"
                                                value={6}
                                                checked={Number(data.school_days_per_week) === 6}
                                                onChange={() => setData('school_days_per_week', 6)}
                                                className="mt-0.5 text-[#FF6B35] focus:ring-[#FF6B35]"
                                            />
                                            <div>
                                                <div className="text-xs font-black text-gray-900 dark:text-white">
                                                    6 Hari Sekolah (Senin - Sabtu)
                                                </div>
                                                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                                    Hari Sabtu aktif masuk sekolah. Hanya hari Minggu yang libur.
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Logo Sekolah */}
                            <div className="rounded-[20px] border-2 border-[#E8E8E8] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                                <div className="mb-5 flex items-center gap-2.5 border-b border-gray-100 pb-4 dark:border-gray-800">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-300">
                                        <ImageIcon className="size-5" />
                                    </div>
                                    <div>
                                        <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                                            Logo Resmi Sekolah
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Logo ditampilkan pada sidebar navigasi, kop surat, dan kartu siswa
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center gap-6">
                                    <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900">
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Logo Sekolah"
                                                className="size-full object-contain"
                                            />
                                        ) : (
                                            <Building2 className="size-10 text-gray-400" />
                                        )}
                                    </div>

                                    <div className="flex flex-1 flex-col gap-2">
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="school-logo-input"
                                        />
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="gap-2 border-2 border-gray-200 text-xs font-bold hover:border-[#FF6B35] hover:text-[#FF6B35]"
                                            >
                                                <Upload className="size-3.5" />
                                                Pilih Berkas Logo
                                            </Button>

                                            {previewUrl && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleRemoveLogo}
                                                    className="gap-2 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                    Hapus Logo
                                                </Button>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-gray-500">
                                            Format yang didukung: PNG, JPG, WebP, SVG. Maksimal ukuran berkas 2 MB. Disarankan rasio persegi (1:1).
                                        </p>
                                        {errors.logo && (
                                            <p className="text-xs text-red-500 font-medium">{errors.logo}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex items-center justify-end gap-3 sticky bottom-4 z-10 rounded-2xl border border-gray-200/80 bg-white/90 p-4 shadow-lg backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={processing}
                                    className="gap-2 px-6 py-2.5 text-xs font-bold bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand hover:translate-y-[-1px] transition-all"
                                >
                                    <Save className="size-4" />
                                    {processing ? 'Menyimpan...' : 'Simpan Perubahan Pengaturan'}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Live Kop Surat & Document Preview (5 cols) */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="sticky top-6 rounded-[20px] border-2 border-[#E8E8E8] bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:border-[#2D234A] dark:bg-[#18122B]">
                            <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                                    Pratinjau Kop Surat Resmi
                                </h3>
                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                    Live Preview
                                </span>
                            </div>

                            {/* Paper Preview */}
                            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm text-gray-900 font-serif dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100">
                                {/* Header / Kop */}
                                <div className="flex items-center gap-4 pb-3">
                                    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
                                        {previewUrl ? (
                                            <img
                                                src={previewUrl}
                                                alt="Logo"
                                                className="size-full object-contain"
                                            />
                                        ) : (
                                            <Building2 className="size-8 text-gray-400" />
                                        )}
                                    </div>
                                    <div className="flex flex-col text-center flex-1">
                                        <h4 className="text-xs uppercase tracking-wider font-sans font-bold text-gray-500">
                                            PEMERINTAH KOTA / KABUPATEN
                                        </h4>
                                        <h2 className="text-sm font-bold uppercase tracking-tight font-serif text-gray-900 dark:text-white">
                                            {data.name || 'NAMA SEKOLAH ANDA'}
                                        </h2>
                                        <p className="text-[10px] font-sans text-gray-600 dark:text-gray-400 leading-tight">
                                            {data.address || 'Alamat Sekolah Belum Diatur'}
                                            {data.city ? `, ${data.city}` : ''}
                                            {data.postal_code ? ` ${data.postal_code}` : ''}
                                        </p>
                                        <p className="text-[9px] font-sans text-gray-500 dark:text-gray-400">
                                            {data.phone ? `Telp: ${data.phone}` : ''} {data.email ? `| Email: ${data.email}` : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Divider line typical in official school headers */}
                                <div className="border-b-[3px] border-double border-gray-900 mb-4 dark:border-gray-300" />

                                {/* Document Title Sample */}
                                <div className="text-center my-3">
                                    <h5 className="text-xs font-bold font-sans uppercase underline tracking-wider">
                                        LAPORAN REKAPITULASI PRESENSI SISWA
                                    </h5>
                                    <p className="text-[10px] font-sans text-gray-500">
                                        Tahun Ajaran 2025/2026
                                    </p>
                                </div>

                                {/* Mock mini table */}
                                <div className="my-3 rounded border border-gray-200 text-[10px] font-sans dark:border-gray-700 overflow-hidden">
                                    <div className="bg-gray-100 dark:bg-gray-800 font-bold px-2 py-1 flex justify-between border-b border-gray-200 dark:border-gray-700">
                                        <span>Aturan Jam Masuk</span>
                                        <span className="text-[#FF6B35] font-extrabold">{data.start_time || '07:00'} WIB</span>
                                    </div>
                                    <div className="px-2 py-1 text-gray-500 text-[9px]">
                                        Daftar absensi dicatat secara real-time melalui sistem AbsensiKu.
                                    </div>
                                </div>

                                {/* Signature block */}
                                <div className="mt-6 flex justify-end font-sans">
                                    <div className="text-center min-w-[150px]">
                                        <p className="text-[10px] text-gray-600 dark:text-gray-400">
                                            {data.city || 'Kota'}, {todayFormatted}
                                        </p>
                                        <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200 mt-1">
                                            Kepala Sekolah,
                                        </p>
                                        <div className="h-12 flex items-center justify-center">
                                            <span className="text-[9px] italic text-gray-300 dark:text-gray-600">
                                                (Tanda Tangan & Cap Resmi)
                                            </span>
                                        </div>
                                        <p className="text-[11px] font-extrabold text-gray-900 dark:text-white underline">
                                            {data.principal_name || 'Nama Kepala Sekolah'}
                                        </p>
                                        <p className="text-[9px] text-gray-600 dark:text-gray-400">
                                            NIP. {data.principal_nip || '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Info card */}
                            <div className="mt-4 rounded-xl bg-orange-50/70 p-3.5 border border-orange-200/60 dark:bg-orange-950/30 dark:border-orange-900/40 text-xs text-orange-900 dark:text-orange-300">
                                <div className="flex items-start gap-2">
                                    <HelpCircle className="size-4 shrink-0 text-[#FF6B35] mt-0.5" />
                                    <div>
                                        <span className="font-bold">Informasi:</span> Perubahan identitas sekolah dan logo akan langsung diterapkan pada seluruh halaman sistem, termasuk bilah menu (sidebar), laporan cetak, dan rekapitulasi presensi.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

SchoolSettingsPage.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Pengaturan Sekolah', href: '/admin/school-settings' },
    ],
};

