import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function useFlashToast(): void {
    const lastToastRef = useRef<{ message: string; timestamp: number }>({
        message: '',
        timestamp: 0,
    });

    const triggerToast = (type: 'success' | 'error', message: string) => {
        if (!message || typeof message !== 'string') return;
        const now = Date.now();
        // Prevent duplicate toast for the exact same message within 1.5 seconds
        if (lastToastRef.current.message === message && now - lastToastRef.current.timestamp < 1500) {
            return;
        }
        lastToastRef.current = { message, timestamp: now };

        if (type === 'success') {
            toast.success(message);
        } else {
            toast.error(message);
        }
    };

    const checkFlash = (props: any) => {
        const flash = props?.flash;
        if (flash?.success) {
            triggerToast('success', flash.success);
        } else if (flash?.error) {
            triggerToast('error', flash.error);
        } else if (flash?.message) {
            triggerToast('success', flash.message);
        }
    };

    useEffect(() => {
        // Listen to navigation events (including initial page load and visits)
        const removeNavigate = router.on('navigate', (event) => {
            const pageProps = (event as any).detail?.page?.props;
            checkFlash(pageProps);
        });

        // Listen to successful form submissions and redirects
        const removeSuccess = router.on('success', (event) => {
            const pageProps = (event as any).detail?.page?.props;
            checkFlash(pageProps);
        });

        // Listen to validation errors
        const removeError = router.on('error', (event) => {
            const errors = (event as any).detail?.errors;
            if (errors && typeof errors === 'object') {
                const errorValues = Object.values(errors);
                if (errorValues.length > 0) {
                    const firstMsg = errorValues[0];
                    triggerToast(
                        'error',
                        typeof firstMsg === 'string' ? firstMsg : 'Terjadi kesalahan pada data yang dimasukkan.',
                    );
                }
            }
        });

        return () => {
            removeNavigate();
            removeSuccess();
            removeError();
        };
    }, []);
}
