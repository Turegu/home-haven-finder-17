import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useCompanyId() {
  return useQuery({
    queryKey: ["company-id-for-owner"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("companies")
        .select("id, name, credit_balance, membership, logo_url, package_end_date, profile_classification, boost_end_date")
        .eq("owner_user_id", user.id)
        .limit(1)
        .maybeSingle();
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
