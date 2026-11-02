import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { usePage } from '@inertiajs/react';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth, school } = usePage<{
        auth: { user: { role?: string; is_duty_teacher_today?: boolean } };
        school?: { name?: string; logo_url?: string };
    }>().props;
    const isTeacherDuty = auth?.user?.role === 'teacher' && auth?.user?.is_duty_teacher_today;

    return (
        <header className="sticky top-0 z-20 flex h-14 md:h-[68px] shrink-0 items-center justify-between border-b border-[#E8E8E8] bg-white/80 px-4 md:px-6 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 dark:border-[#2D234A] dark:bg-[#18122B]/80">
            {/* Desktop Left: Sidebar Trigger & Breadcrumbs */}
            <div className="hidden md:flex items-center gap-3">
                <SidebarTrigger className="-ml-1 rounded-lg border-2 border-[#E8E8E8] bg-white hover:bg-[#FFF0EB] hover:text-[#FF6B35] dark:border-[#2D234A] dark:bg-[#18122B]" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            {/* Mobile Left: School Brand (Breadcrumb & Sidebar Trigger hidden on mobile) */}
            <div className="flex md:hidden items-center gap-2">
                {school?.logo_url ? (
                    <img
                        src={school.logo_url}
                        alt={school.name || 'Logo'}
                        className="size-7 rounded-lg object-contain"
                    />
                ) : (
                    <div className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-tr from-[#FF6B35] to-[#FF8C5A] text-white font-black text-xs shadow-xs">
                        AK
                    </div>
                )}
                <span className="text-xs font-extrabold text-gray-900 dark:text-white line-clamp-1 max-w-[170px]">
                    {school?.name || 'AbsensiKu'}
                </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {isTeacherDuty && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 border border-orange-200 px-3 py-1 text-xs font-bold text-[#FF6B35] shadow-xs dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300">
                        <span className="size-2 rounded-full bg-[#FF6B35] animate-pulse" />
                        <span>Piket Hari Ini <span className="hidden md:inline">(Akses Semua Kelas)</span></span>
                    </div>
                )}
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#E8FAF9] px-3 py-1 text-xs font-bold text-[#0D9488] dark:bg-[#113835] dark:text-[#5EEAD4]">
                    <span className="size-2 rounded-full bg-[#10B981] animate-pulse" />
                    Tahun Ajaran 2026/2027
                </div>
            </div>
        </header>
    );
}
