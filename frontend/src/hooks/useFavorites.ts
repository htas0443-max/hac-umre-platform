import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'hac_umre_favorites';

/**
 * useFavorites - localStorage ile favori turları yönetir
 */
export function useFavorites() {
    const [favorites, setFavorites] = useState<string[]>([]);

    // localStorage'dan favorileri yükle
    useEffect(() => {
        try {
            const stored = localStorage.getItem(FAVORITES_KEY);
            if (stored) {
                setFavorites(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Favoriler yüklenemedi:', error);
        }
    }, []);

    // Favori ekle
    const addFavorite = useCallback((tourId: string) => {
        setFavorites(prev => {
            if (prev.includes(tourId)) return prev;
            const newFavorites = [...prev, tourId];
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
            return newFavorites;
        });
    }, []);

    // Favori kaldır
    const removeFavorite = useCallback((tourId: string) => {
        setFavorites(prev => {
            const newFavorites = prev.filter(id => id !== tourId);
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
            return newFavorites;
        });
    }, []);

    // Favori toggle
    const toggleFavorite = useCallback((tourId: string) => {
        setFavorites(prev => {
            const newFavorites = prev.includes(tourId)
                ? prev.filter(id => id !== tourId)
                : [...prev, tourId];
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
            return newFavorites;
        });
    }, []);

    // Favori mi kontrol et
    const isFavorite = useCallback((tourId: string) => {
        return favorites.includes(tourId);
    }, [favorites]);

    // Tüm favorileri temizle
    const clearFavorites = useCallback(() => {
        localStorage.removeItem(FAVORITES_KEY);
        setFavorites([]);
    }, []);

    return {
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        clearFavorites,
        favoritesCount: favorites.length
    };
}
