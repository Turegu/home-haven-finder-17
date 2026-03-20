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
        .maybeSingle();
      return (data?.setting_value as MapProvider) || "google";
    },
    staleTime: 10 * 60 * 1000, // 10 min — rarely changes
    gcTime: 30 * 60 * 1000,
  });
}
