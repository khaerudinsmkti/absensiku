import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BarChart3,
    CalendarCheck,
    Clock,
    Sparkles,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { dashboard, login } from '@/routes';

interface SchoolProp {
    name?: string;
    logo_url?: string | null;
}

export default function Welcome() {
    const { auth, school } = usePage<{ auth: any; school?: SchoolProp }>().props;
    const schoolName = school?.name || 'AbsensiKu SD';
    const logoUrl = school?.logo_url;

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
                    <section className="relative overflow-hidden px-6 pt-16 pb-20 lg:px-12 lg:pt-24 lg:pb-32">
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
                                AbsensiKu menghadirkan pengalaman pencatatan kehadiran yang ramah untuk guru kelas, piket, dan staf sekolah. Dilengkapi rekap otomatis, pantau terlambat, dan cetak laporan instan.
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

                        {/* Feature Cards Grid */}
                        <div className="relative z-10 mx-auto mt-20 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-[#111827] dark:text-white">
                                {schoolName}
                            </span>
                            <span>— Sistem Presensi Siswa Digital</span>
                        </div>
                        <div>
                            &copy; {new Date().getFullYear()} {schoolName}. All rights reserved.
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}
