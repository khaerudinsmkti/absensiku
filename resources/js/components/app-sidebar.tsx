import { Link } from '@inertiajs/react';
import {
    CalendarDays,
    Clock,
    FileSpreadsheet,
    GraduationCap,
    LayoutGrid,
    UserCheck,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Presensi Harian',
        href: '#absensi',
        icon: UserCheck,
    },
    {
        title: 'Keterlambatan',
        href: '#keterlambatan',
        icon: Clock,
    },
    {
        title: 'Absen Khusus',
        href: '#khusus',
        icon: CalendarDays,
    },
    {
        title: 'Rekap & Laporan',
        href: '#laporan',
        icon: FileSpreadsheet,
    },
    {
        title: 'Data Siswa & Kelas',
        href: '#master',
        icon: GraduationCap,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset" className="bg-sidebar-gradient border-r-0">
            <SidebarHeader className="p-4 border-b border-white/10">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-white/10 active:bg-white/15">
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="border-t border-white/10 p-3">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
