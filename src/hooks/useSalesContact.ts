import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSalesContact = () => {
  const { data } = useQuery({
    queryKey: ["sales-contact"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["sales_whatsapp", "sales_phone"]);
      const map: Record<string, string> = {};
      (data || []).forEach((s) => { map[s.setting_key] = s.setting_value; });
      return map;
    },
    staleTime: 10 * 60 * 1000,
  });

  const whatsapp = data?.sales_whatsapp || data?.sales_phone || "";

  const openSalesWhatsApp = (message = "Hello, I'd like to inquire about credits and packages.") => {
    if (!whatsapp) return;
    const clean = whatsapp.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return { salesWhatsApp: whatsapp, openSalesWhatsApp };
};
