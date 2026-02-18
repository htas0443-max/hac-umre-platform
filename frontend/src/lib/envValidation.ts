/**
 * Ortam Değişkeni Doğrulama
 * Uygulama başlarken kritik env var'ların varlığını kontrol eder.
 */

interface EnvVar {
    key: string;
    label: string;
    required: boolean;
}

const ENV_VARS: EnvVar[] = [
    // Zorunlu — bunlar olmadan uygulama çalışamaz
    { key: 'VITE_SUPABASE_URL', label: 'Supabase URL', required: true },
    { key: 'VITE_SUPABASE_ANON_KEY', label: 'Supabase Anon Key', required: true },
    // Opsiyonel — eksikse uyarı verilir ama uygulama çalışır
    { key: 'VITE_BACKEND_URL', label: 'Backend API URL', required: false },
    { key: 'VITE_SENTRY_DSN', label: 'Sentry DSN (hata izleme)', required: false },
    { key: 'VITE_API_SIGNING_KEY', label: 'API İmzalama Anahtarı', required: false },
];

export function validateEnv(): void {
    const missing: string[] = [];
    const warnings: string[] = [];

    for (const v of ENV_VARS) {
        const value = import.meta.env[v.key];
        if (!value) {
            if (v.required) {
                missing.push(`  ❌ ${v.key} (${v.label})`);
            } else {
                warnings.push(`  ⚠️ ${v.key} (${v.label})`);
            }
        }
    }

    if (warnings.length > 0) {
        console.warn(
            `[ENV] Opsiyonel ortam değişkenleri eksik:\n${warnings.join('\n')}\n` +
            `Bu özellikler devre dışı kalabilir.`
        );
    }

    if (missing.length > 0) {
        const msg =
            `[ENV] Zorunlu ortam değişkenleri eksik:\n${missing.join('\n')}\n\n` +
            `Lütfen frontend/.env dosyasını kontrol edin.`;
        console.error(msg);
        throw new Error(msg);
    }
}
