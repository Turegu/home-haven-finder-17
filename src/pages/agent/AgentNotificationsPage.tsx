import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import AgentLayout from "@/components/agent/AgentLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bell, CheckCheck, Trash2 } from "lucide-react";

const AgentNotificationsPage = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: agent } = await supabase.from("agents").select("company_id").eq("user_id", user.id).limit(1).maybeSingle();
      if (agent) {
        setCompanyId(agent.company_id);
        fetchNotifications(agent.company_id);
      }
    };
    init();
  }, []);

  const fetchNotifications = async (cId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("company_notifications")
      .select("*")
      .eq("company_id", cId)
      .order("created_at", { ascending: false });
    setNotifications(data || []);
    setLoading(false);
  };

  const typeEmoji = (t: string) => {
    switch (t) {
      case "package_update": return "📦";
      case "follow": return "👤";
      case "unfollow": return "👋";
      case "expiry_warning": return "⚠️";
      default: return "🔔";
    }
  };

  if (loading) {
    return <AgentLayout><div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div></AgentLayout>;
  }

  return (
    <AgentLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {notifications.map((n) => (
            <div key={n.id} className={`bg-card rounded-lg border border-border p-4 flex items-start gap-3 ${!n.is_read ? "border-l-4 border-l-primary" : ""}`}>
              <span className="text-xl mt-0.5">{typeEmoji(n.notification_type)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground text-sm">{n.title}</h3>
                  {!n.is_read && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full font-medium">New</span>}
                </div>
                {n.message && <p className="text-sm text-muted-foreground mt-1">{n.message}</p>}
                <p className="text-xs text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </AgentLayout>
  );
};

export default AgentNotificationsPage;
