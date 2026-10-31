import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

interface SchoolSettingProp {
    name?: string;
    address?: string;
    city?: string;
    postal_code?: string;
    phone?: string;
    email?: string;
    principal_name?: string;
    principal_nip?: string;
    start_time?: string;
    logo_url?: string | null;
}

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { school } = usePage<{ school?: SchoolSettingProp }>().props;
    const schoolName = school?.name || 'AbsensiKu SD';
    const schoolAddress = school?.address
        ? `${school.address}${school.city ? ', ' + school.city : ''}`
        : '';
    const logoUrl = school?.logo_url;

    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center p-6 md:p-10 bg-page-gradient overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-[#FF6B35]/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-24 size-96 rounded-full bg-[#4ECDC4]/20 blur-3xl" />

            <div className="relative z-10 w-full max-w-[440px]">
                <div className="rounded-[22px] border-2 border-[#E8E8E8] bg-white/95 p-8 shadow-[0_24px_70px_rgba(255,107,53,0.14)] backdrop-blur-md sm:p-10 dark:border-[#2D234A] dark:bg-[#18122B]/95">
                    <div className="mb-8 flex flex-col items-center text-center">
                        <Link
                            href={home()}
                            className="group mb-4 flex items-center justify-center transition-transform duration-200 hover:scale-105"
                        >
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={schoolName}
                                    className="size-16 object-contain rounded-2xl bg-white p-1.5 shadow-lg shadow-[#FF6B35]/20 border border-[#E8E8E8] dark:border-[#2D234A]"
                                />
                            ) : (
                                <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#FF6B35] to-[#FFE66D] text-white shadow-lg shadow-[#FF6B35]/30">
                                    <AppLogoIcon className="size-8 text-white" />
                                </div>
                            )}
                        </Link>
                        
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF0EB] px-3.5 py-1 text-xs font-bold text-[#FF6B35] mb-3 dark:bg-[#331C1A] dark:text-[#FF8C5A]">
                            <span className="size-1.5 rounded-full bg-[#FF6B35]" />
                            {schoolName}
                        </div>

                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#111827] dark:text-white">
                            {title || `Masuk ke ${schoolName}`}
                        </h1>
                        {description ? (
                            <p className="mt-2 text-xs sm:text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                                {description}
                            </p>
                        ) : schoolAddress ? (
                            <p className="mt-2 text-xs text-[#6B7280] dark:text-[#9CA3AF]">
                                {schoolAddress}
                            </p>
                        ) : null}
                    </div>

                    {children}
                </div>

                <div className="mt-6 text-center text-xs text-[#9CA3AF] dark:text-neutral-500">
                    &copy; {new Date().getFullYear()} {schoolName}. Sistem Presensi Digital Terpadu.
                </div>
            </div>
        </div>
    );
}
