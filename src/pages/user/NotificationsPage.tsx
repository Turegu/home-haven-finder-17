import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import UserLayout from "@/components/user/UserLayout";
import { Bell } from "lucide-react";
import { format } from "date-fns";

interface UserNotification {
  id: string;
  title: string;
  message: string | null;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

const NotificationsPage = () => {
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setItems((data || []) as UserNotification[]);
      setLoading(false);

      // Mark all as read
      if (data && data.length > 0) {
        const unread = data.filter((n: any) => !n.is_read).map((n: any) => n.id);
        if (unread.length > 0) {
          await supabase.from("user_notifications").update({ is_read: true }).in("id", unread);
        }
      }
    };
    load();
  }, []);

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications found.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className={`bg-card rounded-xl border border-border p-4 ${!item.is_read ? "border-l-4 border-l-primary" : ""}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{item.title}</p>
                    {item.message && <p className="text-xs text-muted-foreground mt-1">{item.message}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 ml-4">{format(new Date(item.created_at), "MMM dd, yyyy")}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </UserLayout>
  );
};

export default NotificationsPage;
