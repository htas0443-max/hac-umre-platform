import { useState, useEffect, useCallback } from 'react';

const RECENTLY_VIEWED_KEY = 'hac_umre_recently_viewed';
const MAX_ITEMS = 10;

interface RecentlyViewedTour {
    id: number | string;
    title: string;
    operator: string;
    price: number;
    currency: string;
    viewedAt: string;
}

/**
 * useRecentlyViewed - Son bakılan turları yönetir
 * localStorage tabanlı, client-side only
 */
export function useRecentlyViewed() {
    const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedTour[]>([]);

    // localStorage'dan yükle
    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
            if (stored) {
                setRecentlyViewed(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Son bakılanlar yüklenemedi:', error);
        }
    }, []);

    // Tur ekleme
    const addToRecentlyViewed = useCallback((tour: {
        id: number | string;
        title: string;
        operator: string;
        price: number;
        currency: string;
    }) => {
        setRecentlyViewed(prev => {
            // Aynı tur varsa kaldır
            const filtered = prev.filter(t => t.id !== tour.id);

            // Başa ekle
            const updated = [
                {
                    ...tour,
                    viewedAt: new Date().toISOString()
                },
                ...filtered
            ].slice(0, MAX_ITEMS); // Max 10 tut

            // localStorage'a kaydet
            localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));

            return updated;
        });
    }, []);

    // Temizle
    const clearRecentlyViewed = useCallback(() => {
        localStorage.removeItem(RECENTLY_VIEWED_KEY);
        setRecentlyViewed([]);
    }, []);

    return {
        recentlyViewed,
        addToRecentlyViewed,
        clearRecentlyViewed,
        count: recentlyViewed.length
    };
}
