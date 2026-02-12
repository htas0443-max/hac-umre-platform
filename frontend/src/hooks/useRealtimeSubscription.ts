/**
 * Supabase Realtime Hook
 * 
 * Belirli bir tablodaki değişiklikleri anlık olarak dinler.
 * Admin panelinde tur onayları, bilet güncellemeleri vb. için kullanılır.
 * 
 * Kullanım:
 * useRealtimeSubscription('tours', 'INSERT', (payload) => {
 *   console.log('Yeni tur:', payload.new);
 * });
 */
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeOptions {
    /** Filtre: PostgreSQL change filter (ör: "status=eq.pending") */
    filter?: string;
    /** Sadece belirli bir schema (varsayılan: "public") */
    schema?: string;
    /** Hook aktif mi? (varsayılan: true) */
    enabled?: boolean;
}

export function useRealtimeSubscription(
    table: string,
    event: RealtimeEvent,
    callback: (payload: any) => void,
    options: UseRealtimeOptions = {}
) {
    const { filter, schema = 'public', enabled = true } = options;
    const channelRef = useRef<RealtimeChannel | null>(null);
    const callbackRef = useRef(callback);

    // Callback'i her render'da güncelle (stale closure önleme)
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (!enabled) return;

        // Kanal konfigürasyonu
        const channelConfig: any = {
            event,
            schema,
            table,
        };

        if (filter) {
            channelConfig.filter = filter;
        }

        const channel = supabase
            .channel(`realtime-${table}-${event}-${filter || 'all'}`)
            .on('postgres_changes', channelConfig, (payload: any) => {
                callbackRef.current(payload);
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [table, event, filter, schema, enabled]);

    return channelRef;
}
