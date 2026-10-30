import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="text-white/50 text-[11px] font-bold tracking-wider uppercase">
                Menu Utama
            </SidebarGroupLabel>
            <SidebarMenu className="gap-1.5 mt-1">
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={isCurrentUrl(item.href)}
                            tooltip={{ children: item.title }}
                            className="text-white/80 hover:text-white hover:bg-white/10 active:bg-white/15 data-[active=true]:bg-gradient-to-r data-[active=true]:from-[#FF6B35] data-[active=true]:to-[#FF8C5A] data-[active=true]:text-white data-[active=true]:font-bold data-[active=true]:shadow-md data-[active=true]:shadow-[#FF6B35]/30 rounded-xl h-10 px-3 transition-all"
                        >
                            <Link href={item.href} prefetch>
                                {item.icon && <item.icon className="size-5" />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
