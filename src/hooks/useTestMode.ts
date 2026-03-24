import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addMonths, addMinutes } from "date-fns";

export const useTestMode = () => {
  const queryClient = useQueryClient();

  const { data: isTestMode = false } = useQuery({
    queryKey: ["admin-test-mode"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "global_test_mode")
        .maybeSingle();
      return data?.setting_value === "true";
    },
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data: existing } = await supabase
        .from("admin_settings")
        .select("id")
        .eq("setting_key", "global_test_mode")
        .maybeSingle();

      if (existing) {
        await supabase
          .from("admin_settings")
          .update({ setting_value: String(enabled) })
          .eq("setting_key", "global_test_mode");
      } else {
        await supabase
          .from("admin_settings")
          .insert({ setting_key: "global_test_mode", setting_value: String(enabled) });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-test-mode"] });
    },
  });

  return { isTestMode, toggleTestMode: toggleMutation.mutate };
};

/**
 * Converts a month-based duration to the appropriate future date.
 * In test mode, months become minutes.
 */
export const getTestAwareEndDate = (months: number, isTestMode: boolean): string => {
  const now = new Date();
  if (isTestMode) {
    return addMinutes(now, months).toISOString();
  }
  return addMonths(now, months).toISOString();
};

/**
 * Returns a human-readable label for the duration.
 */
export const getTestAwareDurationLabel = (months: number, isTestMode: boolean): string => {
  if (isTestMode) {
    return `${months} minute${months !== 1 ? "s" : ""} (test)`;
  }
  return `${months} month${months !== 1 ? "s" : ""}`;
};
