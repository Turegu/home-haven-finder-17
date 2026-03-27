import { supabase } from '@/integrations/supabase/client';
import { type InboxType } from '@/constants/inbox';

export const inboxService = {
  async getByCompany(companyId: string, inboxType: InboxType) {
    return supabase.from('company_inbox')
      .select('*')
      .eq('company_id', companyId)
      .eq('inbox_type', inboxType)
      .order('created_at', { ascending: false });
  },
  async markSeen(id: string) {
    return supabase.from('company_inbox').update({ is_seen: true, responded_at: new Date().toISOString() } as any).eq('id', id);
  },
  async deleteMany(ids: string[]) {
    return supabase.from('company_inbox').delete().in('id', ids);
  },
  async submitMessage(params: {
    company_id: string;
    full_name: string;
    email: string;
    agent_id?: string | null;
    phone?: string | null;
    message: string;
    inbox_type: InboxType;
    property_id?: string | null;
    project_id?: string | null;
  }) {
    return (supabase as any).rpc('submit_company_inbox_message', {
      p_company_id: params.company_id,
      p_full_name: params.full_name,
      p_email: params.email,
      p_agent_id: params.agent_id ?? null,
      p_phone: params.phone ?? null,
      p_message: params.message,
      p_inbox_type: params.inbox_type,
      p_property_id: params.property_id ?? null,
      p_project_id: params.project_id ?? null,
    });
  },
};
