import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAllowedCountry() {
  return useQuery({
    queryKey: ['allowed-country'],
    queryFn: async () => {
      const { data } = await supabase
        .from('location_settings')
        .select('setting_value')
        .eq('setting_key', 'allowed_country')
        .maybeSingle();
      return data?.setting_value || 'Turkey';
    },
    staleTime: 30 * 60 * 1000, // 30 min cache
  });
}
