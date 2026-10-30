import { cn } from '@/lib/utils';
import type { AttendanceStatus } from '@/components/attendance-badge';

interface AttendanceRadioOption {
    value: AttendanceStatus;
    label: string;
    code: 'H' | 'S' | 'I' | 'A' | 'T';
}

const defaultOptions: AttendanceRadioOption[] = [
    { value: 'hadir', label: 'Hadir', code: 'H' },
    { value: 'sakit', label: 'Sakit', code: 'S' },
    { value: 'izin', label: 'Izin', code: 'I' },
    { value: 'alpha', label: 'Alpha', code: 'A' },
];

const checkedStyles: Record<AttendanceStatus, string> = {
    hadir: 'bg-[#DCFCE7] border-[#16A34A] text-[#059669] shadow-sm',
    sakit: 'bg-[#DBEAFE] border-[#2563EB] text-[#1D4ED8] shadow-sm',
    izin: 'bg-[#FEF3C7] border-[#D97706] text-[#B45309] shadow-sm',
    alpha: 'bg-[#FEE2E2] border-[#DC2626] text-[#DC2626] shadow-sm',
    terlambat: 'bg-[#EDE9FE] border-[#7C3AED] text-[#6D28D9] shadow-sm',
    khusus: 'bg-[#CCFBF1] border-[#0D9488] text-[#0F766E] shadow-sm',
};

interface AttendanceRadioGroupProps {
    name: string;
    value?: AttendanceStatus;
    onChange: (value: AttendanceStatus) => void;
    compact?: boolean;
    disabled?: boolean;
    className?: string;
}

export function AttendanceRadioGroup({
    name,
    value,
    onChange,
    compact = false,
    disabled = false,
    className,
}: AttendanceRadioGroupProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center gap-1.5 rounded-xl bg-[#FAFAFA] p-1 border border-[#E8E8E8] dark:bg-[#18122B] dark:border-[#2D234A]',
                className,
            )}
        >
            {defaultOptions.map((opt) => {
                const isSelected = value === opt.value;
                return (
                    <label
                        key={opt.value}
                        className={cn(
                            'relative flex cursor-pointer select-none items-center justify-center rounded-[10px] font-bold transition-all duration-150',
                            compact
                                ? 'h-8 px-2.5 text-xs min-w-[34px]'
                                : 'h-9 px-3.5 text-xs min-w-[42px]',
                            isSelected
                                ? checkedStyles[opt.value]
                                : 'border border-transparent text-[#6B7280] hover:bg-black/5 dark:text-[#9CA3AF] dark:hover:bg-white/5',
                            disabled && 'cursor-not-allowed opacity-50',
                        )}
                    >
                        <input
                            type="radio"
                            name={name}
                            value={opt.value}
                            checked={isSelected}
                            disabled={disabled}
                            onChange={() => onChange(opt.value)}
                            className="sr-only"
                        />
                        <span>{compact ? opt.code : opt.label}</span>
                    </label>
                );
            })}
        </div>
    );
}

