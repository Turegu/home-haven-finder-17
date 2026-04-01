import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAgentIdentity() {
  return useQuery({
    queryKey: ["agent-identity"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("agents")
        .select("id, name, avatar_url, company_id, credit_balance, profile_classification, boost_end_date")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
