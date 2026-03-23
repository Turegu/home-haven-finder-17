import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import UserLayout from "@/components/user/UserLayout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Heart, Search, Layers, Bell, MessageSquare, FileText, Users2,
  ArrowRight, TrendingUp
} from "lucide-react";
import { format } from "date-fns";

const UserDashboardPage = () => {
  const { t } = useTranslation();

  const statCards = [
    { label: t('dashboard.savedProperties'), icon: Heart, countKey: "saved", path: "/account/saved-properties", color: "text-rose-500", bg: "bg-rose-500/10" },
    { label: t('dashboard.followedAgents'), icon: Users2, countKey: "followed", path: "/account/followed-agents", color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: t('dashboard.compareList'), icon: Layers, countKey: "compare", path: "/account/compare", color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: t('dashboard.savedSearches'), icon: Search, countKey: "searches", path: "/account/saved-searches", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: t('dashboard.notifications'), icon: Bell, countKey: "notifications", path: "/account/notifications", color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: t('dashboard.inquiriesSent'), icon: MessageSquare, countKey: "contacted", path: "/account/contacted", color: "text-cyan-500", bg: "bg-cyan-500/10" },
  ];
  const { data: authUser } = useQuery({
    queryKey: ['user-dash-auth'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.user || null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: profile } = useQuery({
    queryKey: ['user-dash-profile', authUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, first_name, last_name")
        .eq("user_id", authUser!.id)
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!authUser?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: counts, isLoading: countsLoading } = useQuery({
    queryKey: ['user-layout-counts', authUser?.id],
    queryFn: async () => {
      const uid = authUser!.id;
      const [saved, searches, compare, followed, notifications, contacted] = await Promise.all([
        supabase.from("saved_properties").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("saved_searches").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("property_comparisons").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("agent_followers").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("user_notifications").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("is_read", false),
        supabase.from("user_inquiries").select("id", { count: "exact", head: true }).eq("user_id", uid),
      ]);
      return {
        saved: saved.count || 0, searches: searches.count || 0,
        compare: compare.count || 0, followed: followed.count || 0,
        notifications: notifications.count || 0, contacted: contacted.count || 0,
      } as Record<string, number>;
    },
    enabled: !!authUser?.id,
    staleTime: 2 * 60 * 1000,
  });

  const { data: recentNotifications = [], isLoading: notifLoading } = useQuery({
    queryKey: ['user-dash-recent-notif', authUser?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_notifications")
        .select("id, title, message, created_at, is_read")
        .eq("user_id", authUser!.id)
        .order("created_at", { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!authUser?.id,
    staleTime: 2 * 60 * 1000,
  });

  const displayName = profile?.display_name || profile?.first_name || "there";

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-6 border border-primary/10">
          <h1 className="text-2xl font-bold text-foreground">
            {t('dashboard.welcomeBack', { name: displayName })}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {t('dashboard.quickOverview')}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((card) => (
            <Link
              key={card.countKey}
              to={card.path}
              className="bg-card rounded-xl border border-border p-4 hover:shadow-md hover:border-primary/30 transition-all group"
            >
              <div className={`h-10 w-10 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              {countsLoading ? (
                <Skeleton className="h-8 w-12 mb-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">
                  {counts?.[card.countKey] ?? 0}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5 group-hover:text-foreground transition-colors">{card.label}</p>
            </Link>
          ))}
        </div>

        {/* Quick Actions + Recent Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link to="/buy" className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Browse Properties</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
              <Link to="/projects" className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                <div className="flex items-center gap-3">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Explore Projects</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
              <Link to="/property-request" className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Submit Property Request</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
              <Link to="/agents" className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
                <div className="flex items-center gap-3">
                  <Users2 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Find Agents</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </div>
          </div>

          {/* Recent Notifications */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Recent Notifications</h2>
              <Link to="/account/notifications" className="text-xs text-primary hover:underline">View All</Link>
            </div>
            {notifLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentNotifications.map((n: any) => (
                  <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg ${!n.is_read ? 'bg-primary/5' : 'bg-muted/30'}`}>
                    <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${!n.is_read ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(n.created_at), "MMM dd, yyyy")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default UserDashboardPage;
