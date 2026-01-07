import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Tour } from '../types';

/**
 * Custom hook for tours with Supabase direct queries
 */
export function useTours(filters?: {
  min_price?: number;
  max_price?: number;
  operator?: string;
  status?: string;
  sort_by?: string;
  sort_order?: string;
}) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchTours();
  }, [filters]);

  const fetchTours = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('tours')
        .select('*', { count: 'exact' });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      } else {
        query = query.eq('status', 'approved'); // Default: only approved
      }

      if (filters?.min_price) {
        query = query.gte('price', filters.min_price);
      }

      if (filters?.max_price) {
        query = query.lte('price', filters.max_price);
      }

      if (filters?.operator) {
        query = query.ilike('operator', `%${filters.operator}%`);
      }

      // Sorting
      const sortBy = filters?.sort_by || 'created_at';
      const ascending = filters?.sort_order === 'asc';
      query = query.order(sortBy, { ascending });

      const { data, error, count } = await query;

      if (error) throw error;

      setTours(data || []);
      setTotal(count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => fetchTours();

  return { tours, loading, error, total, refetch };
}

/**
 * Get single tour by ID
 */
export async function getTour(id: number): Promise<Tour> {
  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Create tour (operator only)
 */
export async function createTour(tour: Omit<Tour, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();
  
  if (!userData.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('tours')
    .insert([{
      ...tour,
      operator_id: userData.user.id,
      status: 'pending'
    }])
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Update tour (operator only - own tours)
 */
export async function updateTour(id: number, updates: Partial<Tour>): Promise<void> {
  const { error } = await supabase
    .from('tours')
    .update({
      ...updates,
      status: 'pending' // Re-approval required
    })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Delete tour (operator only - own tours)
 */
export async function deleteTour(id: number): Promise<void> {
  const { error } = await supabase
    .from('tours')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Get operator stats using RPC
 */
export async function getOperatorStats(operatorId: string) {
  const { data, error } = await supabase
    .rpc('get_operator_stats', { operator_user_id: operatorId });

  if (error) throw error;
  return data;
}

/**
 * Approve tour (admin only) using RPC
 */
export async function approveTour(tourId: number, adminId: string) {
  const { data, error } = await supabase
    .rpc('approve_tour', {
      tour_id_param: tourId,
      admin_id: adminId,
      approval_reason_param: 'Approved by admin'
    });

  if (error) throw error;
  return data;
}

/**
 * Reject tour (admin only) using RPC
 */
export async function rejectTour(tourId: number, adminId: string, reason: string) {
  const { data, error } = await supabase
    .rpc('reject_tour', {
      tour_id_param: tourId,
      admin_id: adminId,
      rejection_reason_param: reason
    });

  if (error) throw error;
  return data;
}

/**
 * Get pending tours (admin dashboard) using RPC
 */
export async function getPendingTours() {
  const { data, error } = await supabase
    .rpc('get_pending_tours');

  if (error) throw error;
  return data;
}

/**
 * Real-time subscription for tours
 */
export function useRealtimeTours() {
  const [tours, setTours] = useState<Tour[]>([]);

  useEffect(() => {
    // Initial fetch
    const fetchInitial = async () => {
      const { data } = await supabase
        .from('tours')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      
      if (data) setTours(data);
    };

    fetchInitial();

    // Subscribe to changes
    const channel = supabase
      .channel('tours-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tours',
          filter: 'status=eq.approved'
        },
        (payload) => {
          console.log('Tour changed:', payload);
          
          if (payload.eventType === 'INSERT') {
            setTours(prev => [payload.new as Tour, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setTours(prev => prev.map(t => 
              t.id === (payload.new as Tour).id ? payload.new as Tour : t
            ));
          } else if (payload.eventType === 'DELETE') {
            setTours(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return tours;
}
