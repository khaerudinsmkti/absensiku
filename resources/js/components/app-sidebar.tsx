import { Link, usePage } from '@inertiajs/react';
import {
    CalendarDays,
    Clock,
    FileSpreadsheet,
    GraduationCap,
    LayoutGrid,
    School,
    UserCheck,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
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
import type { NavItem } from '@/types';

export function AppSidebar() {
    const { url, props } = usePage();
    const user = props.auth?.user as { role?: string } | undefined;
    const canManageSchool = user?.role === 'admin' || user?.role === 'principal';

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
            icon: LayoutGrid,
            isActive: url === '/dashboard',
        },
        {
            title: 'Presensi Harian',
            href: '/attendances',
            icon: UserCheck,
            isActive: url.startsWith('/attendances') && !url.includes('/lateness') && !url.includes('/adjustments'),
        },
        {
            title: 'Keterlambatan',
            href: '/attendances/lateness',
            icon: Clock,
            isActive: url.startsWith('/attendances/lateness'),
        },
        {
            title: 'Absen Khusus',
            href: '/attendances/adjustments',
            icon: CalendarDays,
            isActive: url.startsWith('/attendances/adjustments'),
        },
        {
            title: 'Rekap & Laporan',
            href: '/reports',
            icon: FileSpreadsheet,
            isActive: url.startsWith('/reports'),
        },
        ...(canManageSchool
            ? [
                  {
                      title: 'Data Siswa & Kelas',
                      href: '/master',
                      icon: GraduationCap,
                      isActive: url.startsWith('/master'),
                  },
                  {
                      title: 'Pengaturan Sekolah',
                      href: '/admin/school-settings',
                      icon: School,
                      isActive: url.startsWith('/admin/school-settings'),
                  },
                  {
                      title: 'Kalender Pendidikan',
                      href: '/admin/holidays',
                      icon: CalendarDays,
                      isActive: url.startsWith('/admin/holidays'),
                  },
              ]
            : []),
    ];

    return (
        <Sidebar collapsible="icon" variant="inset" className="bg-sidebar-gradient border-r-0">
            <SidebarHeader className="p-4 border-b border-white/10">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="hover:bg-white/10 active:bg-white/15">
                            <Link href="/dashboard" prefetch>
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
