import { supabase } from "@/integrations/supabase/client";
import { Sentry } from "@/lib/sentry";

export async function logAdminAction(
  action: string,
  targetType: string,
  targetId?: string,
  oldValue?: Record<string, unknown> | null,
  newValue?: Record<string, unknown> | null
) {
  try {
    await supabase.rpc("log_admin_action", {
      p_action: action,
      p_target_type: targetType,
      p_target_id: targetId || null,
      p_old_value: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
      p_new_value: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
    });
  } catch (err) {
    // Non-blocking — don't break admin flows if audit logging fails
    console.error("Audit log failed:", err);
    Sentry.captureException(err);
  }
}
