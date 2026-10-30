import { ArrowRight, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageBannerProps {
    title: string;
    description?: string;
    badgeText?: string;
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
}

export function PageBanner({
    title,
    description,
    badgeText,
    icon,
    action,
    className,
}: PageBannerProps) {
    return (
        <div
            className={cn(
                'bg-banner-gradient relative overflow-hidden rounded-[18px] p-6 text-white shadow-[0_4px_16px_rgba(255,107,53,0.25)] sm:p-7',
                className,
            )}
        >
            {/* Ambient Background Decorative Elements */}
            <div className="pointer-events-none absolute -top-10 -right-10 size-48 rounded-full bg-white/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 right-1/4 size-32 rounded-full bg-[#FFE66D]/30 blur-xl" />

            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                    {badgeText && (
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-md">
                            <Sparkles className="size-3.5 text-[#FFE66D]" />
                            {badgeText}
                        </div>
                    )}
                    <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-3xl">
                        {title}
                    </h1>
                    {description && (
                        <p className="max-w-2xl text-sm font-medium text-white/90 leading-relaxed sm:text-base">
                            {description}
                        </p>
                    )}
                </div>

                {(action || icon) && (
                    <div className="flex shrink-0 items-center gap-3">
                        {action}
                    </div>
                )}
            </div>
        </div>
    );
}

