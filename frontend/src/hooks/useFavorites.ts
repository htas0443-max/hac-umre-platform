import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { favoritesApi } from '../api';
import { toast } from 'sonner';

const FAVORITES_KEY = 'hac_umre_favorites';

/**
 * useFavorites - Hibrit favori yönetimi
 * Giriş yapmış kullanıcı → API (veritabanı)
 * Giriş yapmamış kullanıcı → localStorage
 */
export function useFavorites() {
    const { user } = useAuth();
    const [favorites, setFavorites] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    // Favorileri yükle - kullanıcı durumuna göre
    useEffect(() => {
        loadFavorites();
    }, [user]);

    const loadFavorites = async () => {
        setLoading(true);
        try {
            if (user) {
                // Giriş yapmış: API'den yükle
                const response = await favoritesApi.getAll();
                const tourIds = response.favorites?.map((f: any) => f.tour_id) || [];
                setFavorites(tourIds);
            } else {
                // Giriş yapmamış: localStorage'dan yükle
                const stored = localStorage.getItem(FAVORITES_KEY);
                if (stored) {
                    setFavorites(JSON.parse(stored));
                } else {
                    setFavorites([]);
                }
            }
        } catch (error) {
            console.error('Favoriler yüklenemedi:', error);
            // Hata durumunda localStorage'dan dene
            try {
                const stored = localStorage.getItem(FAVORITES_KEY);
                if (stored) {
                    setFavorites(JSON.parse(stored));
                }
            } catch { }
        } finally {
            setLoading(false);
        }
    };

    // Favori ekle
    const addFavorite = useCallback(async (tourId: number) => {
        try {
            if (user) {
                // API'ye ekle
                await favoritesApi.add(tourId);
            } else {
                // localStorage'a ekle
                const newFavorites = [...favorites, tourId];
                localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
            }
            setFavorites(prev => prev.includes(tourId) ? prev : [...prev, tourId]);
            toast.success('❤️ Favorilere eklendi', { duration: 2000 });
        } catch (error: any) {
            console.error('Favori eklenemedi:', error);
            toast.error('Favorilere eklenemedi');
        }
    }, [user, favorites]);

    // Favori kaldır
    const removeFavorite = useCallback(async (tourId: number) => {
        try {
            if (user) {
                // API'den kaldır
                await favoritesApi.remove(tourId);
            } else {
                // localStorage'dan kaldır
                const newFavorites = favorites.filter(id => id !== tourId);
                localStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
            }
            setFavorites(prev => prev.filter(id => id !== tourId));
            // Kaldırırken toast gösterme (kullanıcı isteği)
        } catch (error: any) {
            console.error('Favori kaldırılamadı:', error);
            toast.error('Favorilerden çıkarılamadı');
        }
    }, [user, favorites]);

    // Favori toggle
    const toggleFavorite = useCallback(async (tourId: number) => {
        if (favorites.includes(tourId)) {
            await removeFavorite(tourId);
        } else {
            await addFavorite(tourId);
        }
    }, [favorites, addFavorite, removeFavorite]);

    // Favori mi kontrol et
    const isFavorite = useCallback((tourId: number): boolean => {
        return favorites.includes(tourId);
    }, [favorites]);

    // localStorage'dan veritabanına senkronize et
    const syncFromLocalStorage = useCallback(async () => {
        if (!user) return;

        try {
            const stored = localStorage.getItem(FAVORITES_KEY);
            if (stored) {
                const localFavorites = JSON.parse(stored);
                if (localFavorites.length > 0) {
                    await favoritesApi.sync(localFavorites);
                    localStorage.removeItem(FAVORITES_KEY);
                    // Yeniden yükle
                    await loadFavorites();
                    toast.success('Favorileriniz hesabınıza aktarıldı');
                }
            }
        } catch (error) {
            console.error('Favoriler senkronize edilemedi:', error);
        }
    }, [user]);

    // Tüm favorileri temizle
    const clearFavorites = useCallback(async () => {
        try {
            if (user) {
                // API'den tümünü sil (her birini tek tek)
                for (const tourId of favorites) {
                    await favoritesApi.remove(tourId);
                }
            }
            localStorage.removeItem(FAVORITES_KEY);
            setFavorites([]);
        } catch (error) {
            console.error('Favoriler temizlenemedi:', error);
        }
    }, [user, favorites]);

    return {
        favorites,
        loading,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        clearFavorites,
        syncFromLocalStorage,
        favoritesCount: favorites.length
    };
}
