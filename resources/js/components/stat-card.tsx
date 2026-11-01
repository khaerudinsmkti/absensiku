import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatCardVariant = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger' | 'purple';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    variant?: StatCardVariant;
    trend?: {
        label: string;
        isPositive?: boolean;
    };
    action?: ReactNode;
    className?: string;
}

const variantStyles: Record<
    StatCardVariant,
    {
        iconBg: string;
        iconColor: string;
        cardAccent?: string;
    }
> = {
    primary: {
        iconBg: 'bg-gradient-to-tr from-[#FFF0EB] to-[#FFE66D]/40 dark:from-[#3D1A10] dark:to-[#4D3010]',
        iconColor: 'text-[#FF6B35]',
    },
    secondary: {
        iconBg: 'bg-gradient-to-tr from-[#E8FAF9] to-[#4ECDC4]/30 dark:from-[#113835] dark:to-[#174D49]',
        iconColor: 'text-[#0D9488]',
    },
    success: {
        iconBg: 'bg-gradient-to-tr from-[#DCFCE7] to-[#10B981]/30 dark:from-[#063828] dark:to-[#0D523B]',
        iconColor: 'text-[#059669]',
    },
    info: {
        iconBg: 'bg-gradient-to-tr from-[#DBEAFE] to-[#3B82F6]/30 dark:from-[#102A54] dark:to-[#1A4280]',
        iconColor: 'text-[#1D4ED8]',
    },
    warning: {
        iconBg: 'bg-gradient-to-tr from-[#FEF3C7] to-[#F59E0B]/30 dark:from-[#472E08] dark:to-[#63410E]',
        iconColor: 'text-[#B45309]',
    },
    danger: {
        iconBg: 'bg-gradient-to-tr from-[#FEE2E2] to-[#EF4444]/30 dark:from-[#4A1414] dark:to-[#6E1C1C]',
        iconColor: 'text-[#DC2626]',
    },
    purple: {
        iconBg: 'bg-gradient-to-tr from-[#EDE9FE] to-[#A78BFA]/30 dark:from-[#29174D] dark:to-[#3C2270]',
        iconColor: 'text-[#7C3AED]',
    },
};

export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    variant = 'primary',
    trend,
    action,
    className,
}: StatCardProps) {
    const theme = variantStyles[variant];

    return (
        <div
            className={cn(
                'group relative flex flex-col justify-between overflow-hidden rounded-[18px] border-2 border-[#E8E8E8] bg-white p-4 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_-6px_rgba(255,107,53,0.12)] dark:border-[#2D234A] dark:bg-[#18122B]',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-[#6B7280] uppercase tracking-wider dark:text-[#9CA3AF] leading-snug">
                        {title}
                    </span>
                    <div className="mt-1 flex items-baseline gap-2">
                        <span className="text-[26px] sm:text-[30px] font-extrabold tracking-tight text-[#111827] leading-none dark:text-white">
                            {value}
                        </span>
                    </div>
                </div>

                <div
                    className={cn(
                        'flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-[14px] transition-transform duration-200 group-hover:scale-105',
                        theme.iconBg,
                        theme.iconColor,
                    )}
                >
                    <Icon className="size-5 sm:size-6 stroke-[2.2]" />
                </div>
            </div>

            {(subtitle || trend || action) && (
                <div className="mt-4 flex items-center justify-between border-t border-[#F5F5F5] pt-3 text-xs dark:border-[#231A3A] min-w-0">
                    {subtitle && (
                        <span className="text-[#6B7280] font-medium dark:text-[#9CA3AF] truncate">
                            {subtitle}
                        </span>
                    )}
                    {trend && (
                        <span
                            className={cn(
                                'inline-flex items-center gap-1 font-bold rounded-md px-2 py-0.5 text-[11px] shrink-0',
                                trend.isPositive
                                    ? 'bg-[#DCFCE7] text-[#059669] dark:bg-[#064E3B] dark:text-[#34D399]'
                                    : 'bg-[#FEE2E2] text-[#DC2626] dark:bg-[#7F1D1D] dark:text-[#F87171]',
                            )}
                        >
                            {trend.label}
                        </span>
                    )}
                    {action && <div>{action}</div>}
                </div>
            )}
        </div>
    );
}

