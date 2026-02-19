import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';

// Mock window.matchMedia for ThemeToggle / useTheme
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
// AuthContext mock — kullanıcı giriş yapmamış hali
vi.mock('../AuthContext', () => ({
    useAuth: () => ({
        user: null,
        token: null,
        loading: false,
        login: vi.fn(),
        register: vi.fn(),
        logout: vi.fn(),
        resetPassword: vi.fn(),
        updatePassword: vi.fn(),
        signInWithGoogle: vi.fn(),
        sendEmailOTP: vi.fn(),
        verifyEmailOTP: vi.fn(),
    }),
}));

describe('Navbar', () => {
    const renderNavbar = () =>
        render(
            <BrowserRouter>
                <Navbar />
            </BrowserRouter>
        );

    it('renders without crashing', () => {
        const { container } = renderNavbar();
        expect(container).toBeTruthy();
    });

    it('contains navigation links', () => {
        const { container } = renderNavbar();
        const links = container.querySelectorAll('a');
        expect(links.length).toBeGreaterThan(0);
    });

    it('shows login link when user is not authenticated', () => {
        const { container } = renderNavbar();
        const allText = container.textContent || '';
        // Navbar'da "Giriş" veya login link'i olmalı
        expect(
            allText.includes('Giriş') || container.querySelector('a[href="/login"]')
        ).toBeTruthy();
    });
});
