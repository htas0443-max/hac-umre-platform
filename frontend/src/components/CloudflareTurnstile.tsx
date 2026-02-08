import { useEffect, useRef, useCallback } from 'react';

// Cloudflare Turnstile Site Key (.env'den)
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

interface CloudflareTurnstileProps {
    onTokenReceived: (token: string) => void;
    onError?: () => void;
    onExpired?: () => void;
    theme?: 'light' | 'dark' | 'auto';
    size?: 'normal' | 'compact';
}

/**
 * Cloudflare Turnstile Anti-Bot Widget
 * 
 * Login, Register, Password Reset formlarında kullanılır.
 * Invisible mode — kullanıcı hiçbir şey görmez (bot değilse).
 */
export default function CloudflareTurnstile({
    onTokenReceived,
    onError,
    onExpired,
    theme = 'auto',
    size = 'normal',
}: CloudflareTurnstileProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const scriptLoadedRef = useRef(false);

    const renderWidget = useCallback(() => {
        if (!containerRef.current || !window.turnstile || widgetIdRef.current) return;

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            callback: (token: string) => onTokenReceived(token),
            'error-callback': () => onError?.(),
            'expired-callback': () => onExpired?.(),
            theme,
            size,
        });
    }, [onTokenReceived, onError, onExpired, theme, size]);

    useEffect(() => {
        if (!TURNSTILE_SITE_KEY) {
            console.warn('[Turnstile] Site key bulunamadı — widget devre dışı');
            return;
        }

        // Script zaten yüklüyse hemen render et
        if (window.turnstile) {
            renderWidget();
            return;
        }

        // Script henüz yüklenmediyse yükle
        if (!scriptLoadedRef.current) {
            scriptLoadedRef.current = true;
            const script = document.createElement('script');
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            script.onload = () => renderWidget();
            document.head.appendChild(script);
        }

        return () => {
            // Cleanup widget
            if (widgetIdRef.current && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [renderWidget]);

    if (!TURNSTILE_SITE_KEY) return null;

    return (
        <div
            ref={containerRef}
            className="cf-turnstile-container"
            style={{ margin: '12px 0' }}
        />
    );
}

// TypeScript global type for Turnstile
declare global {
    interface Window {
        turnstile: {
            render: (container: HTMLElement, options: Record<string, unknown>) => string;
            remove: (widgetId: string) => void;
            reset: (widgetId: string) => void;
        };
    }
}
