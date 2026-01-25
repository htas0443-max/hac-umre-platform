import { useState, useEffect, RefObject } from 'react';
import { MessageCircle } from 'lucide-react';

interface StickyCTAProps {
    phone?: string;
    tourTitle: string;
    heroRef: RefObject<HTMLDivElement | null>;
}

/**
 * Sticky CTA button that appears when hero CTA scrolls out of view
 * - Hidden when hero is visible
 * - Hidden when keyboard is open
 * - Only renders if phone number is provided
 */
export default function StickyCTA({ phone, tourTitle, heroRef }: StickyCTAProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

    // Intersection Observer: Track hero visibility
    useEffect(() => {
        const heroElement = heroRef.current;
        if (!heroElement) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Show sticky when hero is NOT intersecting (scrolled out)
                setIsVisible(!entry.isIntersecting);
            },
            {
                root: null, // viewport
                rootMargin: '0px',
                threshold: 0, // trigger when any part leaves/enters
            }
        );

        observer.observe(heroElement);

        return () => {
            observer.disconnect();
        };
    }, [heroRef]);

    // Keyboard detection using visualViewport API
    useEffect(() => {
        const viewport = window.visualViewport;
        if (!viewport) return;

        const handleResize = () => {
            // If viewport height is significantly less than window height, keyboard is open
            const heightDiff = window.innerHeight - viewport.height;
            setIsKeyboardOpen(heightDiff > 150); // 150px threshold for keyboard
        };

        viewport.addEventListener('resize', handleResize);

        return () => {
            viewport.removeEventListener('resize', handleResize);
        };
    }, []);

    // Don't render if no phone number
    if (!phone) {
        return null;
    }

    // Don't render if keyboard is open
    if (isKeyboardOpen) {
        return null;
    }

    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Merhaba, ${tourTitle} hakkında bilgi almak istiyorum.`
    )}`;

    return (
        <div className={`sticky-cta ${isVisible ? 'sticky-cta--visible' : 'sticky-cta--hidden'}`}>
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sticky-cta-btn"
                data-testid="sticky-cta-btn"
            >
                <MessageCircle size={20} aria-hidden="true" />
                Firmayla İletişime Geç
            </a>
        </div>
    );
}
