import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Download, Info, Monitor, Smartphone, Sparkles, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SchoolSettingProp {
    name?: string;
    logo_url?: string;
}

export function PwaInstallPrompt() {
    const { props } = usePage();
    const school = props.school as SchoolSettingProp | undefined;
    const appName = school?.name || 'AbsensiKu';

    const [isInstalled, setIsInstalled] = useState(true); // default true to avoid flash before checking
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isDismissed, setIsDismissed] = useState(false);
    const [showInstructions, setShowInstructions] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isInsecureOrigin, setIsInsecureOrigin] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Check if origin is secure for PWA
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const isSecure = window.isSecureContext || isLocalhost;
        setIsInsecureOrigin(!isSecure);

        // 1. Detect if running standalone (already installed as PWA)
        const checkStandalone = () => {
            const isStandaloneMode =
                window.matchMedia('(display-mode: standalone)').matches ||
                (window.navigator as any).standalone === true ||
                document.referrer.includes('android-app://');

            const hasInstalledFlag = localStorage.getItem('pwa_installed') === 'true';

            return isStandaloneMode || hasInstalledFlag;
        };

        const alreadyInstalled = checkStandalone();
        setIsInstalled(alreadyInstalled);

        // Check session dismissal
        const dismissed = sessionStorage.getItem('pwa_prompt_dismissed') === 'true';
        setIsDismissed(dismissed);

        // Detect platform
        const userAgent = window.navigator.userAgent.toLowerCase();
        const iosDevice = /iphone|ipad|ipod/.test(userAgent);
        const mobileDevice = /android|iphone|ipad|ipod|mobile/.test(userAgent);
        setIsIOS(iosDevice);
        setIsMobile(mobileDevice);

        // Listen for beforeinstallprompt
        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // If browser fires this, it means app is NOT installed yet
            setIsInstalled(false);
        };

        // Listen for appinstalled
        const handleAppInstalled = () => {
            setIsInstalled(true);
            localStorage.setItem('pwa_installed', 'true');
            setDeferredPrompt(null);
        };

        // Listen for display-mode change
        const matchMediaStandalone = window.matchMedia('(display-mode: standalone)');
        const handleDisplayModeChange = (e: MediaQueryListEvent) => {
            if (e.matches) {
                setIsInstalled(true);
                localStorage.setItem('pwa_installed', 'true');
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        window.addEventListener('appinstalled', handleAppInstalled);
        matchMediaStandalone.addEventListener('change', handleDisplayModeChange);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
            window.removeEventListener('appinstalled', handleAppInstalled);
            matchMediaStandalone.removeEventListener('change', handleDisplayModeChange);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstalled(true);
                localStorage.setItem('pwa_installed', 'true');
            }
            setDeferredPrompt(null);
        } else {
            // Show custom step-by-step instructions for browsers that don't support beforeinstallprompt (e.g. iOS Safari)
            setShowInstructions(true);
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        sessionStorage.setItem('pwa_prompt_dismissed', 'true');
    };

    // If app is already installed or user dismissed it in this session, DO NOT DISPLAY
    if (isInstalled || isDismissed) {
        return null;
    }

    return (
        <aside
            aria-label="Install Aplikasi"
            className="fixed bottom-20 md:bottom-6 inset-x-3.5 md:inset-x-auto md:right-6 z-50 md:max-w-md rounded-2xl border-2 border-orange-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-orange-900/60 dark:bg-[#18122B]/95 animate-in slide-in-from-bottom duration-300"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    {school?.logo_url ? (
                        <img
                            src={school.logo_url}
                            alt={appName}
                            className="size-11 rounded-xl object-contain border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-700"
                        />
                    ) : (
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white font-black text-sm shadow-brand">
                            AK
                        </div>
                    )}
                    <div className="leading-tight">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black uppercase tracking-wider text-[#FF6B35]">
                                Install Aplikasi
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                                <Sparkles className="size-2.5" />
                                {isMobile ? 'Mobile' : 'Desktop'}
                            </span>
                        </div>
                        <h4 className="text-sm font-extrabold text-gray-900 dark:text-white line-clamp-1 mt-0.5">
                            {appName}
                        </h4>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleDismiss}
                    aria-label="Tutup notifikasi"
                    className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
                >
                    <X className="size-4.5" />
                </button>
            </div>

            <p className="mt-2.5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                Pasang aplikasi di {isMobile ? 'ponsel' : 'komputer'} Anda untuk akses lebih cepat, ringan, dan langsung dari layar utama tanpa membuka browser.
            </p>

            {/* Step-by-step guidance if beforeinstallprompt is unavailable (e.g., iOS Safari or non-localhost) */}
            {showInstructions ? (
                <div className="mt-3 rounded-xl bg-orange-50 dark:bg-orange-950/50 p-3 text-xs border border-orange-200 dark:border-orange-800">
                    <p className="font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                        <Info className="size-4 text-[#FF6B35]" />
                        Petunjuk Instalasi:
                    </p>
                    {isInsecureOrigin ? (
                        <div className="space-y-1.5 text-gray-700 dark:text-gray-300">
                            <p className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/60 p-2 rounded-lg font-medium">
                                ⚠️ Anda sedang mengakses via IP jaringan lokal (HTTP). Kebijakan keamanan browser Chrome/Edge hanya mengizinkan instalasi aplikasi PWA melalui <b>HTTPS</b> atau <b>http://localhost</b>.
                            </p>
                            <ol className="list-decimal list-inside space-y-1 mt-1 text-[11px]">
                                <li>Buka aplikasi di perangkat utama menggunakan <b>http://localhost:8000</b> untuk langsung menginstall.</li>
                                <li>Di ponsel, Anda tetap dapat menambahkan pintasan melalui menu browser ⋮ &gt; <b>Tambahkan ke Layar Utama (Add to Home screen)</b>.</li>
                            </ol>
                        </div>
                    ) : (
                        <ol className="list-decimal list-inside space-y-1 text-gray-700 dark:text-gray-300">
                            {isIOS ? (
                                <>
                                    <li>Ketuk tombol <b>Bagikan (Share ⎋)</b> pada bilah bawah browser Safari.</li>
                                    <li>Pilih opsi <b>"Tambahkan ke Layar Utama" (Add to Home Screen)</b>.</li>
                                    <li>Ketuk <b>"Tambah"</b> di pojok kanan atas.</li>
                                </>
                            ) : (
                                <>
                                    <li>Buka menu browser (ikon titik tiga ⋮ di pojok kanan atas).</li>
                                    <li>Pilih menu <b>"Install Aplikasi"</b> atau <b>"Tambahkan ke Layar Utama"</b>.</li>
                                </>
                            )}
                        </ol>
                    )}
                    <button
                        type="button"
                        onClick={() => setShowInstructions(false)}
                        className="mt-2.5 text-[11px] font-bold text-[#FF6B35] hover:underline"
                    >
                        Tutup Petunjuk
                    </button>
                </div>
            ) : (
                <div className="mt-3.5 flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleDismiss}
                        className="text-xs text-gray-500 hover:text-gray-800 h-8"
                    >
                        Nanti Saja
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleInstallClick}
                        className="h-8 gap-1.5 bg-gradient-to-r from-[#FF6B35] to-[#FF8C5A] text-white shadow-brand font-bold text-xs hover:opacity-95"
                    >
                        <Download className="size-3.5" />
                        Install Sekarang
                    </Button>
                </div>
            )}
        </aside>
    );
}

