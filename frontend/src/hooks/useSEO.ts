import { useEffect } from 'react';

interface SEOOptions {
    title: string;
    description?: string;
    noIndex?: boolean;
    canonical?: string;
}

const DEFAULT_TITLE = 'Hac & Umre Turları';
const DEFAULT_DESCRIPTION = 'Türkiye\'nin güvenilir Hac ve Umre tur platformu. Onaylı firmalar, karşılaştırmalı fiyatlar.';

export function useSEO({ title, description, noIndex = false, canonical }: SEOOptions) {
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

        // Canonical URL
        let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (canonical) {
            if (!linkCanonical) {
                linkCanonical = document.createElement('link');
                linkCanonical.setAttribute('rel', 'canonical');
                document.head.appendChild(linkCanonical);
            }
            linkCanonical.setAttribute('href', canonical);
        } else if (linkCanonical) {
            linkCanonical.remove();
        }

        // Cleanup: reset to defaults when unmounting
        return () => {
            document.title = DEFAULT_TITLE;
            if (metaDescription) {
                metaDescription.setAttribute('content', DEFAULT_DESCRIPTION);
            }
            if (metaRobots) {
                metaRobots.setAttribute('content', 'index, follow');
            }
            if (linkCanonical) {
                linkCanonical.remove();
            }
        };
    }, [title, description, noIndex, canonical]);
}
