import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AnalyticsPhase = 'phase1' | 'phase2' | 'phase3';

export function useAnalyticsPhase() {
  return useQuery({
    queryKey: ['analytics-display-phase'],
    queryFn: async () => {
      const { data } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'analytics_display_phase')
        .maybeSingle();
      return (data?.setting_value as AnalyticsPhase) || 'phase1';
    },
    staleTime: 5 * 60 * 1000,
  });
}
