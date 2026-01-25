import { useEffect } from 'react';

interface SEOOptions {
    title: string;
    description?: string;
    noIndex?: boolean;
}

const DEFAULT_TITLE = 'Hac & Umre Turları';
const DEFAULT_DESCRIPTION = 'Türkiye\'nin güvenilir Hac ve Umre tur platformu. Onaylı firmalar, karşılaştırmalı fiyatlar.';

export function useSEO({ title, description, noIndex = false }: SEOOptions) {
    useEffect(() => {
        // Title
        const fullTitle = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;
        document.title = fullTitle;

        // Meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', description || DEFAULT_DESCRIPTION);

        // Robots meta tag
        let metaRobots = document.querySelector('meta[name="robots"]');
        if (!metaRobots) {
            metaRobots = document.createElement('meta');
            metaRobots.setAttribute('name', 'robots');
            document.head.appendChild(metaRobots);
        }
        metaRobots.setAttribute('content', noIndex ? 'noindex, nofollow' : 'index, follow');

        // Cleanup: reset to defaults when unmounting
        return () => {
            document.title = DEFAULT_TITLE;
            if (metaDescription) {
                metaDescription.setAttribute('content', DEFAULT_DESCRIPTION);
            }
            if (metaRobots) {
                metaRobots.setAttribute('content', 'index, follow');
            }
        };
    }, [title, description, noIndex]);
}
