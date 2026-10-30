import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export type AttendanceStatus = 'hadir' | 'sakit' | 'izin' | 'alpha' | 'terlambat' | 'khusus';

const attendanceBadgeVariants = cva(
    'inline-flex items-center justify-center font-bold tracking-wide rounded-lg px-2.5 py-0.5 text-xs transition-colors',
    {
        variants: {
            status: {
                hadir: 'bg-[#DCFCE7] text-[#059669] border border-[#10B981]/30 dark:bg-[#064E3B] dark:text-[#34D399]',
                sakit: 'bg-[#DBEAFE] text-[#1D4ED8] border border-[#3B82F6]/30 dark:bg-[#1E3A8A] dark:text-[#60A5FA]',
                izin: 'bg-[#FEF3C7] text-[#B45309] border border-[#F59E0B]/30 dark:bg-[#78350F] dark:text-[#FCD34D]',
                alpha: 'bg-[#FEE2E2] text-[#DC2626] border border-[#EF4444]/30 dark:bg-[#7F1D1D] dark:text-[#F87171]',
                terlambat: 'bg-[#EDE9FE] text-[#6D28D9] border border-[#7C3AED]/30 dark:bg-[#4C1D95] dark:text-[#C4B5FD]',
                khusus: 'bg-[#CCFBF1] text-[#0F766E] border border-[#0D9488]/30 dark:bg-[#134E4A] dark:text-[#5EEAD4]',
            },
            size: {
                sm: 'px-2 py-0.5 text-[11px] rounded-md',
                default: 'px-2.5 py-1 text-xs rounded-lg',
                lg: 'px-3 py-1.5 text-sm rounded-xl',
            },
        },
        defaultVariants: {
            status: 'hadir',
            size: 'default',
        },
    },
);

interface AttendanceBadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>,
        VariantProps<typeof attendanceBadgeVariants> {
    status: AttendanceStatus;
    showDot?: boolean;
}

const statusLabels: Record<AttendanceStatus, string> = {
    hadir: 'Hadir',
    sakit: 'Sakit',
    izin: 'Izin',
    alpha: 'Alpha',
    terlambat: 'Terlambat',
    khusus: 'Absen Khusus',
};

const dotColors: Record<AttendanceStatus, string> = {
    hadir: 'bg-[#10B981]',
    sakit: 'bg-[#3B82F6]',
    izin: 'bg-[#F59E0B]',
    alpha: 'bg-[#EF4444]',
    terlambat: 'bg-[#7C3AED]',
    khusus: 'bg-[#0D9488]',
};

export function AttendanceBadge({
    status,
    size,
    showDot = true,
    children,
    className,
    ...props
}: AttendanceBadgeProps) {
    return (
        <span
            className={cn(attendanceBadgeVariants({ status, size }), className)}
            {...props}
        >
            {showDot && (
                <span
                    className={cn(
                        'mr-1.5 size-1.5 rounded-full shrink-0',
                        dotColors[status],
                    )}
                />
            )}
            {children || statusLabels[status]}
        </span>
    );
}

