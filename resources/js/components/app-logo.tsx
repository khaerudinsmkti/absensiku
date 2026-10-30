import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <div className="flex items-center gap-3">
            <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-gradient-to-tr from-[#FF6B35] to-[#FFE66D] text-white shadow-md shadow-[#FF6B35]/25">
                <AppLogoIcon className="size-6 text-white" />
            </div>
            <div className="flex flex-col text-left">
                <span className="text-base font-extrabold tracking-tight text-white leading-tight">
                    {name || 'AbsensiKu'}
                </span>
                <span className="text-[11px] font-semibold text-[#FFE66D] leading-none tracking-wide">
                    SD DIGITAL
                </span>
            </div>
        </div>
    );
}
