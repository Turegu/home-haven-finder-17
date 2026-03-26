import { supabase } from '@/integrations/supabase/client';

export const companiesService = {
  async getById(id: string) {
    return supabase.from('companies').select('*').eq('id', id).maybeSingle();
  },
  async getByOwner(userId: string) {
    return supabase.from('companies').select('id, name, membership, credit_balance').eq('owner_user_id', userId).limit(1).maybeSingle();
  },
  async update(id: string, updates: Record<string, unknown>) {
    return supabase.from('companies').update(updates).eq('id', id);
  },
};
