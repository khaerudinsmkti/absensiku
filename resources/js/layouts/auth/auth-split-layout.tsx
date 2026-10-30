import { Link, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock, Sparkles, UserCheck } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid min-h-dvh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
            {/* Left Hero Side with Login Hero Background */}
            <div className="bg-login-hero relative hidden h-full flex-col justify-between p-12 text-white lg:flex overflow-hidden">
                <div className="pointer-events-none absolute -top-12 -left-12 size-80 rounded-full bg-white/20 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-20 -right-20 size-96 rounded-full bg-[#1A1033]/20 blur-3xl" />

                <div className="relative z-20 flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-md">
                        <AppLogoIcon className="size-7 text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-extrabold tracking-tight">
                            {name || 'AbsensiKu SD'}
                        </span>
                        <p className="text-xs font-semibold text-white/80">
                            Sistem Presensi Siswa Modern
                        </p>
                    </div>
                </div>

                <div className="relative z-20 my-auto max-w-lg space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/25 px-4 py-1.5 text-xs font-bold tracking-wide uppercase text-white backdrop-blur-md">
                        <Sparkles className="size-4" />
                        Warm & Modern School System
                    </div>
                    <h2 className="text-4xl font-extrabold leading-tight text-white drop-shadow-sm">
                        Kelola Kehadiran Siswa dengan Nyaman & Cepat
                    </h2>
                    <p className="text-base text-white/90 leading-relaxed">
                        Mulai dari rekap otomatis, pantau keterlambatan, hingga rekapitulasi bulanan siap cetak dalam satu antarmuka sekolah yang ceria.
                    </p>

                    {/* Mini Floating Cards preview */}
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <div className="rounded-[18px] border border-white/30 bg-white/20 p-4 backdrop-blur-md shadow-lg">
                            <div className="flex items-center gap-2 text-white font-bold text-sm">
                                <UserCheck className="size-4 text-[#FFFBE6]" />
                                Hadir 98.4%
                            </div>
                            <p className="text-xs text-white/80 mt-1">
                                Rata-rata presensi hari ini
                            </p>
                        </div>
                        <div className="rounded-[18px] border border-white/30 bg-white/20 p-4 backdrop-blur-md shadow-lg">
                            <div className="flex items-center gap-2 text-white font-bold text-sm">
                                <Clock className="size-4 text-[#FFE66D]" />
                                Terlambat &lt; 2%
                            </div>
                            <p className="text-xs text-white/80 mt-1">
                                Disiplin meningkat minggu ini
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative z-20 flex items-center justify-between text-xs text-white/80">
                    <span>Sistem Informasi Absensi Sekolah Digital</span>
                    <span>v2.0 • Standar Kurikulum Terpadu</span>
                </div>
            </div>

            {/* Right Form Side */}
            <div className="flex w-full items-center justify-center p-6 lg:p-12 bg-page-gradient min-h-dvh">
                <div className="mx-auto flex w-full max-w-[420px] flex-col justify-center space-y-6">
                    <div className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
                        <Link
                            href={home()}
                            className="relative z-20 flex items-center gap-2.5 lg:hidden"
                        >
                            <div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF6B35] to-[#FFE66D] text-white shadow-md">
                                <AppLogoIcon className="size-7 text-white" />
                            </div>
                            <span className="text-xl font-bold">{name || 'AbsensiKu'}</span>
                        </Link>
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white">
                            {title}
                        </h1>
                        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                            {description}
                        </p>
                    </div>

                    <div className="rounded-[22px] border-2 border-[#E8E8E8] bg-white/90 p-8 shadow-[0_12px_40px_rgba(255,107,53,0.08)] backdrop-blur-sm dark:border-[#2D234A] dark:bg-[#18122B]/90">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
