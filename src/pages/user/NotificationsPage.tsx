import { useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import UserLayout from "@/components/user/UserLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bell, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

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
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data: items = [], isLoading: loading } = useQuery({
    queryKey: ['user-notifications-page'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return [];
      const { data } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      const notifications = (data || []) as UserNotification[];

      // Mark unread as read (fire-and-forget)
      const unread = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unread.length > 0) {
        supabase.from("user_notifications").update({ is_read: true }).in("id", unread).then(() => {});
      }

      return notifications;
    },
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("user_notifications").delete().eq("id", id);
    if (error) { toast.error(t('userPages.failedToDelete')); return; }
    queryClient.setQueryData<UserNotification[]>(['user-notifications-page'], old => (old ?? []).filter(i => i.id !== id));
    queryClient.invalidateQueries({ queryKey: ['user-layout-counts'] });
    toast.success(t('userPages.notificationDeleted'));
  };

  const handleClearAll = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { error } = await supabase.from("user_notifications").delete().eq("user_id", session.user.id);
    if (error) { toast.error(t('userPages.failedToDelete')); return; }
    queryClient.setQueryData<UserNotification[]>(['user-notifications-page'], []);
    queryClient.invalidateQueries({ queryKey: ['user-layout-counts'] });
    toast.success(t('userPages.allCleared'));
    setPage(1);
  };

  const totalPages = Math.ceil(items.length / PAGE_SIZE);
  const paginatedItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">{t('userPages.notifications')}</h1>
          {items.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  {t('userPages.deleteAll')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('userPages.deleteAll')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('userPages.clearAllConfirm')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('common.delete')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
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
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{item.title}</p>
                      {item.message && <p className="text-xs text-muted-foreground mt-1">{item.message}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <span className="text-xs text-muted-foreground">{format(new Date(item.created_at), "MMM dd, yyyy")}</span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('userPages.deleteNotification')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('userPages.deleteNotificationConfirm')}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('common.delete')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{t('userPages.page')} {page} {t('common.of')} {totalPages}</span>
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
