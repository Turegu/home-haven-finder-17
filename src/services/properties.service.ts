import { supabase } from '@/integrations/supabase/client';

export const propertiesService = {
  async getByAgent(agentId: string, filters?: Record<string, unknown>) {
    let query = supabase.from('properties')
      .select('*, agents(name, avatar_url), companies(name, logo_url)')
      .eq('agent_id', agentId)
      .eq('status', 'active')
      .limit(50);
    if (filters?.purpose && filters.purpose !== 'all') query = query.eq('property_purpose', filters.purpose as string);
    if (filters?.propertyType && filters.propertyType !== 'all') query = query.eq('property_type', filters.propertyType as string);
    if (filters?.rooms && filters.rooms !== 'all') query = query.eq('rooms', filters.rooms as string);
    if (filters?.minPrice) query = query.gte('price', Number(filters.minPrice));
    if (filters?.maxPrice) query = query.lte('price', Number(filters.maxPrice));
    return query.order('created_at', { ascending: false });
  },
  async getById(id: string) {
    return supabase.from('properties').select('*, agents(*), companies(*)').eq('id', id).maybeSingle();
  },
};
