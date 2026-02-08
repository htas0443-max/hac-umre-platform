/**
 * Sentry Error Monitoring - Frontend
 * 
 * Production ortamında tüm runtime errorları yakalar.
 * User ID, browser bilgisi ve hata detayları otomatik raporlanır.
 */
import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN || '';

export function initSentry() {
    if (!SENTRY_DSN) {
        console.warn('[Sentry] DSN bulunamadı — monitoring devre dışı');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.MODE || 'development',
        sendDefaultPii: true,

        // Performance: %20 transaction sampling
        tracesSampleRate: 0.2,

        // Replay: %10 session replay (hata anında %100)
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,

        // Hassas verileri filtrele
        beforeSend(event) {
            // Password, token gibi verileri temizle
            if (event.request?.data) {
                const data = event.request.data as Record<string, unknown>;
                if (typeof data === 'object' && data !== null) {
                    for (const key of Object.keys(data)) {
                        if (/password|token|secret|key|authorization/i.test(key)) {
                            data[key] = '[REDACTED]';
                        }
                    }
                }
            }
            return event;
        },

        // Navigation breadcrumbs
        integrations: [
            Sentry.browserTracingIntegration(),
        ],
    });
}

/**
 * Kullanıcı bilgisini Sentry'ye bağlar.
 * Login sonrası çağrılmalı.
 */
export function setSentryUser(user: { id: string; email?: string; role?: string }) {
    Sentry.setUser({
        id: user.id,
        email: user.email,
        // Role bilgisi hata debug'ı için önemli
        segment: user.role,
    });
}

/**
 * Logout sonrası kullanıcıyı temizler.
 */
export function clearSentryUser() {
    Sentry.setUser(null);
}

/**
 * Manuel hata raporlama.
 * Catch bloklarında kullanılır.
 */
export function captureError(error: unknown, context?: Record<string, unknown>) {
    if (context) {
        Sentry.setContext('additional', context);
    }
    Sentry.captureException(error);
}

/**
 * Kullanıcı eylemi breadcrumb'ı ekler.
 */
export function addBreadcrumb(message: string, category: string = 'user-action') {
    Sentry.addBreadcrumb({
        message,
        category,
        level: 'info',
    });
}

export { Sentry };
