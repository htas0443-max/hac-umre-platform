import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('validateEnv', () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it('should pass when all required env vars are present', async () => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
        vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');

        const { validateEnv } = await import('./envValidation');
        expect(() => validateEnv()).not.toThrow();

        vi.unstubAllEnvs();
    });

    it('should throw when VITE_SUPABASE_URL is missing', async () => {
        vi.stubEnv('VITE_SUPABASE_URL', '');
        vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');

        const { validateEnv } = await import('./envValidation');
        expect(() => validateEnv()).toThrow('Zorunlu ortam değişkenleri eksik');

        vi.unstubAllEnvs();
    });

    it('should throw when VITE_SUPABASE_ANON_KEY is missing', async () => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
        vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

        const { validateEnv } = await import('./envValidation');
        expect(() => validateEnv()).toThrow('Zorunlu ortam değişkenleri eksik');

        vi.unstubAllEnvs();
    });

    it('should warn but not throw for missing optional vars', async () => {
        vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
        vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');
        vi.stubEnv('VITE_BACKEND_URL', '');

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        const { validateEnv } = await import('./envValidation');
        validateEnv();

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
        vi.unstubAllEnvs();
    });
});
