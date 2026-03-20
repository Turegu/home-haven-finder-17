import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MapProvider = "google" | "leaflet";

export function useMapProvider() {
  return useQuery({
    queryKey: ["map-provider"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "map_provider")
        .limit(1);
      return ((data?.[0] as any)?.setting_value as MapProvider) || "google";
    },
    staleTime: 5 * 60 * 1000,
  });
}
