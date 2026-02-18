import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Hata fırlatan bileşen
const ThrowingComponent = () => {
    throw new Error('Test error');
};

// Normal bileşen
const NormalComponent = () => <div>Normal content</div>;

describe('ErrorBoundary', () => {
    // console.error çıktısını bastır (beklenen hatalar için)
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders children when no error occurs', () => {
        const { container } = render(
            <ErrorBoundary>
                <NormalComponent />
            </ErrorBoundary>
        );
        expect(container.textContent).toContain('Normal content');
    });

    it('renders error UI when child throws', () => {
        const { container } = render(
            <ErrorBoundary>
                <ThrowingComponent />
            </ErrorBoundary>
        );
        expect(container.textContent).toContain('Bir Hata Oluştu');
    });

    it('shows retry and home buttons on error', () => {
        const { container } = render(
            <ErrorBoundary>
                <ThrowingComponent />
            </ErrorBoundary>
        );
        expect(container.textContent).toContain('Tekrar Dene');
        expect(container.textContent).toContain('Anasayfaya Dön');
    });

    it('renders custom fallback when provided', () => {
        const { container } = render(
            <ErrorBoundary fallback={<div>Custom fallback</div>}>
                <ThrowingComponent />
            </ErrorBoundary>
        );
        expect(container.textContent).toContain('Custom fallback');
    });
});
