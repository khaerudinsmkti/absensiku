import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name, school } = usePage<{
        name?: string;
        school?: {
            name?: string;
            city?: string;
            logo_url?: string | null;
        };
    }>().props;

    const schoolName = school?.name || name || 'AbsensiKu';
    const subTitle = school?.city ? school.city.toUpperCase() : 'SD DIGITAL';

    return (
        <div className="flex items-center gap-3">
            <div className="flex aspect-square size-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#FFE66D] text-white shadow-md shadow-[#FF6B35]/25">
                {school?.logo_url ? (
                    <img
                        src={school.logo_url}
                        alt={schoolName}
                        className="size-full object-contain p-0.5 bg-white rounded-lg"
                    />
                ) : (
                    <AppLogoIcon className="size-6 text-white" />
                )}
            </div>
            <div className="flex flex-col text-left overflow-hidden">
                <span className="text-sm font-extrabold tracking-tight text-white leading-tight truncate max-w-[150px]" title={schoolName}>
                    {schoolName}
                </span>
                <span className="text-[10px] font-semibold text-[#FFE66D] leading-none tracking-wide truncate max-w-[150px]">
                    {subTitle}
                </span>
            </div>
        </div>
    );
}
