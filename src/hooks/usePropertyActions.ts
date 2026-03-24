// Performance-optimized property action hooks
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MAX_COMPARE = 3;

// ─── Cached auth helper ───
let cachedUserId: string | null = null;
let userIdPromise: Promise<string | null> | null = null;

async function getCurrentUserId(): Promise<string | null> {
  if (cachedUserId) return cachedUserId;
  if (userIdPromise) return userIdPromise;
  userIdPromise = supabase.auth.getUser().then(({ data: { user } }) => {
    cachedUserId = user?.id ?? null;
    userIdPromise = null;
    return cachedUserId;
  });
  return userIdPromise;
}

// Clear cache on auth state change
supabase.auth.onAuthStateChange(() => {
  cachedUserId = null;
  userIdPromise = null;
});

// ─── Batch hooks: fetch ALL saved/compared IDs once per user session ───

export function useSavedPropertyIds() {
  return useQuery({
    queryKey: ['saved-property-ids'],
    queryFn: async () => {
      const uid = await getCurrentUserId();
      if (!uid) return new Set<string>();
      const { data } = await supabase
        .from('saved_properties')
        .select('property_id')
        .eq('user_id', uid);
      return new Set((data ?? []).map(d => d.property_id));
    },
    staleTime: 30_000,
  });
}

export function useComparedPropertyIds() {
  return useQuery({
    queryKey: ['compared-property-ids'],
    queryFn: async () => {
      const uid = await getCurrentUserId();
      if (!uid) return new Set<string>();
      const { data } = await supabase
        .from('property_comparisons')
        .select('property_id')
        .eq('user_id', uid);
      return new Set((data ?? []).map(d => d.property_id));
    },
    staleTime: 30_000,
  });
}

// ─── Toggle actions (kept for backward compat, now invalidate batch queries) ───

export async function toggleSaveProperty(propertyId: string, queryClient?: ReturnType<typeof useQueryClient>): Promise<boolean | null> {
  const uid = await getCurrentUserId();
  if (!uid) { window.dispatchEvent(new Event('auth-prompt-open')); return null; }

  const { data: existing } = await supabase
    .from('saved_properties')
    .select('id')
    .eq('user_id', uid)
    .eq('property_id', propertyId)
    .maybeSingle();

  if (existing) {
    await supabase.from('saved_properties').delete().eq('id', existing.id);
    toast.success('Removed from saved properties');
  } else {
    const { error } = await supabase.from('saved_properties').insert({ user_id: uid, property_id: propertyId });
    if (error) { toast.error('Failed to save property'); return null; }
    toast.success('Property saved!');
  }

  // Invalidate batch queries + header counts
  queryClient?.invalidateQueries({ queryKey: ['saved-property-ids'] });
  window.dispatchEvent(new Event('property-actions-changed'));
  return !existing;
}

export async function toggleCompareProperty(propertyId: string, queryClient?: ReturnType<typeof useQueryClient>): Promise<boolean | null> {
  const uid = await getCurrentUserId();
  if (!uid) { window.dispatchEvent(new Event('auth-prompt-open')); return null; }

  const { data: existing } = await supabase
    .from('property_comparisons')
    .select('id')
    .eq('user_id', uid)
    .eq('property_id', propertyId)
    .maybeSingle();

  if (existing) {
    await supabase.from('property_comparisons').delete().eq('id', existing.id);
    toast.success('Removed from compare list');
  } else {
    const { count } = await supabase
      .from('property_comparisons')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid);

    if ((count ?? 0) >= MAX_COMPARE) {
      toast.error(`Maximum ${MAX_COMPARE} properties can be compared. Remove one first.`);
      return null;
    }

    const { error } = await supabase.from('property_comparisons').insert({ user_id: uid, property_id: propertyId });
    if (error) { toast.error('Failed to add to compare'); return null; }
    toast.success('Added to compare list!');
  }

  queryClient?.invalidateQueries({ queryKey: ['compared-property-ids'] });
  window.dispatchEvent(new Event('property-actions-changed'));
  return !existing;
}

// ─── Legacy compat — now deprecated, use batch hooks instead ───
export async function checkIfSaved(propertyId: string): Promise<boolean> {
  const uid = await getCurrentUserId();
  if (!uid) return false;
  const { data } = await supabase
    .from('saved_properties')
    .select('id')
    .eq('user_id', uid)
    .eq('property_id', propertyId)
    .maybeSingle();
  return !!data;
}

export async function checkIfCompared(propertyId: string): Promise<boolean> {
  const uid = await getCurrentUserId();
  if (!uid) return false;
  const { data } = await supabase
    .from('property_comparisons')
    .select('id')
    .eq('user_id', uid)
    .eq('property_id', propertyId)
    .maybeSingle();
  return !!data;
}
