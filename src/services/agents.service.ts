import { supabase } from '@/integrations/supabase/client';
import { AGENT_STATUS } from '@/constants/agent';

export const agentsService = {
  async getByCompany(companyId: string, ascending = false) {
    return supabase.from('agents')
      .select('id, name, email, phone, status, credit_balance, created_at, profile_classification, boost_end_date, downgraded_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending });
  },
  async getPublicById(id: string) {
    return supabase.from('agents')
      .select('id, name, name_ar, name_fr, designation, designation_ar, designation_fr, avatar_url, description, description_ar, description_fr, languages, service_areas, phone, email, whatsapp, company_id, companies(id, name, name_ar, logo_url, company_types, cover_url, is_verified)')
      .eq('id', id)
      .eq('status', AGENT_STATUS.ACTIVE)
      .maybeSingle();
  },
  async softDeactivate(agentId: string) {
    return supabase.from('agents')
      .update({ status: AGENT_STATUS.INACTIVE, downgraded_at: new Date().toISOString() })
      .eq('id', agentId);
  },
  async updateStatus(agentId: string, status: string) {
    return supabase.from('agents').update({ status }).eq('id', agentId);
  },
};
