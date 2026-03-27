import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Building2, FolderKanban, Calendar,
  UserCircle, Mail, LogOut, Menu, Users2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import DashboardSidebarHeader from "@/components/DashboardSidebarHeader";

interface AgentLayoutProps {
  children: React.ReactNode;
}

const AgentLayout = ({ children }: AgentLayoutProps) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: agentData } = useQuery({
    queryKey: ['agent-layout-auth'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/agent/login");
        return null;
      }
      const { data: agent } = await supabase
        .from("agents")
        .select("id, name, avatar_url, company_id")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();
      if (!agent) {
        await supabase.auth.signOut();
        toast.error(t("agentDashboard.noAgentFound"));
        navigate("/agent/login");
        return null;
      }
      return agent;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const agentId = agentData?.id || null;
  const companyId = agentData?.company_id || null;
  const agentName = agentData?.name || "";
  const agentAvatar = agentData?.avatar_url || null;

  // Unseen inbox count (agent's assigned items across all tabs)
  const { data: inboxUnseenCount } = useQuery({
    queryKey: ['agent-sidebar-inbox-unseen', agentId],
    queryFn: async () => {
      if (!agentId) return 0;
      const { count } = await supabase
        .from("company_inbox")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", agentId)
        .eq("is_seen", false);
      return count || 0;
    },
    enabled: !!agentId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // New followers in last 7 days (company followers visible to agent)
  const { data: newFollowersCount } = useQuery({
    queryKey: ['agent-sidebar-new-followers', companyId],
    queryFn: async () => {
      if (!companyId) return 0;
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("company_followers")
        .select("*", { count: "exact", head: true })
        .eq("company_id", companyId)
        .gte("created_at", sevenDaysAgo);
      return count || 0;
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const mainLinks = [
    { label: t("agentDashboard.dashboard"), path: "/agent", icon: LayoutDashboard, badge: 0 },
    { label: t("agentDashboard.properties"), path: "/agent/properties", icon: Building2, badge: 0 },
    { label: t("agentDashboard.projects"), path: "/agent/projects", icon: FolderKanban, badge: 0 },
    { label: t("agentDashboard.events"), path: "/agent/events", icon: Calendar, badge: 0 },
    { label: t("agentDashboard.followers"), path: "/agent/followers", icon: Users2, badge: newFollowersCount || 0 },
    { label: t("agentDashboard.inbox"), path: "/agent/inbox", icon: Mail, badge: inboxUnseenCount || 0 },
  ];

  const settingsLink = { label: t("agentDashboard.profileSettings"), path: "/agent/profile", icon: UserCircle, badge: 0 };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/agent/login");
    toast.success(t("agentDashboard.logout"));
  };

  const renderLink = (link: typeof settingsLink) => {
    const isActive = location.pathname === link.path;
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
        {link.badge > 0 && (
          <span className={`min-w-[20px] h-5 flex items-center justify-center rounded-full text-[11px] font-bold px-1.5 ${
            isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground"
          }`}>
            {link.badge > 99 ? "99+" : link.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-muted/30 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-border">
          <div className="mb-3">
            <DashboardSidebarHeader brandPath="/agent" />
          </div>
          <div className="flex items-center gap-3">
            {agentAvatar ? (
              <img src={agentAvatar} alt={agentName} className="h-9 w-9 rounded-lg object-cover border border-border" />
            ) : (
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                {agentName?.charAt(0) || "A"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{agentName}</p>
              <p className="text-xs text-muted-foreground">{t("agentDashboard.agent")}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30">
          {mainLinks.map(renderLink)}
          <Separator className="my-2" />
          {renderLink(settingsLink)}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 w-full transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {t("agentDashboard.logout")}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold text-foreground">{t("agentDashboard.portal")}</span>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AgentLayout;
