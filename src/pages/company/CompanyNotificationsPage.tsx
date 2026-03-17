import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import CompanyLayout from "@/components/company/CompanyLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string | null;
  notification_type: string;
  posted_by: string | null;
  is_read: boolean;
  created_at: string;
}

const CompanyNotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: company } = await supabase
        .from("companies").select("id").eq("owner_user_id", user.id).limit(1).maybeSingle();
      if (company) setCompanyId(company.id);
    };
    init();
  }, []);

  const fetchNotifications = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("company_notifications")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load notifications");
    else setNotifications((data as Notification[]) || []);
    setLoading(false);
  };

  useEffect(() => { if (companyId) fetchNotifications(); }, [companyId]);

  // Realtime subscription
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel("company-notifications")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "company_notifications",
        filter: `company_id=eq.${companyId}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId]);

  const markAsRead = async (id: string) => {
    await supabase.from("company_notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!companyId) return;
    await supabase.from("company_notifications").update({ is_read: true }).eq("company_id", companyId).eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    toast.success("All notifications marked as read");
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("company_notifications").delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const typeIcon = (type: string) => {
    switch (type) {
      case "package": return "📦";
      case "follow": return "👤";
      case "unfollow": return "👤";
      case "expiry": return "⏰";
      default: return "🔔";
    }
  };

  return (
    <CompanyLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">{unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <Check className="h-4 w-4 mr-2" /> Mark All Read
          </Button>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-4 p-4 hover:bg-muted/30 transition-colors ${!notif.is_read ? "bg-primary/5" : ""}`}
              >
                <span className="text-xl mt-0.5">{typeIcon(notif.notification_type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm ${!notif.is_read ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <Badge className="bg-primary/20 text-primary text-[10px] px-1.5 py-0" variant="secondary">New</Badge>
                    )}
                  </div>
                  {notif.message && <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>}
                  <div className="flex items-center gap-3 mt-1.5">
                    {notif.posted_by && (
                      <span className="text-xs text-muted-foreground">Posted By: {notif.posted_by}</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(notif.created_at), "do MMM yyyy hh:mm a")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!notif.is_read && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markAsRead(notif.id)} title="Mark as read">
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteNotification(notif.id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </CompanyLayout>
  );
};

export default CompanyNotificationsPage;
