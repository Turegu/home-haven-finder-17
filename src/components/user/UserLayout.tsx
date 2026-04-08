import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  Settings, UserCircle, Heart, Search, Layers, Bell,
  MessageSquare, FileText, Users2, LogOut, Menu, Home, Megaphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import DashboardSidebarHeader from "@/components/DashboardSidebarHeader";

interface UserLayoutProps {
  children: React.ReactNode;
}

const UserLayout = ({ children }: UserLayoutProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarLinks = [
    { label: t("userMenu.dashboard"), path: "/account", icon: Home, countKey: null },
    { label: t("userMenu.accountSettings"), path: "/account/settings", icon: Settings, countKey: null },
    { label: t("userMenu.followedAgents"), path: "/account/followed-agents", icon: Users2, countKey: "followed" },
    { label: t("userMenu.announcements", "Announcements"), path: "/account/announcements", icon: Megaphone, countKey: null },
    { label: t("userMenu.savedProperties"), path: "/account/saved-properties", icon: Heart, countKey: "saved" },
    { label: t("userMenu.savedSearches"), path: "/account/saved-searches", icon: Search, countKey: "searches" },
    { label: t("userMenu.compareList"), path: "/account/compare", icon: Layers, countKey: "compare" },
    { label: t("userMenu.notifications"), path: "/account/notifications", icon: Bell, countKey: "notifications" },
    { label: t("userMenu.contactedProperties"), path: "/account/contacted", icon: MessageSquare, countKey: "contacted" },
    { label: t("userMenu.propertyRequests"), path: "/account/requests", icon: FileText, countKey: "requests" },
  ];

  const { data: authUser } = useQuery({
    queryKey: ['user-layout-auth'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/login");
        return null;
      }
      return session.user;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const { data: profile } = useQuery({
    queryKey: ['user-layout-profile', authUser?.id],
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

  const displayName = profile?.display_name || profile?.first_name || authUser?.email || "User";

  const { data: counts = {} } = useQuery({
    queryKey: ['user-layout-counts', authUser?.id],
    queryFn: async () => {
      const uid = authUser!.id;
      const [saved, searches, compare, followedAgents, followedCompanies, notifications, contacted, requests] = await Promise.all([
        supabase.from("saved_properties").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("saved_searches").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("property_comparisons").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("agent_followers").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("company_followers").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("user_notifications").select("id", { count: "exact", head: true }).eq("user_id", uid).eq("is_read", false),
        supabase.from("user_inquiries").select("id", { count: "exact", head: true }).eq("user_id", uid),
        supabase.from("property_requests").select("id", { count: "exact", head: true }).eq("user_id", uid),
      ]);
      return {
        saved: saved.count || 0,
        searches: searches.count || 0,
        compare: compare.count || 0,
        followed: (followedAgents.count || 0) + (followedCompanies.count || 0),
        notifications: notifications.count || 0,
        contacted: contacted.count || 0,
        requests: requests.count || 0,
      } as Record<string, number>;
    },
    enabled: !!authUser?.id,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    toast.success(t("nav.logout"));
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-border">
          <div className="mb-3">
            <DashboardSidebarHeader brandPath="/account" />
          </div>
          <p className="text-xs text-muted-foreground truncate">{displayName}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sidebarLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const count = link.countKey ? counts[link.countKey] || 0 : 0;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{link.label}</span>
                {link.countKey && count > 0 && (
                  <span className={`text-[10px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5 ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/15 text-primary"
                  }`}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t("nav.logout")}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold text-foreground">{t("dashboard.myAccount")}</span>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default UserLayout;