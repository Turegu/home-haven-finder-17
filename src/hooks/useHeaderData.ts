import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Shared auth state hook — cached, no refetch on every mount
export function useCurrentUser() {
  const [userId, setUserId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Use getSession (reads from memory/localStorage) instead of getUser (network call)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (!uid) {
        queryClient.removeQueries({ queryKey: ['header-profile'] });
        queryClient.removeQueries({ queryKey: ['header-counts'] });
        queryClient.removeQueries({ queryKey: ['header-notifications'] });
        queryClient.removeQueries({ queryKey: ['header-saved-items'] });
        queryClient.removeQueries({ queryKey: ['header-compare-items'] });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data: profile } = useQuery({
    queryKey: ['header-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, first_name')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Also get email from session (no extra network call)
  const [email, setEmail] = useState('');
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user?.email ?? '');
    });
  }, [userId]);

  if (!userId) return null;
  return {
    id: userId,
    email,
    displayName: profile?.display_name || profile?.first_name || email?.split('@')[0] || 'User',
  };
}

export function useHeaderCounts(userId: string | undefined) {
  return useQuery({
    queryKey: ['header-counts', userId],
    queryFn: async () => {
      if (!userId) return { savedProperties: 0, savedSearches: 0, compare: 0, followedAgents: 0 };
      const [sp, ss, cmp, fa] = await Promise.all([
        supabase.from('saved_properties').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('saved_searches').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('property_comparisons').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('agent_followers').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      ]);
      return {
        savedProperties: sp.count ?? 0,
        savedSearches: ss.count ?? 0,
        compare: cmp.count ?? 0,
        followedAgents: fa.count ?? 0,
      };
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useHeaderNotifications(userId: string | undefined) {
  return useQuery({
    queryKey: ['header-notifications', userId],
    queryFn: async () => {
      if (!userId) return { items: [], unreadCount: 0 };
      const { data, count } = await supabase
        .from('user_notifications')
        .select('id, title, message, notification_type, is_read, created_at, source_company_id, property_id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);
      return { items: data || [], unreadCount: count || 0 };
    },
    enabled: !!userId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

function mapItems(data: any[] | null) {
  return (data || []).map((d: any) => ({
    id: d.id,
    property_id: d.property_id,
    title: d.properties?.title || 'Property',
    price: d.properties?.price,
    currency: d.properties?.currency,
    images: d.properties?.images,
    location: d.properties?.location,
    created_at: d.created_at,
  }));
}

export function useHeaderSavedItems(userId: string | undefined) {
  return useQuery({
    queryKey: ['header-saved-items', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('saved_properties')
        .select('id, property_id, created_at, properties:property_id(title, price, currency, images, location)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      return mapItems(data);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

export function useHeaderCompareItems(userId: string | undefined) {
  return useQuery({
    queryKey: ['header-compare-items', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data } = await supabase
        .from('property_comparisons')
        .select('id, property_id, created_at, properties:property_id(title, price, currency, images, location)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);
      return mapItems(data);
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Hook to invalidate header data (call after property actions)
export function useInvalidateHeaderData() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['header-counts'] });
    queryClient.invalidateQueries({ queryKey: ['header-saved-items'] });
    queryClient.invalidateQueries({ queryKey: ['header-compare-items'] });
  }, [queryClient]);
}
