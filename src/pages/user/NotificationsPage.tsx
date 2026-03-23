import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import UserLayout from "@/components/user/UserLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface UserNotification {
  id: string;
  title: string;
  message: string | null;
  notification_type: string;
  is_read: boolean;
  created_at: string;
}

const PAGE_SIZE = 15;

const NotificationsPage = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) { setLoading(false); return; }
        const { data } = await supabase
          .from("user_notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(200);
        setItems((data || []) as UserNotification[]);
        setLoading(false);

        if (data && data.length > 0) {
          const unread = data.filter((n: any) => !n.is_read).map((n: any) => n.id);
          if (unread.length > 0) {
            await supabase.from("user_notifications").update({ is_read: true }).in("id", unread);
          }
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t('userPages.notifications')}</h1>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-start gap-3">
                <Skeleton className="h-4 w-4 rounded-full mt-1 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground">{t('userPages.noNotifications')}</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paginatedItems.map(item => (
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
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </UserLayout>
  );
};

export default NotificationsPage;
