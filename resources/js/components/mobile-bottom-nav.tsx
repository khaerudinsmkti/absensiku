import { Link, router, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Clock,
    Download,
    FileSpreadsheet,
    GraduationCap,
    LayoutGrid,
    LogOut,
    Menu,
    School,
    User,
    UserCheck,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface SchoolSettingProp {
    name?: string;
    logo_url?: string;
    city?: string;
}

export function MobileBottomNav() {
    const { url, props } = usePage();
    const user = props.auth?.user as { name?: string; role?: string } | undefined;
    const school = props.school as SchoolSettingProp | undefined;
    const isAdmin = user?.role === 'admin';
    const isPrincipal = user?.role === 'principal';
    const canManageSchool = isAdmin || isPrincipal;

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    // Dynamic favicon synchronization
    useEffect(() => {
        if (school?.logo_url) {
            const links = document.querySelectorAll<HTMLLinkElement>("link[rel*='icon']");
            links.forEach((link) => {
                link.href = school.logo_url!;
            });
        }
    }, [school?.logo_url]);

    // PWA Install prompt listener
    useEffect(() => {
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        const handleAppInstalled = () => {
            setIsInstallable(false);
            setDeferredPrompt(null);
            setIsStandalone(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);

        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
            setIsStandalone(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallPWA = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstallable(false);
            }
            setDeferredPrompt(null);
        } else {
            alert('Untuk menginstall aplikasi di ponsel Anda:\n1. Buka menu browser (ikon titik tiga atau tombol Share di Safari/Chrome).\n2. Pilih "Tambahkan ke Layar Utama" (Add to Home screen) atau "Install Aplikasi".');
        }
    };

    // Active checks
    const isDashboardActive = url === '/dashboard';
    const isPresensiActive = url.startsWith('/attendances') && !url.includes('/lateness') && !url.includes('/adjustments');
    const isLatenessActive = url.startsWith('/attendances/lateness');
    const isAdjustmentsActive = url.startsWith('/attendances/adjustments');
    const isOtherActive =
        url.startsWith('/reports') ||
        url.startsWith('/master') ||
        url.startsWith('/admin') ||
        url.startsWith('/settings');

    const handleLogout = () => {
        router.post('/logout');
    };

    return (
        <>
            {/* Mobile Bottom Navigation Bar */}
            <nav className="fixed bottom-0 inset-x-0 z-40 block md:hidden bg-white/95 dark:bg-[#18122B]/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-white/10 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 transition-all">
                <div className="grid grid-cols-5 items-center justify-around px-2 max-w-md mx-auto">
                    {/* 1. Dashboard */}
                    <Link
                        href="/dashboard"
                        prefetch
                        className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                            isDashboardActive
                                ? 'text-[#FF6B35]'
                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                        }`}
                    >
                        <div
                            className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                isDashboardActive
                                    ? 'bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white shadow-md shadow-[#FF6B35]/30'
                                    : 'hover:bg-gray-100 dark:hover:bg-white/5'
                            }`}
                        >
                            <LayoutGrid className="size-5" />
                        </div>
                        <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isDashboardActive ? 'text-[#FF6B35]' : ''}`}>
                            Beranda
                        </span>
                    </Link>

                    {/* 2. Presensi Harian */}
                    <Link
                        href="/attendances"
                        prefetch
                        className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                            isPresensiActive
                                ? 'text-[#FF6B35]'
                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                        }`}
                    >
                        <div
                            className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                isPresensiActive
                                    ? 'bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white shadow-md shadow-[#FF6B35]/30'
                                    : 'hover:bg-gray-100 dark:hover:bg-white/5'
                            }`}
                        >
                            <UserCheck className="size-5" />
                        </div>
                        <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isPresensiActive ? 'text-[#FF6B35]' : ''}`}>
                            Presensi
                        </span>
                    </Link>

                    {/* 3. Terlambat */}
                    <Link
                        href="/attendances/lateness"
                        prefetch
                        className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                            isLatenessActive
                                ? 'text-[#FF6B35]'
                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                        }`}
                    >
                        <div
                            className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                isLatenessActive
                                    ? 'bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white shadow-md shadow-[#FF6B35]/30'
                                    : 'hover:bg-gray-100 dark:hover:bg-white/5'
                            }`}
                        >
                            <Clock className="size-5" />
                        </div>
                        <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isLatenessActive ? 'text-[#FF6B35]' : ''}`}>
                            Terlambat
                        </span>
                    </Link>

                    {/* 4. Absen Khusus */}
                    <Link
                        href="/attendances/adjustments"
                        prefetch
                        className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 ${
                            isAdjustmentsActive
                                ? 'text-[#FF6B35]'
                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                        }`}
                    >
                        <div
                            className={`flex size-10 items-center justify-center rounded-2xl transition-all ${
                                isAdjustmentsActive
                                    ? 'bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white shadow-md shadow-[#FF6B35]/30'
                                    : 'hover:bg-gray-100 dark:hover:bg-white/5'
                            }`}
                        >
                            <CalendarDays className="size-5" />
                        </div>
                        <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isAdjustmentsActive ? 'text-[#FF6B35]' : ''}`}>
                            Absen Khusus
                        </span>
                    </Link>

                    {/* 5. Menu Lainnya (Drawer) */}
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen(true)}
                        className={`flex flex-col items-center justify-center py-1 transition-all active:scale-90 relative ${
                            isOtherActive || isMenuOpen
                                ? 'text-[#FF6B35]'
                                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                        }`}
                    >
                        <div
                            className={`flex size-10 items-center justify-center rounded-2xl transition-all relative ${
                                isOtherActive || isMenuOpen
                                    ? 'bg-orange-50 text-[#FF6B35] border border-orange-200 dark:bg-orange-950/40 dark:border-orange-800'
                                    : 'hover:bg-gray-100 dark:hover:bg-white/5'
                            }`}
                        >
                            <Menu className="size-5" />
                            {isOtherActive && (
                                <span className="absolute top-1 right-1 size-2 rounded-full bg-[#FF6B35] ring-2 ring-white dark:ring-[#18122B]" />
                            )}
                        </div>
                        <span className={`text-[10px] mt-1 font-extrabold tracking-tight ${isOtherActive || isMenuOpen ? 'text-[#FF6B35]' : ''}`}>
                            Lainnya
                        </span>
                    </button>
                </div>
            </nav>

            {/* Slide-Up Bottom Sheet Drawer (Lainnya) */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 block md:hidden">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Sheet Content */}
                    <div className="fixed bottom-0 inset-x-0 z-50 max-h-[85vh] rounded-t-[28px] bg-white p-5 shadow-2xl dark:bg-[#18122B] border-t border-gray-200 dark:border-white/10 overflow-y-auto animate-in slide-in-from-bottom duration-200">
                        {/* Drag indicator & Header */}
                        <div className="flex flex-col items-center mb-4">
                            <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 mb-3" />
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-3">
                                    {school?.logo_url ? (
                                        <img
                                            src={school.logo_url}
                                            alt={school.name || 'Logo Sekolah'}
                                            className="size-10 rounded-xl object-contain border border-gray-200 bg-white p-0.5 shadow-sm dark:border-gray-700"
                                        />
                                    ) : (
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white font-black text-sm shadow-brand">
                                            AK
                                        </div>
                                    )}
                                    <div className="leading-tight">
                                        <h4 className="text-sm font-extrabold text-gray-900 dark:text-white line-clamp-1">
                                            {school?.name || 'AbsensiKu'}
                                        </h4>
                                        <p className="text-[11px] text-gray-500 font-medium line-clamp-1">
                                            {user?.name} ({user?.role === 'admin' ? 'Administrator' : 'Tenaga Pendidik'})
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                        </div>

                        {/* PWA Install Banner (If not yet installed or available) */}
                        {!isStandalone && (
                            <div className="mb-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-3.5 text-white shadow-lg shadow-orange-500/25 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                        <Download className="size-5 text-white" />
                                    </div>
                                    <div>
                                        <h5 className="text-xs font-black">Install Aplikasi {school?.name || 'AbsensiKu'}</h5>
                                        <p className="text-[10px] text-white/90">Akses cepat seperti aplikasi di ponsel Anda</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleInstallPWA}
                                    className="rounded-xl bg-white px-3 py-1.5 text-xs font-black text-orange-600 shadow-sm hover:bg-orange-50 active:scale-95 transition-all"
                                >
                                    Install
                                </button>
                            </div>
                        )}

                        {/* Navigation Grid in Drawer */}
                        <div className="space-y-3">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                Menu Absensi & Jadwal
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <Link
                                    href="/reports"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                                        url.startsWith('/reports')
                                            ? 'bg-orange-50 border-orange-300 text-[#FF6B35] font-bold dark:bg-orange-950/40 dark:border-orange-800'
                                            : 'border-gray-200/80 hover:bg-gray-50 text-gray-700 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800/50'
                                    }`}
                                >
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                        <FileSpreadsheet className="size-4.5" />
                                    </div>
                                    <div className="text-xs font-bold leading-tight">
                                        Rekap & Laporan
                                        <div className="text-[10px] font-medium text-gray-400">Unduh & Cetak</div>
                                    </div>
                                </Link>

                                <Link
                                    href="/admin/holidays"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                                        url.startsWith('/admin/holidays')
                                            ? 'bg-orange-50 border-orange-300 text-[#FF6B35] font-bold dark:bg-orange-950/40 dark:border-orange-800'
                                            : 'border-gray-200/80 hover:bg-gray-50 text-gray-700 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800/50'
                                    }`}
                                >
                                    <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                        <CalendarDays className="size-4.5" />
                                    </div>
                                    <div className="text-xs font-bold leading-tight">
                                        Kalender
                                        <div className="text-[10px] font-medium text-gray-400">Hari Efektif</div>
                                    </div>
                                </Link>
                            </div>

                            {/* Administrator & Principal Menu */}
                            {canManageSchool && (
                                <>
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 pt-2">
                                        Administrasi Sistem
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <Link
                                            href="/master"
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                                                url.startsWith('/master')
                                                    ? 'bg-orange-50 border-orange-300 text-[#FF6B35] font-bold dark:bg-orange-950/40 dark:border-orange-800'
                                                    : 'border-gray-200/80 hover:bg-gray-50 text-gray-700 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800/50'
                                            }`}
                                        >
                                            <div className="flex size-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                                                <GraduationCap className="size-4.5" />
                                            </div>
                                            <div className="text-xs font-bold leading-tight">
                                                Data Master
                                                <div className="text-[10px] font-medium text-gray-400">Siswa & Rombel</div>
                                            </div>
                                        </Link>

                                        <Link
                                            href="/admin/school-settings"
                                            onClick={() => setIsMenuOpen(false)}
                                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                                                url.startsWith('/admin/school-settings')
                                                    ? 'bg-orange-50 border-orange-300 text-[#FF6B35] font-bold dark:bg-orange-950/40 dark:border-orange-800'
                                                    : 'border-gray-200/80 hover:bg-gray-50 text-gray-700 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800/50'
                                            }`}
                                        >
                                            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                                                <School className="size-4.5" />
                                            </div>
                                            <div className="text-xs font-bold leading-tight">
                                                Identitas
                                                <div className="text-[10px] font-medium text-gray-400">Profil Sekolah</div>
                                            </div>
                                        </Link>
                                    </div>
                                </>
                            )}

                            {/* Account actions */}
                            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                <Link
                                    href="/settings/profile"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900"
                                >
                                    <div className="flex size-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                                        <User className="size-4 text-gray-600 dark:text-gray-300" />
                                    </div>
                                    Profil Akun
                                </Link>

                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/40 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50"
                                >
                                    <LogOut className="size-3.5" />
                                    Keluar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

