import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    return (
        <header className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center justify-between border-b border-[#E8E8E8] bg-white/80 px-6 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 md:px-6 dark:border-[#2D234A] dark:bg-[#18122B]/80">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="-ml-1 rounded-lg border-2 border-[#E8E8E8] bg-white hover:bg-[#FFF0EB] hover:text-[#FF6B35] dark:border-[#2D234A] dark:bg-[#18122B]" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>

            <div className="flex items-center gap-3">
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-[#E8FAF9] px-3 py-1 text-xs font-bold text-[#0D9488] dark:bg-[#113835] dark:text-[#5EEAD4]">
                    <span className="size-2 rounded-full bg-[#10B981] animate-pulse" />
                    Tahun Ajaran 2026/2027
                </div>
            </div>
        </header>
    );
}
