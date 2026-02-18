import { describe, it, expect } from 'vitest';

// api.ts modülünü test etmek yerine yapıyı doğruluyoruz
describe('API Client Configuration', () => {
    it('should export auth API methods', async () => {
        const api = await import('./api');
        expect(api.authApi).toBeDefined();
        expect(api.authApi.login).toBeInstanceOf(Function);
        expect(api.authApi.register).toBeInstanceOf(Function);
        expect(api.authApi.logout).toBeInstanceOf(Function);
        expect(api.authApi.me).toBeInstanceOf(Function);
        expect(api.authApi.sync).toBeInstanceOf(Function);
        expect(api.authApi.refresh).toBeInstanceOf(Function);
    });

    it('should export tours API methods', async () => {
        const api = await import('./api');
        expect(api.toursApi).toBeDefined();
        expect(api.toursApi.getAll).toBeInstanceOf(Function);
        expect(api.toursApi.getById).toBeInstanceOf(Function);
        expect(api.toursApi.create).toBeInstanceOf(Function);
    });

    it('should export operator API methods', async () => {
        const api = await import('./api');
        expect(api.operatorApi).toBeDefined();
        expect(api.operatorApi.getMyTours).toBeInstanceOf(Function);
        expect(api.operatorApi.createTour).toBeInstanceOf(Function);
    });

    it('should export admin API methods', async () => {
        const api = await import('./api');
        expect(api.adminApi).toBeDefined();
        expect(api.adminApi.approveTour).toBeInstanceOf(Function);
        expect(api.adminApi.rejectTour).toBeInstanceOf(Function);
        expect(api.adminApi.getSettings).toBeInstanceOf(Function);
    });

    it('should export token management functions', async () => {
        const api = await import('./api');
        expect(api.setAuthToken).toBeInstanceOf(Function);
        expect(api.getAuthToken).toBeInstanceOf(Function);
    });

    it('should manage auth token in memory', async () => {
        const api = await import('./api');
        api.setAuthToken('test-token-123');
        expect(api.getAuthToken()).toBe('test-token-123');
        api.setAuthToken(null);
        expect(api.getAuthToken()).toBeNull();
    });
});
