import { useState, useEffect } from 'react';
import api from '../api';

interface FeatureFlagsCache {
    flags: Record<string, boolean>;
    loaded: boolean;
}

const cache: FeatureFlagsCache = { flags: {}, loaded: false };

/**
 * Feature flag durumunu kontrol eden hook.
 * İlk çağrıda backend'den yükler, sonraki çağrılarda cache kullanır.
 * 
 * @example
 * const chatEnabled = useFeature('chat_enabled');
 * if (!chatEnabled) return null;
 */
export function useFeature(key: string): boolean {
    const [enabled, setEnabled] = useState<boolean>(() => cache.flags[key] ?? true);
    const [, setLoaded] = useState(cache.loaded);

    useEffect(() => {
        if (cache.loaded) {
            setEnabled(cache.flags[key] ?? true);
            return;
        }

        let cancelled = false;

        const fetchFlags = async () => {
            try {
                const response = await api.get('/api/feature-flags/public');
                const flags = response.data?.flags || {};
                cache.flags = flags;
                cache.loaded = true;
                if (!cancelled) {
                    setEnabled(flags[key] ?? true);
                    setLoaded(true);
                }
            } catch {
                // Hata durumunda feature varsayılan olarak aktif
                cache.loaded = true;
                if (!cancelled) {
                    setEnabled(true);
                    setLoaded(true);
                }
            }
        };

        fetchFlags();
        return () => { cancelled = true; };
    }, [key]);

    return enabled;
}

/**
 * Feature flag cache'ini temizler (flag toggle sonrası refresh için)
 */
export function invalidateFeatureFlags() {
    cache.flags = {};
    cache.loaded = false;
}

export default useFeature;
